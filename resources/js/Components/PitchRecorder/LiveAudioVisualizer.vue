<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
    mediaRecorder?: { stream?: MediaStream } | null;
    isRecording?: boolean;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let cleanupFn: (() => void) | null = null;

const teardown = () => {
    cleanupFn?.();
    cleanupFn = null;
};

watch(
    [() => props.isRecording, () => props.mediaRecorder?.stream],
    async () => {
        teardown();

        if (!props.isRecording || !props.mediaRecorder?.stream) {
            return;
        }

        await nextTick();

        const canvas = canvasRef.value;

        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(props.mediaRecorder.stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--record-active')
            .trim() || '#ef4444';

        let raf = 0;

        const draw = () => {
            raf = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            context.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = Math.max(2, canvas.width / 48);
            const gap = 2;
            const usableBars = Math.floor(canvas.width / (barWidth + gap));

            for (let index = 0; index < usableBars; index += 1) {
                const sampleIndex = Math.floor((index / usableBars) * bufferLength);
                const value = dataArray[sampleIndex] ?? 0;
                const barHeight = Math.max(4, (value / 255) * canvas.height);
                const x = index * (barWidth + gap);
                const y = canvas.height - barHeight;

                context.fillStyle = barColor;
                context.beginPath();
                context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
                context.fill();
            }
        };

        draw();

        cleanupFn = () => {
            cancelAnimationFrame(raf);
            source.disconnect();
            analyser.disconnect();

            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    },
    { immediate: true },
);

onBeforeUnmount(teardown);
</script>

<template>
    <div v-if="!isRecording || !mediaRecorder" class="flex items-end gap-1 h-14 w-full max-w-xs">
        <div
            v-for="n in 12"
            :key="n"
            class="flex-1 rounded-full"
            :style="{
                minHeight: '4px',
                backgroundColor: 'var(--accent-primary)',
                opacity: 0.5,
                height: `${20 + ((n - 1) % 5) * 12}%`,
            }"
        />
    </div>

    <div v-else class="w-full max-w-xs h-14 flex items-center justify-center">
        <canvas ref="canvasRef" width="280" height="56" class="w-full max-w-xs" :style="{ height: '56px' }" />
    </div>
</template>
