export function getCsrfToken() {
    const meta = document.head.querySelector('meta[name="csrf-token"]');

    if (meta?.content) {
        return meta.content;
    }

    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    if (!match?.[1]) {
        return '';
    }

    return decodeURIComponent(match[1]);
}

/**
 * Parse SSE chunks from a streaming fetch body.
 * @param {ReadableStream<Uint8Array>} body
 * @param {{ onEvent: (event: string, data: object) => void, signal?: AbortSignal }} options
 */
export async function readSseStream(body, { onEvent, signal }) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventName = 'message';
    let dataLines = [];

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
