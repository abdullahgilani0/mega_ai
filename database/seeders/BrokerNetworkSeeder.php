<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Broker;
use App\Models\Territory;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo territories (postcode sets) and a broker network covering them. Fictional people.
 */
class BrokerNetworkSeeder extends Seeder
{
    /**
     * @var array<string, array{0: string, 1: list<array{0: int, 1: int}>}>
     */
    private const TERRITORIES = [
        'Sydney CBD & Inner' => ['NSW', [[2000, 2050]]],
        'Western Sydney' => ['NSW', [[2140, 2200], [2740, 2770]]],
        'Northern Sydney & Beaches' => ['NSW', [[2060, 2120]]],
        'Newcastle & Hunter' => ['NSW', [[2280, 2330]]],
        'Melbourne Inner' => ['VIC', [[3000, 3070]]],
        'Melbourne East' => ['VIC', [[3100, 3180]]],
        'Geelong' => ['VIC', [[3211, 3228]]],
        'Brisbane' => ['QLD', [[4000, 4125]]],
        'Gold Coast' => ['QLD', [[4207, 4230]]],
        'Perth Metro' => ['WA', [[6000, 6070]]],
        'Adelaide Metro' => ['SA', [[5000, 5099]]],
        'Canberra' => ['ACT', [[2600, 2620], [2900, 2914]]],
        'Hobart' => ['TAS', [[7000, 7055]]],
        'Darwin' => ['NT', [[800, 832]]],
    ];

    /**
     * @var list<array{name: string, email: string, business: string, packs: list<string>, skills: list<string>, languages: list<string>, territories: array<string, string>, capacity: int, acceptance: float, contact: int}>
     */
    private const BROKERS = [
        ['name' => 'Priya Raman', 'email' => 'broker@mega.test', 'business' => 'Parramatta Home Finance', 'packs' => ['home', 'personal', 'asset'], 'skills' => ['first_home_buyers', 'refinance', 'self_employed'], 'languages' => ['English', 'Tamil', 'Hindi'], 'territories' => ['Western Sydney' => 'primary', 'Sydney CBD & Inner' => 'secondary'], 'capacity' => 15, 'acceptance' => 0.92, 'contact' => 18],
        ['name' => 'Tom Fitzgerald', 'email' => 'tom.broker@mega.test', 'business' => 'Harbour Lending Co', 'packs' => ['home', 'business'], 'skills' => ['investors', 'refinance', 'business_lending'], 'languages' => ['English'], 'territories' => ['Sydney CBD & Inner' => 'primary', 'Northern Sydney & Beaches' => 'primary'], 'capacity' => 12, 'acceptance' => 0.85, 'contact' => 25],
        ['name' => 'Mei Lin Chen', 'email' => 'mei.broker@mega.test', 'business' => 'Chen Finance Partners', 'packs' => ['home', 'personal'], 'skills' => ['first_home_buyers', 'investors'], 'languages' => ['English', 'Mandarin', 'Cantonese'], 'territories' => ['Western Sydney' => 'secondary', 'Northern Sydney & Beaches' => 'secondary'], 'capacity' => 10, 'acceptance' => 0.88, 'contact' => 22],
        ['name' => 'Jack Morrison', 'email' => 'jack.broker@mega.test', 'business' => 'Hunter Valley Loans', 'packs' => ['home', 'asset', 'business'], 'skills' => ['asset_finance', 'business_lending', 'self_employed'], 'languages' => ['English'], 'territories' => ['Newcastle & Hunter' => 'primary'], 'capacity' => 10, 'acceptance' => 0.8, 'contact' => 35],
        ['name' => 'Sofia Nguyen', 'email' => 'sofia.broker@mega.test', 'business' => 'Southbank Mortgage Studio', 'packs' => ['home', 'personal'], 'skills' => ['first_home_buyers', 'refinance'], 'languages' => ['English', 'Vietnamese'], 'territories' => ['Melbourne Inner' => 'primary', 'Melbourne East' => 'secondary'], 'capacity' => 14, 'acceptance' => 0.9, 'contact' => 15],
        ['name' => 'Daniel Papadopoulos', 'email' => 'daniel.broker@mega.test', 'business' => 'Eastside Finance', 'packs' => ['home', 'asset', 'business'], 'skills' => ['investors', 'asset_finance', 'business_lending'], 'languages' => ['English', 'Greek'], 'territories' => ['Melbourne East' => 'primary', 'Geelong' => 'primary'], 'capacity' => 12, 'acceptance' => 0.78, 'contact' => 40],
        ['name' => 'Aroha Walker', 'email' => 'aroha.broker@mega.test', 'business' => 'River City Lending', 'packs' => ['home', 'personal', 'asset'], 'skills' => ['first_home_buyers', 'self_employed', 'asset_finance'], 'languages' => ['English', 'Māori'], 'territories' => ['Brisbane' => 'primary', 'Gold Coast' => 'secondary'], 'capacity' => 12, 'acceptance' => 0.87, 'contact' => 20],
        ['name' => 'Liam O\'Connell', 'email' => 'liam.broker@mega.test', 'business' => 'Westcoast Mortgage Co', 'packs' => ['home', 'business'], 'skills' => ['refinance', 'business_lending'], 'languages' => ['English'], 'territories' => ['Perth Metro' => 'primary'], 'capacity' => 10, 'acceptance' => 0.82, 'contact' => 30],
        ['name' => 'Grace Kim', 'email' => 'grace.broker@mega.test', 'business' => 'Adelaide Home Loans Collective', 'packs' => ['home', 'personal', 'asset'], 'skills' => ['first_home_buyers', 'investors'], 'languages' => ['English', 'Korean'], 'territories' => ['Adelaide Metro' => 'primary', 'Darwin' => 'secondary'], 'capacity' => 10, 'acceptance' => 0.86, 'contact' => 26],
        ['name' => 'Sam Hughes', 'email' => 'sam.broker@mega.test', 'business' => 'Capital Region Finance', 'packs' => ['home', 'personal', 'asset', 'business'], 'skills' => ['refinance', 'self_employed', 'business_lending'], 'languages' => ['English'], 'territories' => ['Canberra' => 'primary', 'Hobart' => 'secondary'], 'capacity' => 10, 'acceptance' => 0.8, 'contact' => 33],
    ];

    public function run(): void
    {
        foreach (self::TERRITORIES as $name => [$state, $ranges]) {
            $postcodes = [];
            foreach ($ranges as [$from, $to]) {
                foreach (range($from, $to) as $postcode) {
                    $postcodes[] = str_pad((string) $postcode, 4, '0', STR_PAD_LEFT);
                }
            }

            Territory::create(['name' => $name, 'state' => $state, 'postcodes' => $postcodes]);
        }

        foreach (self::BROKERS as $profile) {
            $user = User::factory()->role(Role::Broker)->create([
                'name' => $profile['name'],
                'email' => $profile['email'],
            ]);

            $broker = Broker::create([
                'user_id' => $user->id,
                'licence_ref' => 'CR '.(500000 + $user->id * 37),
                'business_name' => $profile['business'],
                'loan_packs' => $profile['packs'],
                'skills' => $profile['skills'],
                'languages' => $profile['languages'],
                'capacity' => $profile['capacity'],
                'acceptance_rate' => $profile['acceptance'],
                'avg_first_contact_minutes' => $profile['contact'],
                'conversion_rate' => 0.55,
            ]);

            foreach ($profile['territories'] as $territory => $coverage) {
                $broker->territories()->attach(Territory::where('name', $territory)->firstOrFail()->id, ['coverage' => $coverage]);
            }
        }
    }
}
