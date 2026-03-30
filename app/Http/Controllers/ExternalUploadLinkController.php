<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Str;

use App\Models\Pond;
use App\Models\ExternalUploadLink;
use App\Models\File;
use App\Models\FileScan;
use App\Models\SystemSetting;
use App\Events\FileUploaded;
use App\Jobs\ScanFileWithClamAV;

class ExternalUploadLinkController extends Controller
{

    //TODO => Irgendwo für die Controller gemeinsam verfügbar machen. Wird auf im FileController verwendet
    private function convertToBytes($value)
    {
        $value = trim($value);
        $last = strtolower($value[strlen($value)-1]);
        $value = (int) $value;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }


    /**
     * Store a newly created ExternalUploadLink for the given Pond
     */
    public function store(Request $request, Pond $pond)
    {
        if($pond->user_id !== Auth::id()){
            abort(403, 'Unauthorized action.');
        }

        $forcePassword =SystemSetting::forcePasswordForLinks();
        $minPasswordLength = SystemSetting::minLinkPasswordLength();
        $maxExpirationDays = SystemSetting::maxLinkExpirationDays();
        $requireExpiry = SystemSetting::requireExpiryForLinks();

        $rules = [
            "name" => [
                "required",
                "string",
                "max:255",
                Rule::unique("external_upload_links")->where(fn($q) => $q->where("pond_id", $pond->id)),
            ],
        ];

        if($forcePassword){
            $rules["password"] = ["required", "string", "min:" . $minPasswordLength, "max:255"];
        } else {
            $rules["password"] = ["nullable", "string", "min:" . $minPasswordLength, "max:255"];
        }

        $expiresAtRules = [
            "date",
            "after:now",
            "before_or_equal:" . Carbon::today()->addDays($maxExpirationDays)->toDateString(),
        ];

        if($requireExpiry){
            array_unshift($expiresAtRules, "required");
        } else {
            array_unshift($expiresAtRules, "nullable");
        }
        $rules["expires_at"] = $expiresAtRules;

        $data = $request->validate($rules);

        $expiresAt = $data["expires_at"] ?? null;
        $passwordEnable = false;
        $passwordHash = null;

        if(!empty($data["password"])){
            $passwordEnable = true;
            $passwordHash = Hash::make($data["password"]);
        }

        $token = (string) Str::uuid();

        $uploadLink = ExternalUploadLink::create([
            "pond_id" => $pond->id,
            "name" => $data["name"],
            "token" => $token,
            "password_enabled" => $passwordEnable,
            "password_hash" => $passwordHash,
            "created_at" => now(),
            "expires_at" => $expiresAt,
            "upload_count" => 0,
        ]);

        $fullUrl = url("/uploads/" . $uploadLink->token);

        return response()->json([
            "success" => true,
            "link" => [
                "id" => $uploadLink->id,
                "name" => $uploadLink->name,
                "token" => $uploadLink->token,
                "full_url" => $fullUrl,
                "created_at" => $uploadLink->created_at,
                "expires_at" => $uploadLink->expires_at,
                "password_enabled" => $uploadLink->password_enabled,
                "upload_count" => $uploadLink->upload_count,
            ]
            ], 201);
    }

    public function update(Pond $pond, ExternalUploadLink $externalUploadLink, Request $request)
    {
        if($pond->user_id !== Auth::id() || $externalUploadLink->pond_id !== $pond->id){
            abort(403, 'Unauthorized action.');
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
                Rule::unique("external_upload_links")->where(fn($q) => $q->where("pond_id", $pond->id)->where("id", "!=", $externalUploadLink->id)),
            ],
        ];

        $hasPasswordInDb     = !empty($externalUploadLink->password_hash);
        $requestHasPassword  = $request->filled("password");

        if ($requestHasPassword) {
            $rules["password"] = ["required", "string", "min:$minPasswordLength", "max:255"];
        } elseif (!$hasPasswordInDb) {
            $rules["password"] = ["required", "string", "min:$minPasswordLength", "max:255"];
        } else {
            $rules["password"] = ["nullable", "string", "min:$minPasswordLength", "max:255"];
        }

        $expiresAtRules = [
            "date",
            "after:now",
            "before_or_equal:" . Carbon::today()->addDays($maxExpirationDays)->toDateString(),
        ];

        if($requireExpiry){
            array_unshift($expiresAtRules, "required");
        } else {
            array_unshift($expiresAtRules, "nullable");
        }

        $rules["expires_at"] = $expiresAtRules;

        $data = $request->validate($rules);

        $expiresAt = $data["expires_at"] ?? null;

        if(!empty($data["password"])){
            $externalUploadLink->password_enabled = true;
            $externalUploadLink->password_hash = Hash::make($data["password"]);
        }

        if($forcePassword){
            $externalUploadLink->password_enabled = true;
        }

        $externalUploadLink->update([
            "name" => $data["name"],
            "expires_at" => $expiresAt,
        ]);

        return response()->json([
            "success" => true,
            "link" => [
                "id" => $externalUploadLink->id,
                "name" => $externalUploadLink->name,
                "token" => $externalUploadLink->token,
                "full_url" => url("/uploads/" . $externalUploadLink->token),
                "created_at" => $externalUploadLink->created_at,
                "expires_at" => $externalUploadLink->expires_at,
                "password_enabled" => $externalUploadLink->password_enabled,
                "upload_count" => $externalUploadLink->upload_count,
            ]
            ]);
    }

    public function destroy(Pond $pond, ExternalUploadLink $externalUploadLink)
    {
        if ($pond->id !== $externalUploadLink->pond_id) {
            abort(403);
        }

        if ($pond->user_id !== Auth::id()) {
            abort(403);
        }
        $externalUploadLink->delete();

        return back()->with('success', 'Upload link deleted successfully.');
    }

    public function show(Request $request, string $token)
    {
        $uploadLink = ExternalUploadLink::where("token", $token)->firstOrFail();

        if($uploadLink->isExpired()){
            return Inertia::render("public/upload/upload-expired");
        }

        $sessionKey = "upload_link_authenticated_" . $token;
        if($uploadLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return Inertia::render("public/upload/upload-password", [
                "token" => $token,
            ]);
        }

        $uploaderSessionKey = "upload_link_uploader_" . $token;
        if(!$request->session()->has($uploaderSessionKey)){
            return Inertia::render("public/upload/upload-uploader", [
                "token" => $token,
            ]);
        }

        $pond = $uploadLink->pond;

        return Inertia::render("public/upload/upload-form", [
            "token" => $token,
            "pond" => [
                "id" => $pond->id,
                "name" => $pond->name,
            ],
            "upload_link" => [
                "id" => $uploadLink->id,
                "name" => $uploadLink->name,
                "expires_at" => $uploadLink->expires_at,
            ],
        ]);
    }

    public function verifyPassword(Request $request, string $token)
    {
        $uploadLink = ExternalUploadLink::where("token", $token)->firstOrFail();

        if($uploadLink->isExpired()){
            return redirect()->route("uploads.show", ["token" => $token]);
        }

        if(!$uploadLink->password_enabled){
            return redirect()->route("uploads.show", ["token" => $token]);
        }

        $data = $request->validate([
            "password" => ["required", "string"],
        ]);

        if(!Hash::check($data["password"], $uploadLink->password_hash)){
            return back()->withErrors(["password" => __("The provided password is incorrect.")]);
        }

        $request->session()->put("upload_link_authenticated_" . $token, true);

        return redirect()->route("uploads.show", ["token" => $token]);
    }

    public function storeUploaderName(Request $request, string $token)
    {
        $uploadLink = ExternalUploadLink::where("token", $token)->firstOrFail();

        $data = $request->validate([
            "uploader_name" => "required|string|max:255",
        ]);

        $request->session()->put("upload_link_uploader_" . $token, $data["uploader_name"]);

        return redirect()->route("uploads.show", ["token" => $token]);
    }

    public function handleUpload(Request $request, string $token)
    {
        $uploadLink = ExternalUploadLink::where("token", $token)
            ->where(function($query) {
                $query->whereNull("expires_at")
                ->orWhere("expires_at", ">", now());
            })
            ->firstOrFail();

        $maxUpload = $this->convertToBytes(ini_get('upload_max_filesize'));
        $postMax   = $this->convertToBytes(ini_get('post_max_size'));
        $maxBytes = min($maxUpload, $postMax);

        $sessionKey = "upload_link_authenticated_" . $token;
        if($uploadLink->password_enabled && !$request->session()->get($sessionKey, false)){
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $uploaderSessionKey = "upload_link_uploader_" . $token;
        $uploaderName = $request->session()->get($uploaderSessionKey, null);

        $request->validate([
            "file" => "required",
            "file.*" => "file|max:" . $maxBytes,
        ]);

        $pond = $uploadLink->pond;
        $files = $request->file("file");
        if(!is_array($files)){
            $files = [$files];
        }

        $uploaded = [];
        foreach($files as $file){
            $storedPath = $file->store("ponds/" . $pond->id, "local");

            $newFile = File::create([
                "pond_id"     => $pond->id,
                "name"        => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                "extension"   => $file->getClientOriginalExtension(),
                "mime_type"   => $file->getMimeType(),
                "path"        => $storedPath,
                "size"        => $file->getSize(),
                "user_id"     => null,
                "uploaded_by" => $uploaderName,
                "scan_status" => "pending",
            ]);

            $uploaded[] = [
                "id"        => $newFile->id,
                "name"      => $newFile->name,
                "extension" => $newFile->extension,
                "size"      => $newFile->size,
            ];

            $uploadLink->increment("upload_count");

            broadcast(new FileUploaded($newFile->id, $pond->id, 'external'))->toOthers();

            $scan = FileScan::create([
                'file_id' => $newFile->id,
                'status'  => 'pending',
            ]);

            ScanFileWithClamAV::dispatch($newFile->id, $scan->id)
                ->delay(now()->addSeconds(2));
        }

        return response()->json([
            "success" => true,
            "message" => __("Files uploaded successfully."),
            "files"   => $uploaded,
        ]);
    }

    public function deleteUploadedFile(Request $request, string $token, File $file)
    {
        $uploadLink = ExternalUploadLink::where("token", $token)->firstOrFail();

        if($file->pond_id !== $uploadLink->pond_id){
            abort(403, 'Unauthorized action.');
        }

        $uploaderSessionKey = "upload_link_uploader_" . $token;
        $uploaderName = $request->session()->get($uploaderSessionKey, null);
        if($file->uploaded_by !== $uploaderName){
            abort(403, 'Unauthorized action.');
        }

        Storage::disk("local")->delete($file->path);
        $file->delete();

        return response()->json([
            "success" => true,
            "message" => __("File deleted successfully."),
        ]);
    }
}
