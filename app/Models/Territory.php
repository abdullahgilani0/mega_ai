<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 * @property string $state
 * @property list<string> $postcodes
 * @property-read BrokerTerritory $pivot
 */
#[Fillable(['name', 'state', 'postcodes'])]
class Territory extends Model
{
    protected function casts(): array
    {
        return [
            'postcodes' => 'array',
        ];
    }

    public function covers(string $postcode): bool
    {
        return in_array($postcode, $this->postcodes, true);
    }

    /**
     * @return BelongsToMany<Broker, $this, BrokerTerritory>
     */
    public function brokers(): BelongsToMany
    {
        return $this->belongsToMany(Broker::class)->using(BrokerTerritory::class)->withPivot('coverage');
    }
}
