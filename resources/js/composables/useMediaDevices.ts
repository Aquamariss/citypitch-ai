import { reactive, ref, toValue, watch, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue';
import { stopStream, tryGetUserMedia, type MediaMode } from '@/lib/media/mediaConstraints';
import { mapRecordingError } from '@/lib/media/recordingErrors';

export type DevicesInitState = 'idle' | 'loading' | 'ready' | 'error';

export interface DeviceList {
    audio: MediaDeviceInfo[];
    video: MediaDeviceInfo[];
}

/**
 * Discover devices for a chosen recording mode.
 * Does nothing until `enabled` is true and `mode` is set.
 */
export function useMediaDevices(options: {
    mode?: MaybeRefOrGetter<MediaMode | null>;
    enabled?: MaybeRefOrGetter<boolean>;
} = {}) {
    const { mode = null, enabled = false } = options;

    const initState = ref<DevicesInitState>(toValue(enabled) && toValue(mode) ? 'loading' : 'idle');
    const error = ref<string | null>(null);
    const devices = ref<DeviceList>({ audio: [], video: [] });
    const selectedAudioId = ref<string | null>(null);
    const selectedVideoId = ref<string | null>(null);

    const discover = async () => {
        const currentMode = toValue(mode);
        const isEnabled = toValue(enabled);

        if (!isEnabled || !currentMode) {
            initState.value = 'idle';
            error.value = null;

            return;
        }

        initState.value = 'loading';
        error.value = null;

        if (!navigator.mediaDevices?.enumerateDevices) {
            initState.value = 'error';
            error.value = mapRecordingError('unsupported');

            return;
        }

        try {
            const wantVideo = currentMode === 'video';
            const permissionStream = wantVideo
                ? await tryGetUserMedia({ video: true, audio: true })
                : await tryGetUserMedia({ video: false, audio: true });

            if (!permissionStream) {
                initState.value = 'error';
                error.value = mapRecordingError('NotAllowedError');

                return;
            }

            stopStream(permissionStream);

            const enumerated = await navigator.mediaDevices.enumerateDevices();
            const audio = enumerated.filter((device) => device.kind === 'audioinput');
            const video = enumerated.filter((device) => device.kind === 'videoinput');

            if (audio.length === 0) {
                initState.value = 'error';
                error.value = mapRecordingError('NotFoundError');

                return;
            }

            const defaultAudioId = audio[0]?.deviceId ?? null;
            const defaultVideoId = video[0]?.deviceId ?? null;

            devices.value = { audio, video };
            selectedAudioId.value = defaultAudioId;
            selectedVideoId.value = defaultVideoId;

            if (wantVideo && !defaultVideoId) {
                initState.value = 'error';
                error.value = 'Камера не найдена. Выберите аудио-режим или подключите камеру.';

                return;
            }

            initState.value = 'ready';
        } catch (err) {
            initState.value = 'error';
            error.value = mapRecordingError(err);
        }
    };

    watch([() => toValue(mode), () => toValue(enabled)], () => { discover(); }, { immediate: true });

    return reactive({
        initState,
        error,
        devices,
        selectedAudioId,
        selectedVideoId,
        setSelectedAudioId: (id: string | null) => { selectedAudioId.value = id; },
        setSelectedVideoId: (id: string | null) => { selectedVideoId.value = id; },
        rediscover: discover,
    });
}
