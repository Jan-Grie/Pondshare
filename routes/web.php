<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;


Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Route::middleware(['auth', 'verified', 'activated', 'password.change'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });


Route::middleware(['auth', 'verified', 'password.change', 'activated'])->group(function () {
    
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get("/usage", [DashboardController::class, 'usage'])->name('usage');


    // Route::get('usage', function () {
    //     return Inertia::render('UsageTab');
    // })->name('usage');

    Route::get('pondDetailed', function () {
        return Inertia::render('ponds/pond-detailed');
    })->name('pondDetailed');

    

    // Route::get('bin', function () {
    //     return Inertia::render('bin');
    // })->name('bin');    
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/bin.php';
require __DIR__.'/ponds.php';
require __DIR__.'/public.php';
