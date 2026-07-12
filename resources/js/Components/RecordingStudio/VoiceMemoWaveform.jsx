import { useEffect, useRef } from 'react';

const BAR_MS = 50;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const BAR_STEP = BAR_WIDTH + BAR_GAP;

function readRecordColor() {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--record')
        .trim() || '#ff3b30';
}

function readMutedColor() {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--muted')
        .trim() || '#8e8e93';
}

function computeRms(timeDomain) {
    let sum = 0;

    for (let i = 0; i < timeDomain.length; i += 1) {
        const sample = (timeDomain[i] - 128) / 128;
        sum += sample * sample;
    }

    return Math.sqrt(sum / timeDomain.length);
}

/**
 * macOS Voice Memos–style mirrored waveform.
 * Live mode samples RMS envelope on a fixed interval so bars track speech rhythm.
 * Scrub mode spans the full peak array across the width so playhead matches time.
 */
export default function VoiceMemoWaveform({
    stream = null,
    isRecording = false,
    peaks = null,
    progress = 0,
    height = 220,
    className = '',
    fit = 'auto',
}) {
    const canvasRef = useRef(null);
    const peaksRef = useRef(peaks);
    const progressRef = useRef(progress);
    const historyRef = useRef([]);
    const animationRef = useRef(null);

    peaksRef.current = peaks;
    progressRef.current = progress;

    const scrubFit = fit === 'span'
        || (fit === 'auto' && Array.isArray(peaks) && peaks.length > 0 && !isRecording);

    // Draw static peaks / idle — progress updates redraw without tearing down audio graph
    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas || isRecording) {
            return undefined;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return undefined;
        }

        const dpr = window.devicePixelRatio || 1;

        const draw = () => {
            const rect = canvas.getBoundingClientRect();
            const width = Math.max(1, rect.width);

            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            const hasPeaks = Array.isArray(peaksRef.current) && peaksRef.current.length > 0;
            const bars = hasPeaks
                ? peaksRef.current
                : Array.from({ length: 64 }, (_, i) => 0.04 + (i % 7 === 0 ? 0.06 : 0));

            const playhead = hasPeaks
                ? Math.min(1, Math.max(0, progressRef.current)) * width
                : null;

            drawMirroredBars(context, width, height, bars, playhead, scrubFit || hasPeaks ? 'span' : 'window');
        };

        draw();
        window.addEventListener('resize', draw);

        return () => window.removeEventListener('resize', draw);
    }, [height, isRecording, peaks, progress, scrubFit]);

    // Live recording analyser
    useEffect(() => {
        const canvas = canvasRef.current;
        const liveStream = stream;

        if (!canvas || !isRecording || !liveStream) {
            return undefined;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return undefined;
        }

        const audioTracks = liveStream.getAudioTracks();

        if (audioTracks.length === 0) {
            return undefined;
        }

        const dpr = window.devicePixelRatio || 1;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.15;

        const source = audioContext.createMediaStreamSource(liveStream);
        source.connect(analyser);

        const timeDomain = new Uint8Array(analyser.fftSize);
        historyRef.current = [];
        let lastBarAt = 0;
        let peakHold = 0;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        window.addEventListener('resize', resize);

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const tick = (now) => {
            animationRef.current = requestAnimationFrame(tick);
            analyser.getByteTimeDomainData(timeDomain);

            const rms = computeRms(timeDomain);
            // Speech-friendly curve: lift quiet voice, soft-clip loud peaks
            const shaped = Math.min(1, Math.pow(rms * 2.8, 0.85));
            peakHold = Math.max(shaped, peakHold * 0.82);

            if (now - lastBarAt >= BAR_MS) {
                lastBarAt = now;
                historyRef.current.push(Math.max(0.035, peakHold));
                peakHold = 0;

                const width = canvas.clientWidth;
                const maxBars = Math.floor(width / BAR_STEP) + 4;

                if (historyRef.current.length > maxBars) {
                    historyRef.current = historyRef.current.slice(-maxBars);
                }
            }

            const width = canvas.clientWidth;
            const playheadX = Math.min(
                width - 8,
                Math.max(8, historyRef.current.length * BAR_STEP),
            );
            drawMirroredBars(context, width, height, historyRef.current, playheadX, 'window');
        };

        animationRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('resize', resize);

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

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
    }, [height, isRecording, stream]);

    return (
        <canvas
            ref={canvasRef}
            className={`vm-waveform ${className}`.trim()}
            style={{ width: '100%', height }}
            aria-hidden="true"
        />
    );
}

function drawMirroredBars(context, width, height, bars, playheadX = null, fit = 'window') {
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
            // Map full recording across the visible width (0% … 100%)
            const peakIndex = bars.length === 1
                ? 0
                : Math.min(
                    bars.length - 1,
                    Math.round((i / Math.max(usable - 1, 1)) * (bars.length - 1)),
                );
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
}
