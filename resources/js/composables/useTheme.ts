import { computed, reactive, ref } from 'vue';
import { applyTheme, getStoredTheme, THEMES, type Theme } from '@/lib/theme';

export function useTheme() {
    const theme = ref<Theme>(getStoredTheme());

    const setTheme = (nextTheme: Theme) => {
        const resolved: Theme = nextTheme === THEMES.light ? THEMES.light : THEMES.dark;

        theme.value = resolved;
        applyTheme(resolved);
    };

    const toggleTheme = () => {
        setTheme(theme.value === THEMES.dark ? THEMES.light : THEMES.dark);
    };

    return reactive({
        theme,
        setTheme,
        toggleTheme,
        isDark: computed(() => theme.value === THEMES.dark),
    });
}
