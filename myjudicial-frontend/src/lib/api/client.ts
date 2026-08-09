import { getSession, signOut } from "next-auth/react";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
  skipRefresh?: boolean; // Prevent infinite refresh loops
};

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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
      // NextAuth session is the single source of truth — it always reflects the current user.
      // localStorage/sessionStorage may contain stale tokens from a previous session.
      const session = await getSession();
      const accessToken = (session as { accessToken?: string } | null)?.accessToken;
      if (accessToken) { headers.set("Authorization", `Bearer ${accessToken}`); return; }

      // Fallback only when NextAuth session is unavailable (e.g. token refresh in progress)
      const stored = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      if (stored) headers.set("Authorization", `Bearer ${stored}`);
    }
  }
}

/**
 * Attempts to refresh the access token using the refresh token.
 * Returns the new access token or null if refresh failed.
 * Uses a singleton promise to prevent concurrent refresh attempts.
 */
export async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Get refresh token from storage or session
      let refreshToken: string | null = null;
      
      if (typeof window !== "undefined") {
        refreshToken = sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
      }
      
      if (!refreshToken && typeof window !== "undefined") {
        const session = await getSession();
        refreshToken = (session as { refreshToken?: string } | null)?.refreshToken ?? null;
      }

      if (!refreshToken) {
        console.warn("No refresh token available");
        return null;
      }

      // Call the refresh endpoint
      const response = await fetch(resolveApiPath("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Token refresh failed:", response.status);
        return null;
      }

      const result = await response.json();
      const newAccessToken = result.data?.accessToken;
      const newRefreshToken = result.data?.refreshToken;

      if (!newAccessToken) {
        console.error("No access token in refresh response");
        return null;
      }

      // Store new tokens
      if (typeof window !== "undefined") {
        const storageType = sessionStorage.getItem("accessToken") ? sessionStorage : localStorage;
        storageType.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          storageType.setItem("refreshToken", newRefreshToken);
        }
      }

      console.log("Token refreshed successfully");
      return newAccessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Logs out the user by clearing tokens and redirecting to login.
 */
async function handleLogout() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  
  // Use next-auth signOut if available
  try {
    await signOut({ redirect: false });
  } catch (error) {
    // Ignore signOut errors
  }
  
  // Redirect to sign-in with locale prefix
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mj_lang");
    const locale = stored && ["en", "fr", "rw"].includes(stored) ? stored : "en";
    window.location.href = `/${locale}/sign-in`;
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

  // Try to refresh the token
  const newAccessToken = await refreshAccessToken();

  if (!newAccessToken) {
    console.warn("Token refresh failed, logging out...");
    await handleLogout();
    return response; // Return the 401 response
  }

  // Retry the original request with the new token
  console.log("Retrying request with new token...");
  return fetchWithRefresh(path, { ...options, token: newAccessToken }, true);
}

/** Returns only the parsed JSON body. Used by direct callers. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  const response = await fetchWithRefresh(path, options);
  if (!response.ok) throw makeError(await response.json().catch(() => null), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Returns the raw Blob response. Used for downloading files. */
export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}): Promise<Blob> {
  const response = await fetchWithRefresh(path, options);
  if (!response.ok) throw makeError(await response.json().catch(() => null), response.status);
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
  if (!response.ok) throw makeError(await response.json().catch(() => null), response.status);
  const data = response.status === 204 ? undefined : (await response.json());
  return { data, status: response.status, headers: response.headers } as unknown as T;
}
