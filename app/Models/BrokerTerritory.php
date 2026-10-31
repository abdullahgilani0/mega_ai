<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property int $broker_id
 * @property int $territory_id
 * @property string $coverage
 */
class BrokerTerritory extends Pivot
{
    protected $table = 'broker_territory';

    public $timestamps = false;
}
