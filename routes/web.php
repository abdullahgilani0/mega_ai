<?php

use App\Http\Controllers\Admin\LenderCatalogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MobileVerificationController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('verify-mobile', [MobileVerificationController::class, 'show'])->name('mobile.verify');
    Route::post('verify-mobile', [MobileVerificationController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('mobile.verify.store');
    Route::post('verify-mobile/resend', [MobileVerificationController::class, 'resend'])
        ->middleware('throttle:3,1')
        ->name('mobile.verify.resend');
});

Route::middleware(['auth', 'mobile.verified', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('notifications/{notification}', [NotificationController::class, 'open'])->name('notifications.open');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');

    Route::post('applications/{application}/messages', [MessageController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('messages.store');

    Route::get('files/documents/{document}', [FileController::class, 'document'])->middleware('throttle:60,1')->name('files.document');
    Route::get('files/signatures/{signature}', [FileController::class, 'signature'])->name('files.signature');
    Route::get('files/lender-documents/{document}', [LenderCatalogController::class, 'downloadDocument'])->name('files.lender-document');
});

require __DIR__.'/borrower.php';
require __DIR__.'/broker.php';
require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
