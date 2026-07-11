import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function TranscriptPlayer({ mediaUrl, transcript = [], mediaType = 'video', duration: externalDuration = 0 }) {
    const playerRef = useRef(null);
    const transcriptContainerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(externalDuration);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Using refs for autoscroll to avoid re-running effect on every ms update
    const activePhraseRef = useRef(null);
    const activeIndexRef = useRef(-1);

    const handleTimeUpdate = () => {
        if (playerRef.current) {
            setCurrentTime(playerRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (playerRef.current && playerRef.current.duration && playerRef.current.duration !== Infinity) {
            setDuration(playerRef.current.duration);
        }
    };

    const togglePlay = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play().catch(e => console.error("Playback failed", e));
            }
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handlePhraseClick = (startTime) => {
        if (playerRef.current) {
            playerRef.current.currentTime = startTime;
            playerRef.current.play().catch(e => console.error("Playback failed", e));
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

    // Autoscroll effect
    useEffect(() => {
        const activeIndex = transcript.findIndex(
            (phrase) => currentTime >= phrase.start && currentTime <= phrase.end
        );
        
        if (activeIndex !== -1 && activeIndex !== activeIndexRef.current) {
            activeIndexRef.current = activeIndex;
            if (activePhraseRef.current && transcriptContainerRef.current) {
                const container = transcriptContainerRef.current;
                const element = activePhraseRef.current;
                
                // Calculate position to center the element in the container
                const scrollPos = element.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
                
                container.scrollTo({
                    top: scrollPos,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentTime, transcript]);

    return (
        <div className={`flex flex-col gap-6 w-full mx-auto`}>
            {/* Player Section */}
            <div className="w-full">
                <div className={`rounded-2xl overflow-hidden shadow-sm bg-slate-50 border border-slate-200 w-full relative ${mediaType === 'video' ? 'aspect-video bg-black flex items-center justify-center' : 'p-6 flex flex-col items-center justify-center'}`}>
                    {mediaType === 'audio' ? (
                        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
                            <audio 
                                ref={playerRef} 
                                src={mediaUrl} 
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                className="hidden"
                            />
                            
                            <button 
                                onClick={togglePlay} 
                                className="w-12 h-12 shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-sm"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                            </button>
                            
                            <div className="text-sm font-medium text-slate-600 w-12 text-right tabular-nums shrink-0">
                                {formatTime(currentTime)}
                            </div>
                            
                            <div className="flex-1 relative flex items-center">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={duration || 100} 
                                    value={currentTime} 
                                    onChange={handleSeek}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                            
                            <div className="text-sm font-medium text-slate-600 w-12 tabular-nums shrink-0">
                                {formatTime(duration)}
                            </div>
                        </div>
                    ) : (
                        <video 
                            ref={playerRef} 
                            src={mediaUrl} 
                            controls 
                            className="w-full h-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                        />
                    )}
                </div>
            </div>

            {/* Transcript Section */}
            <div className="w-full max-h-[400px] overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-semibold text-slate-800">Транскрипт</h3>
                </div>
                <div 
                    ref={transcriptContainerRef}
                    className="flex-1 overflow-y-auto p-6 relative"
                >
                    {transcript.length === 0 ? (
                        <p className="text-slate-500 italic text-center mt-10">Транскрипт недоступен.</p>
                    ) : (
                        <p className="text-slate-700 leading-loose text-lg font-serif">
                            {transcript.map((phrase, index) => {
                                const isActive = currentTime >= phrase.start && currentTime <= phrase.end;
                                return (
                                    <span
                                        key={phrase.id || index}
                                        ref={isActive ? activePhraseRef : null}
                                        onClick={() => handlePhraseClick(phrase.start)}
                                        className={`cursor-pointer transition-colors duration-200 px-1 py-0.5 rounded ${
                                            isActive 
                                                ? 'bg-blue-100 text-blue-900 font-medium shadow-sm' 
                                                : 'hover:bg-slate-100 text-slate-600'
                                        }`}
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
