import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { getCsrfToken, readSseStream } from '@/lib/sse';

function resolveErrorMessage(payload) {
    const raw = payload?.message ?? payload?.raw ?? '';

    if (String(raw).includes('Превышен') || String(raw).includes('лимит')) {
        return 'Превышен лимит сообщений. Попробуйте позже.';
    }

    if (String(raw).includes('генерация')) {
        return String(raw);
    }

    return 'Не удалось получить ответ. Попробуйте позже.';
}

export function usePitchWriterChat({
    initialMessages = [],
    onDraftUpdated,
    onLimitsUpdated,
} = {}) {
    const [messages, setMessages] = useState(() => initialMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        draft_patch: message.draft_patch ?? null,
    })));
    const [errors, setErrors] = useState([]);
    const [streamingText, setStreamingText] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const messagesRef = useRef(messages);
    const abortRef = useRef(null);
    const scrollRef = useRef(null);
    const streamBufferRef = useRef('');

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const showTypingIndicator = isBusy && !streamingText;

    const displayMessages = useMemo(() => {
        if (isBusy && streamingText) {
            return [
                ...messages,
                { id: 'streaming', role: 'assistant', content: streamingText, streaming: true },
            ];
        }

        return messages;
    }, [messages, isBusy, streamingText]);

    useEffect(() => {
        const element = scrollRef.current;

        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [displayMessages, showTypingIndicator, streamingText]);

    const stopGeneration = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);

    const sendMessage = useCallback(async (content) => {
        const trimmed = content.trim();

        if (!trimmed || isBusy) {
            return;
        }

        setErrors([]);
        setStreamingText('');
        streamBufferRef.current = '';

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };

        setMessages((previous) => [...previous, userMessage]);
        setIsBusy(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const response = await fetch(route('pitch-writer.chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ content: trimmed }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const message = response.status === 429
                    ? 'Превышен лимит сообщений. Попробуйте позже.'
                    : 'Не удалось получить ответ. Попробуйте позже.';
                setErrors([message]);
                return;
            }

            if (!response.body) {
                setErrors(['Не удалось получить ответ. Попробуйте позже.']);
                return;
            }

            await readSseStream(response.body, {
                signal: controller.signal,
                onEvent: (event, data) => {
                    if (event === 'message.delta' && data?.text) {
                        streamBufferRef.current += data.text;
                        setStreamingText(streamBufferRef.current);
                        return;
                    }

                    if (event === 'draft.updated') {
                        onDraftUpdated?.(data);
                        return;
                    }

                    if (event === 'message.done') {
                        const finalContent = data?.message?.content
                            ?? streamBufferRef.current.trim();

                        if (finalContent) {
                            setMessages((previous) => [
                                ...previous,
                                {
                                    id: data?.message?.id ?? `assistant-${Date.now()}`,
                                    role: 'assistant',
                                    content: finalContent,
                                    draft_patch: data?.message?.draft_patch ?? null,
                                },
                            ]);
                        }

                        setStreamingText('');
                        streamBufferRef.current = '';

                        if (data?.limits) {
                            onLimitsUpdated?.(data.limits);
                        }

                        return;
                    }

                    if (event === 'error') {
                        setErrors([resolveErrorMessage(data)]);
                    }
                },
            });

            // Aborted mid-stream: commit partial assistant text if any.
            if (controller.signal.aborted && streamBufferRef.current.trim()) {
                setMessages((previous) => [
                    ...previous,
                    {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: streamBufferRef.current.trim(),
                    },
                ]);
                setStreamingText('');
                streamBufferRef.current = '';
            }
        } catch (error) {
            if (error?.name !== 'AbortError') {
                setErrors([resolveErrorMessage({ message: error?.message })]);
            } else if (streamBufferRef.current.trim()) {
                setMessages((previous) => [
                    ...previous,
                    {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: streamBufferRef.current.trim(),
                    },
                ]);
                setStreamingText('');
                streamBufferRef.current = '';
            }
        } finally {
            setIsBusy(false);
            abortRef.current = null;
        }
    }, [isBusy, onDraftUpdated, onLimitsUpdated]);

    const replaceMessages = useCallback((nextMessages) => {
        setMessages(nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            draft_patch: message.draft_patch ?? null,
        })));
    }, []);

    return {
        messages,
        displayMessages,
        errors,
        isBusy,
        showTypingIndicator,
        sendMessage,
        stopGeneration,
        replaceMessages,
        scrollRef,
    };
}
