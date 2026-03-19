import test from "node:test";
import assert from "node:assert/strict";

import { ensureCloudSessionActive, writeCloudSessionFromAuthPayload } from "../../js/authCloudSession.js";

function createStorage() {
  const store = {};
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

test("cloud session helper leaves fresh firebase sessions unchanged", async () => {
  const session = {
    provider: "firebase",
    expiresAt: Date.now() + 60_000,
    user: { id: "u1", email: "user@example.com" },
  };
  const result = await ensureCloudSessionActive(session);
  assert.equal(result, session);
});

test("cloud session writer persists a firebase session record", () => {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  global.window = { sessionStorage, localStorage };
  global.localStorage = localStorage;

  const saved = writeCloudSessionFromAuthPayload({
    idToken: "token-1",
    refreshToken: "refresh-1",
    expiresIn: 3600,
    localId: "user-1",
    displayName: "Test User",
    email: "USER@EXAMPLE.COM",
    emailVerified: true,
  });

  assert.equal(saved.provider, "firebase");
  assert.equal(saved.user.email, "user@example.com");
  assert.ok(sessionStorage.snapshot().cbt_session_v1);
});
