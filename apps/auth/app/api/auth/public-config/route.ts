import { NextResponse } from 'next/server';
import { getSupabasePublicEnv } from '../../../../lib/supabase/env';

const UPSTREAM =
  process.env.AUTH_PUBLIC_CONFIG_URL?.trim() ||
  'https://api.acongm.com/api/auth/public-config';

function jsonConfig(
  supabaseUrl: string | null,
  supabaseAnonKey: string | null,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      supabaseUrl,
      supabaseAnonKey,
      configured: Boolean(supabaseUrl && supabaseAnonKey),
      ...extra,
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}

export async function GET() {
  const local = getSupabasePublicEnv();
  if (local) {
    return jsonConfig(local.supabaseUrl, local.supabaseAnonKey, {
      source: 'local-env',
    });
  }

  try {
    const upstream = await fetch(UPSTREAM, { cache: 'no-store' });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return jsonConfig(null, null, { code: 'AUTH_PUBLIC_CONFIG_UNREACHABLE' });
  }
}
