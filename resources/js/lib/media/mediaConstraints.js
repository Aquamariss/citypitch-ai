const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
};

const VIDEO_CONSTRAINTS = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
};

const buildAudioConstraint = (deviceId, strictness) => {
    if (!deviceId) {
        return { ...AUDIO_CONSTRAINTS };
    }

    if (strictness === 'exact') {
        return { ...AUDIO_CONSTRAINTS, deviceId: { exact: deviceId } };
    }

    if (strictness === 'ideal') {
        return { ...AUDIO_CONSTRAINTS, deviceId: { ideal: deviceId } };
    }

    return { ...AUDIO_CONSTRAINTS };
};

const buildVideoConstraint = (deviceId, strictness) => {
    if (!deviceId) {
        return { ...VIDEO_CONSTRAINTS };
    }

    if (strictness === 'exact') {
        return { ...VIDEO_CONSTRAINTS, deviceId: { exact: deviceId } };
    }

    if (strictness === 'ideal') {
        return { ...VIDEO_CONSTRAINTS, deviceId: { ideal: deviceId } };
    }

    return { ...VIDEO_CONSTRAINTS };
};

export const buildMediaConstraints = (mode, audioDeviceId, videoDeviceId, strictness = 'ideal') => {
    const audio = buildAudioConstraint(audioDeviceId, strictness);

    if (mode === 'audio') {
        return { audio, video: false };
    }

    return {
        audio,
        video: buildVideoConstraint(videoDeviceId, strictness),
    };
};

export const buildConstraintAttempts = (mode, audioDeviceId, videoDeviceId) => {
    const attempts = [
        buildMediaConstraints(mode, audioDeviceId, videoDeviceId, 'ideal'),
        buildMediaConstraints(mode, audioDeviceId, videoDeviceId, 'default'),
    ];

    if (audioDeviceId || videoDeviceId) {
        attempts.unshift(buildMediaConstraints(mode, audioDeviceId, videoDeviceId, 'exact'));
    }

    return attempts;
};

export const tryGetUserMedia = async (constraints) => {
    try {
        return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
        return null;
    }
};

export const acquireUserMedia = async (mode, audioDeviceId, videoDeviceId) => {
    const attempts = buildConstraintAttempts(mode, audioDeviceId, videoDeviceId);

    for (const constraints of attempts) {
        const stream = await tryGetUserMedia(constraints);

        if (stream) {
            return stream;
        }
    }

    return null;
};

export const stopStream = (stream) => {
    stream?.getTracks().forEach((track) => track.stop());
};
