---
name: repository-pattern
description: Apply the Repository Pattern for Laravel data access. Use when creating or refactoring repositories, repository interfaces, Eloquent queries in controllers/services/jobs, data-access abstraction, or mocking persistence in tests.
---

# Repository Pattern

Abstract Eloquent queries behind repository interfaces instead of scattering query logic across controllers, services, and jobs. This keeps query logic in one place, makes services testable (mock the contract), and allows you to swap the data source without touching business logic.

## When to Apply

- Creating `*RepositoryInterface` or `*Repository` classes in `app/Repositories/{Domain}/`
- Moving Eloquent/`Model::` calls out of controllers, services, or jobs
- Extracting duplicated query logic
- Setting up interface bindings in a service provider
- Writing tests that mock data access

## Structure

```
app/Repositories/{Domain}/
  Contracts/{Domain}RepositoryInterface.php
  {Domain}Repository.php
```

Examples:

- `app/Repositories/User/Contracts/UserRepositoryInterface.php` → `App\Repositories\User\Contracts\UserRepositoryInterface`
- `app/Repositories/User/UserRepository.php` → `App\Repositories\User\UserRepository`
- `app/Repositories/Order/Contracts/OrderRepositoryInterface.php` → `App\Repositories\Order\Contracts\OrderRepositoryInterface`
- `app/Repositories/Order/OrderRepository.php` → `App\Repositories\Order\OrderRepository`

When a domain grows too large, add focused collaborators under the same folder (e.g. `OrderItemRepositoryInterface` + `OrderItemRepository`) and keep `{Domain}Repository` as the primary data-access entry point for that domain. Do not put repositories under `app/Domains/`.

## Implementation Steps

1. Define `{Domain}RepositoryInterface` under `app/Repositories/{Domain}/Contracts/` with explicit return types
2. Implement `{Domain}Repository` under `app/Repositories/{Domain}/` — Eloquent only, no business rules
3. Bind `Interface → Implementation` in `AppServiceProvider` (or a dedicated provider)
4. Inject the **interface** in services and controllers — never the concrete class. Name the property as the camelCase of the type minus the `Interface` suffix (`SmartWifiOracleRepositoryInterface $oracleRepository`)
5. Return models, collections, or paginators — resources stay in controllers

## Full Example

See [examples.md](examples.md) for the complete User domain example with incorrect/correct patterns and test mocking.

## Rules

- One primary repository per domain or aggregate root (`UserRepository`, `OrderRepository`)
- Add methods when a query is reused or non-trivial — not for every one-off
- Keep reusable scopes as private methods inside the repository
- Repositories never contain business rules, events, or transactions — those belong in services
- Repositories never accept `Request` objects — accept primitives, arrays, or models
- Services and jobs depend on interfaces; bind implementations in providers
- Constructor-inject the interface — never `app()` or `resolve()` inside consumers
- For simple read-only endpoints, controllers may call repository interfaces directly
