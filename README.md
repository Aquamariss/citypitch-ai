# Pitch AI

Инструмент для подготовки к инвестиционному питчу: AI-помощник для текста, студия записи и разбор выступления по критериям.

## Возможности

- **Pitch Writer** — чат с AI и черновик питча по блокам
- **Recording Studio** — запись видео- или аудиопитча в браузере
- **Анализ** — транскрипция, оценка по критериям, приоритетные правки
- **История** — прошлые попытки и динамика оценок
- **Вход по OTP** — авторизация по email-коду

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Laravel 13, PHP 8.5, MySQL, Redis, queues |
| Frontend | Inertia.js, React 19, Vite, Tailwind CSS 4 |
| AI | OpenAI (чат, транскрипция, анализ) |
| Dev | Laravel Sail (Docker) |

Доменная логика: `app/Domains/{Auth,Pitching}` — сервисы и репозитории.

## Требования

- Docker и Docker Compose
- [Laravel Sail](https://laravel.com/docs/sail) (через Composer)

## Быстрый старт

```bash
cp .env.example .env
composer install
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
```

В `.env` укажите:

```env
OPENAI_API_KEY=sk-...
# при необходимости:
# OPENAI_BASE_URL=
# OPENAI_ORGANIZATION=
```

Приложение: [http://localhost](http://localhost) (порт задаётся `APP_PORT`).

Для локальной разработки с hot reload:

```bash
./vendor/bin/sail npm run dev
./vendor/bin/sail artisan queue:listen
```

или `composer run dev` внутри контейнера (сервер + queue + Vite).

## Полезные команды

```bash
./vendor/bin/sail artisan test          # тесты
./vendor/bin/sail bin pint --dirty      # стиль PHP
./vendor/bin/sail artisan migrate       # миграции
./vendor/bin/sail open                 # открыть в браузере
```

## Основные экраны

| Маршрут | Назначение |
|---------|------------|
| `/login` | OTP-вход |
| `/pitch-writer` | Написание питча |
| `/pitch` | Студия и история |
| `/pitch/{id}/status` | Статус обработки |
| `/pitch/{id}/result` | Результат анализа |
