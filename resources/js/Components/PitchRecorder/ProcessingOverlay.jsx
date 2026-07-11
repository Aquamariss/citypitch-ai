import { Brain } from 'lucide-react';

export default function ProcessingOverlay({ progress }) {
    return (
        <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center p-8 h-full min-h-[400px]"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                <div className="absolute inset-0 ai-ring" />
                <div className="absolute inset-2 ai-ring-reverse" />
                <Brain className="w-9 h-9 relative z-10" style={{ color: 'var(--ai-primary)' }} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">ИИ анализирует питч</h2>
            <p className="text-sm text-zinc-500 text-center max-w-xs mb-6">
                Загружаем файл, распознаём речь, оцениваем структуру и тайминг...
            </p>
            {progress && (
                <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <span>Загрузка</span>
                        <span className="font-mono" style={{ color: 'var(--ai-primary)' }}>{progress.percentage}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--ai-primary))' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
