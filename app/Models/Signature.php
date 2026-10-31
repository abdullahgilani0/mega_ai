<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Evidence of an electronic signature over the exact rendered document (SHA-256).
 *
 * @property int $id
 * @property int $application_id
 * @property int $disclosure_template_id
 * @property int $user_id
 * @property string $rendered_body
 * @property string $document_hash
 * @property string $signed_name
 * @property int $seconds_on_page
 * @property Carbon $acknowledged_at
 * @property Carbon $signed_at
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property-read DisclosureTemplate $template
 */
#[Fillable(['application_id', 'disclosure_template_id', 'user_id', 'rendered_body', 'document_hash', 'signed_name', 'seconds_on_page', 'acknowledged_at', 'signed_at', 'ip_address', 'user_agent'])]
class Signature extends Model
{
    protected function casts(): array
    {
        return [
            'acknowledged_at' => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Signatures are immutable.'));
    }

    /**
     * @return BelongsTo<DisclosureTemplate, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(DisclosureTemplate::class, 'disclosure_template_id');
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
