import { useCallback, useEffect, useState } from 'react';
import { acquireUserMedia, stopStream, tryGetUserMedia } from '@/lib/media/mediaConstraints';
import { mapRecordingError } from '@/lib/media/recordingErrors';

/**
 * Discover devices for a chosen recording mode.
 * Does nothing until `enabled` is true and `mode` is set.
 */
export function useMediaDevices({ mode = null, enabled = false } = {}) {
    const [initState, setInitState] = useState(enabled && mode ? 'loading' : 'idle');
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState({ audio: [], video: [] });
    const [selectedAudioId, setSelectedAudioId] = useState(null);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [cameraUnavailable, setCameraUnavailable] = useState(false);

    const discover = useCallback(async () => {
        if (!enabled || !mode) {
            setInitState('idle');
            setError(null);

            return;
        }

        setInitState('loading');
        setError(null);
        setCameraUnavailable(false);

        if (!navigator.mediaDevices?.enumerateDevices) {
            setInitState('error');
            setError(mapRecordingError('unsupported'));

            return;
        }

        try {
            const wantVideo = mode === 'video';
            const permissionStream = wantVideo
                ? await tryGetUserMedia({ video: true, audio: true })
                : await tryGetUserMedia({ video: false, audio: true });

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

            if (wantVideo) {
                if (!defaultVideoId) {
                    setCameraUnavailable(true);
                    setInitState('error');
                    setError('Камера не найдена. Выберите аудио-режим или подключите камеру.');

                    return;
                }

                const cameraStream = await acquireUserMedia('video', defaultAudioId, defaultVideoId);

                if (!cameraStream) {
                    setCameraUnavailable(true);
                    setInitState('error');
                    setError('Нет доступа к камере. Разрешите доступ или выберите аудио-режим.');

                    return;
                }

                stopStream(cameraStream);
            }

            setCameraUnavailable(false);
            setInitState('ready');
        } catch (err) {
            setInitState('error');
            setError(mapRecordingError(err));
        }
    }, [enabled, mode]);

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
