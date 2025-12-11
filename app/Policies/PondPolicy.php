<?php

namespace App\Policies;

use App\Models\Pond;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Auth\Access\HandlesAuthorization;

class PondPolicy
{

    use HandlesAuthorization;
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pond $pond): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Pond $pond): bool
    {        
        return $pond->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pond $pond): bool
    {
        // Erlaubt nur, wenn der angemeldete Benutzer der Owner ist:
        return $pond->user_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Pond $pond): bool
    {
        // Nur der Owner darf wiederherstellen
        return $pond->user_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Pond $pond): bool
    {
        // Nur der Owner darf endgültig löschen
        return $pond->user_id === $user->id;
    }

    /**
    * Prüft, ob der User den ZIP-Download für einen Pond ausführen darf.
    */
    public function download(User $user, Pond $pond): bool
    {
        // Nur, wenn der Pond user_id == authentifizierter Nutzer ist
        return $pond->user_id === $user->id;
    }
}
