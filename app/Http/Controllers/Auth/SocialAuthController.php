<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class SocialAuthController extends Controller
{
    public function redirectAzure()
    {
        return Socialite::driver('azure')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callbackAzure()
    {
        try {
            $azureUser = Socialite::driver('azure')->user();
        } catch (\Throwable $e) {
            return redirect('/login')
                ->withErrors(['azure' => 'Azure Login fehlgeschlagen']);
        }

        /**
         * Wichtige Azure Felder:
         * $azureUser->getId()       -> Azure Object ID
         * $azureUser->getEmail()
         * $azureUser->getName()
         * $azureUser->user['tid']  -> Tenant ID
         */

        $user = User::where('email', $azureUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name'              => $azureUser->getName() ?? 'Azure User',
                'email'             => $azureUser->getEmail(),
                'password'          => bcrypt(Str::random(32)),
                'email_verified_at' => now(),
                'provider'          => 'azure',
                'provider_id'       => $azureUser->getId(),                
                'provider_token'    => Crypt::encryptString($azureUser->token),
                'quota_bytes'      => 1073741824, // 1 GB Standard-Quota
            ]);
        } else {
            // Optional: Provider nachziehen
            if (! $user->provider_id) {
                $user->update([
                    'provider'    => 'azure',
                    'provider_id' => $azureUser->getId(),
                ]);
            }
        }

        Auth::login($user, true);

        // Avatar bei jedem Login synchronisieren
        $this->storeMicrosoftAvatar(
            $azureUser->token,
            $user
        );

        return redirect()->intended('/dashboard');
    }

    private function storeMicrosoftAvatar(string $accessToken, User $user): void
    {
        $response = Http::withToken($accessToken)
            ->get('https://graph.microsoft.com/v1.0/me/photo/$value');

        // Kein Avatar vorhanden → ruhig abbrechen
        if ($response->failed()) {
            return;
        }

        // sicherer, nicht erratbarer Dateiname
        $filename = Str::uuid() . '.jpg';
        $path = "avatars/azure/{$filename}";

        // 🔒 PRIVAT speichern (storage/app/...)
        Storage::put($path, $response->body());

        // optional: alten Avatar löschen
        if ($user->avatar_url) {
            Storage::delete($user->avatar_url);
        }

        // Pfad in DB speichern
        $user->forceFill([
            'avatar_url' => $path,
        ])->save();
    }    
}
