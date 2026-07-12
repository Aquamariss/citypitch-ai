import LogoMark from '@/Components/LogoMark';
import { starterPrompts } from '@/lib/pitchWriterPrompts';

export default function ChatEmptyState({ onSelectPrompt, disabled }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-12 px-4 text-center">
            <LogoMark size={48} />

            <div className="space-y-2 max-w-md">
                <h2 style={{ fontSize: 22, fontWeight: 600 }}>Чем я могу помочь?</h2>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
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
                        className="btn btn-secondary btn-sm"
                    >
                        {prompt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
