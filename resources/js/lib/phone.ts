/**
 * Маска телефона на форме входа.
 *
 * По умолчанию российский формат +7 (900) 123-45-67: ведущая 8 и номер без
 * кода страны считаются российскими. Если начать с «+» и другого кода страны,
 * номер остаётся международным — без маски, до 15 цифр.
 */

const RU_DIGITS = 11;
const MAX_DIGITS = 15;
const MIN_INTERNATIONAL_DIGITS = 8;

function isInternational(value: string, digits: string): boolean {
    return value.trimStart().startsWith('+') && digits !== '' && !digits.startsWith('7');
}

export function formatPhone(value: string): string {
    let digits = value.replace(/\D/g, '');

    if (digits === '') {
        return value.trimStart().startsWith('+') ? '+' : '';
    }

    if (isInternational(value, digits)) {
        return `+${digits.slice(0, MAX_DIGITS)}`;
    }

    if (digits.startsWith('8')) {
        digits = `7${digits.slice(1)}`;
    } else if (!digits.startsWith('7')) {
        digits = `7${digits}`;
    }

    const local = digits.slice(1, RU_DIGITS);
    let formatted = '+7';

    // Скобку и дефисы добавляем только после следующей цифры, чтобы Backspace
    // не упирался в автоматически вставленный символ.
    if (local.length > 0) {
        formatted += ` (${local.slice(0, 3)}`;
    }

    if (local.length > 3) {
        formatted += `) ${local.slice(3, 6)}`;
    }

    if (local.length > 6) {
        formatted += `-${local.slice(6, 8)}`;
    }

    if (local.length > 8) {
        formatted += `-${local.slice(8, 10)}`;
    }

    return formatted;
}

export function isPhoneComplete(value: string): boolean {
    const digits = value.replace(/\D/g, '');

    if (isInternational(value, digits)) {
        return digits.length >= MIN_INTERNATIONAL_DIGITS && digits.length <= MAX_DIGITS;
    }

    return digits.length === RU_DIGITS;
}
