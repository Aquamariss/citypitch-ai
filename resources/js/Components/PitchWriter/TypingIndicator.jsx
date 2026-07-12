export default function TypingIndicator() {
    return (
        <div className="chat-msg chat-msg--ai chat-msg--typing" aria-live="polite" aria-label="AI печатает">
            <div className="chat-avatar" aria-hidden="true">
                AI
            </div>
            <div className="chat-bubble">
                <span className="typing-dots">
                    <span />
                    <span />
                    <span />
                </span>
            </div>
        </div>
    );
}
