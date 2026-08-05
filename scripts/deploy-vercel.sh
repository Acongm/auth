#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm install
pnpm build

cd apps/auth

if ! command -v vercel >/dev/null 2>&1; then
  npm install -g vercel@latest
fi

vercel link
vercel env pull .env.vercel.local
vercel --prod

echo "Add domain in Vercel dashboard or run: vercel domains add auth.acongm.com"
