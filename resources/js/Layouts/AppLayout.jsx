import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Mic, Clock, LogOut, Zap } from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';

const navItems = [
    {
        href: (r) => route('pitch.index'),
        label: 'Новая запись',
        icon: Mic,
        isActive: (pathname, search) =>
            !search.includes('tab=history') && pathname === new URL(route('pitch.index'), window.location).pathname,
    },
    {
        href: () => `${route('pitch.index')}?tab=history`,
        label: 'История',
        icon: Clock,
        isActive: (pathname, search) => search.includes('tab=history'),
    },
];

function NavItem({ item }) {
    const isActive = item.isActive(window.location.pathname, window.location.search);
    return (
        <Link
            href={item.href()}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                    ? 'bg-violet-600/15 text-violet-400'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
            }`}
        >
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
            )}
            <item.icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                strokeWidth={1.5}
            />
            {item.label}
        </Link>
    );
}

function AttemptsDisplay({ used, max }) {
    const percentage = max > 0 ? (used / max) * 100 : 0;
    const isWarning = percentage >= 70;
    const isCritical = percentage >= 100;

    return (
        <div className="px-3 py-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>Попытки</span>
                <span className={`font-mono font-medium ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {used}/{max}
                </span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-violet-600'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

export default function AppLayout({ children }) {
    const { auth_email, attempts_used, max_attempts } = usePage().props;

    const avatarLetter = auth_email ? auth_email.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-base)' }}>
            {/* Sidebar */}
            <aside
                className="hidden md:flex w-[220px] shrink-0 flex-col border-r"
                style={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-subtle)' }}
            >
                {/* Logo */}
                <div
                    className="h-14 flex items-center px-4 border-b shrink-0"
                    style={{ borderColor: 'var(--border-subtle)' }}
                >
                    <Link href={route('pitch.index')} className="flex items-center gap-2.5 group">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 animate-glow"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                        >
                            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
                        </div>
                        <span className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                            Pitch AI
                        </span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-0.5">
                    {navItems.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </nav>

                {/* Bottom */}
                <div
                    className="border-t p-3 space-y-1"
                    style={{ borderColor: 'var(--border-subtle)' }}
                >
                    <ThemeToggle variant="sidebar" />
                    <AttemptsDisplay used={attempts_used} max={max_attempts} />

                    <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}
                        >
                            {avatarLetter}
                        </div>
                        <span className="text-xs text-zinc-400 truncate flex-1">{auth_email}</span>
                        <Link
                            href={route('auth.logout')}
                            method="post"
                            as="button"
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                            title="Выйти"
                        >
                            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header
                    className="md:hidden h-14 flex items-center justify-between px-4 border-b shrink-0 backdrop-blur-md"
                    style={{
                        backgroundColor: 'var(--mobile-header-bg)',
                        borderColor: 'var(--border-subtle)',
                    }}
                >
                    <Link href={route('pitch.index')} className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                        >
                            <Zap className="w-3 h-3 text-white" fill="currentColor" />
                        </div>
                        <span className="text-sm font-bold text-zinc-100">Pitch AI</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-mono">
                            {attempts_used}/{max_attempts}
                        </span>
                        <ThemeToggle variant="compact" />
                        <Link
                            href={route('auth.logout')}
                            method="post"
                            as="button"
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto">
                    {/* Flash messages */}
                    {usePage().props.status && (
                        <div
                            className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
                            style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                            <span>✓</span>
                            {usePage().props.status === 'code-sent' ? 'Код успешно отправлен!' : usePage().props.status}
                        </div>
                    )}

                    {Object.keys(usePage().props.errors || {}).length > 0 && (
                        <div
                            className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
                            style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            <p className="font-medium mb-1">Ошибки:</p>
                            <ul className="space-y-0.5">
                                {Object.values(usePage().props.errors).map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <nav
                    className="md:hidden flex border-t shrink-0"
                    style={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-subtle)' }}
                >
                    {navItems.map((item) => {
                        const isActive = item.isActive(window.location.pathname, window.location.search);
                        return (
                            <Link
                                key={item.label}
                                href={item.href()}
                                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                                    isActive ? 'text-violet-400' : 'text-zinc-500'
                                }`}
                            >
                                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
