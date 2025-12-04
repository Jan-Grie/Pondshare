<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\PasswordChangePromptController;

Route::get('/must-change-password', PasswordChangePromptController::class)
    ->middleware(['auth', 'verified'])
    ->name('password.force');

Route::post('/must-change-password', [PasswordChangePromptController::class, 'update'])
    ->middleware(['auth', 'verified'])
    ->name('password.force.update');


