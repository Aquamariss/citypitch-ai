<?php

namespace App\DTO;

/**
 * Анкета участника с формы входа.
 *
 * Согласие на обработку персональных данных здесь не хранится: без него
 * анкета не проходит валидацию, поэтому сам факт существования DTO и есть
 * согласие.
 */
readonly class UserProfileDto
{
    public function __construct(
        public string $email,
        public string $phone,
        public ?string $fullName,
        public ?string $city,
        public bool $marketingConsent,
    ) {}

    /**
     * @return array{email: string, phone: string, full_name: string|null, city: string|null, marketing_consent: bool}
     */
    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'phone' => $this->phone,
            'full_name' => $this->fullName,
            'city' => $this->city,
            'marketing_consent' => $this->marketingConsent,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            email: (string) ($data['email'] ?? ''),
            phone: (string) ($data['phone'] ?? ''),
            fullName: isset($data['full_name']) ? (string) $data['full_name'] : null,
            city: isset($data['city']) ? (string) $data['city'] : null,
            marketingConsent: (bool) ($data['marketing_consent'] ?? false),
        );
    }
}
