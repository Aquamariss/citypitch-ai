import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { PitchRulesContent } from '@/Components/PitchRules';

function MobileTips() {
    const [open, setOpen] = useState(false);

    return (
        <div className="lg:hidden shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
                aria-expanded={open}
            >
                <Lightbulb className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                Памятка питчинга
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>6 шагов</span>
                <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{
                        color: 'var(--text-muted)',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {open && (
                <div
                    className="max-h-64 overflow-hidden border-t"
                    style={{ borderColor: 'var(--border-subtle)' }}
                >
                    <PitchRulesContent embedded />
                </div>
            )}
        </div>
    );
}

function DesktopTips() {
    return (
        <aside
            className="hidden lg:flex w-72 shrink-0 flex-col border-l min-h-0"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-overlay)' }}
        >
            <PitchRulesContent embedded />
        </aside>
    );
}

export default function PitchTipsPanel({ variant = 'both' }) {
    if (variant === 'mobile') {
        return <MobileTips />;
    }

    if (variant === 'desktop') {
        return <DesktopTips />;
    }

    return (
        <>
            <MobileTips />
            <DesktopTips />
        </>
    );
}
