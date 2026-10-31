<?php

use App\Http\Controllers\Admin\AccessController;
use App\Http\Controllers\Admin\AllocationController;
use App\Http\Controllers\Admin\ApplicationController;
use App\Http\Controllers\Admin\ApprovalController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthenticityController;
use App\Http\Controllers\Admin\BrokerController;
use App\Http\Controllers\Admin\DataRequestController;
use App\Http\Controllers\Admin\GoldenScenarioController;
use App\Http\Controllers\Admin\LenderCatalogController;
use App\Http\Controllers\Admin\LenderController;
use App\Http\Controllers\Admin\OverviewController;
use App\Http\Controllers\Admin\PolicyVersionController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\TerritoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WorkQueueController;
use Illuminate\Support\Facades\Route;

/*
| Staff console. Every route declares the permission it needs; a test fails the
| build if one does not.
*/
Route::middleware(['auth', 'verified', 'staff.mfa', 'can:console.access'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', OverviewController::class)->name('overview');

    Route::middleware('can:applications.view_all')->group(function () {
        Route::get('applications', [ApplicationController::class, 'index'])->name('applications.index');
        Route::get('applications/{application}', [ApplicationController::class, 'show'])->name('applications.show');
        Route::post('applications/{application}/access', [AccessController::class, 'store'])->middleware('throttle:20,1')->name('access.store');
    });

    Route::middleware('can:access.break_glass')->group(function () {
        Route::post('applications/{application}/break-glass', [AccessController::class, 'breakGlass'])->name('access.break-glass');
        Route::post('access/{grant}/revoke', [AccessController::class, 'revoke'])->name('access.revoke');
        Route::post('access/{grant}/review', [AccessController::class, 'review'])->name('access.review');
    });

    Route::get('access', [AccessController::class, 'index'])->middleware('can:audit.view')->name('access.index');

    Route::middleware('can:documents.review')->group(function () {
        Route::get('work-queue', [WorkQueueController::class, 'index'])->name('work-queue.index');
        Route::post('work-queue/identity/{check}', [WorkQueueController::class, 'decideIdentity'])->name('work-queue.identity');
        Route::post('work-queue/gaps/{gap}', [WorkQueueController::class, 'resolveGap'])->name('work-queue.gap');
    });

    Route::middleware('can:lenders.manage')->group(function () {
        Route::get('lenders', [LenderController::class, 'index'])->name('lenders.index');
        Route::post('lenders', [LenderCatalogController::class, 'store'])->name('lenders.store');
        Route::post('lenders/import', [LenderCatalogController::class, 'import'])->name('lenders.import');
        Route::get('lenders/{lender}', [LenderController::class, 'show'])->name('lenders.show');
        Route::patch('lenders/{lender}', [LenderController::class, 'update'])->name('lenders.update');
        Route::patch('lenders/{lender}/profile', [LenderCatalogController::class, 'updateProfile'])->name('lenders.profile');
        Route::post('lenders/{lender}/archive', [LenderCatalogController::class, 'archive'])->name('lenders.archive');
        Route::post('lenders/{lender}/products', [LenderCatalogController::class, 'storeProduct'])->name('products.store');
        Route::patch('products/{product}', [LenderCatalogController::class, 'updateProduct'])->name('products.update');
        Route::post('products/{product}/rate-sheets', [LenderCatalogController::class, 'storeRateSheet'])->name('rate-sheets.store');
        Route::post('lenders/{lender}/documents', [LenderCatalogController::class, 'storeDocument'])->name('lender-documents.store');
        Route::post('lenders/{lender}/policies', [PolicyVersionController::class, 'store'])->name('policies.store');
        Route::patch('policies/{policyVersion}', [PolicyVersionController::class, 'update'])->name('policies.update');
        Route::get('policy-reviews', [LenderCatalogController::class, 'reviews'])->name('policies.reviews');
        Route::get('golden-scenarios', [GoldenScenarioController::class, 'index'])->name('golden.index');
        Route::post('golden-scenarios', [GoldenScenarioController::class, 'store'])->name('golden.store');
        Route::delete('golden-scenarios/{goldenScenario}', [GoldenScenarioController::class, 'destroy'])->name('golden.destroy');
    });

    Route::post('policies/{policyVersion}/publish', [PolicyVersionController::class, 'publish'])
        ->middleware('can:policies.publish')
        ->name('policies.publish');

    Route::middleware('can:authenticity.view')->group(function () {
        Route::get('authenticity', [AuthenticityController::class, 'index'])->name('authenticity.index');
        Route::post('authenticity/{report}', [AuthenticityController::class, 'review'])->name('authenticity.review');
    });

    Route::middleware('can:allocations.manage')->group(function () {
        Route::get('allocations', [AllocationController::class, 'index'])->name('allocations.index');
        Route::post('allocations/{application}', [AllocationController::class, 'reassign'])->name('allocations.reassign');
    });

    Route::middleware('can:brokers.manage')->group(function () {
        Route::get('brokers', [BrokerController::class, 'index'])->name('brokers.index');
        Route::post('brokers', [BrokerController::class, 'store'])->name('brokers.store');
        Route::patch('brokers/{broker}', [BrokerController::class, 'update'])->name('brokers.update');
        Route::get('territories', [TerritoryController::class, 'index'])->name('territories.index');
        Route::post('territories', [TerritoryController::class, 'store'])->name('territories.store');
        Route::patch('territories/{territory}', [TerritoryController::class, 'update'])->name('territories.update');
        Route::delete('territories/{territory}', [TerritoryController::class, 'destroy'])->name('territories.destroy');
    });

    Route::get('reports', ReportController::class)->middleware('can:reports.view')->name('reports.index');

    Route::middleware('can:audit.view')->group(function () {
        Route::get('audit', [AuditLogController::class, 'index'])->name('audit.index');
        Route::post('audit/export', [AuditLogController::class, 'requestExport'])->name('audit.export');
        Route::get('audit/export/{export}', [AuditLogController::class, 'download'])->name('audit.download');
    });

    Route::middleware('can:users.manage')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::patch('users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
    });
    Route::patch('users/{user}/role', [UserController::class, 'updateRole'])->middleware('can:roles.assign')->name('users.role');

    Route::middleware('can:privacy.requests')->group(function () {
        Route::get('data-requests', [DataRequestController::class, 'index'])->name('data-requests.index');
        Route::patch('data-requests/{dataRequest}', [DataRequestController::class, 'update'])->name('data-requests.update');
    });

    Route::middleware('can:approvals.review')->group(function () {
        Route::get('approvals', [ApprovalController::class, 'index'])->name('approvals.index');
        Route::post('approvals/{approval}', [ApprovalController::class, 'decide'])->name('approvals.decide');
    });

    Route::middleware('can:settings.manage')->group(function () {
        Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::patch('settings', [SettingsController::class, 'update'])->name('settings.update');
    });
});
