<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Runtime override for a value in config/mega.php, edited by super admins.
 *
 * @property string $key
 * @property mixed $value
 * @property int|null $updated_by
 */
#[Fillable(['key', 'value', 'updated_by'])]
class PlatformSetting extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }
}
