<?php

namespace App\Http\Controllers;

use App\Models\Pond;
use App\Models\File;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;



use App\Jobs\DeletePondFiles;

class BinController extends Controller
{
    use AuthorizesRequests;

    /**
    * Display all soft-deleted ponds for the authenticated user.
    */
    public function index(){
        $user = Auth::user();

        //Get all soft-deleted ponds of the user
        $trashedPonds = Pond::onlyTrashed()
            ->where('user_id', $user->id)
            ->withCount('files')
            ->get()
            ->map(function($pond){
                //Calculate total size of files in the pond
                $sizeBytes = $pond->files()->sum('size');
                $sizeMB = $sizeBytes / (1024 * 1024);

                return [
                    'id' => $pond->id,
                    'name' => $pond->name,
                    'size' => $sizeBytes,
                    'deleted_at' => $pond->deleted_at,
                    'files_count' => $pond->files_count,
                    'size_mb' => round($sizeMB, 2),
                ];
            });

        //Get all soft-deleted files from not deleted ponds
        $trashedFiles = File::onlyTrashed()
            ->whereHas('pond', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name . "." . $file->extension,
                    'size' => $file->size,
                    'deleted_at' => $file->deleted_at,
                    'pond_id' => $file->pond_id,
                    'pond_name' => $file->pond->name,
                ];
            });

        return Inertia::render('bin/index', [
            'trashedPonds' => $trashedPonds,
            'totalPondSize' => $trashedPonds->sum('size'),
            'trashedFiles' => $trashedFiles,
            'totalFileSize' => $trashedFiles->sum('size'),
            'totalSize' => $trashedPonds->sum('size') + $trashedFiles->sum('size'),
        ]);            
    }

    /**
    * Deletes permanently all soft-deleted ponds and files of the authenticated user.
    * @param \App\Models\Pond $pond
    * @return \Illuminate\Http\RedirectResponse
    */
    public function forceDeletePond(int $id): RedirectResponse
    {
        $pond = Pond::onlyTrashed()
            ->with(['files' => fn ($query) => $query->withTrashed()])
            ->findOrFail($id);
        
        //Check Policy
        $this->authorize('forceDelete', $pond);

        //Collect all file paths for the job
        $filePaths = $pond->files->pluck('path')->toArray();

        //Dispatch Job to delete files from storage
        DeletePondFiles::dispatch($filePaths, $pond->id);

        //Permanently delete the pond and its files from database
        $pond->files()->withTrashed()->forceDelete();
        $pond->forceDelete();

        return Redirect::route('bin.index')
            ->with('success',  __('messages.pond_deleted'));

    }

    /**
    * Restore a soft-deleted pond.
    * @param int $id
    * @return \Illuminate\Http\RedirectResponse
    */
    public function restorePond(int $id): RedirectResponse
    {
        $pond = Pond::onlyTrashed()->findOrFail($id);

        $this->authorize('restore', $pond);

        $pond->restore();

        return Redirect::route('bin.index')
            ->with('success', __('messages.pond_restored'));
    }


    public function restoreFile(int $id)
    {
        $file = File::withTrashed()->findOrFail($id);
        $this->authorize('restore', $file);

        $file->restore();

        return back()->with('success', __('messages.file_restored'));
    }

    /**
     * Permanently delete a soft-deleted file.
     * @param int $id     
     */
    public function forceDeleteFile(int $id)
    {
        $file = File::withTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $file);

        //Delete file from storage
        Storage::delete($file->path);

        //Permanently delete from database
        $file->forceDelete();

        return back()->with('success', __('messages.file_deleted'));
    }


}

