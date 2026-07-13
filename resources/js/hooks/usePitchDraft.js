import { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import {
    clearStoredDraft,
    createEmptyDraft,
    draftHasContent,
    getStoredDraft,
    sessionToDraft,
} from '@/lib/pitchDraft';
import { getCsrfToken } from '@/lib/sse';

async function jsonRequest(url, { method = 'GET', body } = {}) {
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

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = payload?.message
            ?? Object.values(payload?.errors ?? {})[0]?.[0]
            ?? 'Не удалось сохранить черновик.';
        throw new Error(message);
    }

    return payload;
}

export function usePitchDraft({
    initialSession = null,
    enableLocalImport = false,
} = {}) {
    const [draft, setDraft] = useState(() => sessionToDraft(initialSession));
    // Only available after an edit in the current page visit — hidden on refresh/re-entry.
    const [canUndo, setCanUndo] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [highlightedBlocks, setHighlightedBlocks] = useState([]);
    const updatedAtRef = useRef(initialSession?.updated_at ?? null);
    const saveTimerRef = useRef(null);
    const importedRef = useRef(false);

    useEffect(() => {
        if (!enableLocalImport || importedRef.current) {
            return;
        }

        importedRef.current = true;
        const local = getStoredDraft();

        if (!draftHasContent(local) || draftHasContent(draft)) {
            if (draftHasContent(local) && draftHasContent(draft)) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enableLocalImport]);

    const applySession = useCallback((session, { canUndo: nextCanUndo, highlight } = {}) => {
        const nextDraft = sessionToDraft(session);
        updatedAtRef.current = session?.updated_at ?? null;
        setDraft(nextDraft);

        if (typeof nextCanUndo === 'boolean') {
            setCanUndo(nextCanUndo);
        }

        if (highlight?.length) {
            setHighlightedBlocks(highlight);
            setStatusMessage(`Обновлены: ${highlight.map(blockLabel).join(', ')}`);
            window.setTimeout(() => setHighlightedBlocks([]), 2400);
        }

        return nextDraft;
    }, []);

    const persistBlocks = useCallback((blocks) => {
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = window.setTimeout(async () => {
            try {
                const payload = await jsonRequest(route('pitch-writer.draft.update'), {
                    method: 'PATCH',
                    body: {
                        blocks,
                        updated_at: updatedAtRef.current,
                    },
                });

                if (payload?.session) {
                    applySession(payload.session, { canUndo: payload.can_undo ?? true });
                }
            } catch (error) {
                setStatusMessage(error.message);
            }
        }, 400);
    }, [applySession]);

    const updateDraftLocally = useCallback((nextDraftOrUpdater) => {
        setDraft((current) => {
            const next = typeof nextDraftOrUpdater === 'function'
                ? nextDraftOrUpdater(current)
                : nextDraftOrUpdater;

            persistBlocks(next.blocks ?? createEmptyDraft().blocks);

            return next;
        });
    }, [persistBlocks]);

    const clearDraft = useCallback(async () => {
        if (!draftHasContent(draft)) {
            return;
        }

        if (!window.confirm('Очистить черновик питча?')) {
            return;
        }

        const empty = createEmptyDraft();
        setDraft(empty);

        try {
            const payload = await jsonRequest(route('pitch-writer.draft.update'), {
                method: 'PATCH',
                body: {
                    blocks: empty.blocks,
                    updated_at: updatedAtRef.current,
                },
            });

            if (payload?.session) {
                applySession(payload.session, { canUndo: payload.can_undo ?? true });
            }
        } catch (error) {
            setStatusMessage(error.message);
        }
    }, [applySession, draft]);

    const undoDraft = useCallback(async () => {
        try {
            const payload = await jsonRequest(route('pitch-writer.draft.undo'), {
                method: 'POST',
            });

            if (payload?.session) {
                applySession(payload.session, { canUndo: Boolean(payload.can_undo) });
                setStatusMessage('Изменение черновика отменено');
            }
        } catch (error) {
            setStatusMessage(error.message);
        }
    }, [applySession]);

    const handleAgentDraftUpdate = useCallback((data) => {
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
    }, [applySession, initialSession?.id]);

    useEffect(() => () => {
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }
    }, []);

    return {
        draft,
        canUndo,
        statusMessage,
        highlightedBlocks,
        setStatusMessage,
        updateDraftLocally,
        clearDraft,
        undoDraft,
        handleAgentDraftUpdate,
        applySession,
    };
}

function blockLabel(key) {
    const labels = {
        problem: 'Проблема',
        solution: 'Решение',
        market: 'Рынок',
        business: 'Бизнес-модель',
        team: 'Команда',
        cta: 'Запрос',
    };

    return labels[key] ?? key;
}
