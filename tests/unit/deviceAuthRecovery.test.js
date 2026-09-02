import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";

test("device-auth recovery route is registered", () => {
  assert.equal(typeof resolveRouteHandler("/admin/device-auth-recovery"), "function");
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
