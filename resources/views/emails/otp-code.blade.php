<x-mail::message>
# Вход в систему видеопитчинга

Ваш код подтверждения:

<x-mail::panel>
**{{ $code }}**
</x-mail::panel>

Код действителен в течение 10 минут.

Спасибо,<br>
{{ config('app.name') }}
</x-mail::message>
