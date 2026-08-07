#!/usr/bin/env bash
# Configure Supabase Auth providers (GitHub / Google) + redirect URLs.
# Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
#
# Optional:
#   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
#   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=...
#   export GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=...
#   export GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
#   ./scripts/configure-supabase-github-auth.sh
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-ejprvntpxlyydkzsjqnv}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN" >&2
  exit 1
fi

PAYLOAD=$(
  GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-}" \
  GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-}" \
  GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}" \
  GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}" \
  python3 - <<'PY'
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
gh_id = os.environ.get("GITHUB_CLIENT_ID", "").strip()
gh_secret = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()
if gh_id and gh_secret:
  body["external_github_enabled"] = True
  body["external_github_client_id"] = gh_id
  body["external_github_secret"] = gh_secret
else:
  print("WARN: GitHub credentials missing — skip GitHub provider", flush=True)

g_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
g_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
if g_id and g_secret:
  body["external_google_enabled"] = True
  body["external_google_client_id"] = g_id
  body["external_google_secret"] = g_secret
else:
  print("WARN: Google credentials missing — skip Google provider", flush=True)

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
python3 -m json.tool /tmp/supabase-auth-config.json | head -100

if [[ "$HTTP" != "200" ]]; then
  exit 1
fi

echo "Done."
