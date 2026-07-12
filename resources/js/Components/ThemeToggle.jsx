import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <button
            type="button"
            className={`theme-toggle ${className}`.trim()}
            onClick={toggleTheme}
            aria-pressed={isDark ? 'false' : 'true'}
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
            {isDark ? (
                <Sun strokeWidth={1.5} aria-hidden="true" />
            ) : (
                <Moon strokeWidth={1.5} aria-hidden="true" />
            )}
        </button>
    );
}
