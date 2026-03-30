<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

use App\Models\Pond;
use App\Models\PondCollaborator;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\ActivityLogger;

class PondController extends Controller
{
    use AuthorizesRequests;

    /**
     * Shows a list of all ponds of the authenticated user.
     */
    public function index()
    {
        $user = Auth::user();

        // Own ponds
        $ownPonds = $user->ponds()->orderBy('created_at', 'desc')->get();

        // Ponds the user is a collaborator on
        $collaboratorPondIds = PondCollaborator::where('user_id', $user->id)->pluck('pond_id');
        $collaborativePonds = Pond::whereIn('id', $collaboratorPondIds)
            ->orderBy('created_at', 'desc')
            ->get();

        $mapPond = fn($pond, bool $isOwner) => [
            'id' => $pond->id,
            'name' => $pond->name,
            'created_at' => $pond->created_at,
            'files_count' => $pond->files()->count(),
            'size_bytes' => $pond->activeFilesSize(),
            'shared_links_count' => $pond->shareLinks()->count(),
            'is_owner' => $isOwner,
        ];

        $ponds = $ownPonds->map(fn($p) => $mapPond($p, true))
            ->concat($collaborativePonds->map(fn($p) => $mapPond($p, false)));

        return Inertia::render('ponds/index', [
            'ponds' => $ponds->values(),
        ]);
    }


    public function show($id)
    {
        $pond = Pond::with([
            'files.user',
            'shareLinks',
            'collaborators.user',
            'user',
        ])->findOrFail($id);

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

        $collaborators = $pond->collaborators->map(fn ($c) => [
            'id' => $c->id,
            'user_id' => $c->user_id,
            'name' => $c->user?->name,
            'email' => $c->user?->email,
            'permission' => $c->permission,
        ])->toArray();

        $existingUserIds = array_merge(
            [$pond->user_id],
            array_column($collaborators, 'user_id')
        );

        $availableUsers = User::whereNotIn('id', $existingUserIds)
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])
            ->toArray();

        $isOwner = $pond->user_id === Auth::id();
        $myPermission = $isOwner
            ? null
            : optional($pond->collaborators->firstWhere('user_id', Auth::id()))->permission;

        return Inertia::render('ponds/pond-detailed', [
            'pond' => [
                'id' => $pond->id,
                'name' => $pond->name,
                'size_bytes' => $pond->activeFilesSize(),
                'created_at' => $pond->created_at,
                'is_owner' => $isOwner,
                'my_permission' => $myPermission,
                'owner_name' => $pond->user?->name,
            ],
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
            'collaborators' => $collaborators,
            'available_users' => $availableUsers,
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

        $user = Auth::user();

        //Create New Pond for the current user
        $pond = $user->ponds()->create([
            'name' => $request->input('name'),
        ]);

        ActivityLogger::log($user->id, 'pond_created', 'Created pond "' . $pond->name . '"', ['pond_id' => $pond->id]);

        return redirect()->route('ponds.index')->with('success', __('Pond created successfully.'));
    }

    public function destroy(Pond $pond)
    {
        $this->authorize("delete", $pond);

        $user = Auth::user();
        ActivityLogger::log($user->id, 'pond_deleted', 'Deleted pond "' . $pond->name . '"', ['pond_name' => $pond->name]);

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
