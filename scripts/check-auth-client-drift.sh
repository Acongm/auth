#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANONICAL="$ROOT/packages/auth-client/src"

declare -a CONSUMERS=(
  "${AUTH_CHAT_CLIENT:-}"
  "${AUTH_PORTAL_CLIENT:-}"
)

if [[ ${#CONSUMERS[@]} -eq 0 || -z "${CONSUMERS[0]}" ]]; then
  CONSUMERS=(
    "$ROOT/../chat/packages/auth-client/src"
    "$ROOT/../portal/packages/auth-client/src"
  )
fi

fail=0

for consumer in "${CONSUMERS[@]}"; do
  if [[ ! -d "$consumer" ]]; then
    echo "skip missing consumer: $consumer"
    continue
  fi

  label="$(basename "$(dirname "$(dirname "$consumer")")")"
  echo "Checking auth-client drift: auth -> $label"

  while IFS= read -r file; do
    rel="${file#"$CANONICAL"/}"
    target="$consumer/$rel"
    if [[ ! -f "$target" ]]; then
      echo "  missing file in consumer: $rel"
      fail=1
      continue
    fi
    if ! diff -q "$file" "$target" >/dev/null; then
      echo "  drift: $rel"
      fail=1
    fi
  done < <(find "$CANONICAL" -type f \( -name '*.ts' -o -name '*.tsx' \) | sort)
done

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "auth-client drift detected. Canonical source: $CANONICAL"
  echo "Sync consumers with: rsync -a --delete $CANONICAL/ <consumer>/"
  exit 1
fi

echo "auth-client consumers match canonical source."
