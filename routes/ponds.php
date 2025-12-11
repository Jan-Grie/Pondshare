<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\ShareLink;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PondController;
use App\Http\Controllers\PondFileController;
use App\Http\Controllers\ShareLinkController;
use App\Http\Controllers\ExternalUploadLinkController;




Route::middleware(['auth', 'verified', 'password.change', 'activated'])->group(function () {
    
    

    Route::get('/ponds', [PondController::class, 'index'])->name('ponds.index');
    Route::get('/ponds/{id}', [PondController::class, 'show'])->name('ponds.show');

    Route::delete('/ponds/{pond}', [PondController::class, 'destroy'])->name('ponds.destroy');    

    Route::post('/ponds', [PondController::class, 'store'])->name('ponds.store');

    Route::post('/ponds/{pond}/files', [App\Http\Controllers\PondFileController::class, 'store'])
     ->name('ponds.files.store');

     Route::get('/files/{file}/preview-info', [PondFileController::class, 'previewInfo'])
    ->name('files.previewInfo');

    Route::delete('/ponds/files/{file}', [PondFileController::class, 'destroy'])->name('ponds.files.destroy');
    Route::post('/ponds/files/{id}/restore', [PondFileController::class, 'restore'])->name('ponds.files.restore');
    
    Route::post('/ponds/{pond}/share-links', [ShareLinkController::class, 'store'])->name('ponds.share-links.store');
    Route::delete('/ponds/{pond}/share-links/{share_link}', [ShareLinkController::class, 'destroy'])->name('ponds.share-links.destroy');

    Route::put('/ponds/{pond}/share-links/{shareLink}', [ShareLinkController::class, 'update'])
    ->name('ponds.share-links.update');

    Route::put("/ponds/{pond}", [PondController::class, 'update'])->name('ponds.update');


    Route::get('/files/{file}/preview', [PondFileController::class, 'preview'])->name('files.preview');
    Route::get('/files/{file}/download', [PondFileController::class, 'download'])->name('files.download');
    Route::get('/ponds/{pond}/download-zip', [PondFileController::class, 'downloadZip'])->name('ponds.downloadZip');
    

// Upload-Link anlegen
Route::post('/ponds/{pond}/upload-links', [ExternalUploadLinkController::class, 'store'])
    ->name('ponds.upload-links.store');

// Upload-Link bearbeiten
Route::put('/ponds/{pond}/upload-links/{externalUploadLink}', [ExternalUploadLinkController::class, 'update'])
    ->name('ponds.upload-links.update');

// Upload-Link löschen
Route::delete('/ponds/{pond}/upload-links/{uploadLink}', [ExternalUploadLinkController::class, 'destroy'])
    ->name('ponds.upload-links.destroy');

    // Erstellen
    Route::post(
        '/ponds/{pond}/external-upload-links',
        [ExternalUploadLinkController::class, 'store']
    )->name('ponds.external-upload-links.store');

    // Bearbeiten
    Route::put(
        '/ponds/{pond}/external-upload-links/{uploadLink}',
        [ExternalUploadLinkController::class, 'update']
    )->name('ponds.external-upload-links.update');

    // Löschen
    Route::delete('/uploads/{uploadLink}', [ExternalUploadLinkController::class, 'destroy'])
    ->name('uploads.destroy');

});


