export type MediaMode = 'audio' | 'video';

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
};

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
};

export const buildMediaConstraints = (
    mode: MediaMode,
    audioDeviceId: string | null,
    videoDeviceId: string | null,
): MediaStreamConstraints => ({
    audio: { ...AUDIO_CONSTRAINTS, ...(audioDeviceId ? { deviceId: { ideal: audioDeviceId } } : {}) },
    video: mode === 'audio' ? false : { ...VIDEO_CONSTRAINTS, ...(videoDeviceId ? { deviceId: { ideal: videoDeviceId } } : {}) },
});

export const tryGetUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
    try {
        return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
        return null;
    }
};

export const acquireUserMedia = async (
    mode: MediaMode,
    audioDeviceId: string | null,
    videoDeviceId: string | null,
): Promise<MediaStream | null> => {
    const ideal = await tryGetUserMedia(buildMediaConstraints(mode, audioDeviceId, videoDeviceId));

    if (ideal) {
        return ideal;
    }

    return tryGetUserMedia({ audio: AUDIO_CONSTRAINTS, video: mode === 'audio' ? false : VIDEO_CONSTRAINTS });
};

export const stopStream = (stream: MediaStream | null | undefined): void => {
    stream?.getTracks().forEach((track) => track.stop());
};
