<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import {
    ChevronRight,
    Info,
    Maximize2,
    Mic,
    Minimize2,
    PanelRightClose,
    Pause,
    Play,
    Video,
} from 'lucide-vue-next';
import PitchRecorder from '@/Components/PitchRecorder/index.vue';
import ProcessingOverlay from '@/Components/PitchRecorder/ProcessingOverlay.vue';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner.vue';
import PitchDraftPanel from '@/Components/PitchDraftPanel.vue';
import { usePitchDraft } from '@/composables/usePitchDraft';
import { useRecordingCountdown } from '@/composables/useRecordingCountdown';
import { useRecordingHotkeys } from '@/composables/useRecordingHotkeys';
import { useResizableSidePanel } from '@/composables/useResizableSidePanel';
import CameraMirror from './CameraMirror.vue';
import PermissionModal from './PermissionModal.vue';
import PitchRulesDrawer from './PitchRulesDrawer.vue';
import StudioReview from './StudioReview.vue';
import VoiceMemoWaveform from './VoiceMemoWaveform.vue';

function formatClock(seconds = 0): string {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}

const props = withDefaults(defineProps<{
    defaultDuration?: number;
    draftSession?: any;
}>(), {
    defaultDuration: 180,
    draftSession: null,
});

const mode = ref<'video' | 'audio'>('video');
const rulesOpen = ref(false);
const isRecording = ref(false);
const studioState = ref<any>(null);
const isFullscreen = ref(false);

const pitchDraft = usePitchDraft({
    initialSession: props.draftSession,
    enableLocalImport: true,
});

const stageRef = ref<HTMLElement | null>(null);

const draftPanel = useResizableSidePanel({
    widthKey: 'pitch-ai-draft-width',
    visibleKey: 'pitch-ai-draft-visible',
    defaultWidth: 420,
    minWidth: 280,
    maxRatio: 0.4,
    containerRef: stageRef,
});

const isVideoMode = computed(() => mode.value === 'video');

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

    rulesOpen.value = false;
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

const toggleFullscreen = async () => {
    const target = stageRef.value ?? document.documentElement;

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await target.requestFullscreen?.();
        }
    } catch {
        // Fullscreen may be blocked by the browser.
    }
};

useRecordingHotkeys({
    enabled: () => Boolean(studioState.value) && !studioState.value.processing && !studioState.value.isRecorded,
    isRecording,
    isCountingDown: () => countdown.isCountingDown,
    canStart: () => studioState.value?.initState === 'ready' && !studioState.value?.isRecorded,
    onStart: requestStart,
    onStop: handleStop,
});

watch(isRecording, (recording) => {
    if (recording) {
        rulesOpen.value = false;
    }
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

onMounted(() => {
    const onFullscreenChange = () => {
        isFullscreen.value = Boolean(document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
});

const isRecorded = computed(() => studioState.value?.isRecorded ?? false);
const isPaused = computed(() => studioState.value?.isPaused ?? false);
const initState = computed(() => studioState.value?.initState ?? 'idle');
const isProcessing = computed(() => Boolean(studioState.value?.processing));
const maxDuration = computed(() => studioState.value?.maxDurationSeconds ?? 600);

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

const handleSelectMode = (nextMode: 'video' | 'audio') => {
    if (isRecording.value || countdown.isCountingDown || isRecorded.value) {
        return;
    }

    countdown.cancel();
    mode.value = nextMode;
    studioState.value = null;
    isRecording.value = false;
};

const toggleRules = () => {
    rulesOpen.value = !rulesOpen.value;
};

const closeRules = () => {
    rulesOpen.value = false;
};

const onRecordingStateChange = (recording: boolean) => {
    isRecording.value = recording;
};

const onStudioStateChange = (state: any) => {
    studioState.value = state;
};

const onRequestAudioFallback = () => handleSelectMode('audio');
</script>

<template>
    <div
        ref="stageRef"
        class="studio studio--camera"
        data-studio
        :data-mode="mode"
        :data-state="dataState"
    >
        <!-- Keep recorder mounted through review so blob URL is not revoked. -->
        <PitchRecorder
            layout="studio"
            :mode="mode"
            :default-duration="defaultDuration"
            :on-recording-state-change="onRecordingStateChange"
            :on-studio-state-change="onStudioStateChange"
            :on-request-audio-fallback="onRequestAudioFallback"
        />

        <ProcessingOverlay v-if="isProcessing" :progress="studioState?.progress" />

        <StudioReview
            v-if="!isProcessing && isRecorded && studioState"
            :src="studioState.recordedUrl"
            :file="studioState.recordedFile"
            :is-video="isVideoMode"
            :fallback-duration="studioState.recordingTime"
            :on-reset="studioState.onReset"
            :on-submit="studioState.onSubmit"
        />

        <template v-if="!isProcessing && !isRecorded">
            <ErrorBanner :errors="visibleErrors" variant="video" />

            <div
                class="wc-stage"
                :class="{ 'has-draft': draftPanel.visible, 'is-resizing': draftPanel.isResizing }"
                :style="draftPanel.visible ? { '--draft-panel-width': `${draftPanel.width}px` } : undefined"
            >
                <div class="wc-preview">
                    <header v-if="!isRecording && !countdown.isCountingDown" class="wc-top">
                        <div class="wc-top-actions wc-top-actions--end">
                            <div class="mode-switch" role="group" aria-label="Режим записи">
                                <button
                                    type="button"
                                    :class="{ active: isVideoMode }"
                                    :aria-pressed="isVideoMode"
                                    :disabled="isRecording || countdown.isCountingDown"
                                    @click="handleSelectMode('video')"
                                >
                                    <Video :stroke-width="1.5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    :class="{ active: !isVideoMode }"
                                    :aria-pressed="!isVideoMode"
                                    :disabled="isRecording || countdown.isCountingDown"
                                    @click="handleSelectMode('audio')"
                                >
                                    <Mic :stroke-width="1.5" aria-hidden="true" />
                                </button>
                            </div>
                            <button
                                type="button"
                                class="wc-cues-toggle-btn"
                                :aria-pressed="draftPanel.visible"
                                :aria-label="draftPanel.visible ? 'Скрыть черновик' : 'Показать черновик'"
                                :title="draftPanel.visible ? 'Скрыть черновик' : 'Показать черновик'"
                                @click="draftPanel.setVisible(!draftPanel.visible)"
                            >
                                <PanelRightClose v-if="draftPanel.visible" :stroke-width="2" />
                                <ChevronRight v-else :stroke-width="2" />
                            </button>
                        </div>
                    </header>
                    <button
                        v-else-if="!draftPanel.visible"
                        type="button"
                        class="wc-cues-toggle-btn wc-cues-toggle-btn--float"
                        aria-label="Показать черновик"
                        title="Показать черновик"
                        @click="draftPanel.setVisible(true)"
                    >
                        <ChevronRight :stroke-width="2" />
                    </button>

                    <div :class="['wc-media', { 'wc-media--audio': !isVideoMode }]">
                        <CameraMirror
                            v-if="isVideoMode && studioState"
                            placement="fullscreen"
                            :init-state="initState"
                            :init-error="studioState.initError"
                            :is-recording="isRecording"
                            :preview-video-ref="studioState.previewVideoRef"
                            :reattach-preview="studioState.reattachPreview"
                            is-video-mode
                        />
                        <div v-else class="wc-audio-stage">
                            <div class="wc-audio-icon" aria-hidden="true">
                                <Mic :stroke-width="1.5" />
                            </div>
                            <VoiceMemoWaveform
                                :stream="studioState?.previewStream"
                                :is-recording="isRecording"
                                :height="160"
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
                                Готов к записи
                            </p>
                        </div>
                    </div>

                    <div v-if="isRecording || countdown.isCountingDown" class="wc-timer" aria-live="polite">
                        <span class="wc-timer-dot" :class="{ 'is-paused': isPaused }" aria-hidden="true" />
                        <span class="mono">
                            {{ formatClock(studioState?.recordingTime ?? 0) }} / {{ formatClock(maxDuration) }}
                        </span>
                    </div>

                    <div v-if="countdown.isCountingDown" class="countdown-overlay" role="status" aria-live="assertive">
                        <div class="countdown-num countdown-digit">{{ countdown.count }}</div>
                    </div>

                    <footer class="wc-dock">
                        <template v-if="!isRecording && !countdown.isCountingDown">
                            <button
                                type="button"
                                class="wc-side-btn"
                                :aria-expanded="rulesOpen"
                                aria-label="Правила записи"
                                @click="toggleRules"
                            >
                                <Info :stroke-width="2" />
                            </button>

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

                    <button
                        type="button"
                        class="wc-fullscreen"
                        :aria-label="isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'"
                        @click="toggleFullscreen"
                    >
                        <Minimize2 v-if="isFullscreen" :stroke-width="2" />
                        <Maximize2 v-else :stroke-width="2" />
                    </button>
                </div>

                <PitchDraftPanel
                    v-if="draftPanel.visible"
                    :draft="pitchDraft.draft"
                    :on-change="pitchDraft.updateDraftLocally"
                    :on-clear="pitchDraft.clearDraft"
                    :on-undo="pitchDraft.undoDraft"
                    :can-undo="pitchDraft.canUndo"
                    :highlighted-blocks="pitchDraft.highlightedBlocks"
                    :status-message="pitchDraft.statusMessage"
                    :width="draftPanel.width"
                    :min-width="draftPanel.minWidth"
                    :max-width="draftPanel.maxWidth"
                    :on-hide="() => draftPanel.setVisible(false)"
                    :on-resize-start="draftPanel.beginResize"
                    context="studio"
                />
            </div>

            <PitchRulesDrawer :open="rulesOpen" :on-close="closeRules" />
        </template>

        <PermissionModal
            :open="showPermissionModal"
            :error="studioState?.initError"
            :is-video="isVideoMode"
            :on-close="() => permissionDismissed = true"
        />
    </div>
</template>
