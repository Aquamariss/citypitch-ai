import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import RecordingStudio from '@/Components/RecordingStudio';
import { route } from 'ziggy-js';
import { Mic } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
};

const formatDate = (str) => {
    if (!str) {
        return '';
    }

    try {
        return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
        return str;
    }
};

function ScoreRing({ score }) {
    const pct = Math.min(100, Math.max(0, score ?? 0)) / 100;
    const color = pct >= 0.7 ? 'var(--success)' : pct >= 0.4 ? 'var(--warning)' : 'var(--danger)';
    const size = 48;
    const strokeWidth = 4;
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const dashOffset = circ - circ * pct;

    return (
        <div className="score-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="color-mix(in oklch, var(--fg) 8%, transparent)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                />
            </svg>
            <span className="score-ring-value" style={{ color }}>
                {Math.round(score ?? 0)}
            </span>
        </div>
    );
}

function ChartTooltip({ active, payload }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
            <p className="mono font-bold">{payload[0].value}%</p>
        </div>
    );
}

function EmptyHistory() {
    return (
        <div className="empty-state card">
            <div className="empty-state-icon">
                <Mic strokeWidth={1.5} />
            </div>
            <h2>Нет записей</h2>
            <p>Вы ещё не сделали ни одной записи. Запишите первый питч!</p>
            <Link href={route('pitch.index')} className="btn btn-primary" style={{ marginTop: 16 }}>
                Записать питч
            </Link>
        </div>
    );
}

function HistoryView({ historyPitches, attemptsUsed, maxAttempts }) {
    const chartData = historyPitches
        .slice()
        .reverse()
        .map((pitch, index) => ({
            i: index + 1,
            score: pitch.score ?? (pitch.isPassed ? 70 : 35),
        }));

    return (
        <div className="page">
            <div className="page-title">
                <div>
                    <p className="caps">Архив</p>
                    <h1>История питчей</h1>
                    <p>
                        {attemptsUsed}/{maxAttempts} попыток · порог принятия 60%
                    </p>
                </div>
                <Link href={route('pitch.index')} className="btn btn-primary btn-sm">
                    Новая запись
                </Link>
            </div>

            {historyPitches.length === 0 ? (
                <EmptyHistory />
            ) : (
                <div className="history-layout">
                    <div className="attempt-list">
                        {historyPitches.map((attempt) => {
                            const score = attempt.score ?? (attempt.isPassed ? 70 : 35);

                            return (
                                <Link
                                    key={attempt.id}
                                    href={route('pitch.result', { pitchId: attempt.id })}
                                    className="attempt-row"
                                >
                                    <ScoreRing score={score} />
                                    <div className="min-w-0">
                                        <h3 className="truncate">{attempt.name || 'Анализ питча'}</h3>
                                        <p className="meta">
                                            {formatTime(attempt.duration)}
                                            {' · '}
                                            {attempt.media_type === 'audio' ? 'аудио' : 'видео'}
                                            {' · '}
                                            {formatDate(attempt.created_at)}
                                        </p>
                                    </div>
                                    <span className={`badge ${attempt.isPassed ? 'badge-success' : 'badge-danger'}`}>
                                        {attempt.isPassed ? 'Принято' : 'Не принято'}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {chartData.length >= 2 && (
                        <div className="card chart-card">
                            <h2>Прогресс</h2>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(72% 0.09 65)" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="oklch(72% 0.09 65)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="i" tick={false} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="oklch(72% 0.09 65)"
                                        strokeWidth={2}
                                        fill="url(#scoreGrad)"
                                        dot={false}
                                        activeDot={{ r: 4, fill: 'oklch(72% 0.09 65)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Index() {
    const { props, url } = usePage();
    const { default_duration, attempts_used, max_attempts, history_pitches = [], draft_session = null } = props;
    const canAttempt = attempts_used < max_attempts;

    const activeTab = useMemo(() => {
        const search = url.includes('?') ? url.split('?')[1] : '';
        const tab = new URLSearchParams(search).get('tab');

        return tab === 'history' ? 'history' : 'recorder';
    }, [url]);

    const isStudio = activeTab === 'recorder' && canAttempt;

    return (
        <AppLayout>
            <Head title={isStudio ? 'Студия записи — Pitch AI' : 'История — Pitch AI'} />

            {activeTab === 'history' ? (
                <HistoryView
                    historyPitches={history_pitches}
                    attemptsUsed={attempts_used}
                    maxAttempts={max_attempts}
                />
            ) : !canAttempt ? (
                <div className="page">
                    <div className="empty-state card">
                        <div className="empty-state-icon" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
                            <Mic strokeWidth={1.5} />
                        </div>
                        <h2>Лимит исчерпан</h2>
                        <p>
                            Вы исчерпали лимит попыток на сегодня ({max_attempts}/{max_attempts}). Возвращайтесь завтра!
                        </p>
                        <Link href={`${route('pitch.index')}?tab=history`} className="btn btn-secondary" style={{ marginTop: 16 }}>
                            К истории
                        </Link>
                    </div>
                </div>
            ) : (
                <RecordingStudio defaultDuration={default_duration} draftSession={draft_session} />
            )}
        </AppLayout>
    );
}
