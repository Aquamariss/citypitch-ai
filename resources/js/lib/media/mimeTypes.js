const AUDIO_CANDIDATES = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
];

const VIDEO_CANDIDATES = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
];

const isTypeSupported = (mimeType) => {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType);
};

export const resolveMimeType = (type) => {
    const candidates = type === 'audio' ? AUDIO_CANDIDATES : VIDEO_CANDIDATES;
    const fallback = type === 'audio' ? 'audio/webm' : 'video/webm';

    return candidates.find(isTypeSupported) ?? fallback;
};

export const getFileExtension = (mimeType) => {
    if (!mimeType) {
        return 'webm';
    }

    if (mimeType.includes('mp4')) {
        return 'mp4';
    }

    if (mimeType.includes('ogg')) {
        return 'ogg';
    }

    return 'webm';
};
