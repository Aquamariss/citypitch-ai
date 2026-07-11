import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Lightbulb, BarChart2, DollarSign, Users, Megaphone, ChevronDown } from 'lucide-react';

const tips = [
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

function TipItem({ tip, index }) {
    const [open, setOpen] = useState(false);
    const Icon = tip.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left"
            >
                <div
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                    style={{
                        backgroundColor: open ? tip.colorSubtle : 'transparent',
                        border: `1px solid ${open ? tip.color + '30' : 'var(--border-subtle)'}`,
                    }}
                    onMouseEnter={(e) => { if (!open) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-default)'; } }}
                    onMouseLeave={(e) => { if (!open) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; } }}
                >
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                        style={{ backgroundColor: tip.colorSubtle, color: tip.color }}
                    >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-zinc-200">{tip.title}</span>
                            <span className="text-xs text-zinc-600 hidden sm:inline">· {tip.subtitle}</span>
                        </div>
                    </div>
                    <ChevronDown
                        className="w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform duration-200"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p
                            className="text-xs leading-relaxed px-3 pt-2 pb-3"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {tip.text}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function PitchRules() {
    return (
        <div
            className="w-full rounded-2xl flex flex-col h-full overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
            }}
        >
            <div
                className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <Lightbulb className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-zinc-200">Памятка питчинга</h3>
                <span className="ml-auto text-xs text-zinc-600">6 шагов</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {tips.map((tip, i) => (
                    <TipItem key={i} tip={tip} index={i} />
                ))}
            </div>

            <div
                className="px-4 py-3 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <p className="text-xs text-zinc-600 text-center">
                    Нажмите на шаг, чтобы раскрыть советы
                </p>
            </div>
        </div>
    );
}
