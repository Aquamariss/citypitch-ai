import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { route } from 'ziggy-js';
import TranscriptPlayer from '@/Components/TranscriptPlayer';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Download, Video, ChevronRight, Brain } from 'lucide-react';

/* ─── Score Ring (SVG) ─── */
function ScoreRing({ score, maxScore }) {
    const pct = maxScore > 0 ? score / maxScore : 0;
    const isGood = pct >= 0.7;
    const isMedium = pct >= 0.4;
    const color = isGood ? '#10b981' : isMedium ? '#f59e0b' : '#ef4444';

    const size = 56;
    const strokeWidth = 4;
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const dashOffset = circ - circ * pct;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={dashOffset}
                    style={{
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }}
                />
            </svg>
            <span
                className="absolute text-xs font-bold font-mono"
                style={{ color }}
            >
                {score}/{maxScore}
            </span>
        </div>
    );
}

/* ─── Criterion Card ─── */
function CriterionCard({ criterion, index }) {
    const { name, score, maxScore, feedback } = criterion;
    const pct = maxScore > 0 ? score / maxScore : 0;
    const isGood = pct >= 0.7;
    const isMedium = pct >= 0.4;
    const color = isGood ? '#10b981' : isMedium ? '#f59e0b' : '#ef4444';
    const colorSubtle = isGood ? 'rgba(16,185,129,0.08)' : isMedium ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.07, duration: 0.35, ease: 'easeOut' }}
            className="p-4 rounded-2xl flex flex-col gap-3"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
            }}
        >
            <div className="flex items-start gap-3">
                <ScoreRing score={score} maxScore={maxScore} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-zinc-200 truncate">{name}</h4>
                        <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorSubtle, color }}
                        >
                            {Math.round(pct * 100)}%
                        </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct * 100, 100)}%` }}
                            transition={{ delay: 0.2 + index * 0.07, duration: 0.7, ease: 'easeOut' }}
                            style={{ backgroundColor: color }}
                        />
                    </div>
                </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{feedback}</p>
        </motion.div>
    );
}

export default function Result() {
    const { result, media_type } = usePage().props;
    const { analysis, transcription, videoUrl, id } = result;

    const totalScore = analysis.criteria?.reduce((s, c) => s + (c.score || 0), 0) ?? 0;
    const totalMax   = analysis.criteria?.reduce((s, c) => s + (c.maxScore || 0), 0) ?? 0;
    const totalPct   = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return (
        <AppLayout>
            <Head title={analysis.name ? `${analysis.name} — результат` : 'Результаты питча'} />

            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                    <Link href={`${route('pitch.index')}?tab=history`} className="hover:text-zinc-300 transition-colors">
                        История
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span style={{ color: 'var(--text-secondary)' }}>{analysis.name || 'Результат'}</span>
                </nav>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-wrap items-center justify-between gap-4 mb-6"
                >
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold text-zinc-100">
                            {analysis.name || 'Результат анализа'}
                        </h1>
                        <span
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                            style={analysis.isPassed
                                ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
                                : { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }
                            }
                        >
                            {analysis.isPassed
                                ? <><CheckCircle className="w-3.5 h-3.5" strokeWidth={2} /> ПРИНЯТО</>
                                : <><XCircle className="w-3.5 h-3.5" strokeWidth={2} /> НЕ ПРИНЯТО</>
                            }
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={route('pitch.download', { pitchId: id })}
                            download
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-default)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                        >
                            <Download className="w-4 h-4" strokeWidth={1.5} />
                            {media_type === 'audio' ? 'Аудио' : 'Видео'}
                        </a>
                        <Link
                            href={route('pitch.index')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95"
                            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 16px var(--accent-glow)' }}
                        >
                            <Video className="w-4 h-4" strokeWidth={1.5} />
                            Новая попытка
                        </Link>
                    </div>
                </motion.div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Player + Transcript */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <TranscriptPlayer
                            mediaUrl={videoUrl}
                            transcript={transcription.segments || []}
                            mediaType={media_type}
                            duration={transcription.duration}
                        />
                    </div>

                    {/* Right: AI Feedback */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Overall Score */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="rounded-2xl p-5"
                            style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))',
                                border: '1px solid rgba(124,58,237,0.2)',
                            }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                                >
                                    <Brain className="w-5 h-5 text-white" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">Резюме ИИ</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-2xl font-bold font-mono" style={{ color: analysis.isPassed ? '#10b981' : '#ef4444' }}>
                                            {totalPct}%
                                        </span>
                                        <span className="text-xs text-zinc-500">общий балл</span>
                                    </div>
                                </div>
                            </div>

                            {analysis.summary && (
                                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                                    {analysis.summary}
                                </p>
                            )}
                            {analysis.overallFeedback && (
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    {analysis.overallFeedback}
                                </p>
                            )}
                        </motion.div>

                        {/* Criteria */}
                        <div>
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
                                Детальный разбор
                            </h3>
                            <div className="flex flex-col gap-3">
                                {(analysis.criteria || []).map((c, i) => (
                                    <CriterionCard key={i} criterion={c} index={i} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
