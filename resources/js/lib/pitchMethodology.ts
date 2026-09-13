import { computed, type Component, type ComputedRef } from 'vue';
import { usePage } from '@inertiajs/vue3';
import {
    ArrowRight,
    BarChart2,
    Circle,
    Heart,
    Lightbulb,
    Megaphone,
    Search,
    Target,
    User,
    Users,
} from 'lucide-vue-next';

/**
 * Методика питчинга городских проектов приходит с бэкенда как общий Inertia-проп
 * (config/pitch_methodology.php). На фронте её нигде не дублируем.
 */

export type BlockKey = string;

export interface MethodologyBlock {
    key: BlockKey;
    title: string;
    limit: number;
    icon: string;
    color: string;
    hint: string;
    checklist: string[];
    example: string | null;
}

export interface MethodologyCriterion {
    title: string;
    weight: number;
    source: 'code' | 'ai' | 'hybrid';
    description: string;
}

export interface Methodology {
    version: string;
    recommended_seconds: number;
    hard_limit_seconds: number;
    pass_threshold: number;
    speech_rate_words_per_minute: number;
    blocks: MethodologyBlock[];
    criteria: Record<string, MethodologyCriterion>;
}

const FALLBACK: Methodology = {
    version: '',
    recommended_seconds: 600,
    hard_limit_seconds: 720,
    pass_threshold: 60,
    speech_rate_words_per_minute: 140,
    blocks: [],
    criteria: {},
};

const ICONS: Record<string, Component> = {
    ArrowRight,
    BarChart2,
    Heart,
    Lightbulb,
    Megaphone,
    Search,
    Target,
    User,
    Users,
};

export function methodology(): Methodology {
    const shared = (usePage().props as Record<string, unknown>).methodology as Methodology | undefined;

    return shared ?? FALLBACK;
}

export function useMethodology(): ComputedRef<Methodology> {
    return computed(() => methodology());
}

export function methodologyBlocks(): MethodologyBlock[] {
    return methodology().blocks ?? [];
}

export function blockKeys(): BlockKey[] {
    return methodologyBlocks().map((block) => block.key);
}

export function blockLabels(): Record<BlockKey, string> {
    return Object.fromEntries(methodologyBlocks().map((block) => [block.key, block.title]));
}

export function blockLabel(key: BlockKey): string {
    return blockLabels()[key] ?? key;
}

export function blockIcon(name: string): Component {
    return ICONS[name] ?? Circle;
}

/**
 * Подсветка блока в интерфейсе: цвет из методики плюс его полупрозрачная версия.
 */
export function blockColorSubtle(color: string, alpha = 0.1): string {
    const hex = color.replace('#', '');

    if (hex.length !== 6) {
        return color;
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}

export function formatClock(seconds: number): string {
    const safe = Math.max(0, Math.round(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}

/**
 * Сколько примерно будет звучать текст блока при среднем темпе устной речи.
 * Нужен, чтобы человек видел, помещается ли блок в свой ориентир.
 */
export function estimateSpeakingSeconds(text: string, wordsPerMinute: number): number {
    const words = text.trim().split(/\s+/).filter(Boolean).length;

    if (words === 0 || wordsPerMinute <= 0) {
        return 0;
    }

    return Math.round((words / wordsPerMinute) * 60);
}
