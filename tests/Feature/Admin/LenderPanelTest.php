<?php

use App\Enums\LoanPack;
use App\Enums\Role;
use App\Models\GoldenScenario;
use App\Models\Lender;
use App\Models\PolicyVersion;
use App\Models\Territory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->analyst = User::factory()->role(Role::CreditAnalyst)->create();
});

it('creates a lender with a draft policy for each loan pack', function () {
    $this->actingAs($this->analyst)->post(route('admin.lenders.store'), [
        'name' => 'Test Mutual',
        'category' => 'credit_union',
        'brand_color' => '#123456',
        'turnaround_days' => 4,
        'loan_packs' => ['home', 'personal'],
    ]);

    $lender = Lender::where('name', 'Test Mutual')->sole();
    expect($lender->products()->count())->toBe(2)
        ->and($lender->policyVersions()->where('status', 'draft')->pluck('loan_pack')->map->value->sort()->values()->all())->toBe(['home', 'personal']);
});

it('imports lenders from CSV and skips duplicates and bad rows', function () {
    Lender::factory()->create(['name' => 'Existing Bank']);
    $csv = "name,category,abn,licence_ref,brand_color,turnaround_days,loan_packs\n"
        ."Fresh Lending,non_bank,,ACL 1,#112233,2,home|asset\n"
        ."Existing Bank,second_tier,,,#112233,3,home\n"
        ."No Packs Co,non_bank,,,#112233,3,\n";

    $this->actingAs($this->analyst)->post(route('admin.lenders.import'), [
        'file' => UploadedFile::fake()->createWithContent('lenders.csv', $csv),
    ])->assertSessionHas('inertia.flash_data.toast.message', '1 lenders imported. Skipped lines: 3, 4');

    expect(Lender::where('name', 'Fresh Lending')->sole()->products()->count())->toBe(2);
});

it('stores lender documents with version and fingerprint', function () {
    Storage::fake('local');
    $lender = Lender::factory()->create();

    foreach ([1, 2] as $i) {
        $this->actingAs($this->analyst)->post(route('admin.lender-documents.store', $lender), [
            'kind' => 'credit_policy',
            'title' => "Policy {$i}",
            'effective_from' => '2026-10-01',
            'file' => UploadedFile::fake()->create("policy{$i}.pdf", 50, 'application/pdf'),
        ]);
    }

    expect($lender->documents()->orderBy('version')->pluck('version')->all())->toBe([1, 2])
        ->and(strlen($lender->documents()->first()->sha256))->toBe(64);
});

it('adds a new effective-dated rate sheet without editing the old one', function () {
    $lender = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $product = $lender->products()->sole();

    $this->actingAs($this->analyst)->post(route('admin.rate-sheets.store', $product), [
        'rows' => [['max_lvr' => 80, 'rate_min' => 5.5, 'rate_max' => 5.9]],
        'fees' => ['establishment' => 0, 'annual' => 0],
        'effective_from' => now()->toDateString(),
    ]);

    expect($product->rateSheets()->count())->toBe(2)
        ->and($product->fresh()->load('rateSheets')->currentRateSheet()->rows[0]['rate_min'])->toEqual(5.5);
});

it('blocks publishing a policy change that breaks a golden scenario', function () {
    $lender = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules(maxLvr: 90))->create();
    GoldenScenario::create([
        'name' => '85% LVR buyer',
        'loan_pack' => LoanPack::Home,
        'scenario' => ['amount' => 680000, 'property_value' => 800000, 'credit_score' => 720, 'employment_type' => 'payg'],
        'expectations' => [(string) $lender->id => 'pass'],
    ]);
    $draft = PolicyVersion::create([
        'lender_id' => $lender->id,
        'loan_pack' => LoanPack::Home,
        'version' => 2,
        'rules' => homeLoanRules(maxLvr: 80),
        'status' => 'draft',
        'created_by' => $this->analyst->id,
    ]);

    $this->actingAs(User::factory()->role(Role::CreditAnalyst)->create())
        ->post(route('admin.policies.publish', $draft))
        ->assertSessionHasErrors(['publish' => 'Golden scenarios failed: 85% LVR buyer expected pass, got fail.']);

    expect($draft->fresh()->status)->toBe('draft');
});

it('parses territory postcode ranges', function () {
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)->post(route('admin.territories.store'), [
        'name' => 'Test region',
        'state' => 'NSW',
        'postcodes' => '2148-2150, 2765 2770',
    ]);

    expect(Territory::sole()->postcodes)->toBe(['2148', '2149', '2150', '2765', '2770']);

    $this->actingAs($admin)
        ->post(route('admin.territories.store'), ['name' => 'Bad', 'state' => 'NSW', 'postcodes' => '2000, abc'])
        ->assertSessionHasErrors(['postcodes' => '“abc” is not a postcode or range.']);
});
