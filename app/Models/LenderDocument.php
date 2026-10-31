<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A versioned source document in the lender knowledge base.
 *
 * @property int $id
 * @property int $lender_id
 * @property string $kind
 * @property string $title
 * @property string $storage_path
 * @property string $mime_type
 * @property int $size_bytes
 * @property string $sha256
 * @property int $version
 * @property Carbon $effective_from
 * @property int|null $uploaded_by
 * @property Carbon $created_at
 * @property-read Lender $lender
 */
#[Fillable(['lender_id', 'kind', 'title', 'storage_path', 'mime_type', 'size_bytes', 'sha256', 'version', 'effective_from', 'uploaded_by'])]
#[Hidden(['storage_path'])]
class LenderDocument extends Model
{
    public const KINDS = [
        'credit_policy' => 'Credit policy',
        'product_guide' => 'Product guide',
        'credit_guide' => 'Credit guide',
        'rate_sheet' => 'Rate sheet',
        'terms' => 'Terms and conditions',
        'bulletin' => 'Policy bulletin',
        'form' => 'Form',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Lender, $this>
     */
    public function lender(): BelongsTo
    {
        return $this->belongsTo(Lender::class);
    }
}
