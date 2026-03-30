<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AllowedEmailDomain;
use App\Models\File;
use App\Models\Pond;
use App\Models\User;
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

        $linkSettings = [
            'force_password_for_all_links' => (bool) DB::table('settings')->where('key', 'force_password_for_all_links')->value('value'),
            'link_password_min_length' => (int) (DB::table('settings')->where('key', 'link_password_min_length')->value('value') ?? 8),
            'require_expiry_for_links' => (bool) DB::table('settings')->where('key', 'require_expiry_for_links')->value('value'),
            'default_link_expiration_days' => (int) (DB::table('settings')->where('key', 'default_link_expiration_days')->value('value') ?? 30),
            'max_links_expiration_days' => (int) (DB::table('settings')->where('key', 'max_links_expiration_days')->value('value') ?? 365),
            'default_quota_gb' => round((int) (DB::table('settings')->where('key', 'default_quota_bytes')->value('value') ?? 5368709120) / (1024 * 1024 * 1024), 2),
            'quota_email_warning_threshold' => (int) (DB::table('settings')->where('key', 'quota_email_warning_threshold')->value('value') ?? 80),
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
            'linkSettings' => $linkSettings,
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

    public function updateLinkSettings(Request $request): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'force_password_for_all_links' => ['boolean'],
            'link_password_min_length' => ['required', 'integer', 'min:4', 'max:64'],
            'require_expiry_for_links' => ['boolean'],
            'default_link_expiration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'max_links_expiration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'default_quota_gb' => ['required', 'numeric', 'min:0'],
            'quota_email_warning_threshold' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $boolKeys = ['force_password_for_all_links', 'require_expiry_for_links'];
        foreach ($boolKeys as $key) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => ($validated[$key] ?? false) ? '1' : '0', 'updated_at' => now()]
            );
        }

        $intKeys = [
            'link_password_min_length',
            'default_link_expiration_days',
            'max_links_expiration_days',
            'quota_email_warning_threshold',
        ];
        foreach ($intKeys as $key) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => (string) $validated[$key], 'updated_at' => now()]
            );
        }

        // Convert GB → bytes
        $quotaBytes = (int) round($validated['default_quota_gb'] * 1024 * 1024 * 1024);
        DB::table('settings')->updateOrInsert(
            ['key' => 'default_quota_bytes'],
            ['value' => (string) $quotaBytes, 'updated_at' => now()]
        );

        return back();
    }

    public function adminOverview(): Response
    {
        $this->requireAdmin();

        $totalUsers = User::count();
        $activeUsers = User::where('active', true)->count();
        $totalPonds = Pond::count();
        $totalFiles = File::count();
        $totalStorageBytes = File::sum('size');

        $topUsers = User::withCount('ponds')
            ->select('id', 'name', 'email', 'quota_bytes')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'used_bytes' => $u->getUsedBytes(),
                'quota_bytes' => $u->quota_bytes,
                'ponds_count' => $u->ponds_count,
            ])
            ->sortByDesc('used_bytes')
            ->values()
            ->take(10);

        return Inertia::render('settings/admin-overview', [
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_ponds' => $totalPonds,
                'total_files' => $totalFiles,
                'total_storage_bytes' => $totalStorageBytes,
            ],
            'top_users' => $topUsers,
        ]);
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
