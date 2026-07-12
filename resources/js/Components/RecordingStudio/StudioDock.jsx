import { useState } from 'react';
import {
    AudioLines,
    ChevronDown,
    Lightbulb,
    RotateCcw,
    Send,
    Settings2,
    Square,
    Video,
} from 'lucide-react';
import DeviceSelector from '@/Components/PitchRecorder/DeviceSelector';
import RecordingTimer from '@/Components/PitchRecorder/RecordingTimer';
import { formatTime } from '@/Components/PitchRecorder/formatTime';

function DevicesMenu({
    devices,
    selectedAudioId,
    selectedVideoId,
    onAudioDeviceChange,
    onVideoDeviceChange,
    cameraUnavailable,
}) {
    const [open, setOpen] = useState(false);

    if (!devices?.audio?.length) {
        return null;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                }}
                aria-expanded={open}
                aria-label="Настройки устройств"
            >
                <Settings2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Устройства</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-10"
                        aria-label="Закрыть настройки устройств"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="absolute bottom-full left-0 mb-1 z-20 p-3 rounded-xl min-w-[240px] sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1"
                        style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        }}
                    >
                        <DeviceSelector
                            devices={devices}
                            selectedAudioId={selectedAudioId}
                            selectedVideoId={selectedVideoId}
                            onAudioDeviceChange={onAudioDeviceChange}
                            onVideoDeviceChange={onVideoDeviceChange}
                            showVideo={!cameraUnavailable}
                            variant="card"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export function SetupDock({
    recordingTime,
    targetTimeMins,
    onTargetTimeChange,
    devices,
    selectedAudioId,
    selectedVideoId,
    onAudioDeviceChange,
    onVideoDeviceChange,
    cameraUnavailable,
    isVideoMode,
    canStart,
    isCountingDown,
    onStart,
    onRulesToggle,
    rulesOpen,
    onChangeMode,
}) {
    return (
        <div
            className="shrink-0 rounded-2xl px-3 py-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <div className="flex items-center gap-2 flex-wrap min-w-0">
                <RecordingTimer
                    variant="card"
                    isRecording={false}
                    recordingTime={recordingTime}
                    targetTimeMins={targetTimeMins}
                    onTargetTimeChange={onTargetTimeChange}
                />

                <DevicesMenu
                    devices={devices}
                    selectedAudioId={selectedAudioId}
                    selectedVideoId={selectedVideoId}
                    onAudioDeviceChange={onAudioDeviceChange}
                    onVideoDeviceChange={onVideoDeviceChange}
                    cameraUnavailable={cameraUnavailable}
                />

                <button
                    type="button"
                    onClick={onRulesToggle}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                        backgroundColor: rulesOpen ? 'var(--accent-subtle)' : 'transparent',
                        color: rulesOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${rulesOpen ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                    }}
                    aria-pressed={rulesOpen}
                    aria-label="Открыть памятку питчинга"
                >
                    <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="hidden md:inline">Памятка</span>
                </button>

                {onChangeMode && (
                    <button
                        type="button"
                        onClick={onChangeMode}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        {isVideoMode ? <Video className="w-3.5 h-3.5" /> : <AudioLines className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Сменить формат</span>
                    </button>
                )}
            </div>

            <div className="sm:ml-auto flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <p className="text-[11px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                    <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: 'var(--border-default)' }}>
                        Space
                    </kbd>
                    <span className="ml-1.5 hidden sm:inline">старт / стоп</span>
                </p>

                <button
                    type="button"
                    onClick={onStart}
                    disabled={!canStart || isCountingDown}
                    className="flex items-center gap-2 h-12 px-5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 24px var(--accent-glow)' }}
                    aria-label="Начать запись"
                >
                    {isVideoMode
                        ? <Video className="w-5 h-5" strokeWidth={1.5} />
                        : <AudioLines className="w-5 h-5" strokeWidth={1.5} />
                    }
                    {isCountingDown ? 'Приготовьтесь…' : 'Начать запись'}
                </button>
            </div>
        </div>
    );
}

export function PerformanceDock({
    recordingTime,
    targetTimeMins,
    onStop,
    isCountingDown,
    onCancelCountdown,
    speedMultiplier = 1,
    onSpeedDown,
    onSpeedUp,
    showSpeedControls = true,
}) {
    return (
        <div
            className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-3.5"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '1px solid var(--border-subtle)',
            }}
        >
            <div
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full min-w-0"
                style={{ backgroundColor: 'var(--danger-subtle)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-sm font-mono font-bold text-red-500 tabular-nums">
                    {isCountingDown ? '—' : formatTime(recordingTime)}
                </span>
                <span className="text-xs tabular-nums hidden xs:inline sm:inline" style={{ color: 'var(--text-muted)' }}>
                    / {formatTime(targetTimeMins * 60)}
                </span>
            </div>

            {showSpeedControls && !isCountingDown && (
                <div
                    className="flex items-center gap-1 rounded-full p-0.5"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                    <button
                        type="button"
                        onClick={onSpeedDown}
                        className="w-8 h-8 rounded-full text-sm font-semibold transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        aria-label="Медленнее"
                    >
                        −
                    </button>
                    <span className="text-xs font-mono tabular-nums w-10 text-center" style={{ color: 'var(--text-primary)' }}>
                        {speedMultiplier.toFixed(1)}×
                    </span>
                    <button
                        type="button"
                        onClick={onSpeedUp}
                        className="w-8 h-8 rounded-full text-sm font-semibold transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        aria-label="Быстрее"
                    >
                        +
                    </button>
                </div>
            )}

            {isCountingDown ? (
                <button
                    type="button"
                    onClick={onCancelCountdown}
                    className="h-12 px-5 rounded-full text-sm font-medium transition-colors"
                    style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                    }}
                >
                    Отмена
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onStop}
                    className="h-12 sm:h-14 px-5 sm:px-8 rounded-full flex items-center gap-2 text-sm sm:text-base font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] animate-record-pulse"
                    style={{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 28px var(--record-pulse)' }}
                    aria-label="Остановить запись"
                >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" strokeWidth={0} />
                    Стоп
                </button>
            )}
        </div>
    );
}

/** @deprecated Use PerformanceDock — kept for any residual imports */
export function PerformanceChrome(props) {
    return <PerformanceDock {...props} />;
}

export function ReviewDock({ onReset, onSubmit }) {
    return (
        <div
            className="shrink-0 rounded-2xl p-3 sm:p-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <button
                type="button"
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
            >
                <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                Перезаписать
            </button>
            <button
                type="button"
                onClick={onSubmit}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
            >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Отправить ИИ
            </button>
        </div>
    );
}

export function CountdownOverlay({ count }) {
    if (count === null) {
        return null;
    }

    return (
        <div
            className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            aria-live="assertive"
        >
            <div
                key={count}
                className="countdown-digit text-7xl sm:text-8xl font-bold text-white tabular-nums"
            >
                {count}
            </div>
        </div>
    );
}
