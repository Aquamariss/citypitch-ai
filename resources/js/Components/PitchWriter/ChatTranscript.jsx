import ChatMessage from '@/Components/PitchWriter/ChatMessage';
import TypingIndicator from '@/Components/PitchWriter/TypingIndicator';

export default function ChatTranscript({ messages, showTypingIndicator, scrollRef, onAddToDraft }) {
    return (
        <div ref={scrollRef} className="chat-list">
            {messages.map((message) => (
                <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={Boolean(message.streaming)}
                    onAddToDraft={onAddToDraft}
                />
            ))}

            {showTypingIndicator && <TypingIndicator />}
        </div>
    );
}
