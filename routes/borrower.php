<?php

use App\Http\Controllers\Journey\AdvisorController;
use App\Http\Controllers\Journey\AssessmentController;
use App\Http\Controllers\Journey\CoBorrowerController;
use App\Http\Controllers\Journey\ConsentController;
use App\Http\Controllers\Journey\DocumentController;
use App\Http\Controllers\Journey\FinishController;
use App\Http\Controllers\Journey\IdentityController;
use App\Http\Controllers\Journey\IdentityHandoffController;
use App\Http\Controllers\Journey\JourneyController;
use App\Http\Controllers\Journey\PrequalController;
use App\Http\Controllers\Journey\QuestionController;
use App\Http\Controllers\Journey\RevealController;
use App\Http\Controllers\Journey\SignatureController;
use App\Http\Controllers\PrivacyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'mobile.verified', 'verified', 'can:loan.apply'])->group(function () {
    Route::get('apply', [PrequalController::class, 'create'])->name('apply.create');
    Route::post('apply', [PrequalController::class, 'store'])->name('apply.store');

    Route::get('privacy', [PrivacyController::class, 'show'])->name('privacy.show');
    Route::get('privacy/export', [PrivacyController::class, 'export'])->middleware('throttle:3,1')->name('privacy.export');
    Route::post('privacy/deletion-request', [PrivacyController::class, 'requestDeletion'])->name('privacy.deletion');
    Route::delete('privacy/consents/{consent}', [PrivacyController::class, 'revokeConsent'])->name('privacy.consents.revoke');
    Route::post('avatar/reroll', [PrivacyController::class, 'rerollAvatar'])->name('avatar.reroll');

    Route::prefix('applications/{application}')->name('journey.')->group(function () {
        Route::get('/', [JourneyController::class, 'resume'])->name('resume');
        Route::delete('/', [JourneyController::class, 'withdraw'])->name('withdraw');

        Route::get('consent', [ConsentController::class, 'show'])->name('consent');
        Route::post('consent', [ConsentController::class, 'store'])->name('consent.store');

        Route::get('identity', [IdentityController::class, 'show'])->name('identity');
        Route::post('identity', [IdentityController::class, 'start'])->name('identity.start');
        Route::post('identity/complete', [IdentityController::class, 'complete'])->name('identity.complete');

        Route::get('documents', [DocumentController::class, 'index'])->name('documents');
        Route::post('documents', [DocumentController::class, 'store'])->middleware('throttle:30,1')->name('documents.store');
        Route::post('documents/bank', [DocumentController::class, 'connectBank'])->name('documents.bank');
        Route::post('documents/continue', [DocumentController::class, 'continue'])->name('documents.continue');

        Route::get('advisor', [AdvisorController::class, 'show'])->name('advisor');
        Route::post('advisor/messages', [AdvisorController::class, 'message'])->middleware('throttle:30,1')->name('advisor.message');
        Route::patch('advisor/notes/{note}', [AdvisorController::class, 'update'])->name('advisor.notes.update');
        Route::post('advisor/continue', [AdvisorController::class, 'continue'])->name('advisor.continue');

        Route::get('assessment', [AssessmentController::class, 'show'])->name('assessment');
        Route::post('assessment', [AssessmentController::class, 'store'])->middleware('throttle:10,1')->name('assessment.store');

        Route::get('questions', [QuestionController::class, 'index'])->name('questions');
        Route::post('questions/{gap}', [QuestionController::class, 'resolve'])->name('questions.resolve');

        Route::get('matches', [RevealController::class, 'show'])->name('reveal');
        Route::post('matches', [RevealController::class, 'select'])->name('reveal.select');

        Route::post('co-borrowers', [CoBorrowerController::class, 'store'])->middleware('throttle:10,1')->name('co-borrowers.store');

        Route::get('sign', [SignatureController::class, 'index'])->name('sign');
        Route::post('sign/step-up', [SignatureController::class, 'sendStepUp'])->middleware('throttle:5,1')->name('sign.step-up');
        Route::post('sign/step-up/confirm', [SignatureController::class, 'confirmStepUp'])->middleware('throttle:10,1')->name('sign.step-up.confirm');
        Route::post('sign/{template}', [SignatureController::class, 'store'])->name('sign.store');

        Route::get('finish', [FinishController::class, 'show'])->name('finish');
        Route::post('finish', [FinishController::class, 'store'])->name('finish.store');
    });
});

Route::get('co-borrower/{invite}', [CoBorrowerController::class, 'accept'])
    ->middleware(['auth', 'mobile.verified', 'verified', 'signed'])
    ->name('co-borrower.accept');

/*
| Phone hand-off for face verification. No session needed: access is by a
| short-lived signed link from the desktop QR code.
*/
Route::middleware(['signed', 'throttle:20,1'])->group(function () {
    Route::get('identity/handoff/{check}', [IdentityHandoffController::class, 'show'])->name('identity.handoff');
    Route::post('identity/handoff/{check}', [IdentityHandoffController::class, 'store'])->name('identity.handoff.store');
});
