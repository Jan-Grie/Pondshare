<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Models\AllowedEmailDomain;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        //Global registration check
        if(!SystemSetting::isRegistrationEnabled()) {
            abort(404);
        }

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
                //Custom Domain check
                function ($attribute, $value, $fail){
                    //If registration domain restrictions are enabled
                    if(SystemSetting::getValue('restrict_registration_to_domains', false)){
                        if(!AllowedEmailDomain::isAllowed($value)){
                            $fail('The email domain is not allowed to register.');
                        }
                    }
                },
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
