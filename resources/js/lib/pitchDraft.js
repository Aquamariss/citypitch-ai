import { PITCH_TIPS } from '@/lib/pitchScript';

export const PITCH_DRAFT_STORAGE_KEY = 'pitch-ai-draft';

const BLOCK_KEYS = ['problem', 'solution', 'market', 'business', 'team', 'cta'];

export const PITCH_DRAFT_BLOCKS = PITCH_TIPS.map((tip, index) => ({
    key: BLOCK_KEYS[index],
    title: tip.title,
    subtitle: tip.subtitle,
}));

export function createEmptyDraft() {
    return {
        text: '',
        blocks: Object.fromEntries(BLOCK_KEYS.map((key) => [key, ''])),
        updatedAt: null,
    };
}

export function blocksToDraft(blocks = {}, updatedAt = null) {
    const normalizedBlocks = {
        ...createEmptyDraft().blocks,
        ...blocks,
    };
    const text = PITCH_DRAFT_BLOCKS
        .map((block) => normalizedBlocks[block.key]?.trim())
        .filter(Boolean)
        .join('\n\n');

    return {
        text,
        blocks: normalizedBlocks,
        updatedAt,
    };
}

export function sessionToDraft(session) {
    if (!session) {
        return createEmptyDraft();
    }

    return blocksToDraft(session.blocks ?? {}, session.updated_at ?? null);
}

export function getStoredDraft() {
    if (typeof window === 'undefined') {
        return createEmptyDraft();
    }

    try {
        const stored = localStorage.getItem(PITCH_DRAFT_STORAGE_KEY);

        if (!stored) {
            const legacy = localStorage.getItem('pitch-ai-script');

            if (legacy?.trim()) {
                return {
                    ...createEmptyDraft(),
                    text: legacy,
                    updatedAt: new Date().toISOString(),
                };
            }

            return createEmptyDraft();
        }

        const parsed = JSON.parse(stored);

        return {
            ...createEmptyDraft(),
            ...parsed,
            blocks: {
                ...createEmptyDraft().blocks,
                ...(parsed.blocks ?? {}),
            },
        };
    } catch {
        return createEmptyDraft();
    }
}

export function clearStoredDraft() {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem(PITCH_DRAFT_STORAGE_KEY);
    localStorage.removeItem('pitch-ai-script');
}

export function draftHasContent(draft) {
    if ((draft.text ?? '').trim()) {
        return true;
    }

    return Object.values(draft.blocks ?? {}).some((value) => String(value).trim());
}

/**
 * Build short cue cards for the recording stage.
 */
export function buildCueCards(draft) {
    return PITCH_DRAFT_BLOCKS.map((block) => {
        const fromBlock = (draft.blocks?.[block.key] ?? '').trim();
        let cue = fromBlock;

        if (!cue && draft.text) {
            cue = extractBlockSnippet(draft.text, block.title);
        }

        if (!cue) {
            cue = 'Скажите своими словами';
        }

        return {
            key: block.key,
            title: block.title,
            subtitle: block.subtitle,
            cue: truncateCue(cue, 220),
        };
    });
}

function truncateCue(text, max = 220) {
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.length <= max) {
        return normalized;
    }

    return `${normalized.slice(0, max - 1).trim()}…`;
}

function extractBlockSnippet(text, title) {
    const pattern = new RegExp(
        `(?:^|\\n)\\s*\\d*\\.?\\s*${escapeRegExp(title)}[^\\n]*\\n+([\\s\\S]*?)(?=\\n\\s*\\d+\\.\\s*|\\n\\s*(?:Проблема|Решение|Рынок|Бизнес-модель|Команда|Запрос)\\b|$)`,
        'i',
    );
    const match = text.match(pattern);

    if (!match?.[1]) {
        return '';
    }

    return match[1].trim().split('\n').filter(Boolean)[0] ?? '';
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
