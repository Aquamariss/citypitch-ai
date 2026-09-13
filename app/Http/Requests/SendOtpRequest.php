<?php

namespace App\Http\Requests;

use App\DTO\UserProfileDto;
use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    /**
     * Российский номер: +7 и десять цифр. Международный: код страны
     * не с семёрки, всего от 8 до 15 цифр (E.164).
     */
    private const PHONE_PATTERN = '/^\+(7\d{10}|[1-689]\d{7,14})$/';

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email', ''))),
            'phone' => $this->normalizePhone((string) $this->input('phone', '')),
            'full_name' => $this->nullableTrimmed('full_name'),
            'city' => $this->nullableTrimmed('city'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'regex:'.self::PHONE_PATTERN],
            'city' => ['nullable', 'string', 'max:255'],
            'personal_data_consent' => ['accepted'],
            'marketing_consent' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Укажите email.',
            'email.email' => 'Проверьте email — похоже, в нём ошибка.',
            'phone.required' => 'Укажите номер телефона.',
            'phone.regex' => 'Проверьте номер телефона: например, +7 (900) 123-45-67.',
            'personal_data_consent.accepted' => 'Без согласия на обработку персональных данных войти нельзя.',
        ];
    }

    public function toProfile(): UserProfileDto
    {
        return new UserProfileDto(
            email: $this->validated('email'),
            phone: $this->validated('phone'),
            fullName: $this->validated('full_name'),
            city: $this->validated('city'),
            marketingConsent: $this->boolean('marketing_consent'),
        );
    }

    /**
     * Приводит номер к виду +79001234567: «8 (900) …» и «900 …» без кода
     * страны считаются российскими.
     */
    private function normalizePhone(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        if ($digits === '') {
            return '';
        }

        $hasCountryCode = str_starts_with(ltrim($raw), '+');

        if (! $hasCountryCode && strlen($digits) === 11 && $digits[0] === '8') {
            $digits = '7'.substr($digits, 1);
        }

        if (! $hasCountryCode && strlen($digits) === 10) {
            $digits = '7'.$digits;
        }

        return '+'.$digits;
    }

    private function nullableTrimmed(string $key): ?string
    {
        $value = trim((string) $this->input($key, ''));

        return $value === '' ? null : $value;
    }
}
