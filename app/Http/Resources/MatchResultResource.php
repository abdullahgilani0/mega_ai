<?php

namespace App\Http\Resources;

use App\Models\MatchResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MatchResult
 */
class MatchResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $rules = collect($this->rule_results);
        $lvrRule = $rules->first(fn (array $rule) => $rule['field'] === 'lvr' && $rule['op'] === 'lte');

        return [
            'id' => $this->id,
            'rank' => $this->rank,
            'intent' => $this->intent,
            'outcome' => $this->outcome->value,
            'lender' => [
                'id' => $this->lender->id,
                'name' => $this->lender->name,
                'color' => $this->lender->brand_color,
                'category' => $this->lender->category,
                'turnaroundDays' => $this->lender->turnaround_days,
                'creditGuideId' => $this->lender->documents()->where('kind', 'credit_guide')->latest('version')->value('id'),
            ],
            'product' => $this->product ? [
                'name' => $this->product->name,
                'features' => $this->product->features,
            ] : null,
            'policyVersion' => $this->policyVersion?->version,
            'rateMin' => $this->rate_min,
            'rateMax' => $this->rate_max,
            'rateEffectiveFrom' => $this->rate_effective_from?->toDateString(),
            'maxLvr' => $lvrRule['required'] ?? null,
            'fees' => $this->fees,
            'approvalConfidence' => $this->approval_confidence,
            'score' => $this->score,
            'serviceability' => $this->serviceability,
            'explanation' => $this->explanation,
            'rules' => $rules->map(fn (array $rule) => [
                'id' => $rule['id'],
                'label' => $rule['label'],
                'clause' => $rule['clause'],
                'outcome' => $rule['outcome'],
                'actual' => $rule['actual'],
                'required' => $rule['required'],
            ])->values()->all(),
        ];
    }
}
