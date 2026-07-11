<?php

namespace App\Models;

use App\Domains\Pitching\Enums\MediaType;
use App\Domains\Pitching\Enums\PitchStatus;
use App\Domains\Pitching\Enums\PitchStep;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pitch extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => PitchStatus::class,
            'step' => PitchStep::class,
            'media_type' => MediaType::class,
            'transcription' => 'array',
            'result' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
