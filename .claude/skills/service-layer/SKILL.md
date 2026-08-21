---
name: service-layer
description: Apply the Service Layer pattern for Laravel business logic. Use when creating or refactoring service classes, moving business logic out of controllers, orchestrating repositories, transactions, domain events, or multi-step workflows.
---

# Service Layer

Services own business rules, orchestration, and side effects. Controllers handle HTTP; repositories handle data access; services sit between them for anything that decides *what should happen*.

This project prefers **Service classes** over single-purpose Action classes. Do not introduce `*Action` classes for domain workflows unless an existing module already uses that pattern.

## When to Apply

- Creating `*Service` classes in `app/Services/{Domain}/`
- Moving business logic out of controllers, jobs, or listeners
- Orchestrating multiple repositories or external APIs
- Wrapping operations in `DB::transaction()`
- Dispatching domain events after state changes

## Structure

```
app/Services/{Domain}/{Domain}Service.php
```

Examples:

- `app/Services/User/UserService.php` → `App\Services\User\UserService`
- `app/Services/Order/OrderService.php` → `App\Services\Order\OrderService`

When a domain grows too large, add focused collaborators under the same folder (e.g. `app/Services/Order/OrderFulfillmentService.php`) and keep `{Domain}Service` as the primary entry point for that domain's workflows. Do not put services under `app/Domains/`.

## Implementation Steps

1. Create `{Domain}Service` under `app/Services/{Domain}/` with constructor-injected repository interfaces (and other contracts)
2. Accept validated arrays or DTOs — never `Request` objects
3. Use `DB::transaction()` for multi-step writes
4. Dispatch events/notifications only after a successful commit (`DB::afterCommit()` or after the transaction returns)
5. Keep controllers thin: Form Request → Service/Repository for work → controller returns `Inertia::render(...)` or `redirect()` (or `Resource::make(...)` only for explicit APIs)
6. Call the same service methods from jobs and Artisan commands — do not duplicate business logic

## Full Example

See [examples.md](examples.md) for incorrect/correct patterns.

## Rules

- Services never contain Eloquent queries or `Model::` static calls — delegate to repositories
- Services never return HTTP or Inertia responses — return domain models, collections, DTOs, or primitives
- Default UI delivery is **Inertia**: controllers pass props via `Inertia::render(...)`; do not invent REST/JSON endpoints only to feed Vue
- Explicit API endpoints (when required) accept Form Requests and return `Resource::make(...)` / `Resource::collection(...)` — not raw models via `response()->json($model)`
- Validation belongs in Form Requests; business-rule checks and invariant enforcement belong in services
- Throw domain-oriented exceptions from services; let controllers/handlers map them to HTTP
- One service method = one business operation (e.g. `register`, `cancelOrder`)
- Constructor-inject dependencies — never `app()` or `resolve()` inside services
- Prefer interfaces at system boundaries (repositories, gateways, clients)
- Authorization stays in policies/gates (or middleware); services assume the caller is already authorized unless the rule is a domain invariant
- For simple read-only pages, controllers may call repositories directly
