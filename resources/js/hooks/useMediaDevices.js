import { useCallback, useEffect, useState } from 'react';
import { acquireUserMedia, stopStream, tryGetUserMedia } from '@/lib/media/mediaConstraints';
import { mapRecordingError } from '@/lib/media/recordingErrors';

export function useMediaDevices() {
    const [initState, setInitState] = useState('loading');
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState({ audio: [], video: [] });
    const [selectedAudioId, setSelectedAudioId] = useState(null);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [cameraUnavailable, setCameraUnavailable] = useState(false);

    const discover = useCallback(async () => {
        setInitState('loading');
        setError(null);
        setCameraUnavailable(false);

        if (!navigator.mediaDevices?.enumerateDevices) {
            setInitState('error');
            setError(mapRecordingError('unsupported'));
            return;
        }

        try {
            const permissionStream = await tryGetUserMedia({ video: true, audio: true })
                ?? await tryGetUserMedia({ video: false, audio: true });

            if (!permissionStream) {
                setInitState('error');
                setError(mapRecordingError('NotAllowedError'));
                return;
            }

            stopStream(permissionStream);

            const enumerated = await navigator.mediaDevices.enumerateDevices();
            const audio = enumerated.filter((device) => device.kind === 'audioinput');
            const video = enumerated.filter((device) => device.kind === 'videoinput');

            if (audio.length === 0) {
                setInitState('error');
                setError(mapRecordingError('NotFoundError'));
                return;
            }

            const defaultAudioId = audio[0]?.deviceId ?? null;
            const defaultVideoId = video[0]?.deviceId ?? null;

            setDevices({ audio, video });
            setSelectedAudioId(defaultAudioId);
            setSelectedVideoId(defaultVideoId);

            if (!defaultVideoId) {
                setCameraUnavailable(true);
                setInitState('ready');
                return;
            }

            const cameraStream = await acquireUserMedia('video', defaultAudioId, defaultVideoId);
            stopStream(cameraStream);
            setCameraUnavailable(!cameraStream);
            setInitState('ready');
        } catch (err) {
            setInitState('error');
            setError(mapRecordingError(err));
        }
    }, []);

    useEffect(() => {
        discover();
    }, [discover]);

    return {
        initState,
        error,
        devices,
        selectedAudioId,
        selectedVideoId,
        setSelectedAudioId,
        setSelectedVideoId,
        cameraUnavailable,
        rediscover: discover,
    };
}
