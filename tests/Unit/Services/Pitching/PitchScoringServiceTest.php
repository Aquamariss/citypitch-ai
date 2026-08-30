<?php

namespace Tests\Unit\Services\Pitching;

use App\DTO\PitchAnalysisResultDto;
use App\DTO\PitchSegmentationResultDto;
use App\DTO\TranscriptionResultDto;
use App\Services\Pitching\PitchMethodology;
use App\Services\Pitching\PitchScoringService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PitchScoringServiceTest extends TestCase
{
    private PitchScoringService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new PitchScoringService;
    }

    #[Test]
    public function finishing_early_is_not_penalised(): void
    {
        $this->assertSame(100.0, $this->service->timingScore(300));
        $this->assertSame(100.0, $this->service->timingScore(PitchMethodology::recommendedSeconds()));
    }

    #[Test]
    public function slight_overrun_lands_in_the_grace_zone(): void
    {
        $recommended = PitchMethodology::recommendedSeconds();
        $grace = PitchMethodology::timingGraceSeconds();

        $score = $this->service->timingScore($recommended + $grace);

        $this->assertSame((float) PitchMethodology::timingGraceScore(), $score);
        $this->assertGreaterThan($score, $this->service->timingScore($recommended + 5));
    }

    #[Test]
    public function reaching_the_hard_limit_zeroes_the_timing_score(): void
    {
        $this->assertSame(0.0, $this->service->timingScore(PitchMethodology::hardLimitSeconds()));
        $this->assertSame(0.0, $this->service->timingScore(PitchMethodology::hardLimitSeconds() + 60));
    }

    #[Test]
    public function structure_score_reflects_block_coverage(): void
    {
        $this->assertSame(100.0, $this->service->structureScore($this->segmentation('covered')));
        $this->assertSame(0.0, $this->service->structureScore($this->segmentation('missing')));
        $this->assertSame(50.0, $this->service->structureScore($this->segmentation('partial')));
    }

    #[Test]
    public function a_short_but_covered_block_scores_the_same_as_a_long_one(): void
    {
        $keys = PitchMethodology::keys();

        $short = new PitchSegmentationResultDto(blocks: array_map(
            fn (string $key): array => $this->block($key, 'covered', 0, 0),
            $keys,
        ));

        $this->assertSame(100.0, $this->service->structureScore($short));
    }

    #[Test]
    public function filler_words_are_counted_including_phrases(): void
    {
        $speech = $this->service->analyzeSpeech('Ну вот, мы как бы делаем проект, ну и как бы это важно');

        $counts = collect($speech['fillerTop'])->pluck('count', 'word');

        // «ну» ×2, «вот» ×1, «как бы» ×2 — фраза считается целиком, а не по словам.
        $this->assertSame(5, $speech['fillerCount']);
        $this->assertSame(2, $counts['как бы']);
        $this->assertSame(2, $counts['ну']);
        $this->assertGreaterThan(0, $speech['wordCount']);
    }

    #[Test]
    public function evaluation_sums_criteria_into_the_total_score(): void
    {
        $evaluation = $this->service->evaluate(
            $this->segmentation('covered'),
            $this->analysis(10.0),
            $this->transcription(580.0),
        );

        $this->assertSame(100, $evaluation->score);
        $this->assertTrue($evaluation->isPassed);
        $this->assertCount(count(PitchMethodology::criteria()), $evaluation->criteria);
        $this->assertCount(count(PitchMethodology::keys()), $evaluation->blocks);
        $this->assertFalse($evaluation->duration['wasCutOff']);
    }

    #[Test]
    public function a_pitch_with_no_blocks_covered_falls_below_the_threshold(): void
    {
        $evaluation = $this->service->evaluate(
            $this->segmentation('missing'),
            $this->analysis(3.0),
            $this->transcription(580.0),
        );

        $this->assertLessThan(PitchMethodology::passThreshold(), $evaluation->score);
        $this->assertFalse($evaluation->isPassed);
    }

    #[Test]
    public function timing_feedback_names_missing_blocks_without_touching_the_score(): void
    {
        $keys = PitchMethodology::keys();
        $blocks = array_map(fn (string $key): array => $this->block($key, 'covered', 0, 1), $keys);
        $blocks[5]['status'] = 'missing';
        $blocks[5]['startSegment'] = -1;
        $blocks[5]['endSegment'] = -1;

        $evaluation = $this->service->evaluate(
            new PitchSegmentationResultDto(blocks: $blocks),
            $this->analysis(8.0),
            $this->transcription(580.0),
        );

        $timing = collect($evaluation->criteria)->firstWhere('key', 'timing');

        $this->assertSame($timing['maxScore'], $timing['score'], 'Уложились в 10 минут — тайминг не штрафуется.');
        $this->assertStringContainsString(PitchMethodology::labels()[$keys[5]], $timing['feedback']);
    }

    #[Test]
    public function a_cut_off_recording_is_marked_and_scores_zero_for_timing(): void
    {
        $evaluation = $this->service->evaluate(
            $this->segmentation('covered'),
            $this->analysis(8.0),
            $this->transcription((float) PitchMethodology::hardLimitSeconds()),
        );

        $timing = collect($evaluation->criteria)->firstWhere('key', 'timing');

        $this->assertTrue($evaluation->duration['wasCutOff']);
        $this->assertSame(0.0, $timing['score']);
        $this->assertStringContainsString('не был завершён', $timing['feedback']);
    }

    #[Test]
    public function block_texts_are_assembled_from_segment_bounds(): void
    {
        $keys = PitchMethodology::keys();
        $blocks = array_map(fn (string $key): array => $this->block($key, 'missing', -1, -1), $keys);
        $blocks[0] = $this->block($keys[0], 'covered', 0, 0);
        $blocks[1] = $this->block($keys[1], 'covered', 1, 1);

        $texts = $this->service->buildBlockTexts(
            new PitchSegmentationResultDto(blocks: $blocks),
            [
                ['start' => 0.0, 'end' => 40.0, 'text' => 'Меня зовут Анна'],
                ['start' => 40.0, 'end' => 120.0, 'text' => 'Во дворах нет мест для встреч'],
            ],
        );

        $this->assertSame('Меня зовут Анна', $texts[0]['text']);
        $this->assertSame('Во дворах нет мест для встреч', $texts[1]['text']);
        $this->assertSame('', $texts[2]['text']);
    }

    #[Test]
    public function without_timecodes_the_whole_transcript_goes_to_the_model(): void
    {
        $keys = PitchMethodology::keys();
        $blocks = array_map(fn (string $key): array => $this->block($key, 'covered', -1, -1), $keys);

        $texts = $this->service->buildBlockTexts(
            new PitchSegmentationResultDto(blocks: $blocks),
            [],
            'Полная расшифровка питча',
        );

        $this->assertSame('Полная расшифровка питча', $texts[0]['text']);
    }

    private function segmentation(string $status): PitchSegmentationResultDto
    {
        return new PitchSegmentationResultDto(blocks: array_map(
            fn (string $key): array => $this->block($key, $status, 0, 1),
            PitchMethodology::keys(),
        ));
    }

    /**
     * @return array{key: string, status: string, startSegment: int, endSegment: int, feedback: string}
     */
    private function block(string $key, string $status, int $start, int $end): array
    {
        return [
            'key' => $key,
            'status' => $status,
            'startSegment' => $start,
            'endSegment' => $end,
            'feedback' => 'Комментарий по блоку.',
        ];
    }

    private function analysis(float $score): PitchAnalysisResultDto
    {
        $criteria = [];

        foreach (array_keys(PitchMethodology::aiCriteria()) as $key) {
            $criteria[$key] = ['score' => $score, 'feedback' => 'Обратная связь.'];
        }

        return new PitchAnalysisResultDto(
            name: 'Соседский центр',
            summary: 'Общее впечатление.',
            overallFeedback: 'Главный совет.',
            structureFeedback: 'О структуре.',
            criteria: $criteria,
        );
    }

    private function transcription(float $duration): TranscriptionResultDto
    {
        return new TranscriptionResultDto(
            text: 'Меня зовут Анна. Во дворах нет мест для встреч.',
            duration: $duration,
            language: 'ru',
            segments: [
                ['start' => 0.0, 'end' => 40.0, 'text' => 'Меня зовут Анна'],
                ['start' => 40.0, 'end' => $duration, 'text' => 'Во дворах нет мест для встреч'],
            ],
        );
    }
}
