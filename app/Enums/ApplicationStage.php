<?php

namespace App\Enums;

enum ApplicationStage: string
{
    case Consent = 'consent';
    case Identity = 'identity';
    case Documents = 'documents';
    case Advisor = 'advisor';
    case Assessment = 'assessment';
    case Questions = 'questions';
    case Reveal = 'reveal';
    case Sign = 'sign';
    case Finish = 'finish';
    case Submitted = 'submitted';

    public function label(): string
    {
        return match ($this) {
            self::Consent => 'Consent',
            self::Identity => 'Identity',
            self::Documents => 'Documents',
            self::Advisor => 'Your situation',
            self::Assessment => 'MEGA assessment',
            self::Questions => 'Questions',
            self::Reveal => 'Your matches',
            self::Sign => 'Credit guide & signature',
            self::Finish => 'Finish',
            self::Submitted => 'With your broker',
        };
    }

    public function routeName(): string
    {
        return match ($this) {
            self::Submitted => 'dashboard',
            default => 'journey.'.$this->value,
        };
    }

    public function position(): int
    {
        return (int) array_search($this, self::cases(), true);
    }

    public function isAfter(self $other): bool
    {
        return $this->position() > $other->position();
    }
}
