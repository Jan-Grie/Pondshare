<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

use Inertia\Response;

class PasswordChangePromptController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {

        if ($request->user()->must_change_password) {
            return Inertia::render('auth/change-password', [
                'status' => $request->session()->get('status'),
            ]);
        }

        // Wenn Flag false, weiterleiten
        return redirect()->intended(route('dashboard', absolute: false));
    }


    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return redirect()
            ->route('dashboard')
            ->with('success');
    }    
}