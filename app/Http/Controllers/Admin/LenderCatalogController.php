<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Http\Controllers\Controller;
use App\Models\Lender;
use App\Models\LenderDocument;
use App\Models\LenderProduct;
use App\Models\PolicyVersion;
use App\Services\AuditLogger;
use App\Services\Matching\PolicyTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Creating and maintaining lenders, their products, rate sheets and source documents.
 */
class LenderCatalogController extends Controller
{
    public const CATEGORIES = ['major_bank', 'second_tier', 'credit_union', 'non_bank', 'asset_finance', 'business'];

    /**
     * @return array<string, mixed>
     */
    private function profileRules(?Lender $lender = null): array
    {
        return [
            'name' => ['required', 'string', 'max:120', Rule::unique('lenders', 'name')->ignore($lender?->id)],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'abn' => ['nullable', 'regex:/^\d{2} ?\d{3} ?\d{3} ?\d{3}$/'],
            'licence_ref' => ['nullable', 'string', 'max:32'],
            'brand_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'turnaround_days' => ['required', 'integer', 'min:1', 'max:60'],
        ];
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            ...$this->profileRules(),
            'loan_packs' => ['required', 'array', 'min:1'],
            'loan_packs.*' => [Rule::enum(LoanPack::class)],
        ]);

        $lender = DB::transaction(function () use ($validated, $request) {
            $lender = Lender::create([
                ...Arr::except($validated, 'loan_packs'),
                'slug' => Str::slug($validated['name']),
                'coverage' => LenderCoverage::Unmapped,
                'status' => 'active',
            ]);

            foreach (array_unique($validated['loan_packs']) as $pack) {
                $this->addProduct($lender, LoanPack::from($pack), $lender->name.' '.LoanPack::from($pack)->label(), [], $request->user()->id);
            }

            return $lender;
        });

        $audit->record('lender.created', $lender, after: $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$lender->name} added. Its policies start as drafts until an analyst maps and approves them."]);

        return to_route('admin.lenders.show', $lender);
    }

    public function updateProfile(Request $request, Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate($this->profileRules($lender));
        $before = $lender->only(array_keys($validated));
        $lender->update([...$validated, 'last_reviewed_at' => now()]);
        $audit->record('lender.updated', $lender, $before, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lender profile saved.']);

        return back();
    }

    /**
     * CSV columns: name, category, abn, licence_ref, brand_color, turnaround_days, loan_packs (pipe separated).
     */
    public function import(Request $request, AuditLogger $audit): RedirectResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:2048']]);

        $rows = array_map('str_getcsv', file($request->file('file')->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []);
        $header = array_map(fn ($column) => Str::snake(trim((string) $column)), array_shift($rows) ?? []);
        [$created, $skipped] = [0, []];

        foreach ($rows as $line => $row) {
            $data = array_combine($header, array_pad($row, count($header), null)) ?: [];
            $packs = array_filter(array_map('trim', explode('|', (string) ($data['loan_packs'] ?? ''))), fn ($pack) => LoanPack::tryFrom($pack) !== null);
            $name = trim((string) ($data['name'] ?? ''));

            if ($name === '' || $packs === [] || Lender::where('name', $name)->exists() || ! in_array($data['category'] ?? '', self::CATEGORIES, true)) {
                $skipped[] = $line + 2;

                continue;
            }

            DB::transaction(function () use ($data, $name, $packs, $request) {
                $lender = Lender::create([
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'category' => $data['category'],
                    'abn' => $data['abn'] ?? null,
                    'licence_ref' => $data['licence_ref'] ?? null,
                    'brand_color' => preg_match('/^#[0-9A-Fa-f]{6}$/', (string) ($data['brand_color'] ?? '')) ? $data['brand_color'] : '#2D7DFF',
                    'turnaround_days' => max(1, (int) ($data['turnaround_days'] ?? 5)),
                    'coverage' => LenderCoverage::Unmapped,
                ]);

                foreach ($packs as $pack) {
                    $this->addProduct($lender, LoanPack::from($pack), $name.' '.LoanPack::from($pack)->label(), [], $request->user()->id);
                }
            });
            $created++;
        }

        $audit->record('lender.imported', null, after: ['created' => $created, 'skipped_lines' => $skipped]);

        Inertia::flash('toast', ['type' => $skipped ? 'warning' : 'success', 'message' => "{$created} lenders imported".($skipped ? '. Skipped lines: '.implode(', ', $skipped) : '.')]);

        return back();
    }

    public function storeProduct(Request $request, Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'loan_pack' => ['required', Rule::enum(LoanPack::class)],
            'name' => ['required', 'string', 'max:120'],
            'features' => ['array'],
            'features.*' => ['string', 'max:40'],
        ]);

        $product = $this->addProduct($lender, LoanPack::from($validated['loan_pack']), $validated['name'], $validated['features'] ?? [], $request->user()->id);
        $audit->record('lender.product_added', $product);

        return back();
    }

    public function updateProduct(Request $request, LenderProduct $product, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'features' => ['array'],
            'features.*' => ['string', 'max:40'],
        ]);

        $before = $product->only(['name', 'features']);
        $product->update(['name' => $validated['name'], 'features' => array_values($validated['features'] ?? [])]);
        $audit->record('lender.product_updated', $product, $before, $validated);

        return back();
    }

    /**
     * Rate sheets are append-only: a new effective-dated version replaces the old one.
     */
    public function storeRateSheet(Request $request, LenderProduct $product, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.max_lvr' => ['required', 'numeric', 'min:1', 'max:1000'],
            'rows.*.rate_min' => ['required', 'numeric', 'min:0', 'max:40'],
            'rows.*.rate_max' => ['required', 'numeric', 'gte:rows.*.rate_min', 'max:40'],
            'fees.establishment' => ['required', 'integer', 'min:0'],
            'fees.annual' => ['required', 'integer', 'min:0'],
            'effective_from' => ['required', 'date'],
        ]);

        $sheet = $product->rateSheets()->create([
            'rows' => $this->rateRows($validated['rows']),
            'fees' => ['establishment' => (int) $validated['fees']['establishment'], 'annual' => (int) $validated['fees']['annual']],
            'effective_from' => $validated['effective_from'],
        ]);

        $audit->record('lender.rate_sheet_added', $sheet, after: ['product_id' => $product->id, 'effective_from' => $validated['effective_from']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'New rate sheet saved. Assessments use the latest effective sheet.']);

        return back();
    }

    public function storeDocument(Request $request, Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'kind' => ['required', Rule::in(array_keys(LenderDocument::KINDS))],
            'title' => ['required', 'string', 'max:160'],
            'effective_from' => ['required', 'date'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,csv,txt', 'max:25600'],
        ]);

        $file = $request->file('file');
        $document = $lender->documents()->create([
            'kind' => $validated['kind'],
            'title' => $validated['title'],
            'storage_path' => $file->store('lenders/'.$lender->slug, 'local'),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'sha256' => hash_file('sha256', $file->getRealPath()),
            'version' => $lender->documents()->where('kind', $validated['kind'])->max('version') + 1,
            'effective_from' => $validated['effective_from'],
            'uploaded_by' => $request->user()->id,
        ]);

        $audit->record('lender.document_uploaded', $document, after: ['kind' => $document->kind, 'version' => $document->version, 'sha256' => $document->sha256]);

        return back();
    }

    public function downloadDocument(Request $request, LenderDocument $document, AuditLogger $audit): StreamedResponse
    {
        abort_unless($document->kind === 'credit_guide' || $request->user()->can('lenders.manage'), 404);
        $audit->record('lender.document_downloaded', $document);

        return Storage::disk('local')->download($document->storage_path, Str::slug($document->title).'.'.pathinfo($document->storage_path, PATHINFO_EXTENSION));
    }

    public function archive(Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $lender->update(['status' => 'archived']);
        $audit->record('lender.archived', $lender);

        Inertia::flash('toast', ['type' => 'info', 'message' => "{$lender->name} archived. It is excluded from new assessments; history is kept."]);

        return back();
    }

    /**
     * Every draft policy across the panel, oldest first: the review queue.
     */
    public function reviews(): Response
    {
        return Inertia::render('admin/lenders/reviews', [
            'drafts' => PolicyVersion::with(['lender:id,name,brand_color', 'creator:id,name'])
                ->where('status', 'draft')
                ->oldest()
                ->get()
                ->map(function (PolicyVersion $draft) {
                    $published = PolicyVersion::where('lender_id', $draft->lender_id)->where('loan_pack', $draft->loan_pack)->where('status', 'published')->first();
                    $before = collect($published->rules ?? [])->keyBy('id');

                    return [
                        'id' => $draft->id,
                        'lenderId' => $draft->lender_id,
                        'lender' => $draft->lender->name,
                        'color' => $draft->lender->brand_color,
                        'loanPack' => $draft->loan_pack->value,
                        'version' => $draft->version,
                        'source' => $draft->source_document,
                        'author' => $draft->creator->name ?? 'Automated ingestion',
                        'createdAt' => $draft->created_at?->toIso8601String(),
                        'changes' => collect($draft->rules)
                            ->filter(fn (array $rule) => ($before[$rule['id']]['value'] ?? null) != $rule['value'])
                            ->map(fn (array $rule) => [
                                'id' => $rule['id'],
                                'label' => $rule['label'],
                                'from' => $before[$rule['id']]['value'] ?? null,
                                'to' => $rule['value'],
                            ])->values(),
                    ];
                }),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return list<array{max_lvr: float, rate_min: float, rate_max: float}>
     */
    private function rateRows(array $rows): array
    {
        $clean = [];

        foreach ($rows as $row) {
            $clean[] = [
                'max_lvr' => (float) $row['max_lvr'],
                'rate_min' => (float) $row['rate_min'],
                'rate_max' => (float) $row['rate_max'],
            ];
        }

        usort($clean, fn (array $a, array $b) => $a['max_lvr'] <=> $b['max_lvr']);

        return $clean;
    }

    /**
     * @param  list<string>  $features
     */
    private function addProduct(Lender $lender, LoanPack $pack, string $name, array $features, int $userId): LenderProduct
    {
        $product = $lender->products()->create(['loan_pack' => $pack, 'name' => $name, 'features' => $features]);

        if (! $lender->policyVersions()->where('loan_pack', $pack)->exists()) {
            $lender->policyVersions()->create([
                'loan_pack' => $pack,
                'version' => 1,
                'rules' => PolicyTemplates::for($pack),
                'status' => 'draft',
                'source_document' => 'Template: map from the lender’s credit policy',
                'created_by' => $userId,
            ]);
        }

        return $product;
    }
}
