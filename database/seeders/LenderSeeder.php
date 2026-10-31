<?php

namespace Database\Seeders;

use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Models\Lender;
use App\Models\LenderProduct;
use App\Models\PolicyVersion;
use App\Models\RateSheet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Seeds a 92-lender demo panel. Every name, rule and rate here is FICTIONAL test data
 * generated deterministically; replace with real, permissioned policy data before launch.
 */
class LenderSeeder extends Seeder
{
    /**
     * @var array<string, list<string>>
     */
    private const LENDERS = [
        'major_bank' => ['Harbourline Bank', 'Southmark Bank', 'Ironbark National Bank', 'Meridian Federal Bank'],
        'second_tier' => ['Banksia Bank', 'Coastal Range Bank', 'Kestrel Bank', 'Lyrebird Bank', 'Wattlebird Bank', 'Saltbush Bank', 'Jarrah Bank', 'Coolabah Bank', 'Brolga Bank', 'Quandong Bank', 'Kurrajong Bank', 'Mallee Bank'],
        'credit_union' => ['Bluegum Mutual', 'Tidewater Credit Union', 'Numbat Mutual', 'Riverbend Credit Union', 'Sandstone Mutual', 'Greywater Credit Union', 'Fernleaf Mutual', 'Silvereye Credit Union', 'Paperbark Mutual', 'Ridgeway Credit Union', 'Gidgee Mutual', 'Waratah Peak Credit Union', 'Bottlebrush Mutual', 'Currawong Credit Union', 'Spinifex Mutual', 'Tallowwood Credit Union', 'Ghost Gum Mutual', 'Mulga Credit Union', 'Ironstone Mutual', 'Yellowbox Credit Union'],
        'non_bank' => ['Northline Home Loans', 'Kitefin Lending', 'Driftwood Finance', 'Orbital Home Loans', 'Coralbay Lending', 'Southerly Home Loans', 'Basalt Lending', 'Stringybark Finance', 'Nightjar Lending', 'Copperleaf Home Loans', 'Tessellate Home Loans', 'Lumen Lending', 'Halyard Finance', 'Keelson Home Loans', 'Quokka Home Loans', 'Bilby Lending', 'Wombat Hill Finance', 'Seabreeze Lending', 'Granite Peak Home Loans', 'Mangrove Lending', 'Firetail Finance', 'Sundew Home Loans', 'Cassowary Lending', 'Emberly Finance'],
        'asset_finance' => ['Torque Asset Finance', 'Gearbox Finance', 'Axle Motor Finance', 'Roadhouse Finance', 'Tailwind Asset Finance', 'Chassis Finance', 'Overdrive Lending', 'Odometer Finance', 'Paddock Equipment Finance', 'Hauler Finance', 'Gridline Asset Finance', 'Clutch Finance', 'Piston Finance', 'Tread Finance', 'Wheelhouse Finance', 'Sprocket Asset Finance'],
        'business' => ['Ledgerline Capital', 'Tradeflow Capital', 'Workbench Finance', 'Storefront Capital', 'Foundry Business Finance', 'Kiln Capital', 'Anvil Business Lending', 'Ledgerwise Finance', 'Payroll Bridge Capital', 'Bluebench Capital', 'Gantry Capital', 'Dovetail Business Finance', 'Marquee Capital', 'Cogwheel Business Finance', 'Abacus Rise Capital', 'Trellis Trade Finance'],
    ];

    private const COLORS = ['#2D7DFF', '#6FB1FF', '#2FD08A', '#FFB547', '#FF5C6C', '#A78BFA', '#22D3EE', '#F472B6', '#FACC15', '#34D399', '#60A5FA', '#FB923C'];

    private const FEATURES = [
        'home' => ['offset', 'redraw', 'extra_repayments', 'family_guarantee', 'split_loan'],
        'asset' => ['no_early_exit_fee', 'balloon', 'extra_repayments'],
        'personal' => ['no_early_exit_fee', 'extra_repayments', 'redraw'],
        'business' => ['revolving', 'extra_repayments', 'low_doc'],
    ];

    public function run(): void
    {
        foreach (self::LENDERS as $category => $names) {
            foreach ($names as $name) {
                mt_srand(crc32($name));
                $this->seedLender($name, $category);
            }
        }

        mt_srand();
    }

    private function seedLender(string $name, string $category): void
    {
        $roll = mt_rand(1, 100);

        $lender = Lender::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'category' => $category,
            'abn' => sprintf('%02d %03d %03d %03d', mt_rand(10, 99), mt_rand(100, 999), mt_rand(100, 999), mt_rand(100, 999)),
            'licence_ref' => 'ACL '.mt_rand(200000, 599999),
            'brand_color' => self::COLORS[mt_rand(0, count(self::COLORS) - 1)],
            'logo_usage_approved' => false,
            'status' => 'active',
            'turnaround_days' => match ($category) {
                'major_bank' => mt_rand(5, 10),
                'non_bank', 'asset_finance' => mt_rand(1, 3),
                default => mt_rand(2, 6),
            },
            'coverage' => match (true) {
                $roll <= 4 => LenderCoverage::Unmapped,
                $roll <= 10 => LenderCoverage::Partial,
                default => LenderCoverage::Full,
            },
            'last_reviewed_at' => now()->subDays(mt_rand(1, 45)),
        ]);

        foreach ($this->packsFor($category) as $pack) {
            $this->seedProduct($lender, $pack, $category);
        }
    }

    /**
     * @return list<LoanPack>
     */
    private function packsFor(string $category): array
    {
        return match ($category) {
            'major_bank' => LoanPack::cases(),
            'second_tier' => array_filter([LoanPack::Home, LoanPack::Personal, mt_rand(0, 1) ? LoanPack::Asset : null]),
            'credit_union' => [LoanPack::Home, LoanPack::Personal],
            'non_bank' => array_filter([LoanPack::Home, mt_rand(1, 10) <= 3 ? LoanPack::Business : null]),
            'asset_finance' => array_filter([LoanPack::Asset, mt_rand(1, 10) <= 4 ? LoanPack::Personal : null]),
            'business' => [LoanPack::Business],
            default => throw new InvalidArgumentException("Unknown lender category [{$category}]."),
        };
    }

    private function seedProduct(Lender $lender, LoanPack $pack, string $category): void
    {
        $features = self::FEATURES[$pack->value];
        shuffle($features);

        $product = LenderProduct::create([
            'lender_id' => $lender->id,
            'loan_pack' => $pack,
            'name' => $this->productName($lender, $pack),
            'features' => array_slice($features, 0, mt_rand(1, count($features))),
        ]);

        [$rules, $maxLvr] = $this->rulesFor($pack, $category);

        PolicyVersion::create([
            'lender_id' => $lender->id,
            'loan_pack' => $pack,
            'version' => 1,
            'rules' => $rules,
            'status' => 'published',
            'source_document' => $lender->name.' credit policy (demo)',
            'published_at' => now()->subDays(mt_rand(20, 120)),
        ]);

        if (mt_rand(1, 100) <= 6) {
            PolicyVersion::create([
                'lender_id' => $lender->id,
                'loan_pack' => $pack,
                'version' => 2,
                'rules' => $this->proposedChange($rules),
                'status' => 'draft',
                'source_document' => $lender->name.' policy bulletin (AI-extracted, awaiting review)',
            ]);
        }

        $stale = mt_rand(1, 100) <= 4;

        RateSheet::create([
            'lender_product_id' => $product->id,
            'rows' => $this->rateRows($pack, $category, $maxLvr),
            'fees' => $this->fees($pack),
            'effective_from' => $stale ? now()->subDays(mt_rand(150, 260)) : now()->subDays(mt_rand(3, 60)),
        ]);
    }

    private function productName(Lender $lender, LoanPack $pack): string
    {
        $short = Str::of($lender->name)->before(' ')->toString();

        return match ($pack) {
            LoanPack::Home => $short.' '.['Essential Variable', 'Package Home Loan', 'Basic Variable', 'Advantage Home Loan'][mt_rand(0, 3)],
            LoanPack::Asset => $short.' '.['Car Loan', 'Asset Finance', 'Green Car Loan'][mt_rand(0, 2)],
            LoanPack::Personal => $short.' '.['Personal Loan', 'Secured Personal Loan', 'Flexi Personal Loan'][mt_rand(0, 2)],
            LoanPack::Business => $short.' '.['Business Term Loan', 'Business Line of Credit', 'Equipment & Growth Loan'][mt_rand(0, 2)],
        };
    }

    /**
     * @return array{0: list<array{id: string, label: string, field: string, op: string, value: mixed, clause: string}>, 1: float|null}
     */
    private function rulesFor(LoanPack $pack, string $category): array
    {
        $lenient = in_array($category, ['non_bank', 'asset_finance', 'business'], true);
        $section = fn (string $s) => 'Credit policy §'.$s;

        return match ($pack) {
            LoanPack::Home => (function () use ($lenient, $section, $category) {
                $maxLvr = (float) [80, 85, 90, 95][$category === 'major_bank' ? 3 : mt_rand(1, 3)];
                $minCredit = $lenient ? mt_rand(500, 580) : mt_rand(600, 680);
                $employment = $lenient ? ['payg', 'self_employed', 'contractor', 'casual'] : (mt_rand(0, 1) ? ['payg', 'self_employed', 'contractor'] : ['payg', 'self_employed']);
                $tenure = $lenient ? mt_rand(1, 3) : [3, 6, 6, 12][mt_rand(0, 3)];
                $maxLoan = [1500000, 2000000, 2500000, 3000000, 5000000][mt_rand(0, 4)];

                return [[
                    $this->rule('LVR-1', 'Maximum LVR', 'lvr', 'lte', $maxLvr, $section('3.1')." Maximum LVR {$maxLvr}% (owner occupied, standard security)"),
                    $this->rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', $minCredit, $section('5.2')." Minimum bureau score {$minCredit}"),
                    $this->rule('EMP-1', 'Accepted employment', 'employment_type', 'in', $employment, $section('4.1').' Accepted employment: '.implode(', ', $employment)),
                    $this->rule('EMP-2', 'Time in current role', 'employment_months', 'gte', $tenure, $section('4.3')." At least {$tenure} months in current role"),
                    $this->rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', $maxLoan, $section('2.4').' Maximum loan $'.number_format($maxLoan)),
                    $this->rule('LOAN-2', 'Minimum loan size', 'amount', 'gte', 50000, $section('2.4').' Minimum loan $50,000'),
                ], $maxLvr];
            })(),
            LoanPack::Asset => (function () use ($lenient, $section) {
                $maxLvr = (float) [100, 110, 120, 130][mt_rand(0, 3)];
                $maxAge = [7, 10, 12, 15, 20][mt_rand(0, 4)];
                $minCredit = $lenient ? mt_rand(480, 560) : mt_rand(560, 640);
                $maxLoan = [100000, 150000, 250000, 500000][mt_rand(0, 3)];

                return [[
                    $this->rule('LVR-1', 'Maximum loan-to-value', 'lvr', 'lte', $maxLvr, $section('6.1')." Up to {$maxLvr}% of the purchase price, including on-road costs"),
                    $this->rule('AST-1', 'Maximum asset age', 'asset_age_years', 'lte', $maxAge, $section('6.3')." Asset no older than {$maxAge} years at settlement"),
                    $this->rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', $minCredit, $section('5.2')." Minimum bureau score {$minCredit}"),
                    $this->rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', $maxLoan, $section('2.1').' Maximum loan $'.number_format($maxLoan)),
                    $this->rule('EMP-2', 'Time in current role', 'employment_months', 'gte', $lenient ? 1 : 3, $section('4.3').' Minimum time in current role'),
                ], $maxLvr];
            })(),
            LoanPack::Personal => (function () use ($lenient, $section) {
                $minCredit = $lenient ? mt_rand(520, 600) : mt_rand(600, 720);
                $minIncome = [25000, 30000, 35000, 40000, 50000][mt_rand(0, 4)];
                $maxLoan = [50000, 60000, 75000, 100000][mt_rand(0, 3)];
                $excluded = mt_rand(0, 2) === 0 ? ['debt_consolidation'] : (mt_rand(0, 3) === 0 ? ['travel'] : []);

                $rules = [
                    $this->rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', $minCredit, $section('5.2')." Minimum bureau score {$minCredit}"),
                    $this->rule('INC-1', 'Minimum income', 'income_annual', 'gte', $minIncome, $section('4.6').' Minimum gross income $'.number_format($minIncome)),
                    $this->rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', $maxLoan, $section('2.1').' Maximum unsecured loan $'.number_format($maxLoan)),
                    $this->rule('LOAN-2', 'Minimum loan size', 'amount', 'gte', 2000, $section('2.1').' Minimum loan $2,000'),
                    $this->rule('EMP-2', 'Time in current role', 'employment_months', 'gte', $lenient ? 3 : 6, $section('4.3').' Minimum time in current role'),
                ];

                if ($excluded !== []) {
                    $rules[] = $this->rule('PUR-1', 'Purpose exclusions', 'purpose', 'not_in', $excluded, $section('1.5').' Excluded purposes: '.str_replace('_', ' ', implode(', ', $excluded)));
                }

                return [$rules, null];
            })(),
            LoanPack::Business => (function () use ($section) {
                $minTrading = [6, 12, 18, 24][mt_rand(0, 3)];
                $minTurnover = [75000, 120000, 250000, 500000][mt_rand(0, 3)];
                $minCredit = mt_rand(520, 650);
                $maxLoan = [250000, 500000, 1000000, 2000000][mt_rand(0, 3)];

                return [[
                    $this->rule('BUS-1', 'Time trading', 'time_in_business_months', 'gte', $minTrading, $section('7.1')." ABN registered and trading at least {$minTrading} months"),
                    $this->rule('BUS-2', 'Minimum turnover', 'annual_turnover', 'gte', $minTurnover, $section('7.2').' Annual turnover at least $'.number_format($minTurnover)),
                    $this->rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', $minCredit, $section('5.2')." Minimum director bureau score {$minCredit}"),
                    $this->rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', $maxLoan, $section('2.1').' Maximum facility $'.number_format($maxLoan)),
                ], null];
            })(),
        };
    }

    /**
     * @return array{id: string, label: string, field: string, op: string, value: mixed, clause: string}
     */
    private function rule(string $id, string $label, string $field, string $op, mixed $value, string $clause): array
    {
        return compact('id', 'label', 'field', 'op', 'value', 'clause');
    }

    /**
     * A plausible AI-extracted policy change awaiting human review.
     *
     * @param  list<array<string, mixed>>  $rules
     * @return list<array<string, mixed>>
     */
    private function proposedChange(array $rules): array
    {
        return array_map(function (array $rule) {
            if ($rule['id'] === 'CRD-1') {
                $rule['value'] += 20;
                $rule['clause'] .= ' (bulletin: raised by 20 points)';
            }

            return $rule;
        }, $rules);
    }

    /**
     * @return list<array{max_lvr: float, rate_min: float, rate_max: float}>
     */
    private function rateRows(LoanPack $pack, string $category, ?float $maxLvr): array
    {
        $jitter = fn (float $spread) => mt_rand(0, (int) ($spread * 100)) / 100;

        return match ($pack) {
            LoanPack::Home => (function () use ($category, $maxLvr, $jitter) {
                $base = match ($category) {
                    'major_bank' => 5.89 + $jitter(0.4),
                    'second_tier' => 5.64 + $jitter(0.45),
                    'credit_union' => 5.74 + $jitter(0.45),
                    default => 6.14 + $jitter(1.0),
                };
                $bands = [60 => 0.0, 70 => 0.05, 80 => 0.10, 90 => 0.35, 95 => 0.55];

                return array_map(
                    fn (int $lvr, float $loading) => ['max_lvr' => (float) $lvr, 'rate_min' => round($base + $loading, 2), 'rate_max' => round($base + $loading + 0.3 + $jitter(0.3), 2)],
                    array_keys(array_filter($bands, fn (float $loading, int $lvr) => $lvr <= $maxLvr, ARRAY_FILTER_USE_BOTH)),
                    array_filter($bands, fn (float $loading, int $lvr) => $lvr <= $maxLvr, ARRAY_FILTER_USE_BOTH),
                );
            })(),
            LoanPack::Asset => [['max_lvr' => (float) $maxLvr, 'rate_min' => $min = round(6.99 + $jitter(3.0), 2), 'rate_max' => round($min + 1.5 + $jitter(2.0), 2)]],
            LoanPack::Personal => [['max_lvr' => 1000.0, 'rate_min' => $min = round(8.49 + $jitter(4.0), 2), 'rate_max' => round($min + 3.0 + $jitter(3.0), 2)]],
            LoanPack::Business => [['max_lvr' => 1000.0, 'rate_min' => $min = round(7.95 + $jitter(3.0), 2), 'rate_max' => round($min + 2.0 + $jitter(2.0), 2)]],
        };
    }

    /**
     * @return array{establishment: int, annual: int}
     */
    private function fees(LoanPack $pack): array
    {
        return match ($pack) {
            LoanPack::Home => ['establishment' => [0, 0, 250, 395, 600][mt_rand(0, 4)], 'annual' => [0, 0, 0, 249, 395][mt_rand(0, 4)]],
            LoanPack::Asset => ['establishment' => mt_rand(250, 550), 'annual' => 0],
            LoanPack::Personal => ['establishment' => [0, 199, 299, 499][mt_rand(0, 3)], 'annual' => [0, 60, 120][mt_rand(0, 2)]],
            LoanPack::Business => ['establishment' => mt_rand(500, 1500), 'annual' => [0, 150, 300][mt_rand(0, 2)]],
        };
    }
}
