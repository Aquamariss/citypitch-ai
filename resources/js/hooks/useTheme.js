import { useCallback, useState } from 'react';
import { applyTheme, getStoredTheme, THEMES } from '@/lib/theme';

export function useTheme() {
    const [theme, setThemeState] = useState(getStoredTheme);

    const setTheme = useCallback((nextTheme) => {
        const resolved = nextTheme === THEMES.light ? THEMES.light : THEMES.dark;

        setThemeState(resolved);
        applyTheme(resolved);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === THEMES.dark ? THEMES.light : THEMES.dark);
    }, [setTheme, theme]);

    return {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === THEMES.dark,
    };
}
