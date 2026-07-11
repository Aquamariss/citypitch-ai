import { AudioLines, RotateCcw, Send, Square, Video } from 'lucide-react';

export default function RecordingControls({
    variant = 'audio',
    placement = 'overlay',
    isRecording,
    isRecorded,
    onStart,
    onStop,
    onReset,
    onSubmit,
}) {
    if (isRecorded) {
        if (placement === 'studio') {
            return (
                <div className="flex gap-3 p-4 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                        onClick={onReset}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                    >
                        <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                        Перезаписать
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
                    >
                        <Send className="w-4 h-4" strokeWidth={1.5} />
                        Отправить ИИ
                    </button>
                </div>
            );
        }

        if (variant === 'video') {
            return (
                <div
                    className="absolute bottom-0 left-0 right-0 p-5 z-20 flex gap-3"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                >
                    <button
                        onClick={onReset}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                    >
                        <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                        Перезаписать
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
                    >
                        <Send className="w-4 h-4" strokeWidth={1.5} />
                        Отправить ИИ
                    </button>
                </div>
            );
        }

        return (
            <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                    onClick={onReset}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor = 'var(--border-strong)';
                        event.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor = 'var(--border-default)';
                        event.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                    Перезаписать
                </button>
                <button
                    onClick={onSubmit}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
                    onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
                    onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'var(--accent-primary)'; }}
                >
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                    Отправить ИИ
                </button>
            </div>
        );
    }

    if (placement === 'studio') {
        return (
            <div className="flex justify-center py-4 shrink-0">
                {!isRecording ? (
                    <button
                        onClick={onStart}
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 32px var(--accent-glow)' }}
                        title="Начать запись"
                        aria-label="Начать запись"
                    >
                        {variant === 'video'
                            ? <Video className="w-7 h-7" strokeWidth={1.5} />
                            : <AudioLines className="w-6 h-6" strokeWidth={1.5} />
                        }
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
                        style={{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 32px var(--record-pulse)' }}
                        title="Остановить запись"
                        aria-label="Остановить запись"
                    >
                        <Square className="w-7 h-7" fill="currentColor" strokeWidth={0} />
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'video') {
        return (
            <div
                className="absolute bottom-0 left-0 right-0 flex justify-center items-end p-8 z-10"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
            >
                {!isRecording ? (
                    <button
                        onClick={onStart}
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 32px var(--accent-glow)' }}
                        title="Начать запись"
                    >
                        <Video className="w-7 h-7" strokeWidth={1.5} />
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
                        style={{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 32px var(--record-pulse)' }}
                        title="Остановить запись"
                    >
                        <Square className="w-7 h-7" fill="currentColor" strokeWidth={0} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex justify-center p-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            {!isRecording ? (
                <button
                    onClick={onStart}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-record-pulse"
                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 28px var(--accent-glow)' }}
                    title="Начать запись"
                >
                    <AudioLines className="w-6 h-6" strokeWidth={1.5} />
                </button>
            ) : (
                <button
                    onClick={onStop}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ backgroundColor: 'var(--record-active)', boxShadow: '0 0 28px var(--record-pulse)' }}
                    title="Остановить запись"
                >
                    <Square className="w-6 h-6" fill="currentColor" strokeWidth={0} />
                </button>
            )}
        </div>
    );
}
