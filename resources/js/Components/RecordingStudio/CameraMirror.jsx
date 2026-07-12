import { useEffect } from 'react';
import { VideoOff } from 'lucide-react';
import LiveAudioVisualizerPanel from '@/Components/PitchRecorder/LiveAudioVisualizer';

const PLACEMENT_CLASSES = {
    setup: 'relative w-full h-full min-h-[180px] sm:min-h-[220px] lg:min-h-0 rounded-2xl overflow-hidden',
    fullscreen: 'relative w-full h-full min-h-0 overflow-hidden',
    'performance-bar': 'relative shrink-0 w-[112px] h-[63px] sm:w-[140px] sm:h-[79px] rounded-lg overflow-hidden',
    'performance-side': 'relative w-full h-full min-h-0 rounded-xl overflow-hidden',
};

export default function CameraMirror({
    placement = 'setup',
    initState,
    initError,
    isRecording,
    previewVideoRef,
    reattachPreview,
    isVideoMode = true,
    nativeMediaRecorder,
    mirrored = true,
}) {
    const shellClass = PLACEMENT_CLASSES[placement] ?? PLACEMENT_CLASSES.setup;

    useEffect(() => {
        if (!isVideoMode) {
            return;
        }

        reattachPreview?.();
    }, [isVideoMode, placement, reattachPreview]);

    return (
        <div
            className={shellClass}
            style={{
                border: placement === 'fullscreen' ? 'none' : '1px solid var(--border-default)',
                backgroundColor: '#0a0a0a',
            }}
        >
            {isVideoMode ? (
                <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                    <LiveAudioVisualizerPanel
                        mediaRecorder={nativeMediaRecorder}
                        isRecording={isRecording}
                    />
                    {placement === 'setup' && (
                        <span className="text-xs text-zinc-500">
                            {isRecording ? 'Идёт запись…' : 'Аудио-режим'}
                        </span>
                    )}
                </div>
            )}

            {initState === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                    <div
                        className="w-7 h-7 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)' }}
                    />
                </div>
            )}

            {initState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-3 text-center">
                    <VideoOff className="w-6 h-6 text-red-400 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-zinc-400 leading-snug max-w-[12rem]">
                        {initError ?? 'Нет доступа к камере'}
                    </p>
                </div>
            )}
        </div>
    );
}

export function CameraPlayback({ recordedUrl, visible, fill = false }) {
    if (!visible) {
        return null;
    }

    if (fill) {
        return (
            <video
                src={recordedUrl ?? undefined}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
                style={{ backgroundColor: '#000' }}
            />
        );
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
