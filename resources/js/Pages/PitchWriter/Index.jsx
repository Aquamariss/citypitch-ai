import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner';
import ChatComposer from '@/Components/PitchWriter/ChatComposer';
import ChatEmptyState from '@/Components/PitchWriter/ChatEmptyState';
import ChatTranscript from '@/Components/PitchWriter/ChatTranscript';
import PitchTipsPanel from '@/Components/PitchWriter/PitchTipsPanel';
import { usePitchWriterChat } from '@/hooks/usePitchWriterChat';

export default function PitchWriter() {
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

    return (
        <AppLayout>
            <Head title="Pitch Writer" />

            <div className="flex flex-col flex-1 min-h-0 h-full">
                <ErrorBanner errors={errors} />

                <PitchTipsPanel variant="mobile" />

                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    <div className="flex flex-col flex-1 min-w-0 min-h-0">
                        {showEmptyState ? (
                            <div className="flex-1 overflow-y-auto transcript-scroll">
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
                    </div>

                    <PitchTipsPanel variant="desktop" />
                </div>
            </div>
        </AppLayout>
    );
}
