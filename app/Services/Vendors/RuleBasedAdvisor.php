<?php

namespace App\Services\Vendors;

use App\Enums\LoanPack;
use App\Models\Application;
use App\Services\Vendors\Contracts\AdvisorModel;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;

/**
 * Deterministic advisor used until a language model is configured behind the same
 * interface. It answers common questions and turns plain statements into notes the
 * borrower confirms; it never gives credit advice or approves anything.
 */
class RuleBasedAdvisor implements AdvisorModel
{
    private const WORD_NUMBERS = ['no' => 0, 'zero' => 0, 'one' => 1, 'a' => 1, 'two' => 2, 'three' => 3, 'four' => 4, 'five' => 5, 'six' => 6];

    private const FIELD_QUESTIONS = [
        'dependants' => 'How many people depend on you financially?',
        'employment_months' => 'How long have you been in your current job or business?',
        'income_annual' => 'What is your total income before tax each year?',
        'expenses_monthly' => 'Roughly what do you spend each month on living costs?',
        'property_value' => 'What is the estimated value of the property?',
        'asset_price' => 'What is the purchase price of the vehicle or asset?',
        'annual_turnover' => 'What was your business turnover over the last 12 months?',
    ];

    public function name(): string
    {
        return 'rules-v1';
    }

    public function respond(Application $application, Collection $history, string $message): array
    {
        $notes = $this->extractNotes($application, $message);
        $text = mb_strtolower($message);

        $reply = match (true) {
            (bool) preg_match('/\b(approve|approved|approval|guarantee|will i get)\b/', $text) => 'I can\'t approve loans or promise an outcome. MEGA shortlists lenders whose published policies fit your situation, and a licensed broker reviews that shortlist before anything goes to a lender.',
            (bool) preg_match('/\b(lvr|deposit|loan to value)\b/', $text) => $this->lvrAnswer($application),
            (bool) preg_match('/\b(credit (check|score|file)|enquiry)\b/', $text) => 'We run a soft credit check, which does not affect your credit score. You will only see "credit check complete"; your broker sees the summary.',
            (bool) preg_match('/\b(document|upload|payslip|statement|tax return)\b/', $text) => 'Connecting your bank is fastest: it replaces statement uploads. Otherwise upload your last two payslips and three months of statements. If something is unreadable, I will tell you exactly which page to retake.',
            (bool) preg_match('/\b(how long|time|minutes|days)\b/', $text) => 'Most people reach their matches in under 15 minutes once their documents are in. After you sign, a local broker is usually assigned within the hour.',
            (bool) preg_match('/\b(broker|who will|contact me)\b/', $text) => 'When you finish, MEGA allocates a licensed broker who covers your area and loan type. They will contact you, check the shortlist, and take responsibility for the recommendation.',
            $notes !== [] => 'Thanks, that helps. I have noted what you told me below. Please confirm each note, or dismiss anything I got wrong.',
            default => 'Tell me about your situation in your own words: your goal, who depends on you, any job changes, and anything that worries you.',
        };

        $next = $this->nextQuestion($application, $notes);

        if ($next !== null) {
            $reply .= ' '.$next;
        }

        return ['reply' => $reply, 'notes' => $notes];
    }

    /**
     * @return list<array{field: string|null, value: string|null, fact: string}>
     */
    private function extractNotes(Application $application, string $message): array
    {
        $notes = [];
        $text = mb_strtolower($message);

        if (preg_match('/\b(\d+|no|zero|one|a|two|three|four|five|six)\s+(kids?|children|child|dependants?|dependents?)\b/', $text, $m)) {
            $count = is_numeric($m[1]) ? (int) $m[1] : self::WORD_NUMBERS[$m[1]];
            $notes[] = ['field' => 'dependants', 'value' => (string) $count, 'fact' => "Has {$count} dependant".($count === 1 ? '' : 's')];
        }

        if (preg_match('/\b(earn|earning|salary|income|make|paid)\b[^\d$]{0,24}\$?\s?([\d,.]+\s?[km]?)/', $text, $m)) {
            $amount = $this->parseMoney($m[2]);
            if ($amount !== null && preg_match('/\b(a|per|each) (month|mth)\b/', $text)) {
                $amount *= 12;
            }
            if ($amount !== null && $amount >= 10000) {
                $notes[] = ['field' => 'income_annual', 'value' => (string) $amount, 'fact' => 'Annual income before tax about '.Number::currency($amount, 'AUD', precision: 0)];
            }
        }

        if (preg_match('/\b(spend|spending|expenses|living costs)\b[^\d$]{0,24}\$?\s?([\d,.]+\s?k?)/', $text, $m)) {
            $amount = $this->parseMoney($m[2]);
            if ($amount !== null && preg_match('/\b(a|per|each) week\b/', $text)) {
                $amount = (int) round($amount * 52 / 12);
            }
            if ($amount !== null && $amount >= 300) {
                $notes[] = ['field' => 'expenses_monthly', 'value' => (string) $amount, 'fact' => 'Living costs about '.Number::currency($amount, 'AUD', precision: 0).' a month'];
            }
        }

        if (preg_match('/\b(worth|valued at|value of|priced at|price is|costs?|asking)\b[^\d$]{0,16}\$?\s?([\d,.]+\s?[km]?)/', $text, $m)) {
            $amount = $this->parseMoney($m[2]);
            $field = $application->loan_pack === LoanPack::Asset ? 'asset_price' : ($application->loan_pack === LoanPack::Home ? 'property_value' : null);
            if ($amount !== null && $field !== null && $amount >= 1000) {
                $label = $field === 'asset_price' ? 'Asset price' : 'Property value';
                $notes[] = ['field' => $field, 'value' => (string) $amount, 'fact' => $label.' about '.Number::currency($amount, 'AUD', precision: 0)];
            }
        }

        if (preg_match('/\b(\d+)\s+(years?|months?)\b[^.]{0,30}\b(job|role|employer|business|working)\b/', $text, $m)) {
            $months = (int) $m[1] * (str_starts_with($m[2], 'year') ? 12 : 1);
            $field = $application->loan_pack === LoanPack::Business && str_contains($m[0], 'business') ? 'time_in_business_months' : 'employment_months';
            $notes[] = ['field' => $field, 'value' => (string) $months, 'fact' => "{$months} months in current ".($field === 'employment_months' ? 'job' : 'business')];
        }

        if (preg_match('/\b(new job|changing jobs|change jobs|probation|redundan\w*|starting a new)\b/', $text)) {
            $notes[] = ['field' => null, 'value' => null, 'fact' => 'Mentioned a recent or upcoming job change'];
        }

        if (preg_match('/\b(afterpay|zip ?pay|buy now,? pay later|bnpl)\b/', $text)) {
            $notes[] = ['field' => null, 'value' => null, 'fact' => 'Uses buy-now-pay-later services'];
        }

        if (preg_match('/\b(worried|worry|concerned|stress\w*|anxious)\b/', $text)) {
            $notes[] = ['field' => null, 'value' => null, 'fact' => 'Shared a financial concern for the broker to discuss'];
        }

        return $notes;
    }

    /**
     * @param  list<array{field: string|null, value: string|null, fact: string}>  $notes
     */
    private function nextQuestion(Application $application, array $notes): ?string
    {
        $answered = array_filter(array_column($notes, 'field'));

        foreach ($application->loan_pack->requiredFields() as $field) {
            if ($application->fact($field) === null && ! in_array($field, $answered, true) && isset(self::FIELD_QUESTIONS[$field])) {
                return self::FIELD_QUESTIONS[$field];
            }
        }

        return null;
    }

    private function lvrAnswer(Application $application): string
    {
        $value = $application->fact('property_value') ?? $application->fact('asset_price');

        if (! $value) {
            return 'LVR is the loan amount divided by the property value. Under 80% usually avoids lenders mortgage insurance. Tell me the property value and I will work yours out.';
        }

        $lvr = round($application->amount / $value * 100, 1);

        return "Your loan-to-value ratio is about {$lvr}%: ".Number::currency($application->amount, 'AUD', precision: 0).' against '.Number::currency($value, 'AUD', precision: 0).'. '
            .($lvr <= 80 ? 'That is at or under 80%, which many lenders treat as standard risk.' : 'Above 80%, most lenders add mortgage insurance, and some cap LVR lower.');
    }

    private function parseMoney(string $raw): ?int
    {
        $raw = str_replace([',', ' '], '', $raw);

        if (! preg_match('/^([\d.]+)([km]?)$/', $raw, $m) || ! is_numeric($m[1])) {
            return null;
        }

        return (int) round((float) $m[1] * match ($m[2]) {
            'k' => 1000,
            'm' => 1000000,
            default => 1,
        });
    }
}
