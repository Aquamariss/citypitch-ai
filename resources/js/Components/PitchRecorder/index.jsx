import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { usePitchRecorder } from '@/hooks/usePitchRecorder';
import AudioRecorderView from './AudioRecorderView';
import ProcessingOverlay from './ProcessingOverlay';
import VideoRecorderView from './VideoRecorderView';

const MAX_DURATION_SECONDS = 600;

export default function PitchRecorder({
    defaultDuration,
    mode: selectedMode,
    onRecordingStateChange,
    layout = 'fullscreen',
    onStudioStateChange,
    onRequestAudioFallback,
}) {
    const [targetTimeMins, setTargetTimeMins] = useState(Math.round(defaultDuration / 60) || 3);
    const mode = selectedMode === 'audio' || selectedMode === 'video' ? selectedMode : null;

    const {
        initState: devicesInitState,
        error: devicesError,
        devices,
        selectedAudioId,
        selectedVideoId,
        setSelectedAudioId,
        setSelectedVideoId,
        cameraUnavailable,
        rediscover,
    } = useMediaDevices({
        mode,
        enabled: Boolean(mode),
    });

    const devicesReady = devicesInitState === 'ready';

    const recorder = usePitchRecorder({
        mode: mode ?? 'audio',
        audioDeviceId: selectedAudioId,
        videoDeviceId: selectedVideoId,
        maxDurationSeconds: MAX_DURATION_SECONDS,
        enabled: Boolean(mode) && devicesReady,
    });

    const { setData, post, progress, processing, errors } = useForm({
        video: null,
        duration: targetTimeMins * 60,
        media_type: mode ?? 'video',
    });

    useEffect(() => {
        setData('duration', targetTimeMins * 60);
    }, [setData, targetTimeMins]);

    useEffect(() => {
        if (mode) {
            setData('media_type', mode);
        }
    }, [mode, setData]);

    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(recorder.isRecording);
        }
    }, [onRecordingStateChange, recorder.isRecording]);

    const initState = useMemo(() => {
        if (!mode || devicesInitState === 'idle') {
            return 'idle';
        }

        if (devicesInitState === 'loading' || (devicesReady && recorder.initState === 'loading')) {
            return 'loading';
        }

        if (devicesInitState === 'error' || recorder.initState === 'error') {
            return 'error';
        }

        return 'ready';
    }, [devicesInitState, devicesReady, mode, recorder.initState]);

    const initError = devicesError ?? (recorder.initState === 'error' ? recorder.error : null);

    const handleStop = useCallback(async () => {
        const result = await recorder.stopRecording();

        if (result?.file) {
            setData('video', result.file);
            setData('media_type', result.mediaType);
        }
    }, [recorder.stopRecording, setData]);

    const handleReset = useCallback(async () => {
        setData('video', null);
        await recorder.resetRecording();
    }, [recorder.resetRecording, setData]);

    const submitPitch = useCallback(() => {
        if (!recorder.recordedFile) {
            return;
        }

        post(route('pitch.upload'));
    }, [post, recorder.recordedFile]);

    const sharedProps = useMemo(() => ({
        initState,
        initError,
        isRecording: recorder.isRecording,
        isPaused: recorder.isPaused,
        isRecorded: recorder.isRecorded,
        recordingTime: recorder.recordingTime,
        maxDurationSeconds: MAX_DURATION_SECONDS,
        targetTimeMins,
        onTargetTimeChange: setTargetTimeMins,
        recordedUrl: recorder.recordedUrl,
        recordedFile: recorder.recordedFile,
        nativeMediaRecorder: recorder.nativeMediaRecorder,
        previewStream: recorder.previewStream,
        formErrors: errors,
        recorderError: recorder.error,
        devices,
        selectedAudioId,
        selectedVideoId,
        onAudioDeviceChange: setSelectedAudioId,
        onVideoDeviceChange: setSelectedVideoId,
        onStart: recorder.startRecording,
        onPause: recorder.pauseRecording,
        onResume: recorder.resumeRecording,
        onStop: handleStop,
        onReset: handleReset,
        onSubmit: submitPitch,
        cameraUnavailable,
        layout,
        mode,
        processing,
        progress,
        previewVideoRef: recorder.previewVideoRef,
        reattachPreview: recorder.reattachPreview,
        rediscover,
        onRequestAudioFallback,
    }), [
        initState,
        initError,
        recorder.isRecording,
        recorder.isPaused,
        recorder.isRecorded,
        recorder.recordingTime,
        targetTimeMins,
        recorder.recordedUrl,
        recorder.recordedFile,
        recorder.nativeMediaRecorder,
        recorder.previewStream,
        errors,
        recorder.error,
        devices,
        selectedAudioId,
        selectedVideoId,
        recorder.startRecording,
        recorder.pauseRecording,
        recorder.resumeRecording,
        recorder.reattachPreview,
        cameraUnavailable,
        layout,
        mode,
        processing,
        progress,
        recorder.previewVideoRef,
        handleStop,
        handleReset,
        submitPitch,
        rediscover,
        onRequestAudioFallback,
    ]);

    useEffect(() => {
        if (layout !== 'studio' || !onStudioStateChange) {
            return;
        }

        onStudioStateChange(sharedProps);
    }, [layout, onStudioStateChange, sharedProps]);

    if (processing) {
        if (layout === 'studio') {
            return null;
        }

        return <ProcessingOverlay progress={progress} />;
    }

    if (layout === 'studio') {
        return null;
    }

    if (!mode) {
        return null;
    }

    if (mode === 'audio') {
        return <AudioRecorderView {...sharedProps} />;
    }

    return (
        <VideoRecorderView
            {...sharedProps}
            previewVideoRef={recorder.previewVideoRef}
        />
    );
}
