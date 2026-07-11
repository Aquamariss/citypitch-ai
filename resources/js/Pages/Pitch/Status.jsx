import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Brain } from 'lucide-react';

const steps = ['transcribing', 'analyzing', 'processing', 'completed'];

const stepLabels = {
    transcribing: 'Распознаём речь',
    analyzing:    'Анализируем структуру',
    processing:   'Формируем отчёт',
    completed:    'Готово!',
    обработка:    'Обрабатываем файл',
    загрузка:     'Загружаем данные',
};

function getStepLabel(step) {
    if (!step) return 'Обрабатываем...';
    const key = Object.keys(stepLabels).find((k) => step.toLowerCase().includes(k));
    return key ? stepLabels[key] : step;
}

export default function Status({ pitchId, initialStatus }) {
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        if (status.status === 'completed' || status.status === 'error') return;

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
                    setStatus({ status: 'error', step: 'ошибка сети', message: 'Сервер вернул ошибку. Попробуйте обновить страницу.' });
                }
            } catch {
                setStatus({ status: 'error', step: 'ошибка сети', message: 'Проблемы с соединением. Пожалуйста, проверьте интернет.' });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pitchId, status.status]);

    const isError = status.status === 'error';

    return (
        <AppLayout>
            <Head title="Обработка питча — Pitch AI" />

            <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm"
                >
                    <div
                        className="rounded-2xl p-8 text-center"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                        }}
                    >
                        {isError ? (
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                    style={{ backgroundColor: 'var(--danger-subtle)' }}
                                >
                                    <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100 mb-2">Произошла ошибка</h3>
                                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                                    {status.message || 'Не удалось обработать файл. Попробуйте ещё раз.'}
                                </p>
                                <button
                                    onClick={() => router.visit(route('pitch.index'))}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-glow)' }}
                                >
                                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                                    Вернуться к записи
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                {/* AI Ring */}
                                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                                    <div className="absolute inset-0 ai-ring" />
                                    <div className="absolute inset-2 ai-ring-reverse" />
                                    <Brain
                                        className="w-8 h-8 relative z-10"
                                        style={{ color: 'var(--ai-primary)' }}
                                        strokeWidth={1.5}
                                    />
                                </div>

                                <h3 className="text-lg font-bold text-zinc-100 mb-2">ИИ анализирует питч</h3>
                                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                                    Это займёт 1–2 минуты. Пожалуйста, не закрывайте страницу.
                                </p>

                                {/* Indeterminate progress */}
                                <div className="w-full mb-4 overflow-hidden rounded-full h-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                    <div
                                        className="h-full rounded-full animate-shimmer"
                                        style={{ width: '60%' }}
                                    />
                                </div>

                                {/* Current step */}
                                <div
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                                    style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                                    {getStepLabel(status.step)}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
