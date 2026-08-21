---
description: University 2.0 AI development standards for this boilerplate
alwaysApply: true
---

# University Manifesto (Agent Rules)

## Stack

- Backend: Laravel 13 (PHP 8.5)
- Frontend: Vue 3 (Composition API + TypeScript) + TailwindCSS
- Bridge: Inertia.js
- Real-time (when needed): Laravel Reverb + Laravel Echo — not installed by default; ask the Architect before adding
- If the Inertia/Vue stack is missing, ask the Architect to install it — do not substitute Blade feature pages, a separate SPA, or ad-hoc REST just for UI

## Git & delivery

- Do not push to `main` / `master`
- Deliver via Merge Request; Architect reviews before merge
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, …)
- Track bugs in GitLab Issues (include logs / screenshots when available)

## Tests

- Write PHPUnit tests for new business logic
- After meaningful changes, run the relevant tests via Sail (`vendor/bin/sail artisan test`)
- **Pest is forbidden** — do not install it, do not write Pest tests, do not suggest migrating to Pest

## Dependencies

- Prefer official or well-established community SDKs/packages over custom raw integrations
- Do not add Composer or npm packages without Architect approval

## Architecture layers

- Add `app/Repositories/{Domain}/` and `app/Services/{Domain}/` when the first domain feature needs them — do not invent empty scaffolding
- Follow the `repository-pattern` and `service-layer` skills; never put domain code under `app/Domains/`

## Documentation

- Project docs are managed with **Laradoc** — do not invent a parallel `/docs` workflow
