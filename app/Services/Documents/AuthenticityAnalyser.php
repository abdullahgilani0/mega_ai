<?php

namespace App\Services\Documents;

use App\Enums\DocumentKind;
use App\Models\Document;

/**
 * Estimates whether a document was edited or generated. The output is one signal
 * among many for a human reviewer: it routes files to review and never declines.
 */
class AuthenticityAnalyser
{
    private const EDITING_TOOLS = ['photoshop', 'illustrator', 'gimp', 'canva', 'inkscape', 'pdf editor', 'pdfescape', 'sejda', 'smallpdf', 'ilovepdf', 'foxit phantom', 'nitro pro', 'pdfelement', 'affinity'];

    private const GENERATOR_MARKERS = ['dall-e', 'dall·e', 'midjourney', 'stable diffusion', 'firefly', 'c2pa', 'trainedalgorithmicmedia', 'openai'];

    /**
     * @return array{score: int, reasons: list<array{code: string, detail: string, weight: int}>}
     */
    public function analyse(Document $document, string $contents): array
    {
        $reasons = [];
        $sample = mb_strtolower(substr($contents, 0, 65536).substr($contents, -16384));

        if ($document->mime_type === 'application/pdf') {
            $reasons = [...$reasons, ...$this->pdfChecks($contents)];
        }

        foreach (self::EDITING_TOOLS as $tool) {
            if (str_contains($sample, $tool)) {
                $reasons[] = ['code' => 'metadata.editing_tool', 'detail' => "File metadata names an editing tool ({$tool}).", 'weight' => 35];
                break;
            }
        }

        foreach (self::GENERATOR_MARKERS as $marker) {
            if (str_contains($sample, $marker)) {
                $reasons[] = ['code' => 'ai.generator_marker', 'detail' => "File carries a generative-AI provenance marker ({$marker}).", 'weight' => 45];
                break;
            }
        }

        if ($document->mime_type === 'image/png' && in_array($document->kind, [DocumentKind::Payslip, DocumentKind::BankStatement], true)) {
            $reasons[] = ['code' => 'format.screenshot_likely', 'detail' => 'Financial document supplied as a PNG, typical of screenshots.', 'weight' => 10];
        }

        $duplicateElsewhere = Document::where('sha256', $document->sha256)
            ->where('application_id', '!=', $document->application_id)
            ->exists();

        if ($duplicateElsewhere) {
            $reasons[] = ['code' => 'duplicate.cross_application', 'detail' => 'An identical file was uploaded to a different application.', 'weight' => 40];
        }

        return [
            'score' => min(100, array_sum(array_column($reasons, 'weight'))),
            'reasons' => $reasons,
        ];
    }

    /**
     * @return list<array{code: string, detail: string, weight: int}>
     */
    private function pdfChecks(string $contents): array
    {
        $reasons = [];

        $revisions = substr_count($contents, '%%EOF');
        if ($revisions > 1) {
            $reasons[] = ['code' => 'structure.incremental_updates', 'detail' => "PDF was saved {$revisions} times (incremental updates after creation).", 'weight' => 20];
        }

        preg_match('/\/CreationDate\s*\(D:(\d{8})/', $contents, $created);
        preg_match('/\/ModDate\s*\(D:(\d{8})/', $contents, $modified);
        if (isset($created[1], $modified[1]) && (int) $modified[1] > (int) $created[1]) {
            $reasons[] = ['code' => 'metadata.modified_after_creation', 'detail' => "Modified on {$modified[1]}, after creation on {$created[1]}.", 'weight' => 15];
        }

        if (preg_match_all('/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([A-Za-z-]+)/', $contents, $fonts) && count(array_unique($fonts[1])) > 6) {
            $reasons[] = ['code' => 'structure.font_mismatch', 'detail' => 'Unusually many distinct embedded fonts for a statement.', 'weight' => 10];
        }

        return $reasons;
    }
}
