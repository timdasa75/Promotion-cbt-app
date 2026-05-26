import test from "node:test";
import assert from "node:assert/strict";

import { clearSession, writeSession } from "../../js/authStorage.js";
import { getAuthProviderLabel } from "../../js/auth.js";

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
  };
}

function setupGlobals(config = {}) {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  global.window = {
    sessionStorage,
    localStorage,
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: config,
  };
  global.localStorage = localStorage;
  return { sessionStorage, localStorage };
}

test("getAuthProviderLabel uses configured hybrid mode before login and active provider after login", () => {
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;
  setupGlobals({
    authProvider: "hybrid",
    cloudflareAuthBaseUrl: "https://auth.example.com",
    allowFirebaseFallback: true,
    firebaseApiKey: "key-1",
    firebaseProjectId: "project-1",
  });

  try {
    assert.equal(getAuthProviderLabel(), "Online");
    assert.equal(getAuthProviderLabel("configured"), "Online");

    writeSession({
      provider: "firebase",
      accessToken: "token-1",
      refreshToken: "refresh-1",
      expiresAt: Date.now() + 60000,
      createdAt: "2026-04-20T12:00:00.000Z",
      user: { id: "u1", email: "user@example.com", plan: "free" },
    });

    assert.equal(getAuthProviderLabel(), "Online");
    assert.equal(getAuthProviderLabel("configured"), "Online");

    clearSession();
    writeSession({
      provider: "cloudflare",
      accessToken: "cf-token-1",
      expiresAt: Date.now() + 60000,
      createdAt: "2026-04-20T12:05:00.000Z",
      user: { id: "cf-1", email: "user@example.com", plan: "free" },
    });

    assert.equal(getAuthProviderLabel(), "Online");
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});

test("getAuthProviderLabel reports Online when Cloud auth is configured", () => {
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;
  setupGlobals({
    authProvider: "firebase",
    cloudflareAuthBaseUrl: "https://auth.example.com",
    firebaseApiKey: "key-1",
    firebaseProjectId: "project-1",
  });

  try {
    assert.equal(getAuthProviderLabel(), "Online");
    assert.equal(getAuthProviderLabel("configured"), "Online");
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});
