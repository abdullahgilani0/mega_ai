<?php

namespace App\Models;

use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\LoanPack;
use Carbon\CarbonImmutable as Carbon;
use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * The central record of one borrower journey. Each stage is resumable.
 *
 * @property int $id
 * @property string $public_id
 * @property int $user_id
 * @property LoanPack $loan_pack
 * @property string $purpose
 * @property int $amount
 * @property int $term_years
 * @property string $state
 * @property string $postcode
 * @property string $employment_type
 * @property bool $is_joint
 * @property ApplicationStage $stage
 * @property ApplicationStatus $status
 * @property array<string, mixed> $data
 * @property array<string, string> $provenance
 * @property int|null $broker_id
 * @property int|null $selected_match_result_id
 * @property Carbon|null $broker_reviewed_at
 * @property Carbon|null $submitted_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $user
 * @property-read Broker|null $broker
 * @property-read MatchRun|null $latestMatchRun
 * @property-read MatchResult|null $selectedMatch
 * @property-read int|null $escalated_count
 */
#[Fillable(['user_id', 'loan_pack', 'purpose', 'amount', 'term_years', 'state', 'postcode', 'employment_type', 'is_joint', 'stage', 'status', 'data', 'provenance', 'broker_id', 'selected_match_result_id', 'broker_reviewed_at', 'submitted_at'])]
class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use HasFactory, HasUlids;

    protected $attributes = [
        'data' => '{}',
        'provenance' => '{}',
    ];

    protected function casts(): array
    {
        return [
            'loan_pack' => LoanPack::class,
            'stage' => ApplicationStage::class,
            'status' => ApplicationStatus::class,
            'is_joint' => 'boolean',
            'data' => 'array',
            'provenance' => 'array',
            'broker_reviewed_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['public_id'];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /**
     * Record a canonical value and where it came from.
     */
    public function setFact(string $field, mixed $value, string $source): void
    {
        $this->data = [...$this->data, $field => $value];
        $this->provenance = [...$this->provenance, $field => $source];
    }

    public function fact(string $field): mixed
    {
        return $this->data[$field] ?? null;
    }

    /**
     * Move forward to the given stage; never moves backwards.
     */
    public function advanceTo(ApplicationStage $stage): void
    {
        if ($stage->isAfter($this->stage)) {
            $this->stage = $stage;
            $this->save();
        }
    }

    public function hasReached(ApplicationStage $stage): bool
    {
        return $this->stage === $stage || $this->stage->isAfter($stage);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Broker, $this>
     */
    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }

    /**
     * @return HasMany<ApplicationEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class);
    }

    /**
     * @return HasMany<Consent, $this>
     */
    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /**
     * @return HasMany<IdentityCheck, $this>
     */
    public function identityChecks(): HasMany
    {
        return $this->hasMany(IdentityCheck::class);
    }

    /**
     * @return HasOne<IdentityCheck, $this>
     */
    public function latestIdentityCheck(): HasOne
    {
        return $this->hasOne(IdentityCheck::class)->latestOfMany();
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * @return HasOne<CreditReport, $this>
     */
    public function creditReport(): HasOne
    {
        return $this->hasOne(CreditReport::class)->latestOfMany();
    }

    /**
     * @return HasMany<AdvisorMessage, $this>
     */
    public function advisorMessages(): HasMany
    {
        return $this->hasMany(AdvisorMessage::class);
    }

    /**
     * @return HasMany<AdvisorNote, $this>
     */
    public function advisorNotes(): HasMany
    {
        return $this->hasMany(AdvisorNote::class);
    }

    /**
     * @return HasMany<MatchRun, $this>
     */
    public function matchRuns(): HasMany
    {
        return $this->hasMany(MatchRun::class);
    }

    /**
     * @return HasOne<MatchRun, $this>
     */
    public function latestMatchRun(): HasOne
    {
        return $this->hasOne(MatchRun::class)->latestOfMany();
    }

    /**
     * @return HasMany<ApplicationGap, $this>
     */
    public function gaps(): HasMany
    {
        return $this->hasMany(ApplicationGap::class);
    }

    /**
     * @return BelongsTo<MatchResult, $this>
     */
    public function selectedMatch(): BelongsTo
    {
        return $this->belongsTo(MatchResult::class, 'selected_match_result_id');
    }

    /**
     * @return HasMany<Signature, $this>
     */
    public function signatures(): HasMany
    {
        return $this->hasMany(Signature::class);
    }

    /**
     * @return HasMany<Allocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    /**
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * @return HasMany<CoBorrower, $this>
     */
    public function coBorrowers(): HasMany
    {
        return $this->hasMany(CoBorrower::class);
    }

    /**
     * @return HasMany<AccessGrant, $this>
     */
    public function accessGrants(): HasMany
    {
        return $this->hasMany(AccessGrant::class);
    }

    public function hasCoBorrower(User $user): bool
    {
        return $this->coBorrowers()->where('user_id', $user->id)->whereNotNull('accepted_at')->exists();
    }
}
