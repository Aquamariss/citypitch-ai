<script setup lang="ts">
import { computed, watch, type Ref } from 'vue';
import { VideoOff } from 'lucide-vue-next';
import LiveAudioVisualizerPanel from '@/Components/PitchRecorder/LiveAudioVisualizer.vue';

const PLACEMENT_CLASSES: Record<string, string> = {
    setup: 'relative w-full h-full min-h-[180px] sm:min-h-[220px] lg:min-h-0 rounded-2xl overflow-hidden',
    fullscreen: 'relative w-full h-full min-h-0 overflow-hidden',
};

const props = withDefaults(defineProps<{
    placement?: string;
    initState?: string;
    initError?: string | null;
    isRecording?: boolean;
    previewVideoRef?: Ref<HTMLVideoElement | null> | null;
    reattachPreview?: () => void;
    isVideoMode?: boolean;
    nativeMediaRecorder?: MediaRecorder | null;
    mirrored?: boolean;
}>(), {
    placement: 'setup',
    initState: 'idle',
    initError: null,
    isRecording: false,
    previewVideoRef: null,
    isVideoMode: true,
    nativeMediaRecorder: null,
    mirrored: true,
});

const shellClass = computed(() => PLACEMENT_CLASSES[props.placement] ?? PLACEMENT_CLASSES.setup);

watch([() => props.isVideoMode, () => props.placement], () => {
    if (props.isVideoMode) {
        props.reattachPreview?.();
    }
});

const setVideoRef = (el: unknown) => {
    if (props.previewVideoRef) {
        props.previewVideoRef.value = el as HTMLVideoElement | null;
    }
};
</script>

<template>
    <div
        :class="shellClass"
        :style="{
            border: placement === 'fullscreen' ? 'none' : '1px solid var(--border-default)',
            backgroundColor: '#0a0a0a',
        }"
    >
        <video
            v-if="isVideoMode"
            :ref="setVideoRef"
            autoplay
            muted
            playsinline
            class="w-full h-full object-cover"
            :class="mirrored ? 'scale-x-[-1]' : ''"
        />
        <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
            <LiveAudioVisualizerPanel :media-recorder="nativeMediaRecorder" :is-recording="isRecording" />
            <span v-if="placement === 'setup'" class="text-xs text-zinc-500">
                {{ isRecording ? 'Идёт запись…' : 'Аудио-режим' }}
            </span>
        </div>

        <div v-if="initState === 'loading'" class="absolute inset-0 flex items-center justify-center bg-black/90">
            <div
                class="w-7 h-7 border-2 rounded-full animate-spin"
                :style="{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)' }"
            />
        </div>

        <div v-if="initState === 'error'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-3 text-center">
            <VideoOff class="w-6 h-6 text-red-400 mb-2" :stroke-width="1.5" />
            <p class="text-xs text-zinc-400 leading-snug max-w-[12rem]">
                {{ initError ?? 'Нет доступа к камере' }}
            </p>
        </div>
    </div>
</template>
