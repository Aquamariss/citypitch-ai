import { Head, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Hash, ArrowRight, Loader2 } from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function Login() {
    const { status } = usePage().props;
    const isCodeSent = status === 'code-sent';

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        code: '',
    });

    const submitEmail = (e) => {
        e.preventDefault();
        post(route('auth.send-code'), { preserveScroll: true });
    };

    const submitCode = (e) => {
        e.preventDefault();
        post(route('auth.verify-code'), { preserveScroll: true });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-base)' }}
        >
            <Head title="Вход — Pitch AI" />

            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle variant="compact" />
            </div>

            {/* Background glow */}
            <div
                className="absolute inset-0 pointer-events-none login-page-glow"
                style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(124,58,237,0.08) 0%, transparent 70%)',
                }}
            />

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] login-page-grid"
                style={{
                    backgroundImage: 'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative w-full max-w-sm"
            >
                <div
                    className="rounded-2xl p-8"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                    }}
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 animate-glow"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                        >
                            <Zap className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-100">Pitch AI</h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {isCodeSent
                                ? 'Введите код из письма'
                                : 'Войдите, чтобы начать'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div
                            className="flex-1 h-0.5 rounded-full"
                            style={{ backgroundColor: isCodeSent ? 'var(--accent-primary)' : 'var(--accent-primary)' }}
                        />
                        <div
                            className="flex-1 h-0.5 rounded-full transition-colors duration-300"
                            style={{ backgroundColor: isCodeSent ? 'var(--accent-primary)' : 'var(--border-default)' }}
                        />
                    </div>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {!isCodeSent ? (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={submitEmail}
                            >
                                <div className="mb-4">
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-medium mb-2"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Email адрес
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                            style={{ color: 'var(--text-muted)' }}
                                            strokeWidth={1.5}
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoFocus
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none transition-all duration-200"
                                            style={{
                                                backgroundColor: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-default)',
                                                color: 'var(--text-primary)',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--accent-primary)';
                                                e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-default)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                                    style={{
                                        backgroundColor: 'var(--accent-primary)',
                                        boxShadow: '0 0 20px var(--accent-glow)',
                                    }}
                                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--accent-hover)'; e.target.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--accent-primary)'; e.target.style.transform = ''; }}
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Получить код
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="code"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={submitCode}
                            >
                                <div
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs"
                                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                                >
                                    <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                                    <span className="truncate">Код отправлен на {data.email}</span>
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="code"
                                        className="block text-xs font-medium mb-2"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Код подтверждения
                                    </label>
                                    <div className="relative">
                                        <Hash
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                            style={{ color: 'var(--text-muted)' }}
                                            strokeWidth={1.5}
                                        />
                                        <input
                                            id="code"
                                            type="text"
                                            name="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            required
                                            autoFocus
                                            maxLength={6}
                                            placeholder="000000"
                                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg outline-none text-center tracking-[0.4em] font-mono transition-all duration-200"
                                            style={{
                                                backgroundColor: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-default)',
                                                color: 'var(--text-primary)',
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'var(--accent-primary)';
                                                e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-default)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                    {errors.code && (
                                        <p className="mt-1.5 text-xs text-red-400">{errors.code}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                                    style={{
                                        backgroundColor: 'var(--accent-primary)',
                                        boxShadow: '0 0 20px var(--accent-glow)',
                                    }}
                                    onMouseEnter={(e) => { if (!processing) { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; e.currentTarget.style.transform = ''; }}
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Войти
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                    Система видеопитчинга для инвесторов
                </p>
            </motion.div>
        </div>
    );
}
