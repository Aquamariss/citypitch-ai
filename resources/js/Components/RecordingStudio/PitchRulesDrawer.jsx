import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PitchRulesContent } from '@/Components/PitchRules';

export default function PitchRulesDrawer({ open, onClose }) {
    const panelRef = useRef(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const update = () => setIsDesktop(mediaQuery.matches);

        update();
        mediaQuery.addEventListener('change', update);

        return () => mediaQuery.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !panelRef.current) {
            return undefined;
        }

        const focusable = panelRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        focusable?.focus();

        return undefined;
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Закрыть памятку"
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.aside
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Памятка питчинга"
                        className="fixed z-50 flex flex-col overflow-hidden
                            inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl
                            lg:inset-y-0 lg:left-auto lg:right-0 lg:bottom-auto lg:max-h-none lg:w-80 lg:rounded-none lg:rounded-l-2xl"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                        }}
                        initial={isDesktop ? { x: '100%' } : { y: '100%' }}
                        animate={isDesktop ? { x: 0 } : { y: 0 }}
                        exit={isDesktop ? { x: '100%' } : { y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    >
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b shrink-0 lg:hidden"
                            style={{ borderColor: 'var(--border-subtle)' }}
                        >
                            <div className="w-10 h-1 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" style={{ backgroundColor: 'var(--border-default)' }} />
                            <span className="text-sm font-semibold text-zinc-200 mt-2">Памятка питчинга</span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors mt-2"
                                aria-label="Закрыть"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center justify-end px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                aria-label="Закрыть памятку"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden">
                            <PitchRulesContent embedded />
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
