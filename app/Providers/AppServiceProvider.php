<?php

namespace App\Providers;

use App\Enums\Permission;
use App\Models\User;
use App\Services\PlatformSettings;
use App\Services\Vendors\Contracts\AdvisorModel;
use App\Services\Vendors\Contracts\CreditBureau;
use App\Services\Vendors\Contracts\DocumentExtractor;
use App\Services\Vendors\Contracts\IdentityVerifier;
use App\Services\Vendors\Contracts\OpenBankingProvider;
use App\Services\Vendors\NullDocumentExtractor;
use App\Services\Vendors\RuleBasedAdvisor;
use App\Services\Vendors\Sandbox\SandboxCreditBureau;
use App\Services\Vendors\Sandbox\SandboxIdentityVerifier;
use App\Services\Vendors\Sandbox\SandboxOpenBanking;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Vendor adapters by contract and configured driver.
     *
     * @var array<class-string, array<string, class-string>>
     */
    private const VENDOR_DRIVERS = [
        IdentityVerifier::class => ['sandbox' => SandboxIdentityVerifier::class],
        CreditBureau::class => ['sandbox' => SandboxCreditBureau::class],
        OpenBankingProvider::class => ['sandbox' => SandboxOpenBanking::class],
        DocumentExtractor::class => ['none' => NullDocumentExtractor::class],
        AdvisorModel::class => ['rules' => RuleBasedAdvisor::class],
    ];

    private const VENDOR_CONFIG_KEYS = [
        IdentityVerifier::class => 'identity',
        CreditBureau::class => 'credit_bureau',
        OpenBankingProvider::class => 'open_banking',
        DocumentExtractor::class => 'extractor',
        AdvisorModel::class => 'advisor',
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        foreach (self::VENDOR_DRIVERS as $contract => $drivers) {
            $this->app->bind($contract, function ($app) use ($contract, $drivers) {
                $driver = config('mega.vendors.'.self::VENDOR_CONFIG_KEYS[$contract]);

                if (! isset($drivers[$driver])) {
                    throw new InvalidArgumentException("No [{$driver}] driver is registered for {$contract}.");
                }

                return $app->make($drivers[$driver]);
            });
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configurePermissions();

        $this->app->make(PlatformSettings::class)->applyOverrides();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Every permission becomes a gate; anything a role does not list is denied.
     */
    protected function configurePermissions(): void
    {
        foreach (Permission::cases() as $permission) {
            Gate::define($permission->value, fn (User $user) => $user->hasPermission($permission));
        }
    }
}
