import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import TranscriptPlayer from '@/Components/TranscriptPlayer';
import { useMemo } from 'react';

function ScoreRing({ score, maxScore = 100, size = 56, label }) {
    const pct = maxScore > 0 ? Math.min(1, score / maxScore) : 0;
    const isGood = pct >= 0.7;
    const isMedium = pct >= 0.4;
    const color = isGood ? 'var(--success)' : isMedium ? 'var(--warning)' : 'var(--danger)';
    const strokeWidth = size >= 120 ? 8 : 4;
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
                {label ?? `${score}/${maxScore}`}
            </span>
        </div>
    );
}

export default function Result() {
    const { result, media_type } = usePage().props;
    const { analysis, transcription, videoUrl, id } = result;

    const totalScore = analysis.criteria?.reduce((s, c) => s + (c.score || 0), 0) ?? 0;
    const totalMax = analysis.criteria?.reduce((s, c) => s + (c.maxScore || 0), 0) ?? 0;
    const totalPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const priorities = useMemo(() => {
        return [...(analysis.criteria || [])]
            .map((criterion) => ({
                ...criterion,
                pct: criterion.maxScore > 0 ? criterion.score / criterion.maxScore : 0,
            }))
            .sort((a, b) => a.pct - b.pct)
            .slice(0, 3);
    }, [analysis.criteria]);

    return (
        <AppLayout>
            <Head title={analysis.name ? `${analysis.name} — результат` : 'Результаты питча'} />

            <div className="page">
                <div className="page-title">
                    <div>
                        <p className="caps">Результат</p>
                        <h1>{analysis.name || 'Результат анализа'}</h1>
                        <p>Оценка по критериям инвестора · порог принятия 60%</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href={route('pitch.download', { pitchId: id })} download className="btn btn-secondary btn-sm">
                            Скачать {media_type === 'audio' ? 'аудио' : 'видео'}
                        </a>
                        <Link href={route('pitch.index')} className="btn btn-secondary btn-sm">
                            Новая попытка
                        </Link>
                    </div>
                </div>

                <section className="result-hero card" aria-labelledby="verdict-headline">
                    <div className="verdict-score">
                        <ScoreRing score={totalPct} maxScore={100} size={140} label={`${totalPct}`} />
                    </div>
                    <div>
                        <span className={`badge ${analysis.isPassed ? 'badge-success' : 'badge-danger'}`}>
                            {analysis.isPassed ? 'Принято' : 'Не принято'}
                        </span>
                        <h2 className="verdict-headline" id="verdict-headline">
                            {analysis.isPassed
                                ? 'Питч проходит порог'
                                : 'Пока ниже порога принятия'}
                        </h2>
                        <p className="verdict-copy">
                            {analysis.summary || analysis.overallFeedback || (
                                analysis.isPassed
                                    ? 'Структура и ясность на уровне. Дожимайте слабые критерии перед демо-днём.'
                                    : 'Сфокусируйтесь на самых слабых блоках ниже — затем перезапишите попытку.'
                            )}
                        </p>
                    </div>
                </section>

                <section aria-labelledby="criteria-label">
                    <h2 className="caps section-label" id="criteria-label">Критерии</h2>
                    <div className="criteria-grid">
                        {(analysis.criteria || []).map((criterion) => {
                            const pct = criterion.maxScore > 0
                                ? Math.round((criterion.score / criterion.maxScore) * 100)
                                : 0;

                            return (
                                <article key={criterion.name} className="card" style={{ padding: 16 }}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <ScoreRing score={criterion.score} maxScore={criterion.maxScore} />
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold truncate">{criterion.name}</h3>
                                            <p className="text-xs mono" style={{ color: 'var(--muted)' }}>{pct}%</p>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                                        {criterion.feedback}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div className="result-split" style={{ marginTop: 24 }}>
                    <section className="card" style={{ padding: 16 }}>
                        <TranscriptPlayer
                            mediaUrl={videoUrl}
                            transcript={transcription.segments || []}
                            mediaType={media_type}
                            duration={transcription.duration}
                        />
                    </section>

                    <section className="card" aria-labelledby="feedback-title">
                        <h2 className="feedback-title" id="feedback-title">Что править в первую очередь</h2>
                        <ol className="feedback-list">
                            {priorities.map((item) => (
                                <li key={item.name}>
                                    <strong>{item.name}</strong>
                                    {' — '}
                                    {item.feedback || 'Усильте этот блок перед следующей записью.'}
                                </li>
                            ))}
                        </ol>
                        <Link
                            href={route('pitch-writer.index')}
                            className="btn btn-primary"
                            style={{ marginTop: 18, width: '100%' }}
                        >
                            Открыть в Райтере
                        </Link>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
