#!/usr/bin/env bash
#
# smoke.sh — drives the running SmartWiFi backend API end-to-end.
#
# Usage:
#   .claude/skills/run-smartwifi-backend/smoke.sh [BASE_URL]
#
# Defaults BASE_URL to http://localhost. Requires the Sail stack to be up
# (vendor/bin/sail up -d) and `jq` on the host.
#
# Covers the surfaces that work WITHOUT the external Oracle DB (10.102.101.150
# is unreachable from a clean machine): health, validation, device detect,
# Sanctum-protected routes, and the full telephony grant→check flow over Redis.
# For the telephony flow it seeds the phone_auth state and starts Reverb
# in-container, because the Oracle-backed order creation that normally seeds it
# cannot run here.

set -uo pipefail

BASE="${1:-http://localhost}"
API="$BASE/api/v1"
PASS=0
FAIL=0

say()  { printf '%s\n' "$*"; }
ok()   { PASS=$((PASS+1)); say "PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); say "FAIL  $1"; }

# check <name> <expected-substring> <actual>
check() {
  local name="$1" want="$2" got="$3"
  if printf '%s' "$got" | grep -qF "$want"; then ok "$name"; else bad "$name — wanted [$want] got [$got]"; fi
}

# check_status <name> <expected-http-code> <curl-args...>
check_status() {
  local name="$1" want="$2"; shift 2
  local code
  code=$(curl -sS -m 15 -o /dev/null -w '%{http_code}' "$@")
  if [ "$code" = "$want" ]; then ok "$name ($code)"; else bad "$name — wanted HTTP $want got $code"; fi
}

sail() { vendor/bin/sail "$@"; }

say "== SmartWiFi smoke against $BASE =="

# --- 1. Liveness -------------------------------------------------------------
ROOT=$(curl -sS -m 10 "$BASE/")
check "root status ok"        '"status":"ok"' "$ROOT"
check "root health link"      '"health"'      "$ROOT"
check_status "health /up 200" 200 "$BASE/up"
check_status "docs UI 200"    200 "$BASE/docs/api"

# --- 2. Public portal endpoints ---------------------------------------------
IP=$(curl -sS -m 10 "$API/client/ip")
check "client/ip returns ip"  '"client_ip"'   "$IP"

DEV=$(curl -sS -m 10 -X POST "$API/client/device" -H 'Content-Type: application/json' \
  -d '{"useragent":"Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)","was_open_in":"BROWSER"}')
check "client/device returns platform" '"platform"' "$DEV"

# --- 3. Validation (no Oracle needed) ---------------------------------------
VAL=$(curl -sS -m 10 -X POST "$API/orders" -H 'Content-Type: application/json' \
  -d '{"ip":"10.0.0.1","phone":"abc","service_id":456}')
check "orders invalid phone 422 msg" 'must be a valid phone number' "$VAL"

SESS=$(curl -sS -m 10 -X POST "$API/sessions/check" -H 'Content-Type: application/json' -d '{}')
check "sessions/check requires ip" '"The ip field is required."' "$SESS"

# --- 4. Telephony flow over Redis (grant needs order state + Reverb) --------
say "-- seeding phone_auth + starting Reverb in-container"
sail artisan tinker --execute \
  'Illuminate\Support\Facades\Cache::put("phone_auth:79991234567", ["ip"=>"10.0.0.1","service_id"=>456,"isAuth"=>false], 300);' \
  >/dev/null 2>&1
# Start Reverb detached (sail exec -d keeps it alive; a `setsid ... &` inside
# sh -c gets killed when the exec session ends). Then wait for port 8080.
if ! sail exec laravel.test pgrep -f "artisan reverb:[s]tart" >/dev/null 2>&1; then
  sail exec -d laravel.test php artisan reverb:start --host=0.0.0.0 --port=8080 >/dev/null 2>&1
fi
sail exec laravel.test sh -c \
  'for i in $(seq 1 30); do php -r "exit((int)!@fsockopen(\"127.0.0.1\",8080));" && exit 0; sleep 1; done; exit 1' \
  >/dev/null 2>&1 || say "(warn) Reverb did not come up on :8080 — grant will 500"

UPLOAD_USER=$(grep '^ORACLE_UPLOAD_USERNAME=' .env | cut -d= -f2)
UPLOAD_KEY=$(grep '^ORACLE_UPLOAD_API_KEY=' .env | cut -d= -f2)

GRANT=$(curl -sS -m 10 -X POST "$API/telephony/grant" -H 'Content-Type: application/json' \
  -d "{\"phone\":\"9991234567\",\"username\":\"$UPLOAD_USER\",\"password\":\"$UPLOAD_KEY\"}")
check "telephony grant code 1" '"code":1' "$GRANT"

CHK=$(curl -sS -m 10 -X POST "$API/telephony/check" -H 'Content-Type: application/json' -d '{"phone":"9991234567"}')
check "telephony check auth true"  '"auth":true'  "$CHK"

CHK2=$(curl -sS -m 10 -X POST "$API/telephony/check" -H 'Content-Type: application/json' -d '{"phone":"9991234567"}')
check "telephony check consumed"   '"auth":false' "$CHK2"

check_status "telephony grant wrong key 401" 401 -X POST "$API/telephony/grant" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"9991234567","username":"x","password":"wrong"}'

# --- 5. Sanctum-protected routes ---------------------------------------------
say "-- minting Sanctum token via tinker"
TOKEN=$(sail artisan tinker --execute \
  '$u=App\Models\User::firstOrCreate(["email"=>"smoke@smartwifi.local"],["name"=>"smoke","password"=>bcrypt("x")]);echo $u->createToken("smoke",["*"],now()->addHour())->plainTextToken;' \
  2>/dev/null | tail -1 | tr -d '[:space:]')

TPL=$(curl -sS -m 10 "$API/templates" -H "Authorization: Bearer $TOKEN")
check "templates returns list" '"title"' "$TPL"

# /services needs an Oracle session in cache; without Oracle it must 401 cleanly.
SVC=$(curl -sS -m 10 "$API/services?cid=12" -H "Authorization: Bearer $TOKEN")
check "services without oracle session 401" 'No active Oracle session' "$SVC"

# --- done --------------------------------------------------------------------
say "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]
