<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use App\Models\Pond;
use App\Models\File;

class PondFileController extends Controller
{
    use AuthorizesRequests;

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

    public function store(Request $request, Pond $pond)
    {
        //TODO Authorize einbauen mit upload Files to this Pond

        $maxUpload = $this->convertToBytes(ini_get('upload_max_filesize'));
        $postMax   = $this->convertToBytes(ini_get('post_max_size'));

        $maxBytes = min($maxUpload, $postMax);

        $request->validate([
            'files.*' => 'required|file|max:' . $maxBytes,
        ]);

        //Check if user has enough quota
        $user = Auth::user();
        $usedBytes = $user->usedQuota();
        $quotaBytes = $user->quota_bytes;

        //Calculate total upload size
        $uploadFiles = $request->file('files', []);
        $newBytes = 0;
        foreach ($uploadFiles as $file) {
            $newBytes += $file->getSize();
        }

        //If not enough quota, return with error
        if ($usedBytes + $newBytes > $quotaBytes) {
            $remaining = $quotaBytes - $usedBytes;
            return response()->json([
                "success" => false,
                "message" => __("You do not have enough quota to upload these files. Remaining quota: :remaining bytes", ['remaining' => $remaining]),
            ], 422);            
        }

        $saved =[];

        //Store each file
        foreach ($uploadFiles as $file) {
            $path = $file->store("ponds/{$pond->id}", "local");

            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $mimeType = $file->getClientMimeType();
            $sizeInBytes = $file->getSize();

            $newFile = File::create([
                "pond_id" => $pond->id,
                "user_id" => Auth::id(),
                "uploaded_by" => "", //Empty because uploaded by pond owner
                "name" => pathinfo($originalName, PATHINFO_FILENAME),
                "extension" => $extension,
                "path" => $path,
                "mime_type" => $mimeType,
                "size" => $sizeInBytes,
                "scan_status" => "pending",
            ]);

            $saved[] = [
                "id" => $newFile->id,
                "name" => $newFile->name . "." . $newFile->extension,
                "human_size" => $this->formatBytes($newFile->size),
                "uploaded_at" => $newFile->created_at,
                "uploader" => optional($newFile->user)->name ?? null,
                "extension" => $newFile->extension,
                "mime_type" => $newFile->mime_type,
                "path" => $path,
                "previewable" => $newFile->isPreviewable(),
                'preview_url'  => route('files.preview', ['file' => $newFile->id]),
                "size" => $newFile->size,
                "scan_status" => $newFile->scan_status,
            ];                   
        }

        return response()->json([
            "success" => true,
            "files" => $saved,
            "pond_size_bytes" => $pond->activeFilesSize(),
        ]);             
    }


    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024 * 1024) {
            return number_format($bytes / (1024 * 1024 * 1024), 2, ',', '.') . ' GB';
        }

        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / (1024 * 1024), 1, ',', '.') . ' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1, ',', '.') . ' KB';
        }

        return $bytes . ' B';
    }    


    public function download(File $file)
    {
        $this->authorize("download", $file);

        $fullPath = Storage::disk("local")->path($file->path);
        if(!file_exists($fullPath)){
            abort(404, __("File not found"));
        }

        $realFilename = $file->name . '.' . $file->extension;

        return response()->download($fullPath, $realFilename);
    }    

    public function downloadZip(Pond $pond)
    {
        $this->authorize("download", $pond);

        $files = $pond->files()->where("scan_status", "!=", "infected")->get();

        $tempZipPath = tempnam(sys_get_temp_dir(), "pond_" . $pond->id . "_") . ".zip";
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

        $downloadName = ($pond->name ?: "pond_" . $pond->id) . ".zip";

        return response()->download(
            $tempZipPath,
            $downloadName
        )->deleteFileAfterSend(true);
    }

    public function preview(File $file)
    {
        $this->authorize("download", $file);

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
                "Content-Type" => $file->mime_type,
                "Content-Disposition" => "inline; filename=\"" . $file->name . '.' . $file->extension . "\"",
            ]
            );
    }

    public function destroy(File $file)
    {
        $this->authorize("delete", $file);

        $file->delete();

        return back()->with('success', __('File deleted successfully.'));
    }

    public function restore($id)
    {
        $file = File::withTrashed()->findOrFail($id);
        $this->authorize("restore", $file);
        $file->restore();
        return back()->with('success', __('File restored successfully.'));
    }

}