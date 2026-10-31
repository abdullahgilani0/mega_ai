<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LoanPack;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\Territory;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AustralianMobile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BrokerController extends Controller
{
    public const SKILLS = ['first_home_buyers', 'investors', 'refinance', 'self_employed', 'business_lending', 'asset_finance', 'construction', 'smsf'];

    public function index(): Response
    {
        return Inertia::render('admin/brokers', [
            'brokers' => Broker::with(['user:id,name,email,mobile', 'territories'])->get()->map(fn (Broker $broker) => [
                'id' => $broker->id,
                'name' => $broker->user->name,
                'email' => $broker->user->email,
                'mobile' => $broker->user->mobile,
                'business' => $broker->business_name,
                'licenceRef' => $broker->licence_ref,
                'status' => $broker->status,
                'loanPacks' => $broker->loan_packs,
                'skills' => $broker->skills,
                'languages' => $broker->languages,
                'capacity' => $broker->capacity,
                'open' => $broker->openApplicationCount(),
                'acceptanceRate' => $broker->acceptance_rate,
                'avgFirstContactMinutes' => $broker->avg_first_contact_minutes,
                'territories' => $broker->territories->map(fn (Territory $territory) => [
                    'id' => $territory->id,
                    'name' => $territory->name,
                    'coverage' => $territory->pivot->coverage,
                ]),
                'lastAllocatedAt' => $broker->last_allocated_at?->toIso8601String(),
            ]),
            'territories' => Territory::orderBy('name')->get(['id', 'name', 'state']),
            'skills' => self::SKILLS,
            'packs' => array_map(fn (LoanPack $pack) => ['value' => $pack->value, 'label' => $pack->label()], LoanPack::cases()),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $request->merge(['mobile' => AustralianMobile::normalise((string) $request->input('mobile'))]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique(User::class)],
            'mobile' => ['required', 'regex:'.AustralianMobile::PATTERN, Rule::unique(User::class)],
            ...$this->profileRules(),
        ]);

        $broker = DB::transaction(function () use ($validated) {
            $user = User::create(['name' => $validated['name'], 'email' => $validated['email'], 'mobile' => $validated['mobile'], 'password' => Str::password(32)]);
            $user->forceFill(['role' => Role::Broker, 'email_verified_at' => now(), 'mobile_verified_at' => now()])->save();

            $broker = Broker::create(['user_id' => $user->id, ...$this->profileAttributes($validated)]);
            $this->syncTerritories($broker, $validated['territories'] ?? []);

            return $broker;
        });

        Password::sendResetLink(['email' => $validated['email']]);
        $audit->record('broker.created', $broker, after: ['email' => $validated['email']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Broker added and invited to set a password.']);

        return back();
    }

    public function update(Request $request, Broker $broker, AuditLogger $audit): RedirectResponse
    {
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate(['status' => ['required', Rule::in(['active', 'paused', 'leave'])]]);
            $before = ['status' => $broker->status];
            $broker->update($validated);
            $audit->record('broker.updated', $broker, $before, $validated);

            return back();
        }

        $validated = $request->validate($this->profileRules());
        $before = $broker->only(['licence_ref', 'business_name', 'loan_packs', 'skills', 'languages', 'capacity']);
        $broker->update($this->profileAttributes($validated));
        $this->syncTerritories($broker, $validated['territories'] ?? []);
        $audit->record('broker.updated', $broker, $before, $this->profileAttributes($validated));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Broker profile saved.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function profileRules(): array
    {
        return [
            'licence_ref' => ['required', 'string', 'max:32'],
            'business_name' => ['nullable', 'string', 'max:160'],
            'loan_packs' => ['required', 'array', 'min:1'],
            'loan_packs.*' => [Rule::enum(LoanPack::class)],
            'skills' => ['array'],
            'skills.*' => [Rule::in(self::SKILLS)],
            'languages' => ['required', 'array', 'min:1'],
            'languages.*' => ['string', 'max:40'],
            'capacity' => ['required', 'integer', 'min:0', 'max:200'],
            'territories' => ['array'],
            'territories.*.id' => ['required', 'exists:territories,id'],
            'territories.*.coverage' => ['required', Rule::in(['primary', 'secondary'])],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function profileAttributes(array $validated): array
    {
        return [
            'licence_ref' => $validated['licence_ref'],
            'business_name' => $validated['business_name'] ?? null,
            'loan_packs' => array_values(array_unique($validated['loan_packs'])),
            'skills' => array_values($validated['skills'] ?? []),
            'languages' => array_values(array_filter(array_map('trim', $validated['languages']))),
            'capacity' => (int) $validated['capacity'],
        ];
    }

    /**
     * @param  list<array{id: int|string, coverage: string}>  $territories
     */
    private function syncTerritories(Broker $broker, array $territories): void
    {
        $broker->territories()->sync(
            collect($territories)->mapWithKeys(fn (array $row) => [(int) $row['id'] => ['coverage' => $row['coverage']]])->all(),
        );
    }
}
