export default function ProcessingOverlay({ progress }) {
    return (
        <div className="flex-1 min-h-0 flex items-center justify-center p-6">
            <div className="card proc-card" aria-busy="true">
                <div className="spin" aria-hidden="true" />
                <h1>Загружаем запись</h1>
                <p>Отправляем файл на сервер перед транскрипцией и AI-разбором.</p>
                <div
                    className="proc-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress?.percentage ?? 8}
                >
                    <div className="proc-fill" style={{ width: `${progress?.percentage ?? 8}%` }} />
                </div>
                <p className="proc-status" aria-live="polite">
                    {progress ? `Загрузка ${progress.percentage}%` : 'Подготовка…'}
                </p>
            </div>
        </div>
    );
}
