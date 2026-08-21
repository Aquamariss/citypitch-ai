---
description: Service layer for business logic and orchestration
alwaysApply: true
---

# Service Layer

Services own business rules, orchestration, and side effects. Controllers stay thin and HTTP-focused.

Prefer **Service classes** over `*Action` classes for domain workflows in this project.

## Structure

```
app/Services/{Domain}/{Domain}Service.php
```

Examples: `app/Services/User/UserService.php`, `app/Services/Order/OrderService.php`.

Do not place services under `app/Domains/`.

Every container-resolved service class uses the `Service` suffix (`OrderService`, `PhoneNumberService`). Collaborators that are not services get a role suffix instead (`*Parser`, `*Client`, `*Factory`) — never a bare noun.

## Conventions

- One primary service per domain (`UserService`, `OrderService`); add focused collaborators under the same folder when the domain grows
- Constructor-inject repository **interfaces** and external contracts — never `app()` or `resolve()` inside a service
- Accept validated arrays or DTOs — never `Request` objects
- Wrap multi-step writes in `DB::transaction()`
- Dispatch events/notifications via `DB::afterCommit()` (or `ShouldDispatchAfterCommit`) — not mid-transaction, and not from controllers/repositories
- Orchestrate multiple repositories when a workflow spans entities
- Reuse the same service methods from jobs and commands

## Does / Does Not

| Does | Does not |
| --- | --- |
| Business rules, workflows, transactions | HTTP responses, status codes, headers |
| Coordinate repositories and external APIs | Eloquent queries or `Model::` calls |
| Fire domain events after successful commit | Input validation (use Form Requests upstream) |
| Enforce domain invariants / throw domain exceptions | Authorization checks that belong in policies/gates |

## Controller Flow

```
// Writes & business operations
Form Request → Controller → Service → Repository → API Resource

// Simple reads (listing, filtering)
Form Request → Controller → Repository → API Resource
```

API controllers **accept Form Requests** (never inline `$request->validate()`) and **return API Resources** (never raw models/arrays via `response()->json($model)`). Exception: tiny non-entity payloads like `{ "ok": true }`.

## Thin Entrypoints

Every entrypoint is thin — it only accepts input, delegates to a service, returns the result. This applies to **all** entry points, not just controllers.

- **Controller** — Form Request → Service → API Resource
- **Job::handle()** — only a service call. No `Process` / `Storage` / `Log` / `DB`
- **Command::handle()** — only option parsing → service call → output of the result
- **Listener** — only a service call
- **Middleware** — only HTTP concern, no business logic

A private method with logic inside an entrypoint = a signal to extract it into a service.

Rationale: one orchestration path for HTTP, queue, scheduler, and CLI access — prevents logic drift across transports.

## DTO

DTO is a readonly class with promoted properties. Only `fromArray()` / `toArray()` mapping is allowed. Business logic (`isSuccess()`, `canX()`, `isY()`) is forbidden — that is the service's responsibility. The class name always ends with `Dto`.

This project's DTOs are thin adapters over the external Oracle API (`RES`, `ID_CLIENT`, …). `fromArray()` is the single allowed constructor-helper — do **not** introduce a `app/Factories/` layer for them (YAGNI: no multi-source assembly or invariants to enforce).

## Simplicity

- **Class size:** keep `app/` classes ≤150 lines. Exceeding it is a signal to decompose into private methods or a dedicated service. A thin wrapper over many external calls (e.g. `SmartWifiOracleRepository`) may exceed it — treat 150 as a *review trigger*, not a hard fail.
- **Nesting depth:** keep method nesting ≤3 levels (sequential `if` / `&&` / `||` do not add depth). Deeper → extract a method.
- **DI naming:** a constructor-injected property/parameter is named as the camelCase of the injected type's short name. For an `*Interface`, drop the `Interface` suffix first.
  - `SmartWifiOracleRepositoryInterface $oracleRepository`
  - `PhoneNumberService $phoneNumberService`
  - `OracleCursorParser $cursorParser`
- **YAGNI:** no speculative features, no future-proofing abstractions, no drive-by refactors outside the feature scope. Prefer the smallest diff that satisfies the spec; reuse existing services before adding new ones.

## Test-First

For new features and bug fixes, write the test first (Red–Green–Refactor): describe the behavior, watch it fail for the right reason, implement the minimum to pass, then refactor. When refactoring existing code with passing coverage, extend tests to the new behavior before changing the implementation. Unit tests in `tests/Unit/`, feature tests in `tests/Feature/`; the suite runs against the `testing` DB (set in `phpunit.xml`), never the dev DB.

## Hard-Cut Changes

When removing, renaming, or replacing a class, method, config key, or contract: ship the new shape and delete the old in the same change set. No `class_alias`, no `@deprecated` shims, no dual-read/dual-write, no "one more release" compat keys. Exception: only an explicit, documented decision in the feature spec. Silence means hard-cut.

## Quick Check

- Logic decides *what should happen*? → Service
- Logic decides *how to fetch/store data*? → Repository
- Controller has `Model::`, `DB::`, or `event()`? → Move to service or repository
- Controller validates inline or returns raw JSON for an entity? → Form Request + API Resource
- Job/Command/Listener has `DB::`, `Storage::`, `Log::`, `Process`? → Move to service
- DTO has a method other than `fromArray`/`toArray`? → Move the logic to a service
- Class >150 lines or nesting >3? → Decompose
- Injected property name ≠ camelCase of its type? → Rename

For full examples, activate the `service-layer` skill.
