<script setup lang="ts">
import { computed, watch } from 'vue';
import { useForm } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { useMediaDevices } from '@/composables/useMediaDevices';
import { usePitchRecorder } from '@/composables/usePitchRecorder';
import { useMethodology } from '@/lib/pitchMethodology';
import AudioRecorderView from './AudioRecorderView.vue';
import ProcessingOverlay from './ProcessingOverlay.vue';

const props = withDefaults(defineProps<{
    onRecordingStateChange?: (recording: boolean) => void;
    layout?: 'fullscreen' | 'studio';
    onStudioStateChange?: (state: any) => void;
}>(), {
    layout: 'fullscreen',
});

const methodology = useMethodology();

// Технический предел записи: после него запись останавливается сама.
const maxDurationSeconds = computed(() => methodology.value.hard_limit_seconds);

const mediaDevices = useMediaDevices({
    mode: () => 'audio' as const,
    enabled: () => true,
});

const devicesReady = computed(() => mediaDevices.initState === 'ready');

const recorder = usePitchRecorder({
    mode: () => 'audio' as const,
    audioDeviceId: () => mediaDevices.selectedAudioId,
    videoDeviceId: () => mediaDevices.selectedVideoId,
    maxDurationSeconds: maxDurationSeconds.value,
    enabled: () => mediaDevices.initState === 'ready',
});

const form = useForm<{ audio: File | null; duration: number }>({
    audio: null,
    duration: 0,
});

watch(() => recorder.isRecording.value, (recording) => props.onRecordingStateChange?.(recording));

const initState = computed<string>(() => {
    if (mediaDevices.initState === 'idle') {
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

// Запись останавливается и вручную, и автоматически на техническом пределе,
// поэтому форму заполняем по факту появления файла, а не в обработчике кнопки.
watch(() => recorder.recordedFile.value, (file) => {
    form.audio = file;
    form.duration = file ? Math.max(1, Math.round(recorder.recordingTime.value)) : 0;
});

const handleStop = async () => {
    await recorder.stopRecording();
};

const handleReset = async () => {
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
    maxDurationSeconds: maxDurationSeconds.value,
    recommendedSeconds: methodology.value.recommended_seconds,
    recordedUrl: recorder.recordedUrl.value,
    recordedFile: recorder.recordedFile.value,
    nativeMediaRecorder: recorder.nativeMediaRecorder.value,
    previewStream: recorder.previewStream.value,
    formErrors: form.errors,
    recorderError: recorder.error.value,
    devices: mediaDevices.devices,
    selectedAudioId: mediaDevices.selectedAudioId,
    onAudioDeviceChange: mediaDevices.setSelectedAudioId,
    onStart: recorder.startRecording,
    onPause: recorder.pauseRecording,
    onResume: recorder.resumeRecording,
    onStop: handleStop,
    onReset: handleReset,
    onSubmit: submitPitch,
    layout: props.layout,
    processing: form.processing,
    progress: form.progress,
    rediscover: mediaDevices.rediscover,
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
        <AudioRecorderView v-else v-bind="sharedProps" />
    </template>
</template>
