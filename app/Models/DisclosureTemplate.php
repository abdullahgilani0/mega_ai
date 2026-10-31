<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A legally approved, versioned disclosure document with merge placeholders.
 *
 * @property int $id
 * @property string $key
 * @property string $title
 * @property int $version
 * @property string $summary
 * @property string $body
 * @property int $position
 * @property Carbon|null $approved_at
 */
#[Fillable(['key', 'title', 'version', 'summary', 'body', 'position', 'approved_at'])]
class DisclosureTemplate extends Model
{
    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
        ];
    }

    /**
     * The latest approved version of every template, in reading order.
     *
     * @param  Builder<DisclosureTemplate>  $query
     */
    public function scopeCurrent(Builder $query): void
    {
        $query->whereNotNull('approved_at')
            ->whereIn('id', fn ($sub) => $sub->selectRaw('max(id)')
                ->from('disclosure_templates')
                ->whereNotNull('approved_at')
                ->groupBy('key'))
            ->orderBy('position');
    }

    /**
     * @param  array<string, string>  $values
     */
    public function render(array $values): string
    {
        return strtr($this->body, collect($values)
            ->mapWithKeys(fn (string $value, string $key) => ['{{'.$key.'}}' => $value])
            ->all());
    }
}
