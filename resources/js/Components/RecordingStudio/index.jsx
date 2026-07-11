import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import PitchRecorder from '@/Components/PitchRecorder';
import ProcessingOverlay from '@/Components/PitchRecorder/ProcessingOverlay';
import RecordingControls from '@/Components/PitchRecorder/RecordingControls';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner';
import AudioPreviewPlayer from '@/Components/PitchRecorder/AudioPreviewPlayer';
import LiveAudioVisualizerPanel from '@/Components/PitchRecorder/LiveAudioVisualizer';
import useTeleprompter from '@/hooks/useTeleprompter';
import StudioToolbar from './StudioToolbar';
import Teleprompter from './Teleprompter';
import CameraPiP, { CameraPlayback } from './CameraPiP';
import PitchRulesDrawer from './PitchRulesDrawer';

function AudioReview({ recordedUrl }) {
    return (
        <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 p-8 min-h-0"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--success-subtle)' }}
            >
                <CheckCircle className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-zinc-200">Запись завершена</p>
            <AudioPreviewPlayer src={recordedUrl} />
        </div>
    );
}

function AudioRecordingIndicator({ isRecording, nativeMediaRecorder, initState }) {
    if (initState !== 'ready') {
        return null;
    }

    return (
        <div
            className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            {isRecording && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}
            <LiveAudioVisualizerPanel mediaRecorder={nativeMediaRecorder} isRecording={isRecording} />
            <span className="text-xs text-zinc-500">
                {isRecording ? 'Запись...' : 'Аудио-режим'}
            </span>
        </div>
    );
}

export default function RecordingStudio({ defaultDuration }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [teleprompterVisible, setTeleprompterVisible] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [studioState, setStudioState] = useState(null);

    const targetTimeMins = studioState?.targetTimeMins ?? (Math.round(defaultDuration / 60) || 3);

    const teleprompter = useTeleprompter({
        isRecording,
        targetTimeMins,
    });

    useEffect(() => {
        if (isRecording) {
            setRulesOpen(false);
        }
    }, [isRecording]);

    const isRecorded = studioState?.isRecorded ?? false;
    const isVideoMode = studioState?.mode === 'video';
    const isCompact = isRecording;
    const initState = studioState?.initState ?? 'loading';

    const formErrorMessages = Object.values(studioState?.formErrors ?? {});
    const visibleErrors = [
        ...formErrorMessages,
        ...(studioState?.recorderError && !isRecorded ? [studioState.recorderError] : []),
    ];

    const showTeleprompter = teleprompterVisible && !isRecorded;
    const showCameraPiP = isVideoMode && !isRecorded && initState !== 'error';

    return (
        <div className="flex flex-col h-full gap-3 min-h-0">
            <PitchRecorder
                layout="studio"
                defaultDuration={defaultDuration}
                onRecordingStateChange={setIsRecording}
                onStudioStateChange={setStudioState}
            />

            {studioState?.processing && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <ProcessingOverlay progress={studioState.progress} />
                </div>
            )}

            {studioState && !studioState.processing && (
                <>
                    {!isRecorded && (
                        <StudioToolbar
                            isRecording={isRecording}
                            isRecorded={isRecorded}
                            isCompact={isCompact}
                            recordingTime={studioState.recordingTime}
                            targetTimeMins={studioState.targetTimeMins}
                            onTargetTimeChange={studioState.onTargetTimeChange}
                            devices={studioState.devices}
                            selectedAudioId={studioState.selectedAudioId}
                            selectedVideoId={studioState.selectedVideoId}
                            onAudioDeviceChange={studioState.onAudioDeviceChange}
                            onVideoDeviceChange={studioState.onVideoDeviceChange}
                            cameraUnavailable={studioState.cameraUnavailable}
                            teleprompterVisible={teleprompterVisible}
                            onTeleprompterToggle={() => setTeleprompterVisible((prev) => !prev)}
                            onRulesToggle={() => setRulesOpen((prev) => !prev)}
                            rulesOpen={rulesOpen}
                        />
                    )}

                    <div className="flex-1 min-h-0 flex flex-col relative">
                        {isRecorded && isVideoMode && (
                            <CameraPlayback recordedUrl={studioState.recordedUrl} visible />
                        )}

                        {isRecorded && !isVideoMode && (
                            <AudioReview recordedUrl={studioState.recordedUrl} />
                        )}

                        {!isRecorded && (
                            <div className={`flex-1 min-h-0 flex flex-col relative ${showTeleprompter ? '' : 'hidden'}`}>
                                <Teleprompter
                                    scrollRef={teleprompter.scrollRef}
                                    script={teleprompter.script}
                                    onScriptChange={teleprompter.updateScript}
                                    settings={teleprompter.settings}
                                    onSettingsChange={teleprompter.updateSettings}
                                    fontSizePx={teleprompter.fontSizePx}
                                    isRecording={isRecording}
                                    isRecorded={isRecorded}
                                    visible={showTeleprompter}
                                />

                                {showCameraPiP && (
                                    <CameraPiP
                                        initState={initState}
                                        initError={studioState.initError}
                                        isRecording={isRecording}
                                        isRecorded={isRecorded}
                                        previewVideoRef={studioState.previewVideoRef}
                                        visible
                                        dimmed={isRecording}
                                    />
                                )}

                                {!isVideoMode && (
                                    <AudioRecordingIndicator
                                        isRecording={isRecording}
                                        nativeMediaRecorder={studioState.nativeMediaRecorder}
                                        initState={initState}
                                    />
                                )}
                            </div>
                        )}

                        {!isRecorded && !showTeleprompter && (
                            <div
                                className="flex-1 rounded-2xl relative flex items-center justify-center"
                                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                            >
                                <p className="text-sm text-zinc-500">Телесуфлёр скрыт. Включите его в панели инструментов.</p>
                                {showCameraPiP && (
                                    <CameraPiP
                                        initState={initState}
                                        initError={studioState.initError}
                                        isRecording={isRecording}
                                        isRecorded={isRecorded}
                                        previewVideoRef={studioState.previewVideoRef}
                                        visible
                                        dimmed={isRecording}
                                    />
                                )}
                            </div>
                        )}

                        {initState === 'loading' && !isRecorded && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                    className="px-4 py-2 rounded-xl text-sm text-zinc-500"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                >
                                    Подключаем устройства...
                                </div>
                            </div>
                        )}
                    </div>

                    <ErrorBanner errors={visibleErrors} />

                    {initState === 'ready' && !isRecorded && (
                        <RecordingControls
                            variant={isVideoMode ? 'video' : 'audio'}
                            placement="studio"
                            isRecording={isRecording}
                            isRecorded={isRecorded}
                            onStart={studioState.onStart}
                            onStop={studioState.onStop}
                            onReset={studioState.onReset}
                            onSubmit={studioState.onSubmit}
                        />
                    )}

                    {isRecorded && (
                        <RecordingControls
                            variant={isVideoMode ? 'video' : 'audio'}
                            placement="studio"
                            isRecorded={isRecorded}
                            onReset={studioState.onReset}
                            onSubmit={studioState.onSubmit}
                        />
                    )}

                    <PitchRulesDrawer
                        open={rulesOpen}
                        onClose={() => setRulesOpen(false)}
                    />
                </>
            )}
        </div>
    );
}
