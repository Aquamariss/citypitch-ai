import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ChevronRight,
    Info,
    Maximize2,
    Mic,
    Minimize2,
    PanelRightClose,
    Pause,
    Play,
    Video,
} from 'lucide-react';
import PitchRecorder from '@/Components/PitchRecorder';
import ProcessingOverlay from '@/Components/PitchRecorder/ProcessingOverlay';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner';
import PitchDraftPanel from '@/Components/PitchDraftPanel';
import useRecordingCountdown from '@/hooks/useRecordingCountdown';
import useRecordingHotkeys from '@/hooks/useRecordingHotkeys';
import useResizableSidePanel from '@/hooks/useResizableSidePanel';
import { getStoredDraft } from '@/lib/pitchDraft';
import CameraMirror from './CameraMirror';
import PitchRulesDrawer from './PitchRulesDrawer';
import StudioReview from './StudioReview';
import VoiceMemoWaveform from './VoiceMemoWaveform';

function formatClock(seconds = 0) {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}

export default function RecordingStudio({ defaultDuration }) {
    const [mode, setMode] = useState('video');
    const [rulesOpen, setRulesOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [studioState, setStudioState] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [draft, setDraft] = useState(() => getStoredDraft());
    const stageRef = useRef(null);

    const draftPanel = useResizableSidePanel({
        widthKey: 'pitch-ai-draft-width',
        visibleKey: 'pitch-ai-draft-visible',
        defaultWidth: 420,
        minWidth: 280,
        maxRatio: 0.4,
        containerRef: stageRef,
    });

    const isVideoMode = mode === 'video';

    const beginRecording = useCallback(() => {
        studioState?.onStart?.();
    }, [studioState]);

    const countdown = useRecordingCountdown({
        onComplete: beginRecording,
        seconds: 3,
    });

    const requestStart = useCallback(() => {
        if (!studioState || studioState.initState !== 'ready' || isRecording || studioState.isRecorded) {
            return;
        }

        setRulesOpen(false);
        countdown.start();
    }, [countdown, isRecording, studioState]);

    const handleStop = useCallback(() => {
        countdown.cancel();
        studioState?.onStop?.();
    }, [countdown, studioState]);

    const handlePauseToggle = useCallback(() => {
        if (!studioState?.isRecording) {
            return;
        }

        if (studioState.isPaused) {
            studioState.onResume?.();
        } else {
            studioState.onPause?.();
        }
    }, [studioState]);

    const handleRecordToggle = useCallback(() => {
        if (countdown.isCountingDown) {
            countdown.cancel();

            return;
        }

        if (isRecording) {
            handleStop();

            return;
        }

        requestStart();
    }, [countdown, handleStop, isRecording, requestStart]);

    const toggleFullscreen = useCallback(async () => {
        const target = stageRef.current ?? document.documentElement;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await target.requestFullscreen?.();
            }
        } catch {
            // Fullscreen may be blocked by the browser.
        }
    }, []);

    useRecordingHotkeys({
        enabled: Boolean(studioState) && !studioState.processing && !studioState.isRecorded,
        isRecording,
        isCountingDown: countdown.isCountingDown,
        canStart: studioState?.initState === 'ready' && !studioState?.isRecorded,
        onStart: requestStart,
        onStop: handleStop,
    });

    useEffect(() => {
        if (isRecording) {
            setRulesOpen(false);
        }
    }, [isRecording]);

    useEffect(() => {
        if (!countdown.isCountingDown) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                countdown.cancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [countdown]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const isRecorded = studioState?.isRecorded ?? false;
    const isPaused = studioState?.isPaused ?? false;
    const initState = studioState?.initState ?? 'idle';
    const isProcessing = Boolean(studioState?.processing);
    const maxDuration = studioState?.maxDurationSeconds ?? 600;

    const dataState = isRecorded
        ? 'idle'
        : countdown.isCountingDown
            ? 'countdown'
            : isRecording
                ? (isPaused ? 'paused' : 'recording')
                : 'idle';

    const formErrorMessages = Object.values(studioState?.formErrors ?? {});
    const visibleErrors = [
        ...formErrorMessages,
        ...(studioState?.recorderError && !isRecorded ? [studioState.recorderError] : []),
        ...(studioState?.initError && studioState.initState === 'error' ? [studioState.initError] : []),
    ];

    const handleSelectMode = (nextMode) => {
        if (isRecording || countdown.isCountingDown || isRecorded) {
            return;
        }

        countdown.cancel();
        setMode(nextMode);
        setStudioState(null);
        setIsRecording(false);
    };

    const modeSwitch = (
        <div className="mode-switch" role="group" aria-label="Режим записи">
            <button
                type="button"
                className={isVideoMode ? 'active' : undefined}
                aria-pressed={isVideoMode}
                onClick={() => handleSelectMode('video')}
                disabled={isRecording || countdown.isCountingDown}
            >
                <Video strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
                type="button"
                className={!isVideoMode ? 'active' : undefined}
                aria-pressed={!isVideoMode}
                onClick={() => handleSelectMode('audio')}
                disabled={isRecording || countdown.isCountingDown}
            >
                <Mic strokeWidth={1.5} aria-hidden="true" />
            </button>
        </div>
    );

    return (
        <div
            className="studio studio--camera"
            data-studio
            data-mode={mode}
            data-state={dataState}
            ref={stageRef}
        >
            {/* Keep recorder mounted through review so blob URL is not revoked. */}
            <PitchRecorder
                layout="studio"
                mode={mode}
                defaultDuration={defaultDuration}
                onRecordingStateChange={setIsRecording}
                onStudioStateChange={setStudioState}
                onRequestAudioFallback={() => handleSelectMode('audio')}
            />

            {isProcessing && <ProcessingOverlay progress={studioState?.progress} />}

            {!isProcessing && isRecorded && studioState && (
                <StudioReview
                    src={studioState.recordedUrl}
                    file={studioState.recordedFile}
                    isVideo={isVideoMode}
                    fallbackDuration={studioState.recordingTime}
                    onReset={studioState.onReset}
                    onSubmit={studioState.onSubmit}
                    stageRef={stageRef}
                />
            )}

            {!isProcessing && !isRecorded && (
                <>
                    <ErrorBanner errors={visibleErrors} variant="video" />

                    <div
                        className={`wc-stage${draftPanel.visible ? ' has-draft' : ''}${draftPanel.isResizing ? ' is-resizing' : ''}`}
                        style={draftPanel.visible ? { '--draft-panel-width': `${draftPanel.width}px` } : undefined}
                    >
                        <div className="wc-preview">
                            {!isRecording && !countdown.isCountingDown ? (
                                <header className="wc-top">
                                    <div className="wc-top-actions wc-top-actions--end">
                                        {modeSwitch}
                                        <button
                                            type="button"
                                            className="wc-cues-toggle-btn"
                                            onClick={() => draftPanel.setVisible(!draftPanel.visible)}
                                            aria-pressed={draftPanel.visible}
                                            aria-label={draftPanel.visible ? 'Скрыть черновик' : 'Показать черновик'}
                                            title={draftPanel.visible ? 'Скрыть черновик' : 'Показать черновик'}
                                        >
                                            {draftPanel.visible ? (
                                                <PanelRightClose strokeWidth={2} />
                                            ) : (
                                                <ChevronRight strokeWidth={2} />
                                            )}
                                        </button>
                                    </div>
                                </header>
                            ) : !draftPanel.visible ? (
                                <button
                                    type="button"
                                    className="wc-cues-toggle-btn wc-cues-toggle-btn--float"
                                    onClick={() => draftPanel.setVisible(true)}
                                    aria-label="Показать черновик"
                                    title="Показать черновик"
                                >
                                    <ChevronRight strokeWidth={2} />
                                </button>
                            ) : null}

                            <div className={`wc-media${isVideoMode ? '' : ' wc-media--audio'}`}>
                                {isVideoMode ? (
                                    studioState && (
                                        <CameraMirror
                                            placement="fullscreen"
                                            initState={initState}
                                            initError={studioState.initError}
                                            isRecording={isRecording}
                                            previewVideoRef={studioState.previewVideoRef}
                                            reattachPreview={studioState.reattachPreview}
                                            isVideoMode
                                        />
                                    )
                                ) : (
                                    <div className="wc-audio-stage">
                                        <div className="wc-audio-icon" aria-hidden="true">
                                            <Mic strokeWidth={1.5} />
                                        </div>
                                        <VoiceMemoWaveform
                                            stream={studioState?.previewStream}
                                            isRecording={isRecording}
                                            height={160}
                                        />
                                        {initState === 'loading' && (
                                            <p className="wc-audio-status">Подключаем микрофон…</p>
                                        )}
                                        {initState === 'error' && (
                                            <p className="wc-audio-status wc-audio-status--error">
                                                {studioState?.initError ?? 'Нет доступа к микрофону'}
                                            </p>
                                        )}
                                        {initState === 'ready' && !isRecording && !countdown.isCountingDown && (
                                            <p className="wc-audio-status">Готов к записи</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {(isRecording || countdown.isCountingDown) && (
                                <div className="wc-timer" aria-live="polite">
                                    <span className={`wc-timer-dot${isPaused ? ' is-paused' : ''}`} aria-hidden="true" />
                                    <span className="mono">
                                        {formatClock(studioState?.recordingTime ?? 0)}
                                        {' / '}
                                        {formatClock(maxDuration)}
                                    </span>
                                </div>
                            )}

                            {countdown.isCountingDown && (
                                <div className="countdown-overlay" role="status" aria-live="assertive">
                                    <div className="countdown-num countdown-digit">{countdown.count}</div>
                                </div>
                            )}

                            <footer className="wc-dock">
                                {!isRecording && !countdown.isCountingDown ? (
                                    <>
                                        <button
                                            type="button"
                                            className="wc-side-btn"
                                            onClick={() => setRulesOpen((open) => !open)}
                                            aria-label="Правила записи"
                                            aria-expanded={rulesOpen}
                                        >
                                            <Info strokeWidth={2} />
                                        </button>

                                        <button
                                            type="button"
                                            className="wc-record"
                                            onClick={handleRecordToggle}
                                            disabled={!studioState || initState !== 'ready'}
                                            aria-label="Начать запись"
                                        >
                                            <span className="wc-record-dot" aria-hidden="true" />
                                        </button>

                                        <span className="wc-dock-spacer" aria-hidden="true" />
                                    </>
                                ) : (
                                    <div className="wc-dock-center">
                                        <button
                                            type="button"
                                            className="wc-stop"
                                            onClick={handleRecordToggle}
                                            aria-label={
                                                countdown.isCountingDown
                                                    ? 'Отменить обратный отсчёт'
                                                    : 'Остановить запись'
                                            }
                                        >
                                            <span className="wc-stop-square" aria-hidden="true" />
                                        </button>

                                        {isRecording && (
                                            <button
                                                type="button"
                                                className="wc-pause"
                                                onClick={handlePauseToggle}
                                                aria-label={isPaused ? 'Продолжить запись' : 'Пауза'}
                                            >
                                                {isPaused ? (
                                                    <Play strokeWidth={2} fill="currentColor" />
                                                ) : (
                                                    <Pause strokeWidth={2} fill="currentColor" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </footer>

                            <button
                                type="button"
                                className="wc-fullscreen"
                                onClick={toggleFullscreen}
                                aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
                            >
                                {isFullscreen ? <Minimize2 strokeWidth={2} /> : <Maximize2 strokeWidth={2} />}
                            </button>
                        </div>

                        {draftPanel.visible && (
                            <PitchDraftPanel
                                draft={draft}
                                onChange={setDraft}
                                visible
                                width={draftPanel.width}
                                minWidth={draftPanel.minWidth}
                                maxWidth={draftPanel.maxWidth}
                                onHide={() => draftPanel.setVisible(false)}
                                onResizeStart={draftPanel.beginResize}
                                context="studio"
                            />
                        )}
                    </div>

                    <PitchRulesDrawer open={rulesOpen} onClose={() => setRulesOpen(false)} />
                </>
            )}
        </div>
    );
}
