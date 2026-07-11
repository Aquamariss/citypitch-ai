import { useEffect, useRef } from 'react';

function IdleWaveform() {
    const bars = Array.from({ length: 12 });

    return (
        <div className="flex items-end gap-1 h-14 w-full max-w-xs">
            {bars.map((_, index) => (
                <div
                    key={index}
                    className="flex-1 rounded-full"
                    style={{
                        minHeight: '4px',
                        backgroundColor: 'var(--accent-primary)',
                        opacity: 0.5,
                        height: `${20 + (index % 5) * 12}%`,
                    }}
                />
            ))}
        </div>
    );
}

export default function LiveAudioVisualizerPanel({ mediaRecorder, isRecording }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!isRecording || !mediaRecorder?.stream || !canvasRef.current) {
            return undefined;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            return undefined;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = audioContext.createMediaStreamSource(mediaRecorder.stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--record-active')
            .trim() || '#ef4444';

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
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

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            source.disconnect();
            analyser.disconnect();

            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [isRecording, mediaRecorder]);

    if (!isRecording || !mediaRecorder) {
        return <IdleWaveform />;
    }

    return (
        <div className="w-full max-w-xs h-14 flex items-center justify-center">
            <canvas
                ref={canvasRef}
                width={280}
                height={56}
                className="w-full max-w-xs"
                style={{ height: '56px' }}
            />
        </div>
    );
}
