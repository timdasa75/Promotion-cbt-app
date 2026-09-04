// Unit tests for scripts/check_worker_routes.mjs.
//
// The script derives expected routes from the Worker source, so these tests
// exercise the probe/report/exit-code logic against a local mock Worker that
// deliberately serves a stale route set (404 "Route not found").
//
// The FLW secret checks talk to the REAL deployed Worker via
// `wrangler secret list`, so they are disabled by default here
// (--no-check-flutterwave-key) to keep the suite hermetic; the live
// behavior is covered by running `npm run check:worker-routes:flutterwave`
// against the actual deployment.

import { execFile } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "check_worker_routes.mjs");

function runHealthCheck(baseUrl, extraArgs = []) {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [SCRIPT, "--base-url", baseUrl, "--timeout-ms", "5000", "--no-check-flutterwave-key", ...extraArgs],
      { cwd: ROOT, encoding: "utf8" },
      (error, stdout, stderr) => {
        resolve({ code: error?.code ?? 0, stdout, stderr });
      },
    );
  });
}

async function withMockWorker(missingRoutes, fn) {
  const server = http.createServer((req, res) => {
    const route = req.url.split("?")[0];
    res.setHeader("Content-Type", "application/json");
    if (missingRoutes.has(route)) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "Route not found." }));
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "A valid email is required." }));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("check_worker_routes passes (exit 0) when every expected route exists", async () => {
  await withMockWorker(new Set(), async (baseUrl) => {
    const { code, stdout } = await runHealthCheck(baseUrl);
    assert.equal(code, 0, `expected exit 0, got ${code}\n${stdout}`);
    assert.match(stdout, /present/);
    assert.doesNotMatch(stdout, /Missing routes/);
  });
});

test("check_worker_routes fails (exit 1) and lists stale routes on 404 drift", async () => {
  await withMockWorker(new Set(["/adminFeedbackList", "/feedback/submit"]), async (baseUrl) => {
    const { code, stdout } = await runHealthCheck(baseUrl);
    assert.equal(code, 1, `expected exit 1, got ${code}\n${stdout}`);
    assert.match(stdout, /adminFeedbackList/);
    assert.match(stdout, /feedback\/submit/);
    assert.match(stdout, /deployed Worker is out of date/i);
  });
});

test("check_worker_routes --warn reports drift but exits 0", async () => {
  await withMockWorker(new Set(["/adminSetUserPlan"]), async (baseUrl) => {
    const { code, stdout } = await runHealthCheck(baseUrl, ["--warn"]);
    assert.equal(code, 0, `expected exit 0 in warn mode, got ${code}\n${stdout}`);
    assert.match(stdout, /adminSetUserPlan/);
  });
});

test("check_worker_routes --json emits machine-readable summary", async () => {
  await withMockWorker(new Set(["/adminListPayments"]), async (baseUrl) => {
    const { code, stdout } = await runHealthCheck(baseUrl, ["--json"]);
    assert.equal(code, 1);
    const summary = JSON.parse(stdout);
    assert.equal(summary.workerBaseUrl, baseUrl);
    assert.ok(Array.isArray(summary.missing));
    assert.equal(summary.missing.length, 1);
    assert.equal(summary.missing[0].route, "/adminListPayments");
    // New drift surfaces: 5xx servers and the FLW key checks are part
    // of the JSON contract (null here because --no-check-flutterwave-key
    // and no 5xx).
    assert.ok(Array.isArray(summary.serverErrors));
    assert.equal(summary.flwSecretKey, null);
    assert.equal(summary.flwWebhookSecretHash, null);
    assert.ok(Array.isArray(summary.flwFindings));
    assert.equal(summary.flwFindings.length, 0);
  });
});

test("check_worker_routes treats worker-handler 429 as route present (not missing)", async () => {
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(429);
    res.end(JSON.stringify({ ok: false, error: "Too many registration attempts from this IP." }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const { code, stdout } = await runHealthCheck(`http://127.0.0.1:${port}`);
    assert.equal(code, 0, `expected exit 0 (429 = route exists), got ${code}\n${stdout}`);
    assert.doesNotMatch(stdout, /Missing routes/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("check_worker_routes fails (exit 1) and lists 5xx routes as server errors", async () => {
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/payment/verify")) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: "Internal Server Error" }));
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "A valid email is required." }));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const { code, stdout } = await runHealthCheck(`http://127.0.0.1:${port}`, ["--json"]);
    assert.equal(code, 1, `expected exit 1 (5xx finding), got ${code}\n${stdout}`);
    const summary = JSON.parse(stdout);
    assert.equal(summary.missing.length, 0);
    assert.equal(summary.serverErrors.length, 1);
    assert.equal(summary.serverErrors[0].route, "/payment/verify");
    assert.equal(summary.serverErrors[0].status, 500);
    assert.equal(summary.flwSecretKey, null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("check_worker_routes exits 2 when the Worker is unreachable", async () => {
  // Port 1 on loopback is virtually guaranteed to refuse connections.
  const { code, stdout, stderr } = await runHealthCheck("http://127.0.0.1:1");
  assert.equal(code, 2, `expected exit 2, got ${code}`);
  assert.match(`${stdout}\n${stderr}`, /unreachable/i);
});
