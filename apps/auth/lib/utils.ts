import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
