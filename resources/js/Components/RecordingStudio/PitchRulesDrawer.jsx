import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const RULES = [
    'Оптимальная длина — 60–90 секунд.',
    'Держите структуру: проблема → решение → рынок → модель → команда → CTA.',
    'Называйте конкретные цифры, не общие формулировки.',
    'Завершите явным призывом к действию.',
    'После записи можно переснять или отправить на AI-разбор.',
];

export default function PitchRulesDrawer({ open, onClose }) {
    const closeRef = useRef(null);

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
        closeRef.current?.focus();

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    return (
        <div className={`rules-drawer${open ? ' is-open' : ''}`} aria-hidden={open ? 'false' : 'true'}>
            <div className="rules-backdrop" onClick={onClose} />
            <div className="rules-sheet" id="rules-sheet" role="dialog" aria-modal="true" aria-labelledby="rules-title">
                <div className="rules-sheet-header">
                    <h3 id="rules-title">Правила записи</h3>
                    <button
                        ref={closeRef}
                        type="button"
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <X strokeWidth={1.5} aria-hidden="true" />
                    </button>
                </div>
                <ul>
                    {RULES.map((rule) => (
                        <li key={rule}>{rule}</li>
                    ))}
                </ul>
                <button type="button" className="btn btn-secondary" onClick={onClose} style={{ marginTop: 20, width: '100%' }}>
                    Понятно
                </button>
            </div>
        </div>
    );
}
