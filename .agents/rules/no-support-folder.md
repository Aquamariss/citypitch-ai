---
description: Forbidden anti-patterns — Support folder, static helpers, ValueObjects folder
alwaysApply: true
---

# Forbidden Anti-Patterns

## No `Support/` directories

Do not create any directory named `Support` under `app/` (`app/Support/`, `app/Services/**/Support/`, `app/Http/**/Support/`, …). It becomes a catch-all dump for unrelated helpers and hides ownership. Place code next to its domain instead:

- Oracle cursor parser → `app/Repositories/Oracle/`
- Session/ownership checks → `app/Services/Auth/`
- Phone normalization → `app/Services/Phone/`
- Media/file helpers → `app/Services/Media/`

If you don't know where a class goes, that means its domain is undefined — define it, don't dump it in `Support`. The only allowed `Support/` tree is `tests/Support/` for PHPUnit fixtures and fakes.

## No static utility classes for domain logic

Domain logic must not live in classes exposed only through public static methods (utility bags). Use container-resolved `*Service` classes with constructor DI and instance methods.

- Bad: `OracleSession::hasClient($user, $id)`
- Good: `$this->oracleSession->hasClient($user, $id)` with `OracleSessionService` injected via constructor

Allowed static-only shapes (pure, no I/O): HTTP/API mappers, constant/name registries, and framework-required static hooks. Not allowed for new code: static formatters, sanitizers, coordinators, or error builders in `app/Services/**` — inject a service instead.

## No facades in entrypoints

Facades (`Cache::`, `DB::`, `Storage::`, `Log::`, `Process`) belong in services and repositories — not in Controllers, Jobs, Commands, or Listeners. Facades are fine inside services.

## No `app/ValueObjects/`

Do not use the `app/ValueObjects/` folder. Choose by behavior:

- **Pure data container** → `app/DTO/`, name ends with `Dto`, only `fromArray()`/`toArray()` allowed
- **Behavior / normalization / invariants** → a method on the domain service (e.g. `PhoneNumberService::normalize()`)

A class that is "half DTO, half service" is a design smell — split it.
