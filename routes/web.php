<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Auth\SocialAuthController;


Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');


Route::middleware(['auth', 'verified', 'password.change', 'activated'])->group(function () {
    
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get("/usage", [DashboardController::class, 'usage'])->name('usage');

    Route::get("/search", [SearchController::class, "index"]) ->name("search.index");

    

    // Route::get('bin', function () {
    //     return Inertia::render('bin');
    // })->name('bin');    
});

// Route::get('/debug/errors/{code}', function (string $code) {
//     return match ($code) {
//         '403' => abort(403),
//         '404' => abort(404),
//         '500' => throw new \RuntimeException('Test 500'),
//         '503' => abort(503),
//         default => abort(404),
//     };
// })->whereIn('code', ['403', '404', '500', '503']);


Route::get('/auth/azure/redirect', [SocialAuthController::class, 'redirectAzure'])
    ->name('auth.azure.redirect');

Route::get('/auth/azure/callback', [SocialAuthController::class, 'callbackAzure'])
    ->name('auth.azure.callback');


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/bin.php';
require __DIR__.'/ponds.php';
require __DIR__.'/public.php';
