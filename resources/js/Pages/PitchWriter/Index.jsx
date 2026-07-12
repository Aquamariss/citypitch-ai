import { useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronRight, PanelRightClose } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner';
import PitchDraftPanel from '@/Components/PitchDraftPanel';
import ChatComposer from '@/Components/PitchWriter/ChatComposer';
import ChatEmptyState from '@/Components/PitchWriter/ChatEmptyState';
import ChatTranscript from '@/Components/PitchWriter/ChatTranscript';
import { usePitchWriterChat } from '@/hooks/usePitchWriterChat';
import useResizableSidePanel from '@/hooks/useResizableSidePanel';
import { appendToDraftText, getStoredDraft } from '@/lib/pitchDraft';

export default function PitchWriter() {
    const [draft, setDraft] = useState(() => getStoredDraft());
    const writerLayoutRef = useRef(null);

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
        messages,
        displayMessages,
        errors,
        isBusy,
        showTypingIndicator,
        sendMessage,
        stopGeneration,
        scrollRef,
    } = usePitchWriterChat();

    const showEmptyState = messages.length === 0 && !isBusy;

    const handleAddToDraft = (content) => {
        setDraft((current) => appendToDraftText(current, content));
    };

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
                        <h1>Питч Райтер</h1>
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
                            onAddToDraft={handleAddToDraft}
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
                    onChange={setDraft}
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
