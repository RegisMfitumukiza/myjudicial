import { GET as authGET, POST as authPOST } from "../../../../../auth";
import { type NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * Industrial session-cookie transformer:
 * - If rememberMe is TRUE: Maintains persistent 30-day cookie (disk storage).
 * - If rememberMe is FALSE: Emits ephemeral Session Cookie (no Max-Age/Expires),
 *   guaranteeing the cookie is deleted in memory as soon as the browser is closed.
 */
function transformSessionCookies(res: Response, makeSessionOnly: boolean, rememberVal?: boolean): Response {
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length === 0) return res;

  res.headers.delete("set-cookie");
  for (const c of cookies) {
    if (/session-token/i.test(c) && makeSessionOnly) {
      // Strip Max-Age and Expires to convert into an in-memory browser session cookie
      const stripped = c
        .replace(/;\s*Max-Age=[^;]+/gi, "")
        .replace(/;\s*Expires=[^;]+/gi, "");
      res.headers.append("set-cookie", stripped);
    } else {
      res.headers.append("set-cookie", c);
    }
  }

  if (rememberVal !== undefined) {
    const secureSuffix = isProd ? "; Secure" : "";
    if (rememberVal) {
      res.headers.append(
        "set-cookie",
        `mj_remember=1; Path=/; Max-Age=2592000; SameSite=Lax${secureSuffix}; HttpOnly`
      );
    } else {
      res.headers.append(
        "set-cookie",
        `mj_remember=0; Path=/; SameSite=Lax${secureSuffix}; HttpOnly`
      );
    }
  }

  return res;
}

export async function POST(req: NextRequest) {
  let rememberMe: boolean | null = null;
  const isCallback = req.nextUrl.pathname.includes("/callback/");
  const isSignOut = req.nextUrl.pathname.includes("/signout");

  if (isCallback) {
    try {
      const clone = req.clone();
      const contentType = req.headers.get("content-type") || "";
      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await clone.formData();
        const rem = formData.get("rememberMe");
        if (rem !== null) {
          rememberMe = rem === "true" || rem === "1";
        }
      } else if (contentType.includes("application/json")) {
        const json = await clone.json();
        if (typeof json?.rememberMe === "boolean") {
          rememberMe = json.rememberMe;
        } else if (typeof json?.rememberMe === "string") {
          rememberMe = json.rememberMe === "true" || json.rememberMe === "1";
        }
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  const res = await authPOST(req);

  if (isSignOut) {
    const secureSuffix = isProd ? "; Secure" : "";
    res.headers.append("set-cookie", `mj_remember=; Path=/; Max-Age=0; SameSite=Lax${secureSuffix}; HttpOnly`);
    return res;
  }

  if (rememberMe !== null) {
    return transformSessionCookies(res, !rememberMe, rememberMe);
  }

  const existingRemember = req.cookies.get("mj_remember")?.value;
  if (existingRemember === "0") {
    return transformSessionCookies(res, true);
  }

  return res;
}

export async function GET(req: NextRequest) {
  const res = await authGET(req);
  const existingRemember = req.cookies.get("mj_remember")?.value;

  if (existingRemember === "0") {
    return transformSessionCookies(res, true);
  }

  return res;
}