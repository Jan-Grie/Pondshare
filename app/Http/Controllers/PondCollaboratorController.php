<?php

namespace App\Http\Controllers;

use App\Models\Pond;
use App\Models\PondCollaborator;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PondCollaboratorController extends Controller
{
    public function store(Request $request, Pond $pond): RedirectResponse
    {
        abort_unless($pond->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'permission' => ['required', 'in:read,write'],
        ]);

        $user = User::where('email', $validated['email'])->firstOrFail();

        if ($user->id === $pond->user_id) {
            return back()->withErrors(['email' => 'The pond owner cannot be added as a collaborator.']);
        }

        PondCollaborator::updateOrCreate(
            ['pond_id' => $pond->id, 'user_id' => $user->id],
            ['permission' => $validated['permission']]
        );

        return back();
    }

    public function destroy(Pond $pond, User $user): RedirectResponse
    {
        abort_unless($pond->user_id === Auth::id(), 403);

        PondCollaborator::where('pond_id', $pond->id)
            ->where('user_id', $user->id)
            ->delete();

        return back();
    }
}
