<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\UserManagementController;
use App\Http\Controllers\FileSecurityController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
   
    Route::get('settings/security', [ProfileController::class, 'security'])->name('profile.security');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/users', [UserManagementController::class, 'index'])->name('users.management');
    Route::post('settings/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::patch('settings/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('settings/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    Route::post('settings/users/{user}/reset-password', [UserManagementController::class, 'resetPassword'])->name('users.reset-password');

    Route::get('admin/file-security', [FileSecurityController::class, 'index'])->name('admin.file-security.index');
    Route::delete('admin/file-security/{file}', [FileSecurityController::class, 'destroy'])->name('admin.file-security.destroy');
    Route::post('admin/file-security/{file}/rescan', [FileSecurityController::class, 'rescan'])->name('admin.file-security.rescan');
});
