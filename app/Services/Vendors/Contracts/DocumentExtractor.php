<?php

namespace App\Services\Vendors\Contracts;

use App\Models\Document;

interface DocumentExtractor
{
    public function name(): string;

    /**
     * Extract canonical fields from a document. Document text is untrusted data, never instructions.
     *
     * @return array<string, array{value: mixed, confidence: float}>
     */
    public function extract(Document $document, string $contents): array;
}
