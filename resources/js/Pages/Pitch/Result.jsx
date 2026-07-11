import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';

// SVG Icons
const CheckIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
const XMarkIcon = () => <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>;
const VideoIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>;
const PieChartIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>;
const AlignLeftIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>;
const RobotIcon = () => <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;

export default function Result() {
    const { result, media_type } = usePage().props;
    const { analysis, transcription, videoUrl, id } = result;
    const [tab, setTab] = useState('feedback');

    return (
        <AppLayout>
            <Head title={analysis.name ? `${analysis.name} — результат` : 'Результаты питча'} />

            <div className="py-8 bg-slate-100 min-h-screen">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Заголовок и вердикт */}
                        <div className="p-5 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="font-bold text-xl text-slate-800">{analysis.name || 'Результат анализа'}</h2>
                                <span className={`px-4 py-1.5 text-sm font-bold rounded-full border flex items-center ${analysis.isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                    {analysis.isPassed ? <><CheckIcon /> ПРИНЯТО</> : <><XMarkIcon /> НЕ ПРИНЯТО</>}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <a 
                                    href={route('pitch.download', { pitchId: id })} 
                                    download 
                                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition text-sm font-semibold flex items-center gap-2 shadow-sm"
                                >
                                    <DownloadIcon /> {media_type === 'audio' ? 'Скачать аудио' : 'Скачать видео'}
                                </a>
                                <Link 
                                    href={route('pitch.index')} 
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2 shadow-sm"
                                >
                                    <VideoIcon /> Новая попытка
                                </Link>
                            </div>
                        </div>

                        {/* Основной контент */}
                        <div className="p-6">
                            {/* Медиаплеер */}
                            <div className="mb-8">
                                {media_type === 'audio' ? (
                                    <div className="w-full bg-slate-50 rounded-2xl p-8 border border-slate-200 flex flex-col items-center justify-center">
                                        <audio 
                                            src={videoUrl} 
                                            controls 
                                            className="w-full max-w-3xl"
                                            crossOrigin="anonymous"
                                            onTimeUpdate={(e) => {
                                                const textTrack = e.target.textTracks[0];
                                                if (textTrack && textTrack.activeCues && textTrack.activeCues.length > 0) {
                                                    const text = textTrack.activeCues[0].text;
                                                    const subtitleEl = document.getElementById('audio-subtitle');
                                                    if (subtitleEl) subtitleEl.innerText = text;
                                                } else {
                                                    const subtitleEl = document.getElementById('audio-subtitle');
                                                    if (subtitleEl) subtitleEl.innerText = '';
                                                }
                                            }}
                                        >
                                            <track src={route('pitch.subtitles', { pitchId: id })} kind="subtitles" srcLang="ru" label="Русский" default />
                                        </audio>
                                        <div id="audio-subtitle" className="mt-6 min-h-[3.5rem] text-center font-medium text-slate-800 text-lg bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm w-full max-w-3xl empty:hidden"></div>
                                    </div>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-video flex items-center justify-center shadow-inner group">
                                        <video src={videoUrl} controls className="w-full h-full object-contain">
                                            <track src={route('pitch.subtitles', { pitchId: id })} kind="subtitles" srcLang="ru" label="Русский" default />
                                        </video>
                                    </div>
                                )}
                            </div>

                            {/* Вкладки */}
                            <div>
                                <div className="flex gap-6 border-b border-slate-200 mb-6 px-2">
                                    <button 
                                        onClick={() => setTab('feedback')} 
                                        className={`pb-3 font-semibold text-sm transition flex items-center ${tab === 'feedback' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <PieChartIcon /> Обратная связь ИИ
                                    </button>
                                    <button 
                                        onClick={() => setTab('transcript')} 
                                        className={`pb-3 font-semibold text-sm transition flex items-center ${tab === 'transcript' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <AlignLeftIcon /> Распознанный текст
                                    </button>
                                </div>
                                
                                {tab === 'feedback' && (
                                    <div className="flex flex-col gap-6 animate-fade-in">
                                        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-900 text-sm leading-relaxed shadow-sm">
                                            <h4 className="font-bold mb-3 flex items-center gap-2"><RobotIcon /> Резюме ИИ</h4>
                                            <p className="text-base text-blue-950">{analysis.summary}</p>
                                            <p className="text-base text-blue-950 mt-2">{analysis.overallFeedback}</p>
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-800 text-lg">Детальный разбор</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {analysis.criteria.map((c, i) => {
                                                const scoreColor = c.score >= (c.maxScore * 0.7) ? 'bg-emerald-500' : (c.score >= (c.maxScore * 0.4) ? 'bg-amber-500' : 'bg-rose-500');
                                                const iconBg = c.score >= (c.maxScore * 0.7) ? 'bg-emerald-100 text-emerald-600' : (c.score >= (c.maxScore * 0.4) ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600');
                                                
                                                return (
                                                    <div key={i} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                                                                    {c.score >= (c.maxScore * 0.7) ? <CheckIcon /> : (c.score >= (c.maxScore * 0.4) ? <span className="font-bold text-xl">!</span> : <XMarkIcon />)}
                                                                </div>
                                                                <span className="font-bold text-slate-800 text-base">{c.name}</span>
                                                            </div>
                                                            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm ${scoreColor}`}>
                                                                {c.score} / {c.maxScore}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">{c.feedback}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {tab === 'transcript' && (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-base leading-relaxed whitespace-pre-wrap font-serif shadow-inner min-h-[200px] animate-fade-in">
                                        {transcription.text || "Текст не распознан. Возможно, питч был пустым или слишком коротким."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
