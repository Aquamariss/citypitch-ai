import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { pitchTips } from '@/lib/pitchTips';

export { pitchTips as tips };

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
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full text-left"
            >
                <div
                    className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                    style={{
                        backgroundColor: open ? tip.colorSubtle : 'transparent',
                        border: `1px solid ${open ? tip.color + '30' : 'var(--border-subtle)'}`,
                    }}
                    onMouseEnter={(event) => {
                        if (!open) {
                            event.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                            event.currentTarget.style.borderColor = 'var(--border-default)';
                        }
                    }}
                    onMouseLeave={(event) => {
                        if (!open) {
                            event.currentTarget.style.backgroundColor = 'transparent';
                            event.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }
                    }}
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

export function PitchRulesContent({ embedded = false }) {
    return (
        <div
            className={`w-full flex flex-col h-full overflow-hidden ${embedded ? '' : 'rounded-2xl'}`}
            style={{
                backgroundColor: embedded ? 'transparent' : 'var(--bg-card)',
                border: embedded ? 'none' : '1px solid var(--border-subtle)',
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
                {pitchTips.map((tip, index) => (
                    <TipItem key={tip.title} tip={tip} index={index} />
                ))}
            </div>

            <div
                className="px-4 py-3 border-t shrink-0"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <p className="text-xs text-zinc-600 text-center">
                    Нажмите на шаг, чтобы раскрыть советы
                </p>
            </div>
        </div>
    );
}

export default function PitchRules() {
    return <PitchRulesContent />;
}
