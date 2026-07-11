import { useState } from 'react';
import { ChevronDown, Lightbulb, ScrollText, Settings2 } from 'lucide-react';
import RecordingTimer from '@/Components/PitchRecorder/RecordingTimer';
import DeviceSelector from '@/Components/PitchRecorder/DeviceSelector';

export default function StudioToolbar({
    isRecording,
    isRecorded,
    isCompact,
    recordingTime,
    targetTimeMins,
    onTargetTimeChange,
    devices,
    selectedAudioId,
    selectedVideoId,
    onAudioDeviceChange,
    onVideoDeviceChange,
    cameraUnavailable,
    teleprompterVisible,
    onTeleprompterToggle,
    onRulesToggle,
    rulesOpen,
}) {
    const [devicesOpen, setDevicesOpen] = useState(false);

    if (isRecorded) {
        return null;
    }

    return (
        <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl shrink-0 flex-wrap"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <RecordingTimer
                variant="card"
                isRecording={isRecording}
                recordingTime={recordingTime}
                targetTimeMins={targetTimeMins}
                onTargetTimeChange={onTargetTimeChange}
            />

            {!isRecording && !isCompact && devices?.audio?.length > 0 && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDevicesOpen(!devicesOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                        }}
                        aria-expanded={devicesOpen}
                        aria-label="Настройки устройств"
                    >
                        <Settings2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Устройства</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${devicesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {devicesOpen && (
                        <>
                            <button
                                type="button"
                                className="fixed inset-0 z-10"
                                aria-label="Закрыть настройки устройств"
                                onClick={() => setDevicesOpen(false)}
                            />
                            <div
                                className="absolute top-full left-0 mt-1 z-20 p-3 rounded-xl min-w-[240px]"
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-default)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                }}
                            >
                                <DeviceSelector
                                    devices={devices}
                                    selectedAudioId={selectedAudioId}
                                    selectedVideoId={selectedVideoId}
                                    onAudioDeviceChange={onAudioDeviceChange}
                                    onVideoDeviceChange={onVideoDeviceChange}
                                    showVideo={!cameraUnavailable}
                                    variant="card"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="hidden sm:block w-px h-5" style={{ backgroundColor: 'var(--border-subtle)' }} />

            {!isCompact && (
                <>
                    <button
                        type="button"
                        onClick={onTeleprompterToggle}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: teleprompterVisible ? 'var(--accent-subtle)' : 'transparent',
                            color: teleprompterVisible ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${teleprompterVisible ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                        }}
                        aria-pressed={teleprompterVisible}
                        aria-label="Переключить телесуфлёр"
                    >
                        <ScrollText className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden md:inline">Телесуфлёр</span>
                    </button>

                    <button
                        type="button"
                        onClick={onRulesToggle}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            backgroundColor: rulesOpen ? 'var(--accent-subtle)' : 'transparent',
                            color: rulesOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${rulesOpen ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                        }}
                        aria-pressed={rulesOpen}
                        aria-label="Открыть памятку питчинга"
                    >
                        <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden md:inline">Памятка</span>
                        <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                        >
                            6
                        </span>
                    </button>
                </>
            )}

            <span className="ml-auto text-xs text-zinc-600 hidden sm:inline">Макс. 10 мин</span>
        </div>
    );
}
