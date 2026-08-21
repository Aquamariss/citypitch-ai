import { computed, reactive, ref } from 'vue';
import { route } from 'ziggy-js';
import { getCsrfToken, readSseStream } from '@/lib/sse';

export interface ChatMessage {
    id: string;
    role: string;
    content: string;
    draft_patch?: any;
    streaming?: boolean;
}

function resolveErrorMessage(payload: any): string {
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
}: {
    initialMessages?: any[];
    onDraftUpdated?: (data: any) => void;
    onLimitsUpdated?: (limits: any) => void;
} = {}) {
    const messages = ref<ChatMessage[]>(initialMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        draft_patch: message.draft_patch ?? null,
    })));
    const errors = ref<string[]>([]);
    const streamingText = ref('');
    const isBusy = ref(false);
    const abortController = ref<AbortController | null>(null);
    const streamBuffer = ref('');

    const showTypingIndicator = computed(() => isBusy.value && !streamingText.value);

    const displayMessages = computed<ChatMessage[]>(() => {
        if (isBusy.value && streamingText.value) {
            return [
                ...messages.value,
                { id: 'streaming', role: 'assistant', content: streamingText.value, streaming: true },
            ];
        }

        return messages.value;
    });

    const stopGeneration = () => {
        abortController.value?.abort();
        abortController.value = null;
    };

    const sendMessage = async (content: string) => {
        const trimmed = content.trim();

        if (!trimmed || isBusy.value) {
            return;
        }

        errors.value = [];
        streamingText.value = '';
        streamBuffer.value = '';

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
        };

        messages.value = [...messages.value, userMessage];
        isBusy.value = true;

        const controller = new AbortController();
        abortController.value = controller;

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
                errors.value = [message];

                return;
            }

            if (!response.body) {
                errors.value = ['Не удалось получить ответ. Попробуйте позже.'];

                return;
            }

            await readSseStream(response.body, {
                signal: controller.signal,
                onEvent: (event, data) => {
                    if (event === 'message.delta' && data?.text) {
                        streamBuffer.value += data.text;
                        streamingText.value = streamBuffer.value;

                        return;
                    }

                    if (event === 'draft.updated') {
                        onDraftUpdated?.(data);

                        return;
                    }

                    if (event === 'message.done') {
                        const finalContent = data?.message?.content
                            ?? streamBuffer.value.trim();

                        if (finalContent) {
                            messages.value = [
                                ...messages.value,
                                {
                                    id: data?.message?.id ?? `assistant-${Date.now()}`,
                                    role: 'assistant',
                                    content: finalContent,
                                    draft_patch: data?.message?.draft_patch ?? null,
                                },
                            ];
                        }

                        streamingText.value = '';
                        streamBuffer.value = '';

                        if (data?.limits) {
                            onLimitsUpdated?.(data.limits);
                        }

                        return;
                    }

                    if (event === 'error') {
                        errors.value = [resolveErrorMessage(data)];
                    }
                },
            });

            // Aborted mid-stream: commit partial assistant text if any.
            if (controller.signal.aborted && streamBuffer.value.trim()) {
                messages.value = [
                    ...messages.value,
                    {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: streamBuffer.value.trim(),
                    },
                ];
                streamingText.value = '';
                streamBuffer.value = '';
            }
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                errors.value = [resolveErrorMessage({ message: error?.message })];
            } else if (streamBuffer.value.trim()) {
                messages.value = [
                    ...messages.value,
                    {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: streamBuffer.value.trim(),
                    },
                ];
                streamingText.value = '';
                streamBuffer.value = '';
            }
        } finally {
            isBusy.value = false;
            abortController.value = null;
        }
    };

    const replaceMessages = (nextMessages: any[]) => {
        messages.value = nextMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            draft_patch: message.draft_patch ?? null,
        }));
    };

    return reactive({
        messages,
        displayMessages,
        errors,
        isBusy,
        showTypingIndicator,
        sendMessage,
        stopGeneration,
        replaceMessages,
    });
}
