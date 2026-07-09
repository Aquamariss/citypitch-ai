---
description: Service layer for business logic and orchestration
alwaysApply: true
---

# Service Layer

Services own business rules, orchestration, and side effects. Controllers stay thin and HTTP-focused.

## Structure

```
app/Domains/{Domain}/
  Services/{Domain}Service.php
```

## Conventions

- One service per domain or aggregate (e.g. `UserService`, `OrderService`)
- Constructor-inject repository **interfaces** and external contracts — never `app()` or `resolve()`
- Accept validated arrays or DTOs — never `Request` objects
- Wrap multi-step writes in `DB::transaction()`
- Dispatch events and notifications from services, not controllers or repositories
- Orchestrate multiple repositories when a workflow spans entities

## Does / Does Not

| Does | Does not |
| --- | --- |
| Business rules, workflows, transactions | HTTP responses, status codes, headers |
| Coordinate repositories and external APIs | Eloquent queries or `Model::` calls |
| Fire domain events after state changes | Validation (use Form Requests upstream) |

## Controller Flow

```
// Writes & business operations
Controller → Service → Repository

// Simple reads (listing, filtering)
Controller → Repository   ← acceptable for read-only index/show
```

## Quick Check

- Logic decides *what should happen*? → Service
- Logic decides *how to fetch/store data*? → Repository
- Controller has `Model::`, `DB::`, or `event()`? → Move to service or repository

For full examples, activate the `service-layer` skill.
