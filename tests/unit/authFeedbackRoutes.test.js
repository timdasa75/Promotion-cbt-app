import test from "node:test";
import assert from "node:assert/strict";

import {
  getAdminFeedbackSubmissions,
  submitFeedbackSubmission,
  updateFeedbackSubmissionStatus,
} from "../../js/auth.js";
import { clearSession, writeSession } from "../../js/authStorage.js";

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

function setupGlobals() {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  global.window = {
    sessionStorage,
    localStorage,
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: {
      firebaseApiKey: "firebase-key",
      firebaseProjectId: "firebase-project",
      firebaseAuthDomain: "firebase-project.firebaseapp.com",
    },
    PROMOTION_CBT_ADMIN_EMAILS: ["admin@example.com"],
  };
  global.localStorage = localStorage;
  global.sessionStorage = sessionStorage;
  return { sessionStorage, localStorage };
}

function writeFirebaseAdminSession() {
  writeSession({
    provider: "firebase",
    accessToken: "firebase-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60 * 60 * 1000,
    createdAt: "2026-04-20T12:00:00.000Z",
    user: {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      plan: "premium",
      emailVerified: true,
    },
  });
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("firebase feedback operations use Firestore instead of Cloudflare auth routes", async () => {
  const originalWindow = global.window;
  const originalFetch = global.fetch;
  setupGlobals();
  writeFirebaseAdminSession();
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("documents:runQuery")) {
      return createJsonResponse([]);
    }
    return createJsonResponse({ fields: {} });
  };

  try {
    await getAdminFeedbackSubmissions();
    await submitFeedbackSubmission({
      sourceScreen: "help",
      category: "suggestion",
      message: "Please add more questions.",
    });
    await updateFeedbackSubmissionStatus("fbk-1", "resolved");

    assert.ok(calls.every((call) => call.url.includes("firestore.googleapis.com")));
    assert.ok(calls.every((call) => !call.url.includes("auth.example.com")));
    assert.ok(calls.some((call) => String(call.options.body || "").includes('"collectionId":"feedbackSubmissions"')));
    assert.ok(calls.some((call) => /documents\/feedbackSubmissions\/fbk_/.test(call.url)));
    assert.ok(calls.some((call) => /documents\/feedbackSubmissions\/fbk-1/.test(call.url)));
    assert.ok(calls.every((call) => call.options.headers.Authorization === "Bearer firebase-token"));
  } finally {
    clearSession();
    global.window = originalWindow;
    delete global.localStorage;
    delete global.sessionStorage;
    global.fetch = originalFetch;
  }
});
