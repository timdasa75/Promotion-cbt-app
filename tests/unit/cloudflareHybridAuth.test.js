import test from "node:test";
import assert from "node:assert/strict";

import {
  hashPassword,
  resolveHybridAuthRouteHandler,
  verifyPassword,
} from "../../workers/admin-bridge/auth-hybrid.js";

test("cloudflare hybrid auth hashes and verifies passwords", async () => {
  const storedHash = await hashPassword("super-secret-password");
  assert.match(storedHash, /^pbkdf2_sha256\$/);
  assert.equal(await verifyPassword("super-secret-password", storedHash), true);
  assert.equal(await verifyPassword("wrong-password", storedHash), false);
});

test("cloudflare hybrid auth rejects short passwords early", async () => {
  await assert.rejects(
    () => hashPassword("short"),
    (error) => error?.message === "Password must be at least 8 characters." && error?.httpStatus === 400,
  );
});

test("cloudflare hybrid auth route resolver only claims auth routes", () => {
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/register"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/login"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/session"), "function");
  assert.equal(typeof resolveHybridAuthRouteHandler("/auth/logout"), "function");
  assert.equal(resolveHybridAuthRouteHandler("/adminListUsers"), null);
});
