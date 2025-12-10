<?php 

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only allow authorized users to make this request
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            "query" => ["required", "string", "min:2", "max:255"],
            "limit" => ["sometimes", "integer", "min:1", "max:100"],
        ];
    }

    public function prepareForValidation(): void
    {
        // Trim query to avoid leading/trailing spaces
        $this->merge([
            "query" => trim((string) $this->input("query", "")),
        ]);
    }

    public function messages(): array
    {
        return [
            "query.required" => __("validation.search.query.required"),
            "query.string" => __("validation.search.query.string"),
            "query.min" => __("validation.search.query.min"),
            "query.max" => __("validation.search.query.max"),
            "limit.integer" => __("validation.search.limit.integer"),
            "limit.min" => __("validation.search.limit.min"),
            "limit.max" => __("validation.search.limit.max"),
        ];
    }
}