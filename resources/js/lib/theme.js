export const THEME_STORAGE_KEY = 'pitch-ai-theme';

export const THEMES = {
    dark: 'dark',
    light: 'light',
};

export function getStoredTheme() {
    if (typeof window === 'undefined') {
        return THEMES.dark;
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return stored === THEMES.light ? THEMES.light : THEMES.dark;
}

export function applyTheme(theme) {
    const resolved = theme === THEMES.light ? THEMES.light : THEMES.dark;

    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
}
