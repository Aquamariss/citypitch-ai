import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { usePitchRecorder } from '@/hooks/usePitchRecorder';
import AudioRecorderView from './AudioRecorderView';
import ProcessingOverlay from './ProcessingOverlay';
import VideoRecorderView from './VideoRecorderView';

const MAX_DURATION_SECONDS = 600;

export default function PitchRecorder({ defaultDuration, onRecordingStateChange }) {
    const [targetTimeMins, setTargetTimeMins] = useState(Math.round(defaultDuration / 60) || 3);

    const {
        initState: devicesInitState,
        error: devicesError,
        devices,
        selectedAudioId,
        selectedVideoId,
        setSelectedAudioId,
        setSelectedVideoId,
        cameraUnavailable,
    } = useMediaDevices();

    const mode = cameraUnavailable ? 'audio' : 'video';
    const devicesReady = devicesInitState === 'ready';

    const recorder = usePitchRecorder({
        mode,
        audioDeviceId: selectedAudioId,
        videoDeviceId: selectedVideoId,
        maxDurationSeconds: MAX_DURATION_SECONDS,
        enabled: devicesReady,
    });

    const { setData, post, progress, processing, errors } = useForm({
        video: null,
        duration: targetTimeMins * 60,
        media_type: mode,
    });

    useEffect(() => {
        setData('duration', targetTimeMins * 60);
    }, [setData, targetTimeMins]);

    useEffect(() => {
        setData('media_type', mode);
    }, [mode, setData]);

    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(recorder.isRecording);
        }
    }, [onRecordingStateChange, recorder.isRecording]);

    const initState = useMemo(() => {
        if (devicesInitState === 'loading' || (devicesReady && recorder.initState === 'loading')) {
            return 'loading';
        }

        if (devicesInitState === 'error' || recorder.initState === 'error') {
            return 'error';
        }

        return 'ready';
    }, [devicesInitState, devicesReady, recorder.initState]);

    const initError = devicesError ?? (recorder.initState === 'error' ? recorder.error : null);

    const handleStop = async () => {
        const result = await recorder.stopRecording();

        if (result?.file) {
            setData('video', result.file);
            setData('media_type', result.mediaType);
        }
    };

    const handleReset = async () => {
        setData('video', null);
        await recorder.resetRecording();
    };

    const submitPitch = () => {
        if (!recorder.recordedFile) {
            return;
        }

        post(route('pitch.upload'));
    };

    if (processing) {
        return <ProcessingOverlay progress={progress} />;
    }

    const sharedProps = {
        initState,
        initError,
        isRecording: recorder.isRecording,
        isRecorded: recorder.isRecorded,
        recordingTime: recorder.recordingTime,
        targetTimeMins,
        onTargetTimeChange: setTargetTimeMins,
        recordedUrl: recorder.recordedUrl,
        nativeMediaRecorder: recorder.nativeMediaRecorder,
        formErrors: errors,
        recorderError: recorder.error,
        devices,
        selectedAudioId,
        selectedVideoId,
        onAudioDeviceChange: setSelectedAudioId,
        onVideoDeviceChange: setSelectedVideoId,
        onStart: recorder.startRecording,
        onStop: handleStop,
        onReset: handleReset,
        onSubmit: submitPitch,
        cameraUnavailable,
    };

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
