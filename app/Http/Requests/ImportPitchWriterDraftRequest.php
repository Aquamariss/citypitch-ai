<?php

namespace App\Http\Requests;

use App\Domains\Pitching\Support\PitchDraftBlocks;
use Illuminate\Foundation\Http\FormRequest;

class ImportPitchWriterDraftRequest extends FormRequest
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

        foreach (PitchDraftBlocks::KEYS as $key) {
            $blockRules["blocks.{$key}"] = ['nullable', 'string', "max:{$maxLength}"];
        }

        return [
            'blocks' => ['required', 'array'],
            ...$blockRules,
        ];
    }
}
