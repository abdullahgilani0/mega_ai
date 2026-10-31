<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A row of the database session store, used to list and revoke a user's devices.
 *
 * @property string $id
 * @property int|null $user_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property int $last_activity
 */
class Session extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';
}
