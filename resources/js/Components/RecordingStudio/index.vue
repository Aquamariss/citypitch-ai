<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { Mic, NotebookPen, Pause, Play } from 'lucide-vue-next';
import PitchRecorder from '@/Components/PitchRecorder/index.vue';
import ProcessingOverlay from '@/Components/PitchRecorder/ProcessingOverlay.vue';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner.vue';
import PitchDraftPanel from '@/Components/PitchDraftPanel.vue';
import PitchRulesContent from '@/Components/PitchRulesContent.vue';
import CitySilhouette from '@/Components/CitySilhouette.vue';
import { usePitchDraft } from '@/composables/usePitchDraft';
import { useRecordingCountdown } from '@/composables/useRecordingCountdown';
import { useRecordingHotkeys } from '@/composables/useRecordingHotkeys';
import { formatClock, useMethodology } from '@/lib/pitchMethodology';
import PermissionModal from './PermissionModal.vue';
import StudioReview from './StudioReview.vue';
import VoiceMemoWaveform from './VoiceMemoWaveform.vue';

const props = withDefaults(defineProps<{
    draftSession?: any;
}>(), {
    draftSession: null,
});

const page = usePage<{ max_attempts: number; attempts_used: number }>();
const methodology = useMethodology();

const isRecording = ref(false);
const studioState = ref<any>(null);
const writerOpen = ref(false);

const pitchDraft = usePitchDraft({
    initialSession: props.draftSession,
    enableLocalImport: true,
});

const beginRecording = () => {
    studioState.value?.onStart?.();
};

const countdown = useRecordingCountdown({
    onComplete: beginRecording,
    seconds: 3,
});

const requestStart = () => {
    if (!studioState.value || studioState.value.initState !== 'ready' || isRecording.value || studioState.value.isRecorded) {
        return;
    }

    countdown.start();
};

const handleStop = () => {
    countdown.cancel();
    studioState.value?.onStop?.();
};

const handlePauseToggle = () => {
    if (!studioState.value?.isRecording) {
        return;
    }

    if (studioState.value.isPaused) {
        studioState.value.onResume?.();
    } else {
        studioState.value.onPause?.();
    }
};

const handleRecordToggle = () => {
    if (countdown.isCountingDown) {
        countdown.cancel();

        return;
    }

    if (isRecording.value) {
        handleStop();

        return;
    }

    requestStart();
};

useRecordingHotkeys({
    enabled: () => Boolean(studioState.value) && !studioState.value.processing && !studioState.value.isRecorded && !writerOpen.value,
    isRecording,
    isCountingDown: () => countdown.isCountingDown,
    canStart: () => studioState.value?.initState === 'ready' && !studioState.value?.isRecorded,
    onStart: requestStart,
    onStop: handleStop,
});

watchEffect((onCleanup) => {
    if (!countdown.isCountingDown) {
        return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            countdown.cancel();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
});

// Черновик — поверх страницы, поэтому Escape закрывает его как обычную панель.
watchEffect((onCleanup) => {
    if (!writerOpen.value) {
        return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            writerOpen.value = false;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
});

onMounted(() => {
    onBeforeUnmount(() => countdown.cancel());
});

const isRecorded = computed(() => studioState.value?.isRecorded ?? false);
const isPaused = computed(() => studioState.value?.isPaused ?? false);
const initState = computed(() => studioState.value?.initState ?? 'idle');
const isProcessing = computed(() => Boolean(studioState.value?.processing));
const recordingTime = computed<number>(() => studioState.value?.recordingTime ?? 0);
const recommendedSeconds = computed(() => methodology.value.recommended_seconds);
const hardLimitSeconds = computed(() => methodology.value.hard_limit_seconds);
const attemptsLeft = computed(() => Math.max(0, page.props.max_attempts - page.props.attempts_used));

/**
 * Предупреждения по таймингу: рекомендуемое время мягкое, технический предел —
 * жёсткий, поэтому о приближении к нему нужно сказать заранее.
 */
const timingNotice = computed<{ text: string; level: 'info' | 'warn' | 'danger' } | null>(() => {
    if (!isRecording.value) {
        return null;
    }

    const elapsed = recordingTime.value;
    const remaining = hardLimitSeconds.value - elapsed;

    if (remaining <= 30) {
        return { text: `Запись остановится через ${Math.max(0, Math.round(remaining))} сек`, level: 'danger' };
    }

    if (elapsed >= recommendedSeconds.value) {
        return {
            text: `Рекомендуемое время вышло — запас до ${formatClock(hardLimitSeconds.value)}`,
            level: 'warn',
        };
    }

    if (recommendedSeconds.value - elapsed <= 60) {
        return { text: 'Приближаетесь к рекомендуемому времени', level: 'info' };
    }

    return null;
});

const permissionDismissed = ref(false);
const showPermissionModal = computed(() => initState.value === 'error' && !permissionDismissed.value);

watch(initState, (state) => {
    if (state !== 'error') {
        permissionDismissed.value = false;
    }
});

const dataState = computed(() => {
    if (isRecorded.value) {
        return 'idle';
    }

    if (countdown.isCountingDown) {
        return 'countdown';
    }

    if (isRecording.value) {
        return isPaused.value ? 'paused' : 'recording';
    }

    return 'idle';
});

const visibleErrors = computed(() => [
    ...Object.values(studioState.value?.formErrors ?? {}),
    ...(studioState.value?.recorderError && !isRecorded.value ? [studioState.value.recorderError] : []),
    ...(studioState.value?.initError && studioState.value.initState === 'error' && !showPermissionModal.value
        ? [studioState.value.initError]
        : []),
]);

const onRecordingStateChange = (recording: boolean) => {
    isRecording.value = recording;
};

const onStudioStateChange = (state: any) => {
    studioState.value = state;
};
</script>

<template>
    <div class="studio-page">
        <!-- Recorder is headless in studio layout: it stays mounted while panels open and close. -->
        <PitchRecorder
            layout="studio"
            :on-recording-state-change="onRecordingStateChange"
            :on-studio-state-change="onStudioStateChange"
        />

        <section class="studio-intro">
            <h1>Тренажёр питча городских проектов</h1>
            <p>
                Посмотрите структуру питча — девять блоков и рекомендуемое время на каждый.
                Время блоков — подсказка, следить за ним не нужно: важно раскрыть все девять тем
                и уложиться в {{ formatClock(recommendedSeconds) }}.
            </p>
            <p>
                Питч записывается голосом, без видео — браузер попросит доступ к микрофону.
                Доступно {{ page.props.max_attempts }} попыток в день, сейчас осталось {{ attemptsLeft }}.
                Готовую запись можно послушать и скачать на экране разбора.
            </p>
            <p>
                После записи ИИ-эксперт даст подробную обратную связь и рекомендации
                по структуре и качеству вашего питча.
            </p>

            <button type="button" class="btn btn-secondary btn-sm studio-writer-open" @click="writerOpen = true">
                <NotebookPen :stroke-width="1.5" aria-hidden="true" />
                Черновик питча
            </button>

            <p class="studio-support">
                Есть вопросы? Напишите в службу заботы:
                <a href="https://t.me/cityuniversity_support" target="_blank" rel="noopener noreferrer">Telegram</a>,
                <a href="https://max.ru/id4205423727_biz" target="_blank" rel="noopener noreferrer">MAX</a>,
                <a href="mailto:info2-0@cityuniversity.ru">info2-0@cityuniversity.ru</a>
            </p>
        </section>

        <div class="studio-columns">
            <div
                class="studio-recorder studio--camera"
                data-mode="audio"
                :data-state="dataState"
            >
                <ProcessingOverlay v-if="isProcessing" :progress="studioState?.progress" />

                <StudioReview
                    v-else-if="isRecorded && studioState"
                    :src="studioState.recordedUrl"
                    :file="studioState.recordedFile"
                    :fallback-duration="studioState.recordingTime"
                    :on-reset="studioState.onReset"
                    :on-submit="studioState.onSubmit"
                />

                <template v-else>
                    <ErrorBanner :errors="visibleErrors" variant="video" />

                    <div class="wc-preview">
                        <div class="wc-media wc-media--audio">
                            <div class="wc-audio-stage">
                                <div class="wc-audio-icon" aria-hidden="true">
                                    <Mic :stroke-width="1.5" />
                                </div>
                                <VoiceMemoWaveform
                                    :stream="studioState?.previewStream"
                                    :is-recording="isRecording"
                                    :height="120"
                                />
                                <p v-if="initState === 'loading'" class="wc-audio-status">
                                    Подключаем микрофон…
                                </p>
                                <p v-else-if="initState === 'error'" class="wc-audio-status wc-audio-status--error">
                                    {{ studioState?.initError ?? 'Нет доступа к микрофону' }}
                                </p>
                                <p
                                    v-else-if="initState === 'ready' && !isRecording && !countdown.isCountingDown"
                                    class="wc-audio-status"
                                >
                                    Готов к записи · рекомендуемое время {{ formatClock(recommendedSeconds) }}
                                </p>
                            </div>
                        </div>

                        <div v-if="isRecording || countdown.isCountingDown" class="wc-timer" aria-live="polite">
                            <span class="wc-timer-dot" :class="{ 'is-paused': isPaused }" aria-hidden="true" />
                            <span class="mono">
                                {{ formatClock(recordingTime) }} / {{ formatClock(recommendedSeconds) }}
                            </span>
                        </div>

                        <p
                            v-if="timingNotice"
                            class="wc-timing-notice"
                            :class="`is-${timingNotice.level}`"
                            role="status"
                            aria-live="polite"
                        >
                            {{ timingNotice.text }}
                        </p>

                        <div v-if="countdown.isCountingDown" class="countdown-overlay" role="status" aria-live="assertive">
                            <div class="countdown-num countdown-digit">{{ countdown.count }}</div>
                        </div>

                        <footer class="wc-dock">
                            <template v-if="!isRecording && !countdown.isCountingDown">
                                <span class="wc-dock-spacer" aria-hidden="true" />

                                <button
                                    type="button"
                                    class="wc-record"
                                    :disabled="!studioState || initState !== 'ready'"
                                    aria-label="Начать запись"
                                    @click="handleRecordToggle"
                                >
                                    <span class="wc-record-dot" aria-hidden="true" />
                                </button>

                                <span class="wc-dock-spacer" aria-hidden="true" />
                            </template>
                            <div v-else class="wc-dock-center">
                                <button
                                    type="button"
                                    class="wc-stop"
                                    :aria-label="countdown.isCountingDown ? 'Отменить обратный отсчёт' : 'Остановить запись'"
                                    @click="handleRecordToggle"
                                >
                                    <span class="wc-stop-square" aria-hidden="true" />
                                </button>

                                <button
                                    v-if="isRecording"
                                    type="button"
                                    class="wc-pause"
                                    :aria-label="isPaused ? 'Продолжить запись' : 'Пауза'"
                                    @click="handlePauseToggle"
                                >
                                    <Play v-if="isPaused" :stroke-width="2" fill="currentColor" />
                                    <Pause v-else :stroke-width="2" fill="currentColor" />
                                </button>
                            </div>
                        </footer>
                    </div>
                </template>
            </div>

            <aside class="studio-structure" aria-label="Структура питча">
                <PitchRulesContent embedded />
            </aside>
        </div>

        <CitySilhouette class="studio-skyline" :height="52" />

        <!-- Черновик открывается поверх страницы и не размонтирует запись. -->
        <div class="writer-drawer" :class="{ 'is-open': writerOpen }" :inert="!writerOpen">
            <div class="writer-drawer-backdrop" @click="writerOpen = false" />
            <div class="writer-drawer-panel" role="dialog" aria-modal="false" aria-label="Черновик питча">
                <PitchDraftPanel
                    :draft="pitchDraft.draft"
                    :on-change="pitchDraft.updateDraftLocally"
                    :on-clear="pitchDraft.clearDraft"
                    :on-undo="pitchDraft.undoDraft"
                    :can-undo="pitchDraft.canUndo"
                    :highlighted-blocks="pitchDraft.highlightedBlocks"
                    :status-message="pitchDraft.statusMessage"
                    :on-hide="() => (writerOpen = false)"
                    :hide-navigation="isRecording"
                    context="studio"
                />
            </div>
        </div>

        <!-- Пока черновик открыт, таймер и индикатор записи остаются на виду. -->
        <div v-if="isRecording && writerOpen" class="rec-pill" role="status" aria-live="polite">
            <span class="rec-pill-dot" :class="{ 'is-paused': isPaused }" aria-hidden="true" />
            <span class="mono">{{ formatClock(recordingTime) }} / {{ formatClock(recommendedSeconds) }}</span>
        </div>

        <PermissionModal
            :open="showPermissionModal"
            :error="studioState?.initError"
            :on-close="() => permissionDismissed = true"
        />
    </div>
</template>
