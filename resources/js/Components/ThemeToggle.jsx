import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle({ variant = 'sidebar' }) {
    const { toggleTheme, isDark } = useTheme();

    const isSidebar = variant === 'sidebar';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={
                isSidebar
                    ? 'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200'
                    : 'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200'
            }
            style={{
                color: 'var(--text-secondary)',
                ...(isSidebar ? {} : {
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                }),
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.color = 'var(--text-primary)';
                if (isSidebar) {
                    event.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
                }
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.color = 'var(--text-secondary)';
                if (isSidebar) {
                    event.currentTarget.style.backgroundColor = 'transparent';
                }
            }}
            title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
            {isDark ? (
                <Sun className={isSidebar ? 'w-4 h-4 shrink-0' : 'w-4 h-4'} strokeWidth={1.5} />
            ) : (
                <Moon className={isSidebar ? 'w-4 h-4 shrink-0' : 'w-4 h-4'} strokeWidth={1.5} />
            )}
            {isSidebar && (isDark ? 'Светлая тема' : 'Тёмная тема')}
        </button>
    );
}
