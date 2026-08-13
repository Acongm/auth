#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANONICAL="$ROOT/packages/auth-client/src"

declare -a CONSUMERS=(
  "${AUTH_CHAT_CLIENT:-$ROOT/../chat/packages/auth-client/src}"
  "${AUTH_PORTAL_CLIENT:-$ROOT/../portal/packages/auth-client/src}"
)

echo "Syncing auth-client from auth -> consumers"
for consumer in "${CONSUMERS[@]}"; do
  if [[ ! -d "$(dirname "$consumer")" ]]; then
    echo "skip missing consumer parent: $consumer"
    continue
  fi
  mkdir -p "$consumer"
  cp -a "$CANONICAL/." "$consumer/"
  echo "  synced -> $consumer"
done

echo "Done. Run ./scripts/check-auth-client-drift.sh to verify."
