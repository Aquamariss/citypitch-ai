import { Bot } from 'lucide-react';

export default function TypingIndicator() {
    return (
        <div className="flex gap-3" aria-live="polite" aria-label="Ассистент печатает">
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                <Bot className="w-4 h-4" />
            </div>

            <div
                className="rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5"
                style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            </div>
        </div>
    );
}
