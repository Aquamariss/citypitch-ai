<script setup lang="ts">
import { Timer } from 'lucide-vue-next';
import { formatTime } from './formatTime';

withDefaults(defineProps<{
    isRecording?: boolean;
    recordingTime?: number;
    targetTimeMins?: number;
    onTargetTimeChange?: (mins: number) => void;
    variant?: 'card' | 'video';
}>(), {
    isRecording: false,
    recordingTime: 0,
    targetTimeMins: 3,
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
        <span class="text-white/40 text-sm">/ {{ formatTime(targetTimeMins * 60) }}</span>
    </div>

    <!-- Recording — card -->
    <div
        v-else-if="isRecording"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full"
        :style="{ backgroundColor: 'var(--danger-subtle)', border: '1px solid rgba(239,68,68,0.2)' }"
    >
        <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span class="text-sm font-mono font-bold text-red-400">{{ formatTime(recordingTime) }}</span>
        <span class="text-xs text-zinc-600">/ {{ formatTime(targetTimeMins * 60) }}</span>
    </div>

    <!-- Idle — video -->
    <div
        v-else-if="variant === 'video'"
        class="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md"
        :style="{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }"
    >
        <Timer class="w-3.5 h-3.5 text-zinc-400" :stroke-width="1.5" />
        <select
            :value="targetTimeMins"
            class="bg-transparent text-sm font-medium text-white outline-none cursor-pointer appearance-none"
            @change="onTargetTimeChange?.(Number(($event.target as HTMLSelectElement).value))"
        >
            <option v-for="value in [1, 3, 5, 10]" :key="value" :value="value" class="bg-zinc-900 text-white">
                {{ value }} мин
            </option>
        </select>
    </div>

    <!-- Idle — card -->
    <div v-else class="flex items-center gap-2">
        <Timer class="w-3.5 h-3.5 text-zinc-500" :stroke-width="1.5" />
        <select
            :value="targetTimeMins"
            class="text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer"
            :style="{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }"
            @change="onTargetTimeChange?.(Number(($event.target as HTMLSelectElement).value))"
        >
            <option v-for="value in [1, 3, 5, 10]" :key="value" :value="value">{{ value }} мин</option>
        </select>
    </div>
</template>
