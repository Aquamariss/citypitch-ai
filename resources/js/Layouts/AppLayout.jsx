import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Mic, Clock, LogOut, Bot } from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';
import LogoMark from '@/Components/LogoMark';

const navItems = [
    {
        href: () => route('pitch.index'),
        label: 'Новая запись',
        shortLabel: 'Запись',
        icon: Mic,
        isActive: (pathname, search) =>
            !search.includes('tab=history') && pathname === new URL(route('pitch.index'), window.location).pathname,
    },
    {
        href: () => `${route('pitch.index')}?tab=history`,
        label: 'История',
        shortLabel: 'История',
        icon: Clock,
        isActive: (pathname, search) => search.includes('tab=history'),
    },
    {
        href: () => route('pitch-writer.index'),
        label: 'Питч Райтер',
        shortLabel: 'Райтер',
        icon: Bot,
        isActive: (pathname) => pathname === new URL(route('pitch-writer.index'), window.location).pathname,
    },
];

function NavItem({ item }) {
    const isActive = item.isActive(window.location.pathname, window.location.search);

    return (
        <Link href={item.href()} className={`nav-item${isActive ? ' active' : ''}`}>
            <item.icon strokeWidth={1.5} aria-hidden="true" />
            {item.label}
        </Link>
    );
}

function AttemptsDisplay({ used, max }) {
    const percentage = max > 0 ? (used / max) * 100 : 0;

    return (
        <div className="attempts-bar">
            <div className="attempts-bar-top">
                <span>Попытки</span>
                <span className="mono">{used}/{max}</span>
            </div>
            <div className="attempts-track">
                <div className="attempts-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
            </div>
        </div>
    );
}

export default function AppLayout({ children, chrome = true }) {
    const { auth_email, attempts_used, max_attempts, status, errors } = usePage().props;
    const avatarLetter = auth_email ? auth_email.charAt(0).toUpperCase() : 'U';

    if (!chrome) {
        return (
            <div className="app-shell app-shell--chrome-off">
                <div className="main-col">
                    <div className="main-content">{children}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <Link href={route('pitch.index')} className="sidebar-logo">
                    <LogoMark size={28} />
                    <span>Pitch AI</span>
                </Link>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavItem key={item.label} item={item} />
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <AttemptsDisplay used={attempts_used} max={max_attempts} />

                    <div className="user-row">
                        <div className="user-avatar">{avatarLetter}</div>
                        <span className="user-email">{auth_email}</span>
                        <Link
                            href={route('auth.logout')}
                            method="post"
                            as="button"
                            className="btn-icon"
                            title="Выйти"
                            aria-label="Выйти"
                        >
                            <LogOut strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="main-col">
                <header className="app-header">
                    <Link href={route('pitch.index')} className="app-brand">
                        <LogoMark size={24} />
                        <strong>Pitch AI</strong>
                    </Link>
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="md:hidden text-xs mono" style={{ color: 'var(--muted)' }}>
                            {attempts_used}/{max_attempts}
                        </span>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="main-content">
                    {status && (
                        <div
                            className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
                            style={{
                                backgroundColor: 'var(--success-subtle)',
                                color: 'var(--success)',
                                border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
                            }}
                        >
                            {status === 'code-sent' ? 'Код успешно отправлен!' : status}
                        </div>
                    )}

                    {Object.keys(errors || {}).length > 0 && (
                        <div
                            className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
                            style={{
                                backgroundColor: 'var(--danger-subtle)',
                                color: 'var(--danger)',
                                border: '1px solid color-mix(in oklch, var(--danger) 30%, transparent)',
                            }}
                        >
                            <p className="font-medium mb-1">Ошибки:</p>
                            <ul className="space-y-0.5">
                                {Object.values(errors).map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {children}
                </main>

                <nav className="bottom-nav">
                    {navItems.map((item) => {
                        const isActive = item.isActive(window.location.pathname, window.location.search);

                        return (
                            <Link
                                key={item.label}
                                href={item.href()}
                                className={isActive ? 'active' : undefined}
                            >
                                <item.icon strokeWidth={1.5} aria-hidden="true" />
                                {item.shortLabel}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
