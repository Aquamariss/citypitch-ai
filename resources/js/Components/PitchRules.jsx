import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const LightbulbIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
);

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const PlayIcon = () => (
    <svg className="w-4 h-4 text-white/50 absolute z-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
);

export default function PitchRules({ history = [], attemptsUsed = 0, maxAttempts = 5 }) {
    const [tab, setTab] = useState('tips');

    const tips = [
        { title: "Проблема (Problem)", text: "С какой реальной болью сталкивается клиент? Кому больно и почему это важно?" },
        { title: "Решение (Solution)", text: "Как ваш продукт решает эту проблему? Объясните механизм простыми словами." },
        { title: "Рынок (Market)", text: "Покажите размер рынка. Используйте метрики TAM, SAM, SOM." },
        { title: "Бизнес-модель", text: "Как вы будете зарабатывать? Назовите юнит-экономику." },
        { title: "Команда (Team)", text: "Почему именно вы сможете это реализовать? Расскажите о релевантном опыте." },
        { title: "Запрос (Call to Action)", text: "Что вы хотите от аудитории? Инвестиции, партнеры, пилоты?" }
    ];

    return (
        <div className="w-full md:w-80 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden shrink-0">
            <div className="flex border-b border-slate-200 bg-slate-50">
                <button 
                    onClick={() => setTab('tips')} 
                    className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition ${tab === 'tips' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LightbulbIcon /> Памятка
                </button>
                <button 
                    onClick={() => setTab('history')} 
                    className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition ${tab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    <ClockIcon /> История
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {tab === 'tips' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 text-lg mb-2">Правила питчинга</h3>
                        {tips.map((tip, i) => (
                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition">
                                <h4 className="font-semibold text-slate-700 text-sm mb-1">{i + 1}. {tip.title}</h4>
                                <p className="text-slate-500 text-xs leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 text-lg">Ваши попытки</h3>
                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{attemptsUsed}/{maxAttempts}</span>
                        </div>
                        {history.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center mt-10">Вы еще не сделали ни одной попытки.</p>
                        ) : (
                            history.map((att, i) => (
                                <Link 
                                    href={route('pitch.result', { pitchId: att.id })}
                                    key={att.id} 
                                    className="p-3 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition bg-white flex items-center gap-3 block"
                                >
                                    <div className="w-12 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                                        <PlayIcon />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-semibold text-sm text-slate-700 truncate">{att.name}</h4>
                                            <span className={`w-2 h-2 rounded-full ${att.isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                        </div>
                                        <p className="text-xs text-slate-500">{formatTime(att.duration)} / {att.created_at}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
