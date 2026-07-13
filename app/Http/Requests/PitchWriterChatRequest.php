<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PitchWriterChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'content' => [
                'required',
                'string',
                'max:'.config('pitching.writer_max_message_length', 4000),
            ],
        ];
    }
}
