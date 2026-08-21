import { PITCH_TIPS } from '@/lib/pitchScript';

export const PITCH_DRAFT_STORAGE_KEY = 'pitch-ai-draft';

const BLOCK_KEYS = ['problem', 'solution', 'market', 'business', 'team', 'cta'] as const;

export type BlockKey = (typeof BLOCK_KEYS)[number];

export interface PitchDraft {
    text: string;
    blocks: Record<BlockKey, string>;
    updatedAt: string | null;
}

export interface PitchDraftBlock {
    key: BlockKey;
    title: string;
    subtitle: string;
}

export const PITCH_DRAFT_BLOCKS: PitchDraftBlock[] = PITCH_TIPS.map((tip, index) => ({
    key: BLOCK_KEYS[index],
    title: tip.title,
    subtitle: tip.subtitle,
}));

export function createEmptyDraft(): PitchDraft {
    return {
        text: '',
        blocks: Object.fromEntries(BLOCK_KEYS.map((key) => [key, ''])) as Record<BlockKey, string>,
        updatedAt: null,
    };
}

export function blocksToDraft(blocks: Partial<Record<BlockKey, string>> = {}, updatedAt: string | null = null): PitchDraft {
    const normalizedBlocks: Record<BlockKey, string> = {
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

export function sessionToDraft(session: any): PitchDraft {
    if (!session) {
        return createEmptyDraft();
    }

    return blocksToDraft(session.blocks ?? {}, session.updated_at ?? null);
}

export function getStoredDraft(): PitchDraft {
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

export function clearStoredDraft(): void {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem(PITCH_DRAFT_STORAGE_KEY);
    localStorage.removeItem('pitch-ai-script');
}

export function draftHasContent(draft: PitchDraft): boolean {
    if ((draft.text ?? '').trim()) {
        return true;
    }

    return Object.values(draft.blocks ?? {}).some((value) => String(value).trim());
}

export interface CueCard {
    key: BlockKey;
    title: string;
    subtitle: string;
    cue: string;
}

/**
 * Build short cue cards for the recording stage.
 */
export function buildCueCards(draft: PitchDraft): CueCard[] {
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

function truncateCue(text: string, max = 220): string {
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.length <= max) {
        return normalized;
    }

    return `${normalized.slice(0, max - 1).trim()}…`;
}

function extractBlockSnippet(text: string, title: string): string {
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

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
