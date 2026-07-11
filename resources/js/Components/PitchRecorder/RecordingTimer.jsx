import { Timer } from 'lucide-react';
import { formatTime } from './formatTime';

export default function RecordingTimer({
    isRecording,
    recordingTime,
    targetTimeMins,
    onTargetTimeChange,
    variant = 'card',
}) {
    if (isRecording) {
        if (variant === 'video') {
            return (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.8)' }} />
                    <span className="font-mono text-lg font-bold text-white tracking-wider">{formatTime(recordingTime)}</span>
                    <span className="text-white/40 text-sm">/ {formatTime(targetTimeMins * 60)}</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--danger-subtle)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono font-bold text-red-400">{formatTime(recordingTime)}</span>
                <span className="text-xs text-zinc-600">/ {formatTime(targetTimeMins * 60)}</span>
            </div>
        );
    }

    if (variant === 'video') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Timer className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <select
                    value={targetTimeMins}
                    onChange={(event) => onTargetTimeChange(Number(event.target.value))}
                    className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer appearance-none"
                >
                    {[1, 3, 5, 10].map((value) => (
                        <option key={value} value={value} className="bg-zinc-900 text-white">{value} мин</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Timer className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <select
                value={targetTimeMins}
                onChange={(event) => onTargetTimeChange(Number(event.target.value))}
                className="text-xs font-medium rounded-lg px-2 py-1 outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
                {[1, 3, 5, 10].map((value) => (
                    <option key={value} value={value}>{value} мин</option>
                ))}
            </select>
        </div>
    );
}
