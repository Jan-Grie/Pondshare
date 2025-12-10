<?php

namespace App\Http\Controllers;


use App\Http\Requests\SearchRequest;
use App\Models\Pond;
use App\Models\File;
use App\Models\ShareLink;
use App\Models\ExternalUploadLink;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SearchController extends Controller


{
    public function index(SearchRequest $request): JsonResponse
    {
        $data = $request->validated();
        $query = trim($data['query']);
        $limit = $data['limit'] ?? 10;
        
        // If the query is empty, return an empty result set
        if ($query === '') {
            return response()->json([
                'ponds' => [],
                'files' => [],
                'links' => [],
                'upload_links' => [],
                'users' => [],
            ]);
        }

        $ponds = Pond::query()
            ->where('name', 'like', "%{$query}%")
            ->where('user_id', auth()->id())
            ->limit($limit)
            ->get(['id', 'name']);

        $files = File::query()
            ->with('pond:id,name,user_id')
            ->where(fn ($w) => $w
                ->where('name', 'like', "%{$query}%")
            )
            ->whereHas('pond', fn ($p) => $p->where('user_id', auth()->id()))
            ->limit($limit)
            ->get(['id', 'name', 'extension', 'pond_id'])
            ->map(fn ($file) => [
                'id' => $file->id,
                'name' => $file->name,
                'extension' => $file->extension,
                'pond_id' => $file->pond_id,
                'pond_name' => $file->pond?->name,
            ]);

        $links = ShareLink::query()
            ->with('pond:id,name,user_id')
            ->where('name', 'like', "%{$query}%")
            ->whereHas('pond', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->limit($limit)
            ->get(['id', 'name', 'pond_id'])
            ->map(fn ($link) => [
                'id' => $link->id,
                'title' => $link->name,
                'pond_id' => $link->pond_id,
                'pond_name' => $link->pond?->name,
            ]);
        
        $uploadLinks = ExternalUploadLink::query()
            ->with('pond:id,name,user_id')
            ->where('name', 'like', "%{$query}%")
            ->whereHas('pond', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->limit($limit)
            ->get(['id', 'name', 'pond_id'])
            ->map(fn ($link) => [
                'id' => $link->id,
                'title' => $link->name,
                'pond_id' => $link->pond_id,
                'pond_name' => $link->pond?->name,
            ]);

        $users = [];
        if (auth()->user()?->isAdmin()) {
            $users = User::query()
                ->where(fn ($w) => $w
                    ->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                )
                ->limit($limit)
                ->get(['id', 'name', 'email']);
        }


        return response()->json([
            'ponds'        => $ponds,
            'files'        => $files,
            'links'        => $links,
            'upload_links' => $uploadLinks,
            'users'        => $users,
        ]);        

    }
}