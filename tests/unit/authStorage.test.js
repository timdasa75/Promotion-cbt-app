import test from "node:test";
import assert from "node:assert/strict";

import {
  clearSession,
  readAdminDirectoryCache,
  readJsonStorage,
  readPlanOverrideMeta,
  readPlanOverrides,
  readSession,
  readUsers,
  writeAdminDirectoryCache,
  writePlanOverrideMeta,
  writePlanOverrides,
  writeSession,
  writeUsers,
} from "../../js/authStorage.js";

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    snapshot() {
      return { ...store };
    },
  };
}

function setupGlobals(sessionStorage, localStorage) {
  global.window = { sessionStorage, localStorage };
  global.localStorage = localStorage;
}

test("readJsonStorage returns parsed objects and null for invalid data", () => {
  const storage = createStorage({ good: "{\"a\":1}", bad: "not-json" });
  assert.deepEqual(readJsonStorage(storage, "good"), { a: 1 });
  assert.equal(readJsonStorage(storage, "bad"), null);
  assert.equal(readJsonStorage(null, "good"), null);
});

test("session helpers prefer session storage and migrate legacy data", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage({
    cbt_session_v1: JSON.stringify({
      provider: "local",
      createdAt: "2026-03-18T09:00:00Z",
      user: {
        id: "u1",
        email: "legacy@example.com",
        plan: "free",
        createdAt: "2026-03-18T09:00:00Z",
        passwordHash: "hash",
        passwordSalt: "salt",
        passwordIterations: 1000,
        passwordAlgo: "pbkdf2",
      },
    }),
  });
  setupGlobals(sessionStorage, localStorage);

  assert.deepEqual(readSession(), {
    provider: "local",
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    createdAt: "2026-03-18T09:00:00Z",
    lastPlanSyncAt: "",
    user: {
      id: "u1",
      name: "",
      email: "legacy@example.com",
      plan: "free",
      billingCycle: "",
      subscriptionType: "",
      planInterval: "",
      createdAt: "2026-03-18T09:00:00Z",
      lastSeenAt: "",
      planExpiresAt: "",
      emailVerified: "",
      role: "",
      status: "",
    },
  });
  assert.deepEqual(JSON.parse(sessionStorage.snapshot()["cbt_session_v1"]), {
    provider: "local",
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    createdAt: "2026-03-18T09:00:00Z",
    lastPlanSyncAt: "",
    user: {
      id: "u1",
      name: "",
      email: "legacy@example.com",
      plan: "free",
      billingCycle: "",
      subscriptionType: "",
      planInterval: "",
      createdAt: "2026-03-18T09:00:00Z",
      lastSeenAt: "",
      planExpiresAt: "",
      emailVerified: "",
      role: "",
      status: "",
    },
  });
  assert.equal(localStorage.snapshot()["cbt_session_v1"], undefined);

  writeSession({
    provider: "local",
    createdAt: "2026-03-18T10:00:00Z",
    user: {
      id: "u2",
      email: "current@example.com",
      plan: "premium",
      billingCycle: "monthly",
      passwordHash: "hash-2",
      passwordSalt: "salt-2",
      passwordIterations: 2000,
      passwordAlgo: "pbkdf2",
    },
  });
  assert.deepEqual(readSession(), {
    provider: "local",
    accessToken: "",
    refreshToken: "",
    expiresAt: 0,
    createdAt: "2026-03-18T10:00:00Z",
    lastPlanSyncAt: "",
    user: {
      id: "u2",
      name: "",
      email: "current@example.com",
      plan: "premium",
      billingCycle: "monthly",
      subscriptionType: "",
      planInterval: "",
      createdAt: "",
      lastSeenAt: "",
      planExpiresAt: "",
      emailVerified: "",
      role: "",
      status: "",
    },
  });
  assert.equal(localStorage.snapshot()["cbt_session_v1"], undefined);

  clearSession();
  assert.equal(readSession(), null);
});

test("profile storage helpers round-trip clean values", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  setupGlobals(sessionStorage, localStorage);

  writeUsers([
    {
      email: "user@example.com",
      plan: "free",
      billingCycle: "monthly",
      passwordHash: "hash",
      passwordSalt: "salt",
      passwordIterations: 1000,
      passwordAlgo: "pbkdf2",
    },
  ]);
  assert.deepEqual(readUsers(), [
    {
      id: "",
      name: "",
      email: "user@example.com",
      plan: "free",
      billingCycle: "monthly",
      subscriptionType: "",
      planInterval: "",
      createdAt: "",
      lastSeenAt: "",
      planExpiresAt: "",
      emailVerified: "",
      role: "",
      status: "",
    },
  ]);

  writePlanOverrides({ "user@example.com": "premium" });
  assert.deepEqual(readPlanOverrides(), { "user@example.com": "premium" });

  writePlanOverrideMeta({ "user@example.com": { status: "ok" } });
  assert.deepEqual(readPlanOverrideMeta(), { "user@example.com": { status: "ok" } });

  writeAdminDirectoryCache([{ email: "user@example.com" }], "2026-03-18T12:00:00Z");
  assert.deepEqual(readAdminDirectoryCache(), {
    users: [{ email: "user@example.com" }],
    syncedAt: "2026-03-18T12:00:00Z",
  });
});
