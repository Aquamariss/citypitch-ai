export const MIN_BLOB_SIZE = 1024;

const ERROR_MESSAGES: Record<string, string> = {
    NotAllowedError: 'Разрешите доступ к микрофону и камере в настройках браузера.',
    NotFoundError: 'Микрофон или камера не найдены. Подключите устройство и перезагрузите страницу.',
    NotReadableError: 'Устройство занято другим приложением. Закройте его и попробуйте снова.',
    OverconstrainedError: 'Не удалось подключить выбранное устройство. Попробуйте другое.',
    SecurityError: 'Браузер заблокировал доступ к устройствам записи.',
    AbortError: 'Подключение к устройствам было прервано.',
    empty_blob: 'Запись пуста — попробуйте записать снова.',
    stream_failed: 'Не удалось получить поток с микрофона или камеры.',
    timeout: 'Не удалось подключить устройства. Перезагрузите страницу.',
    unsupported: 'Ваш браузер не поддерживает запись аудио и видео.',
    recorder_error: 'Произошла ошибка во время записи. Попробуйте снова.',
};

export const mapRecordingError = (error: unknown): string => {
    const err = error as { name?: string; message?: string } | string | null | undefined;
    const key = typeof err === 'string' ? err : err?.name;

    return (key && ERROR_MESSAGES[key]) || ERROR_MESSAGES.recorder_error;
};
