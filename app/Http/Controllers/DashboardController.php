<?php 

namespace App\Http\Controllers;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\ActivityLog;
use App\Models\ShareLink;
use App\Models\Pond;
use App\Models\PondDailyDownload;
use App\Models\File;
use App\Models\SystemSetting;
use App\Models\ExternalUploadLink;


class DashboardController extends Controller
{
    /**
     * Display the dashboard view.
     */
    public function index()
    {
        $user = Auth::user();

        //Get total ponds and files
        $totalPonds = Pond::where('user_id', $user->id)->count();

        $totalFiles = File::where('user_id', $user->id)->count();

        //Get used Quota in Byts
        $usedBytes = $user->usedQuota();
        $maxBytes = $user->getQuotaBytes();

        $remainingBytes = $user->quotaRemaining();

        $usedPercentage = $user->quotaPercent();

        $warningTreshold = SystemSetting::quotaWarningThresholdPercent();
        $showWarning = $usedPercentage >= $warningTreshold;

        $userPondIds = Pond::where('user_id', $user->id)->pluck('id');

        //Get Expiring Share Links
        $expiringShareLinks = ShareLink::whereHas('pond', function($query) use ($user){
                $query->where('user_id', $user->id);
            })
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [Carbon::now(), Carbon::now()->addDays(7)])
            ->get()
            ->map(function($link){
                return [
                    'id' => $link->id,
                    'pondID' => $link->pond->id,
                    'pondName' => $link->pond->name,
                    'name' => $link->name,
                    'type' => "share",
                    'expires_at' => $link->expires_at,
                ];
            });

        $activeUploadLinksCount = ExternalUploadLink::whereIn('pond_id', $userPondIds)
            ->where(function($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', Carbon::now());
            })
            ->count();

        $expiringUploadLinksCount = ExternalUploadLink::whereIn('pond_id', $userPondIds)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [Carbon::now(), Carbon::now()->addDays(7)])
            ->count();

        return Inertia::render('dashboard/index', [
            'totalPonds' => $totalPonds,
            'totalFiles' => $totalFiles,
            'usedBytes' => $usedBytes,
            'maxBytes' => $maxBytes,
            'remainingBytes' => $remainingBytes,
            'expiringLinksCount'      => $expiringShareLinks->count(),
            'expiringLinks'           => $expiringShareLinks,
            'activeUploadLinksCount'  => $activeUploadLinksCount,
            'expiringUploadLinksCount' => $expiringUploadLinksCount,
            'recentActivities'        => ActivityLog::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn ($a) => [
                    'type'        => $a->type,
                    'description' => $a->description,
                    'when'        => $a->created_at->toISOString(),
                    'metadata'    => $a->metadata,
                ])
                ->toArray(),
            'usedPercentage' => $usedPercentage,
            'showWarning' => $showWarning,
        ]);
    }

    public function usage()
    {
        $user = Auth::user();

        $maxBytes = $user->getQuotaBytes();
        $usedBytes = $user->usedQuota();

        $ponds = Pond::where("user_id", $user->id)
            ->select("id", "name")
            ->get();

        $pondIds = $ponds->pluck("id")->all();
        $pondNames = $ponds->pluck("name")->all();

        $dates = collect();
        for ($i = 6; $i >= 0; $i--){
            $dates->push(Carbon::now()->subDays($i)->format('Y-m-d'));
        }

        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $fileCount = File::whereIn("pond_id", $pondIds)->count();

        $downloadCount = ShareLink::whereIn("pond_id", $pondIds)->sum("download_count");

        $averageFileSize = $fileCount > 0
            ? (int) round($usedBytes / $fileCount)
            : 0;

        $largestFileRecord = File::whereIn("pond_id", $pondIds)
            ->orderByDesc("size")
            ->first();

        $largestFile = $largestFileRecord 
            ? [
                "name" => $largestFileRecord->name . '.' . $largestFileRecord->extension,
                "size" => (int) $largestFileRecord->size,
            ]
            : [ "name" => null, "createdAt" => null];

        $lastUploadRecord = File::whereIn("pond_id", $pondIds)
            ->orderByDesc("created_at")
            ->first();
        
            $lastUpload = $lastUploadRecord
            ? [
                "name" => $lastUploadRecord->name . '.' . $lastUploadRecord->extension,
                "createdAt" => $lastUploadRecord->created_at,
            ]
            : [ "name" => null, "createdAt" => null];

        $topFileType = File::whereIn("pond_id", $pondIds)
                ->select("extension", DB::raw("COUNT(*) as count"))
                ->groupBy("extension")
                ->orderByDesc("count")
                ->value("extension");

        $topFileType = $topFileType ? strtoupper($topFileType) : null;

        $activeLinks = ShareLink::whereIn("pond_id", $pondIds)
                ->where(function($q) {
                    $q->whereNull("expires_at")
                      ->orWhere("expires_at", ">", Carbon::now());  
                })
                ->count();
        
        $records = PondDailyDownload::whereIn("pond_id", $pondIds)
                ->whereBetween("date", [$startDate, $endDate])
                ->get()
                ->groupBy(function ($item) {
                    return $item->pond_id . "_" . Carbon::parse($item->date)->format('Y-m-d');
                });

        $downloadChartData = [];
        foreach($dates as $date){
            $row = ["date" => $date];
            foreach($ponds as $pond){
                $key = $pond->id . "_" . $date;
                $count = isset($record[$key])
                    ? (int) $records[$key]->first()->download_count
                    : 0;
                $row[$pond->name] = $count;
            }
            $downloadChartData[] = $row;
        }

        $usedPercentage = $user->quotaPercent();

        $warningTreshold = SystemSetting::quotaWarningThresholdPercent();
        $showWarning = $usedPercentage >= $warningTreshold;

        return Inertia::render("dashboard/usage", [
            "usedBytes" => $usedBytes,
            "maxBytes" => $maxBytes,
            "fileCount" => $fileCount,
            "downloadCount" => $downloadCount,
            "averageFileSize" => $averageFileSize,
            "largestFile" => $largestFile,
            "lastUpload" => $lastUpload,
            "topFileType" => $topFileType,
            "activeLinks" => $activeLinks,
            "downloadChartData" => $downloadChartData,
            "pondNames" => $pondNames,
            "dates" => $dates->all(),
            "showWarning" => $showWarning,
            "usedPercentage" => $usedPercentage,
        ]);
    }

}