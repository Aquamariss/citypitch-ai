import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function AppLayout({ children }) {
    const { auth_email, attempts_used, max_attempts } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="shrink-0 flex items-center">
                                <Link href={route('pitch.index')} className="text-xl font-bold text-indigo-600">
                                    Pitch Trainer AI
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center text-sm font-medium text-gray-500">
                                Попытки: <span className={`ml-1 font-bold ${attempts_used >= max_attempts ? 'text-red-500' : 'text-indigo-600'}`}>
                                    {attempts_used} / {max_attempts}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {auth_email}
                            </div>
                            <Link
                                href={route('auth.logout')}
                                method="post"
                                as="button"
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none transition duration-150 ease-in-out"
                            >
                                Выйти
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Global Error/Status Banner */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    {usePage().props.status && (
                        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        {usePage().props.status === 'code-sent' ? 'Код успешно отправлен!' : usePage().props.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {Object.keys(usePage().props.errors).length > 0 && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Обнаружены ошибки:</h3>
                                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                                        {Object.values(usePage().props.errors).map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {children}
            </main>
        </div>
    );
}
