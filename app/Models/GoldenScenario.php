<?php

namespace App\Models;

use App\Enums\LoanPack;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A labelled test case: a borrower scenario and the outcome expected from specific
 * lenders. Policy changes must keep every expectation true before they publish.
 *
 * @property int $id
 * @property string $name
 * @property LoanPack $loan_pack
 * @property array<string, mixed> $scenario
 * @property array<int|string, string> $expectations
 * @property int|null $created_by
 */
#[Fillable(['name', 'loan_pack', 'scenario', 'expectations', 'created_by'])]
class GoldenScenario extends Model
{
    protected function casts(): array
    {
        return [
            'loan_pack' => LoanPack::class,
            'scenario' => 'array',
            'expectations' => 'array',
        ];
    }
}
