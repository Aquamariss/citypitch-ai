import { useRef, useState } from 'react';
import { formatTime } from './formatTime';

export default function AudioPreviewPlayer({ src }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const toggle = () => {
        if (!audioRef.current) {
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className="w-full max-w-sm rounded-xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={(event) => setCurrentTime(event.target.currentTime)}
                onLoadedMetadata={(event) => setDuration(event.target.duration)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />

            <div className="flex items-center gap-3">
                <button
                    onClick={toggle}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)' }}
                >
                    {isPlaying ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>
                <span className="text-xs font-mono text-zinc-400 w-10 tabular-nums">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
                    <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                        style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--ai-primary))' }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(event) => {
                            const time = parseFloat(event.target.value);

                            if (audioRef.current) {
                                audioRef.current.currentTime = time;
                            }

                            setCurrentTime(time);
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>
                <span className="text-xs font-mono text-zinc-500 w-10 tabular-nums">{formatTime(duration)}</span>
            </div>
        </div>
    );
}
