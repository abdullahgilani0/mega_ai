<?php

namespace App\Enums;

enum DocumentKind: string
{
    case DriverLicence = 'driver_licence';
    case Passport = 'passport';
    case Payslip = 'payslip';
    case BankStatement = 'bank_statement';
    case TaxReturn = 'tax_return';
    case Bas = 'bas';
    case ContractOfSale = 'contract_of_sale';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::DriverLicence => 'Driver licence',
            self::Passport => 'Passport',
            self::Payslip => 'Payslip',
            self::BankStatement => 'Bank statement',
            self::TaxReturn => 'Tax return / notice of assessment',
            self::Bas => 'Business activity statement',
            self::ContractOfSale => 'Contract of sale',
            self::Other => 'Other document',
        };
    }

    public function isIdentity(): bool
    {
        return $this === self::DriverLicence || $this === self::Passport;
    }
}
