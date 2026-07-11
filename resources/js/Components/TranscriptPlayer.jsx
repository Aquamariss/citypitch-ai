import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function TranscriptPlayer({ mediaUrl, transcript = [], mediaType = 'video', duration: externalDuration = 0 }) {
    const playerRef = useRef(null);
    const transcriptContainerRef = useRef(null);
    const activePhraseRef = useRef(null);
    const activeIndexRef = useRef(-1);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(externalDuration);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleTimeUpdate = () => {
        if (playerRef.current) setCurrentTime(playerRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (playerRef.current && playerRef.current.duration && playerRef.current.duration !== Infinity) {
            setDuration(playerRef.current.duration);
        }
    };

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) playerRef.current.pause();
        else playerRef.current.play().catch((e) => console.error('Playback failed', e));
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) { playerRef.current.currentTime = time; setCurrentTime(time); }
    };

    const handlePhraseClick = (startTime) => {
        if (playerRef.current) {
            playerRef.current.currentTime = startTime;
            playerRef.current.play().catch((e) => console.error('Playback failed', e));
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        const audio = playerRef.current;
        if (!audio) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
        };
    }, [mediaUrl]);

    useEffect(() => {
        const activeIndex = transcript.findIndex((p) => currentTime >= p.start && currentTime <= p.end);
        if (activeIndex !== -1 && activeIndex !== activeIndexRef.current) {
            activeIndexRef.current = activeIndex;
            if (activePhraseRef.current && transcriptContainerRef.current) {
                const container = transcriptContainerRef.current;
                const element = activePhraseRef.current;
                const scrollPos = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2;
                container.scrollTo({ top: scrollPos, behavior: 'smooth' });
            }
        }
    }, [currentTime, transcript]);

    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Player */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border-subtle)' }}
            >
                {mediaType === 'video' ? (
                    <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                        <video
                            ref={playerRef}
                            src={mediaUrl}
                            controls
                            className="w-full h-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                        />
                    </div>
                ) : (
                    /* Audio Player */
                    <div
                        className="p-4 flex items-center gap-3"
                        style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                        <audio
                            ref={playerRef}
                            src={mediaUrl}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            className="hidden"
                        />
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)' }}
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <Volume2 className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.5} />
                        <span className="text-xs font-mono text-zinc-500 w-10 tabular-nums shrink-0">{formatTime(currentTime)}</span>

                        <div className="flex-1 relative h-1.5 rounded-full overflow-hidden cursor-pointer" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--ai-primary))' }}
                            />
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>

                        <span className="text-xs font-mono text-zinc-600 w-10 tabular-nums shrink-0">{formatTime(duration)}</span>
                    </div>
                )}
            </div>

            {/* Transcript */}
            <div
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', maxHeight: '380px' }}
            >
                <div
                    className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                    style={{ borderColor: 'var(--border-subtle)' }}
                >
                    <h3 className="text-sm font-semibold text-zinc-200">Транскрипт</h3>
                    <span className="text-xs text-zinc-600">{transcript.length} фраз</span>
                </div>

                <div
                    ref={transcriptContainerRef}
                    className="flex-1 overflow-y-auto p-5 transcript-scroll"
                >
                    {transcript.length === 0 ? (
                        <p className="text-zinc-600 text-sm italic text-center py-8">Транскрипт недоступен</p>
                    ) : (
                        <p className="text-zinc-300 leading-loose text-base font-serif">
                            {transcript.map((phrase, index) => {
                                const isActive = currentTime >= phrase.start && currentTime <= phrase.end;
                                return (
                                    <span
                                        key={phrase.id || index}
                                        ref={isActive ? activePhraseRef : null}
                                        onClick={() => handlePhraseClick(phrase.start)}
                                        className={`cursor-pointer transition-all duration-200 px-1 py-0.5 rounded ${
                                            isActive
                                                ? 'text-violet-300 font-medium'
                                                : 'hover:text-zinc-100'
                                        }`}
                                        style={isActive ? {
                                            backgroundColor: 'var(--accent-subtle)',
                                            boxShadow: '0 0 8px var(--accent-glow)',
                                        } : {}}
                                    >
                                        {phrase.text}{' '}
                                    </span>
                                );
                            })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
