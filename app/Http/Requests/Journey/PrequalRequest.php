<?php

namespace App\Http\Requests\Journey;

use App\Enums\LoanPack;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PrequalRequest extends FormRequest
{
    /**
     * @var array<string, list<array{value: string, label: string}>>
     */
    public const PURPOSES = [
        'home' => [
            ['value' => 'first_home', 'label' => 'Buying my first home'],
            ['value' => 'next_home', 'label' => 'Buying my next home'],
            ['value' => 'investment', 'label' => 'Buying an investment property'],
            ['value' => 'refinance', 'label' => 'Refinancing'],
        ],
        'asset' => [
            ['value' => 'car_new', 'label' => 'New car'],
            ['value' => 'car_used', 'label' => 'Used car'],
            ['value' => 'equipment', 'label' => 'Equipment or machinery'],
        ],
        'personal' => [
            ['value' => 'debt_consolidation', 'label' => 'Consolidating debts'],
            ['value' => 'renovation', 'label' => 'Renovating'],
            ['value' => 'travel', 'label' => 'Travel or a big event'],
            ['value' => 'other', 'label' => 'Something else'],
        ],
        'business' => [
            ['value' => 'working_capital', 'label' => 'Working capital'],
            ['value' => 'business_equipment', 'label' => 'Equipment'],
            ['value' => 'expansion', 'label' => 'Growth or expansion'],
            ['value' => 'commercial_property', 'label' => 'Commercial property'],
        ],
    ];

    /**
     * @var list<string>
     */
    public const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

    /**
     * @var list<array{value: string, label: string}>
     */
    public const EMPLOYMENT_TYPES = [
        ['value' => 'payg', 'label' => 'Employee (PAYG)'],
        ['value' => 'self_employed', 'label' => 'Self-employed'],
        ['value' => 'contractor', 'label' => 'Contractor'],
        ['value' => 'casual', 'label' => 'Casual'],
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'loan_pack' => ['required', Rule::enum(LoanPack::class)],
            'amount' => ['required', 'integer', 'min:2000', 'max:20000000'],
            'purpose' => ['required', 'string'],
            'state' => ['required', Rule::in(self::STATES)],
            'postcode' => ['required', 'digits:4'],
            'employment_type' => ['required', Rule::in(array_column(self::EMPLOYMENT_TYPES, 'value'))],
            'is_joint' => ['boolean'],
        ];
    }

    /**
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $purposes = array_column(self::PURPOSES[$this->input('loan_pack')] ?? [], 'value');

                if (! in_array($this->input('purpose'), $purposes, true)) {
                    $validator->errors()->add('purpose', 'Choose what the loan is for.');
                }
            },
        ];
    }
}
