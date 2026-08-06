#!/usr/bin/env bash
# Push production env vars to Vercel projects (auth / portal / chat).
# Requires: `npx vercel login` or VERCEL_TOKEN.
#
# Run from acongm workspace root OR from auth/:
#   ./auth/scripts/configure-vercel-env.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -d "$SCRIPT_DIR/../portal" && -d "$SCRIPT_DIR/../chat" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [[ -d "$SCRIPT_DIR/../../portal" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
  ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://ejprvntpxlyydkzsjqnv.supabase.co}"

if [[ -z "$ANON_KEY" && -f "$ROOT/auth/apps/auth/.env.local" ]]; then
  ANON_KEY="$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ROOT/auth/apps/auth/.env.local" | cut -d= -f2-)"
fi

if [[ -z "$ANON_KEY" ]]; then
  echo "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or fill auth/apps/auth/.env.local" >&2
  exit 1
fi

VERCEL=(npx --yes vercel@latest)
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL+=(--token "$VERCEL_TOKEN")
fi

add_env() {
  local project_dir="$1"
  local key="$2"
  local value="$3"
  local env_name="${4:-production}"
  (
    cd "$project_dir"
    printf '%s\n' "$value" | "${VERCEL[@]}" env add "$key" "$env_name" --force 2>/dev/null \
      || printf '%s\n' "$value" | "${VERCEL[@]}" env add "$key" "$env_name"
  )
}

echo "ROOT=$ROOT"
echo "== auth =="
add_env "$ROOT/auth" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" production
add_env "$ROOT/auth" NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY" production
add_env "$ROOT/auth" NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ".acongm.com" production

echo "== portal =="
add_env "$ROOT/portal" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" production
add_env "$ROOT/portal" NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY" production
add_env "$ROOT/portal" NEXT_PUBLIC_AUTH_URL "https://auth.acongm.com" production
add_env "$ROOT/portal" NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ".acongm.com" production
add_env "$ROOT/portal" NEXT_PUBLIC_CHAT_URL "https://chat.acongm.com" production
add_env "$ROOT/portal" NEXT_PUBLIC_SITE_URL "https://www.acongm.com" production

echo "== chat =="
add_env "$ROOT/chat" NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" production
add_env "$ROOT/chat" NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY" production
add_env "$ROOT/chat" NEXT_PUBLIC_AUTH_URL "https://auth.acongm.com" production
add_env "$ROOT/chat" NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ".acongm.com" production
add_env "$ROOT/chat" NEXT_PUBLIC_SITE_URL "https://chat.acongm.com" production

echo "Done. Redeploy projects. Do NOT set NEXT_PUBLIC_AUTH_LOCAL in production."
