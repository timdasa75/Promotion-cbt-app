#!/usr/bin/env node
// Health-check: probe the live Cloudflare Worker and fail when any expected
// admin/auth route returns "Route not found." (frontend/backend drift), when
// a probed route returns a 5xx server error, or when a payment-provider worker
// secret is missing (which silently breaks the corresponding auto-grant path
// and falls back to manual admin review).
//
// Expected routes are DERIVED from the Worker source (worker.js resolver +
// auth-hybrid.js resolver) so this script can never drift from the codebase.
//
// Usage:
//   node scripts/check_worker_routes.mjs [--base-url URL] [--origin ORIGIN]
//     [--timeout-ms N] [--concurrency N] [--warn] [--json]
//     [--check-flutterwave-key] [--no-check-flutterwave-key]
//
//   --base-url  Worker base URL (default: WORKER_BASE_URL env, else parsed
//               from config/runtime-auth.js cloudflareAuthBaseUrl/adminApiBaseUrl)
//   --origin    Origin header to send (default: WORKER_ORIGIN env, else
//               https://timdasa75.github.io). Use "" for no Origin header.
//   --timeout-ms  Per-request timeout (default 15000)
//   --concurrency Number of parallel probes (default 4)
//   --warn      Report findings but exit 0 (default exits 1 on findings)
//   --json      Emit machine-readable JSON summary
//   --check-flutterwave-key  Verify FLW_SECRET_KEY and FLW_WEBHOOK_SECRET_HASH
//               are set on the deployed Worker via `wrangler secret list`
//               (auto-enabled when CLOUDFLARE_API_TOKEN is present). Missing
//               either is a hard finding: FLW_SECRET_KEY gates
//               verifyFlutterwaveTransaction (the /payment/verify and webhook
//               grant chain throw → 500), and FLW_WEBHOOK_SECRET_HASH gates
//               /payment/webhook/flutterwave (the auto-grant bridge throws →
//               500). --no-check-flutterwave-key disables it explicitly.
// Exit codes: 0 = healthy, 1 = findings (missing/5xx routes, missing
//             FLW_SECRET_KEY / FLW_WEBHOOK_SECRET_HASH, or config error),
//             2 = cannot reach the Worker.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import httpModule from "node:http";
import httpsModule from "node:https";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- arguments
function readFlag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "") : "";
}

const args = new Set(process.argv.slice(2));
const baseUrl = readFlag("--base-url") || process.env.WORKER_BASE_URL || "";
const originFlag = args.has("--origin")
  ? readFlag("--origin")
  : String(process.env.WORKER_ORIGIN ?? "https://timdasa75.github.io");
const timeoutMs = Number(readFlag("--timeout-ms") || 15000);
const concurrency = Math.max(1, Math.min(20, Number(readFlag("--concurrency") || 4)));
const warnOnly = args.has("--warn");
const jsonOut = args.has("--json");
const bearerToken = readFlag("--bearer-token");
const checkFlutterwaveKeyFlag = args.has("--check-flutterwave-key")
  ? true
  : args.has("--no-check-flutterwave-key")
    ? false
    : Boolean(process.env.CLOUDFLARE_API_TOKEN);

// ------------------------------------------------------ derive expected routes
const WORKER_FILE = path.join(ROOT_DIR, "workers", "admin-bridge", "worker.js");
const HYBRID_FILE = path.join(ROOT_DIR, "workers", "admin-bridge", "auth-hybrid.js");

// Routes never called by the browser client; probing them with a POST would
// inject synthetic events into the payment flow (webhooks are server-to-server
// and carry their own signature checks). They are excluded from probing.
const PROBE_EXCLUDE = [/^\/payment\/webhook\//, /^\/auth\/register$/];

function extractResolverRoutes(source, functionName) {
  const routes = [];
  const startMarker = `function ${functionName}(`;
  const start = source.indexOf(startMarker);
  if (start < 0) return routes;
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("\n}", bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) return routes;
  const body = source.slice(bodyStart, bodyEnd);
  const pattern = /endsWith\("([^"]+)"\)/g;
  let match = null;
  while ((match = pattern.exec(body)) !== null) {
    routes.push(match[1]);
  }
  return routes;
}

function readSource(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    console.error(`Unable to read ${file}: ${error?.message || error}`);
    process.exit(2);
  }
}

const workerSource = readSource(WORKER_FILE);
const hybridSource = readSource(HYBRID_FILE);

const allResolvedRoutes = [
  ...extractResolverRoutes(workerSource, "resolveRouteHandler"),
  ...extractResolverRoutes(hybridSource, "resolveHybridAuthRouteHandler"),
].filter((route, index, all) => all.indexOf(route) === index).sort();

if (!allResolvedRoutes.length) {
  console.error("No routes could be extracted from the Worker source. Is the resolver intact?");
  process.exit(2);
}

const excludedRoutes = allResolvedRoutes.filter((route) => PROBE_EXCLUDE.some((pattern) => pattern.test(route)));
const expectedRoutes = allResolvedRoutes.filter((route) => !PROBE_EXCLUDE.some((pattern) => pattern.test(route)));

// ------------------------------------------------------------ resolve base URL
function detectBaseUrlFromConfig() {
  const configFile = path.join(ROOT_DIR, "config", "runtime-auth.js");
  try {
    const source = fs.readFileSync(configFile, "utf8");
    const match = source.match(/(?:cloudflareAuthBaseUrl|adminApiBaseUrl)\s*:\s*"([^"]+)"/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

const workerBaseUrl = (baseUrl || detectBaseUrlFromConfig()).replace(/\/+$/, "");
if (!workerBaseUrl) {
  console.error(
    "Worker base URL is required. Pass --base-url <url>, set WORKER_BASE_URL, " +
      "or add cloudflareAuthBaseUrl/adminApiBaseUrl to config/runtime-auth.js.",
  );
  process.exit(2);
}

// ------------------------------------------------------------------- probing
const ORIGIN_ALLOWED_ERROR = "Origin not allowed.";
const RATE_LIMIT_STATUSES = new Set([429, 503]);
const MAX_PROBE_ATTEMPTS = 3;

// One HTTP POST via Node's built-in http/https modules. The global fetch
// (undici) is deliberately avoided: it fails with an SSL "bad record mac"
// error against this Worker on some Node versions, which would make the
// health check flaky in CI. Returns { status, text } or throws.
function httpPost(url, headers, body, signal, timeoutMs) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? httpsModule : httpModule;
    const request = transport.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...headers },
        signal,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve({ status: response.statusCode, text: Buffer.concat(chunks).toString("utf8") }));
        response.on("error", reject);
      },
    );
    request.on("error", reject);
    request.setTimeout(timeoutMs, () => request.destroy(new Error("timeout")));
    request.write(body);
    request.end();
  });
}

// Probe one route (single attempt). Returns an object with `exists: false`
// only on a definitive "Route not found" 404 (the drift signal). Rate-limited
// (429/503) and network-error routes return `resolved: false` so the caller
// can retry them in a later pass after a global cooldown — this tolerates
// free-tier Worker rate limiting across a 31-route burst.
async function probe(route) {
  const url = new URL(`${workerBaseUrl}${route.startsWith("/") ? route : `/${route}`}`);
  const controller = new AbortController();
  try {
    const headers = { Authorization: "Bearer health-check" };
    if (originFlag) headers.Origin = originFlag;
    const { status, text } = await httpPost(url, headers, "{}", controller.signal, timeoutMs);
    let payload = {};
    try {
      payload = JSON.parse(text);
    } catch {
      // non-JSON body; status alone is still informative
    }
    const error = String(payload?.error || "");
    const isRouteNotFound = status === 404 && error.startsWith("Route not found");
    if (isRouteNotFound) {
      return { route, status, error, exists: false, resolved: true, originBlocked: false, networkError: false };
    }
    if (status === 404) {
      // A 404 that does not match the Worker's canonical message: the Worker
      // may have changed its 404 body, which would silently disable drift
      // detection. Report it as unresolved so the operator can confirm.
      return { route, status, error, exists: true, resolved: false, originBlocked: false, networkError: false, unusual404: true };
    }
    if (status === 403 && error === ORIGIN_ALLOWED_ERROR) {
      return { route, status: 403, error, exists: true, resolved: true, originBlocked: true, networkError: false };
    }
    if (RATE_LIMIT_STATUSES.has(status)) {
      // Distinguish worker-handler rate limits from Cloudflare edge throttling:
      // a JSON body with the worker's `error` field means a handler answered
      // (route exists); an HTML edge page means the platform throttled us and
      // the route is still unresolved.
      const isWorkerJson = /\{.*"error"\s*:/.test(text);
      if (isWorkerJson) {
        return { route, status, error, exists: true, resolved: true, originBlocked: false, networkError: false };
      }
      return { route, status, error, exists: true, resolved: false, originBlocked: false, networkError: false };
    }
    if (status >= 500 && !RATE_LIMIT_STATUSES.has(status)) {
      // A 5xx means the route is registered but the handler (or platform) is
      // erroring — e.g. the worker 500s on /payment/verify, silently
      // disabling auto-grant. Surface it as a finding, not "present".
      return {
        route,
        status,
        error: error || text.slice(0, 120),
        exists: true,
        resolved: true,
        originBlocked: false,
        networkError: false,
        serverError: true,
      };
    }
    // Any other response means the route exists (auth errors, etc.).
    return { route, status, error, exists: true, resolved: true, originBlocked: false, networkError: false };
  } catch (error) {
    return {
      route,
      status: 0,
      error: error?.message || "network error",
      exists: false,
      resolved: false,
      originBlocked: false,
      networkError: true,
    };
  } finally {
    controller.abort();
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  let tick = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      tick += 1;
      // Small stagger between requests keeps free-tier Workers from
      // rate-limiting the probe burst.
      if (tick > 1) await new Promise((resolve) => setTimeout(resolve, 120));
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

// ------------------------------------------------------------ client cross-check
// Report (as warnings, not failures) client routes that the backend resolver
// does not define — the other drift direction.
const ROUTE_SLUG = (route) => String(route || "").replace(/^\/+|\/+$/g, "");

function extractClientCalls() {
  const jsDir = path.join(ROOT_DIR, "js");
  const calls = [];
  const read = (file) => fs.readFileSync(path.join(jsDir, file), "utf8");
  const files = fs.readdirSync(jsDir).filter((file) => file.endsWith(".js"));
  for (const file of files) {
    const source = read(file);
    const pattern = /(?:workerRequest|requestCloudflareAuth|buildAdminApiUrl|postAdminApiJson)\(\s*"([^"]+)"/g;
    let match = null;
    while ((match = pattern.exec(source)) !== null) {
      calls.push(match[1]);
    }
  }
  return [...new Set(calls.map(ROUTE_SLUG))].sort();
}

// -------------------------------------------- deployed worker secrets (Flutterwave)
// Two secrets gate the Flutterwave payment auto-grant paths, and each
// silently degrades to a 500 when unset:
//   - FLW_SECRET_KEY        gates verifyFlutterwaveTransaction, which the
//     /payment/verify and /payment/webhook/flutterwave grant chains both call;
//     unset means they throw and answer 500.
//   - FLW_WEBHOOK_SECRET_HASH gates /payment/webhook/flutterwave (the
//     auto-grant bridge); unset means it throws and answers 500.
// Read the deployed secret list once so no fallback can go unnoticed.
// Prefer the locally-installed wrangler binary over `npx wrangler`: npx forces
// an npm-registry round-trip on startup (version/update resolution) that hangs
// when the registry is slow or blocked, taking the whole check down with it.
// The direct binary skips that entirely. Falls back to npx when no local
// install exists (e.g. some CI images that install wrangler globally).
function resolveWranglerCommand() {
  const localEntry = path.join(ROOT_DIR, "node_modules", "wrangler", "bin", "wrangler.js");
  if (fs.existsSync(localEntry)) {
    return {
      command: process.execPath,
      args: [localEntry],
      // Spawn node.exe directly (no shell): spawning through a shell on
      // Windows would mangle the space in "Program Files".
      useShell: false,
      // Disable wrangler's startup update check: with a slow/blocked registry
      // it can hang before the command ever runs. CI=1 keeps prompts non-TTY.
      envOverrides: { WRANGLER_DISABLE_UPDATE_CHECK: "1", CI: "1" },
    };
  }
  // Fallback keeps the same env overrides so a missing local install can't
  // reintroduce the registry-hang this direct-binary path avoids.
  return {
    command: "npx",
    args: ["wrangler"],
    useShell: true,
    envOverrides: { WRANGLER_DISABLE_UPDATE_CHECK: "1", CI: "1" },
  };
}

// Returns { status: "ok" | "unverifiable", names: Set<string>, detail } —
// one wrangler invocation so the whole secret scan is a single `secret list` call.
function readDeployedSecretNames() {
  const cwd = path.join(ROOT_DIR, "workers", "admin-bridge");
  const run = (extraArgs) => {
    const { command, args, useShell, envOverrides } = resolveWranglerCommand();
    return spawnSync(command, [...args, "secret", "list", ...extraArgs], {
      cwd,
      encoding: "utf8",
      timeout: 45000,
      // On Windows, npx is npx.cmd and only resolves through a shell.
      shell: process.platform === "win32" && useShell,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", ...envOverrides },
    });
  };
  const names = new Set();

  // Structured JSON output is preferred when supported (wrangler >= 3.x).
  const json = run(["--format", "json"]);
  if (json.status === 0) {
    try {
      const parsed = JSON.parse(json.stdout);
      const entries = Array.isArray(parsed) ? parsed : parsed?.result;
      if (Array.isArray(entries)) {
        for (const entry of entries) if (entry?.name) names.add(entry.name);
      }
    } catch {
      // not JSON; fall through to table parsing
    }
  }

  if (!names.size) {
    const table = run([]);
    if (table.status !== 0) {
      const detail = String(table.stderr || table.stdout || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 300);
      return { status: "unverifiable", names, detail: detail || "wrangler secret list exited with a non-zero status" };
    }
    // Table rows look like: │ NAME │ ...updated... │ (box-drawing U+2502 in
    // practice; accept the ASCII pipe too so a plain-text fallback can't
    // silently match nothing and false-report the key as missing).
    for (const line of table.stdout.split("\n")) {
      const match = line.match(/^[\u2502|]\s*([A-Z][A-Z0-9_]*)\s*[\u2502|]/);
      if (match && !/^(Name|Updated)$/.test(match[1])) names.add(match[1]);
    }
  }

  return { status: "ok", names, detail: "" };
}

// Derive one secret's presence from the shared secret-list read.
// Returns { status: "set" | "missing" | "unverifiable", detail }.
function secretStatus(namesInfo, name) {
  if (namesInfo.status === "unverifiable") {
    return { status: "unverifiable", detail: namesInfo.detail };
  }
  return {
    status: namesInfo.names.has(name) ? "set" : "missing",
    detail: namesInfo.names.has(name)
      ? "set on the deployed Worker"
      : `not among deployed secrets (${namesInfo.names.size} secrets listed)`,
  };
}

// ------------------------------------------------------------------------ main
async function main() {
  const startedAt = Date.now();

  // Probe a cheap, side-effect-free auth route first to detect an origin
  // allow-list mismatch. (auth/register is deliberately NOT used: it carries
  // a per-IP rate limiter with hour-long lockouts, so probing it would lock
  // the probe IP out of real registrations.)
  const canary = await probe("auth/session");
  let effectiveOriginBlocked = canary.originBlocked;
  if (canary.originBlocked) {
    console.warn(
      `NOTE: the Worker rejected the probe with "${ORIGIN_ALLOWED_ERROR}". ` +
        (originFlag
          ? `Origin "${originFlag}" is not in the Worker's ALLOWED_ORIGINS allow-list. ` +
              "Pass --origin with an allow-listed origin (or --origin '' for none)."
          : "The Worker requires an allow-listed Origin header; pass --origin <url>."),
    );
    if (warnOnly) {
      effectiveOriginBlocked = false;
    }
  }

  // Probe in passes: resolve as many routes as possible, then give the
  // Worker a cooldown before retrying anything that was rate-limited or
  // unreachable. A route is only "missing" on a definitive 404.
  let results = [];
  let pending = [...expectedRoutes];
  for (let pass = 1; pass <= MAX_PROBE_ATTEMPTS && pending.length; pass += 1) {
    const passResults = await mapLimit(pending, concurrency, probe);
    results.push(...passResults);
    pending = passResults.filter((result) => !result.resolved).map((result) => result.route);
    const allNetworkFailures = pending.length && passResults.every((result) => result.networkError);
    if (pending.length && pass < MAX_PROBE_ATTEMPTS && !allNetworkFailures) {
      const cooldownMs = 1500 * pass;
      console.error(`  (${pending.length} routes rate-limited/unreachable; cooling down ${cooldownMs}ms before retry pass ${pass + 1})`);
      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
    }
  }
  // Keep only the final pass outcome per route (last result wins).
  const finalByRoute = new Map();
  for (const result of results) finalByRoute.set(result.route, result);
  results = [...finalByRoute.values()];

  const networkErrors = results.filter((result) => result.networkError);
  const stillUnresolved = results.filter((result) => !result.resolved);
  if (networkErrors.length === results.length) {
    console.error(`Worker at ${workerBaseUrl} is unreachable (${networkErrors[0]?.error || "no response"}).`);
    process.exit(2);
  }

  const missing = results.filter((result) => !result.exists && result.resolved && !effectiveOriginBlocked);
  const present = results.filter((result) => result.exists);
  const serverErrors = results.filter((result) => result.serverError);

  // Payment auto-grant health: missing worker secrets silently degrade the
  // Flutterwave path (500s). Read the deployed secret list once, then report.
  let flwSecretKey = null;
  let flwWebhookSecretHash = null;
  if (checkFlutterwaveKeyFlag) {
    const namesInfo = readDeployedSecretNames();
    flwSecretKey = secretStatus(namesInfo, "FLW_SECRET_KEY");
    flwWebhookSecretHash = secretStatus(namesInfo, "FLW_WEBHOOK_SECRET_HASH");
  }
  const flwFindings = [];
  if (flwSecretKey?.status === "missing") {
    flwFindings.push(
      "FLW_SECRET_KEY is NOT set on the deployed Worker; verifyFlutterwaveTransaction throws and the /payment/verify + Flutterwave webhook grant chains fail closed.",
    );
  } else if (flwSecretKey?.status === "unverifiable") {
    flwFindings.push(`FLW_SECRET_KEY presence could not be verified (wrangler secret list failed): ${flwSecretKey.detail}`);
  }
  if (flwWebhookSecretHash?.status === "missing") {
    flwFindings.push(
      "FLW_WEBHOOK_SECRET_HASH is NOT set on the deployed Worker; /payment/webhook/flutterwave answers 503 and the auto-grant bridge silently stops.",
    );
  } else if (flwWebhookSecretHash?.status === "unverifiable") {
    flwFindings.push(`FLW_WEBHOOK_SECRET_HASH presence could not be verified (wrangler secret list failed): ${flwWebhookSecretHash.detail}`);
  }

  const clientCalls = extractClientCalls();
  const expectedSlugs = new Set(expectedRoutes.map(ROUTE_SLUG));
  const excludedSlugs = new Set(excludedRoutes.map(ROUTE_SLUG));
  const clientNotInBackend = clientCalls.filter((route) => !expectedSlugs.has(ROUTE_SLUG(route)) && !excludedSlugs.has(ROUTE_SLUG(route)));

  const summary = {
    workerBaseUrl,
    checkedAt: new Date().toISOString(),
    expectedRoutes: expectedRoutes.length,
    present: present.length,
    missing: missing.map((result) => ({ route: result.route, status: result.status, error: result.error })),
    serverErrors: serverErrors.map((result) => ({ route: result.route, status: result.status, error: result.error })),
    unresolved: stillUnresolved.map((result) => ({ route: result.route, error: result.error })),
    networkErrors: networkErrors.map((result) => ({ route: result.route, error: result.error })),
    flwSecretKey,
    flwWebhookSecretHash,
    flwFindings,
    clientCallsWithoutBackendRoute: clientNotInBackend,
    durationMs: Date.now() - startedAt,
  };

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Worker route health check`);
    console.log(`Worker:  ${workerBaseUrl}`);
    console.log(`Routes:  ${present.length}/${expectedRoutes.length} present, ${missing.length} missing, ${stillUnresolved.length} unresolved, ${serverErrors.length} erroring (5xx)`);
    if (excludedRoutes.length) {
      console.log(`\nSkipped probing (server-to-server / side-effect routes): ${excludedRoutes.join(", ")}`);
    }
    if (clientNotInBackend.length) {
      console.log(`\nClient routes without a backend route (static warning): ${clientNotInBackend.join(", ")}`);
    }
    if (missing.length) {
      console.log(`\nMissing routes (returned 404 "Route not found"):`);
      for (const result of missing) {
        console.log(`  - ${result.route} (HTTP ${result.status})`);
      }
      console.log(
        `\nThe deployed Worker is out of date relative to the frontend. ` +
          `Redeploy it from workers/admin-bridge/ (npx wrangler deploy).`,
      );
    }
    if (stillUnresolved.length) {
      console.log(`\nUnresolved routes (rate-limited or unreachable after retries):`);
      for (const result of stillUnresolved) {
        console.log(`  - ${result.route} (${result.error})`);
      }
    }
    if (serverErrors.length) {
      console.log(`\nServer errors (route registered but returning 5xx):`);
      for (const result of serverErrors) {
        console.log(`  - ${result.route} (HTTP ${result.status}: ${result.error})`);
      }
      console.log(`\nThe deployed Worker is erroring on registered routes. Check worker logs (wrangler tail) and redeploy.`);
    }
    if (flwSecretKey) {
      console.log(`\nFLW_SECRET_KEY (worker secret): ${flwSecretKey.status}${flwSecretKey.detail ? ` — ${flwSecretKey.detail}` : ""}`);
    }
    if (flwWebhookSecretHash) {
      console.log(`\nFLW_WEBHOOK_SECRET_HASH (worker secret): ${flwWebhookSecretHash.status}${flwWebhookSecretHash.detail ? ` — ${flwWebhookSecretHash.detail}` : ""}`);
    }
    if (flwFindings.length) {
      console.log(`\nFlutterwave auto-grant findings:`);
      for (const finding of flwFindings) {
        console.log(`  - ${finding}`);
      }
      console.log(`\nWhile FLW_SECRET_KEY or FLW_WEBHOOK_SECRET_HASH is unset, the Flutterwave payment path silently breaks (500s). Set both on the deployed Worker: npx wrangler secret put FLW_SECRET_KEY && npx wrangler secret put FLW_WEBHOOK_SECRET_HASH (from workers/admin-bridge/).`);
    }
    console.log(`Duration: ${summary.durationMs}ms`);
  }

  if (networkErrors.length === results.length) {
    process.exit(2);
  }
  const hasFindings = missing.length > 0 || serverErrors.length > 0 || flwFindings.length > 0;
  if (hasFindings && !warnOnly && !effectiveOriginBlocked) {
    process.exit(1);
  }
  if (stillUnresolved.length && !warnOnly && !missing.length && !serverErrors.length) {
    // Could not fully verify the Worker; treat as a soft failure (exit 2)
    // so CI notices but does not conflate it with confirmed drift.
    process.exit(2);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(`Health check failed: ${error?.message || error}`);
  process.exit(2);
});
