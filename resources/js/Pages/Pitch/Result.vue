<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { route } from 'ziggy-js';
import TranscriptPlayer from '@/Components/TranscriptPlayer.vue';
import ScoreRing from '@/Components/ScoreRing.vue';

const page = usePage<{ result: any; media_type: 'audio' | 'video' }>();

const result = computed(() => page.props.result ?? {});
const analysis = computed(() => result.value.analysis ?? {});
const transcription = computed(() => result.value.transcription ?? {});

const totalScore = computed(() =>
    (analysis.value.criteria ?? []).reduce((sum: number, c: any) => sum + (c.score || 0), 0),
);
const totalMax = computed(() =>
    (analysis.value.criteria ?? []).reduce((sum: number, c: any) => sum + (c.maxScore || 0), 0),
);
const totalPct = computed(() =>
    totalMax.value > 0 ? Math.round((totalScore.value / totalMax.value) * 100) : 0,
);

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
        <Head :title="analysis.name ? `${analysis.name} — результат` : 'Результаты питча'" />

        <div class="page">
            <div class="page-title">
                <div>
                    <p class="caps">Результат</p>
                    <h1>{{ analysis.name || 'Результат анализа' }}</h1>
                    <p>Оценка по критериям инвестора · порог принятия 60%</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <a :href="route('pitch.download', { pitch: result.id })" download class="btn btn-secondary btn-sm">
                        Скачать {{ page.props.media_type === 'audio' ? 'аудио' : 'видео' }}
                    </a>
                    <Link :href="route('pitch.index')" class="btn btn-secondary btn-sm">
                        Новая попытка
                    </Link>
                </div>
            </div>

            <section class="result-hero card" aria-labelledby="verdict-headline">
                <div class="verdict-score">
                    <ScoreRing :score="totalPct" :max-score="100" :size="140" :label="String(totalPct)" />
                </div>
                <div>
                    <span class="badge" :class="analysis.isPassed ? 'badge-success' : 'badge-danger'">
                        {{ analysis.isPassed ? 'Принято' : 'Не принято' }}
                    </span>
                    <h2 class="verdict-headline" id="verdict-headline">
                        {{ analysis.isPassed ? 'Питч проходит порог' : 'Пока ниже порога принятия' }}
                    </h2>
                    <p class="verdict-copy">
                        {{ analysis.summary || analysis.overallFeedback || (analysis.isPassed
                            ? 'Структура и ясность на уровне. Дожимайте слабые критерии перед демо-днём.'
                            : 'Сфокусируйтесь на самых слабых блоках ниже — затем перезапишите попытку.') }}
                    </p>
                </div>
            </section>

            <section aria-labelledby="criteria-label">
                <h2 class="caps section-label" id="criteria-label">Критерии</h2>
                <div class="criteria-grid">
                    <article v-for="criterion in analysis.criteria ?? []" :key="criterion.name" class="card" style="padding: 16px">
                        <div class="flex items-center gap-3 mb-2">
                            <ScoreRing :score="criterion.score" :max-score="criterion.maxScore" :size="56" />
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold truncate">{{ criterion.name }}</h3>
                                <p class="text-xs mono" style="color: var(--muted)">
                                    {{ criterion.maxScore > 0 ? Math.round((criterion.score / criterion.maxScore) * 100) : 0 }}%
                                </p>
                            </div>
                        </div>
                        <p class="text-xs leading-relaxed" style="color: var(--muted)">
                            {{ criterion.feedback }}
                        </p>
                    </article>
                </div>
            </section>

            <div class="result-split" style="margin-top: 24px">
                <section class="card" style="padding: 16px">
                    <TranscriptPlayer
                        :media-url="result.videoUrl"
                        :transcript="transcription.segments ?? []"
                        :media-type="page.props.media_type"
                        :duration="transcription.duration"
                    />
                </section>

                <section class="card" aria-labelledby="feedback-title">
                    <h2 class="feedback-title" id="feedback-title">Что править в первую очередь</h2>
                    <ol class="feedback-list">
                        <li v-for="item in priorities" :key="item.name">
                            <strong>{{ item.name }}</strong>
                            — {{ item.feedback || 'Усильте этот блок перед следующей записью.' }}
                        </li>
                    </ol>
                    <Link
                        :href="route('pitch-writer.index')"
                        class="btn btn-primary"
                        style="margin-top: 18px; width: 100%"
                    >
                        Открыть в Райтере
                    </Link>
                </section>
            </div>
        </div>
    </AppLayout>
</template>
