import { blockKeys, methodologyBlocks, type BlockKey } from '@/lib/pitchMethodology';

export const PITCH_DRAFT_STORAGE_KEY = 'pitch-ai-draft';

export type { BlockKey };

export interface PitchDraft {
    text: string;
    blocks: Record<BlockKey, string>;
    updatedAt: string | null;
}

export interface PitchDraftBlock {
    key: BlockKey;
    title: string;
    limit: number;
    hint: string;
}

export function draftBlocks(): PitchDraftBlock[] {
    return methodologyBlocks().map((block) => ({
        key: block.key,
        title: block.title,
        limit: block.limit,
        hint: block.hint,
    }));
}

export function createEmptyDraft(): PitchDraft {
    return {
        text: '',
        blocks: Object.fromEntries(blockKeys().map((key) => [key, ''])) as Record<BlockKey, string>,
        updatedAt: null,
    };
}

export function blocksToDraft(blocks: Partial<Record<BlockKey, string>> = {}, updatedAt: string | null = null): PitchDraft {
    const normalizedBlocks: Record<BlockKey, string> = {
        ...createEmptyDraft().blocks,
        ...Object.fromEntries(
            Object.entries(blocks).map(([key, value]) => [key, value ?? '']),
        ),
    };
    const text = blockKeys()
        .map((key) => normalizedBlocks[key]?.trim())
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
}

export function draftHasContent(draft: PitchDraft): boolean {
    if ((draft.text ?? '').trim()) {
        return true;
    }

    return Object.values(draft.blocks ?? {}).some((value) => String(value).trim());
}
