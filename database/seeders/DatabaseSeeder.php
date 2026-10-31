<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with a demo panel, broker network and one
     * account per role (password: "password").
     */
    public function run(): void
    {
        $this->call([
            LenderSeeder::class,
            BrokerNetworkSeeder::class,
            DisclosureTemplateSeeder::class,
        ]);

        $accounts = [
            ['Alex Borrower', 'borrower@mega.test', Role::Borrower],
            ['Pat Processor', 'processor@mega.test', Role::Processor],
            ['Casey Analyst', 'analyst@mega.test', Role::CreditAnalyst],
            ['Jordan Analyst', 'analyst2@mega.test', Role::CreditAnalyst],
            ['Morgan Admin', 'admin@mega.test', Role::Admin],
            ['Riley Superadmin', 'superadmin@mega.test', Role::SuperAdmin],
            ['Taylor Superadmin', 'superadmin2@mega.test', Role::SuperAdmin],
            ['Avery Auditor', 'auditor@mega.test', Role::Auditor],
        ];

        foreach ($accounts as [$name, $email, $role]) {
            User::factory()->role($role)->create(['name' => $name, 'email' => $email]);
        }

        $this->call(DemoActivitySeeder::class);
    }
}
