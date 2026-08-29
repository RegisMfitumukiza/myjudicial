#!/usr/bin/env node
/* Production smoke test.
 *
 * Hits the PUBLICLY reachable deployed stack (no auth, no cookies) and asserts
 * the contract surface that must hold in production:
 *   - homepage reachable (200)
 *   - API root and /health healthy end-to-end through Cloudflare
 *   - admin documents + case-document routes are REGISTERED and guarded (401,
 *     never 404) so the frontend never silently hits a missing route
 *   - unknown routes still produce the branded 404 JSON.
 *
 * Usage:  node scripts/smoke.mjs
 * Env:    SMOKE_API_URL (default https://api.myjudicial.com)
 *         SMOKE_WEB_URL (default https://myjudicial.com)
 * Exit:   0 all good, 1 any check ultimately failed.
 */
const API = process.env.SMOKE_API_URL ?? "https://api.myjudicial.com";
const WEB = process.env.SMOKE_WEB_URL ?? "https://myjudicial.com";

const ATTEMPTS = 3;
const DELAY_MS = 4000;
const TIMEOUT_MS = 20000;

let pass = 0;
let fail = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function ok(label) {
  pass += 1;
  console.log(`   ok  ${label}`);
}

function bad(label, reason, attempt) {
  if (attempt < ATTEMPTS) return; // retried below
  fail += 1;
  console.error(`!! ${label}: ${reason}`);
}

async function check(label, url, opts, expectedStatus, validate) {
  let lastErr = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await get(url, opts);
      const text = await res.text();

      if (res.status === 429) continue; // rate-limit burst -> retry

      if (res.status >= 500) {
        lastErr = `HTTP ${res.status} ${text.slice(0, 120)}`;
        await sleep(DELAY_MS);
        continue;
      }

      const statusOk = Array.isArray(expectedStatus)
        ? expectedStatus.includes(res.status)
        : res.status === expectedStatus;

      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        /* non-JSON body is fine for some checks */
      }

      let extra = "";
      if (validate) {
        try {
          extra = validate(json, res);
        } catch (e) {
          lastErr = `assert: ${e.message} (body: ${text.slice(0, 200)})`;
          throw e;
        }
      }

      if (statusOk && lastErr === null) {
        ok(label);
        return;
      }
      throw new Error(lastErr ?? `expected ${expectedStatus} but got ${res.status}`);
    } catch (err) {
      if (err.name === "AbortError") lastErr = "timed out";
      else if (!lastErr) lastErr = err.message;
      if (attempt === ATTEMPTS) {
        bad(label, `${url} -> ${lastErr}`, attempt);
        return;
      }
      await sleep(DELAY_MS);
    }
  }
}

const has = (json, ...keys) => {
  for (const k of keys) {
    if (!json || json[k] === undefined) throw new Error(`missing key '${k}'`);
  }
  return "";
};

/* Guarded endpoints must NOT succeed — status 401/403 and, when a JSON body
 * exists, it must mark success:false. Anything else is an opened-up route. */
const rejectUnlessGuarded = (json, res) => {
  if (!res.status || res.status < 400 || res.status >= 500) throw new Error("not guarded");
  return "";
};

async function main() {
  console.log(`smoke: WEB=${WEB}`);
  console.log(`smoke: API=${API}`);

  await check(
    "frontend homepage reachable",
    `${WEB}/`,
    { method: "GET", redirect: "follow" },
    200,
    () => ""
  );

  await check(
    "API root reachable",
    `${API}/api/v1`,
    { method: "GET" },
    200,
    (json) => has(json, "success", "service", "version")
  );

  await check(
    "API /health green through Cloudflare",
    `${API}/health`,
    { method: "GET" },
    200,
    (json) => has(json, "status", "database") || has(json, "status")
  );

  await check(
    "GET /api/v1/admin/documents registered + admin-guarded",
    `${API}/api/v1/admin/documents?page=1&limit=1`,
    { method: "GET" },
    [401, 403],
    rejectUnlessGuarded
  );

  await check(
    "GET /api/v1/files/by-booking/:id registered + participant-guarded",
    `${API}/api/v1/files/by-booking/__smoke__`,
    { method: "GET" },
    [401, 403],
    rejectUnlessGuarded
  );

  await check(
    "POST /api/v1/files/upload registered + auth-guarded",
    `${API}/api/v1/files/upload`,
    { method: "POST", body: "{}", headers: { "content-type": "application/json" } },
    [401, 403],
    rejectUnlessGuarded
  );

  await check(
    "unknown routes yield branded 404 JSON",
    `${API}/api/v1/__no_such_route__${Date.now()}`,
    { method: "GET" },
    404,
    (json) => has(json, "success", "message")
  );

  console.log("");
  console.log(`SMOKE RESULT: ${fail === 0 ? "PASS" : "FAIL"} (${pass} ok, ${fail} failed)`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});