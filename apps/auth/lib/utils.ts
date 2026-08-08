export { cn } from "./ui-cn";

export const AUTH_RETURN_TO_COOKIE = "acongm_auth_return_to";

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

export function isAllowedReturnTo(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname;
    return allowedHosts.some((host) => {
      if (host.startsWith("*.")) {
        const suffix = host.slice(1);
        return hostname.endsWith(suffix) || hostname === host.slice(2);
      }

      return hostname === host;
    });
  } catch {
    return false;
  }
}

export function sanitizeReturnTo(
  returnTo: string | null | undefined,
  fallback: string,
  allowedHosts: string[],
): string {
  if (!returnTo) {
    return fallback;
  }

  return isAllowedReturnTo(returnTo, allowedHosts) ? returnTo : fallback;
}
