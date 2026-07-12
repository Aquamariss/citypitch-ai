import { Bot, Sparkles } from 'lucide-react';
import { starterPrompts } from '@/lib/pitchWriterPrompts';

export default function ChatEmptyState({ onSelectPrompt, disabled }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-16 px-4 text-center">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white' }}
            >
                <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Чем я могу помочь?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Расскажите о проекте своими словами — вместе соберём убедительный питч по структуре из 6 блоков.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {starterPrompts.map((prompt) => (
                    <button
                        key={prompt.label}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelectPrompt(prompt.text)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-40 hover:scale-[1.02]"
                        style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        {prompt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
