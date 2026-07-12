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
            'messages' => [
                'required',
                'array',
                'min:1',
                'max:'.config('pitching.writer_max_messages', 20),
            ],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => [
                'required',
                'string',
                'max:'.config('pitching.writer_max_message_length', 4000),
            ],
        ];
    }
}
