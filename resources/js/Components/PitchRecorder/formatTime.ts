export const formatTime = (seconds: number): string => {
    if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
        return '00:00';
    }

    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${secs}`;
};
