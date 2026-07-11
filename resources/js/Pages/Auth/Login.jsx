import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Login() {
    const { status } = usePage().props;
    const isCodeSent = status === 'code-sent';
    
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        code: '',
    });

    const submitEmail = (e) => {
        e.preventDefault();
        post(route('auth.send-code'), {
            preserveScroll: true,
        });
    };

    const submitCode = (e) => {
        e.preventDefault();
        post(route('auth.verify-code'), {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-50">
            <Head title="Вход" />

            <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Система видеопитчинга</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {isCodeSent 
                            ? 'Введите код, отправленный на ваш email' 
                            : 'Введите ваш email для входа'}
                    </p>
                </div>

                {!isCodeSent ? (
                    <form onSubmit={submitEmail}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email адрес
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end mt-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Отправка...' : 'Получить код'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitCode}>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 font-medium">Email: {data.email}</p>
                        </div>
                        
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                Код подтверждения (6 цифр)
                            </label>
                            <input
                                id="code"
                                type="text"
                                name="code"
                                value={data.code}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border text-center tracking-widest text-lg"
                                onChange={(e) => setData('code', e.target.value)}
                                required
                                maxLength={6}
                                autoFocus
                            />
                            {errors.code && (
                                <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end mt-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Проверка...' : 'Войти'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
