<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Play, Pause, Volume2 } from 'lucide-vue-next';

interface TranscriptPhrase {
    id?: string | number;
    start: number;
    end: number;
    text: string;
}

const props = withDefaults(defineProps<{
    mediaUrl?: string | null;
    transcript?: TranscriptPhrase[];
    mediaType?: 'audio' | 'video';
    duration?: number;
}>(), {
    mediaUrl: null,
    transcript: () => [],
    mediaType: 'video',
    duration: 0,
});

const playerRef = ref<HTMLMediaElement | null>(null);
const transcriptContainerRef = ref<HTMLElement | null>(null);
const activePhraseRef = ref<HTMLElement | null>(null);

const currentTime = ref(0);
const mediaDuration = ref(props.duration);
const isPlaying = ref(false);
const playerKey = ref(0);
let activeIndex = -1;

// The file is ogg/opus with a real duration; Infinity hack would break seeking.
// Trust the element's own metadata first, fall back to the stored duration.
const readDuration = () => {
    const media = playerRef.value;
    const elDuration = media?.duration;

    if (elDuration && Number.isFinite(elDuration)) {
        mediaDuration.value = elDuration;

        return;
    }

    if (props.duration && Number.isFinite(props.duration)) {
        mediaDuration.value = props.duration;
    }
};

const formatTime = (seconds: number): string => {
    if (!seconds || Number.isNaN(seconds)) {
        return '0:00';
    }

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const handleTimeUpdate = () => {
    if (playerRef.value) {
        currentTime.value = playerRef.value.currentTime;
    }
};

const handleLoadedMetadata = () => {
    readDuration();
};

const handleDurationChange = () => {
    readDuration();
};

const togglePlay = () => {
    const media = playerRef.value;

    if (!media) {
        return;
    }

    if (!media.paused && !media.ended) {
        media.pause();

        return;
    }

    media.play().catch((e) => console.error('Playback failed', e));
};

const handleSeek = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const time = parseFloat(target.value);

    if (playerRef.value) {
        playerRef.value.currentTime = time;
        currentTime.value = time;
    }
};

const handlePhraseClick = (startTime: number) => {
    const media = playerRef.value;

    if (media) {
        media.currentTime = startTime;
        media.play().catch((e) => console.error('Playback failed', e));
        isPlaying.value = true;
    }
};

const setActivePhrase = (el: unknown) => {
    activePhraseRef.value = el as HTMLElement | null;
};

const isActive = (phrase: TranscriptPhrase) =>
    currentTime.value >= phrase.start && currentTime.value <= phrase.end;

watch([currentTime, () => props.transcript], () => {    const idx = props.transcript.findIndex((p) => currentTime.value >= p.start && currentTime.value <= p.end);

    if (idx !== -1 && idx !== activeIndex) {
        activeIndex = idx;

        const container = transcriptContainerRef.value;
        const element = activePhraseRef.value;

        if (element && container) {
            const scrollPos = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2;
            container.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
    }
});

// Rebuild the media element when the URL changes so webm duration/pause re-init.
watch(() => props.mediaUrl, () => {
    playerKey.value += 1;
    currentTime.value = 0;
    isPlaying.value = false;
    mediaDuration.value = props.duration;
});

const progressPct = computed(() => (mediaDuration.value > 0 ? (currentTime.value / mediaDuration.value) * 100 : 0));
</script>

<template>
    <div class="flex flex-col gap-4 w-full">
        <div class="rounded-2xl overflow-hidden" :style="{ border: '1px solid var(--border-subtle)' }">
            <div v-if="mediaType === 'video'" class="relative bg-black" style="aspect-ratio: 16/9">
                <video
                    v-if="mediaUrl"
                    :key="playerKey"
                    ref="playerRef"
                    :src="mediaUrl"
                    controls
                    preload="metadata"
                    class="w-full h-full object-contain"
                    @timeupdate="handleTimeUpdate"
                    @loadedmetadata="handleLoadedMetadata"
                    @durationchange="handleDurationChange"
                    @play="isPlaying = true"
                    @pause="isPlaying = false"
                    @ended="isPlaying = false"
                />
            </div>

            <div v-else class="p-4 flex items-center gap-3" :style="{ backgroundColor: 'var(--bg-card)' }">
                <audio
                    v-if="mediaUrl"
                    :key="playerKey"
                    ref="playerRef"
                    :src="mediaUrl"
                    preload="metadata"
                    class="hidden"
                    @timeupdate="handleTimeUpdate"
                    @loadedmetadata="handleLoadedMetadata"
                    @durationchange="handleDurationChange"
                    @play="isPlaying = true"
                    @pause="isPlaying = false"
                    @ended="isPlaying = false"
                />
                <button
                    type="button"
                    class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white transition-all hover:scale-105 active:scale-95"
                    :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)' }"
                    @click="togglePlay"
                >
                    <Pause v-if="isPlaying" class="w-4 h-4 fill-current" />
                    <Play v-else class="w-4 h-4 fill-current ml-0.5" />
                </button>

                <Volume2 class="w-4 h-4 text-zinc-400 shrink-0" :stroke-width="1.5" />
                <span class="text-xs font-mono text-zinc-400 w-10 tabular-nums shrink-0">{{ formatTime(currentTime) }}</span>

                <div
                    class="flex-1 relative h-1.5 rounded-full overflow-hidden cursor-pointer"
                    :style="{ backgroundColor: 'var(--bg-elevated)' }"
                >
                    <div
                        class="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                        :style="{
                            width: `${progressPct}%`,
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--ai-primary))',
                        }"
                    />
                    <input
                        type="range"
                        min="0"
                        :max="mediaDuration || 100"
                        :value="currentTime"
                        class="absolute inset-0 w-full opacity-0 cursor-pointer"
                        @change="handleSeek"
                    />
                </div>

                <span class="text-xs font-mono text-zinc-400 w-10 tabular-nums shrink-0">{{ formatTime(mediaDuration) }}</span>
            </div>
        </div>

        <div
            class="rounded-2xl overflow-hidden flex flex-col"
            :style="{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                maxHeight: '380px',
            }"
        >
            <div class="flex items-center justify-between px-4 py-3 border-b shrink-0" :style="{ borderColor: 'var(--border-subtle)' }">
                <h3 class="text-sm font-semibold text-zinc-100">Транскрипт</h3>
                <span class="text-xs text-zinc-400">{{ transcript.length }} фраз</span>
            </div>

            <div ref="transcriptContainerRef" class="flex-1 overflow-y-auto p-5 transcript-scroll">
                <p v-if="transcript.length === 0" class="text-sm italic text-center py-8" style="color: var(--fg); opacity: 0.6">
                    Транскрипт недоступен
                </p>
                <p v-else class="transcript-body leading-loose text-base font-serif">
                    <span
                        v-for="(phrase, index) in transcript"
                        :key="phrase.id ?? index"
                        :ref="isActive(phrase) ? setActivePhrase : undefined"
                        class="cursor-pointer transition-all duration-200 px-1 py-0.5 rounded"
                        :style="isActive(phrase) ? {
                            color: 'var(--accent)',
                            fontWeight: 600,
                            backgroundColor: 'var(--accent-subtle)',
                            boxShadow: '0 0 8px var(--accent-glow)',
                        } : undefined"
                        @click="handlePhraseClick(phrase.start)"
                    >{{ phrase.text }} </span>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transcript-body {
    color: var(--fg);
}

.transcript-body > span:not([style]) {
    color: var(--fg);
}
</style>
