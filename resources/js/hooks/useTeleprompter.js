import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FONT_SIZES,
    getStoredScript,
    getStoredTeleprompterSettings,
    saveScript,
    saveTeleprompterSettings,
} from '@/lib/pitchScript';

export default function useTeleprompter({ isRecording, targetTimeMins, enabled = true }) {
    const scrollRef = useRef(null);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(null);
    const scrollPositionRef = useRef(0);

    const [script, setScript] = useState(() => getStoredScript());
    const [settings, setSettings] = useState(() => getStoredTeleprompterSettings());

    const updateScript = useCallback((text) => {
        setScript(text);
        saveScript(text);
    }, []);

    const updateSettings = useCallback((partial) => {
        setSettings((prev) => {
            const next = { ...prev, ...partial };
            saveTeleprompterSettings(next);

            return next;
        });
    }, []);

    const resetScroll = useCallback(() => {
        scrollPositionRef.current = 0;
        lastTimeRef.current = null;

        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, []);

    const getScrollSpeed = useCallback(() => {
        const container = scrollRef.current;

        if (!container) {
            return 0;
        }

        if (settings.scrollMode === 'manual') {
            return settings.manualSpeed;
        }

        const scrollableHeight = container.scrollHeight - container.clientHeight;
        const durationSeconds = targetTimeMins * 60;

        if (scrollableHeight <= 0 || durationSeconds <= 0) {
            return 0;
        }

        return scrollableHeight / durationSeconds;
    }, [settings.manualSpeed, settings.scrollMode, targetTimeMins]);

    useEffect(() => {
        if (!isRecording) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            lastTimeRef.current = null;

            return undefined;
        }

        resetScroll();

        const tick = (timestamp) => {
            const container = scrollRef.current;

            if (!container) {
                rafRef.current = requestAnimationFrame(tick);

                return;
            }

            if (lastTimeRef.current !== null) {
                const delta = (timestamp - lastTimeRef.current) / 1000;
                const speed = getScrollSpeed();
                scrollPositionRef.current += speed * delta;

                const maxScroll = container.scrollHeight - container.clientHeight;
                container.scrollTop = Math.min(scrollPositionRef.current, maxScroll);
            }

            lastTimeRef.current = timestamp;
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            lastTimeRef.current = null;
        };
    }, [getScrollSpeed, isRecording, resetScroll]);

    const fontSizePx = FONT_SIZES[settings.fontSize] ?? FONT_SIZES.M;

    return {
        scrollRef,
        script,
        updateScript,
        settings,
        updateSettings,
        fontSizePx,
        resetScroll,
        enabled,
    };
}
