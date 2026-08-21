export function getCsrfToken(): string {
    const meta = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

    if (meta?.content) {
        return meta.content;
    }

    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    if (!match?.[1]) {
        return '';
    }

    return decodeURIComponent(match[1]);
}

export interface SseStreamOptions {
    onEvent: (event: string, data: any) => void;
    signal?: AbortSignal;
}

/**
 * Parse SSE chunks from a streaming fetch body.
 */
export async function readSseStream(body: ReadableStream<Uint8Array>, { onEvent, signal }: SseStreamOptions): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventName = 'message';
    let dataLines: string[] = [];

    const flush = () => {
        if (dataLines.length === 0) {
            eventName = 'message';

            return;
        }

        const raw = dataLines.join('\n');
        dataLines = [];
        const currentEvent = eventName;
        eventName = 'message';

        try {
            onEvent(currentEvent, JSON.parse(raw));
        } catch {
            onEvent(currentEvent, { raw });
        }
    };

    while (true) {
        if (signal?.aborted) {
            await reader.cancel();
            break;
        }

        const { done, value } = await reader.read();

        if (done) {
            flush();
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n/);
        buffer = parts.pop() ?? '';

        for (const line of parts) {
            if (line === '') {
                flush();
                continue;
            }

            if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
                continue;
            }

            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trimStart());
            }
        }
    }
}
