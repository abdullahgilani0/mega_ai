<?php

namespace App\Support;

class AustralianMobile
{
    public const PATTERN = '/^\+614\d{8}$/';

    /**
     * Normalise local or international formats (0412 345 678, +61 412 345 678) to E.164.
     */
    public static function normalise(string $raw): string
    {
        $digits = preg_replace('/[^\d+]/', '', $raw) ?? '';

        return match (true) {
            str_starts_with($digits, '+61') => $digits,
            str_starts_with($digits, '61') => '+'.$digits,
            str_starts_with($digits, '04') => '+61'.substr($digits, 1),
            default => $digits,
        };
    }

    public static function mask(string $mobile): string
    {
        return substr($mobile, 0, 4).' ••• ••• '.substr($mobile, -3);
    }
}
