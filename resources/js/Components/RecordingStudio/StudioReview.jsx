import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minimize2, Pause, Play, Trash2, X } from 'lucide-react';
import VoiceMemoWaveform from './VoiceMemoWaveform';

function formatClock(seconds = 0) {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}

function syntheticPeaks(count = 120) {
    return Array.from({ length: count }, (_, i) => 0.08 + ((i * 37) % 17) / 40);
}

async function extractPeaksFromFile(file, samples = 180) {
    const audioContext = new AudioContext();

    try {
        const buffer = await file.arrayBuffer();
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        const channel = decoded.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / samples));
        const peaks = [];

        for (let i = 0; i < samples; i += 1) {
            const start = i * blockSize;
            let peak = 0;

            for (let j = 0; j < blockSize && start + j < channel.length; j += 1) {
                peak = Math.max(peak, Math.abs(channel[start + j]));
            }

            peaks.push(Math.min(1, peak * 1.6));
        }

        return { peaks, duration: decoded.duration };
    } finally {
        if (audioContext.state !== 'closed') {
            await audioContext.close();
        }
    }
}

export default function StudioReview({
    src,
    file = null,
    isVideo = true,
    fallbackDuration = 0,
    onReset,
    onSubmit,
    stageRef = null,
}) {
    const mediaRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(fallbackDuration);
    const [playbackUrl, setPlaybackUrl] = useState(src || null);
    const [mediaError, setMediaError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [peaks, setPeaks] = useState(null);

    useEffect(() => {
        if (!(file instanceof Blob)) {
            setPlaybackUrl(src || null);

            return undefined;
        }

        const objectUrl = URL.createObjectURL(file);
        setPlaybackUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file, src]);

    useEffect(() => {
        if (isVideo) {
            return undefined;
        }

        let cancelled = false;

        if (!(file instanceof Blob)) {
            setPeaks(syntheticPeaks());

            return undefined;
        }

        extractPeaksFromFile(file)
            .then((result) => {
                if (cancelled) {
                    return;
                }

                setPeaks(result.peaks);

                if (result.duration && Number.isFinite(result.duration)) {
                    setDuration((current) => (current > 0 ? current : result.duration));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPeaks(syntheticPeaks());
                }
            });

        return () => {
            cancelled = true;
        };
    }, [file, isVideo]);

    useEffect(() => {
        if (!isPlaying) {
            return undefined;
        }

        let raf = 0;

        const sync = () => {
            const media = mediaRef.current;

            if (media && Number.isFinite(media.currentTime)) {
                setCurrentTime(media.currentTime);

                if (Number.isFinite(media.duration) && media.duration > 0) {
                    setDuration(media.duration);
                }
            }

            raf = requestAnimationFrame(sync);
        };

        raf = requestAnimationFrame(sync);

        return () => cancelAnimationFrame(raf);
    }, [isPlaying]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const mediaDuration = duration > 0 ? duration : fallbackDuration;
    const progress = mediaDuration > 0 ? Math.min(1, Math.max(0, currentTime / mediaDuration)) : 0;

    const mediaEvents = {
        onTimeUpdate: (event) => setCurrentTime(event.target.currentTime),
        onLoadedMetadata: (event) => {
            if (Number.isFinite(event.target.duration) && event.target.duration > 0) {
                setDuration(event.target.duration);
            }
        },
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onEnded: () => {
            setIsPlaying(false);
            const media = mediaRef.current;

            if (media && Number.isFinite(media.duration)) {
                setCurrentTime(media.duration);
            }
        },
        onError: () => {
            setIsPlaying(false);
            setMediaError('Файл записи недоступен');
        },
    };

    const togglePlay = async () => {
        const media = mediaRef.current;

        if (!media || !playbackUrl) {
            setMediaError(isVideo ? 'Нет видео для воспроизведения' : 'Нет аудио для воспроизведения');

            return;
        }

        try {
            if (!media.paused && !media.ended) {
                media.pause();
                setIsPlaying(false);

                return;
            }

            const limit = Number.isFinite(media.duration) ? media.duration : mediaDuration;

            if (media.ended || (limit > 0 && media.currentTime >= limit - 0.05)) {
                media.currentTime = 0;
                setCurrentTime(0);
            }

            await media.play();
            setIsPlaying(true);
            setMediaError(null);
        } catch (error) {
            setIsPlaying(false);
            setMediaError(error?.message || 'Не удалось воспроизвести запись');
        }
    };

    const seekToRatio = (ratio) => {
        const media = mediaRef.current;

        if (!media) {
            return;
        }

        const limit = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : mediaDuration;
        const next = Math.min(limit, Math.max(0, ratio * limit));
        media.currentTime = next;
        setCurrentTime(next);
    };

    const toggleFullscreen = async () => {
        const target = stageRef?.current ?? document.documentElement;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await target.requestFullscreen?.();
            }
        } catch {
            // Fullscreen may be blocked by the browser.
        }
    };

    return (
        <div className="wc-review">
            {isVideo ? (
                <video
                    ref={mediaRef}
                    src={playbackUrl || undefined}
                    playsInline
                    preload="auto"
                    className="wc-video"
                    {...mediaEvents}
                />
            ) : (
                <div className="wc-review-audio">
                    <audio
                        ref={mediaRef}
                        src={playbackUrl || undefined}
                        preload="auto"
                        {...mediaEvents}
                    />
                    <VoiceMemoWaveform peaks={peaks} progress={progress} height={180} fit="span" />
                </div>
            )}

            <button
                type="button"
                className="wc-close"
                onClick={() => setConfirmDelete(true)}
                aria-label="Закрыть запись"
            >
                <X strokeWidth={2} />
            </button>

            {mediaError && (
                <p className="wc-error" role="alert">
                    {mediaError}
                </p>
            )}

            <div className="wc-review-bar">
                <div className="wc-playback">
                    <button
                        type="button"
                        className="wc-playback-play"
                        onClick={togglePlay}
                        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                        {isPlaying ? (
                            <Pause strokeWidth={2} fill="currentColor" />
                        ) : (
                            <Play strokeWidth={2} fill="currentColor" />
                        )}
                    </button>
                    <span className="wc-playback-time mono">{formatClock(currentTime)}</span>
                    <button
                        type="button"
                        className="wc-seek"
                        aria-label="Перемотать"
                        onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            seekToRatio((event.clientX - rect.left) / rect.width);
                        }}
                    >
                        <span className="wc-seek-track">
                            <span className="wc-seek-fill" style={{ width: `${progress * 100}%` }} />
                            <span className="wc-seek-head" style={{ left: `${progress * 100}%` }} />
                        </span>
                    </button>
                    <span className="wc-playback-time mono">{formatClock(mediaDuration)}</span>
                </div>

                <div className="wc-review-actions">
                    <button type="button" className="wc-save" onClick={onSubmit}>
                        <Download strokeWidth={2} aria-hidden="true" />
                        Сохранить
                    </button>
                    <button
                        type="button"
                        className="wc-icon-btn"
                        onClick={() => setConfirmDelete(true)}
                        aria-label="Удалить запись"
                    >
                        <Trash2 strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        className="wc-fullscreen"
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
                    >
                        {isFullscreen ? <Minimize2 strokeWidth={2} /> : <Maximize2 strokeWidth={2} />}
                    </button>
                </div>
            </div>

            {confirmDelete && (
                <div className="wc-confirm" role="dialog" aria-modal="true" aria-labelledby="wc-delete-title">
                    <button
                        type="button"
                        className="wc-close wc-close--overlay"
                        onClick={() => setConfirmDelete(false)}
                        aria-label="Отмена"
                    >
                        <X strokeWidth={2} />
                    </button>
                    <div className="wc-confirm-body">
                        <h2 id="wc-delete-title">
                            {isVideo ? 'Удалить эту видеозапись?' : 'Удалить эту аудиозапись?'}
                        </h2>
                        <p>Если вы не сохранили эту запись, она будет потеряна.</p>
                        <div className="wc-confirm-actions">
                            <button type="button" className="wc-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="wc-confirm-delete"
                                onClick={() => {
                                    setConfirmDelete(false);
                                    onReset?.();
                                }}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
