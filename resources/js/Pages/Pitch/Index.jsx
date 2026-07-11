import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import PitchRecorder from '@/Components/PitchRecorder';
import PitchRules from '@/Components/PitchRules';

export default function Index() {
    const { default_duration, attempts_used, max_attempts, history_pitches = [] } = usePage().props;
    const canAttempt = attempts_used < max_attempts;

    return (
        <AppLayout>
            <Head title="Запись питча" />

            <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden h-[calc(100vh-4rem)]">
                {/* Левая панель с правилами (Sidebar) */}
                <PitchRules history={history_pitches} attemptsUsed={attempts_used} maxAttempts={max_attempts} />

                {/* Центральная панель с рекордером */}
                <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
                    {!canAttempt ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 h-full">
                            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Лимит исчерпан</h2>
                            <p className="text-slate-500 text-center max-w-md">
                                Вы исчерпали лимит попыток на сегодня ({max_attempts} из {max_attempts}). Возвращайтесь завтра!
                            </p>
                        </div>
                    ) : (
                        <PitchRecorder defaultDuration={default_duration} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
