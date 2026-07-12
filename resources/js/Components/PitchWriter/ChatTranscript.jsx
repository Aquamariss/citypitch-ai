import ChatMessage from '@/Components/PitchWriter/ChatMessage';
import TypingIndicator from '@/Components/PitchWriter/TypingIndicator';

export default function ChatTranscript({ messages, showTypingIndicator, scrollRef }) {
    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto transcript-scroll">
            <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
                {messages.map((message) => (
                    <ChatMessage
                        key={message.id}
                        message={message}
                        isStreaming={Boolean(message.streaming)}
                    />
                ))}

                {showTypingIndicator && <TypingIndicator />}
            </div>
        </div>
    );
}
