# DESIGN.md — Pitch AI Design System (Stage Noir)

> Единый источник правды для дизайна приложения Pitch AI.
> Эталон экспорта: `new_design/` (tokens.css, pitch-ai.css, HTML-экраны).

---

## 1. Философия

Pitch AI — инструмент для подготовки к инвестиционному питчу. **Stage Noir**: киностудийный фокус, тёмный canvas, янтарный акцент, минимум шума в студии записи.

- Профессионализм и фокус
- Акцент максимум 2 раза на экран (CTA + active)
- Dark mode first + light toggle

Референс-экспорт: `new_design/brand-spec.md`

---

## 2. Токены (OKLCH)

См. [`resources/css/tokens.css`](resources/css/tokens.css).

| Token | Dark | Role |
|-------|------|------|
| `--bg` | `oklch(7% 0.01 280)` | canvas |
| `--surface` | `oklch(11% 0.012 280)` | панели, sidebar |
| `--fg` | `oklch(95% 0.02 75)` | текст |
| `--muted` | `oklch(58% 0.02 75)` | вторичный |
| `--border` | `oklch(22% 0.015 280)` | hairline |
| `--accent` | `oklch(72% 0.09 65)` | янтарь — CTA, active nav |
| `--record` | `oklch(58% 0.22 25)` | запись |

Light: тёплый paper + более тёмный янтарь.

Legacy-алиасы (`--bg-base`, `--accent-primary`, …) живут в `app.css` для переходного JSX.

---

## 3. Типографика

- Display / UI: SF Pro Display → system sans
- Body: SF Pro Text → system sans
- Mono: JetBrains Mono — таймер, OTP, scores

Утилиты: `.caps`, `.mono`

---

## 4. Chrome contract

- Theme toggle — **только** справа вверху (`app-header` / `studio-top`). Не в sidebar.
- Sidebar footer = попытки + пользователь (+ logout).
- Recording Studio — immersive, без sidebar/bottom-nav (`AppLayout chrome={false}`).

---

## 5. Компонентные стили

Источник: [`resources/css/pitch-ai.css`](resources/css/pitch-ai.css)

Классы: `.app-shell`, `.btn`, `.btn-primary`, `.btn-record`, `.card`, `.badge`, `.score-ring`, `.studio`, `.writer-layout`, `.proc-card`, `.result-hero`, `.history-layout`, …

---

## 6. Экраны

| Route | UI |
|-------|-----|
| `/login` | OTP login |
| `/pitch-writer` | Chat + tabbed draft |
| `/pitch` | Immersive studio |
| `/pitch?tab=history` | History list + chart |
| `/pitch/{id}/status` | Processing checklist |
| `/pitch/{id}/result` | Verdict hero + criteria + priority fixes |

---

## 7. Доступность

- `:focus-visible` outline accent
- `prefers-reduced-motion` отключает pulse/wave/spin
- ARIA на record, rules drawer, OTP fields
