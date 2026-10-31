<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Support\AustralianMobile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['mobile'] = AustralianMobile::normalise($input['mobile'] ?? '');

        Validator::make($input, [
            ...$this->profileRules(),
            'mobile' => ['required', 'regex:'.AustralianMobile::PATTERN, Rule::unique(User::class)],
            'password' => $this->passwordRules(),
        ], [
            'mobile.regex' => 'Enter an Australian mobile number, for example 0412 345 678.',
            'mobile.unique' => 'This mobile number is already registered.',
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'mobile' => $input['mobile'],
            'password' => $input['password'],
        ]);
    }
}
