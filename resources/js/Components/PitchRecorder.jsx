import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';

// Helper for formatting time
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// SVG Icons matching the mockup FontAwesome icons
const VideoIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path></svg>;
const StopIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"></path></svg>;
const VideoSlashIcon = () => <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.61V6.5l-4 4v-4c0-.55-.45-1-1-1H6.12L21 16.61zM3.41 1.86L2 3.27l4.32 4.32c-.2.2-.32.48-.32.79v10c0 .55.45 1 1 1h10c.31 0 .59-.12.79-.32l2.94 2.94 1.41-1.41L3.41 1.86z"></path></svg>;
const TargetIcon = () => <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>;
const InfoIcon = () => <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>;
const BrainIcon = () => <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>;

export default function PitchRecorder({ defaultDuration }) {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    
    const [mode, setMode] = useState('video'); // 'video', 'audio', 'error'
    const [isRecording, setIsRecording] = useState(false);
    const [isRecorded, setIsRecorded] = useState(false);
    const [targetTimeMins, setTargetTimeMins] = useState(Math.round(defaultDuration / 60) || 3);
    const [recordingTime, setRecordingTime] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [cameraError, setCameraError] = useState(false);
    
    const { data, setData, post, progress, processing, errors } = useForm({
        video: null,
        duration: targetTimeMins * 60,
        media_type: 'video', 
    });

    useEffect(() => {
        setData('duration', targetTimeMins * 60);
    }, [targetTimeMins]);

    const startCamera = useCallback(async () => {
        try {
            setMode('video');
            setCameraError(false);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            streamRef.current = mediaStream;
            setData('media_type', 'video');
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.warn("Ошибка камеры, переход в аудио-режим", err);
            setCameraError(true);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ 
                    video: false, 
                    audio: true 
                });
                streamRef.current = audioStream;
                setMode('audio');
                setData('media_type', 'audio');
            } catch (audioErr) {
                console.error("Ошибка аудио", audioErr);
                setMode('error');
            }
        }
    }, [setData]);

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startCamera]);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const next = prev + 1;
                    if (next >= 600) { // 10 mins hard limit
                        stopRecording();
                        return next;
                    }
                    return next;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const startRecording = () => {
        if (!streamRef.current) return;
        
        let types = mode === 'video' 
            ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
            : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
            
        let mimeType = '';
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }
        
        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            const chunks = chunksRef.current;
            if (chunks.length === 0) return;
            
            const finalMimeType = mediaRecorder.mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm');
            const blob = new Blob(chunks, { type: finalMimeType });
            const ext = finalMimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `pitch.${ext}`, { type: finalMimeType });
            
            setData('video', file);
            setPreviewUrl(URL.createObjectURL(blob));
            setIsRecorded(true);
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };

        mediaRecorder.start(1000);
        setIsRecording(true);
        setRecordingTime(0);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const resetRecording = () => {
        setIsRecorded(false);
        setData('video', null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        startCamera();
    };

    const submitPitch = () => {
        post(route('pitch.upload'));
    };

    if (processing) {
        return (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 ai-ring"></div>
                    <div className="absolute inset-2 ai-ring" style={{ animationDirection: 'reverse', animationDuration: '2s', borderTopColor: '#10b981', borderRightColor: '#34d399' }}></div>
                    <BrainIcon />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">ИИ анализирует ваш питч</h2>
                <p className="text-slate-500 text-center max-w-sm mb-6">Загружаем видео, распознаем речь, проверяем структуру, тайминг и наличие фактов...</p>
                {progress && (
                    <div className="w-full max-w-md">
                        <div className="flex justify-between text-sm text-slate-500 mb-1 font-medium">
                            <span>Загрузка...</span>
                            <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress.percentage}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#0f172a] rounded-2xl shadow-sm overflow-hidden relative flex flex-col items-center justify-center group h-full min-h-[600px]">
            {/* Видео-плеер (камера или предпросмотр) */}
            {!isRecorded ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover absolute inset-0 ${cameraError ? 'hidden' : 'block'} ${isRecording ? 'scale-105' : 'scale-100'} transition-transform duration-1000`} 
                />
            ) : (
                mode === 'video' ? (
                    <video 
                        src={previewUrl}
                        controls 
                        playsInline
                        className="w-full h-full object-cover absolute inset-0 bg-[#0f172a]"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-white">
                        <audio src={previewUrl} controls className="w-3/4 max-w-md mt-6" />
                    </div>
                )
            )}
            
            {/* Сообщение об ошибке камеры (режим аудио) */}
            {cameraError && !isRecorded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-center p-8 bg-[#0f172a] z-0">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <VideoSlashIcon />
                    </div>
                    <p className="text-xl text-white font-bold mb-2">Камера или микрофон недоступны</p>
                    <p className="text-sm max-w-md text-slate-400">Включен аудио-режим. Вы можете записать питч только голосом.</p>
                </div>
            )}

            {mode === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-white p-8 text-center z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <VideoSlashIcon />
                    </div>
                    <p className="text-xl text-white font-bold mb-2">Нет доступа к камере и микрофону.</p>
                    <p className="text-sm max-w-md text-slate-400 mt-2">Пожалуйста, разрешите доступ в настройках браузера и перезагрузите страницу.</p>
                </div>
            )}

            {/* Оверлеи управления (скрываем при предпросмотре) */}
            {!isRecorded && mode !== 'error' && (
                <>
                    {/* Верхний бар */}
                    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
                        {isRecording ? (
                            <div className="flex items-center gap-3 bg-red-500/20 text-red-100 px-5 py-2 rounded-full backdrop-blur-md border border-red-500/50 shadow-lg">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-ring"></div>
                                <span className="font-mono text-xl tracking-wider font-bold">
                                    {formatTime(recordingTime)} <span className="text-white/60 text-base">/ {formatTime(targetTimeMins * 60)}</span>
                                </span>
                            </div>
                        ) : (
                            <div className="bg-black/40 text-white px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
                                <TargetIcon />
                                <label className="text-sm font-medium text-slate-300">Целевое время:</label>
                                <select 
                                    value={targetTimeMins} 
                                    onChange={e => setTargetTimeMins(Number(e.target.value))}
                                    className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer appearance-none text-center"
                                >
                                    <option value={1} className="text-slate-900">1 мин</option>
                                    <option value={3} className="text-slate-900">3 мин</option>
                                    <option value={5} className="text-slate-900">5 мин</option>
                                    <option value={10} className="text-slate-900">10 мин</option>
                                </select>
                            </div>
                        )}
                        
                        <div className="bg-black/40 text-slate-300 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-sm">
                            <InfoIcon />
                            Максимум 10 мин
                        </div>
                    </div>

                    {/* Нижняя панель с кнопкой записи */}
                    <div className="absolute bottom-0 left-0 w-full p-8 flex justify-center items-end z-10">
                        {!isRecording ? (
                            <button 
                                onClick={startRecording} 
                                className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-red-500 transition-all duration-300 hover:scale-105"
                                title="Начать запись"
                            >
                                <VideoIcon />
                            </button>
                        ) : (
                            <button 
                                onClick={stopRecording} 
                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-red-600 shadow-2xl hover:bg-slate-200 transition-all duration-300 hover:scale-105"
                                title="Остановить запись"
                            >
                                <StopIcon />
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Экран после записи */}
            {isRecorded && (
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0f172a]/90 to-transparent z-20 flex justify-center">
                    <div className="flex gap-4 w-full max-w-md">
                        <button
                            onClick={resetRecording}
                            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl shadow-lg backdrop-blur-md transition"
                        >
                            Перезаписать
                        </button>
                        <button
                            onClick={submitPitch}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                        >
                            Отправить ИИ
                        </button>
                    </div>
                </div>
            )}
            
            {/* Ошибки формы валидации */}
            {Object.keys(errors).length > 0 && (
                <div className="absolute top-24 left-6 right-6 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-xl text-sm shadow-xl z-30">
                    <ul className="list-disc list-inside">
                        {Object.values(errors).map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
