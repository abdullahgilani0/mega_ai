<?php

use App\Http\Controllers\Broker\ApplicationController;
use App\Http\Controllers\Broker\InboxController;
use App\Http\Controllers\Broker\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'staff.mfa', 'can:broker.work'])->prefix('broker')->name('broker.')->group(function () {
    Route::get('/', [InboxController::class, 'index'])->name('inbox');
    Route::post('offers/{allocation}/accept', [InboxController::class, 'accept'])->name('offers.accept');
    Route::post('offers/{allocation}/decline', [InboxController::class, 'decline'])->name('offers.decline');

    Route::get('applications/{application}', [ApplicationController::class, 'show'])->name('applications.show');
    Route::patch('applications/{application}', [ApplicationController::class, 'update'])->name('applications.update');

    Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
});
