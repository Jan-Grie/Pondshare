<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use ZipArchive;


use App\Models\PondDailyDownload;
use App\Models\Pond;
use App\Models\ShareLink;
use App\Models\File;
use App\Models\SystemSetting;

class ShareLinkController extends Controller
{
    /**
     * Store a newly created share link for the given pond
     */
    public function store(Request $request, Pond $pond)
    {
        if($pond->user_id !== Auth::id()){
            abort(403, "Unauthorized");
        }

        $forcePassword     = SystemSetting::forcePasswordForLinks();
        $minPasswordLength = SystemSetting::minLinkPasswordLength();
        $maxExpirationDays = SystemSetting::maxLinkExpirationDays();
        $requireExpiry     = SystemSetting::requireExpiryForLinks();

        $rules = [
            "name" => [
                "required", 
                "string",
                "max:255",
                Rule::unique('share_links')->where(function ($query) use ($pond) {
                    return $query->where('pond_id', $pond->id);
                }),
            ],
        ];

        if($forcePassword){
            $rules["password"] = ["required", "string", "min:" . $minPasswordLength, "max:255"];
        } else {
            $rules["password"] = ["nullable", "string", "min:" . $minPasswordLength, "max:255"];
        }

        if($requireExpiry){
            $rules["expires_at"] = ["required", "date", "after:now", "before_or_equal:" . Carbon::now()->addDays($maxExpirationDays)->toDateString()];
        } else {
            $rules["expires_at"] = ["nullable", "date", "after:now", "before_or_equal:" . Carbon::now()->addDays($maxExpirationDays)->toDateString()];
        }

        $data = $request->validate($rules);

        $expiresAt = $data["expires_at"] ?? null;
        $passwordEnabled = false;
        $passwordHash = null;

        if(!empty($data["password"])){
            $passwordEnabled = true;
            $passwordHash = Hash::make($data["password"]);
        }

        $token = (string) \Illuminate\Support\Str::uuid();

        $shareLink = ShareLink::create([
            "pond_id" => $pond->id,
            "name" => $data["name"],
            "token" => $token,
            "password_enabled" => $passwordEnabled,
            "password_hash" => $passwordHash,
            "created_at" => now(),
            "expires_at" => $expiresAt,
            "download_count" => 0,
        ]);

        $fullUrl = url('/shares/' . $shareLink->token);
        
        return response()->json([
            "success" => true,
            "link" => [
                "id" => $shareLink->id,
                "name" => $shareLink->name,
                "token" => $shareLink->token,
                "full_url" => $fullUrl,
                "created_at" => $shareLink->created_at,
                "expires_at" => $shareLink->expires_at,
                "has_password" => $shareLink->password_enabled,
                "downloads" => $shareLink->download_count
            ]
            ], 201);
    }


    public function update(Request $request, Pond $pond, ShareLink $shareLink)
    {
        if($pond->user_id !== Auth::id() || $shareLink->pond_id !== $pond->id){
            abort(403, "Unauthorized");
        }

        $forcePassword = SystemSetting::forcePasswordForLinks();
        $minPasswordLength = SystemSetting::minLinkPasswordLength();
        $maxExpirationDays = SystemSetting::maxLinkExpirationDays();
        $requireExpiry = SystemSetting::requireExpiryForLinks();

        $rules = [
            "name" => [
                "required",
                "string",
                "max:255",
                Rule::unique("share_links")->where(fn($query) => $query->where("pond_id", $pond->id)->where("id", "!=", $shareLink->id)),
            ],
        ];


        // Current password states
        $hasPasswordInDb     = !empty($shareLink->password_hash);
        $requestHasPassword  = $request->filled("password");

        /*
        |--------------------------------------------------------------------------
        | Password Validation Logic
        |--------------------------------------------------------------------------
        |
        | 1) User gibt neues Passwort ein → validate required
        | 2) Link hatte bisher KEIN Passwort → Passwort required
        | 3) Link hat PW + User lässt Feld leer → OK (PW bleibt bestehen)
        |
        | forcePassword bedeutet:
        |    - Der Link MUSS Passwortschutz haben
        |    - ABER: kein neues eingeben, wenn bereits vorhanden!
        |
        */

        if ($requestHasPassword) {
            // Neues Passwort eingegeben → validieren
            $rules["password"] = [
                "required",
                "string",
                "min:$minPasswordLength",
                "max:255",
            ];
        }
        elseif (!$hasPasswordInDb) {
            // Der Link hat KEIN Passwort → eines MUSS gesetzt werden
            $rules["password"] = [
                "required",
                "string",
                "min:$minPasswordLength",
                "max:255",
            ];
        }
        else {
            // User lässt PW leer → Passwort bleibt bestehen
            $rules["password"] = [
                "nullable",
                "string",
                "min:$minPasswordLength",
                "max:255",
            ];
        }        


        if($requireExpiry){
            $rules["expires_at"] = ["required", "date", "after:now", "before_or_equal:" . Carbon::now()->addDays($maxExpirationDays)->toDateString()];
        } else {
            $rules["expires_at"] = ["nullable", "date", "after:now", "before_or_equal:" . Carbon::now()->addDays($maxExpirationDays)->toDateString()];
        }

        $data = $request->validate($rules);

        $expiresAt = $data["expires_at"] ?? null;

        //Set password only if provided
        if(!empty($data["password"])){
            $shareLink->password_enabled = true;
            $shareLink->password_hash = Hash::make($data["password"]);
        }

        //If Passwordprotection is forced, make sure password is enabled
        if($forcePassword){
            $shareLink->password_enabled = true;
        }

        $shareLink->update([
            "name" => $data["name"],
            "expires_at" => $expiresAt,
        ]);

        return response()->json([
            "success" => true,
            "link" => [
                "id" => $shareLink->id,
                "name" => $shareLink->name,
                "token" => $shareLink->token,
                "full_url" => url('/shares/' . $shareLink->token),
                "created_at" => $shareLink->created_at,
                "expires_at" => $shareLink->expires_at,
                "has_password" => $shareLink->password_enabled,
                "downloads" => $shareLink->download_count
            ],
        ], 200);
    }

    public function destroy(Pond $pond, ShareLink $share_link)
    {
        if ($pond->id !== $share_link->pond_id) {
            abort(403);
        }

        if ($pond->user_id !== Auth::id()) {
            abort(403);
        }

        $share_link->delete();

        return back()->with('success', __('Share link deleted successfully.'));
    }

    public function show(Request $request, string $token)
    {
        $shareLink = ShareLink::where("token", $token)->firstOrFail();

        //Check if expired
        if($shareLink->isExpired()){
            return Inertia::render("public/share-expired");
        }

        //Check if password is required
        $sessionKey = "share_link_authenticated_{$token}";
        if($shareLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return Inertia::render("public/share-password", [
                "token" => $token,
            ]);
        }

        //Show the share link contents
        $pond = $shareLink->pond;
        $filesCollection = $pond->files;

        $files = $filesCollection->map(function ($file) {
            $fullPath = Storage::disk("local")->path($file->path);

            $sizeInBytes = file_exists($fullPath) ? filesize($fullPath) : 0;

            return [
                "id" => $file->id,
                "name" => $file->name,
                "extension" => $file->extension,
                "mime_type" => $file->mime_type,
                "previewable" => $file->isPreviewable(),
                "size" => $sizeInBytes,
            ];
        });

        $totalSize = $files->sum('size');
        $fileCount = $files->count();

        return Inertia::render("public/show", [
            "token" => $token,
            "pond" => [
                "id" => $pond->id,
                "name" => $pond->name,
                "file_count" => $fileCount,
                "total_size_bytes" => $totalSize,                
            ],
            "files" => $files,
        ]);
    }

    public function verifyPassword(Request $request, string $token)
    {
        $shareLink = ShareLink::where("token", $token)->firstOrFail();

        //Check if expired
        if($shareLink->isExpired()){
            return redirect()->route("shares.show", ["token" => $token]);
        }

        //If no password is set, redirect to share link
        if(!$shareLink->password_enabled){
            return redirect()->route("shares.show", ["token" => $token]);
        }

        //Validate the password
        $data = $request->validate([
            "password" => "required|string",
        ]);

        //Passwort-Check
        if(!Hash::check($data["password"], $shareLink->password_hash)){
            return back()->withErrors([
                "password" => __("The provided password is incorrect.")
            ]);
        }

        //Set session variable to mark as authenticated
        $request->session()->put("share_link_authenticated_{$token}", true);

        return redirect()->route("shares.show", ["token" => $token]);
    }

    public function downloadFile(Request $request, string $token, File $file){
        
        $shareLink = ShareLink::where("token", $token)
                ->where(fn($q) => $q->whereNull("expires_at")->orWhere("expires_at", ">", Carbon::now()))
                ->firstOrFail();

        $sessionKey = "share_link_authenticated_{$token}";
        if($shareLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return redirect()->route('shares.show', ['token' => $token]);
        }

        if($file->pond_id !== $shareLink->pond_id){
            abort(403, "Unauthorized");
        }

        $shareLink->increment('download_count');
        $this->incrementDailyDownloadCount($shareLink->pond_id);

        $fullPath = Storage::disk("local")->path($file->path);
        if(!file_exists($fullPath)){
            abort(404, __("File not found"));
        }

        $realFileName = $file->name . "." . $file->extension;
        return response()->download($fullPath, $realFileName);
    }

    public function downloadZip(Request $request, string $token){
        $shareLink = ShareLink::where("token", $token)
            ->where(fn($q) => $q->whereNull("expires_at")->orWhere("expires_at", ">", Carbon::now()))
            ->firstOrFail();

        $sessionKey = "share_link_authenticated_{$token}";
        if($shareLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return redirect()->route('shares.show', ['token' => $token]);
        }

        $pond = $shareLink->pond;

        $fileIds = $request->query('file_ids');
        $filesQuery = $pond->files();
        if (!empty($fileIds) && is_array($fileIds)) {
            $validatedIds = array_values(array_filter(array_map('intval', $fileIds), fn($id) => $id > 0));
            $filesQuery->whereIn('id', $validatedIds);
        }
        $files = $filesQuery->get();

        $tempZipPath = tempnam(sys_get_temp_dir(), "sharelink_" . $shareLink->id . "_") . ".zip";
        $zip = new \ZipArchive();
        if($zip->open($tempZipPath, \ZipArchive::CREATE) !== TRUE) {
            abort(500, __("Could not create zip file"));
        }

        foreach($files as $file){
            $fullPath = Storage::disk("local")->path($file->path);
            if(file_exists($fullPath)){
                $zip->addFile($fullPath, $file->name . '.' . $file->extension);
            }
        }
        $zip->close();

        $shareLink->increment('download_count');
        $this->incrementDailyDownloadCount($shareLink->pond_id);

        $downloadName = ($pond->name ?: "pond_" . $pond->id) . ".zip";
        return response()->download(
            $tempZipPath,
            $downloadName
        )->deleteFileAfterSend(true);

    }


    private function incrementDailyDownloadCount(int $pondId): void
    {
        $today = Carbon::today()->toDateString();

        $updated = PondDailyDownload::where('pond_id', $pondId)
            ->whereDate('date', $today)
            ->increment('download_count');

        if ($updated === 0) {
            try {
                PondDailyDownload::create([
                    'pond_id' => $pondId,
                    'date'     => $today,
                    'download_count' => 1,
                ]);
            } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                PondDailyDownload::where('pond_id', $pondId)
                    ->whereDate('date', $today)
                    ->increment('download_count');
            }
        }
    }

    public function previewFile(Request $request, string $token, File $file){
        $shareLink = ShareLink::where("token", $token)
            ->where(fn($q) => $q->whereNull("expires_at")->orWhere("expires_at", ">", Carbon::now()))
            ->firstOrFail();

        $sessionKey = "share_link_authenticated_{$token}";
        if($shareLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return redirect()->route('shares.show', ['token' => $token]);
        }

        if($file->pond_id !== $shareLink->pond_id){
            abort(403, "Unauthorized");
        }

        if(!$file->isPreviewable()){
            abort(403, __("File is not previewable"));
        }

        $fullPath = Storage::disk("local")->path($file->path);
        if(!file_exists($fullPath)){
            abort(404, __("File not found"));
        }

        return response()->file(
            $fullPath,
            [
                'Content-Type' => $file->mime_type,
                "Content-Disposition" => 'inline; filename="' . $file->name . '.' . $file->extension . '"',
            ]
            
        );
    }
}