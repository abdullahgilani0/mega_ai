<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Credit licensee shown on disclosures
    |--------------------------------------------------------------------------
    |
    | Decision needed: own Australian Credit Licence or credit representative
    | arrangement. Placeholders until legal confirms.
    |
    */

    'licensee' => [
        'name' => env('MEGA_LICENSEE_NAME', '[Licensee name to be confirmed]'),
        'licence_number' => env('MEGA_LICENCE_NUMBER', '[ACL number to be confirmed]'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Contact verification (stage 1)
    |--------------------------------------------------------------------------
    */

    'otp' => [
        'ttl_minutes' => 5,
        'max_attempts' => 5,
        'resend_seconds' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Identity verification (stage 3)
    |--------------------------------------------------------------------------
    */

    'identity' => [
        'max_attempts' => 3,
        'handoff_minutes' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Document authenticity (admin and credit analyst only)
    |--------------------------------------------------------------------------
    |
    | Scores at or above the threshold route the document to the human review
    | queue. The score never declines a borrower and is never shown to them.
    |
    */

    'authenticity' => [
        'review_threshold' => 50,
    ],

    /*
    |--------------------------------------------------------------------------
    | Matching engine
    |--------------------------------------------------------------------------
    */

    'matching' => [
        'max_rate_age_days' => 120,
        'weights' => [
            'approval_confidence' => 0.40,
            'cost' => 0.30,
            'speed' => 0.15,
            'feature_fit' => 0.15,
        ],
        'max_open_gaps_shown' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Broker allocation
    |--------------------------------------------------------------------------
    */

    'allocation' => [
        'offer_window_minutes' => 15,
        'weights' => [
            'territory' => 0.35,
            'skill' => 0.20,
            'capacity' => 0.15,
            'responsiveness' => 0.15,
            'fairness' => 0.15,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security, access and retention
    |--------------------------------------------------------------------------
    */

    'security' => [
        'require_staff_mfa' => (bool) env('MEGA_REQUIRE_STAFF_MFA', false),
        'signing_step_up_minutes' => 15,
    ],

    'access' => [
        'grant_minutes' => 60,
        'break_glass_minutes' => 30,
    ],

    'retention' => [
        'id_images_days' => 30,
        'advisor_transcripts_days' => 730,
    ],

    'reminders' => [
        'after_hours' => 24,
    ],

    /*
    |--------------------------------------------------------------------------
    | Vendor adapters
    |--------------------------------------------------------------------------
    |
    | Every external provider sits behind an interface. The "sandbox" drivers
    | are deterministic stand-ins for local development and tests; swap them
    | for certified vendors (identity, CDR open banking, credit bureau, OCR,
    | language model) without touching the core.
    |
    */

    'vendors' => [
        'identity' => env('MEGA_IDENTITY_DRIVER', 'sandbox'),
        'credit_bureau' => env('MEGA_CREDIT_DRIVER', 'sandbox'),
        'open_banking' => env('MEGA_OPEN_BANKING_DRIVER', 'sandbox'),
        'extractor' => env('MEGA_EXTRACTOR_DRIVER', 'none'),
        'advisor' => env('MEGA_ADVISOR_DRIVER', 'rules'),
    ],

];
