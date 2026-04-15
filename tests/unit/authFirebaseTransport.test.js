import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCloudUserFromAuthPayload,
  buildCloudUserFromLookupUser,
  firebaseAuthRequest,
  firestoreRequest,
  getFirestoreBaseUrl,
} from "../../js/authFirebaseTransport.js";

test("firebase transport user builders normalize payloads", () => {
  assert.deepEqual(
    buildCloudUserFromLookupUser({ localId: 123, email: "USER@EXAMPLE.COM", createdAt: 1710756000000, emailVerified: 1 }, "premium"),
    {
      id: "123",
      name: "",
      email: "user@example.com",
      plan: "premium",
      createdAt: "2024-03-18T10:00:00.000Z",
      emailVerified: true,
    },
  );

  const normalizedAuthUser = buildCloudUserFromAuthPayload({
    localId: 456,
    email: "USER2@EXAMPLE.COM",
    displayName: "Test User",
    emailVerified: false,
  });
  assert.equal(normalizedAuthUser.id, "456");
  assert.equal(normalizedAuthUser.name, "Test User");
  assert.equal(normalizedAuthUser.email, "user2@example.com");
  assert.equal(normalizedAuthUser.plan, "free");
  assert.equal(normalizedAuthUser.emailVerified, false);
  assert.equal(Number.isNaN(Date.parse(normalizedAuthUser.createdAt)), false);
});

test("firebase transport requests read config from auth runtime", async () => {
  const originalWindow = global.window;
  const originalFetch = global.fetch;
  global.window = {
    PROMOTION_CBT_AUTH: {
      firebaseApiKey: "api-key-1",
      firebaseProjectId: "project-1",
    },
  };

  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ ok: true }),
    };
  };

  try {
    const authPayload = await firebaseAuthRequest("accounts:signInWithPassword", {
      method: "POST",
      body: { email: "user@example.com" },
    });
    const baseUrl = getFirestoreBaseUrl();
    const firestorePayload = await firestoreRequest("documents/test", {
      method: "GET",
      idToken: "token-1",
    });

    assert.deepEqual(authPayload, { ok: true });
    assert.equal(baseUrl, "https://firestore.googleapis.com/v1/projects/project-1/databases/(default)");
    assert.deepEqual(firestorePayload, { ok: true });
    assert.equal(calls[0].url, "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=api-key-1");
    assert.equal(calls[1].url, "https://firestore.googleapis.com/v1/projects/project-1/databases/(default)/documents/test");
    assert.equal(calls[1].options.headers.Authorization, "Bearer token-1");
  } finally {
    global.window = originalWindow;
    global.fetch = originalFetch;
  }
});
