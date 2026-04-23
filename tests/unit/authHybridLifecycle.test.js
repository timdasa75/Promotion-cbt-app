import test from "node:test";
import assert from "node:assert/strict";

import {
  loginUserHybrid,
  logoutHybrid,
  refreshCloudflareUserInSession,
  registerUserHybrid,
} from "../../js/authHybridLifecycle.js";

test("registerUserHybrid prefers Cloudflare auth when available", async () => {
  let firebaseCalled = 0;
  const result = await registerUserHybrid(
    { name: "User", email: "user@example.com", password: "secret123" },
    {
      registerCloudflare: async () => ({
        user: { id: "cf-1", email: "user@example.com" },
        message: "Cloudflare account created.",
        requiresEmailVerification: false,
      }),
      registerFirebase: async () => {
        firebaseCalled += 1;
        return null;
      },
      allowFirebaseFallback: true,
    },
  );

  assert.equal(result.user.id, "cf-1");
  assert.equal(firebaseCalled, 0);
});

test("loginUserHybrid falls back to Firebase for legacy users when Cloudflare lookup misses", async () => {
  const result = await loginUserHybrid(
    { email: "legacy@example.com", password: "secret123" },
    {
      loginCloudflare: async () => {
        const error = new Error("Account not found in Cloudflare auth.");
        error.httpStatus = 404;
        throw error;
      },
      loginFirebase: async () => ({ id: "fb-1", email: "legacy@example.com" }),
      allowFirebaseFallback: true,
    },
  );

  assert.equal(result.id, "fb-1");
  assert.equal(result.email, "legacy@example.com");
});

test("refreshCloudflareUserInSession keeps the current access token while rewriting session state", async () => {
  let cleared = 0;
  let writtenPayload = null;
  const result = await refreshCloudflareUserInSession(
    {
      provider: "cloudflare",
      accessToken: "token-1",
      expiresAt: Date.parse("2026-03-18T10:00:00.000Z"),
      createdAt: "2026-03-18T09:00:00.000Z",
    },
    {
      fetchSession: async () => ({
        user: { id: "cf-1", email: "user@example.com", name: "User" },
        session: { expiresAt: "2026-03-18T11:00:00.000Z" },
      }),
      writeCloudflareSession: (payload) => {
        writtenPayload = payload;
        return {
          provider: "cloudflare",
          accessToken: payload.session.token,
          user: payload.user,
        };
      },
      clearCurrentSession: () => {
        cleared += 1;
      },
    },
  );

  assert.equal(cleared, 0);
  assert.equal(writtenPayload.session.token, "token-1");
  assert.equal(result.user.id, "cf-1");
});

test("logoutHybrid clears cloudflare sessions after notifying the backend", async () => {
  const calls = [];
  await logoutHybrid(
    { provider: "cloudflare", accessToken: "token-1" },
    {
      logoutCloudflare: async (token) => {
        calls.push(token);
      },
      clearCurrentSession: () => {
        calls.push("cleared");
      },
    },
  );

  assert.deepEqual(calls, ["token-1", "cleared"]);
});
