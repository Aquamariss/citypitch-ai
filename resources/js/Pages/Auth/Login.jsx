import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Loader2 } from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';
import LogoMark from '@/Components/LogoMark';

export default function Login() {
    const { status, errors: pageErrors } = usePage().props;
    const [step, setStep] = useState(status === 'code-sent' ? 'code' : 'email');

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        email: '',
        code: '',
    });

    const submitEmail = (e) => {
        e.preventDefault();
        post(route('auth.send-code'), {
            preserveScroll: true,
            onSuccess: () => setStep('code'),
        });
    };

    const submitCode = (e) => {
        e.preventDefault();
        post(route('auth.verify-code'), { preserveScroll: true });
    };

    const backToEmail = () => {
        clearErrors();
        setData('code', '');
        setStep('email');
    };

    const showCode = step === 'code';

    return (
        <div className="login-page">
            <Head title="Вход — Pitch AI" />

            <header className="app-header app-header--standalone">
                <a className="app-brand" href={route('login')}>
                    <LogoMark size={24} />
                    <strong>Pitch AI</strong>
                </a>
                <ThemeToggle />
            </header>

            <div className="login-card">
                <div className="login-brand">
                    <LogoMark size={28} />
                    <h1>Pitch AI</h1>
                </div>

                {!showCode ? (
                    <form onSubmit={submitEmail}>
                        <h2>Вход по email</h2>
                        <p className="lead">Без пароля. Пришлём одноразовый код для доступа к студии.</p>

                        <div className={`field${errors.email ? ' has-error' : ''}`}>
                            <label htmlFor="login-email">Email</label>
                            <div className="input-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="m3 7 9 6 9-6" />
                                </svg>
                                <input
                                    className={`input${errors.email ? ' input-error' : ''}`}
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@startup.com"
                                    autoComplete="email"
                                    inputMode="email"
                                    required
                                    autoFocus
                                    aria-describedby="login-email-hint login-email-error"
                                />
                            </div>
                            <span className="field-hint" id="login-email-hint">
                                Используем только для входа — без рассылок.
                            </span>
                            {(errors.email || pageErrors?.email) && (
                                <span className="field-error is-visible" id="login-email-error" role="alert">
                                    {errors.email || pageErrors.email}
                                </span>
                            )}
                        </div>

                        <div className="login-actions">
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Получить код'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitCode}>
                        <h2>Введите код</h2>
                        <p className="lead">
                            Шестизначный код отправлен на <strong>{data.email || 'ваш email'}</strong>. Действует 10 минут.
                        </p>

                        <div className={`field${errors.code ? ' has-error' : ''}`}>
                            <label htmlFor="login-code">Код из письма</label>
                            <input
                                className={`input code${errors.code ? ' input-error' : ''}`}
                                id="login-code"
                                type="text"
                                name="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="one-time-code"
                                placeholder="000000"
                                required
                                autoFocus
                                aria-describedby="login-code-error"
                            />
                            {(errors.code || pageErrors?.code) && (
                                <span className="field-error is-visible" id="login-code-error" role="alert">
                                    {errors.code || pageErrors.code}
                                </span>
                            )}
                        </div>

                        <div className="login-actions">
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Войти'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={backToEmail}>
                                Изменить email
                            </button>
                        </div>
                        <p className="login-meta">Не пришло? Проверьте спам или запросите код снова через 30 сек.</p>
                    </form>
                )}
            </div>
        </div>
    );
}
