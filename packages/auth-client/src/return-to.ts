export function isAcongmHostname(hostname: string): boolean {
  return hostname === 'acongm.com' || hostname.endsWith('.acongm.com');
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );
}

export function inferReturnToFromUrl(
  value: string | null | undefined,
  options?: { allowLocalhost?: boolean },
): string | null {
  if (!value || !isSafeHttpUrl(value)) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!options?.allowLocalhost && isLocalHostname(parsed.hostname)) {
      return null;
    }
    if (!isAcongmHostname(parsed.hostname)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Prefer explicit return_to, then current page URL when in the browser. */
export function resolveLoginReturnTo(explicit?: string): string | undefined {
  if (explicit?.trim()) {
    return explicit.trim();
  }

  if (typeof window !== 'undefined') {
    return window.location.href;
  }

  return undefined;
}
