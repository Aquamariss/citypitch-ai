import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message, isStreaming = false, onAddToDraft }) {
    const isUser = message.role === 'user';
    const canAddToDraft = !isUser && !isStreaming && Boolean(message.content?.trim()) && onAddToDraft;

    return (
        <div className={`chat-msg chat-msg--${isUser ? 'user' : 'ai'}`}>
            {!isUser && (
                <div className="chat-avatar" aria-hidden="true">
                    AI
                </div>
            )}

            <div className="flex flex-col gap-2 min-w-0">
                <div className="chat-bubble">
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <div className={`markdown-body prose prose-sm max-w-none ${isStreaming ? 'streaming-cursor' : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content || ''}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {canAddToDraft && (
                    <button
                        type="button"
                        onClick={() => onAddToDraft(message.content)}
                        className="btn btn-ghost btn-sm self-start"
                    >
                        В черновик
                    </button>
                )}
            </div>
        </div>
    );
}
