export type StageKey =
    | 'consent'
    | 'identity'
    | 'documents'
    | 'advisor'
    | 'assessment'
    | 'questions'
    | 'reveal'
    | 'sign'
    | 'finish'
    | 'submitted';

export type JourneySummary = {
    id: string;
    loanPack: 'home' | 'asset' | 'personal' | 'business';
    loanPackLabel: string;
    purpose: string;
    amount: number;
    termYears: number;
    state: string;
    postcode: string;
    stage: StageKey;
    stageLabel: string;
    status: string;
    statusLabel: string;
    createdAt: string;
    stages: {
        key: StageKey;
        label: string;
        reached: boolean;
        current: boolean;
    }[];
};

export type DocumentTile = {
    id: number;
    kind: string;
    kindLabel: string;
    name: string;
    status: 'queued' | 'reading' | 'verified' | 'in_review' | 'needs_attention';
    attentionReason: string | null;
    sizeBytes: number;
    uploadedAt: string;
    sha256?: string;
    mimeType?: string;
    authenticity?: {
        id: number;
        score: number;
        flagged: boolean;
        reasons: { code: string; detail: string; weight: number }[];
        decision: string | null;
    };
};

export type RuleResult = {
    id: string;
    label: string;
    clause: string;
    outcome: 'pass' | 'fail' | 'unsure';
    actual: unknown;
    required: unknown;
};

export type Serviceability = {
    net_monthly_income: number;
    expenses_declared: number;
    expenses_benchmark: number;
    expenses_used: number;
    liabilities_used: number;
    assessment_rate: number;
    repayment: number;
    surplus: number;
    max_borrowing: number;
    headroom_ratio: number;
};

export type MatchCard = {
    id: number;
    rank: number;
    intent: 'best_overall' | 'lowest_cost' | 'highest_confidence' | null;
    outcome: string;
    lender: {
        id: number;
        name: string;
        color: string;
        category: string;
        turnaroundDays: number;
        creditGuideId?: number | null;
    };
    product: { name: string; features: string[] } | null;
    policyVersion: number | null;
    rateMin: number | null;
    rateMax: number | null;
    rateEffectiveFrom: string | null;
    maxLvr: number | null;
    fees: { establishment: number; annual: number } | null;
    approvalConfidence: number | null;
    score: number | null;
    serviceability: Serviceability | null;
    explanation: string | null;
    rules: RuleResult[];
};

export type MegaEvent = {
    id: number;
    type: string;
    payload: Record<string, unknown> | null;
};

export type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};
