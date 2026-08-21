import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { route } from 'ziggy-js';
import {
    clearStoredDraft,
    createEmptyDraft,
    draftHasContent,
    getStoredDraft,
    sessionToDraft,
    type BlockKey,
    type PitchDraft,
} from '@/lib/pitchDraft';
import { getCsrfToken } from '@/lib/sse';

async function jsonRequest(url: string, { method = 'GET', body }: { method?: string; body?: any } = {}): Promise<any> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload: any = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = payload?.message
            ?? Object.values((payload?.errors ?? {}) as Record<string, string[]>)[0]?.[0]
            ?? 'Не удалось сохранить черновик.';

        throw new Error(message);
    }

    return payload;
}

export function usePitchDraft({
    initialSession = null,
    enableLocalImport = false,
}: {
    initialSession?: any;
    enableLocalImport?: boolean;
} = {}) {
    const draft = ref<PitchDraft>(sessionToDraft(initialSession));
    // Only available after an edit in the current page visit — hidden on refresh/re-entry.
    const canUndo = ref(false);
    const statusMessage = ref<string | null>(null);
    const highlightedBlocks = ref<string[]>([]);
    const updatedAt = ref<string | null>(initialSession?.updated_at ?? null);
    let saveTimer: number | null = null;
    let imported = false;

    const applySession = (session: any, { canUndo: nextCanUndo, highlight }: { canUndo?: boolean; highlight?: string[] } = {}): PitchDraft => {
        const nextDraft = sessionToDraft(session);

        updatedAt.value = session?.updated_at ?? null;
        draft.value = nextDraft;

        if (typeof nextCanUndo === 'boolean') {
            canUndo.value = nextCanUndo;
        }

        if (highlight?.length) {
            highlightedBlocks.value = highlight;
            statusMessage.value = `Обновлены: ${highlight.map(blockLabel).join(', ')}`;
            window.setTimeout(() => { highlightedBlocks.value = []; }, 2400);
        }

        return nextDraft;
    };

    const persistBlocks = (blocks: Record<BlockKey, string>) => {
        if (saveTimer) {
            window.clearTimeout(saveTimer);
        }

        saveTimer = window.setTimeout(async () => {
            try {
                const payload = await jsonRequest(route('pitch-writer.draft.update'), {
                    method: 'PATCH',
                    body: {
                        blocks,
                        updated_at: updatedAt.value,
                    },
                });

                if (payload?.session) {
                    applySession(payload.session, { canUndo: payload.can_undo ?? true });
                }
            } catch (error: any) {
                statusMessage.value = error.message;
            }
        }, 400);
    };

    const updateDraftLocally = (nextDraftOrUpdater: PitchDraft | ((current: PitchDraft) => PitchDraft)) => {
        const next = typeof nextDraftOrUpdater === 'function'
            ? nextDraftOrUpdater(draft.value)
            : nextDraftOrUpdater;

        persistBlocks(next.blocks ?? createEmptyDraft().blocks);
        draft.value = next;
    };

    const clearDraft = async () => {
        if (!draftHasContent(draft.value)) {
            return;
        }

        if (!window.confirm('Очистить черновик питча?')) {
            return;
        }

        const empty = createEmptyDraft();
        draft.value = empty;

        try {
            const payload = await jsonRequest(route('pitch-writer.draft.update'), {
                method: 'PATCH',
                body: {
                    blocks: empty.blocks,
                    updated_at: updatedAt.value,
                },
            });

            if (payload?.session) {
                applySession(payload.session, { canUndo: payload.can_undo ?? true });
            }
        } catch (error: any) {
            statusMessage.value = error.message;
        }
    };

    const undoDraft = async () => {
        try {
            const payload = await jsonRequest(route('pitch-writer.draft.undo'), {
                method: 'POST',
            });

            if (payload?.session) {
                applySession(payload.session, { canUndo: Boolean(payload.can_undo) });
                statusMessage.value = 'Изменение черновика отменено';
            }
        } catch (error: any) {
            statusMessage.value = error.message;
        }
    };

    const handleAgentDraftUpdate = (data: any) => {
        if (!data?.blocks) {
            return;
        }

        applySession({
            id: initialSession?.id,
            blocks: data.blocks,
            updated_at: data.updated_at,
        }, {
            canUndo: data.can_undo ?? true,
            highlight: data.changed ?? [],
        });
    };

    onMounted(() => {
        if (!enableLocalImport || imported) {
            return;
        }

        imported = true;
        const local = getStoredDraft();

        if (!draftHasContent(local) || draftHasContent(draft.value)) {
            if (draftHasContent(local) && draftHasContent(draft.value)) {
                clearStoredDraft();
            }

            return;
        }

        jsonRequest(route('pitch-writer.draft.import'), {
            method: 'POST',
            body: { blocks: local.blocks },
        }).then((payload) => {
            if (payload?.session) {
                applySession(payload.session);
                clearStoredDraft();
            }
        }).catch(() => {
            // Keep local draft if import fails; user can still edit after refresh retry.
        });
    });

    onBeforeUnmount(() => {
        if (saveTimer) {
            window.clearTimeout(saveTimer);
        }
    });

    return reactive({
        draft,
        canUndo,
        statusMessage,
        highlightedBlocks,
        setStatusMessage: (message: string | null) => { statusMessage.value = message; },
        updateDraftLocally,
        clearDraft,
        undoDraft,
        handleAgentDraftUpdate,
        applySession,
    });
}

function blockLabel(key: string): string {
    const labels: Record<string, string> = {
        problem: 'Проблема',
        solution: 'Решение',
        market: 'Рынок',
        business: 'Бизнес-модель',
        team: 'Команда',
        cta: 'Запрос',
    };

    return labels[key] ?? key;
}
