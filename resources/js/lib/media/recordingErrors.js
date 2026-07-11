export const MIN_BLOB_SIZE = 1024;

const ERROR_MESSAGES = {
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

export const mapRecordingError = (error) => {
    if (!error) {
        return ERROR_MESSAGES.recorder_error;
    }

    if (typeof error === 'string') {
        return ERROR_MESSAGES[error] ?? ERROR_MESSAGES.recorder_error;
    }

    if (error?.name && ERROR_MESSAGES[error.name]) {
        return ERROR_MESSAGES[error.name];
    }

    if (error?.message && ERROR_MESSAGES[error.message]) {
        return ERROR_MESSAGES[error.message];
    }

    return ERROR_MESSAGES.recorder_error;
};
