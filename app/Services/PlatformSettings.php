<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * Super-admin editable overrides for config/mega.php, applied on every request.
 */
class PlatformSettings
{
    private const CACHE_KEY = 'mega.platform-settings';

    /**
     * Editable settings: key (relative to config "mega.") => [label, type, help].
     *
     * @var array<string, array{0: string, 1: 'int'|'bool'|'weights', 2: string}>
     */
    public const DEFINITIONS = [
        'allocation.offer_window_minutes' => ['Broker offer window (minutes)', 'int', 'How long a broker has to accept before the next broker is offered.'],
        'allocation.weights' => ['Allocation weights', 'weights', 'Territory, skill, capacity, responsiveness and fairness. Must add up to 1.'],
        'matching.weights' => ['Matching score weights', 'weights', 'Approval confidence, cost, speed and feature fit. Must add up to 1.'],
        'matching.max_rate_age_days' => ['Maximum rate sheet age (days)', 'int', 'Older rate sheets show as “manual check needed”.'],
        'authenticity.review_threshold' => ['Authenticity review threshold (0–100)', 'int', 'Documents scoring at or above this go to human review.'],
        'identity.max_attempts' => ['Identity attempts before manual review', 'int', 'The spec caps this at three.'],
        'access.grant_minutes' => ['Staff access grant length (minutes)', 'int', 'Just-in-time access to a borrower file expires after this.'],
        'retention.id_images_days' => ['Keep ID images for (days)', 'int', 'Raw ID photos are deleted after this; the verification result is kept.'],
        'reminders.after_hours' => ['Remind idle borrowers after (hours)', 'int', 'Save-and-resume reminders by email and SMS.'],
        'security.require_staff_mfa' => ['Require two-factor login for staff and brokers', 'bool', 'Staff without two-factor or a passkey are sent to set it up.'],
    ];

    public function applyOverrides(): void
    {
        foreach ($this->overrides() as $key => $value) {
            Config::set('mega.'.$key, $value);
        }
    }

    public function get(string $key): mixed
    {
        return Config::get('mega.'.$key);
    }

    public function set(string $key, mixed $value, int $userId): void
    {
        PlatformSetting::updateOrCreate(['key' => $key], ['value' => $value, 'updated_by' => $userId]);
        Cache::forget(self::CACHE_KEY);
        Config::set('mega.'.$key, $value);
    }

    /**
     * @return array<string, mixed>
     */
    private function overrides(): array
    {
        try {
            return Cache::rememberForever(self::CACHE_KEY, fn () => PlatformSetting::query()->pluck('value', 'key')->all());
        } catch (QueryException) {
            return [];
        }
    }
}
