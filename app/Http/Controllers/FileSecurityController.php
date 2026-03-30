<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

use App\Models\File;
use App\Models\FileScan;
use App\Jobs\ScanFileWithClamAV;

class FileSecurityController extends Controller
{
    private function ensureAdmin(): void
    {
        if (Auth::user()->role_id !== 1) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->ensureAdmin();

        $status = $request->query('status');
        $search = $request->query('search');

        $query = File::with(['pond', 'user', 'latestScan'])
            ->whereIn('scan_status', ['infected', 'failed', 'pending']);

        if ($status && in_array($status, ['infected', 'failed', 'pending'])) {
            $query->where('scan_status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('uploaded_by', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('pond', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        $files = $query->latest()->paginate(25)->withQueryString()->through(function ($file) {
            return [
                'id'          => $file->id,
                'name'        => $file->name,
                'extension'   => $file->extension,
                'size'        => $file->size,
                'scan_status' => $file->scan_status,
                'scanned_at'  => $file->scanned_at,
                'created_at'  => $file->created_at,
                'uploaded_by' => $file->uploaded_by,
                'pond'        => $file->pond ? ['id' => $file->pond->id, 'name' => $file->pond->name] : null,
                'user'        => $file->user ? ['id' => $file->user->id, 'name' => $file->user->name] : null,
                'latest_scan' => $file->latestScan ? [
                    'status'  => $file->latestScan->status,
                    'message' => $file->latestScan->message,
                ] : null,
            ];
        });

        $counts = [
            'infected' => File::where('scan_status', 'infected')->count(),
            'failed'   => File::where('scan_status', 'failed')->count(),
            'pending'  => File::where('scan_status', 'pending')->count(),
        ];

        return Inertia::render('settings/file-security', [
            'files'   => $files,
            'counts'  => $counts,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    public function destroy(File $file)
    {
        $this->ensureAdmin();

        Storage::disk('local')->delete($file->path);
        $file->forceDelete();

        return back()->with('success', 'Datei wurde gelöscht.');
    }

    public function rescan(File $file)
    {
        $this->ensureAdmin();

        $file->update(['scan_status' => 'pending', 'scanned_at' => null]);

        $scan = FileScan::create([
            'file_id' => $file->id,
            'status'  => 'pending',
        ]);

        ScanFileWithClamAV::dispatch($file->id, $scan->id)
            ->delay(now()->addSeconds(2));

        return back()->with('success', 'Scan neu gestartet.');
    }
}
