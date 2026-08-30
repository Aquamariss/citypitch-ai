<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class UploadPitchRequest extends FormRequest
{
    /**
     * Контейнеры, в которых браузеры отдают запись с микрофона.
     *
     * WebM и MP4 — контейнеры Matroska и ISO BMFF: по содержимому они
     * определяются как video/*, даже когда видеодорожки в них нет. Студия
     * запрашивает только микрофон, поэтому оба варианта считаем аудио.
     */
    private const ALLOWED_MIMETYPES = [
        'audio/webm',
        'video/webm',
        'audio/ogg',
        'application/ogg',
        'audio/mp4',
        'video/mp4',
        'audio/x-m4a',
        'audio/mpeg',
        'audio/wav',
        'audio/x-wav',
        'audio/flac',
        'audio/x-flac',
    ];

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
            'audio' => ['required', 'file', 'mimetypes:'.implode(',', self::ALLOWED_MIMETYPES), 'max:256000'],
            'duration' => ['required', 'integer', 'min:10', 'max:'.config('pitching.max_duration_seconds', 720)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'audio.mimetypes' => 'Не удалось распознать формат записи. Попробуйте записать питч ещё раз или в другом браузере.',
            'audio.max' => 'Файл записи слишком большой.',
            'duration.min' => 'Запись слишком короткая для разбора.',
        ];
    }

    /**
     * Форматы записи различаются от браузера к браузеру, поэтому отклонённый
     * тип фиксируем в логе — иначе разбираться приходится вслепую.
     */
    protected function failedValidation(Validator $validator): void
    {
        if ($validator->errors()->has('audio') && $this->hasFile('audio')) {
            Log::warning('Pitch upload rejected', [
                'detected_mime' => $this->file('audio')->getMimeType(),
                'client_mime' => $this->file('audio')->getClientMimeType(),
                'extension' => $this->file('audio')->getClientOriginalExtension(),
                'errors' => $validator->errors()->get('audio'),
            ]);
        }

        parent::failedValidation($validator);
    }
}
