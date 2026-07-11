export default function DeviceSelector({
    devices,
    selectedAudioId,
    selectedVideoId,
    onAudioDeviceChange,
    onVideoDeviceChange,
    showVideo = true,
    variant = 'card',
}) {
    if (!devices?.audio?.length) {
        return null;
    }

    const selectClassName = variant === 'video'
        ? 'bg-transparent text-xs font-medium text-white outline-none cursor-pointer appearance-none max-w-[140px] truncate'
        : 'text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[160px] truncate';

    const wrapperStyle = variant === 'video'
        ? { backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
        : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' };

    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={wrapperStyle}>
            <select
                value={selectedAudioId ?? ''}
                onChange={(event) => onAudioDeviceChange(event.target.value)}
                className={selectClassName}
                title="Микрофон"
            >
                {devices.audio.map((device) => (
                    <option
                        key={device.deviceId}
                        value={device.deviceId}
                        className={variant === 'video' ? 'bg-zinc-900 text-white' : undefined}
                    >
                        {device.label || 'Микрофон'}
                    </option>
                ))}
            </select>
            {showVideo && devices.video?.length > 0 && (
                <select
                    value={selectedVideoId ?? ''}
                    onChange={(event) => onVideoDeviceChange(event.target.value)}
                    className={selectClassName}
                    title="Камера"
                >
                    {devices.video.map((device) => (
                        <option
                            key={device.deviceId}
                            value={device.deviceId}
                            className={variant === 'video' ? 'bg-zinc-900 text-white' : undefined}
                        >
                            {device.label || 'Камера'}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
