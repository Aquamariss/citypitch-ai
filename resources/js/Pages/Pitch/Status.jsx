import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';

export default function Status({ pitchId, initialStatus }) {
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        if (status.status === 'completed' || status.status === 'error') {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await fetch(route('pitch.status', { pitchId }), {
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.redirected) {
                    // Handled by Inertia if we just use router.reload or visit
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
                    console.error("Server error:", response.status);
                    setStatus({
                        status: 'error',
                        step: 'ошибка сети',
                        message: 'Сервер вернул ошибку при проверке статуса. Попробуйте обновить страницу.'
                    });
                }
            } catch (error) {
                console.error("Polling error:", error);
                setStatus({
                    status: 'error',
                    step: 'ошибка сети',
                    message: 'Проблемы с соединением. Пожалуйста, проверьте интернет и обновите страницу.'
                });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pitchId, status.status]);

    return (
        <AppLayout>
            <Head title="Обработка питча" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-12 text-center flex flex-col items-center">
                            
                            {status.status === 'error' ? (
                                <div className="text-red-600 mb-4">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <h3 className="text-xl font-bold">Произошла ошибка</h3>
                                    <p className="mt-2">{status.message || 'Не удалось обработать видео.'}</p>
                                    <button 
                                        onClick={() => router.visit(route('pitch.index'))}
                                        className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700"
                                    >
                                        Вернуться на главную
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">ИИ анализирует ваш питч</h3>
                                    <p className="text-gray-500 mb-6">Это может занять 1-2 минуты. Пожалуйста, не закрывайте страницу.</p>
                                    
                                    <div className="w-full max-w-md bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                                        <div className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-in-out w-1/2 animate-pulse"></div>
                                    </div>
                                    <p className="text-sm font-medium text-indigo-600 capitalize">
                                        Текущий этап: {status.step || 'обработка'}...
                                    </p>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
