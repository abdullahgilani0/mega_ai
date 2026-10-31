<?php

namespace App\Models;

use App\Enums\Permission;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Role $role
 * @property string|null $mobile
 * @property Carbon|null $mobile_verified_at
 * @property string $status
 * @property int|null $avatar_seed
 * @property string|null $last_login_ip
 * @property string|null $last_login_user_agent
 * @property Carbon|null $last_login_at
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Broker|null $broker
 */
#[Fillable(['name', 'email', 'password', 'mobile', 'avatar_seed'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Defaults matching the database, so new instances resolve permissions correctly.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'borrower',
        'status' => 'active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'mobile_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function hasPermission(Permission $permission): bool
    {
        return $this->status === 'active'
            && in_array($permission, $this->role->permissions(), true);
    }

    /**
     * @return list<string>
     */
    public function permissionNames(): array
    {
        return array_map(fn (Permission $permission) => $permission->value, $this->role->permissions());
    }

    public function hasVerifiedMobile(): bool
    {
        return $this->mobile_verified_at !== null;
    }

    /**
     * Deterministic avatar from a hash of the user id; the borrower may reroll.
     */
    public function avatarIndex(): int
    {
        return $this->avatar_seed ?? (crc32('mega-avatar-'.$this->id) % 24);
    }

    public function routeNotificationForSms(): ?string
    {
        return $this->mobile;
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * @return HasMany<Session, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    /**
     * @return HasOne<Broker, $this>
     */
    public function broker(): HasOne
    {
        return $this->hasOne(Broker::class);
    }
}
