<?php

namespace App\Services\Matching;

use App\Models\MatchResult;
use Illuminate\Support\Number;

/**
 * Writes the plain-language "why it fits" using only cited facts: every sentence
 * maps to a policy clause, a rate sheet row or a borrower data point.
 */
class ExplanationWriter
{
    private const INTENT_LEADS = [
        'best_overall' => 'Best overall fit for your situation.',
        'lowest_cost' => 'Lowest estimated cost of the lenders that fit.',
        'highest_confidence' => 'Strongest policy fit, with the most room in the rules.',
    ];

    public function write(MatchResult $result): string
    {
        $lender = $result->lender->name;
        $sentences = [self::INTENT_LEADS[$result->intent] ?? 'A strong fit for your situation.'];

        $passed = collect($result->rule_results)->where('outcome', 'pass');

        if ($lvr = $passed->firstWhere('field', 'lvr')) {
            $sentences[] = "Your LVR of {$lvr['actual']}% is within {$lender}'s {$lvr['required']}% limit ({$lvr['clause']}).";
        }

        if ($credit = $passed->firstWhere('field', 'credit_score')) {
            $sentences[] = "Your credit score clears its minimum of {$credit['required']} ({$credit['clause']}).";
        }

        if ($service = $result->serviceability) {
            $sentences[] = 'At a '.number_format($service['assessment_rate'], 2).'% assessment rate, your estimated monthly surplus is '
                .Number::currency($service['surplus'], 'AUD', precision: 0).' after repayments of '
                .Number::currency($service['repayment'], 'AUD', precision: 0).'.';
        }

        if ($result->rate_min !== null) {
            $sentences[] = 'Indicative rate '.number_format($result->rate_min, 2).'–'.number_format($result->rate_max, 2)
                .'% p.a. from the rate sheet effective '.$result->rate_effective_from?->format('j M Y').'.';
        }

        return implode(' ', $sentences);
    }
}
