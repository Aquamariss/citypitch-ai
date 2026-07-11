import { VideoOff } from 'lucide-react';

export default function CameraPiP({
    initState,
    initError,
    isRecording,
    isRecorded,
    previewVideoRef,
    recordedUrl,
    visible,
    dimmed,
}) {
    if (!visible || isRecorded) {
        return null;
    }

    return (
        <div
            className={`absolute z-20 overflow-hidden rounded-xl shadow-lg transition-opacity duration-300
                w-40 h-[90px] top-3 right-3
                md:w-60 md:h-[135px] md:bottom-20 md:top-auto md:right-4
                lg:w-[280px] lg:h-[158px]`}
            style={{
                border: '1px solid var(--border-default)',
                backgroundColor: '#000',
                opacity: dimmed ? 0.75 : 1,
            }}
        >
            <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-transform duration-1000 ${isRecording ? 'scale-105' : 'scale-100'}`}
            />

            {initState === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                    <div
                        className="w-6 h-6 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)' }}
                    />
                </div>
            )}

            {initState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-2 text-center">
                    <VideoOff className="w-5 h-5 text-red-400 mb-1" strokeWidth={1.5} />
                    <p className="text-[10px] text-zinc-500 leading-tight">
                        {initError ?? 'Нет доступа к камере'}
                    </p>
                </div>
            )}

            {isRecording && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-white">REC</span>
                </div>
            )}
        </div>
    );
}

export function CameraPlayback({ recordedUrl, visible }) {
    if (!visible) {
        return null;
    }

    return (
        <div
            className="flex-1 rounded-2xl overflow-hidden relative min-h-0"
            style={{ backgroundColor: '#000', border: '1px solid var(--border-subtle)' }}
        >
            <video
                src={recordedUrl ?? undefined}
                controls
                playsInline
                className="w-full h-full object-contain absolute inset-0"
                style={{ backgroundColor: '#000' }}
            />
        </div>
    );
}
