<?php

use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Models\Application;
use App\Models\Document;
use App\Services\Documents\AuthenticityAnalyser;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function analysedDocument(string $contents, array $attributes = []): array
{
    $document = Document::create([
        'application_id' => Application::factory()->create()->id,
        'kind' => DocumentKind::BankStatement,
        'original_name' => 'statement.pdf',
        'storage_path' => 'x/statement.pdf',
        'sha256' => hash('sha256', $contents),
        'mime_type' => 'application/pdf',
        'size_bytes' => strlen($contents),
        'status' => DocumentStatus::Reading,
        ...$attributes,
    ]);

    return app(AuthenticityAnalyser::class)->analyse($document, $contents);
}

it('gives a clean single-revision PDF a low score', function () {
    $result = analysedDocument("%PDF-1.7\n/Producer (Bank Statement Engine 4.2)\n/CreationDate (D:20260901)\n%%EOF");

    expect($result)->toBe(['score' => 0, 'reasons' => []]);
});

it('flags an edited PDF with reasons a reviewer can check', function () {
    $result = analysedDocument("%PDF-1.7\n/Producer (Adobe Photoshop 25.0)\n/CreationDate (D:20260901)\n/ModDate (D:20261015)\n%%EOF\nupdate\n%%EOF");

    expect(array_column($result['reasons'], 'code'))->toBe([
        'structure.incremental_updates',
        'metadata.modified_after_creation',
        'metadata.editing_tool',
    ])->and($result['score'])->toBe(70);
});

it('flags the same file reused on a different application', function () {
    $contents = "%PDF-1.7\n/Producer (Bank)\n%%EOF";
    analysedDocument($contents);

    $result = analysedDocument($contents);

    expect(array_column($result['reasons'], 'code'))->toBe(['duplicate.cross_application']);
});

it('treats a generative-AI provenance marker as one signal', function () {
    $result = analysedDocument('PNGDATA c2pa.actions trainedAlgorithmicMedia', [
        'kind' => DocumentKind::Payslip,
        'mime_type' => 'image/png',
    ]);

    expect(array_column($result['reasons'], 'code'))->toBe(['ai.generator_marker', 'format.screenshot_likely'])
        ->and($result['score'])->toBe(55);
});
