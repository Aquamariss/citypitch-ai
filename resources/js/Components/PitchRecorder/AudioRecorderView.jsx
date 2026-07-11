import { AudioLines, CheckCircle, VideoOff } from 'lucide-react';
import AudioPreviewPlayer from './AudioPreviewPlayer';
import DeviceSelector from './DeviceSelector';
import ErrorBanner from './ErrorBanner';
import LiveAudioVisualizerPanel from './LiveAudioVisualizer';
import RecordingControls from './RecordingControls';
import RecordingTimer from './RecordingTimer';

export default function AudioRecorderView({
    initState,
    initError,
    isRecording,
    isRecorded,
    recordingTime,
    targetTimeMins,
    onTargetTimeChange,
    recordedUrl,
    nativeMediaRecorder,
    formErrors,
    recorderError,
    devices,
    selectedAudioId,
    onAudioDeviceChange,
    onStart,
    onStop,
    onReset,
    onSubmit,
    cameraUnavailable,
}) {
    const formErrorMessages = Object.values(formErrors ?? {});
    const visibleErrors = [
        ...formErrorMessages,
        ...(recorderError && !isRecorded ? [recorderError] : []),
    ];

    return (
        <div
            className="flex-1 rounded-2xl flex flex-col h-full min-h-[400px] overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <ErrorBanner errors={visibleErrors} />

            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                    {cameraUnavailable && (
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <VideoOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Аудио-режим
                        </span>
                    )}
                    {!isRecording && !isRecorded && initState === 'ready' && (
                        <DeviceSelector
                            devices={devices}
                            selectedAudioId={selectedAudioId}
                            onAudioDeviceChange={onAudioDeviceChange}
                            showVideo={false}
                        />
                    )}
                </div>
                {!isRecorded && initState !== 'error' && initState !== 'loading' && (
                    <RecordingTimer
                        isRecording={isRecording}
                        recordingTime={recordingTime}
                        targetTimeMins={targetTimeMins}
                        onTargetTimeChange={onTargetTimeChange}
                    />
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
                {initState === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-10 h-10 border-2 rounded-full animate-spin"
                            style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent-primary)' }}
                        />
                        <p className="text-sm text-zinc-500">Подключаем устройства...</p>
                    </div>
                )}

                {initState === 'error' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--danger-subtle)' }}
                        >
                            <VideoOff className="w-7 h-7 text-red-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="font-semibold text-zinc-200 mb-1">Нет доступа к микрофону</p>
                            <p className="text-sm text-zinc-500 max-w-xs">
                                {initError ?? 'Разрешите доступ в настройках браузера и перезагрузите страницу.'}
                            </p>
                        </div>
                    </div>
                )}

                {!isRecorded && initState === 'ready' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: isRecording ? 'rgba(239,68,68,0.12)' : 'var(--accent-subtle)',
                                    border: `2px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
                                }}
                            >
                                <AudioLines
                                    className="w-8 h-8"
                                    style={{ color: isRecording ? 'var(--record-active)' : 'var(--accent-primary)' }}
                                    strokeWidth={1.5}
                                />
                            </div>
                            {isRecording && (
                                <div
                                    className="absolute inset-0 rounded-full animate-record-pulse"
                                    style={{ borderColor: 'transparent' }}
                                />
                            )}
                        </div>
                        <LiveAudioVisualizerPanel mediaRecorder={nativeMediaRecorder} isRecording={isRecording} />
                        <p className="text-sm text-zinc-500">
                            {isRecording ? 'Идёт запись голоса...' : 'Готов к записи аудио'}
                        </p>
                    </div>
                )}

                {isRecorded && (
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--success-subtle)' }}
                        >
                            <CheckCircle className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                        </div>
                        <p className="font-semibold text-zinc-200">Запись завершена</p>
                        <AudioPreviewPlayer src={recordedUrl} />
                    </div>
                )}
            </div>

            {!isRecorded && initState === 'ready' && (
                <RecordingControls
                    variant="audio"
                    isRecording={isRecording}
                    isRecorded={isRecorded}
                    onStart={onStart}
                    onStop={onStop}
                />
            )}

            {isRecorded && (
                <RecordingControls
                    variant="audio"
                    isRecorded={isRecorded}
                    onReset={onReset}
                    onSubmit={onSubmit}
                />
            )}
        </div>
    );
}
