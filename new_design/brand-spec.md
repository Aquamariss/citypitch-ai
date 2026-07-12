# Pitch AI — Stage Noir

Свежий визуальный язык поверх старого violet/zinc baseline. Киностудийный фокус: тёмный canvas, янтарный акцент, минимум шума в студии записи.

## Tokens

| Token | Dark | Role |
|-------|------|------|
| `--bg` | `oklch(7% 0.01 280)` | основной canvas |
| `--surface` | `oklch(11% 0.012 280)` | панели, sidebar |
| `--fg` | `oklch(95% 0.02 75)` | основной текст |
| `--muted` | `oklch(58% 0.02 75)` | вторичный текст |
| `--border` | `oklch(22% 0.015 280)` | hairline |
| `--accent` | `oklch(72% 0.09 65)` | янтарь — CTA, active nav |
| `--record` | `oklch(58% 0.22 25)` | запись |

Light theme: тёплый нейтральный paper + более тёмный янтарь для контраста.

## Type

- Display / UI: SF Pro Display → system sans
- Body: SF Pro Text → system sans
- Mono: JetBrains Mono — таймер, OTP, scores

## Posture

1. Радиусы 8–16px, без тяжёлых теней
2. Акцент максимум 2 раза на экран (CTA + active)
3. Студия: почти чёрный фон, без карточек-шума
4. Result: densе, tabular scores, один вердикт-якорь
5. Dark mode first + light toggle
6. **Chrome contract:** переключатель темы — только справа вверху (`app-header` / `studio-top`). Не в sidebar, не в page-title. Один экземпляр на экран. Sidebar footer = попытки + пользователь.
