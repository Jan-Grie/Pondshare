<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\BinController;

Route::middleware(['auth', 'verified', 'password.change', 'activated'])->group(function () {    
        Route::get('/bin', [BinController::class, 'index'])->name('bin.index');        
        Route::delete('/bin/ponds/forceDelete/{pond}', [BinController::class, 'forceDeletePond'])->name('bin.ponds.forceDelete');   
        Route::post('/bin/ponds/restore/{id}',[BinController::class, 'restorePond'])->name('bin.ponds.restore');         

        Route::delete('/bin/ponds/files/{id}/force-delete', [BinController::class, 'forceDeleteFile'])->name('bin.files.forceDelete');    
});
