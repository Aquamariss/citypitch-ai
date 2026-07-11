import { useEffect, useState } from 'react';

export default function Timer({ durationSeconds, isRunning, onComplete }) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    useEffect(() => {
        setTimeLeft(durationSeconds);
    }, [durationSeconds]);

    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft <= 0) {
            onComplete();
        }
        
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const isWarning = timeLeft <= 30 && timeLeft > 0;

    return (
        <div className={`text-3xl font-mono font-bold ${isWarning ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
    );
}
