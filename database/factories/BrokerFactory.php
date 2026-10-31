<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\Broker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Broker>
 */
class BrokerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(Role::Broker),
            'licence_ref' => 'CR '.fake()->numerify('######'),
            'business_name' => fake()->company().' Finance',
            'loan_packs' => ['home', 'asset', 'personal', 'business'],
            'skills' => ['first_home_buyers', 'refinance'],
            'languages' => ['English'],
            'capacity' => 10,
            'status' => 'active',
            'acceptance_rate' => 0.8,
            'avg_first_contact_minutes' => 30,
            'conversion_rate' => 0.5,
        ];
    }
}
