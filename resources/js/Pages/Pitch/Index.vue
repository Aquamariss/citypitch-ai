<script setup lang="ts">
import { computed } from 'vue';
import AppLayout from '@/Layouts/AppLayout.vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import RecordingStudio from '@/Components/RecordingStudio/index.vue';
import ScoreRing from '@/Components/ScoreRing.vue';
import { route } from 'ziggy-js';
import { Mic } from 'lucide-vue-next';
import { useMethodology } from '@/lib/pitchMethodology';

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
};

const formatDate = (str: string): string => {
    if (!str) {
        return '';
    }

    try {
        return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
        return str;
    }
};

const attemptScore = (attempt: any): number => attempt.score ?? 0;

const page = usePage<{
    attempts_used: number;
    max_attempts: number;
    history_pitches: any[];
    draft_session: any;
}>();

const methodology = useMethodology();

const canAttempt = computed(() => page.props.attempts_used < page.props.max_attempts);

const activeTab = computed<'history' | 'recorder'>(() => {
    const search = page.url.includes('?') ? page.url.split('?')[1] : '';

    return new URLSearchParams(search).get('tab') === 'history' ? 'history' : 'recorder';
});

const isStudio = computed(() => activeTab.value === 'recorder' && canAttempt.value);

// Hand-rolled SVG area chart (no chart lib).
const CHART_W = 600;
const CHART_H = 180;

const chartPoints = computed(() =>
    (page.props.history_pitches ?? []).slice().reverse().map((pitch: any, index: number) => ({
        i: index + 1,
        score: attemptScore(pitch),
    })),
);

const chartX = (i: number, n: number): number => (n <= 1 ? 0 : (i / (n - 1)) * CHART_W);
const chartY = (score: number): number => CHART_H - (Math.min(100, Math.max(0, score)) / 100) * CHART_H;

const chartAreaPath = computed(() => {
    const pts = chartPoints.value;

    if (pts.length < 2) {
        return '';
    }

    const n = pts.length;
    let d = `M ${chartX(0, n)} ${CHART_H} L ${chartX(0, n)} ${chartY(pts[0].score)}`;

    for (let i = 1; i < n; i += 1) {
        d += ` L ${chartX(i, n)} ${chartY(pts[i].score)}`;
    }

    d += ` L ${chartX(n - 1, n)} ${CHART_H} Z`;

    return d;
});

const chartLinePath = computed(() => {
    const pts = chartPoints.value;

    if (pts.length < 2) {
        return '';
    }

    const n = pts.length;

    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${chartX(i, n)} ${chartY(p.score)}`).join(' ');
});
</script>

<template>
    <AppLayout>
        <Head :title="isStudio ? 'Студия записи — Citypitch-AI' : 'История — Citypitch-AI'" />

        <div v-if="activeTab === 'history'" class="page">
            <div class="page-title">
                <div>
                    <p class="caps">Архив</p>
                    <h1>История питчей</h1>
                    <p>{{ page.props.attempts_used }}/{{ page.props.max_attempts }} попыток · порог зачёта {{ methodology.pass_threshold }}%</p>
                </div>
                <Link :href="route('pitch.index')" class="btn btn-primary btn-sm">
                    Новая запись
                </Link>
            </div>

            <div v-if="page.props.history_pitches.length === 0" class="empty-state card">
                <div class="empty-state-icon">
                    <Mic :stroke-width="1.5" />
                </div>
                <h2>Нет записей</h2>
                <p>Вы ещё не сделали ни одной записи. Запишите первый питч!</p>
                <Link :href="route('pitch.index')" class="btn btn-primary" style="margin-top: 16px">
                    Записать питч
                </Link>
            </div>

            <div v-else class="history-layout">
                <div class="attempt-list">
                    <Link
                        v-for="attempt in page.props.history_pitches"
                        :key="attempt.id"
                        :href="route('pitch.result', { pitch: attempt.id })"
                        class="attempt-row"
                    >
                        <ScoreRing :score="attemptScore(attempt)" :label="String(Math.round(attemptScore(attempt)))" />
                        <div class="min-w-0">
                            <h3 class="truncate">{{ attempt.name || 'Питч городского проекта' }}</h3>
                            <p class="meta">
                                {{ formatTime(attempt.duration) }}
                                · {{ formatDate(attempt.created_at) }}
                            </p>
                        </div>
                        <span class="badge" :class="attempt.isPassed ? 'badge-success' : 'badge-danger'">
                            {{ attempt.isPassed ? 'Зачтено' : 'Не зачтено' }}
                        </span>
                    </Link>
                </div>

                <div v-if="chartPoints.length >= 2" class="card chart-card">
                    <h2>Прогресс</h2>
                    <svg
                        :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
                        preserveAspectRatio="none"
                        class="history-chart"
                        role="img"
                        aria-label="Динамика оценок по попыткам"
                    >
                        <defs>
                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stop-color="oklch(72% 0.09 65)" stop-opacity="0.25" />
                                <stop offset="95%" stop-color="oklch(72% 0.09 65)" stop-opacity="0" />
                            </linearGradient>
                        </defs>
                        <path :d="chartAreaPath" fill="url(#scoreGrad)" />
                        <path
                            :d="chartLinePath"
                            fill="none"
                            stroke="oklch(72% 0.09 65)"
                            stroke-width="2"
                            vector-effect="non-scaling-stroke"
                        />
                        <circle
                            v-for="(p, i) in chartPoints"
                            :key="p.i"
                            :cx="chartX(i, chartPoints.length)"
                            :cy="chartY(p.score)"
                            r="3"
                            fill="oklch(72% 0.09 65)"
                        >
                            <title>{{ p.score }}%</title>
                        </circle>
                    </svg>
                </div>
            </div>
        </div>

        <div v-else-if="!canAttempt" class="page">
            <div class="empty-state card">
                <div class="empty-state-icon" :style="{ background: 'var(--danger-subtle)', color: 'var(--danger)' }">
                    <Mic :stroke-width="1.5" />
                </div>
                <h2>Лимит исчерпан</h2>
                <p>
                    Вы исчерпали лимит попыток на сегодня ({{ page.props.max_attempts }}/{{ page.props.max_attempts }}). Возвращайтесь завтра!
                </p>
                <Link :href="`${route('pitch.index')}?tab=history`" class="btn btn-secondary" style="margin-top: 16px">
                    К истории
                </Link>
            </div>
        </div>

        <RecordingStudio v-else :draft-session="page.props.draft_session" />
    </AppLayout>
</template>

<style scoped>
.history-chart {
    width: 100%;
    height: 180px;
    display: block;
}
</style>
