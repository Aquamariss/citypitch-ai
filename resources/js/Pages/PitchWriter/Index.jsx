import { useCallback, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronRight, PanelRightClose } from 'lucide-react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner';
import PitchDraftPanel from '@/Components/PitchDraftPanel';
import ChatComposer from '@/Components/PitchWriter/ChatComposer';
import ChatEmptyState from '@/Components/PitchWriter/ChatEmptyState';
import ChatTranscript from '@/Components/PitchWriter/ChatTranscript';
import { usePitchDraft } from '@/hooks/usePitchDraft';
import { usePitchWriterChat } from '@/hooks/usePitchWriterChat';
import useResizableSidePanel from '@/hooks/useResizableSidePanel';
import { getCsrfToken } from '@/lib/sse';

export default function PitchWriter({
    session,
    messages: initialMessages = [],
    limits: initialLimits = null,
}) {
    const writerLayoutRef = useRef(null);
    const [limits, setLimits] = useState(initialLimits);

    const draftPanel = useResizableSidePanel({
        widthKey: 'pitch-ai-draft-width',
        visibleKey: 'pitch-ai-draft-visible',
        defaultWidth: 420,
        minWidth: 280,
        maxRatio: 0.4,
        containerRef: writerLayoutRef,
        defaultVisible: typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches,
    });

    const {
        draft,
        canUndo,
        statusMessage,
        highlightedBlocks,
        updateDraftLocally,
        clearDraft,
        undoDraft,
        handleAgentDraftUpdate,
        applySession,
    } = usePitchDraft({
        initialSession: session,
        enableLocalImport: true,
    });

    const handleDraftUpdated = useCallback((data) => {
        handleAgentDraftUpdate(data);
    }, [handleAgentDraftUpdate]);

    const {
        messages,
        displayMessages,
        errors,
        isBusy,
        showTypingIndicator,
        sendMessage,
        stopGeneration,
        replaceMessages,
        scrollRef,
    } = usePitchWriterChat({
        initialMessages,
        onDraftUpdated: handleDraftUpdated,
        onLimitsUpdated: setLimits,
    });

    const resetChat = useCallback(async () => {
        if (!window.confirm('Начать новый чат? История сообщений будет очищена.')) {
            return;
        }

        const response = await fetch(route('pitch-writer.session.reset'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': getCsrfToken(),
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ clear_draft: false }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            return;
        }

        replaceMessages(payload.messages ?? []);

        if (payload.session) {
            applySession(payload.session, { canUndo: false });
        }

        if (payload.limits) {
            setLimits(payload.limits);
        }
    }, [applySession, replaceMessages]);

    const showEmptyState = messages.length === 0 && !isBusy;

    const layoutStyle = useMemo(
        () => (draftPanel.visible
            ? { '--draft-panel-width': `${draftPanel.width}px` }
            : undefined),
        [draftPanel.visible, draftPanel.width],
    );

    return (
        <AppLayout>
            <Head title="Pitch Writer" />

            <div
                ref={writerLayoutRef}
                className={`writer-layout${draftPanel.visible ? ' has-draft' : ''}${draftPanel.isResizing ? ' is-resizing' : ''}`}
                style={layoutStyle}
            >
                <section className="writer-chat">
                    <div className="writer-toolbar">
                        <div>
                            <h1>Питч Райтер</h1>
                            {limits && (
                                <p className="writer-limits caps">
                                    Осталось {limits.messages_remaining} сообщ.
                                </p>
                            )}
                        </div>
                        <div className="writer-toolbar-actions">
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={resetChat}
                                    disabled={isBusy}
                                >
                                    Новый чат
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm draft-toggle"
                                onClick={() => draftPanel.setVisible(!draftPanel.visible)}
                                aria-expanded={draftPanel.visible}
                                aria-controls="draft-panel"
                            >
                                {draftPanel.visible ? (
                                    <>
                                        <PanelRightClose strokeWidth={2} aria-hidden="true" />
                                        Скрыть
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight strokeWidth={2} aria-hidden="true" />
                                        Черновик
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <ErrorBanner errors={errors} />

                    {showEmptyState ? (
                        <div className="chat-list">
                            <ChatEmptyState onSelectPrompt={sendMessage} disabled={isBusy} />
                        </div>
                    ) : (
                        <ChatTranscript
                            messages={displayMessages}
                            showTypingIndicator={showTypingIndicator}
                            scrollRef={scrollRef}
                        />
                    )}

                    <ChatComposer
                        isBusy={isBusy}
                        onSend={sendMessage}
                        onStop={stopGeneration}
                    />
                </section>

                <PitchDraftPanel
                    draft={draft}
                    onChange={updateDraftLocally}
                    onClear={clearDraft}
                    onUndo={undoDraft}
                    canUndo={canUndo}
                    highlightedBlocks={highlightedBlocks}
                    statusMessage={statusMessage}
                    visible={draftPanel.visible}
                    width={draftPanel.width}
                    minWidth={draftPanel.minWidth}
                    maxWidth={draftPanel.maxWidth}
                    onHide={() => draftPanel.setVisible(false)}
                    onResizeStart={draftPanel.beginResize}
                    context="writer"
                />
            </div>
        </AppLayout>
    );
}
