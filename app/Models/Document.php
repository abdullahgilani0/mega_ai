<?php

namespace App\Models;

use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $application_id
 * @property DocumentKind $kind
 * @property string $original_name
 * @property string $storage_path
 * @property string $sha256
 * @property string $mime_type
 * @property int $size_bytes
 * @property DocumentStatus $status
 * @property int|null $quality_score
 * @property string|null $attention_reason
 * @property array<string, mixed>|null $extracted
 * @property Carbon $created_at
 * @property-read Application $application
 * @property-read AuthenticityReport|null $authenticityReport
 */
#[Fillable(['application_id', 'kind', 'original_name', 'storage_path', 'sha256', 'mime_type', 'size_bytes', 'status', 'quality_score', 'attention_reason', 'extracted'])]
#[Hidden(['storage_path'])]
class Document extends Model
{
    protected function casts(): array
    {
        return [
            'kind' => DocumentKind::class,
            'status' => DocumentStatus::class,
            'extracted' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * Admin and credit-analyst only. Never serialise this onto borrower or broker responses.
     *
     * @return HasOne<AuthenticityReport, $this>
     */
    public function authenticityReport(): HasOne
    {
        return $this->hasOne(AuthenticityReport::class);
    }
}
