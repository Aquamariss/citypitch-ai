import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { PanelRightClose } from 'lucide-react';
import { route } from 'ziggy-js';
import {
    PITCH_DRAFT_BLOCKS,
    createEmptyDraft,
    draftHasContent,
    saveDraft,
} from '@/lib/pitchDraft';

/**
 * Shared editable pitch draft rail — same UI in Pitch Writer and Recording Studio.
 */
export default function PitchDraftPanel({
    draft,
    onChange,
    visible = true,
    width,
    minWidth = 280,
    maxWidth = 720,
    onHide,
    onResizeStart,
    context = 'writer',
}) {
    const blocks = useMemo(
        () => PITCH_DRAFT_BLOCKS.map((block) => ({
            key: block.key,
            title: block.title,
            content: draft.blocks?.[block.key] ?? '',
        })),
        [draft.blocks],
    );

    const updateBlock = (key, value) => {
        const nextBlocks = {
            ...draft.blocks,
            [key]: value,
        };
        const text = PITCH_DRAFT_BLOCKS
            .map((block) => nextBlocks[block.key]?.trim())
            .filter(Boolean)
            .join('\n\n');

        onChange(saveDraft({ ...draft, blocks: nextBlocks, text }));
    };

    const clearDraft = () => {
        if (!draftHasContent(draft)) {
            return;
        }

        if (!window.confirm('Очистить черновик питча?')) {
            return;
        }

        onChange(saveDraft(createEmptyDraft()));
    };

    if (!visible) {
        return null;
    }

    const contextAction = context === 'studio' ? (
        <Link href={route('pitch-writer.index')} className="btn btn-primary btn-sm">
            К райтеру
        </Link>
    ) : (
        <Link href={route('pitch.index')} className="btn btn-primary btn-sm">
            К записи
        </Link>
    );

    return (
        <aside
            className="pitch-draft-panel"
            id="draft-panel"
            style={width ? { width } : undefined}
            aria-label="Черновик питча"
        >
            {onResizeStart && (
                <div
                    className="pitch-draft-resize"
                    onPointerDown={onResizeStart}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Изменить ширину черновика"
                    aria-valuemin={minWidth}
                    aria-valuemax={maxWidth}
                    aria-valuenow={width}
                />
            )}

            <div className="pitch-draft-head">
                <div className="pitch-draft-title">Черновик питча</div>
                <div className="pitch-draft-actions">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={clearDraft}
                        aria-label="Очистить черновик"
                    >
                        Очистить
                    </button>
                    {contextAction}
                    {onHide && (
                        <button
                            type="button"
                            className="pitch-draft-hide"
                            onClick={onHide}
                            aria-label="Скрыть черновик"
                            title="Скрыть черновик"
                        >
                            <PanelRightClose strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            <div className="pitch-draft-list">
                {blocks.map((block) => (
                    <section key={block.key} className="pitch-draft-block">
                        <h3 className="pitch-draft-block-title">{block.title}</h3>
                        <textarea
                            className="pitch-draft-input"
                            value={block.content}
                            onChange={(event) => updateBlock(block.key, event.target.value)}
                            placeholder="Скажите своими словами"
                            aria-label={block.title}
                            rows={4}
                        />
                    </section>
                ))}
            </div>
        </aside>
    );
}
