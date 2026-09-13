<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { route } from 'ziggy-js';
import TranscriptPlayer from '@/Components/TranscriptPlayer.vue';
import ScoreRing from '@/Components/ScoreRing.vue';
import { formatClock, useMethodology } from '@/lib/pitchMethodology';

const page = usePage<{ result: any }>();
const methodology = useMethodology();

const result = computed(() => page.props.result ?? {});
const analysis = computed(() => result.value.analysis ?? {});
const transcription = computed(() => result.value.transcription ?? {});

const score = computed<number>(() => analysis.value.score ?? 0);
const duration = computed(() => analysis.value.duration ?? {});
const speech = computed(() => analysis.value.speech ?? { fillerCount: 0, fillerTop: [] });

const isOvertime = computed(() =>
    (duration.value.actualSeconds ?? 0) > (duration.value.recommendedSeconds ?? methodology.value.recommended_seconds));

const STATUS_LABELS: Record<string, string> = {
    covered: 'прозвучал',
    partial: 'вскользь',
    missing: 'не прозвучал',
};

const STATUS_COLORS: Record<string, string> = {
    covered: 'var(--success)',
    partial: 'var(--warning)',
    missing: 'var(--danger)',
};

const blocks = computed(() =>
    (analysis.value.blocks ?? []).map((block: any) => ({
        ...block,
        statusLabel: STATUS_LABELS[block.status] ?? block.status,
        color: STATUS_COLORS[block.status] ?? 'var(--muted)',
    })),
);

const coveredCount = computed(() =>
    (analysis.value.blocks ?? []).filter((block: any) => block.status === 'covered').length);

const priorities = computed(() =>
    [...(analysis.value.criteria ?? [])]
        .map((criterion: any) => ({
            ...criterion,
            pct: criterion.maxScore > 0 ? criterion.score / criterion.maxScore : 0,
        }))
        .sort((a: any, b: any) => a.pct - b.pct)
        .slice(0, 3),
);
</script>

<template>
    <AppLayout>
        <Head :title="analysis.name ? `${analysis.name} — разбор` : 'Разбор питча'" />

        <div class="page">
            <div class="page-title">
                <div>
                    <p class="caps">Разбор</p>
                    <h1>{{ analysis.name || 'Питч городского проекта' }}</h1>
                    <p>Методика питчинга городских проектов · порог зачёта {{ methodology.pass_threshold }}%</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <a :href="route('pitch.download', { pitch: result.id })" download class="btn btn-secondary btn-sm">
                        Скачать аудио
                    </a>
                    <Link :href="route('pitch.index')" class="btn btn-secondary btn-sm">
                        Новая попытка
                    </Link>
                </div>
            </div>

            <div v-if="duration.wasCutOff" class="cutoff-banner" role="status">
                Запись остановилась на технической отметке {{ formatClock(duration.hardLimitSeconds) }} — питч не был завершён.
                Разбор построен по тому, что успело прозвучать.
            </div>

            <section class="result-hero card" aria-labelledby="verdict-headline">
                <div class="verdict-score">
                    <ScoreRing :score="score" :max-score="100" :size="140" :label="String(score)" />
                </div>
                <div>
                    <span class="badge" :class="analysis.isPassed ? 'badge-success' : 'badge-danger'">
                        {{ analysis.isPassed ? 'Зачтено' : 'Не зачтено' }}
                    </span>
                    <h2 class="verdict-headline" id="verdict-headline">
                        {{ analysis.isPassed ? 'Питч проходит порог' : 'Пока ниже порога зачёта' }}
                    </h2>
                    <p class="verdict-copy">
                        {{ analysis.summary || analysis.overallFeedback }}
                    </p>

                    <div class="verdict-facts">
                        <span :class="{ 'is-warn': isOvertime }">
                            Длительность {{ formatClock(duration.actualSeconds ?? 0) }}
                            из {{ formatClock(duration.recommendedSeconds ?? methodology.recommended_seconds) }}
                        </span>
                        <span>Блоков раскрыто {{ coveredCount }} из {{ blocks.length }}</span>
                        <span v-if="speech.fillerCount > 0">Слов-паразитов {{ speech.fillerCount }}</span>
                    </div>
                </div>
            </section>

            <section aria-labelledby="criteria-label">
                <h2 class="caps section-label" id="criteria-label">Критерии</h2>
                <div class="criteria-grid">
                    <article v-for="criterion in analysis.criteria ?? []" :key="criterion.key ?? criterion.name" class="card" style="padding: 16px">
                        <div class="flex items-center gap-3 mb-2">
                            <ScoreRing :score="criterion.score" :max-score="criterion.maxScore" :size="56" />
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold truncate">{{ criterion.name }}</h3>
                                <p class="text-xs mono" style="color: var(--muted)">
                                    {{ criterion.score }} из {{ criterion.maxScore }}
                                </p>
                            </div>
                        </div>
                        <p class="text-xs leading-relaxed" style="color: var(--muted)">
                            {{ criterion.feedback }}
                        </p>
                    </article>
                </div>
            </section>

            <section aria-labelledby="structure-label" style="margin-top: 24px">
                <h2 class="caps section-label" id="structure-label">Структура питча</h2>
                <div class="card block-list">
                    <article v-for="(block, index) in blocks" :key="block.key" class="block-row">
                        <span class="block-index mono">{{ Number(index) + 1 }}</span>
                        <span class="block-status" :style="{ color: block.color }">
                            <span class="block-dot" :style="{ backgroundColor: block.color }" aria-hidden="true" />
                            {{ block.statusLabel }}
                        </span>
                        <div class="block-body">
                            <h3>{{ block.title }}</h3>
                            <p v-if="block.feedback">{{ block.feedback }}</p>
                        </div>
                    </article>
                </div>
                <p class="block-note">
                    Рекомендуемое время блоков — ориентир для подготовки. На оценку влияет только то,
                    раскрыт ли блок, и общая длительность питча.
                </p>
            </section>

            <div class="result-split" style="margin-top: 24px">
                <section class="card" style="padding: 16px">
                    <TranscriptPlayer
                        :media-url="result.audioUrl"
                        :transcript="transcription.segments ?? []"
                        :duration="transcription.duration"
                    />
                </section>

                <section class="card" aria-labelledby="feedback-title">
                    <h2 class="feedback-title" id="feedback-title">Что править в первую очередь</h2>
                    <ol class="feedback-list">
                        <li v-for="item in priorities" :key="item.key ?? item.name">
                            <strong>{{ item.name }}</strong>
                            — {{ item.feedback || 'Усильте этот блок перед следующей записью.' }}
                        </li>
                    </ol>
                    <p v-if="analysis.overallFeedback" class="feedback-overall">
                        {{ analysis.overallFeedback }}
                    </p>
                    <Link
                        :href="route('pitch-writer.index')"
                        class="btn btn-primary"
                        style="margin-top: 18px; width: 100%"
                    >
                        Доработать текст в Райтере
                    </Link>
                </section>
            </div>
        </div>
    </AppLayout>
</template>

<style scoped>
.cutoff-banner {
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--warning);
    background: color-mix(in oklch, var(--warning) 12%, transparent);
    border: 1px solid color-mix(in oklch, var(--warning) 35%, transparent);
}

.verdict-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-top: 14px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
}

.verdict-facts .is-warn {
    color: var(--warning);
}

.block-list {
    padding: 8px 0;
}

.block-row {
    display: grid;
    grid-template-columns: 28px 120px 1fr;
    align-items: start;
    gap: 12px;
    padding: 12px 16px;
}

.block-row + .block-row {
    border-top: 1px solid var(--border-subtle);
}

.block-index {
    font-size: 13px;
    color: var(--muted);
    padding-top: 2px;
}

.block-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding-top: 2px;
    white-space: nowrap;
}

.block-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex: none;
}

.block-body h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
}

.block-body p {
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
    margin: 0;
}

.block-note {
    margin-top: 10px;
    font-size: 12px;
    color: var(--muted);
}

.feedback-overall {
    margin-top: 14px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--muted);
}

@media (max-width: 640px) {
    .block-row {
        grid-template-columns: 24px 1fr;
    }

    .block-status {
        grid-column: 2;
        order: 3;
    }
}
</style>
