<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPitchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'video' => ['required', 'file', 'mimetypes:video/webm,video/mp4,audio/webm,audio/mp4,audio/ogg', 'max:256000'],
            'duration' => ['required', 'integer', 'min:30', 'max:'.config('pitching.max_duration_seconds', 600)],
            'media_type' => ['required', 'string', 'in:video,audio'],
        ];
    }
}
