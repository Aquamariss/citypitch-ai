<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatTime } from './formatTime';

defineProps<{ src?: string | null }>();

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

const toggle = () => {
    const audio = audioRef.value;

    if (!audio) {
        return;
    }

    if (isPlaying.value) {
        audio.pause();
    } else {
        audio.play();
    }
};

const progressPct = computed(() => (duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0));
</script>

<template>
    <div
        class="w-full max-w-sm rounded-xl p-4 flex flex-col gap-3"
        :style="{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }"
    >
        <audio
            ref="audioRef"
            :src="src ?? undefined"
            class="hidden"
            @timeupdate="currentTime = ($event.target as HTMLAudioElement).currentTime"
            @loadedmetadata="duration = ($event.target as HTMLAudioElement).duration"
            @play="isPlaying = true"
            @pause="isPlaying = false"
            @ended="isPlaying = false"
        />

        <div class="flex items-center gap-3">
            <button
                type="button"
                class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)' }"
                @click="toggle"
            >
                <svg v-if="isPlaying" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <svg v-else class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </button>
            <span class="text-xs font-mono text-zinc-400 w-10 tabular-nums">{{ formatTime(currentTime) }}</span>
            <div class="flex-1 relative h-1 rounded-full overflow-hidden" :style="{ backgroundColor: 'var(--border-default)' }">
                <div
                    class="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                    :style="{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--ai-primary))' }"
                />
                <input
                    type="range"
                    min="0"
                    :max="duration || 100"
                    :value="currentTime"
                    class="absolute inset-0 w-full opacity-0 cursor-pointer"
                    @change="(event) => {
                        const time = parseFloat((event.target as HTMLInputElement).value);
                        if (audioRef) audioRef.currentTime = time;
                        currentTime = time;
                    }"
                />
            </div>
            <span class="text-xs font-mono text-zinc-500 w-10 tabular-nums">{{ formatTime(duration) }}</span>
        </div>
    </div>
</template>
