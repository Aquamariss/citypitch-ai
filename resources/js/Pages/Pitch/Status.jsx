import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';

const PROC_STEPS = [
    { id: 'upload', label: 'Загрузка записи', match: ['загрузка', 'upload', 'обработка', 'обработ'] },
    { id: 'transcribe', label: 'Транскрипция речи', match: ['распознав', 'transcrib', 'реч'] },
    { id: 'analyze', label: 'Оценка по критериям', match: ['анализ', 'analyz', 'критер'] },
    { id: 'verdict', label: 'Сборка вердикта', match: ['готов', 'completed', 'вердикт', 'отчёт', 'отчет'] },
];

function resolveStepIndex(step, status) {
    if (status === 'completed') {
        return PROC_STEPS.length;
    }

    const raw = String(step ?? '').toLowerCase();

    for (let i = PROC_STEPS.length - 1; i >= 0; i -= 1) {
        if (PROC_STEPS[i].match.some((token) => raw.includes(token))) {
            return i;
        }
    }

    return 0;
}

export default function Status({ pitchId, initialStatus }) {
    const [status, setStatus] = useState(initialStatus);
    const isError = status.status === 'error';
    const stepIndex = useMemo(
        () => resolveStepIndex(status.step, status.status),
        [status.step, status.status],
    );
    const progress = Math.min(100, Math.max(8, Math.round((stepIndex / PROC_STEPS.length) * 100)));

    useEffect(() => {
        if (status.status === 'completed' || status.status === 'error') {
            return undefined;
        }

        const interval = setInterval(async () => {
            try {
                const response = await fetch(route('pitch.status', { pitchId }), {
                    headers: { Accept: 'application/json' },
                });

                if (response.redirected) {
                    router.visit(response.url);

                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);

                    if (data.status === 'completed') {
                        router.visit(route('pitch.result', { pitchId }));
                    }
                } else {
                    setStatus({
                        status: 'error',
                        step: 'ошибка сети',
                        message: 'Сервер вернул ошибку. Попробуйте обновить страницу.',
                    });
                }
            } catch {
                setStatus({
                    status: 'error',
                    step: 'ошибка сети',
                    message: 'Проблемы с соединением. Пожалуйста, проверьте интернет.',
                });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pitchId, status.status]);

    return (
        <AppLayout>
            <Head title="Обработка питча — Pitch AI" />

            <div className="page">
                <div
                    className={`card proc-card${isError ? ' is-error' : ''}`}
                    data-processing
                    aria-busy={isError ? 'false' : 'true'}
                >
                    {!isError && <div className="spin" aria-hidden="true" />}

                    <h1>{isError ? 'Не удалось разобрать питч' : 'Анализируем питч'}</h1>
                    <p>
                        {isError
                            ? (status.message || 'Не удалось обработать файл. Попробуйте ещё раз.')
                            : 'Транскрибируем речь и оцениваем по критериям инвестора. Обычно 1–2 минуты.'}
                    </p>

                    {isError && (
                        <div className="error-banner" role="alert">
                            {status.message || 'Ошибка анализа. Можно повторить запись.'}
                        </div>
                    )}

                    {!isError && (
                        <>
                            <div
                                className="proc-track"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progress}
                            >
                                <div className="proc-fill" style={{ width: `${progress}%` }} />
                            </div>

                            <div className="proc-steps">
                                {PROC_STEPS.map((step, index) => {
                                    const done = index < stepIndex;
                                    const active = index === stepIndex && status.status !== 'completed';

                                    return (
                                        <div
                                            key={step.id}
                                            className={`proc-step${done ? ' done' : ''}${active ? ' active' : ''}`}
                                        >
                                            <span className="dot" aria-hidden="true" />
                                            {step.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {isError && (
                        <div className="proc-actions">
                            <Link href={route('pitch.index')} className="btn btn-primary">
                                Новая запись
                            </Link>
                            <Link href={`${route('pitch.index')}?tab=history`} className="btn btn-secondary">
                                К истории
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
