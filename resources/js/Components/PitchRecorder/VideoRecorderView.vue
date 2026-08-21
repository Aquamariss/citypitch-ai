<script setup lang="ts">
import { computed, type Ref } from 'vue';
import { VideoOff } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });
import DeviceSelector from './DeviceSelector.vue';
import ErrorBanner from './ErrorBanner.vue';
import RecordingControls from './RecordingControls.vue';
import RecordingTimer from './RecordingTimer.vue';

const props = withDefaults(defineProps<{
    initState?: string;
    initError?: string | null;
    isRecording?: boolean;
    isRecorded?: boolean;
    recordingTime?: number;
    targetTimeMins?: number;
    onTargetTimeChange?: (mins: number) => void;
    recordedUrl?: string | null;
    formErrors?: Record<string, string>;
    recorderError?: string | null;
    devices?: { audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] } | null;
    selectedAudioId?: string | null;
    selectedVideoId?: string | null;
    onAudioDeviceChange?: (id: string) => void;
    onVideoDeviceChange?: (id: string) => void;
    onStart?: () => void;
    onStop?: () => void;
    onReset?: () => void;
    onSubmit?: () => void;
    previewVideoRef?: Ref<HTMLVideoElement | null> | null;
}>(), {
    initState: 'idle',
    initError: null,
    isRecording: false,
    isRecorded: false,
    recordingTime: 0,
    targetTimeMins: 3,
    recordedUrl: null,
    formErrors: () => ({}),
    recorderError: null,
    devices: null,
    selectedAudioId: null,
    selectedVideoId: null,
    previewVideoRef: null,
});

const visibleErrors = computed(() => [
    ...Object.values(props.formErrors ?? {}),
    ...(props.recorderError && !props.isRecorded ? [props.recorderError] : []),
]);

const setVideoRef = (el: unknown) => {
    if (props.previewVideoRef) {
        props.previewVideoRef.value = el as HTMLVideoElement | null;
    }
};
</script>

<template>
    <div
        class="flex-1 rounded-2xl overflow-hidden relative flex flex-col h-full min-h-[500px]"
        :style="{ backgroundColor: '#000', border: '1px solid var(--border-subtle)' }"
    >
        <video
            v-if="!isRecorded"
            :ref="setVideoRef"
            autoplay
            muted
            playsinline
            class="w-full h-full object-cover absolute inset-0 transition-transform duration-1000"
            :class="isRecording ? 'scale-105' : 'scale-100'"
        />
        <video
            v-else
            :src="recordedUrl ?? undefined"
            controls
            playsinline
            class="w-full h-full object-cover absolute inset-0"
            :style="{ backgroundColor: '#000' }"
        />

        <div v-if="initState === 'loading'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
            <div
                class="w-10 h-10 border-2 rounded-full animate-spin mb-4"
                :style="{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)' }"
            />
            <p class="text-sm text-zinc-400">Подключаем камеру...</p>
        </div>

        <div v-if="initState === 'error'" class="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-center p-8">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" :style="{ backgroundColor: 'var(--danger-subtle)' }">
                <VideoOff class="w-7 h-7 text-red-400" :stroke-width="1.5" />
            </div>
            <p class="font-semibold text-white mb-2">Нет доступа к камере и микрофону</p>
            <p class="text-sm text-zinc-500 max-w-xs">
                {{ initError ?? 'Разрешите доступ в настройках браузера и перезагрузите страницу.' }}
            </p>
        </div>

        <div v-if="!isRecorded && initState === 'ready'" class="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-10 gap-3">
            <div class="flex items-center gap-3 min-w-0">
                <RecordingTimer
                    variant="video"
                    :is-recording="isRecording"
                    :recording-time="recordingTime"
                    :target-time-mins="targetTimeMins"
                    :on-target-time-change="onTargetTimeChange"
                />
                <DeviceSelector
                    v-if="!isRecording"
                    variant="video"
                    :devices="devices"
                    :selected-audio-id="selectedAudioId"
                    :selected-video-id="selectedVideoId"
                    :on-audio-device-change="onAudioDeviceChange"
                    :on-video-device-change="onVideoDeviceChange"
                />
            </div>
            <div
                class="px-3 py-1.5 rounded-lg backdrop-blur-md text-xs text-white/50 shrink-0"
                :style="{ backgroundColor: 'rgba(0,0,0,0.4)' }"
            >
                Макс. 10 мин
            </div>
        </div>

        <RecordingControls
            v-if="!isRecorded && initState === 'ready'"
            variant="video"
            :is-recording="isRecording"
            :is-recorded="isRecorded"
            :on-start="onStart"
            :on-stop="onStop"
        />

        <RecordingControls
            v-if="isRecorded"
            variant="video"
            :is-recorded="isRecorded"
            :on-reset="onReset"
            :on-submit="onSubmit"
        />

        <ErrorBanner :errors="visibleErrors" variant="video" />
    </div>
</template>
