import { reactive, ref, toValue, watch, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue';

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function readContainerWidth(containerRef: Ref<HTMLElement | null> | null | undefined): number {
    if (containerRef?.value) {
        return containerRef.value.clientWidth;
    }

    if (typeof window === 'undefined') {
        return 1200;
    }

    return window.innerWidth;
}

function resolveMaxWidth(
    minWidth: number,
    maxWidth: number | null,
    maxRatio: number | null,
    containerRef: Ref<HTMLElement | null> | null | undefined,
): number {
    if (typeof maxRatio === 'number' && maxRatio > 0) {
        return Math.max(minWidth, Math.floor(readContainerWidth(containerRef) * maxRatio));
    }

    return maxWidth ?? Math.max(minWidth, 720);
}

/**
 * Persisted visibility + width for a right-side panel with drag resize.
 * Pass maxRatio (e.g. 0.4) to cap width at a fraction of the container.
 */
export function useResizableSidePanel(options: {
    widthKey: string;
    visibleKey: string;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    maxRatio?: number | null;
    containerRef?: Ref<HTMLElement | null> | null;
    defaultVisible?: boolean;
}) {
    const {
        widthKey,
        visibleKey,
        defaultWidth = 420,
        minWidth = 280,
        maxWidth = 720,
        maxRatio = null,
        containerRef = null,
        defaultVisible = true,
    } = options;

    const visible = ref<boolean>(defaultVisible);
    const width = ref<number>(defaultWidth);
    const isResizing = ref(false);
    const resolvedMaxWidth = ref(resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef));

    if (typeof window !== 'undefined') {
        const rawVisible = window.localStorage.getItem(visibleKey);

        if (rawVisible !== null) {
            visible.value = rawVisible !== '0';
        }

        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);
        const rawWidth = Number(window.localStorage.getItem(widthKey));
        width.value = Number.isFinite(rawWidth)
            ? clamp(rawWidth, minWidth, ceiling)
            : clamp(defaultWidth, minWidth, ceiling);
    }

    const syncToContainer = () => {
        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);

        resolvedMaxWidth.value = ceiling;
        width.value = clamp(width.value, minWidth, ceiling);
    };

    watchEffect((onCleanup) => {
        if (typeof maxRatio !== 'number') {
            resolvedMaxWidth.value = maxWidth ?? 720;

            return;
        }

        syncToContainer();

        const container = containerRef?.value;
        const observer = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => syncToContainer())
            : null;

        if (container && observer) {
            observer.observe(container);
        }

        window.addEventListener('resize', syncToContainer);

        onCleanup(() => {
            observer?.disconnect();
            window.removeEventListener('resize', syncToContainer);
        });
    });

    const setVisible = (next: boolean) => {
        visible.value = next;
        window.localStorage.setItem(visibleKey, next ? '1' : '0');
    };

    const beginResize = (event: PointerEvent) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = width.value;
        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);

        isResizing.value = true;
        resolvedMaxWidth.value = ceiling;

        const onMove = (moveEvent: PointerEvent) => {
            width.value = clamp(startWidth + (startX - moveEvent.clientX), minWidth, ceiling);
        };

        const onUp = () => {
            isResizing.value = false;
            const next = clamp(width.value, minWidth, ceiling);

            width.value = next;
            window.localStorage.setItem(widthKey, String(next));
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return reactive({
        visible,
        setVisible,
        width,
        minWidth,
        maxWidth: resolvedMaxWidth,
        isResizing,
        beginResize,
    });
}
