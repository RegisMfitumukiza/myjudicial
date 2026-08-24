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
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, TLS) — log loudly so
    // misconfigured BACKEND_URL is obvious in server logs instead of surfacing
    // as a generic "code invalid or expired" to users.
    console.error(`[auth] Cannot reach backend at ${BACKEND_URL}${API_PREFIX}${path}:`, err);
    throw err;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? payload?.error?.message ?? "Authentication failed";
    console.error(`[auth] Backend ${path} responded ${response.status}: ${message}`);
    throw new Error(message);
  }

  return response.json();
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
  return null as never;
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
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !code) return null;

        try {
          const result = await fetchBackend<BackendSession>("/auth/otp/verify", {
            email,
            token: code,
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
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            tokenExpiresAt: Date.now() + (result.data.expiresIn ?? 3600) * 1000,
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
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const result = await fetchBackend<BackendSession>("/auth/admin/login", {
            email,
            password,
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
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            tokenExpiresAt: Date.now() + (result.data.expiresIn ?? 3600) * 1000,
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
        // Complete token replacement on new login
        token.id = user.id;
        token.accessToken = (user as Record<string, unknown>).accessToken as string;
        token.refreshToken = (user as Record<string, unknown>).refreshToken as string;
        token.role = (user as Record<string, unknown>).role;
        token.status = (user as Record<string, unknown>).status ?? "ACTIVE";
        token.firstName = (user as Record<string, unknown>).firstName as string;
        token.lastName = (user as Record<string, unknown>).lastName as string;
        token.phone = (user as Record<string, unknown>).phone as string | null;
        token.tokenExpiresAt = (user as Record<string, unknown>).tokenExpiresAt as number | undefined;
        token.email = user.email;
        token.name = user.name;
      }
      
      if (trigger === "update" && updateData) {
        const upd = updateData as Record<string, unknown>;
        if (upd.accessToken) token.accessToken = upd.accessToken as string;
        if (upd.refreshToken) token.refreshToken = upd.refreshToken as string;
        if (upd.tokenExpiresAt) token.tokenExpiresAt = upd.tokenExpiresAt as number;
        if (upd.firstName) token.firstName = upd.firstName as string;
        if (upd.lastName) token.lastName = upd.lastName as string;
        if (upd.phone !== undefined) token.phone = upd.phone as string | null;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Ensure session data matches token completely
      if (session.user && token.id) {
        session.user.id = String(token.id);
        session.user.email = String(token.email || session.user.email);
        session.user.name = String(token.name || session.user.name);
        session.user.role = String(token.role);
        session.user.firstName = String(token.firstName || "");
        session.user.lastName = String(token.lastName || "");
        session.user.phone = token.phone as string | null;
        
        const sessionAny = session as unknown as Record<string, unknown>;
        const tokenAny = token as unknown as Record<string, unknown>;
        sessionAny.accessToken = tokenAny.accessToken;
        sessionAny.refreshToken = tokenAny.refreshToken;
        sessionAny.tokenExpiresAt = tokenAny.tokenExpiresAt;
        sessionAny.status = tokenAny.status ?? "ACTIVE";
      }
      
      return session;
    },
  },
});