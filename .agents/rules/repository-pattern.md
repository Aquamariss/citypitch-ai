---
description: Repository pattern for Eloquent data access abstraction
alwaysApply: true
---

# Repository Pattern

Abstract Eloquent queries behind repository interfaces. Keep all query logic in repositories — not in controllers, services, or jobs.

## Structure

```
app/Repositories/{Domain}/
  Contracts/{Domain}RepositoryInterface.php
  {Domain}Repository.php
```

Examples: `app/Repositories/User/Contracts/UserRepositoryInterface.php`, `app/Repositories/User/UserRepository.php`.

Do not place repositories under `app/Domains/`.

## Conventions

- Interface: `{Domain}RepositoryInterface` under `Contracts/` — define the data contract
- Implementation: `{Domain}Repository` — Eloquent-only, no business rules
- Bind in a service provider: `Interface → Implementation`
- Inject the **interface**, never the concrete class
- One primary repository per domain; add focused collaborators under the same folder when the domain grows
- Accept primitives, arrays, or models — never `Request` objects
- Reuse query scopes as private methods (e.g. `scopeActive`) — define once, use everywhere
- Return models, collections, or paginators — not API resources, Inertia responses, or other HTTP responses

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
