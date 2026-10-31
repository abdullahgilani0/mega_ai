<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Http\Controllers\Controller;
use App\Models\Lender;
use App\Models\LenderDocument;
use App\Models\LenderProduct;
use App\Models\PolicyVersion;
use App\Models\RateSheet;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LenderController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'coverage' => ['nullable', Rule::enum(LenderCoverage::class)],
        ]);

        $lenders = Lender::query()
            ->with(['products:id,lender_id,loan_pack', 'products.rateSheets:id,lender_product_id,effective_from,expires_at'])
            ->withCount(['policyVersions as draft_count' => fn ($query) => $query->where('status', 'draft')])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($filters['coverage'] ?? null, fn ($query, $coverage) => $query->where('coverage', $coverage))
            ->orderBy('name')
            ->get()
            ->map(fn (Lender $lender) => [
                'id' => $lender->id,
                'name' => $lender->name,
                'category' => $lender->category,
                'color' => $lender->brand_color,
                'status' => $lender->status,
                'coverage' => $lender->coverage->value,
                'packs' => $lender->products->pluck('loan_pack')->map->value->unique()->values(),
                'staleRates' => $lender->products->contains(fn (LenderProduct $product) => $product->currentRateSheet()?->isStale() ?? true),
                'drafts' => $lender->draft_count,
                'lastReviewedAt' => $lender->last_reviewed_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/lenders/index', [
            'lenders' => $lenders,
            'filters' => $filters,
            'categories' => LenderCatalogController::CATEGORIES,
            'packs' => array_map(fn (LoanPack $pack) => ['value' => $pack->value, 'label' => $pack->label()], LoanPack::cases()),
        ]);
    }

    public function show(Lender $lender): Response
    {
        $lender->load(['products.rateSheets', 'policyVersions' => fn ($query) => $query->orderByDesc('version'), 'policyVersions.approver:id,name']);

        return Inertia::render('admin/lenders/show', [
            'lender' => [
                'id' => $lender->id,
                'name' => $lender->name,
                'category' => $lender->category,
                'abn' => $lender->abn,
                'licenceRef' => $lender->licence_ref,
                'color' => $lender->brand_color,
                'status' => $lender->status,
                'coverage' => $lender->coverage->value,
                'logoUsageApproved' => $lender->logo_usage_approved,
                'turnaroundDays' => $lender->turnaround_days,
            ],
            'products' => $lender->products->map(fn (LenderProduct $product) => [
                'id' => $product->id,
                'loanPack' => $product->loan_pack->value,
                'loanPackLabel' => $product->loan_pack->label(),
                'name' => $product->name,
                'features' => $product->features,
                'rateSheets' => $product->rateSheets->sortByDesc('effective_from')->values()->map(fn (RateSheet $sheet) => [
                    'id' => $sheet->id,
                    'rows' => $sheet->rows,
                    'fees' => $sheet->fees,
                    'effectiveFrom' => $sheet->effective_from->toDateString(),
                    'stale' => $sheet->isStale(),
                ]),
            ]),
            'documents' => $lender->documents()->latest('id')->get()->map(fn (LenderDocument $document) => [
                'id' => $document->id,
                'kind' => $document->kind,
                'kindLabel' => LenderDocument::KINDS[$document->kind] ?? $document->kind,
                'title' => $document->title,
                'version' => $document->version,
                'sha256' => $document->sha256,
                'sizeBytes' => $document->size_bytes,
                'effectiveFrom' => $document->effective_from->toDateString(),
            ]),
            'documentKinds' => collect(LenderDocument::KINDS)->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])->values(),
            'categories' => LenderCatalogController::CATEGORIES,
            'policies' => $lender->policyVersions->map(fn (PolicyVersion $policy) => [
                'id' => $policy->id,
                'loanPack' => $policy->loan_pack->value,
                'version' => $policy->version,
                'status' => $policy->status,
                'rules' => $policy->rules,
                'sourceDocument' => $policy->source_document,
                'createdBy' => $policy->created_by,
                'approver' => $policy->approver?->name,
                'publishedAt' => $policy->published_at?->toIso8601String(),
            ]),
        ]);
    }

    public function update(Request $request, Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['active', 'paused'])],
            'coverage' => ['sometimes', Rule::enum(LenderCoverage::class)],
            'logo_usage_approved' => ['sometimes', 'boolean'],
        ]);

        $before = $lender->only(array_keys($validated));
        $lender->update([...$validated, 'last_reviewed_at' => now()]);
        $audit->record('lender.updated', $lender, $before, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => $lender->name.' updated.']);

        return back();
    }
}
