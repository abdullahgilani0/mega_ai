<?php

namespace App\Services\Vendors;

use App\Models\Document;
use App\Services\Vendors\Contracts\DocumentExtractor;

/**
 * Used until an OCR / Document AI provider is configured. It extracts nothing,
 * so MEGA asks the borrower instead of guessing.
 */
class NullDocumentExtractor implements DocumentExtractor
{
    public function name(): string
    {
        return 'none';
    }

    public function extract(Document $document, string $contents): array
    {
        return [];
    }
}
