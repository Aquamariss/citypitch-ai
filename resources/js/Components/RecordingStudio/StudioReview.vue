<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Download, Maximize2, Minimize2, Pause, Play, Trash2, X } from 'lucide-vue-next';
import VoiceMemoWaveform from './VoiceMemoWaveform.vue';

const props = withDefaults(defineProps<{
    src?: string | null;
    file?: File | Blob | null;
    fallbackDuration?: number;
    onReset?: () => void;
    onSubmit?: () => void;
}>(), {
    src: null,
    file: null,
    fallbackDuration: 0,
});

const formatClock = (seconds = 0): string => {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
};

const syntheticPeaks = (count = 120): number[] =>
    Array.from({ length: count }, (_, i) => 0.08 + ((i * 37) % 17) / 40);

const extractPeaksFromFile = async (file: Blob, samples = 180): Promise<{ peaks: number[]; duration: number }> => {
    const audioContext = new AudioContext();

    try {
        const buffer = await file.arrayBuffer();
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        const channel = decoded.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / samples));
        const peaks: number[] = [];

        for (let i = 0; i < samples; i += 1) {
            const start = i * blockSize;
            let peak = 0;

            for (let j = 0; j < blockSize && start + j < channel.length; j += 1) {
                peak = Math.max(peak, Math.abs(channel[start + j]));
            }

            peaks.push(Math.min(1, peak * 1.6));
        }

        return { peaks, duration: decoded.duration };
    } finally {
        if (audioContext.state !== 'closed') {
            await audioContext.close();
        }
    }
};

const mediaRef = ref<HTMLMediaElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(props.fallbackDuration);
const playbackUrl = ref<string | null>(props.src || null);
const mediaError = ref<string | null>(null);
const confirmDelete = ref(false);
const isFullscreen = ref(false);
const peaks = ref<number[] | null>(null);

watch([() => props.file, () => props.src], ([file, src], _old, onCleanup) => {
    if (!(file instanceof Blob)) {
        playbackUrl.value = src || null;

        return;
    }

    const objectUrl = URL.createObjectURL(file);
    playbackUrl.value = objectUrl;
    onCleanup(() => URL.revokeObjectURL(objectUrl));
}, { immediate: true });

watch(() => props.file, (file, _old, onCleanup) => {
    let cancelled = false;
    onCleanup(() => { cancelled = true; });

    if (!(file instanceof Blob)) {
        peaks.value = syntheticPeaks();

        return;
    }

    extractPeaksFromFile(file)
        .then((result) => {
            if (cancelled) {
                return;
            }

            peaks.value = result.peaks;

            if (result.duration && Number.isFinite(result.duration)) {
                duration.value = duration.value > 0 ? duration.value : result.duration;
            }
        })
        .catch(() => {
            if (!cancelled) {
                peaks.value = syntheticPeaks();
            }
        });
}, { immediate: true });

watch(() => isPlaying.value, (playing, _old, onCleanup) => {
    if (!playing) {
        return;
    }

    let raf = 0;

    const sync = () => {
        raf = requestAnimationFrame(sync);
        const media = mediaRef.value;

        if (media && Number.isFinite(media.currentTime)) {
            currentTime.value = media.currentTime;

            if (Number.isFinite(media.duration) && media.duration > 0) {
                duration.value = media.duration;
            }
        }
    };

    raf = requestAnimationFrame(sync);
    onCleanup(() => cancelAnimationFrame(raf));
});

onMounted(() => {
    const onFullscreenChange = () => {
        isFullscreen.value = Boolean(document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
});

const mediaDuration = computed(() => (duration.value > 0 ? duration.value : props.fallbackDuration));
const progress = computed(() => (mediaDuration.value > 0 ? Math.min(1, Math.max(0, currentTime.value / mediaDuration.value)) : 0));

const handleTimeUpdate = () => {
    if (mediaRef.value) {
        currentTime.value = mediaRef.value.currentTime;
    }
};

const handleLoadedMetadata = () => {
    const media = mediaRef.value;

    if (media && Number.isFinite(media.duration) && media.duration > 0) {
        duration.value = media.duration;
    }
};

const handleEnded = () => {
    isPlaying.value = false;

    const media = mediaRef.value;

    if (media && Number.isFinite(media.duration)) {
        currentTime.value = media.duration;
    }
};

const handleMediaError = () => {
    isPlaying.value = false;
    mediaError.value = 'Файл записи недоступен';
};

const confirmDeleteReset = () => {
    confirmDelete.value = false;
    props.onReset?.();
};

const togglePlay = async () => {
    const media = mediaRef.value;

    if (!media || !playbackUrl.value) {
        mediaError.value = 'Нет аудио для воспроизведения';

        return;
    }

    try {
        if (!media.paused && !media.ended) {
            media.pause();
            isPlaying.value = false;

            return;
        }

        const limit = Number.isFinite(media.duration) ? media.duration : mediaDuration.value;

        if (media.ended || (limit > 0 && media.currentTime >= limit - 0.05)) {
            media.currentTime = 0;
            currentTime.value = 0;
        }

        await media.play();
        isPlaying.value = true;
        mediaError.value = null;
    } catch (error: any) {
        isPlaying.value = false;
        mediaError.value = error?.message || 'Не удалось воспроизвести запись';
    }
};

const seekToRatio = (ratio: number) => {
    const media = mediaRef.value;

    if (!media) {
        return;
    }

    const limit = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : mediaDuration.value;
    const next = Math.min(limit, Math.max(0, ratio * limit));
    media.currentTime = next;
    currentTime.value = next;
};

const toggleFullscreen = async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen?.();
        }
    } catch {
        // Fullscreen may be blocked by the browser.
    }
};
</script>

<template>
    <div class="wc-review">
        <div class="wc-review-audio">
            <audio
                ref="mediaRef"
                :src="playbackUrl ?? undefined"
                preload="auto"
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleLoadedMetadata"
                @play="isPlaying = true"
                @pause="isPlaying = false"
                @ended="handleEnded"
                @error="handleMediaError"
            />
            <VoiceMemoWaveform :peaks="peaks" :progress="progress" :height="180" fit="span" />
        </div>

        <button type="button" class="wc-close" @click="confirmDelete = true" aria-label="Закрыть запись">
            <X :stroke-width="2" />
        </button>

        <p v-if="mediaError" class="wc-error" role="alert">
            {{ mediaError }}
        </p>

        <div class="wc-review-bar">
            <div class="wc-playback">
                <button
                    type="button"
                    class="wc-playback-play"
                    @click="togglePlay"
                    :aria-label="isPlaying ? 'Пауза' : 'Воспроизвести'"
                >
                    <Pause v-if="isPlaying" :stroke-width="2" fill="currentColor" />
                    <Play v-else :stroke-width="2" fill="currentColor" />
                </button>
                <span class="wc-playback-time mono">{{ formatClock(currentTime) }}</span>
                <button
                    type="button"
                    class="wc-seek"
                    aria-label="Перемотать"
                    @click="(event) => {
                        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                        seekToRatio((event.clientX - rect.left) / rect.width);
                    }"
                >
                    <span class="wc-seek-track">
                        <span class="wc-seek-fill" :style="{ width: `${progress * 100}%` }" />
                        <span class="wc-seek-head" :style="{ left: `${progress * 100}%` }" />
                    </span>
                </button>
                <span class="wc-playback-time mono">{{ formatClock(mediaDuration) }}</span>
            </div>

            <div class="wc-review-actions">
                <button type="button" class="wc-save" @click="onSubmit">
                    <Download :stroke-width="2" aria-hidden="true" />
                    Сохранить
                </button>
                <button type="button" class="wc-icon-btn" @click="confirmDelete = true" aria-label="Удалить запись">
                    <Trash2 :stroke-width="2" />
                </button>
                <button
                    type="button"
                    class="wc-fullscreen"
                    @click="toggleFullscreen"
                    :aria-label="isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'"
                >
                    <Minimize2 v-if="isFullscreen" :stroke-width="2" />
                    <Maximize2 v-else :stroke-width="2" />
                </button>
            </div>
        </div>

        <div v-if="confirmDelete" class="wc-confirm" role="dialog" aria-modal="true" aria-labelledby="wc-delete-title">
            <button type="button" class="wc-close wc-close--overlay" @click="confirmDelete = false" aria-label="Отмена">
                <X :stroke-width="2" />
            </button>
            <div class="wc-confirm-body">
                <h2 id="wc-delete-title">Удалить эту аудиозапись?</h2>
                <p>Если вы не сохранили эту запись, она будет потеряна.</p>
                <div class="wc-confirm-actions">
                    <button type="button" class="wc-confirm-cancel" @click="confirmDelete = false">
                        Отмена
                    </button>
                    <button
                        type="button"
                        class="wc-confirm-delete"
                        @click="confirmDeleteReset"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
