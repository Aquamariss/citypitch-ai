<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    devices?: { audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] } | null;
    selectedAudioId?: string | null;
    selectedVideoId?: string | null;
    onAudioDeviceChange?: (id: string) => void;
    onVideoDeviceChange?: (id: string) => void;
    showVideo?: boolean;
    variant?: 'card' | 'video';
}>(), {
    devices: null,
    selectedAudioId: null,
    selectedVideoId: null,
    showVideo: true,
    variant: 'card',
});

const selectClassName = computed(() => (props.variant === 'video'
    ? 'bg-transparent text-xs font-medium text-white outline-none cursor-pointer appearance-none max-w-[140px] truncate'
    : 'text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[160px] truncate'));

const wrapperStyle = computed(() => (props.variant === 'video'
    ? { backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
    : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }));
</script>

<template>
    <div v-if="devices?.audio?.length" class="flex items-center gap-2 px-2 py-1 rounded-lg" :style="wrapperStyle">
        <select
            :value="selectedAudioId ?? ''"
            :class="selectClassName"
            title="Микрофон"
            @change="onAudioDeviceChange?.(($event.target as HTMLSelectElement).value)"
        >
            <option
                v-for="device in devices.audio"
                :key="device.deviceId"
                :value="device.deviceId"
                :class="variant === 'video' ? 'bg-zinc-900 text-white' : undefined"
            >
                {{ device.label || 'Микрофон' }}
            </option>
        </select>

        <select
            v-if="showVideo && devices.video?.length"
            :value="selectedVideoId ?? ''"
            :class="selectClassName"
            title="Камера"
            @change="onVideoDeviceChange?.(($event.target as HTMLSelectElement).value)"
        >
            <option
                v-for="device in devices.video"
                :key="device.deviceId"
                :value="device.deviceId"
                :class="variant === 'video' ? 'bg-zinc-900 text-white' : undefined"
            >
                {{ device.label || 'Камера' }}
            </option>
        </select>
    </div>
</template>
