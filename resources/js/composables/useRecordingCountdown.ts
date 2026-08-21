import { computed, onBeforeUnmount, reactive, ref } from 'vue';

/**
 * 3-2-1 countdown before starting a recording.
 */
export function useRecordingCountdown({ onComplete, seconds = 3 }: { onComplete?: () => void; seconds?: number }) {
    const count = ref<number | null>(null);
    let timer: ReturnType<typeof setInterval> | null = null;

    const clear = () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        count.value = null;
    };

    const start = () => {
        clear();
        count.value = seconds;

        let remaining = seconds;

        timer = setInterval(() => {
            remaining -= 1;

            if (remaining <= 0) {
                clear();
                onComplete?.();

                return;
            }

            count.value = remaining;
        }, 1000);
    };

    onBeforeUnmount(() => clear());

    return reactive({
        count,
        isCountingDown: computed(() => count.value !== null),
        start,
        cancel: clear,
    });
}
