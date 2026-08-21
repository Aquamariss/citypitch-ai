<script setup lang="ts">
import { computed } from 'vue';
import { AudioLines, CheckCircle } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });
import AudioPreviewPlayer from './AudioPreviewPlayer.vue';
import DeviceSelector from './DeviceSelector.vue';
import ErrorBanner from './ErrorBanner.vue';
import LiveAudioVisualizerPanel from './LiveAudioVisualizer.vue';
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
    nativeMediaRecorder?: MediaRecorder | null;
    formErrors?: Record<string, string>;
    recorderError?: string | null;
    devices?: { audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] } | null;
    selectedAudioId?: string | null;
    onAudioDeviceChange?: (id: string) => void;
    onStart?: () => void;
    onStop?: () => void;
    onReset?: () => void;
    onSubmit?: () => void;
}>(), {
    initState: 'idle',
    initError: null,
    isRecording: false,
    isRecorded: false,
    recordingTime: 0,
    targetTimeMins: 3,
    recordedUrl: null,
    nativeMediaRecorder: null,
    formErrors: () => ({}),
    recorderError: null,
    devices: null,
    selectedAudioId: null,
});

const visibleErrors = computed(() => [
    ...Object.values(props.formErrors ?? {}),
    ...(props.recorderError && !props.isRecorded ? [props.recorderError] : []),
]);
</script>

<template>
    <div
        class="flex-1 rounded-2xl flex flex-col h-full min-h-[400px] overflow-hidden"
        :style="{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }"
    >
        <ErrorBanner :errors="visibleErrors" />

        <div class="flex items-center justify-between px-5 py-4 border-b" :style="{ borderColor: 'var(--border-subtle)' }">
            <div class="flex items-center gap-2">
                <DeviceSelector
                    v-if="!isRecording && !isRecorded && initState === 'ready'"
                    :devices="devices"
                    :selected-audio-id="selectedAudioId"
                    :on-audio-device-change="onAudioDeviceChange"
                    :show-video="false"
                />
            </div>
            <RecordingTimer
                v-if="!isRecorded && initState !== 'error' && initState !== 'loading'"
                :is-recording="isRecording"
                :recording-time="recordingTime"
                :target-time-mins="targetTimeMins"
                :on-target-time-change="onTargetTimeChange"
            />
        </div>

        <div class="flex-1 flex flex-col items-center justify-center p-8">
            <div v-if="initState === 'loading'" class="flex flex-col items-center gap-4">
                <div
                    class="w-10 h-10 border-2 rounded-full animate-spin"
                    :style="{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-primary)' }"
                />
                <p class="text-sm text-zinc-500">Подключаем устройства...</p>
            </div>

            <div v-if="initState === 'error'" class="flex flex-col items-center gap-4 text-center">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center" :style="{ backgroundColor: 'var(--danger-subtle)' }">
                    <VideoOff class="w-7 h-7 text-red-400" :stroke-width="1.5" />
                </div>
                <div>
                    <p class="font-semibold text-zinc-200 mb-1">Нет доступа к микрофону</p>
                    <p class="text-sm text-zinc-500 max-w-xs">
                        {{ initError ?? 'Разрешите доступ в настройках браузера и перезагрузите страницу.' }}
                    </p>
                </div>
            </div>

            <div v-if="!isRecorded && initState === 'ready'" class="flex flex-col items-center gap-6">
                <div class="relative">
                    <div
                        class="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
                        :style="{
                            backgroundColor: isRecording ? 'rgba(239,68,68,0.12)' : 'var(--accent-subtle)',
                            border: `2px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
                        }"
                    >
                        <AudioLines
                            class="w-8 h-8"
                            :style="{ color: isRecording ? 'var(--record-active)' : 'var(--accent-primary)' }"
                            :stroke-width="1.5"
                        />
                    </div>
                    <div
                        v-if="isRecording"
                        class="absolute inset-0 rounded-full animate-record-pulse"
                        :style="{ borderColor: 'transparent' }"
                    />
                </div>
                <LiveAudioVisualizerPanel :media-recorder="nativeMediaRecorder" :is-recording="isRecording" />
                <p class="text-sm text-zinc-500">
                    {{ isRecording ? 'Идёт запись голоса...' : 'Готов к записи аудио' }}
                </p>
            </div>

            <div v-if="isRecorded" class="flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-full flex items-center justify-center" :style="{ backgroundColor: 'var(--success-subtle)' }">
                    <CheckCircle class="w-7 h-7 text-emerald-400" :stroke-width="1.5" />
                </div>
                <p class="font-semibold text-zinc-200">Запись завершена</p>
                <AudioPreviewPlayer :src="recordedUrl" />
            </div>
        </div>

        <RecordingControls
            v-if="!isRecorded && initState === 'ready'"
            variant="audio"
            :is-recording="isRecording"
            :is-recorded="isRecorded"
            :on-start="onStart"
            :on-stop="onStop"
        />

        <RecordingControls
            v-if="isRecorded"
            variant="audio"
            :is-recorded="isRecorded"
            :on-reset="onReset"
            :on-submit="onSubmit"
        />
    </div>
</template>
