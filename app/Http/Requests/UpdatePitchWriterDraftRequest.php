<?php

namespace App\Http\Requests;

use App\Services\Pitching\PitchDraftService;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePitchWriterDraftRequest extends FormRequest
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
        $maxLength = (int) config('pitching.writer_max_block_length', 1500);
        $blockRules = [];

        foreach (PitchDraftService::KEYS as $key) {
            $blockRules["blocks.{$key}"] = ['nullable', 'string', "max:{$maxLength}"];
        }

        return [
            'blocks' => ['required', 'array'],
            ...$blockRules,
            'updated_at' => ['nullable', 'string'],
        ];
    }
}
