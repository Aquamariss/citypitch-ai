---
name: run-smartwifi-backend
description: Run, drive, and smoke-test the SmartWiFi backend API. Use when asked to run, start, launch, boot, or test the SmartWiFi Laravel backend, check its health, hit its HTTP API, run the telephony auth flow, take the app for a spin, or verify the running server end-to-end.
---

# Run SmartWiFi Backend

SmartWiFi is a headless **Laravel 13 JSON API** (captive-portal + admin SPA backend)
running in Laravel Sail (Docker). There is no GUI — you drive it over HTTP with
`curl`. The driver is `.claude/skills/run-smartwifi-backend/smoke.sh`, a bash script
that boots what it needs and exercises the live API end-to-end.

All paths below are relative to the repo root (`smartwifi-backend/`).

## Prerequisites

- Docker Desktop running (Sail wraps `docker compose`).
- `jq`, `curl` on the host (both standard on macOS/Linux).

## Build & launch

```bash
composer install && cp .env.example .env   # first time only
vendor/bin/sail up -d                       # starts laravel.test, mysql, legacy_mysql, redis
vendor/bin/sail artisan migrate --seed      # first time only
vendor/bin/sail artisan storage:link        # first time only
```

Verify it's alive:

```bash
curl -sS http://localhost/
# {"status":"ok","service":"Laravel","version":"0.0.1","docs":"...","health":"..."}
```

## Run (agent path) — the driver

```bash
.claude/skills/run-smartwifi-backend/smoke.sh
```

Exit code 0 = all green. Prints `PASS`/`FAIL` per check and a final
`== N passed, M failed ==`. It covers the surfaces that work on a clean machine
**without** the external Oracle DB:

- liveness: `/`, `/up`, `/docs/api`
- public portal: `client/ip`, `client/device`
- validation: `orders` (invalid phone → 422), `sessions/check` (missing ip)
- **telephony auth flow over Redis**: seed `phone_auth` → `telephony/grant` →
  `telephony/check` (true) → `check` again (consumed → false), wrong-key → 401
- Sanctum routes: mints a token via `tinker`, hits `templates`, and asserts
  `/services` cleanly 401s without an Oracle session

The script auto-starts Reverb in-container (needed by `telephony/grant`) and is
idempotent — safe to re-run.

### Individual probes (no driver)

```bash
curl -sS http://localhost/api/v1/client/ip
curl -sS -X POST http://localhost/api/v1/telephony/check \
  -H 'Content-Type: application/json' -d '{"phone":"9991234567"}'   # {"auth":false}

# Mint a Sanctum token for protected routes:
vendor/bin/sail artisan tinker --execute \
  'echo App\Models\User::firstOrCreate(["email"=>"s@s.local"],["name"=>"s","password"=>bcrypt("x")])->createToken("s",["*"])->plainTextToken;'
curl -sS http://localhost/api/v1/templates -H "Authorization: Bearer <token>"
```

## Background workers (queues + WebSockets)

`telephony/grant` broadcasts to Reverb; media uploads dispatch `ProcessVideoJob`.
Neither runs unless you start them (neither is in `compose.yaml`):

```bash
vendor/bin/sail exec -d laravel.test php artisan reverb:start --host=0.0.0.0 --port=8080
vendor/bin/sail exec -d laravel.test php artisan queue:work --sleep=1 --tries=1
```

**Use `sail exec -d`, not `setsid ... &` inside `sh -c`** — the detached shell kills
the child when the exec session ends. Stop them with
`vendor/bin/sail exec laravel.test pkill -f "artisan reverb:[s]tart"`.

## Test

```bash
vendor/bin/sail artisan test --compact        # full suite (111 tests)
vendor/bin/sail artisan test --compact tests/Unit/OrderServiceTest.php
```

Tests bind a fake Oracle repository (`Tests\Mocks\SmartWifiOracleRepositoryFake`)
so the suite passes with no Oracle connection.

## Gotchas

- **Oracle is unreachable from a clean machine** (`DB_ORACLE_HOST=10.102.101.150`,
  a private IP). Every endpoint that calls `SmartWifiOracleRepository` fails here:
  `auth/login` → `{"code":0,"msg":"No data found"}`, `services/sync` → error,
  `sessions/check` with a real ip → `{"code":0,...}`. This is expected, not a bug.
  The smoke script deliberately exercises only Oracle-free paths, and seeds
  `phone_auth` directly to fake the order that `createOrder` would normally create.
- **`pgrep -f "artisan reverb:start" self-matches.** The pattern appears in the
  invoking `sh -c` cmdline, so it always returns success and the spawn is skipped.
  Use a bracket to dodge it: `pgrep -f "artisan reverb:[s]tart"`.
- **`/services` without a cached Oracle session returns 401
  `{"error":"No active Oracle session found"}`** even with a valid Sanctum token —
  the token alone isn't enough; the session is populated by a real Oracle login.
- **`/docs/api.json` (raw OpenAPI export) 404s** even though the route is
  registered and `docs/api` (UI) renders fine. The UI embeds the spec inline, so
  use `docs/api`. Don't chase the `.json` route.
- **Port 8080 (Reverb) is not published to the host.** It's only reachable inside
  the `laravel.test` container — which is fine, because the Pusher broadcaster
  also runs in-container and dials `localhost:8080`. You can't hit it from the host.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `telephony/grant` → 500 `Pusher error: cURL error 7 ... port 8080` | Reverb isn't running. `vendor/bin/sail exec -d laravel.test php artisan reverb:start --host=0.0.0.0 --port=8080` |
| Reverb "starts" but `pgrep` finds nothing / port never opens | You used `setsid ... &` in `sh -c`. Use `sail exec -d` instead. |
| Reverb spawn always skipped, log shows graceful terminate | `pgrep -f` self-matched. Add the bracket: `reverb:[s]tart`. |
| `telephony/grant` → `{"code":0}` | No order state in Redis. Seed it: `Cache::put("phone_auth:79991234567", ["ip"=>"10.0.0.1","service_id"=>456,"isAuth"=>false], 300)` via `tinker`. |
| `telephony/grant` → 401 | Wrong/missing `ORACLE_UPLOAD_USERNAME` / `ORACLE_UPLOAD_API_KEY` (from `.env`). |
| `auth/login` → `code:0 "No data found"` | Expected — Oracle unreachable. Use the Sanctum-token-via-tinker path for protected routes. |
| `curl: port 80 refused` | Stack is down: `vendor/bin/sail up -d`. |
