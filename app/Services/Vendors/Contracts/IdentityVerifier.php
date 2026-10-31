<?php

namespace App\Services\Vendors\Contracts;

use App\Enums\IdentityResult;
use App\Models\IdentityCheck;

interface IdentityVerifier
{
    public function name(): string;

    /**
     * Run document, liveness and face-match checks for the given attempt.
     *
     * @return array{result: IdentityResult, liveness: string, advice: string|null}
     */
    public function verify(IdentityCheck $check): array;
}
