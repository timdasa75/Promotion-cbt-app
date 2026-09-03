import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";
import worker from "../../workers/admin-bridge/worker.js";

test("device-auth recovery route is registered", () => {
  assert.equal(typeof resolveRouteHandler("/admin/device-auth-recovery"), "function");
  assert.equal(resolveRouteHandler("/admin/device-verification/global-toggle"), null);
  assert.equal(resolveRouteHandler("/admin/device-verification/user-toggle"), null);
  assert.equal(resolveRouteHandler("/admin/device-verification/settings"), null);
});

test("device-auth recovery migration supports one-time, expiring grants", async () => {
  const migration = await readFile(
    new URL("../../workers/admin-bridge/migrations/0005_device_auth_recovery_grants.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS device_auth_recovery_grants/);
  assert.match(migration, /expires_at TEXT NOT NULL/);
  assert.match(migration, /consumed_at TEXT NOT NULL DEFAULT ''/);
  assert.match(migration, /revoked_at TEXT NOT NULL DEFAULT ''/);
});

test("device-auth recovery rejects unauthenticated callers", async () => {
  const response = await worker.fetch(
    new Request("https://worker.example.com/admin/device-auth-recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://app.example.test",
      },
      body: JSON.stringify({
        email: "learner@example.com",
        reason: "Learner reported that the device OTP email was not received.",
      }),
    }),
    { ALLOWED_ORIGINS: "https://app.example.test" },
  );

  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /missing bearer token/i);
});
