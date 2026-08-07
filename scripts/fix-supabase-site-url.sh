#!/usr/bin/env bash
# Patch ONLY Supabase Auth Site URL + redirect allow list (production).
# Fixes OAuth landing on http://localhost:3000/?code=...
#
#   export SUPABASE_ACCESS_TOKEN=sbp_...   # https://supabase.com/dashboard/account/tokens
#   ./scripts/fix-supabase-site-url.sh
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-ejprvntpxlyydkzsjqnv}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN" >&2
  echo "Create one at: https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

PAYLOAD=$(python3 - <<'PY'
import json
print(json.dumps({
  "site_url": "https://auth.acongm.com",
  "uri_allow_list": "\n".join([
    "https://auth.acongm.com/callback",
    "https://auth.acongm.com/callback/**",
    "https://auth.acongm.com/**",
    "http://localhost:3100/callback",
    "http://localhost:3100/callback/**",
    "https://www.acongm.com/**",
    "https://chat.acongm.com/**",
    "http://localhost:3000/**",
    "http://localhost:3200/**",
  ]),
}))
PY
)

echo "GET current auth config..."
curl -sS -o /tmp/supabase-auth-before.json -w "HTTP %{http_code}\n" \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}"
python3 - <<'PY'
import json
try:
  d=json.load(open('/tmp/supabase-auth-before.json'))
  print('current site_url:', d.get('site_url'))
  print('uri_allow_list:', (d.get('uri_allow_list') or '')[:300])
except Exception as e:
  print('parse before failed', e)
PY

echo "PATCH site_url -> https://auth.acongm.com ..."
HTTP=$(curl -sS -o /tmp/supabase-auth-after.json -w "%{http_code}" \
  -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "HTTP $HTTP"
python3 - <<'PY'
import json
d=json.load(open('/tmp/supabase-auth-after.json'))
print('new site_url:', d.get('site_url'))
print('uri_allow_list:', (d.get('uri_allow_list') or '')[:400])
if d.get('site_url') != 'https://auth.acongm.com':
  raise SystemExit('site_url not updated')
print('OK')
PY

if [[ "$HTTP" != "200" ]]; then
  exit 1
fi
