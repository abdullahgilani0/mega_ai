<?php

namespace App\Services\Documents;

use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Models\Application;
use App\Models\Document;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\Vendors\Contracts\DocumentExtractor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentIntake
{
    private const MIN_CONFIDENCE = 0.85;

    public function __construct(
        private DocumentExtractor $extractor,
        private AuthenticityAnalyser $authenticity,
        private ApplicationTimeline $timeline,
        private AuditLogger $audit,
    ) {}

    public function store(Application $application, UploadedFile $file, DocumentKind $kind): Document
    {
        $path = $file->store('applications/'.$application->public_id, 'local');

        $document = $application->documents()->create([
            'kind' => $kind,
            'original_name' => mb_substr($file->getClientOriginalName(), 0, 200),
            'storage_path' => $path,
            'sha256' => hash_file('sha256', $file->getRealPath()),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'status' => DocumentStatus::Reading,
        ]);

        $this->timeline->record($application, 'documents.reading', ['document_id' => $document->id, 'kind' => $kind->value]);
        $this->audit->record('document.uploaded', $document, after: ['kind' => $kind->value, 'sha256' => $document->sha256]);

        $this->process($application, $document);

        return $document;
    }

    private function process(Application $application, Document $document): void
    {
        $contents = (string) Storage::disk('local')->get($document->storage_path);

        if ($problem = $this->qualityProblem($document)) {
            $document->update(['status' => DocumentStatus::NeedsAttention, 'attention_reason' => $problem, 'quality_score' => 20]);
            $this->timeline->record($application, 'documents.needs_attention', ['document_id' => $document->id]);

            return;
        }

        $fields = $this->extractor->extract($document, $contents);
        foreach ($fields as $field => $extraction) {
            if ($extraction['confidence'] >= self::MIN_CONFIDENCE && $application->fact($field) === null) {
                $application->setFact($field, $extraction['value'], 'document:'.$document->id);
            }
        }
        $application->save();

        $analysis = $this->authenticity->analyse($document, $contents);
        $report = $document->authenticityReport()->create([
            'score' => $analysis['score'],
            'reason_codes' => $analysis['reasons'],
        ]);

        $document->update([
            'status' => $report->isFlagged() ? DocumentStatus::InReview : DocumentStatus::Verified,
            'quality_score' => 90,
            'extracted' => $fields,
        ]);

        $this->timeline->record($application, 'documents.read', ['document_id' => $document->id, 'fields' => count($fields)]);
    }

    private function qualityProblem(Document $document): ?string
    {
        if (str_starts_with($document->mime_type, 'image/') && $document->size_bytes < 30 * 1024) {
            return 'This photo is too small to read. Retake it in good light, filling the frame.';
        }

        if ($document->mime_type === 'application/pdf' && $document->size_bytes < 1024) {
            return 'This file looks empty. Upload the full document.';
        }

        return null;
    }
}
