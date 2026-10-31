<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;

/**
 * Staff view of a document. Authenticity data is included only for roles allowed to see it.
 *
 * @mixin Document
 */
class AdminDocumentResource extends DocumentResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $report = $this->authenticityReport;

        return [
            ...parent::toArray($request),
            'sha256' => $this->sha256,
            'mimeType' => $this->mime_type,
            'authenticity' => $this->when(
                $report !== null && $request->user()?->can('authenticity.view'),
                fn () => [
                    'id' => $report->id,
                    'score' => $report->score,
                    'flagged' => $report->isFlagged(),
                    'reasons' => $report->reason_codes,
                    'decision' => $report->decision,
                ],
            ),
        ];
    }
}
