import test from "node:test";
import assert from "node:assert/strict";

import {
  loginUserCloud,
  logoutCloud,
  refreshCloudUserInSession,
  registerUserCloud,
} from "../../js/authCloudLifecycle.js";

test("refreshCloudUserInSession merges lookup user, profile sync, and plan sync", async () => {
  const writes = [];
  const result = await refreshCloudUserInSession(
    { accessToken: "token-1", user: { plan: "free" } },
    {
      refreshSession: async () => ({ accessToken: "token-2", user: { plan: "free" } }),
      lookupUserByToken: async () => ({ localId: "u1", email: "user@example.com", displayName: "User" }),
      buildUser: () => ({ id: "u1", email: "user@example.com", name: "User", plan: "premium" }),
      writeSessionRecord: (session) => writes.push(session),
      ensureProfileInSession: async (session) => ({ ...session, profileSynced: true }),
      syncPlanInSession: async (session) => ({ ...session, syncedPlan: true }),
    },
  );

  assert.equal(result.syncedPlan, true);
  assert.equal(writes.length, 2);
  assert.equal(writes[0].user.email, "user@example.com");
});

test("registerUserCloud creates account, sends verification, and clears session", async () => {
  const calls = [];
  let cleared = 0;
  const result = await registerUserCloud(
    { name: "User", email: "USER@example.com", password: "secret1" },
    {
      authRequest: async (path, options) => {
        calls.push({ path, options });
        if (path === "accounts:signUp") {
          return { idToken: "id-1", localId: "u1", email: "user@example.com" };
        }
        if (path === "accounts:update") {
          return { displayName: "User" };
        }
        return { ok: true };
      },
      writeCloudSession: () => ({ accessToken: "id-1", user: { id: "u1" } }),
      ensureProfileInSession: async () => {},
      markVerificationResend: () => {},
      clearCurrentSession: () => {
        cleared += 1;
      },
      now: () => "2026-03-18T10:00:00.000Z",
    },
  );

  assert.equal(result.requiresEmailVerification, true);
  assert.equal(cleared, 1);
  assert.deepEqual(calls.map((entry) => entry.path), [
    "accounts:signUp",
    "accounts:update",
    "accounts:sendOobCode",
  ]);
});

test("loginUserCloud refreshes session and blocks unverified or suspended users", async () => {
  const cleared = [];
  const success = await loginUserCloud(
    { email: "user@example.com", password: "secret1" },
    {
      authRequest: async () => ({ idToken: "id-1" }),
      writeCloudSession: () => ({ accessToken: "id-1" }),
      refreshCloudUser: async () => ({ accessToken: "id-2", user: { id: "u1", emailVerified: true } }),
      clearCurrentSession: () => cleared.push("clear"),
      getProfileById: async () => ({ status: "active" }),
    },
  );
  assert.equal(success.id, "u1");

  await assert.rejects(
    loginUserCloud(
      { email: "user@example.com", password: "secret1" },
      {
        authRequest: async () => ({ idToken: "id-1" }),
        writeCloudSession: () => ({ accessToken: "id-1" }),
        refreshCloudUser: async () => ({ accessToken: "id-2", user: { id: "u1", emailVerified: false } }),
        clearCurrentSession: () => cleared.push("clear-unverified"),
        getProfileById: async () => ({ status: "active" }),
      },
    ),
    /Please verify your email before login/,
  );

  await assert.rejects(
    loginUserCloud(
      { email: "user@example.com", password: "secret1" },
      {
        authRequest: async () => ({ idToken: "id-1" }),
        writeCloudSession: () => ({ accessToken: "id-1" }),
        refreshCloudUser: async () => ({ accessToken: "id-2", user: { id: "u1", emailVerified: true } }),
        clearCurrentSession: () => cleared.push("clear-suspended"),
        getProfileById: async () => ({ status: "suspended" }),
      },
    ),
    /Your account is suspended/,
  );

  assert.equal(cleared.includes("clear-unverified"), true);
  assert.equal(cleared.includes("clear-suspended"), true);
});

test("logoutCloud clears session", () => {
  let cleared = 0;
  logoutCloud({
    clearCurrentSession: () => {
      cleared += 1;
    },
  });
  assert.equal(cleared, 1);
});
