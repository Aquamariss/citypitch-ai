import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue';

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName;

    return tag === 'INPUT'
        || tag === 'TEXTAREA'
        || tag === 'SELECT'
        || target.isContentEditable;
}

/**
 * Space toggles recording when focus is not in an editable field.
 */
export function useRecordingHotkeys(options: {
    enabled?: MaybeRefOrGetter<boolean>;
    isRecording?: MaybeRefOrGetter<boolean>;
    isCountingDown?: MaybeRefOrGetter<boolean>;
    canStart?: MaybeRefOrGetter<boolean>;
    onStart?: () => void;
    onStop?: () => void;
}) {
    const { onStart, onStop } = options;

    watchEffect((onCleanup) => {
        if (!toValue(options.enabled ?? true)) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code !== 'Space' && event.key !== ' ') {
                return;
            }

            if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            if (isEditableTarget(event.target)) {
                return;
            }

            event.preventDefault();

            if (toValue(options.isCountingDown ?? false)) {
                return;
            }

            if (toValue(options.isRecording ?? false)) {
                onStop?.();

                return;
            }

            if (toValue(options.canStart ?? false)) {
                onStart?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
    });
}
