<?php

namespace Database\Factories;

use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\LoanPack;
use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'loan_pack' => LoanPack::Home,
            'purpose' => 'first_home',
            'amount' => 600000,
            'term_years' => 30,
            'state' => 'NSW',
            'postcode' => '2150',
            'employment_type' => 'payg',
            'is_joint' => false,
            'stage' => ApplicationStage::Consent,
            'status' => ApplicationStatus::InProgress,
            'data' => [],
            'provenance' => [],
        ];
    }

    public function atStage(ApplicationStage $stage): static
    {
        return $this->state(fn (array $attributes) => ['stage' => $stage]);
    }

    /**
     * A complete home-loan scenario the matching engine can assess without gaps.
     */
    public function withCompleteFinancials(): static
    {
        return $this->state(fn (array $attributes) => [
            'data' => [
                'income_annual' => 140000,
                'expenses_monthly' => 3000,
                'liabilities_monthly' => 0,
                'dependants' => 0,
                'employment_months' => 36,
                'property_value' => 800000,
                'credit_score' => 780,
                'credit_card_limits' => 0,
                'bank_institution' => 'Sandbox Bank (test data)',
            ],
            'provenance' => [
                'bank_institution' => 'open_banking',
                'income_annual' => 'open_banking',
                'expenses_monthly' => 'open_banking',
                'liabilities_monthly' => 'open_banking',
                'dependants' => 'borrower_answer',
                'employment_months' => 'borrower_answer',
                'property_value' => 'borrower_answer',
                'credit_score' => 'credit_bureau',
                'credit_card_limits' => 'credit_bureau',
            ],
        ]);
    }
}
