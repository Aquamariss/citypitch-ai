import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 3-2-1 countdown before starting a recording.
 */
export default function useRecordingCountdown({ onComplete, seconds = 3 }) {
    const [count, setCount] = useState(null);
    const timerRef = useRef(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setCount(null);
    }, []);

    const start = useCallback(() => {
        clear();
        setCount(seconds);

        let remaining = seconds;

        timerRef.current = setInterval(() => {
            remaining -= 1;

            if (remaining <= 0) {
                clear();
                onCompleteRef.current?.();

                return;
            }

            setCount(remaining);
        }, 1000);
    }, [clear, seconds]);

    useEffect(() => () => clear(), [clear]);

    return {
        count,
        isCountingDown: count !== null,
        start,
        cancel: clear,
    };
}
