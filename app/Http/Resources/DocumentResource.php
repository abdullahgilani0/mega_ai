<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Borrower- and broker-facing document. Deliberately carries no authenticity data.
 *
 * @mixin Document
 */
class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind->value,
            'kindLabel' => $this->kind->label(),
            'name' => $this->original_name,
            'status' => $this->status->value,
            'attentionReason' => $this->attention_reason,
            'sizeBytes' => $this->size_bytes,
            'uploadedAt' => $this->created_at->toIso8601String(),
        ];
    }
}
