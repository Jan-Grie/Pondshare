<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = Auth::user();

        $rules = [
            'locale' => ['required', 'string', 'in:en,de'],
            'app_layout' => ['required', 'string', 'in:sidebar,topnav'],
        ];
        
        if ($user->provider === null) {
            $rules['name'] = ['required', 'string', 'max:255'];

            $rules['email'] = [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ];
        }

        return $rules;
    }

}
