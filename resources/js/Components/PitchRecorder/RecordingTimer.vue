<script setup lang="ts">
import { Timer } from 'lucide-vue-next';
import { formatTime } from './formatTime';

withDefaults(defineProps<{
    isRecording?: boolean;
    recordingTime?: number;
    recommendedSeconds?: number;
    variant?: 'card' | 'video';
}>(), {
    isRecording: false,
    recordingTime: 0,
    recommendedSeconds: 600,
    variant: 'card',
});
</script>

<template>
    <!-- Recording — video -->
    <div
        v-if="isRecording && variant === 'video'"
        class="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md"
        :style="{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.3)' }"
    >
        <div class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" :style="{ boxShadow: '0 0 8px rgba(239,68,68,0.8)' }" />
        <span class="font-mono text-lg font-bold text-white tracking-wider">{{ formatTime(recordingTime) }}</span>
        <span class="text-white/40 text-sm">/ {{ formatTime(recommendedSeconds) }}</span>
    </div>

    <!-- Recording — card -->
    <div
        v-else-if="isRecording"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full"
        :style="{ backgroundColor: 'var(--danger-subtle)', border: '1px solid rgba(239,68,68,0.2)' }"
    >
        <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span class="text-sm font-mono font-bold text-red-400">{{ formatTime(recordingTime) }}</span>
        <span class="text-xs text-zinc-600">/ {{ formatTime(recommendedSeconds) }}</span>
    </div>

    <!-- Idle: рекомендуемое время фиксировано методикой -->
    <div v-else class="flex items-center gap-2">
        <Timer class="w-3.5 h-3.5 text-zinc-500" :stroke-width="1.5" />
        <span class="text-xs font-medium" :style="{ color: 'var(--text-secondary)' }">
            {{ formatTime(recommendedSeconds) }}
        </span>
    </div>
</template>
