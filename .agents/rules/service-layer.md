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

## Conventions

- One primary service per domain (`UserService`, `OrderService`); add focused collaborators under the same folder when the domain grows
- Constructor-inject repository **interfaces** and external contracts — never `app()` or `resolve()`
- Accept validated arrays or DTOs — never `Request` objects
- Wrap multi-step writes in `DB::transaction()`
- Dispatch events/notifications via `DB::afterCommit()` (or `ShouldDispatchAfterCommit`) — not mid-transaction, and not from controllers/repositories
- Orchestrate multiple repositories when a workflow spans entities
- Reuse the same service methods from jobs and commands

## Does / Does Not

| Does | Does not |
| --- | --- |
| Business rules, workflows, transactions | HTTP responses, status codes, headers, Inertia responses |
| Coordinate repositories and external APIs | Eloquent queries or `Model::` calls |
| Fire domain events after successful commit | Input validation (use Form Requests upstream) |
| Enforce domain invariants / throw domain exceptions | Authorization checks that belong in policies/gates |

## Controller Flow

Primary (Inertia UI):

```
Form Request → Controller
                 ├─ writes: Service → Repository
                 ├─ simple reads: Repository
                 └─ response: Inertia::render(...) | redirect()
```

API endpoints only when an explicit HTTP API is required:

```
Form Request → Controller → Service → Repository
Controller response: Resource::make(...) | Resource::collection(...)
```

Controllers **accept Form Requests** (never inline `$request->validate()`). For UI, the **controller** returns Inertia pages with props — do not add REST endpoints just to feed the frontend. Services and repositories never return Inertia or HTTP responses.

## Quick Check

- Logic decides *what should happen*? → Service
- Logic decides *how to fetch/store data*? → Repository
- Controller has `Model::`, `DB::`, or `event()`? → Move to service or repository
- UI endpoint returning JSON/`Resource` only to drive Vue? → Prefer Inertia props instead

For full examples, activate the `service-layer` skill.
