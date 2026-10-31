<?php

namespace App\Services\Vendors\Contracts;

use App\Models\AdvisorMessage;
use App\Models\Application;
use Illuminate\Support\Collection;

interface AdvisorModel
{
    public function name(): string;

    /**
     * Answer the borrower and propose structured notes for them to confirm.
     *
     * @param  Collection<int, AdvisorMessage>  $history
     * @return array{reply: string, notes: list<array{field: string|null, value: string|null, fact: string}>}
     */
    public function respond(Application $application, Collection $history, string $message): array;
}
