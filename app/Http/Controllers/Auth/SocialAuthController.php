<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;

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

        return redirect()->intended('/dashboard');
    }
}
