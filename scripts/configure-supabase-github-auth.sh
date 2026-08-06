#!/usr/bin/env bash
# Configure Supabase Auth (nest project) for GitHub OAuth + redirect URLs.
# Requires:
#   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
#   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET — GitHub OAuth App credentials
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=...
#   export GITHUB_CLIENT_ID=...
#   export GITHUB_CLIENT_SECRET=...
#   ./scripts/configure-supabase-github-auth.sh
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-ejprvntpxlyydkzsjqnv}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)" >&2
  exit 1
fi

PAYLOAD=$(GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-}" GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-}" python3 - <<'PY'
import json, os
body = {
  "site_url": "https://auth.acongm.com",
  "uri_allow_list": "\n".join([
    "https://auth.acongm.com/callback",
    "http://localhost:3100/callback",
    "https://www.acongm.com/**",
    "https://chat.acongm.com/**",
    "http://localhost:3000/**",
    "http://localhost:3200/**",
  ]),
}
cid = os.environ.get("GITHUB_CLIENT_ID", "").strip()
secret = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()
if cid and secret:
  body["external_github_enabled"] = True
  body["external_github_client_id"] = cid
  body["external_github_secret"] = secret
else:
  print("WARN: GITHUB_CLIENT_ID/SECRET not set — only updating redirect URLs", flush=True)
print(json.dumps(body))
PY
)

echo "PATCH auth config for $PROJECT_REF ..."
HTTP=$(curl -sS -o /tmp/supabase-auth-config.json -w "%{http_code}" \
  -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "HTTP $HTTP"
python3 -m json.tool /tmp/supabase-auth-config.json | head -80

if [[ "$HTTP" != "200" ]]; then
  exit 1
fi

echo "Done. Verify external.github via /auth/v1/settings"
