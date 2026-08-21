<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { useMediaDevices } from '@/composables/useMediaDevices';
import { usePitchRecorder } from '@/composables/usePitchRecorder';
import type { MediaMode } from '@/lib/media/mediaConstraints';
import AudioRecorderView from './AudioRecorderView.vue';
import ProcessingOverlay from './ProcessingOverlay.vue';
import VideoRecorderView from './VideoRecorderView.vue';

const MAX_DURATION_SECONDS = 600;

const props = withDefaults(defineProps<{
    defaultDuration?: number;
    mode?: string | null;
    onRecordingStateChange?: (recording: boolean) => void;
    layout?: 'fullscreen' | 'studio';
    onStudioStateChange?: (state: any) => void;
    onRequestAudioFallback?: () => void;
}>(), {
    defaultDuration: 180,
    mode: null,
    layout: 'fullscreen',
});

const targetTimeMins = ref(Math.round(props.defaultDuration / 60) || 3);
const setTargetTimeMins = (mins: number) => {
    targetTimeMins.value = mins;
};

const resolvedMode = computed<MediaMode | null>(() =>
    props.mode === 'audio' || props.mode === 'video' ? (props.mode as MediaMode) : null,
);

const mediaDevices = useMediaDevices({
    mode: resolvedMode,
    enabled: () => Boolean(resolvedMode.value),
});

const devicesReady = computed(() => mediaDevices.initState === 'ready');

const recorder = usePitchRecorder({
    mode: () => resolvedMode.value ?? 'audio',
    audioDeviceId: () => mediaDevices.selectedAudioId,
    videoDeviceId: () => mediaDevices.selectedVideoId,
    maxDurationSeconds: MAX_DURATION_SECONDS,
    enabled: () => Boolean(resolvedMode.value) && mediaDevices.initState === 'ready',
});

const form = useForm<{ video: File | null; duration: number; media_type: string }>({
    video: null,
    duration: targetTimeMins.value * 60,
    media_type: resolvedMode.value ?? 'video',
});

watch(targetTimeMins, (mins) => {
    form.duration = mins * 60;
});
watch(resolvedMode, (mode) => {
    if (mode) {
        form.media_type = mode;
    }
});
watch(() => recorder.isRecording.value, (recording) => props.onRecordingStateChange?.(recording));

const initState = computed<string>(() => {
    if (!resolvedMode.value || mediaDevices.initState === 'idle') {
        return 'idle';
    }

    if (mediaDevices.initState === 'loading' || (devicesReady.value && recorder.initState.value === 'loading')) {
        return 'loading';
    }

    if (mediaDevices.initState === 'error' || recorder.initState.value === 'error') {
        return 'error';
    }

    return 'ready';
});

const initError = computed(() =>
    mediaDevices.error ?? (recorder.initState.value === 'error' ? recorder.error.value : null));

const handleStop = async () => {
    const result = await recorder.stopRecording();

    if (result?.file) {
        form.video = result.file;
        form.media_type = result.mediaType;
    }
};

const handleReset = async () => {
    form.video = null;
    await recorder.resetRecording();
};

const submitPitch = () => {
    if (!recorder.recordedFile.value) {
        return;
    }

    form.post(route('pitch.upload'));
};

const sharedProps = computed(() => ({
    initState: initState.value,
    initError: initError.value,
    isRecording: recorder.isRecording.value,
    isPaused: recorder.isPaused.value,
    isRecorded: recorder.isRecorded.value,
    recordingTime: recorder.recordingTime.value,
    maxDurationSeconds: MAX_DURATION_SECONDS,
    targetTimeMins: targetTimeMins.value,
    onTargetTimeChange: setTargetTimeMins,
    recordedUrl: recorder.recordedUrl.value,
    recordedFile: recorder.recordedFile.value,
    nativeMediaRecorder: recorder.nativeMediaRecorder.value,
    previewStream: recorder.previewStream.value,
    formErrors: form.errors,
    recorderError: recorder.error.value,
    devices: mediaDevices.devices,
    selectedAudioId: mediaDevices.selectedAudioId,
    selectedVideoId: mediaDevices.selectedVideoId,
    onAudioDeviceChange: mediaDevices.setSelectedAudioId,
    onVideoDeviceChange: mediaDevices.setSelectedVideoId,
    onStart: recorder.startRecording,
    onPause: recorder.pauseRecording,
    onResume: recorder.resumeRecording,
    onStop: handleStop,
    onReset: handleReset,
    onSubmit: submitPitch,
    layout: props.layout,
    mode: resolvedMode.value,
    processing: form.processing,
    progress: form.progress,
    previewVideoRef: recorder.previewVideoRef,
    reattachPreview: recorder.reattachPreview,
    rediscover: mediaDevices.rediscover,
    onRequestAudioFallback: props.onRequestAudioFallback,
}));

watch(sharedProps, (state) => {
    if (props.layout === 'studio') {
        props.onStudioStateChange?.(state);
    }
});
</script>

<template>
    <template v-if="layout !== 'studio'">
        <ProcessingOverlay v-if="form.processing" :progress="form.progress" />
        <AudioRecorderView v-else-if="resolvedMode === 'audio'" v-bind="sharedProps" />
        <VideoRecorderView v-else-if="resolvedMode === 'video'" v-bind="sharedProps" />
    </template>
</template>
