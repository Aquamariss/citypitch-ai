<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch, watchEffect } from 'vue';

const BAR_MS = 50;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_STEP = BAR_WIDTH + BAR_GAP;

const props = withDefaults(defineProps<{
    stream?: MediaStream | null;
    isRecording?: boolean;
    peaks?: number[] | null;
    progress?: number;
    height?: number;
    className?: string;
    fit?: 'auto' | 'span' | 'window';
}>(), {
    stream: null,
    isRecording: false,
    peaks: null,
    progress: 0,
    height: 220,
    className: '',
    fit: 'auto',
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const peaksRef = ref<number[] | null>(props.peaks);
const progressRef = ref<number>(props.progress);
const historyRef = ref<number[]>([]);
let staticCleanup: (() => void) | null = null;
let liveCleanup: (() => void) | null = null;

const readRecordColor = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--record').trim() || '#ff3b30';
const readMutedColor = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8e8e93';

const computeRms = (timeDomain: Uint8Array): number => {
    let sum = 0;

    for (let i = 0; i < timeDomain.length; i += 1) {
        const sample = (timeDomain[i] - 128) / 128;
        sum += sample * sample;
    }

    return Math.sqrt(sum / timeDomain.length);
};

const drawMirroredBars = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    bars: number[],
    playheadX: number | null,
    fit: 'span' | 'window',
) => {
    const midY = height / 2;
    const maxBar = midY - 8;
    const color = readRecordColor();
    const muted = readMutedColor();

    context.clearRect(0, 0, width, height);
    context.strokeStyle = muted;
    context.globalAlpha = 0.35;
    context.setLineDash([2, 4]);
    context.beginPath();
    context.moveTo(0, midY);
    context.lineTo(width, midY);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;

    const usable = Math.max(1, Math.floor(width / BAR_STEP));

    for (let i = 0; i < usable; i += 1) {
        let value = 0.035;

        if (fit === 'span' && bars.length > 0) {
            const peakIndex = bars.length === 1
                ? 0
                : Math.min(bars.length - 1, Math.round((i / Math.max(usable - 1, 1)) * (bars.length - 1)));
            value = bars[peakIndex] ?? 0.035;
        } else {
            const start = Math.max(0, bars.length - usable);
            value = bars[start + i] ?? 0.035;
        }

        const barHeight = Math.max(2, value * maxBar);
        const x = i * BAR_STEP;

        context.fillStyle = color;
        context.beginPath();
        context.roundRect(x, midY - barHeight, BAR_WIDTH, barHeight * 2, BAR_WIDTH / 2);
        context.fill();
    }

    if (playheadX === null) {
        return;
    }

    const x = Math.min(width - 1, Math.max(0, playheadX));
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, 4);
    context.lineTo(x, height - 4);
    context.stroke();

    context.fillStyle = color;
    context.beginPath();
    context.arc(x, 4, 3.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(x, height - 4, 3.5, 0, Math.PI * 2);
    context.fill();
};

watchEffect(() => {
    peaksRef.value = props.peaks;
    progressRef.value = props.progress;
});

// Static peaks / idle draw — progress updates redraw without tearing down audio graph.
watch(
    [() => props.isRecording, () => props.peaks, () => props.progress],
    async ([isRecording]) => {
        staticCleanup?.();
        staticCleanup = null;

        if (isRecording) {
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

        const dpr = window.devicePixelRatio || 1;
        const hasPeaks = Array.isArray(peaksRef.value) && peaksRef.value.length > 0;
        const scrubFit = props.fit === 'span'
            || (props.fit === 'auto' && hasPeaks && !props.isRecording);

        const draw = () => {
            const rect = canvas.getBoundingClientRect();
            const width = Math.max(1, rect.width);

            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(props.height * dpr));
            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            const bars = hasPeaks
                ? peaksRef.value!
                : Array.from({ length: 64 }, (_, i) => 0.04 + (i % 7 === 0 ? 0.06 : 0));

            const playhead = hasPeaks
                ? Math.min(1, Math.max(0, progressRef.value)) * width
                : null;

            drawMirroredBars(context, width, props.height, bars, playhead, scrubFit || hasPeaks ? 'span' : 'window');
        };

        draw();
        window.addEventListener('resize', draw);
        staticCleanup = () => window.removeEventListener('resize', draw);
    },
    { immediate: true },
);

// Live recording analyser.
watch(
    [() => props.isRecording, () => props.stream],
    async ([isRecording, stream]) => {
        liveCleanup?.();
        liveCleanup = null;

        if (!isRecording || !stream) {
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

        if (stream.getAudioTracks().length === 0) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.15;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const timeDomain = new Uint8Array(analyser.fftSize);
        historyRef.value = [];
        let lastBarAt = 0;
        let peakHold = 0;
        let raf = 0;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(props.height * dpr));
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            analyser.getByteTimeDomainData(timeDomain);

            const rms = computeRms(timeDomain);
            const shaped = Math.min(1, Math.pow(rms * 2.8, 0.85));
            peakHold = Math.max(shaped, peakHold * 0.82);

            if (now - lastBarAt >= BAR_MS) {
                lastBarAt = now;
                historyRef.value.push(Math.max(0.035, peakHold));
                peakHold = 0;

                const width = canvas.clientWidth;
                const maxBars = Math.floor(width / BAR_STEP) + 4;

                if (historyRef.value.length > maxBars) {
                    historyRef.value = historyRef.value.slice(-maxBars);
                }
            }

            const width = canvas.clientWidth;
            const playheadX = Math.min(width - 8, Math.max(8, historyRef.value.length * BAR_STEP));
            drawMirroredBars(context, width, props.height, historyRef.value, playheadX, 'window');
        };

        raf = requestAnimationFrame(tick);

        liveCleanup = () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(raf);

            try {
                source.disconnect();
                analyser.disconnect();
            } catch {
                // already disconnected
            }

            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    staticCleanup?.();
    liveCleanup?.();
});
</script>

<template>
    <canvas
        ref="canvasRef"
        :class="['vm-waveform', className].filter(Boolean).join(' ')"
        :style="{ width: '100%', height: `${height}px` }"
        aria-hidden="true"
    />
</template>
