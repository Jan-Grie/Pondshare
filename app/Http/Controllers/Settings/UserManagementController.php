<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    private function requireAdmin(): void
    {
        abort_unless(Auth::user()->isAdmin(), 403);
    }

    public function index(Request $request): Response
    {
        $this->requireAdmin();

        $users = User::with('role')
            ->when($request->search, fn ($q) => $q->where('email', 'like', '%'.$request->search.'%'))
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'active' => $user->active,
                'role_id' => $user->role_id,
                'role' => $user->role?->name,
                'quota_bytes' => $user->quota_bytes,
                'used_bytes' => $user->getUsedBytes(),
                'quota_percent' => $user->quotaPercent(),
            ]);

        return Inertia::render('settings/users', [
            'users' => $users,
            'roles' => Role::all(['id', 'name']),
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => ['required', Password::defaults()],
            'role_id' => ['required', 'integer', Rule::exists(Role::class, 'id')],
            'quota_gb' => ['required', 'numeric', 'min:0'],
            'active' => ['boolean'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => $validated['role_id'],
            'quota_bytes' => (int) ($validated['quota_gb'] * 1024 * 1024 * 1024),
            'active' => $validated['active'] ?? true,
            'email_verified_at' => now(),
            'locale' => 'de',
            'must_change_password' => true,
        ]);

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'role_id' => ['required', 'integer', Rule::exists(Role::class, 'id')],
            'quota_gb' => ['required', 'numeric', 'min:0'],
            'active' => ['boolean'],
            'email_verified' => ['boolean'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'quota_bytes' => (int) ($validated['quota_gb'] * 1024 * 1024 * 1024),
            'active' => $validated['active'] ?? $user->active,
            'email_verified_at' => ($validated['email_verified'] ?? false)
                ? ($user->email_verified_at ?? now())
                : null,
        ]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin();

        abort_if($user->id === Auth::id(), 403, 'You cannot delete your own account.');

        $user->delete();

        return back();
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin();

        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
            'must_change_password' => ['boolean'],
        ]);

        $user->update([
            'password' => $validated['password'],
            'must_change_password' => $validated['must_change_password'] ?? false,
        ]);

        return back();
    }
}
