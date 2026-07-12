import { useRef } from 'react';

export default function ChatComposer({ isBusy, onSend, onStop, disabled = false }) {
    const inputRef = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();

        const content = inputRef.current?.value ?? '';

        if (!content.trim() || isBusy || disabled) {
            return;
        }

        onSend(content);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <form className="chat-compose" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="writer-input">
                Сообщение AI
            </label>
            <input
                ref={inputRef}
                className="input"
                id="writer-input"
                type="text"
                placeholder="Ответьте AI или попросите переписать блок…"
                autoComplete="off"
                disabled={disabled || isBusy}
            />
            {isBusy ? (
                <button type="button" className="btn btn-secondary" onClick={onStop}>
                    Стоп
                </button>
            ) : (
                <button type="submit" className="btn btn-primary" disabled={disabled}>
                    Отправить
                </button>
            )}
        </form>
    );
}
