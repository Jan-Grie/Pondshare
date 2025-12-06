<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PondController;
use App\Http\Controllers\BinController;
use App\Http\Controllers\PondFileController;
use App\Http\Controllers\ShareLinkController;
use App\Http\Controllers\ExternalUploadLinkController;



Route::get('/demo/share-demo', function () {
    return Inertia::render('public/show');
})->name('demo.share');

// Öffentliche Share‐Seiten:
Route::get('/shares/{token}', [ShareLinkController::class, 'show'])
    ->name('shares.show');
Route::post('/shares/{token}/verify-password', [ShareLinkController::class, 'verifyPassword'])
    ->name('shares.verifyPassword');

// Download einer einzelnen Datei über Share:
Route::get('/shares/{token}/files/{file}/download', [ShareLinkController::class, 'downloadFile'])
    ->name('shares.downloadFile');

// ZIP‐Download aller Dateien eines Ponds über Share:
Route::get('/shares/{token}/download-zip', [ShareLinkController::class, 'downloadZip'])
    ->name('shares.downloadZip');

// Preview einer Datei über Share:
Route::get('/shares/{token}/files/{file}/preview', [ShareLinkController::class, 'previewFile'])
    ->name('shares.previewFile');


//---------------------///

Route::get('/uploads/{token}', [ExternalUploadLinkController::class, 'show'])
    ->name('uploads.show');

// Passwort für Upload-Link prüfen
Route::post('/uploads/{token}/verify-password', [ExternalUploadLinkController::class, 'verifyPassword'])
    ->name('uploads.verifyPassword');

// Datei-Upload durchführen
Route::post('/uploads/{token}/upload', [ExternalUploadLinkController::class, 'handleUpload'])
    ->name('uploads.handleUpload');

    Route::post('/uploads/{token}/uploader', [ExternalUploadLinkController::class, 'storeUploaderName'])
    ->name('uploads.uploader.store');


Route::delete('/uploads/{token}/files/{file}', [ExternalUploadLinkController::class, 'deleteUploadedFile'])
    ->name('uploads.files.delete');    


