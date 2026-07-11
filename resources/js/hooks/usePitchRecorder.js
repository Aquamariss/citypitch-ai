import { useCallback, useEffect, useRef, useState } from 'react';
import RecordRTC from 'recordrtc';
import { acquireUserMedia, stopStream } from '@/lib/media/mediaConstraints';
import { getFileExtension, resolveMimeType } from '@/lib/media/mimeTypes';
import { mapRecordingError, MIN_BLOB_SIZE } from '@/lib/media/recordingErrors';

const TIME_SLICE_MS = 1000;

const getNativeMediaRecorder = (recorder) => {
    const internal = recorder?.getInternalRecorder?.();

    if (!internal) {
        return null;
    }

    return internal.getInternalRecorder?.() ?? internal.mediaRecorder ?? null;
};

export function usePitchRecorder({
    mode,
    audioDeviceId,
    videoDeviceId,
    maxDurationSeconds = 600,
    enabled = true,
}) {
    const [initState, setInitState] = useState('loading');
    const [recorderState, setRecorderState] = useState('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedFile, setRecordedFile] = useState(null);
    const [recordedUrl, setRecordedUrl] = useState(null);
    const [error, setError] = useState(null);
    const [nativeMediaRecorder, setNativeMediaRecorder] = useState(null);

    const previewStreamRef = useRef(null);
    const recorderRef = useRef(null);
    const timerRef = useRef(null);
    const recordingStartedAtRef = useRef(null);
    const recordedUrlRef = useRef(null);
    const previewVideoRef = useRef(null);
    const mimeTypeRef = useRef(null);
    const autoStopRef = useRef(false);

    const isAudioMode = mode === 'audio';

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const revokeRecordedUrl = useCallback(() => {
        if (recordedUrlRef.current) {
            URL.revokeObjectURL(recordedUrlRef.current);
            recordedUrlRef.current = null;
        }
    }, []);

    const destroyRecorder = useCallback(() => {
        if (recorderRef.current) {
            try {
                recorderRef.current.destroy();
            } catch {
                // Recorder may already be destroyed.
            }

            recorderRef.current = null;
        }
    }, []);

    const attachPreviewToVideo = useCallback((stream) => {
        if (!previewVideoRef.current || isAudioMode) {
            return;
        }

        previewVideoRef.current.srcObject = stream;
    }, [isAudioMode]);

    const acquirePreviewStream = useCallback(async () => {
        stopStream(previewStreamRef.current);
        previewStreamRef.current = null;

        const stream = await acquireUserMedia(mode, audioDeviceId, videoDeviceId);

        if (!stream) {
            throw new Error('stream_failed');
        }

        previewStreamRef.current = stream;
        attachPreviewToVideo(stream);

        return stream;
    }, [attachPreviewToVideo, audioDeviceId, mode, videoDeviceId]);

    const initPreview = useCallback(async () => {
        if (!enabled || !audioDeviceId) {
            return;
        }

        setInitState('loading');
        setError(null);

        try {
            await acquirePreviewStream();
            setInitState('ready');
        } catch (err) {
            setInitState('error');
            setError(mapRecordingError(err));
        }
    }, [acquirePreviewStream, audioDeviceId, enabled]);

    const startTimer = useCallback(() => {
        recordingStartedAtRef.current = performance.now();
        setRecordingTime(0);
        clearTimer();

        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((performance.now() - recordingStartedAtRef.current) / 1000);
            setRecordingTime(elapsed);
        }, 250);
    }, [clearTimer]);

    const startRecording = useCallback(async () => {
        if (!enabled || recorderState === 'recording') {
            return;
        }

        setError(null);
        autoStopRef.current = false;

        try {
            let stream = previewStreamRef.current;

            if (!stream || stream.getTracks().every((track) => track.readyState === 'ended')) {
                stream = await acquirePreviewStream();
            }

            const recordType = isAudioMode ? 'audio' : 'video';
            const resolvedMime = resolveMimeType(recordType);
            mimeTypeRef.current = resolvedMime;

            destroyRecorder();

            const recorder = new RecordRTC(stream, {
                type: recordType,
                mimeType: resolvedMime,
                timeSlice: TIME_SLICE_MS,
                disableLogs: true,
                recorderType: RecordRTC.MediaStreamRecorder,
            });

            recorderRef.current = recorder;
            recorder.startRecording();

            setRecorderState('recording');
            startTimer();

            const nativeRecorder = getNativeMediaRecorder(recorder);
            setNativeMediaRecorder(nativeRecorder);
        } catch (err) {
            setRecorderState('idle');
            setError(mapRecordingError(err));
        }
    }, [acquirePreviewStream, destroyRecorder, enabled, isAudioMode, recorderState, startTimer]);

    const stopRecording = useCallback(async () => {
        const recorder = recorderRef.current;

        if (!recorder || recorderState !== 'recording') {
            return null;
        }

        clearTimer();
        setNativeMediaRecorder(null);

        return new Promise((resolve) => {
            recorder.stopRecording(() => {
                const blob = recorder.getBlob();

                if (!blob || blob.size < MIN_BLOB_SIZE) {
                    setRecorderState('idle');
                    setError(mapRecordingError('empty_blob'));
                    resolve(null);
                    return;
                }

                const mimeType = blob.type || mimeTypeRef.current;
                const extension = getFileExtension(mimeType);
                const file = new File([blob], `pitch.${extension}`, { type: mimeType });

                revokeRecordedUrl();

                const url = URL.createObjectURL(blob);
                recordedUrlRef.current = url;

                setRecordedFile(file);
                setRecordedUrl(url);
                setRecorderState('stopped');
                resolve({ file, url, mediaType: isAudioMode ? 'audio' : 'video' });
            });
        });
    }, [clearTimer, isAudioMode, recorderState, revokeRecordedUrl]);

    const resetRecording = useCallback(async () => {
        clearTimer();

        if (recorderState === 'recording' && recorderRef.current) {
            await new Promise((resolve) => {
                recorderRef.current.stopRecording(() => resolve());
            });
        }

        destroyRecorder();
        revokeRecordedUrl();

        setRecordedFile(null);
        setRecordedUrl(null);
        setRecordingTime(0);
        setRecorderState('idle');
        setNativeMediaRecorder(null);
        setError(null);
        autoStopRef.current = false;

        await initPreview();
    }, [clearTimer, destroyRecorder, initPreview, recorderState, revokeRecordedUrl]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        initPreview();

        return () => {
            clearTimer();
            destroyRecorder();
            stopStream(previewStreamRef.current);
            previewStreamRef.current = null;
            revokeRecordedUrl();
        };
    }, [audioDeviceId, clearTimer, destroyRecorder, enabled, initPreview, mode, revokeRecordedUrl, videoDeviceId]);

    useEffect(() => {
        if (recorderState !== 'recording' || recordingTime < maxDurationSeconds || autoStopRef.current) {
            return;
        }

        autoStopRef.current = true;
        stopRecording();
    }, [maxDurationSeconds, recorderState, recordingTime, stopRecording]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (recorderState !== 'recording') {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [recorderState]);

    return {
        initState,
        recorderState,
        isRecording: recorderState === 'recording',
        isRecorded: recorderState === 'stopped' && recordedFile !== null,
        recordingTime,
        recordedFile,
        recordedUrl,
        error,
        nativeMediaRecorder,
        previewVideoRef,
        previewStream: previewStreamRef.current,
        startRecording,
        stopRecording,
        resetRecording,
        reinitialize: initPreview,
    };
}
