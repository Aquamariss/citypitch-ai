export const THEME_STORAGE_KEY = 'pitch-ai-theme';

export type Theme = 'dark' | 'light';

export const THEMES: Record<Theme, Theme> = {
    dark: 'dark',
    light: 'light',
};

export function getStoredTheme(): Theme {
    if (typeof window === 'undefined') {
        return THEMES.dark;
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return stored === THEMES.light ? THEMES.light : THEMES.dark;
}

export function applyTheme(theme: Theme): void {
    const resolved: Theme = theme === THEMES.light ? THEMES.light : THEMES.dark;

    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
}
