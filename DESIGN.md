# DESIGN.md — Pitch AI Design System

> Единый источник правды для дизайна приложения Pitch AI.
> Все компоненты и стили должны строго следовать этим правилам.

---

## 1. Философия дизайна

Pitch AI — это инструмент для подготовки к инвестиционному питчу. Дизайн должен отражать:

- **Профессионализм** — пользователь чувствует, что работает с серьёзным инструментом
- **Фокус** — минимум отвлекающих элементов, максимум погружения в процесс
- **Уверенность** — интерфейс передаёт ощущение AI-powered технологий

Референсы: Linear.app, Vercel Dashboard, Notion AI, Orai, Pitch.com

---

## 2. Цветовая палитра (Dark Mode First)

```
Background:
  --bg-base:        #09090b   (zinc-950) — основной фон
  --bg-card:        #0f0f12   — карточки и панели
  --bg-elevated:    #1a1a24   — поднятые элементы, дропдауны
  --bg-overlay:     #18181d   — оверлеи, сайдбар

Border:
  --border-subtle:  #27272a   (zinc-800)
  --border-default: #3f3f46   (zinc-700)
  --border-strong:  #52525b   (zinc-600)

Text:
  --text-primary:   #fafafa   (zinc-50)
  --text-secondary: #a1a1aa   (zinc-400)
  --text-muted:     #52525b   (zinc-600)

Accent — Electric Violet:
  --accent-primary: #7c3aed   (violet-700)
  --accent-hover:   #6d28d9   (violet-800)
  --accent-glow:    rgba(124,58,237,0.4)
  --accent-subtle:  rgba(124,58,237,0.08)

Status:
  --success:        #10b981   (emerald-500)
  --success-subtle: rgba(16,185,129,0.10)
  --warning:        #f59e0b   (amber-500)
  --warning-subtle: rgba(245,158,11,0.10)
  --danger:         #ef4444   (red-500)
  --danger-subtle:  rgba(239,68,68,0.10)

Recording:
  --record-active:  #ef4444
  --record-pulse:   rgba(239,68,68,0.4)

AI / Processing:
  --ai-primary:     #06b6d4   (cyan-500)
  --ai-secondary:   #7c3aed   (violet-700)
  --ai-gradient:    linear-gradient(135deg, #06b6d4, #7c3aed)
```

---

## 3. Типографика

### Шрифты
```
Primary:  "Inter"          — weights: 400, 500, 600, 700, 800
Mono:     "JetBrains Mono" — weights: 400, 500, 600
                             (таймер, timestamps, код)
```

### Шкала
```
text-xs:   12px / lh 1.5  — подписи, метки, badges
text-sm:   14px / lh 1.6  — навигация, вспомогательный
text-base: 16px / lh 1.7  — основной текст
text-lg:   18px / lh 1.6  — подзаголовки секций
text-xl:   20px / lh 1.4  — заголовки
text-2xl:  24px / lh 1.3  — заголовки страниц
text-3xl:  30px / lh 1.2  — hero элементы
text-5xl:  48px / lh 1.0  — таймер записи (JetBrains Mono)
```

---

## 4. Пространство и геометрия

### Border Radius
```
rounded-sm:   4px   — маленькие badges, теги
rounded-md:   6px   — кнопки, инпуты
rounded-lg:   8px   — компактные карточки
rounded-xl:   12px  — стандартные карточки
rounded-2xl:  16px  — большие панели
rounded-3xl:  24px  — главные контейнеры
rounded-full: 50%   — аватар, кнопка записи, dots
```

### Отступы
```
Внутри: compact p-3 / default p-4 / relaxed p-6 / spacious p-8
Между:  gap-2 (иконка+текст) / gap-4 (карточки) / gap-6 (секции)
```

---

## 5. Тени и глубина

```css
shadow-xs:     0 1px 2px rgba(0,0,0,0.4)     — разделение от фона
shadow-md:     0 4px 12px rgba(0,0,0,0.5)    — карточки, панели
shadow-lg:     0 8px 24px rgba(0,0,0,0.6)    — модалки, дропдауны
shadow-accent: 0 0 24px var(--accent-glow)   — акцентные кнопки
shadow-record: 0 0 32px var(--record-pulse)  — кнопка записи
```

---

## 6. Компоненты

### 6.1 Кнопки

**Primary (Акцентная)**
```
bg: --accent-primary | hover: --accent-hover + translateY(-1px)
active: scale(0.97) | shadow: shadow-accent
padding: px-5 py-2.5 | radius: rounded-md
```

**Secondary**
```
bg: transparent | border: 1px solid --border-default
hover: bg --bg-elevated, border --border-strong
text: --text-secondary → --text-primary on hover
```

**Destructive**
```
bg: --danger-subtle | border: rgba(239,68,68,0.3)
hover: bg --danger, text white
```

**Record Button**
```
size: 72×72px | radius: rounded-full
idle:      bg --accent-primary, box-shadow shadow-accent
recording: bg --record-active, shadow-record + pulsing ring
transition: 300ms, scale-105 on hover
```

---

### 6.2 Карточки

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
}
.card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}
.card-accent {
  background: var(--accent-subtle);
  border-color: rgba(124,58,237,0.2);
}
```

---

### 6.3 Сайдбар

```
Ширина: 240px (w-60)
Фон: --bg-overlay
Правый бордер: 1px solid --border-subtle
Логотип: h-16, border-b

Элемент навигации (idle):
  text: --text-secondary
  hover: bg rgba(255,255,255,0.05), text --text-primary

Элемент навигации (active):
  bg: --accent-subtle
  text: --accent-primary
  border-left: 2px solid --accent-primary
```

---

### 6.4 Score Ring (Критерии анализа)

```
Форма: SVG circle (48px), strokeWidth=4
Цвет  ≥70%: --success
Цвет  ≥40%: --warning
Цвет  <40%: --danger
Анимация: stroke-dashoffset fill-up при монтировании (600ms)
Центр: числовой счёт, font-mono font-bold
Карточка: fade-up с stagger delay (50ms * index)
```

---

### 6.5 Badges / Статус

```
Принято:    bg rgba(16,185,129,0.12) | border rgba(16,185,129,0.3) | text #10b981
Не принято: bg rgba(239,68,68,0.12)  | border rgba(239,68,68,0.3)  | text #ef4444
Запись:     bg rgba(239,68,68,0.12)  | red dot animate-ping
AI active:  gradient bg (cyan→violet) | text white
```

---

### 6.6 Waveform Visualizer

Используется `react-audio-visualize`:
```
Цвет bars: --accent-primary (violet)
При записи: bars анимируются в реальном времени
Фон: прозрачный, накладывается на --bg-card
Высота: 60px, ширина: 100%
```

---

### 6.7 Транскрипт

```
Контейнер: bg --bg-card, border --border-subtle, rounded-2xl
Активное слово: bg --accent-subtle, text --accent-primary, rounded, 200ms transition
Неактивное: text --text-secondary, hover bg rgba(255,255,255,0.04)
Шрифт: font-serif, text-base, leading-loose
```

---

### 6.8 Login

```
Фон: --bg-base + subtle radial gradient (accent glow от центра)
Карточка: bg --bg-card, border --border-subtle, rounded-2xl, shadow-lg
Input: bg --bg-elevated, border --border-default
       focus: ring-2 ring-offset-2 ring-accent-primary
Button: Full-width Primary
```

---

## 7. Анимации

```css
/* Появление снизу */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Запись — пульс */
@keyframes record-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--record-pulse); }
  50%       { box-shadow: 0 0 0 16px transparent; }
}

/* AI Processing */
@keyframes ai-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Waveform bars */
@keyframes wave-bar {
  0%, 100% { transform: scaleY(0.3); }
  50%      { transform: scaleY(1); }
}
```

### Таблица микро-взаимодействий

| Элемент              | Триггер    | Эффект                           | Время |
|----------------------|------------|----------------------------------|-------|
| Primary Button       | hover      | translateY(-1px) + shadow        | 200ms |
| Primary Button       | click      | scale(0.97)                      | 100ms |
| History Card         | hover      | translateY(-2px), border→accent  | 200ms |
| Record Button        | idle→rec   | scale-up + red pulsing ring      | 300ms |
| Score Card           | mount      | fade-up + stagger 50ms           | 400ms |
| Score Ring           | mount      | stroke fill-up animation         | 600ms |
| Transcript word      | active     | bg fade-in                       | 200ms |

---

## 8. Лейаут

### AppLayout
```
flex row, 100vh
Sidebar: 240px fixed | --bg-overlay
Header:  h-14, border-b --border-subtle, bg --bg-base/80 + backdrop-blur
Main:    flex-1, --bg-base, overflow-auto
```

### Страница записи
```
Desktop: recorder (flex-1) | rules panel (320px)
Tablet:  recorder full-width (rules → sheet/drawer)
Mobile:  recorder fullscreen + bottom fixed controls
```

### Страница результата
```
max-w-5xl, centered
Desktop: Player + Transcript (60%) + AI Feedback (40%) — 2-col grid
Mobile:  Single column
```

---

## 9. Адаптивность

```
Breakpoints:
  sm:  640px  — смартфоны горизонтально
  md:  768px  — планшеты
  lg:  1024px — laptops
  xl:  1280px — desktop

Мобильный (<640px):
  - Сайдбар → bottom nav (4 иконки, фиксирован)
  - Кнопка записи фиксирована внизу
  - PitchRules → sheet/drawer
  - Шрифт таймера: text-4xl вместо text-5xl
```

---

## 10. Доступность

- Focus: `ring-2 ring-offset-2 ring-violet-500` на всех интерактивных
- ARIA labels: все кнопки без текста
- Контраст: WCAG AA минимум
- Keyboard: логичный Tab order, ESC для модалок
- Motion: `@media (prefers-reduced-motion: reduce)` отключает трансформации

---

## 11. CSS Custom Properties

```css
/* resources/css/app.css */
:root {
  --bg-base:        #09090b;
  --bg-card:        #0f0f12;
  --bg-elevated:    #1a1a24;
  --bg-overlay:     #18181d;

  --border-subtle:  #27272a;
  --border-default: #3f3f46;
  --border-strong:  #52525b;

  --text-primary:   #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted:     #52525b;

  --accent-primary: #7c3aed;
  --accent-hover:   #6d28d9;
  --accent-glow:    rgba(124, 58, 237, 0.4);
  --accent-subtle:  rgba(124, 58, 237, 0.08);

  --success:        #10b981;
  --success-subtle: rgba(16, 185, 129, 0.10);
  --warning:        #f59e0b;
  --warning-subtle: rgba(245, 158, 11, 0.10);
  --danger:         #ef4444;
  --danger-subtle:  rgba(239, 68, 68, 0.10);

  --ai-primary:     #06b6d4;
  --ai-secondary:   #7c3aed;
}
```

---

## 12. Используемые библиотеки

### Существующие ✅
- `tailwindcss` v4 — утилиты
- `lucide-react` — иконки
- `react-record-webcam` — запись
- `react-player` — плеер

### Добавляемые
- `framer-motion` — анимации (fade-up, score ring, stagger)
- `react-audio-visualize` — waveform при записи

### Опционально (если нужна аналитика)
- `recharts` — графики прогресса в истории
