import assert from "node:assert/strict";
import test from "node:test";

import worker from "../../workers/admin-bridge/worker.js";

const ALLOWED_ORIGINS = "https://app.example.test";

test("Worker denies browser requests when no origin allowlist is configured", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.test/auth/session", { method: "POST" }),
    {},
    {},
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("Worker only emits CORS headers for an explicitly allowed browser origin", async () => {
  const allowed = await worker.fetch(
    new Request("https://worker.example.test/not-a-route", {
      headers: { Origin: "https://app.example.test" },
    }),
    { ALLOWED_ORIGINS },
    {},
  );
  assert.equal(allowed.status, 404);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://app.example.test");
  assert.equal(allowed.headers.get("Vary"), "Origin");

  const denied = await worker.fetch(
    new Request("https://worker.example.test/not-a-route", {
      headers: { Origin: "https://attacker.example.test" },
    }),
    { ALLOWED_ORIGINS },
    {},
  );
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
});

test("Worker rejects wildcard CORS configuration instead of reflecting arbitrary origins", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.test/not-a-route", {
      headers: { Origin: "https://attacker.example.test" },
    }),
    { ALLOWED_ORIGINS: "*" },
    {},
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("Worker permits preflight only for explicitly allowed origins", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.test/auth/login", {
      method: "OPTIONS",
      headers: { Origin: "https://app.example.test" },
    }),
    { ALLOWED_ORIGINS },
    {},
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://app.example.test");
});
