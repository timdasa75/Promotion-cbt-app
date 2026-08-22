import test from "node:test";
import assert from "node:assert/strict";

import { handleAuthGoogle } from "../../workers/admin-bridge/auth-hybrid.js";

function b64UrlEncode(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function buildGoogleIdToken({ kid, sub, email, emailVerified, aud, iss = "https://accounts.google.com" }) {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  const header = { alg: "RS256", kid, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss, aud, sub, email, email_verified: emailVerified, exp: now + 3600, iat: now };

  const signingInput = `${b64UrlEncode(JSON.stringify(header))}.${b64UrlEncode(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  );

  return {
    token: `${signingInput}.${b64UrlEncode(new Uint8Array(signature))}`,
    jwk: { ...jwk, kid, alg: "RS256", use: "sig" },
  };
}

function createMockDatabase() {
  const writes = [];
  const selects = [];
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              selects.push({ sql, values });
              if (sql.includes("FROM auth_users") && sql.includes("WHERE email")) return null; // no existing user
              if (sql.includes("FROM auth_users") && sql.includes("WHERE id")) {
                return {
                  id: values[0],
                  email: values[1] || "",
                  role: "user",
                  plan: "free",
                  status: "active",
                  email_verified: 0,
                  created_at: "2026-05-18T00:00:00.000Z",
                  last_login_at: "",
                };
              }
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
  return { database, writes, selects };
}

function makeRequest(token) {
  return new Request("https://worker.example.com/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: token }),
  });
}

test("google login with an unverified Google email does NOT mark the account verified", async () => {
  const { token, jwk } = await buildGoogleIdToken({
    kid: "k1",
    sub: "google-sub-1",
    email: "unverified@example.com",
    emailVerified: false,
    aud: "test-client-id",
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("oauth2/v3/certs")) {
      return { ok: true, json: async () => ({ keys: [jwk] }) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { database, writes } = createMockDatabase();
    const result = await handleAuthGoogle(makeRequest(token), {
      AUTH_DB: database,
      GOOGLE_CLIENT_ID: "test-client-id",
    });
    assert.equal(result.ok, true);

    const insert = writes.find((entry) => entry.sql.includes("INSERT INTO auth_users"));
    assert.ok(insert, "new user should be inserted");
    // email_verified column is the last bound value (?5) in the insert
    assert.equal(insert.values[4], 0, "unverified Google email must be stored as unverified");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("google login with a verified Google email stores the account as verified", async () => {
  const { token, jwk } = await buildGoogleIdToken({
    kid: "k2",
    sub: "google-sub-2",
    email: "verified@example.com",
    emailVerified: true,
    aud: "test-client-id",
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("oauth2/v3/certs")) {
      return { ok: true, json: async () => ({ keys: [jwk] }) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const { database, writes } = createMockDatabase();
    const result = await handleAuthGoogle(makeRequest(token), {
      AUTH_DB: database,
      GOOGLE_CLIENT_ID: "test-client-id",
    });
    assert.equal(result.ok, true);

    const insert = writes.find((entry) => entry.sql.includes("INSERT INTO auth_users"));
    assert.ok(insert);
    assert.equal(insert.values[4], 1, "verified Google email must be stored as verified");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("google login rejects an invalid audience", async () => {
  const { token, jwk } = await buildGoogleIdToken({
    kid: "k3",
    sub: "google-sub-3",
    email: "wrong-aud@example.com",
    emailVerified: true,
    aud: "some-other-app",
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("oauth2/v3/certs")) {
      return { ok: true, json: async () => ({ keys: [jwk] }) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    await assert.rejects(
      () =>
        handleAuthGoogle(makeRequest(token), {
          AUTH_DB: createMockDatabase().database,
          GOOGLE_CLIENT_ID: "test-client-id",
        }),
      (error) => error?.httpStatus === 401 && error?.message === "Google token audience mismatch.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
