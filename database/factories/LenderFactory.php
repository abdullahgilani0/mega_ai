<?php

namespace Database\Factories;

use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Models\Lender;
use App\Models\LenderProduct;
use App\Models\PolicyVersion;
use App\Models\RateSheet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Lender>
 */
class LenderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company().' Bank';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'category' => 'second_tier',
            'brand_color' => fake()->hexColor(),
            'status' => 'active',
            'turnaround_days' => 4,
            'coverage' => LenderCoverage::Full,
            'last_reviewed_at' => now(),
        ];
    }

    /**
     * A lender with one product, a published policy and a current rate sheet for the pack.
     *
     * @param  list<array{id: string, label: string, field: string, op: string, value: mixed, clause: string}>  $rules
     * @param  list<array{max_lvr: float, rate_min: float, rate_max: float}>|null  $rateRows
     */
    public function withPolicy(LoanPack $pack, array $rules, ?array $rateRows = null): static
    {
        return $this->afterCreating(function (Lender $lender) use ($pack, $rules, $rateRows) {
            $product = LenderProduct::create([
                'lender_id' => $lender->id,
                'loan_pack' => $pack,
                'name' => $lender->name.' '.$pack->label(),
                'features' => ['offset', 'redraw', 'extra_repayments'],
            ]);

            PolicyVersion::create([
                'lender_id' => $lender->id,
                'loan_pack' => $pack,
                'version' => 1,
                'rules' => $rules,
                'status' => 'published',
                'published_at' => now(),
            ]);

            RateSheet::create([
                'lender_product_id' => $product->id,
                'rows' => $rateRows ?? [
                    ['max_lvr' => 80, 'rate_min' => 6.0, 'rate_max' => 6.2],
                    ['max_lvr' => 90, 'rate_min' => 6.3, 'rate_max' => 6.5],
                ],
                'fees' => ['establishment' => 300, 'annual' => 0],
                'effective_from' => now()->subDays(10),
            ]);
        });
    }
}
