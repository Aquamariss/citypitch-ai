---
name: repository-pattern
description: Apply the Repository Pattern for Laravel data access. Use when creating or refactoring repositories, repository interfaces, Eloquent queries in controllers/services/jobs, data-access abstraction, or mocking persistence in tests.
---

# Repository Pattern

Abstract Eloquent queries behind repository interfaces instead of scattering query logic across controllers, services, and jobs. This makes your code testable (you can mock the repository in unit tests), keeps query logic in one place, and allows you to swap the data source without touching business logic.

## When to Apply

- Creating `*RepositoryInterface` or `Eloquent*Repository` classes
- Moving Eloquent/`Model::` calls out of controllers, services, or jobs
- Extracting duplicated query logic
- Setting up interface bindings in domain service providers
- Writing tests that mock data access

## Structure

```
app/Domains/{Domain}/
  Repositories/{Model}RepositoryInterface.php
  Repositories/Eloquent{Model}Repository.php
  {Domain}ServiceProvider.php   ← bind interface here
```

## Implementation Steps

1. Define `{Model}RepositoryInterface` with explicit return types
2. Implement `Eloquent{Model}Repository` — Eloquent only, no business rules
3. Bind in the domain `ServiceProvider`
4. Inject the interface in services and controllers

## Full Example

See [examples.md](examples.md) for the complete User domain example with incorrect/correct patterns and test mocking.

## Rules

- One repository per model or aggregate root
- Add methods when a query is reused or non-trivial — not for every one-off
- Keep reusable scopes as private methods inside the repository
- Repositories return models/collections/paginators — resources stay in controllers
- Services and jobs depend on interfaces; bind implementations in providers
