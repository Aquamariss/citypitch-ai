export const SCRIPT_STORAGE_KEY = 'pitch-ai-script';
export const TELEPROMPTER_SETTINGS_KEY = 'pitch-ai-teleprompter-settings';

export const PITCH_TIPS = [
    { title: 'Проблема', subtitle: 'Problem' },
    { title: 'Решение', subtitle: 'Solution' },
    { title: 'Рынок', subtitle: 'Market' },
    { title: 'Бизнес-модель', subtitle: 'Business Model' },
    { title: 'Команда', subtitle: 'Team' },
    { title: 'Запрос', subtitle: 'Call to Action' },
];

export const FONT_SIZES = {
    S: 16,
    M: 20,
    L: 24,
    XL: 28,
};

export const DEFAULT_TELEPROMPTER_SETTINGS = {
    fontSize: 'M',
    scrollMode: 'auto',
    manualSpeed: 50,
};

export function generatePitchTemplate() {
    return PITCH_TIPS.map((tip, index) => (
        `${index + 1}. ${tip.title} (${tip.subtitle})\n\n`
    )).join('\n');
}

export function getStoredScript() {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem(SCRIPT_STORAGE_KEY) ?? '';
}

export function saveScript(text) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(SCRIPT_STORAGE_KEY, text);
}

export function getStoredTeleprompterSettings() {
    if (typeof window === 'undefined') {
        return DEFAULT_TELEPROMPTER_SETTINGS;
    }

    try {
        const stored = localStorage.getItem(TELEPROMPTER_SETTINGS_KEY);

        if (!stored) {
            return DEFAULT_TELEPROMPTER_SETTINGS;
        }

        return { ...DEFAULT_TELEPROMPTER_SETTINGS, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_TELEPROMPTER_SETTINGS;
    }
}

export function saveTeleprompterSettings(settings) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(TELEPROMPTER_SETTINGS_KEY, JSON.stringify(settings));
}
