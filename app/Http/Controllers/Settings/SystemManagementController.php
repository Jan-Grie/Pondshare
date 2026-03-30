<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AllowedEmailDomain;
use App\Models\File;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SystemManagementController extends Controller
{
    private function requireAdmin(): void
    {
        abort_unless(Auth::user()->isAdmin(), 403);
    }

    public function index(): Response
    {
        $this->requireAdmin();

        $settings = [
            'registration_enabled' => (bool) DB::table('settings')->where('key', 'registration_enabled')->value('value'),
            'restrict_registration_to_domains' => (bool) DB::table('settings')->where('key', 'restrict_registration_to_domains')->value('value'),
        ];

        $domains = AllowedEmailDomain::orderBy('domain')->get(['id', 'domain']);

        $pendingCount = DB::table('jobs')->count();

        try {
            $failedCount = DB::table('failed_jobs')->count();
            $recentFailed = DB::table('failed_jobs')
                ->orderByDesc('failed_at')
                ->limit(10)
                ->get(['id', 'queue', 'payload', 'failed_at'])
                ->map(function ($job) {
                    $payload = json_decode($job->payload, true);
                    return [
                        'id' => $job->id,
                        'queue' => $job->queue,
                        'job' => $payload['displayName'] ?? class_basename($payload['job'] ?? ''),
                        'failed_at' => $job->failed_at,
                    ];
                });
        } catch (\Exception $e) {
            $failedCount = 0;
            $recentFailed = collect();
        }

        $diskPath = storage_path();
        $diskTotal = @disk_total_space($diskPath) ?: null;
        $diskFree = @disk_free_space($diskPath) ?: null;
        $usedByApp = File::sum('size');

        return Inertia::render('settings/system-management', [
            'settings' => $settings,
            'domains' => $domains,
            'queue' => [
                'pending' => $pendingCount,
                'failed' => $failedCount,
                'recent_failed' => $recentFailed,
            ],
            'disk' => [
                'total' => $diskTotal,
                'free' => $diskFree,
                'used_by_app' => $usedByApp,
            ],
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'registration_enabled' => ['boolean'],
            'restrict_registration_to_domains' => ['boolean'],
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => 'registration_enabled'],
            ['value' => $validated['registration_enabled'] ? '1' : '0', 'updated_at' => now()]
        );

        DB::table('settings')->updateOrInsert(
            ['key' => 'restrict_registration_to_domains'],
            ['value' => $validated['restrict_registration_to_domains'] ? '1' : '0', 'updated_at' => now()]
        );

        return back();
    }

    public function storeDomain(Request $request): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', 'unique:allowed_email_domains,domain'],
        ]);

        AllowedEmailDomain::create(['domain' => strtolower($validated['domain'])]);

        return back();
    }

    public function destroyDomain(AllowedEmailDomain $domain): RedirectResponse
    {
        $this->requireAdmin();

        $domain->delete();

        return back();
    }

    public function clearFailedJobs(): RedirectResponse
    {
        $this->requireAdmin();

        try {
            DB::table('failed_jobs')->truncate();
        } catch (\Exception $e) {
            // Table may not exist
        }

        return back();
    }
}
