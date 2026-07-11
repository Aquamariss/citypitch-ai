import { FileText, Type } from 'lucide-react';
import { generatePitchTemplate } from '@/lib/pitchScript';

const FONT_SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];

export default function Teleprompter({
    scrollRef,
    script,
    onScriptChange,
    settings,
    onSettingsChange,
    fontSizePx,
    isRecording,
    isRecorded,
    visible,
}) {
    if (!visible || isRecorded) {
        return null;
    }

    const handleInsertTemplate = () => {
        if (script.trim() && !window.confirm('Заменить текущий текст шаблоном?')) {
            return;
        }

        onScriptChange(generatePitchTemplate());
    };

    return (
        <div
            className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <div
                className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 flex-wrap"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Type className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Размер</span>
                </div>
                <div className="flex items-center gap-1">
                    {FONT_SIZE_OPTIONS.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => onSettingsChange({ fontSize: size })}
                            className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
                            style={{
                                backgroundColor: settings.fontSize === size ? 'var(--accent-subtle)' : 'transparent',
                                color: settings.fontSize === size ? 'var(--accent-primary)' : 'var(--text-muted)',
                                border: `1px solid ${settings.fontSize === size ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                            }}
                            aria-label={`Размер шрифта ${size}`}
                            aria-pressed={settings.fontSize === size}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                <div className="hidden sm:block w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-subtle)' }} />

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onSettingsChange({ scrollMode: 'auto' })}
                        className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: settings.scrollMode === 'auto' ? 'var(--accent-subtle)' : 'transparent',
                            color: settings.scrollMode === 'auto' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            border: `1px solid ${settings.scrollMode === 'auto' ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                        }}
                        aria-pressed={settings.scrollMode === 'auto'}
                    >
                        Авто
                    </button>
                    <button
                        type="button"
                        onClick={() => onSettingsChange({ scrollMode: 'manual' })}
                        className="px-2 py-1 rounded-md text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: settings.scrollMode === 'manual' ? 'var(--accent-subtle)' : 'transparent',
                            color: settings.scrollMode === 'manual' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            border: `1px solid ${settings.scrollMode === 'manual' ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                        }}
                        aria-pressed={settings.scrollMode === 'manual'}
                    >
                        Ручная
                    </button>
                </div>

                {settings.scrollMode === 'manual' && (
                    <input
                        type="range"
                        min={10}
                        max={120}
                        value={settings.manualSpeed}
                        onChange={(event) => onSettingsChange({ manualSpeed: Number(event.target.value) })}
                        className="w-20 sm:w-28 accent-violet-600"
                        aria-label="Скорость прокрутки"
                    />
                )}

                {!isRecording && (
                    <button
                        type="button"
                        onClick={handleInsertTemplate}
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                    >
                        <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Вставить шаблон</span>
                        <span className="sm:hidden">Шаблон</span>
                    </button>
                )}
            </div>

            {isRecording ? (
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto teleprompter-scroll custom-scrollbar px-6 py-8"
                >
                    <div
                        className="teleprompter-text whitespace-pre-wrap text-zinc-200"
                        style={{ fontSize: `${fontSizePx}px` }}
                    >
                        {script || 'Нет текста для телесуфлёра'}
                    </div>
                    <div className="h-[40vh]" aria-hidden="true" />
                </div>
            ) : (
                <textarea
                    value={script}
                    onChange={(event) => onScriptChange(event.target.value)}
                    placeholder={'Напишите текст питча или вставьте шаблон.\n\nСтруктура: Проблема → Решение → Рынок → Бизнес-модель → Команда → Запрос'}
                    className="flex-1 w-full resize-none teleprompter-text teleprompter-scroll custom-scrollbar px-6 py-5 bg-transparent outline-none text-zinc-200 placeholder:text-zinc-600"
                    style={{ fontSize: `${fontSizePx}px` }}
                />
            )}
        </div>
    );
}
