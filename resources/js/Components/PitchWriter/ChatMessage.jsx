import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message, isStreaming = false }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                }}
            >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
                className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}
                style={{
                    backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                }}
            >
                {isUser ? (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className={`markdown-body prose prose-sm max-w-none ${isStreaming ? 'streaming-cursor' : ''}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || ''}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
