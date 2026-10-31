import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Server-side (NextAuth route handlers run on the server). Must use a
// non-public env var: Next.js statically inlines NEXT_PUBLIC_* at BUILD time,
// which baked the public Cloudflare URL into the bundle. Containers cannot
// egress to Cloudflare, so verification timed out -> "invalid or expired".
const BACKEND_URL =
  process.env.AUTH_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

async function fetchBackend<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, TLS) — log loudly so
    // misconfigured BACKEND_URL is obvious in server logs instead of surfacing
    // as a generic "code invalid or expired" to users.
    console.error(`[auth] Cannot reach backend at ${BACKEND_URL}${API_PREFIX}${path}:`, err);
    throw err;
  }

  const text = await response.text();
  let payload: any = null;
  if (text && text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? "Authentication failed";
    console.error(`[auth] Backend ${path} responded ${response.status}: ${message}`);
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return (payload ?? {}) as T;
}

type BackendSession = {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
      role: string;
      status?: string;
      expertProfile?: { id: string; status: string } | null;
    };
  };
};

/**
 * Map a backend auth failure to a distinct CredentialsSignin code so the
 * sign-in form can show the real cause instead of one generic message.
 * Unknown/invalid-credential failures return null (generic CredentialsSignin).
 */
function throwMapAuthFailure(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  if (
    lower.includes("too many verification attempts") ||
    lower.includes("too many authentication attempts")
  ) {
    const err = new CredentialsSignin();
    err.code = "TooManyAttempts";
    throw err;
  }
  if (lower.includes("too many login attempts")) {
    const err = new CredentialsSignin();
    err.code = "TooManyLoginAttempts";
    throw err;
  }
  if (lower.includes("service unavailable") || lower.includes("server error") || lower.includes("cannot reach backend")) {
    const err = new CredentialsSignin();
    err.code = "ServerError";
    throw err;
  }
  if (lower.includes("account not found")) {
    const err = new CredentialsSignin();
    err.code = "AccountNotFound";
    throw err;
  }
  const err = new CredentialsSignin();
  err.code = "CredentialsSignin";
  throw err;
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        const rememberMe = credentials?.rememberMe === "true" || credentials?.rememberMe === true;
        if (!email || !code) return null;

        try {
          const result = await fetchBackend<BackendSession>("/auth/otp/verify", {
            email,
            token: code,
            rememberMe,
          });

          return {
            id: result.data.user.id,
            email: result.data.user.email,
            name: `${result.data.user.firstName} ${result.data.user.lastName}`,
            role: result.data.user.role,
            status: result.data.user.status ?? "ACTIVE",
            firstName: result.data.user.firstName,
            lastName: result.data.user.lastName,
            phone: result.data.user.phone || null,
            expertProfile: result.data.user.expertProfile || null,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            tokenExpiresAt: Date.now() + (result.data.expiresIn ?? 3600) * 1000,
            rememberMe,
          };
        } catch (error) {
          throwMapAuthFailure(error);
        }
      },
    }),
    Credentials({
      id: "email-magic",
      name: "Email Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token as string | undefined;
        if (!token) return null;

        // Magic link verification is handled by Supabase directly
        // NextAuth needs to look up the user from the session cookie
        // This provider just ensures a session can be created post-magic-link
        return null;
      },
    }),
    Credentials({
      id: "admin-password",
      name: "Admin Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const rememberMe = credentials?.rememberMe === "true" || credentials?.rememberMe === true;
        if (!email || !password) return null;

        try {
          const result = await fetchBackend<BackendSession>("/auth/admin/login", {
            email,
            password,
            rememberMe,
          });

          return {
            id: result.data.user.id,
            email: result.data.user.email,
            name: `${result.data.user.firstName} ${result.data.user.lastName}`,
            role: result.data.user.role,
            status: result.data.user.status ?? "ACTIVE",
            firstName: result.data.user.firstName,
            lastName: result.data.user.lastName,
            phone: result.data.user.phone || null,
            expertProfile: null,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            tokenExpiresAt: Date.now() + (result.data.expiresIn ?? 3600) * 1000,
            rememberMe,
          };
        } catch (error) {
          throwMapAuthFailure(error);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      // Clear token completely on signOut (cast because NextAuth v5 types omit "signOut")
      if ((trigger as string) === "signOut") {
        return {};
      }
      
      if (user) {
        const userAny = user as Record<string, unknown>;
        // Complete token replacement on new login — clear any residual session errors
        delete token.error;
        token.id = user.id;
        token.accessToken = userAny.accessToken as string;
        token.refreshToken = userAny.refreshToken as string;
        token.role = userAny.role;
        token.status = userAny.status ?? "ACTIVE";
        token.firstName = userAny.firstName as string;
        token.lastName = userAny.lastName as string;
        token.phone = userAny.phone as string | null;
        token.expertProfile = userAny.expertProfile || null;
        token.tokenExpiresAt = userAny.tokenExpiresAt as number | undefined;
        token.email = user.email;
        token.name = user.name;

        const rememberMe = userAny.rememberMe === true;
        token.rememberMe = rememberMe;

        // Set dynamic session duration:
        // - Remembered: 30 days
        // - Unremembered: 8 hours for ADMIN, 24 hours for CITIZEN / EXPERT
        const nowSec = Math.floor(Date.now() / 1000);
        const durationSec = rememberMe
          ? 30 * 24 * 60 * 60
          : userAny.role === "ADMIN"
            ? 8 * 60 * 60
            : 24 * 60 * 60;
        const sessionExpiresAt = nowSec + durationSec;
        token.authTime = nowSec;
        token.sessionExpiresAt = sessionExpiresAt;
        token.exp = sessionExpiresAt;
      } else {
        // Enforce hard session expiration boundary (no drift on idle session refreshes)
        const nowSec = Math.floor(Date.now() / 1000);
        const sessionExpiresAt = typeof token.sessionExpiresAt === "number" ? token.sessionExpiresAt : 0;
        if (sessionExpiresAt > 0) {
          if (nowSec >= sessionExpiresAt) {
            // Hard session lifetime reached — invalidate session immediately
            return {};
          }
          token.exp = sessionExpiresAt;
        }
      }
      
      if (trigger === "update" && updateData) {
        const upd = updateData as Record<string, unknown>;
        if (upd.accessToken) token.accessToken = upd.accessToken as string;
        if (upd.refreshToken) token.refreshToken = upd.refreshToken as string;
        if (upd.tokenExpiresAt) token.tokenExpiresAt = upd.tokenExpiresAt as number;
        if (upd.firstName) token.firstName = upd.firstName as string;
        if (upd.lastName) token.lastName = upd.lastName as string;
        if (upd.phone !== undefined) token.phone = upd.phone as string | null;
        if (upd.expertProfile !== undefined) token.expertProfile = upd.expertProfile;
      }

      // Automatic proactive token rotation:
      // If access token is expired, within 5 minutes of expiring, or forceRefresh requested
      const tokenExpiresAt = typeof token.tokenExpiresAt === "number" ? token.tokenExpiresAt : 0;
      const refreshToken = token.refreshToken as string | undefined;
      const forceRefresh = Boolean(trigger === "update" && (updateData as Record<string, unknown> | undefined)?.forceRefresh);
      const isExpiringSoon = Boolean(
        refreshToken &&
        (tokenExpiresAt === 0 || Date.now() >= (tokenExpiresAt - 5 * 60 * 1000) || forceRefresh)
      );

      if (isExpiringSoon && refreshToken) {
        try {
          const refreshRes = await fetchBackend<{
            data: { accessToken: string; refreshToken: string; expiresIn: number };
          }>("/auth/refresh", { refreshToken });

          if (refreshRes?.data?.accessToken) {
            token.accessToken = refreshRes.data.accessToken;
            token.refreshToken = refreshRes.data.refreshToken || refreshToken;
            token.tokenExpiresAt = Date.now() + (refreshRes.data.expiresIn ?? 3600) * 1000;
            delete token.error;
          }
        } catch (error: any) {
          console.error("[auth] Background token refresh failed:", error);
          // Only mark session as expired if the backend explicitly rejected the token (400, 401, 403)
          // or if the token is already past its expiration boundary.
          const status = error?.status;
          if (status === 400 || status === 401 || status === 403 || (tokenExpiresAt > 0 && Date.now() >= tokenExpiresAt)) {
            token.error = "RefreshAccessTokenError";
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.exp) {
        session.expires = new Date((token.exp as number) * 1000) as unknown as typeof session.expires;
      }
      // Ensure session data matches token completely
      const userId = (token.id || token.sub) as string | undefined;
      if (!userId) {
        return session;
      }
      if (session.user && userId) {
        session.user.id = String(userId);
        session.user.email = String(token.email || session.user.email);
        session.user.name = String(token.name || session.user.name);
        if (token.role && String(token.role) !== "undefined") {
          session.user.role = String(token.role).trim().toUpperCase();
        }
        session.user.firstName = String(token.firstName || "");
        session.user.lastName = String(token.lastName || "");
        session.user.phone = token.phone as string | null;
        
        const sessionAny = session as unknown as Record<string, unknown>;
        const tokenAny = token as unknown as Record<string, unknown>;
        sessionAny.accessToken = tokenAny.accessToken;
        sessionAny.refreshToken = tokenAny.refreshToken;
        sessionAny.tokenExpiresAt = tokenAny.tokenExpiresAt;
        sessionAny.status = tokenAny.status ?? "ACTIVE";
        sessionAny.rememberMe = tokenAny.rememberMe ?? false;
        if (tokenAny.error) {
          sessionAny.error = tokenAny.error;
        }
        (session.user as unknown as Record<string, unknown>).expertProfile = tokenAny.expertProfile || null;
      }
      
      return session;
    },
  },
});