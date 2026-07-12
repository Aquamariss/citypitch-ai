import { useEffect } from 'react';

function isEditableTarget(target) {
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
export default function useRecordingHotkeys({
    enabled = true,
    isRecording = false,
    isCountingDown = false,
    canStart = false,
    onStart,
    onStop,
}) {
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const handleKeyDown = (event) => {
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

            if (isCountingDown) {
                return;
            }

            if (isRecording) {
                onStop?.();

                return;
            }

            if (canStart) {
                onStart?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canStart, enabled, isCountingDown, isRecording, onStart, onStop]);
}
