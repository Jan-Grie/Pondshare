<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

use App\Models\Pond;
use App\Models\SystemSetting;

class PondController extends Controller
{
    use AuthorizesRequests;

    /**
     * Shows a list of all ponds of the authenticated user.
     */
    public function index()
    {
        $user = Auth::user();

        //Get all ponds of the user with the newest first
        $ponds = $user->ponds()->orderBy('created_at', 'desc')->get();

        return Inertia::render('ponds/index', [
            'ponds' => $ponds->map(fn($pond) => [
                'id' => $pond->id,
                'name' => $pond->name,
                'created_at' => $pond->created_at,
                'files_count' => $pond->files()->count(),
                'size_bytes' => $pond->activeFilesSize(),
                'shared_links_count' => $pond->shareLinks()->count(),

                
            ]),
        ]);
    }


    public function show($id)
    {
        $pond = Pond::with([
            'files.user',
            'shareLinks',
        ])->findOrFail($id);

        $files = $pond->files->map(function ($file) {

            $isPreviewable = $file->isPreviewable();
            
            $previewUrl = $isPreviewable
                ? route('files.previewInfo', ['file' => $file->id])
                : null;

            return [
                'id' => $file->id,
                'name' => $file->name . '.' . $file->extension,
                'human_size' => $file->human_size,
                'uploaded_at' => $file->created_at,
                'uploader' => $file->user_id
                            ? optional($file->user)->name
                            : $file->uploaded_by,
                'extension' => $file->extension,
                'scan_status' => $file->scan_status,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
                'path' => $file->path,
                'previewable' => $isPreviewable,
                'preview_url' => $previewUrl,
            ];
        })->toArray();

        //Get Share Links
        $shareLinks = [
            'newLinkPlaceholder' => env('APP_URL') . '/shares',
            'items' => $pond->shareLinks->map(function ($link) {
                return [
                    'id' => $link->id,
                    'name' => $link->name,
                    'created_at' => $link->created_at,
                    'expires_at' => $link->expires_at ? $link->expires_at : null,
                    'has_password' => !empty($link->password_hash),
                    'downloads' => $link->download_count ?? 0,
                    'full_url' => route('shares.show', ['token' => $link->token])
                ];
            })->toArray(),
        ];

        $uploadLinks = [
            'items' => $pond->externalUploadLinks->map(function ($link){
                return [
                    'id' => $link->id,
                    'name' => $link->name,
                    'created_at' => $link->created_at,
                    'expires_at' => $link->expires_at ? $link->expires_at : null,
                    'has_password' => !empty($link->password_hash),
                    'uploads' => $link->upload_count ?? 0,
                    'full_url' => route('uploads.show', ['token' => $link->token])
                ];
            })->toArray(),
        ];
        
        return Inertia::render('ponds/pond-detailed', [
            'pond' => [
                'id' => $pond->id,
                'name' => $pond->name,
                'size_bytes' => $pond->activeFilesSize(),
                'created_at' => $pond->created_at,
            ],
            // 'files' => $files,
            'files' => Inertia::defer(fn () =>
                $pond->files()
                    ->with('user')
                    ->get()
                    ->map(function ($file) {
                        $isPreviewable = $file->isPreviewable();

                        return [
                            'id' => $file->id,
                            'name' => $file->name . '.' . $file->extension,
                            'human_size' => $file->human_size,
                            'uploaded_at' => $file->created_at,
                            'uploader' => $file->user_id
                                ? optional($file->user)->name
                                : $file->uploaded_by,
                            'extension' => $file->extension,
                            'scan_status' => $file->scan_status,
                            'mime_type' => $file->mime_type,
                            'size' => $file->size,
                            'path' => $file->path,
                            'previewable' => $isPreviewable,
                            'preview_url' => $isPreviewable
                                ? route('files.previewInfo', ['file' => $file->id])
                                : null,
                        ];
                })
            ),
            'shareLinks' => $shareLinks,
            'uploadLinks' => $uploadLinks,
            'force_password_for_links' => SystemSetting::forcePasswordForLinks(),
            'min_length_password' => SystemSetting::minLinkPasswordLength(),
            'max_link_duration' => SystemSetting::maxLinkExpirationDays(),
            'force_expiration_date' => SystemSetting::requireExpiryForLinks(),
        ]);
    }

    public function store(Request $request)
    {
        //Validate the request
        $request->validate([
            "name" => "required|string|max:100",            
        ]);

        //Create New Pond for the current user
        Auth::user()->ponds()->create([
            'name'        => $request->input('name'),            
        ]);

        return redirect()->route('ponds.index')->with('success', __('Pond created successfully.'));
    }

    public function destroy(Pond $pond)
    {
        $this->authorize("delete", $pond);

        $pond->delete();

        return Redirect::route('ponds.index')->with('success', __('Pond deleted successfully.'));
    }

    public function update(Request $request, Pond $pond)
    {
        $this->authorize('update', $pond);

        $validated = $request->validate([
            "name" => ["required", "string", "min:1", "max:255"],
        ]);

        $pond->update($validated);

        return Redirect::route("ponds.show", $pond->id)
            ->with('success', __('messages.pond_updated'));
    }

}