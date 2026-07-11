import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import PitchRecorder from '@/Components/PitchRecorder';
import PitchRules from '@/Components/PitchRules';
import { route } from 'ziggy-js';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Calendar, Mic, BarChart2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const formatDate = (str) => {
    if (!str) return '';
    try {
        return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
        return str;
    }
};

/* ─── Custom Tooltip for chart ─── */
function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="px-3 py-2 rounded-xl text-xs"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        >
            <p className="font-mono font-bold">{payload[0].value}%</p>
        </div>
    );
}

/* ─── Empty State ─── */
function EmptyHistory() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--accent-subtle)' }}
            >
                <Mic className="w-10 h-10" style={{ color: 'var(--accent-primary)' }} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Нет записей</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                Вы ещё не сделали ни одной записи. Запишите первый питч!
            </p>
            <Link
                href={route('pitch.index')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
            >
                <Mic className="w-4 h-4" strokeWidth={1.5} />
                Записать питч
            </Link>
        </div>
    );
}

/* ─── History Card ─── */
function HistoryCard({ attempt, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
        >
            <Link
                href={route('pitch.result', { pitchId: attempt.id })}
                className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 block"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: attempt.isPassed ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }}
                >
                    {attempt.isPassed
                        ? <CheckCircle className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                        : <XCircle className="w-6 h-6 text-red-400" strokeWidth={1.5} />
                    }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                            className="text-sm font-semibold text-zinc-200 truncate transition-colors"
                            style={{}}
                        >
                            {attempt.name || 'Анализ питча'}
                        </h4>
                        <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={attempt.isPassed
                                ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }
                                : { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                            }
                        >
                            {attempt.isPassed ? 'ПРИНЯТО' : 'НЕ ПРИНЯТО'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {formatTime(attempt.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            {formatDate(attempt.created_at)}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

/* ─── Progress Chart ─── */
function ProgressChart({ pitches }) {
    if (pitches.length < 2) return null;

    const chartData = pitches
        .slice()
        .reverse()
        .map((p, i) => ({
            i: i + 1,
            score: p.score ?? (p.isPassed ? 70 : 35),
            name: p.name || `#${i + 1}`,
        }));

    return (
        <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-zinc-200">Прогресс</h3>
                <span className="ml-auto text-xs text-zinc-600">{pitches.length} попыток</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#scoreGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#7c3aed', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─── Main Page ─── */
export default function Index() {
    const { props, url } = usePage();
    const { default_duration, attempts_used, max_attempts, history_pitches = [] } = props;
    const canAttempt = attempts_used < max_attempts;
    const [isRecording, setIsRecording] = useState(false);

    const activeTab = useMemo(() => {
        const search = url.includes('?') ? url.split('?')[1] : '';
        const tab = new URLSearchParams(search).get('tab');

        return tab === 'history' ? 'history' : 'recorder';
    }, [url]);

    return (
        <AppLayout>
            <Head title="Запись питча — Pitch AI" />

            <div className="flex-1 h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] overflow-hidden">
                {activeTab === 'history' ? (
                    /* ─── History tab ─── */
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        <div className="max-w-2xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-100">История питчей</h2>
                                        <p className="text-sm text-zinc-500 mt-0.5">Все ваши предыдущие попытки</p>
                                    </div>
                                    <div
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                                    >
                                        <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        {attempts_used}/{max_attempts} попыток
                                    </div>
                                </div>

                                {history_pitches.length === 0 ? (
                                    <div
                                        className="rounded-2xl"
                                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                    >
                                        <EmptyHistory />
                                    </div>
                                ) : (
                                    <>
                                        <ProgressChart pitches={history_pitches} />
                                        <div className="space-y-2">
                                            {history_pitches.map((att, i) => (
                                                <HistoryCard key={att.id} attempt={att} index={i} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </div>
                ) : (
                    /* ─── Recorder tab ─── */
                    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 md:p-6 overflow-hidden">
                        {/* Recorder */}
                        <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
                            {!canAttempt ? (
                                <div
                                    className="flex-1 rounded-2xl flex flex-col items-center justify-center p-8 h-full"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                >
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                        style={{ backgroundColor: 'var(--danger-subtle)' }}
                                    >
                                        <XCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-100 mb-2">Лимит исчерпан</h2>
                                    <p className="text-sm text-zinc-500 text-center max-w-sm">
                                        Вы исчерпали лимит попыток на сегодня ({max_attempts}/{max_attempts}). Возвращайтесь завтра!
                                    </p>
                                </div>
                            ) : (
                                <PitchRecorder
                                    defaultDuration={default_duration}
                                    onRecordingStateChange={setIsRecording}
                                />
                            )}
                        </div>

                        {/* Rules panel */}
                        <div className="w-full lg:w-72 xl:w-80 shrink-0 h-full overflow-hidden">
                            <PitchRules />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
