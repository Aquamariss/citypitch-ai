export const SCRIPT_STORAGE_KEY = 'pitch-ai-script';
export const TELEPROMPTER_SETTINGS_KEY = 'pitch-ai-teleprompter-settings';

export interface PitchTip {
    title: string;
    subtitle: string;
}

export const PITCH_TIPS: PitchTip[] = [
    { title: 'Проблема', subtitle: 'Problem' },
    { title: 'Решение', subtitle: 'Solution' },
    { title: 'Рынок', subtitle: 'Market' },
    { title: 'Бизнес-модель', subtitle: 'Business Model' },
    { title: 'Команда', subtitle: 'Team' },
    { title: 'Запрос', subtitle: 'Call to Action' },
];

export type FontSizeKey = 'S' | 'M' | 'L' | 'XL';

export const FONT_SIZES: Record<FontSizeKey, number> = {
    S: 20,
    M: 24,
    L: 28,
    XL: 34,
};

export interface TeleprompterSettings {
    fontSize: FontSizeKey;
    scrollMode: string;
    manualSpeed: number;
    speedMultiplier: number;
}

export const DEFAULT_TELEPROMPTER_SETTINGS: TeleprompterSettings = {
    fontSize: 'L',
    scrollMode: 'auto',
    manualSpeed: 90,
    speedMultiplier: 1,
};

export function generatePitchTemplate(): string {
    return PITCH_TIPS.map((tip, index) => (
        `${index + 1}. ${tip.title} (${tip.subtitle})\n\n`
    )).join('\n');
}

export function getStoredScript(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    return localStorage.getItem(SCRIPT_STORAGE_KEY) ?? '';
}

export function saveScript(text: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(SCRIPT_STORAGE_KEY, text);
}

export function getStoredTeleprompterSettings(): TeleprompterSettings {
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

export function saveTeleprompterSettings(settings: TeleprompterSettings): void {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(TELEPROMPTER_SETTINGS_KEY, JSON.stringify(settings));
}
