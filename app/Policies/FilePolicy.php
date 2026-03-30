<?php

namespace App\Policies;

use App\Models\File;
use App\Models\PondCollaborator;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    private function isCollaborator(User $user, File $file): bool
    {
        return PondCollaborator::where('pond_id', $file->pond_id)
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Prüft, ob der User die Einzeldatei herunterladen darf.
     */
    public function download(User $user, File $file): bool
    {
        return $file->pond->user_id === $user->id || $this->isCollaborator($user, $file);
    }

    public function delete(User $user, File $file): bool
    {
        return $file->pond->user_id === $user->id
            || PondCollaborator::where('pond_id', $file->pond_id)
                ->where('user_id', $user->id)
                ->where('permission', 'write')
                ->exists();
    }

    // Prüft, ob der Nutzer eine Datei wiederherstellen darf
    public function restore(User $user, File $file): bool
    {
        return $file->pond->user_id === $user->id;
    }

    // Erlaubt endgültiges Löschen
    public function forceDelete(User $user, File $file): bool
    {
        return $file->pond->user_id === $user->id;
    }
}
