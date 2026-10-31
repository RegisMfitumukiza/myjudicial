import { getSession, signOut } from "next-auth/react";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
  skipRefresh?: boolean; // Prevent infinite refresh loops
  skipLogoutOn401?: boolean; // Don't redirect to login on 401 (public pages)
};

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;

export function setCachedAuthToken(token: string | null, expiresAt?: number) {
  cachedAccessToken = token;
  cachedTokenExpiresAt = expiresAt ?? (token ? Date.now() + 55 * 60 * 1000 : 0);
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token);
      if (expiresAt) localStorage.setItem("tokenExpiresAt", String(expiresAt));
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenExpiresAt");
    }
  }
}

export function getCachedAuthToken(): string | null {
  if (cachedAccessToken && (cachedTokenExpiresAt === 0 || Date.now() < cachedTokenExpiresAt - 60_000)) {
    return cachedAccessToken;
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("accessToken");
    const storedExp = Number(localStorage.getItem("tokenExpiresAt") || 0);
    if (stored && (storedExp === 0 || Date.now() < storedExp - 60_000)) {
      cachedAccessToken = stored;
      cachedTokenExpiresAt = storedExp;
      return stored;
    }
  }
  return null;
}

function resolveApiPath(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Avoid double prefix — Orval-generated paths already include /api/v1
  if (normalizedPath.startsWith(prefix + "/") || normalizedPath === prefix) {
    return `${base}${normalizedPath}`;
  }
  return `${base}${prefix}${normalizedPath}`;
}

function serializeBody(body: unknown): { body?: BodyInit; contentType?: string } {
  if (body instanceof FormData || body instanceof Blob) return { body };
  if (body !== undefined) {
    const serialized = typeof body === "string" ? body : JSON.stringify(body);
    return { body: serialized, contentType: "application/json" };
  }
  return {};
}

async function attachAuthHeaders(headers: Headers, token?: string): Promise<void> {
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    return;
  }
  // Respect an Authorization header that was explicitly passed by the caller
  if (!headers.has("Authorization")) {
    if (typeof window !== "undefined") {
      // 1. Check in-memory/localStorage fast cache first to avoid redundant session fetches
      const fastToken = getCachedAuthToken();
      if (fastToken) {
        headers.set("Authorization", `Bearer ${fastToken}`);
        return;
      }

      // 2. NextAuth session is the single source of truth — fetch and cache it
      const session = await getSession();
      const accessToken = (session as { accessToken?: string; tokenExpiresAt?: number } | null)?.accessToken;
      const expiresAt = (session as { tokenExpiresAt?: number } | null)?.tokenExpiresAt;
      if (accessToken) {
        setCachedAuthToken(accessToken, expiresAt);
        headers.set("Authorization", `Bearer ${accessToken}`);
        return;
      }

      // 3. Fallback only when NextAuth session is unavailable (e.g. initial render)
      const stored = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      if (stored) headers.set("Authorization", `Bearer ${stored}`);
    }
  }
}

/**
 * Attempts to refresh the access token using NextAuth or the refresh token.
 * Returns the new access token or null if refresh failed.
 * Uses a singleton promise to prevent concurrent refresh attempts.
 */
export async function refreshAccessToken(failedToken?: string): Promise<string | null> {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Invalidate current cached token
      setCachedAuthToken(null);

      // Attempt 1: Trigger NextAuth session refresh.
      // NextAuth's server jwt callback automatically calls backend /auth/refresh
      // when the token is expiring or expired, rotating the tokens safely in the HTTP cookie.
      if (typeof window !== "undefined") {
        const session = await getSession();
        const nextAuthSession = session as { accessToken?: string; tokenExpiresAt?: number; error?: string; refreshToken?: string } | null;

        if (nextAuthSession?.error === "RefreshAccessTokenError") {
          console.warn("[apiClient] NextAuth session refresh failed permanently");
          return null;
        }

        // Only reuse the session's access token if it is DIFFERENT from the one that just failed
        // and its expiration timestamp is safely in the future.
        const isFresh = Boolean(
          nextAuthSession?.accessToken &&
          nextAuthSession.accessToken !== failedToken &&
          (!nextAuthSession.tokenExpiresAt || Date.now() < nextAuthSession.tokenExpiresAt - 30_000)
        );

        if (isFresh && nextAuthSession?.accessToken) {
          setCachedAuthToken(nextAuthSession.accessToken, nextAuthSession.tokenExpiresAt);
          return nextAuthSession.accessToken;
        }
      }

      // Attempt 2: Direct call to /auth/refresh if refresh token is available
      let refreshToken: string | null = null;

      if (typeof window !== "undefined") {
        refreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
        if (!refreshToken) {
          const session = await getSession();
          refreshToken = (session as { refreshToken?: string } | null)?.refreshToken ?? null;
        }
      }

      if (!refreshToken) {
        console.warn("[apiClient] No refresh token available");
        return null;
      }

      // Call the refresh endpoint directly
      const response = await fetch(resolveApiPath("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error("[apiClient] Direct token refresh failed:", response.status);
        return null;
      }

      const result = await parseJsonBody<any>(response);
      const newAccessToken = result?.data?.accessToken;
      const newRefreshToken = result?.data?.refreshToken;
      const expiresIn = result?.data?.expiresIn ?? 3600;

      if (!newAccessToken) {
        console.error("[apiClient] No access token in refresh response");
        return null;
      }

      const expiresAt = Date.now() + expiresIn * 1000;
      setCachedAuthToken(newAccessToken, expiresAt);
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("tokenExpiresAt", String(expiresAt));
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
      }

      console.log("[apiClient] Token refreshed successfully via direct endpoint");
      return newAccessToken;
    } catch (error) {
      console.error("[apiClient] Token refresh error:", error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

let isLoggingOut = false;

/**
 * Logs out the user by clearing tokens and redirecting to login.
 * Guarded against concurrent calls and auth-page loops.
 */
async function handleLogout() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  setCachedAuthToken(null);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("tokenExpiresAt");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("tokenExpiresAt");
  }

  // Use next-auth signOut if available
  try {
    await signOut({ redirect: false });
  } catch (error) {
    // Ignore signOut errors
  }

  // Redirect to sign-in with locale prefix and force=1 so login form is guaranteed to show
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const isAuthPage = /\/(sign-in|sign-up|post-auth|forgot-password|reset-password)(\/|$)/.test(pathname);
    if (!isAuthPage) {
      const stored = localStorage.getItem("mj_lang");
      const match = pathname.match(/^\/(en|fr|rw)(\/|$)/);
      const locale = match ? match[1] : (stored && ["en", "fr", "rw"].includes(stored) ? stored : "en");
      const isAdmin =
        pathname.includes("/admin") ||
        window.location.search.includes("admin=1") ||
        window.location.hostname.toLowerCase().startsWith("admin.");
      window.location.href = isAdmin ? `/${locale}/sign-in?admin=1&force=1` : `/${locale}/sign-in?force=1`;
    }
  }
}

async function doFetch(path: string, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers);
  await attachAuthHeaders(headers, options.token);
  const { body, contentType } = serializeBody(options.body);
  if (contentType) headers.set("content-type", contentType);

  return fetch(resolveApiPath(path), {
    ...options,
    headers,
    body,
    credentials: "include",
  });
}

function makeError(payload: any, status?: number): Error {
  let message = payload?.message ?? payload?.error?.message ?? "Request failed.";
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    message = `${message}: ${payload.errors.join("; ")}`;
  }
  const error: any = new Error(message);
  // Attach the machine-readable code so callers can map it to frontend i18n keys
  // without depending on the pre-translated backend message string.
  if (payload?.code) error.code = payload.code;
  if (Array.isArray(payload?.errors)) error.errors = payload.errors;
  // Attach the HTTP status so callers (e.g. React Query's retry logic) can
  // distinguish permanent client errors (4xx) from transient server/network ones.
  if (status !== undefined) error.status = status;
  return error;
}


/**
 * Core fetch with automatic token refresh on 401 errors.
 * Industry-standard pattern: retry once with refreshed token, logout if refresh fails.
 */
async function fetchWithRefresh<T>(
  path: string,
  options: ApiFetchOptions = {},
  isRetry = false
): Promise<Response> {
  const response = await doFetch(path, options);

  // If not a 401, return immediately
  if (response.status !== 401) {
    return response;
  }

  // If this is already a retry or skipRefresh is set, don't retry again
  if (isRetry || options.skipRefresh) {
    return response;
  }

  // Skip refresh for auth endpoints to prevent loops
  if (path.includes("/auth/login") || path.includes("/auth/refresh") || path.includes("/auth/register")) {
    return response;
  }

  console.log("Access token expired, attempting refresh...");

  // Try to refresh the token, passing the failed token to avoid reusing it
  const failedToken = options.token || getCachedAuthToken() || undefined;
  const newAccessToken = await refreshAccessToken(failedToken);

  if (!newAccessToken) {
    console.warn("[apiClient] Token refresh did not produce a new access token");
    if (options.skipLogoutOn401) return response;

    // Do NOT log out if the device is currently offline or connection was interrupted
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (isOnline && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isProtectedRoute = /\/(client|expert|admin)(\/|$)/.test(currentPath);
      if (isProtectedRoute) {
        console.warn("[apiClient] Session permanently expired on protected route, logging out...");
        await handleLogout();
      }
    }
    return response;
  }

  // Retry the original request with the new token
  console.log("Retrying request with new token...");
  const retryResponse = await fetchWithRefresh(path, { ...options, token: newAccessToken }, true);
  if (retryResponse.status === 401 && !options.skipLogoutOn401) {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (isOnline && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isProtectedRoute = /\/(client|expert|admin)(\/|$)/.test(currentPath);
      if (isProtectedRoute) {
        console.warn("[apiClient] Retry with fresh token also failed with 401 on protected route, logging out...");
        await handleLogout();
      }
    }
  }
  return retryResponse;
}

/** Safely parses response body as JSON. Returns undefined for 204 or empty/whitespace responses. */
async function parseJsonBody<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) return undefined;
  try {
    const text = await response.text();
    if (!text || !text.trim()) return undefined;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error(`[apiClient] Failed to parse JSON response (${response.status}):`, err);
    throw new Error(`Invalid JSON response received from server (${response.status})`);
  }
}

/** Safely extracts error payload if present without throwing SyntaxError on empty bodies. */
async function parseErrorPayload(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Returns only the parsed JSON body. Used by direct callers. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const response = await fetchWithRefresh(path, options);
  if (!response.ok) throw makeError(await parseErrorPayload(response), response.status);
  return (await parseJsonBody<T>(response)) as T;
}

/** Returns the raw Blob response. Used for downloading files. */
export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}): Promise<Blob> {
  const response = await fetchWithRefresh(path, options);
  if (!response.ok) throw makeError(await parseErrorPayload(response), response.status);
  return await response.blob();
}

/** Returns { data, status, headers } envelope. Used by the Orval custom mutator.
 * Public signature uses `RequestInit` so that `SecondParameter<typeof apiFetchEnvelope>`
 * resolves correctly in generated hooks. Internally cast to ApiFetchOptions to support
 * `body: unknown`. The `as unknown as T` cast lets TypeScript accept the discriminated
 * union response types Orval generates — the generated call-sites own the narrowing. */
export async function apiFetchEnvelope<T>(path: string, options?: RequestInit): Promise<T> {
  const opts = options as ApiFetchOptions | undefined;
  const response = await fetchWithRefresh(path, opts ?? {});
  if (!response.ok) throw makeError(await parseErrorPayload(response), response.status);
  const data = await parseJsonBody(response);
  return { data, status: response.status, headers: response.headers } as unknown as T;
}

