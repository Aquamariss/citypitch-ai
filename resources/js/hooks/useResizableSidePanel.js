import { useCallback, useEffect, useState } from 'react';

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function readContainerWidth(containerRef) {
    if (containerRef?.current) {
        return containerRef.current.clientWidth;
    }

    if (typeof window === 'undefined') {
        return 1200;
    }

    return window.innerWidth;
}

function resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef) {
    if (typeof maxRatio === 'number' && maxRatio > 0) {
        return Math.max(minWidth, Math.floor(readContainerWidth(containerRef) * maxRatio));
    }

    return maxWidth ?? Math.max(minWidth, 720);
}

/**
 * Persisted visibility + width for a right-side panel with drag resize.
 * Pass maxRatio (e.g. 0.4) to cap width at a fraction of the container.
 */
export default function useResizableSidePanel({
    widthKey,
    visibleKey,
    defaultWidth = 420,
    minWidth = 280,
    maxWidth = 720,
    maxRatio = null,
    containerRef = null,
    defaultVisible = true,
} = {}) {
    const [visible, setVisibleState] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultVisible;
        }

        const raw = window.localStorage.getItem(visibleKey);

        if (raw === null) {
            return defaultVisible;
        }

        return raw !== '0';
    });

    const [width, setWidth] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultWidth;
        }

        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);
        const raw = Number(window.localStorage.getItem(widthKey));

        if (!Number.isFinite(raw)) {
            return clamp(defaultWidth, minWidth, ceiling);
        }

        return clamp(raw, minWidth, ceiling);
    });

    const [isResizing, setIsResizing] = useState(false);
    const [resolvedMaxWidth, setResolvedMaxWidth] = useState(() => (
        resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef)
    ));

    const syncToContainer = useCallback(() => {
        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);
        setResolvedMaxWidth(ceiling);
        setWidth((current) => clamp(current, minWidth, ceiling));
    }, [containerRef, maxRatio, maxWidth, minWidth]);

    useEffect(() => {
        if (typeof maxRatio !== 'number') {
            setResolvedMaxWidth(maxWidth ?? 720);

            return undefined;
        }

        syncToContainer();

        const container = containerRef?.current;
        const observer = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => syncToContainer())
            : null;

        if (container && observer) {
            observer.observe(container);
        }

        window.addEventListener('resize', syncToContainer);

        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', syncToContainer);
        };
    }, [containerRef, maxRatio, maxWidth, syncToContainer]);

    const setVisible = useCallback((next) => {
        setVisibleState(next);
        window.localStorage.setItem(visibleKey, next ? '1' : '0');
    }, [visibleKey]);

    const beginResize = useCallback((event) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = width;
        const ceiling = resolveMaxWidth(minWidth, maxWidth, maxRatio, containerRef);

        setIsResizing(true);
        setResolvedMaxWidth(ceiling);

        const onMove = (moveEvent) => {
            setWidth(clamp(startWidth + (startX - moveEvent.clientX), minWidth, ceiling));
        };

        const onUp = () => {
            setIsResizing(false);
            setWidth((current) => {
                const next = clamp(current, minWidth, ceiling);
                window.localStorage.setItem(widthKey, String(next));

                return next;
            });
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [containerRef, maxRatio, maxWidth, minWidth, width, widthKey]);

    return {
        visible,
        setVisible,
        width,
        minWidth,
        maxWidth: resolvedMaxWidth,
        isResizing,
        beginResize,
    };
}
