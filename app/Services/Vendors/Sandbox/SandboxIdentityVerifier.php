<?php

namespace App\Services\Vendors\Sandbox;

use App\Enums\IdentityResult;
use App\Models\IdentityCheck;
use App\Services\Vendors\Contracts\IdentityVerifier;

/**
 * Deterministic stand-in for a certified identity vendor. The first attempt on a
 * captured document passes unless the capture was flagged as unreadable.
 */
class SandboxIdentityVerifier implements IdentityVerifier
{
    public function name(): string
    {
        return 'sandbox';
    }

    public function verify(IdentityCheck $check): array
    {
        if (($check->evidence['capture_quality'] ?? 'good') === 'poor') {
            return [
                'result' => IdentityResult::Retry,
                'liveness' => 'not_run',
                'advice' => 'Your ID photo was blurry. Lay it flat in good light and retake it.',
            ];
        }

        return [
            'result' => IdentityResult::Verified,
            'liveness' => 'passed',
            'advice' => null,
        ];
    }
}
