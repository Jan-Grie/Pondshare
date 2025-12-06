<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    /**
     * Prüft, ob der User die Einzeldatei herunterladen darf.
     */
    public function download(User $user, File $file): bool
    {
        // Datei gehört zu einem Pond; nur der Pond-Owner darf sie downloaden
        return $file->pond->user_id === $user->id;
    }

    public function delete(User $user, File $file): bool
    {
        return $file->pond->user_id === $user->id;
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
