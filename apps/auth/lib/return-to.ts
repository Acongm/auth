import { loadSiteConfig } from "@acongm/config";
import { isLocalHostname } from "@/lib/utils";

export function isAcongmHostname(hostname: string): boolean {
  return hostname === "acongm.com" || hostname.endsWith(".acongm.com");
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
    if (
      !options?.allowLocalhost &&
      isLocalHostname(parsed.hostname)
    ) {
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

export function getAuthHubReturnTo(): string {
  return loadSiteConfig().domains.auth;
}

export function getPortalReturnTo(): string {
  return loadSiteConfig().domains.portal;
}

/**
 * Resolve where to send the user after login on the auth hub.
 * Priority: explicit return_to → Referer (other acongm apps) → auth hub origin.
 */
export function resolveClientReturnTo(
  explicit: string | null,
  options?: { allowLocalhost?: boolean },
): string {
  if (explicit) {
    return explicit;
  }

  if (typeof document !== "undefined") {
    const fromReferrer = inferReturnToFromUrl(document.referrer, options);
    if (fromReferrer) {
      return fromReferrer;
    }

    if (typeof window !== "undefined") {
      return window.location.origin;
    }
  }

  return getAuthHubReturnTo();
}
