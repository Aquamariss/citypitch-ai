import { AudioLines, Video } from 'lucide-react';

export default function ModePicker({ onSelect }) {
    return (
        <div className="w-full max-w-lg mx-auto px-3 space-y-4">
            <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Как запишем?
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Формат выбирается до доступа к устройствам
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                    type="button"
                    onClick={() => onSelect('video')}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                        <Video className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Видео</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Камера + микрофон
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('audio')}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}
                    >
                        <AudioLines className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Аудио</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Только микрофон
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}
