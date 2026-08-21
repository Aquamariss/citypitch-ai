<script setup lang="ts">
import { AudioLines, RotateCcw, Send, Square, Video } from 'lucide-vue-next';

withDefaults(defineProps<{
    variant?: 'audio' | 'video';
    placement?: 'overlay' | 'studio';
    isRecording?: boolean;
    isRecorded?: boolean;
    onStart?: () => void;
    onStop?: () => void;
    onReset?: () => void;
    onSubmit?: () => void;
}>(), {
    variant: 'audio',
    placement: 'overlay',
    isRecording: false,
    isRecorded: false,
});
</script>

<template>
    <!-- Recorded — studio -->
    <div
        v-if="isRecorded && placement === 'studio'"
        class="flex gap-3 p-4 shrink-0"
        :style="{ borderColor: 'var(--border-subtle)' }"
    >
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            :style="{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }"
            @click="onReset"
        >
            <RotateCcw class="w-4 h-4" :stroke-width="1.5" />
            Перезаписать
        </button>
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }"
            @click="onSubmit"
        >
            <Send class="w-4 h-4" :stroke-width="1.5" />
            Отправить ИИ
        </button>
    </div>

    <!-- Recorded — video -->
    <div
        v-else-if="isRecorded && variant === 'video'"
        class="absolute bottom-0 left-0 right-0 p-5 z-20 flex gap-3"
        :style="{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }"
    >
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
            :style="{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }"
            @click="onReset"
        >
            <RotateCcw class="w-4 h-4" :stroke-width="1.5" />
            Перезаписать
        </button>
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }"
            @click="onSubmit"
        >
            <Send class="w-4 h-4" :stroke-width="1.5" />
            Отправить ИИ
        </button>
    </div>

    <!-- Recorded — card -->
    <div v-else-if="isRecorded" class="flex gap-3 p-4 border-t" :style="{ borderColor: 'var(--border-subtle)' }">
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            :style="{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }"
            @click="onReset"
        >
            <RotateCcw class="w-4 h-4" :stroke-width="1.5" />
            Перезаписать
        </button>
        <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }"
            @click="onSubmit"
        >
            <Send class="w-4 h-4" :stroke-width="1.5" />
            Отправить ИИ
        </button>
    </div>

    <!-- Recording — studio -->
    <div v-else-if="placement === 'studio'" class="flex justify-center py-4 shrink-0">
        <button
            v-if="!isRecording"
            type="button"
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 32px var(--accent-glow)' }"
            title="Начать запись"
            aria-label="Начать запись"
            @click="onStart"
        >
            <Video v-if="variant === 'video'" class="w-7 h-7" :stroke-width="1.5" />
            <AudioLines v-else class="w-6 h-6" :stroke-width="1.5" />
        </button>
        <button
            v-else
            type="button"
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
            :style="{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 32px var(--record-pulse)' }"
            title="Остановить запись"
            aria-label="Остановить запись"
            @click="onStop"
        >
            <Square class="w-7 h-7" fill="currentColor" :stroke-width="0" />
        </button>
    </div>

    <!-- Recording — video -->
    <div
        v-else-if="variant === 'video'"
        class="absolute bottom-0 left-0 right-0 flex justify-center items-end p-8 z-10"
        :style="{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }"
    >
        <button
            v-if="!isRecording"
            type="button"
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 32px var(--accent-glow)' }"
            title="Начать запись"
            @click="onStart"
        >
            <Video class="w-7 h-7" :stroke-width="1.5" />
        </button>
        <button
            v-else
            type="button"
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
            :style="{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 32px var(--record-pulse)' }"
            title="Остановить запись"
            @click="onStop"
        >
            <Square class="w-7 h-7" fill="currentColor" :stroke-width="0" />
        </button>
    </div>

    <!-- Recording — card -->
    <div v-else class="flex justify-center p-6 border-t" :style="{ borderColor: 'var(--border-subtle)' }">
        <button
            v-if="!isRecording"
            type="button"
            class="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
            :style="{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 28px var(--accent-glow)' }"
            title="Начать запись"
            @click="onStart"
        >
            <AudioLines class="w-6 h-6" :stroke-width="1.5" />
        </button>
        <button
            v-else
            type="button"
            class="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
            :style="{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 28px var(--record-pulse)' }"
            title="Остановить запись"
            @click="onStop"
        >
            <Square class="w-6 h-6" fill="currentColor" :stroke-width="0" />
        </button>
    </div>
</template>
