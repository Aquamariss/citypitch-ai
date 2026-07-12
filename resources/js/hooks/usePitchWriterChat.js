import { useEffect, useMemo, useRef, useState } from 'react';
import { useStream } from '@laravel/stream-react';
import { route } from 'ziggy-js';

function resolveStreamErrorMessage(error) {
    const raw = error?.message ?? '';

    if (raw.includes('Превышен дневной лимит') || raw.includes('Too Many Attempts')) {
        return 'Превышен лимит сообщений. Попробуйте позже.';
    }

    try {
        const parsed = JSON.parse(raw);

        if (parsed?.message) {
            if (String(parsed.message).includes('Превышен')) {
                return 'Превышен лимит сообщений. Попробуйте позже.';
            }

            return parsed.message;
        }
    } catch {
        // Not JSON — fall through.
    }

    return 'Не удалось получить ответ. Попробуйте позже.';
}

export function usePitchWriterChat() {
    const [messages, setMessages] = useState([]);
    const [errors, setErrors] = useState([]);
    const streamContentRef = useRef('');
    const messagesRef = useRef(messages);
    const failedRef = useRef(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const commitAssistantMessage = (content) => {
        const trimmed = content.trim();

        if (!trimmed) {
            return;
        }

        setMessages((previous) => [
            ...previous,
            { id: `assistant-${Date.now()}`, role: 'assistant', content: trimmed },
        ]);
    };

    const { data, isFetching, isStreaming, send, cancel } = useStream(route('pitch-writer.chat'), {
        onResponse: (response) => {
            if (response.ok) {
                failedRef.current = false;
                return;
            }

            failedRef.current = true;

            const message = response.status === 429
                ? 'Превышен лимит сообщений. Попробуйте позже.'
                : 'Не удалось получить ответ. Попробуйте позже.';

            setErrors([message]);
        },
        onError: (error) => {
            failedRef.current = true;
            setErrors([resolveStreamErrorMessage(error)]);
        },
        onFinish: () => {
            if (!failedRef.current) {
                commitAssistantMessage(streamContentRef.current);
            }
        },
        onCancel: () => {
            if (!failedRef.current) {
                commitAssistantMessage(streamContentRef.current);
            }
        },
    });

    useEffect(() => {
        streamContentRef.current = data;
    }, [data]);

    const isBusy = isFetching || isStreaming;
    const showTypingIndicator = isFetching && !data;

    const displayMessages = useMemo(() => {
        if (isBusy && data) {
            return [
                ...messages,
                { id: 'streaming', role: 'assistant', content: data, streaming: true },
            ];
        }

        return messages;
    }, [messages, isBusy, data]);

    useEffect(() => {
        const element = scrollRef.current;

        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [displayMessages, showTypingIndicator, data]);

    const sendMessage = (content) => {
        const trimmed = content.trim();

        if (!trimmed || isBusy) {
            return;
        }

        setErrors([]);
        failedRef.current = false;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };

        const nextMessages = [...messagesRef.current, userMessage];
        setMessages(nextMessages);

        send({
            messages: nextMessages.map(({ role, content: messageContent }) => ({
                role,
                content: messageContent,
            })),
        });
    };

    const stopGeneration = () => {
        cancel();
    };

    return {
        messages,
        displayMessages,
        errors,
        isBusy,
        showTypingIndicator,
        sendMessage,
        stopGeneration,
        scrollRef,
    };
}
