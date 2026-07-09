---
name: service-layer
description: Apply the Service Layer pattern for Laravel business logic. Use when creating or refactoring service classes, moving business logic out of controllers, orchestrating repositories, transactions, domain events, or multi-step workflows.
---

# Service Layer

Services own business rules, orchestration, and side effects. Controllers handle HTTP; repositories handle data access; services sit between them for anything that decides *what should happen*.

## When to Apply

- Creating `*Service` classes in `app/Domains/{Domain}/Services/`
- Moving business logic out of controllers, jobs, or listeners
- Orchestrating multiple repositories or external APIs
- Wrapping operations in `DB::transaction()`
- Dispatching domain events after state changes

## Structure

```
app/Domains/{Domain}/
  Services/{Domain}Service.php
```

## Implementation Steps

1. Create `{Domain}Service` with constructor-injected repository interfaces
2. Accept validated arrays or DTOs — never `Request` objects
3. Use `DB::transaction()` for multi-step writes
4. Dispatch events from the service after successful state changes
5. Keep controllers thin: validate → delegate → format response

## Full Example

See [examples.md](examples.md) for incorrect/correct patterns.

## Rules

- Services never contain Eloquent queries — delegate to repositories
- Services never return HTTP responses — return domain objects
- Validation belongs in Form Requests; business-rule checks belong in services
- One service method = one business operation (e.g. `register`, `cancelOrder`)
- For simple read-only endpoints, controllers may call repositories directly
