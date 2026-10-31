<?php

namespace App\Enums;

enum ConsentType: string
{
    case PersonalInformation = 'personal_information';
    case AutomatedProcessing = 'automated_processing';
    case CreditCheck = 'credit_check';
    case Biometric = 'biometric';
    case Recording = 'recording';
    case Marketing = 'marketing';

    public const TEXT_VERSION = '2026-10.1';

    public function title(): string
    {
        return match ($this) {
            self::PersonalInformation => 'Collect and use my personal information',
            self::AutomatedProcessing => 'AI-assisted analysis of my documents',
            self::CreditCheck => 'Run a soft credit check',
            self::Biometric => 'Verify my face against my ID',
            self::Recording => 'Keep transcripts of my advisor conversations',
            self::Marketing => 'Send me product news and offers',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PersonalInformation => 'Used only to assess lender fit and pass your application to a licensed broker.',
            self::AutomatedProcessing => 'Software reads and checks your documents. A person reviews anything uncertain. AI never approves or declines credit.',
            self::CreditCheck => 'A soft enquiry that does not affect your credit score.',
            self::Biometric => 'Your face scan is sensitive information. We keep only the result, not the scan.',
            self::Recording => 'Lets your broker read what you told the advisor. You can withdraw this later.',
            self::Marketing => 'Optional. Unsubscribe any time.',
        };
    }

    public function isRequired(): bool
    {
        return ! in_array($this, [self::Recording, self::Marketing], true);
    }
}
