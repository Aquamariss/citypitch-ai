import { VideoOff } from 'lucide-react';
import DeviceSelector from './DeviceSelector';
import ErrorBanner from './ErrorBanner';
import RecordingControls from './RecordingControls';
import RecordingTimer from './RecordingTimer';

export default function VideoRecorderView({
    initState,
    initError,
    isRecording,
    isRecorded,
    recordingTime,
    targetTimeMins,
    onTargetTimeChange,
    recordedUrl,
    formErrors,
    recorderError,
    devices,
    selectedAudioId,
    selectedVideoId,
    onAudioDeviceChange,
    onVideoDeviceChange,
    onStart,
    onStop,
    onReset,
    onSubmit,
    previewVideoRef,
}) {
    const formErrorMessages = Object.values(formErrors ?? {});
    const visibleErrors = [
        ...formErrorMessages,
        ...(recorderError && !isRecorded ? [recorderError] : []),
    ];

    return (
        <div
            className="flex-1 rounded-2xl overflow-hidden relative flex flex-col h-full min-h-[500px]"
            style={{ backgroundColor: '#000', border: '1px solid var(--border-subtle)' }}
        >
            {!isRecorded ? (
                <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover absolute inset-0 transition-transform duration-1000 ${isRecording ? 'scale-105' : 'scale-100'}`}
                />
            ) : (
                <video
                    src={recordedUrl ?? undefined}
                    controls
                    playsInline
                    className="w-full h-full object-cover absolute inset-0"
                    style={{ backgroundColor: '#000' }}
                />
            )}

            {initState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                    <div
                        className="w-10 h-10 border-2 rounded-full animate-spin mb-4"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)' }}
                    />
                    <p className="text-sm text-zinc-400">Подключаем камеру...</p>
                </div>
            )}

            {initState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-center p-8">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: 'var(--danger-subtle)' }}
                    >
                        <VideoOff className="w-7 h-7 text-red-400" strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-white mb-2">Нет доступа к камере и микрофону</p>
                    <p className="text-sm text-zinc-500 max-w-xs">
                        {initError ?? 'Разрешите доступ в настройках браузера и перезагрузите страницу.'}
                    </p>
                </div>
            )}

            {!isRecorded && initState === 'ready' && (
                <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-10 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <RecordingTimer
                            variant="video"
                            isRecording={isRecording}
                            recordingTime={recordingTime}
                            targetTimeMins={targetTimeMins}
                            onTargetTimeChange={onTargetTimeChange}
                        />
                        {!isRecording && (
                            <DeviceSelector
                                variant="video"
                                devices={devices}
                                selectedAudioId={selectedAudioId}
                                selectedVideoId={selectedVideoId}
                                onAudioDeviceChange={onAudioDeviceChange}
                                onVideoDeviceChange={onVideoDeviceChange}
                            />
                        )}
                    </div>
                    <div
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md text-xs text-white/50 shrink-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                        Макс. 10 мин
                    </div>
                </div>
            )}

            {!isRecorded && initState === 'ready' && (
                <RecordingControls
                    variant="video"
                    isRecording={isRecording}
                    isRecorded={isRecorded}
                    onStart={onStart}
                    onStop={onStop}
                />
            )}

            {isRecorded && (
                <RecordingControls
                    variant="video"
                    isRecorded={isRecorded}
                    onReset={onReset}
                    onSubmit={onSubmit}
                />
            )}

            <ErrorBanner errors={visibleErrors} variant="video" />
        </div>
    );
}
