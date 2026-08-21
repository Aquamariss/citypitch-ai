import type { Component } from 'vue';
import { Target, Lightbulb, BarChart2, DollarSign, Users, Megaphone } from 'lucide-vue-next';

export interface PitchTip {
    title: string;
    subtitle: string;
    text: string;
    icon: Component;
    color: string;
    colorSubtle: string;
}

export const pitchTips: PitchTip[] = [
    {
        title: 'Проблема',
        subtitle: 'Problem',
        text: 'С какой реальной болью сталкивается клиент? Кому больно и почему это важно прямо сейчас?',
        icon: Target,
        color: '#ef4444',
        colorSubtle: 'rgba(239,68,68,0.10)',
    },
    {
        title: 'Решение',
        subtitle: 'Solution',
        text: 'Как ваш продукт решает эту проблему? Объясните механизм просто — за 30 секунд.',
        icon: Lightbulb,
        color: '#f59e0b',
        colorSubtle: 'rgba(245,158,11,0.10)',
    },
    {
        title: 'Рынок',
        subtitle: 'Market',
        text: 'Покажите размер рынка. Используйте метрики TAM, SAM, SOM с источниками.',
        icon: BarChart2,
        color: '#06b6d4',
        colorSubtle: 'rgba(6,182,212,0.10)',
    },
    {
        title: 'Бизнес-модель',
        subtitle: 'Business Model',
        text: 'Как вы будете зарабатывать? Назовите юнит-экономику и LTV/CAC.',
        icon: DollarSign,
        color: '#10b981',
        colorSubtle: 'rgba(16,185,129,0.10)',
    },
    {
        title: 'Команда',
        subtitle: 'Team',
        text: 'Почему именно вы? Расскажите о релевантном опыте каждого ключевого участника.',
        icon: Users,
        color: '#8b5cf6',
        colorSubtle: 'rgba(139,92,246,0.10)',
    },
    {
        title: 'Запрос',
        subtitle: 'Call to Action',
        text: 'Что вы хотите от аудитории? Сумму инвестиций, тип партнёра, пилот?',
        icon: Megaphone,
        color: '#7c3aed',
        colorSubtle: 'rgba(124,58,237,0.10)',
    },
];
