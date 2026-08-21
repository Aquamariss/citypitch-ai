import { computed, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import RecordRTC from 'recordrtc';
import { acquireUserMedia, stopStream, type MediaMode } from '@/lib/media/mediaConstraints';
import { getFileExtension, resolveMimeType, type MediaType } from '@/lib/media/mimeTypes';
import { mapRecordingError, MIN_BLOB_SIZE } from '@/lib/media/recordingErrors';

const TIME_SLICE_MS = 1000;

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecordedResult {
    file: File;
    url: string;
    mediaType: MediaType;
}

const getNativeMediaRecorder = (recorder: any): MediaRecorder | null =>
    recorder?.getInternalRecorder?.() ?? null;

export function usePitchRecorder(options: {
    mode: MaybeRefOrGetter<MediaMode>;
    audioDeviceId: MaybeRefOrGetter<string | null>;
    videoDeviceId: MaybeRefOrGetter<string | null>;
    maxDurationSeconds?: number;
    enabled?: MaybeRefOrGetter<boolean>;
}) {
    const {
        mode,
        audioDeviceId,
        videoDeviceId,
        maxDurationSeconds = 600,
        enabled = true,
    } = options;

    const initState = ref<'loading' | 'ready' | 'error'>('loading');
    const recorderState = ref<RecorderState>('idle');
    const recordingTime = ref(0);
    const recordedFile = ref<File | null>(null);
    const recordedUrl = ref<string | null>(null);
    const error = ref<string | null>(null);
    const nativeMediaRecorder = ref<MediaRecorder | null>(null);
    const previewStream = ref<MediaStream | null>(null);

    const previewStreamRef = ref<MediaStream | null>(null);
    const recorderRef = ref<any>(null);
    const recordedUrlRef = ref<string | null>(null);
    const previewVideoRef = ref<HTMLVideoElement | null>(null);

    let timer: ReturnType<typeof setInterval> | null = null;
    let recordingStartedAt: number | null = null;
    let pausedAt: number | null = null;
    let pausedTotalMs = 0;
    let mimeType: string | null = null;
    let autoStop = false;

    const isAudioMode = computed(() => toValue(mode) === 'audio');

    const clearTimer = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    };

    const revokeRecordedUrl = () => {
        if (recordedUrlRef.value) {
            URL.revokeObjectURL(recordedUrlRef.value);
            recordedUrlRef.value = null;
        }
    };

    const destroyRecorder = () => {
        if (recorderRef.value) {
            try {
                recorderRef.value.destroy();
            } catch {
                // Recorder may already be destroyed.
            }

            recorderRef.value = null;
        }
    };

    const attachPreviewToVideo = (stream: MediaStream) => {
        if (!previewVideoRef.value || isAudioMode.value) {
            return;
        }

        previewVideoRef.value.srcObject = stream;
    };

    const reattachPreview = () => {
        if (!previewStreamRef.value) {
            return;
        }

        attachPreviewToVideo(previewStreamRef.value);
    };

    const acquirePreviewStream = async (): Promise<MediaStream> => {
        stopStream(previewStreamRef.value);
        previewStreamRef.value = null;
        previewStream.value = null;

        const stream = await acquireUserMedia(toValue(mode), toValue(audioDeviceId), toValue(videoDeviceId));

        if (!stream) {
            throw new Error('stream_failed');
        }

        previewStreamRef.value = stream;
        previewStream.value = stream;
        attachPreviewToVideo(stream);

        return stream;
    };

    const initPreview = async () => {
        if (!toValue(enabled) || !toValue(audioDeviceId)) {
            return;
        }

        initState.value = 'loading';
        error.value = null;

        try {
            await acquirePreviewStream();
            initState.value = 'ready';
        } catch (err) {
            initState.value = 'error';
            error.value = mapRecordingError(err);
        }
    };

    const readElapsedSeconds = (): number => {
        if (!recordingStartedAt) {
            return 0;
        }

        const pausedNow = pausedAt ? performance.now() - pausedAt : 0;
        const elapsedMs = performance.now() - recordingStartedAt - pausedTotalMs - pausedNow;

        return Math.max(0, Math.floor(elapsedMs / 1000));
    };

    const startTimer = () => {
        clearTimer();

        timer = setInterval(() => {
            recordingTime.value = readElapsedSeconds();
        }, 250);
    };

    const startRecording = async () => {
        if (!toValue(enabled) || recorderState.value === 'recording' || recorderState.value === 'paused') {
            return;
        }

        error.value = null;
        autoStop = false;
        pausedAt = null;
        pausedTotalMs = 0;

        try {
            let stream = previewStreamRef.value;

            if (!stream || stream.getTracks().every((track) => track.readyState === 'ended')) {
                stream = await acquirePreviewStream();
            }

            const recordType: MediaType = isAudioMode.value ? 'audio' : 'video';
            const resolvedMime = resolveMimeType(recordType);
            mimeType = resolvedMime;

            destroyRecorder();

            const recorder = new RecordRTC(stream, {
                type: recordType,
                mimeType: resolvedMime,
                timeSlice: TIME_SLICE_MS,
                disableLogs: true,
                recorderType: RecordRTC.MediaStreamRecorder,
            });

            recorderRef.value = recorder;
            recorder.startRecording();

            recordingStartedAt = performance.now();
            recordingTime.value = 0;
            recorderState.value = 'recording';
            startTimer();

            nativeMediaRecorder.value = getNativeMediaRecorder(recorder);
        } catch (err) {
            recorderState.value = 'idle';
            error.value = mapRecordingError(err);
        }
    };

    const pauseRecording = () => {
        const recorder = recorderRef.value;

        if (!recorder || recorderState.value !== 'recording') {
            return;
        }

        try {
            recorder.pauseRecording();
        } catch {
            return;
        }

        pausedAt = performance.now();
        clearTimer();
        recordingTime.value = readElapsedSeconds();
        recorderState.value = 'paused';
    };

    const resumeRecording = () => {
        const recorder = recorderRef.value;

        if (!recorder || recorderState.value !== 'paused') {
            return;
        }

        try {
            recorder.resumeRecording();
        } catch {
            return;
        }

        if (pausedAt) {
            pausedTotalMs += performance.now() - pausedAt;
            pausedAt = null;
        }

        recorderState.value = 'recording';
        startTimer();
    };

    const stopRecording = async (): Promise<RecordedResult | null> => {
        const recorder = recorderRef.value;
        const canStop = recorderState.value === 'recording' || recorderState.value === 'paused';

        if (!recorder || !canStop) {
            return null;
        }

        clearTimer();
        nativeMediaRecorder.value = null;
        pausedAt = null;

        return new Promise((resolve) => {
            recorder.stopRecording(() => {
                const blob = recorder.getBlob();

                if (!blob || blob.size < MIN_BLOB_SIZE) {
                    recorderState.value = 'idle';
                    error.value = mapRecordingError('empty_blob');
                    resolve(null);

                    return;
                }

                const resolvedMime = blob.type || mimeType || 'video/webm';
                const extension = getFileExtension(resolvedMime);
                const file = new File([blob], `pitch.${extension}`, { type: resolvedMime });

                revokeRecordedUrl();

                const url = URL.createObjectURL(blob);
                recordedUrlRef.value = url;

                recordedFile.value = file;
                recordedUrl.value = url;
                recorderState.value = 'stopped';
                resolve({ file, url, mediaType: isAudioMode.value ? 'audio' : 'video' });
            });
        });
    };

    const resetRecording = async () => {
        clearTimer();

        if ((recorderState.value === 'recording' || recorderState.value === 'paused') && recorderRef.value) {
            await new Promise<void>((resolve) => {
                recorderRef.value.stopRecording(() => resolve());
            });
        }

        destroyRecorder();
        revokeRecordedUrl();

        pausedAt = null;
        pausedTotalMs = 0;
        recordingStartedAt = null;
        recordedFile.value = null;
        recordedUrl.value = null;
        recordingTime.value = 0;
        recorderState.value = 'idle';
        nativeMediaRecorder.value = null;
        error.value = null;
        autoStop = false;

        await initPreview();
    };

    watch(
        () => [toValue(enabled), toValue(audioDeviceId), toValue(videoDeviceId), toValue(mode)],
        ([enabledNow], _old, onCleanup) => {
            if (!enabledNow) {
                return;
            }

            initPreview();

            onCleanup(() => {
                clearTimer();
                destroyRecorder();
                stopStream(previewStreamRef.value);
                previewStreamRef.value = null;
                previewStream.value = null;
                revokeRecordedUrl();
            });
        },
        { immediate: true },
    );

    watch(
        () => [recorderState.value, recordingTime.value],
        () => {
            if (recorderState.value !== 'recording' || recordingTime.value < maxDurationSeconds || autoStop) {
                return;
            }

            autoStop = true;
            stopRecording();
        },
    );

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (recorderState.value !== 'recording' && recorderState.value !== 'paused') {
            return;
        }

        event.preventDefault();
        event.returnValue = '';
    };

    onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
    onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));

    return {
        initState,
        recorderState,
        isRecording: computed(() => recorderState.value === 'recording' || recorderState.value === 'paused'),
        isPaused: computed(() => recorderState.value === 'paused'),
        isRecorded: computed(() => recorderState.value === 'stopped' && recordedFile.value !== null),
        recordingTime,
        maxDurationSeconds,
        recordedFile,
        recordedUrl,
        error,
        nativeMediaRecorder,
        previewVideoRef,
        previewStream,
        reattachPreview,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        resetRecording,
        reinitialize: initPreview,
    };
}
