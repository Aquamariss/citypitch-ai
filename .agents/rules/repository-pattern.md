---
description: Repository pattern for Eloquent data access abstraction
alwaysApply: true
---

# Repository Pattern

Abstract Eloquent queries behind repository interfaces. Keep all query logic in repositories — not in controllers, services, or jobs.

## Structure

```
app/Domains/{Domain}/
  Repositories/{Model}RepositoryInterface.php
  Repositories/Eloquent{Model}Repository.php
```

## Conventions

- Interface: `{Model}RepositoryInterface` — define the data contract
- Implementation: `Eloquent{Model}Repository` — Eloquent-only, no business rules
- Bind in the domain `ServiceProvider`: `Interface → Eloquent implementation`
- Inject the **interface**, never the concrete class
- Reuse query scopes as private methods (e.g. `scopeActive`) — define once, use everywhere
- Return models, collections, or paginators — not API resources

## Does / Does Not

| Does | Does not |
| --- | --- |
| CRUD, filtering, eager loading, pagination | Business rules, events, transactions |
| Encapsulate complex/reused queries | Accept `Request` objects |
| Provide testable data-access boundary | Live in controllers or services as inline Eloquent |

## Quick Check

- Eloquent in a controller or service? → Move to repository
- Same query in multiple places? → Extract to one repository method
- Need to mock data access in tests? → Depend on the interface

For full examples, activate the `repository-pattern` skill.
