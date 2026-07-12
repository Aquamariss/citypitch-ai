import { Send, Square } from 'lucide-react';
import { useRef } from 'react';

export default function ChatComposer({ isBusy, onSend, onStop, disabled = false }) {
    const textareaRef = useRef(null);

    const resizeTextarea = () => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const content = textareaRef.current?.value ?? '';

        if (!content.trim()) {
            return;
        }

        onSend(content);

        if (textareaRef.current) {
            textareaRef.current.value = '';
            textareaRef.current.style.height = 'auto';
        }
    };

    return (
        <div
            className="shrink-0 pt-4 pb-6 px-4 border-t"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}
        >
            <div className="max-w-3xl mx-auto w-full">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 rounded-3xl border shadow-sm transition-all focus-within:ring-1 focus-within:ring-violet-500/30"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                >
                    <textarea
                        ref={textareaRef}
                        className="flex-1 max-h-40 min-h-[56px] rounded-3xl bg-transparent border-none focus:ring-0 px-6 py-4 outline-none resize-none text-[15px]"
                        style={{ color: 'var(--text-primary)' }}
                        onInput={resizeTextarea}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                handleSubmit(event);
                            }
                        }}
                        placeholder="Опишите вашу идею..."
                        disabled={disabled || isBusy}
                        rows={1}
                    />

                    <div className="pr-3 pb-3 shrink-0">
                        {isBusy ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="rounded-full p-2 h-9 w-9 flex items-center justify-center transition-colors shadow-sm"
                                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                aria-label="Остановить генерацию"
                            >
                                <Square size={14} fill="currentColor" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={disabled}
                                className="rounded-full p-2 h-9 w-9 flex items-center justify-center transition-colors shadow-sm disabled:opacity-40"
                                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                                aria-label="Отправить сообщение"
                            >
                                <Send size={16} className="ml-0.5" />
                            </button>
                        )}
                    </div>
                </form>

                <p className="text-center mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Pitch Writer может допускать ошибки. Проверяйте важную информацию.
                </p>
            </div>
        </div>
    );
}
