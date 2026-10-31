<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
 // ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Compiled home-loan policy rules with citations, as the lender panel stores them.
 *
 * @return list<array{id: string, label: string, field: string, op: string, value: mixed, clause: string}>
 */
function homeLoanRules(float $maxLvr = 90, int $minCredit = 600): array
{
    return [
        ['id' => 'LVR-1', 'label' => 'Maximum LVR', 'field' => 'lvr', 'op' => 'lte', 'value' => $maxLvr, 'clause' => "Credit policy §3.1 Maximum LVR {$maxLvr}%"],
        ['id' => 'CRD-1', 'label' => 'Minimum credit score', 'field' => 'credit_score', 'op' => 'gte', 'value' => $minCredit, 'clause' => "Credit policy §5.2 Minimum bureau score {$minCredit}"],
        ['id' => 'EMP-1', 'label' => 'Accepted employment', 'field' => 'employment_type', 'op' => 'in', 'value' => ['payg', 'self_employed'], 'clause' => 'Credit policy §4.1 Accepted employment'],
    ];
}
