// Unit tests for the Flutterwave payment webhook (/payment/webhook/flutterwave).
//
// Flutterwave ships two signature schemes and the worker accepts both:
//   - legacy (v2/v3): the plain secret hash as the `verif-hash` header
//   - current (v4): base64(HMAC-SHA256(rawBody, secretHash)) as the
//     `flutterwave-signature` header
// These tests pin the fail-closed contract (403/503 on any invalid or missing
// signature) and the exactly-once grant path (Firestore payment doc + profile
// patch + D1 plan flip, each written once for a single delivery).

import test from "node:test";
import assert from "node:assert/strict";
import nodeCrypto from "node:crypto";

import worker from "../../workers/admin-bridge/worker.js";

function sha256Base64UrlLocal(value) {
  return nodeCrypto.createHash("sha256").update(String(value || "")).digest("base64url");
}

const WEBHOOK_URL = "https://promotion-cbt.example/payment/webhook/flutterwave";
const SECRET_HASH = "flw-secret-hash-value-1234567890";

function successfulEvent(overrides = {}) {
  return {
    event: "charge.completed",
    data: {
      id: "chg_Hq4oBRTJ4r",
      tx_ref: "promocbt_user123_monthly_1700000000_abc123",
      amount: 2500,
      currency: "NGN",
      status: "successful",
      customer: { email: "buyer@example.com", name: "Buyer One" },
      meta: { userId: "buyer-uid-1", planCycle: "monthly" },
      created_at: "2026-08-17T12:00:00.000Z",
      ...overrides,
    },
  };
}

async function hmacSha256Base64(secret, rawBody) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return Buffer.from(signature).toString("base64");
}

async function callFlutterwaveWebhook({ hash = SECRET_HASH, verifHash, flutterwaveSignature, body = {}, env = {} } = {}) {
  const rawBody = JSON.stringify(body);
  const headers = { "Content-Type": "application/json" };
  if (verifHash !== undefined) headers["verif-hash"] = String(verifHash);
  if (flutterwaveSignature !== undefined) headers["flutterwave-signature"] = String(flutterwaveSignature);
  const request = new Request(WEBHOOK_URL, {
    method: "POST",
    headers,
    body: rawBody,
  });
  const response = await worker.fetch(request, { ...env, FLW_WEBHOOK_SECRET_HASH: hash });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // non-JSON body
  }
  return { status: response.status, payload };
}

test("flutterwave webhook fails closed (503) when no secret hash is configured", async () => {
  const { status } = await callFlutterwaveWebhook({
    hash: "",
    verifHash: "anything",
    body: successfulEvent(),
  });
  assert.equal(status, 503);
});

test("flutterwave webhook rejects a wrong legacy verif-hash (403)", async () => {
  const { status } = await callFlutterwaveWebhook({
    verifHash: "wrong-secret-hash",
    body: successfulEvent(),
  });
  assert.equal(status, 403);
});

test("flutterwave webhook rejects a request with no signature header at all (403)", async () => {
  const { status } = await callFlutterwaveWebhook({ body: successfulEvent() });
  assert.equal(status, 403);
});

test("flutterwave webhook accepts a matching verif-hash and ignores non-successful events", async () => {
  const { status, payload } = await callFlutterwaveWebhook({
    verifHash: SECRET_HASH,
    body: successfulEvent({ status: "failed" }),
  });
  assert.equal(status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ignored, true);
});

test("flutterwave webhook ignores events where no plan cycle can be determined (meta or tx_ref)", async () => {
  const { status, payload } = await callFlutterwaveWebhook({
    verifHash: SECRET_HASH,
    // No meta planCycle AND an unparseable tx_ref (not a promocbt_ reference)
    // means the auto-grant cannot know which plan was bought.
    body: successfulEvent({ meta: { userId: "buyer-uid-1" }, tx_ref: "non-promocbt-ref-123" }),
  });
  assert.equal(status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ignored, true);
});

test("flutterwave webhook accepts the v4 flutterwave-signature (HMAC-SHA256 base64)", async () => {
  const rawBody = JSON.stringify(successfulEvent({ status: "failed" }));
  const signature = await hmacSha256Base64(SECRET_HASH, rawBody);
  const request = new Request(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "flutterwave-signature": signature,
    },
    body: rawBody,
  });
  const response = await worker.fetch(request, { FLW_WEBHOOK_SECRET_HASH: SECRET_HASH });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ignored, true);
});

test("flutterwave webhook rejects a tampered v4 flutterwave-signature (403)", async () => {
  const rawBody = JSON.stringify(successfulEvent({ status: "failed" }));
  const signature = await hmacSha256Base64("some-other-secret", rawBody);
  const { status } = await callFlutterwaveWebhook({
    flutterwaveSignature: signature,
    body: JSON.parse(rawBody),
  });
  assert.equal(status, 403);
});

function buildPemPrivateKey(pkcs8ArrayBuffer) {
  const base64 = Buffer.from(pkcs8ArrayBuffer).toString("base64");
  const lines = base64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

// Full successful Flutterwave webhook simulation: a valid signature, a stubbed
// Flutterwave verify API (server-side re-verification), and Firestore/D1 grants
// that all succeed. Asserts the premium grant is written exactly once.
test("flutterwave webhook processes a full successful charge and writes the premium grant exactly once", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const d1Writes = [];
  const firestoreCalls = [];

  const env = {
    ALLOWED_ORIGINS: "https://app.example.test",
    FLW_WEBHOOK_SECRET_HASH: SECRET_HASH,
    FLW_SECRET_KEY: "FLWSECK_TEST-dummy-key-for-unit-tests-only-X",
    FIREBASE_PROJECT_ID: "test-project",
    GCP_SERVICE_ACCOUNT_EMAIL: "svc@test-project.iam.gserviceaccount.com",
    GCP_SERVICE_ACCOUNT_PRIVATE_KEY: buildPemPrivateKey(pkcs8),
    AUTH_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                d1Writes.push({ sql, values });
                return { success: true, meta: { changes: 1 } };
              },
              async first() {
                return null;
              },
              async all() {
                return { results: [] };
              },
            };
          },
        };
      },
    },
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || "GET").toUpperCase();
    if (href.includes("oauth2.googleapis.com/token")) {
      return { ok: true, status: 200, json: async () => ({ access_token: "minted-access-token", expires_in: 3600 }) };
    }
    if (href.includes("api.flutterwave.com/v3/transactions")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          message: "Transaction verified",
          data: {
            id: "chg_Hq4oBRTJ4r",
            tx_ref: "promocbt_user123_monthly_1700000000_abc123",
            amount: 2500,
            currency: "NGN",
            status: "successful",
            customer: { email: "buyer@example.com", name: "Buyer One" },
            created_at: "2026-08-17T12:00:00.000Z",
          },
        }),
      };
    }
    if (href.includes("firestore.googleapis.com")) {
      const docPath = href.split("/documents/")[1]?.split("?")[0] || "";
      firestoreCalls.push({ method, docPath });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch in test: ${method} ${href}`);
  };

  try {
    const request = new Request(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "verif-hash": SECRET_HASH,
      },
      body: JSON.stringify(successfulEvent()),
    });
    const response = await worker.fetch(request, env);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.processed, true);

    // The premium grant record (Firestore payments doc) is written exactly once.
    const paymentWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("payments/"));
    assert.equal(paymentWrites.length, 1);
    assert.equal(paymentWrites[0].docPath, "payments/flw_chg_Hq4oBRTJ4r");

    // The buyer's entitlement profile is patched exactly once.
    const profileWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("profiles/"));
    assert.equal(profileWrites.length, 1);
    assert.equal(profileWrites[0].docPath, "profiles/buyer-uid-1");

    // The D1 plan flip runs exactly once, for the webhook's meta.userId.
    const planUpdates = d1Writes.filter((write) => write.sql.includes("UPDATE auth_users SET plan = 'premium'"));
    assert.equal(planUpdates.length, 1);
    assert.equal(planUpdates[0].values[0], "buyer-uid-1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// The checkout sends meta.userId/meta.planCycle, but a merchant can disable
// "Add meta to webhook". The worker must fall back to parsing the tx_ref
// (which embeds the user id prefix and plan cycle) so the auto-grant never
// silently stops. This event has no meta at all and must still be processed.
test("flutterwave webhook derives plan cycle and user from tx_ref when meta is absent", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const d1Writes = [];
  const firestoreCalls = [];

  const env = {
    FLW_WEBHOOK_SECRET_HASH: SECRET_HASH,
    FLW_SECRET_KEY: "FLWSECK_TEST-dummy-key-for-unit-tests-only-X",
    FIREBASE_PROJECT_ID: "test-project",
    GCP_SERVICE_ACCOUNT_EMAIL: "svc@test-project.iam.gserviceaccount.com",
    GCP_SERVICE_ACCOUNT_PRIVATE_KEY: buildPemPrivateKey(pkcs8),
    AUTH_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                d1Writes.push({ sql, values });
                return { success: true, meta: { changes: 1 } };
              },
              async first() {
                // The tx_ref-embedded user prefix lookup resolves to a real user.
                if (String(sql).includes("substr(id, 1, ?1)")) {
                  return { id: "buyer-uid-1", email: "buyer@example.com" };
                }
                return null;
              },
              async all() {
                return { results: [] };
              },
            };
          },
        };
      },
    },
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || "GET").toUpperCase();
    if (href.includes("oauth2.googleapis.com/token")) {
      return { ok: true, status: 200, json: async () => ({ access_token: "minted-access-token", expires_in: 3600 }) };
    }
    if (href.includes("api.flutterwave.com/v3/transactions")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            id: "chg_txrefonly",
            tx_ref: "promocbt_buyeruid123_monthly_1700000000000_abc123",
            amount: 2500,
            currency: "NGN",
            status: "successful",
            customer: { email: "buyer@example.com", name: "Buyer One" },
          },
        }),
      };
    }
    if (href.includes("firestore.googleapis.com")) {
      const docPath = href.split("/documents/")[1]?.split("?")[0] || "";
      firestoreCalls.push({ method, docPath });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch in test: ${method} ${href}`);
  };

  try {
    const request = new Request(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "verif-hash": SECRET_HASH },
      body: JSON.stringify(successfulEvent({ meta: {}, tx_ref: "promocbt_buyeruid123_monthly_1700000000000_abc123" })),
    });
    const response = await worker.fetch(request, env);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.processed, true);

    // The premium grant is written and the D1 plan flip targets the user
    // resolved from the tx_ref prefix.
    const planUpdates = d1Writes.filter((write) => write.sql.includes("UPDATE auth_users SET plan = 'premium'"));
    assert.equal(planUpdates.length, 1);
    assert.equal(planUpdates[0].values[0], "buyer-uid-1");
    const paymentWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("payments/"));
    assert.equal(paymentWrites.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Flutterwave test mode substitutes the buyer with a sandbox customer email
// (ravesb_<id>_<merchant-email>), so the /payment/verify route must not fail
// the email-equality check for those transactions. The tx_ref binding is the
// real security control; the email check only applies to real customer emails.
test("payment verify accepts a Flutterwave sandbox-substituted customer email", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const d1Writes = [];
  const firestoreCalls = [];
  const userId = "e8e56cc3-9066-4232-a4c9-fce3b219efc8";
  const sessionSecret = "session-secret-value-abc";
  const sessionId = "sess_test_1";
  const sessionRow = {
    session_id: sessionId,
    user_id: userId,
    session_secret_hash: sha256Base64UrlLocal(sessionSecret),
    refresh_secret_hash: "",
    created_at: "2026-08-17T00:00:00.000Z",
    expires_at: "2027-08-17T00:00:00.000Z",
    last_seen_at: "2026-08-17T00:00:00.000Z",
  };
  const userRow = {
    id: userId,
    email: "sarahmdasa@gmail.com",
    password_hash: "",
    role: "user",
    plan: "free",
    status: "active",
    email_verified: 1,
    legacy_provider: null,
    legacy_user_id: null,
    created_at: "2026-08-17T00:00:00.000Z",
    updated_at: "2026-08-17T00:00:00.000Z",
    last_login_at: "2026-08-17T00:00:00.000Z",
  };

  const env = {
    ALLOWED_ORIGINS: "https://app.example.test",
    FLW_SECRET_KEY: "FLWSECK_TEST-dummy-key-for-unit-tests-only-X",
    FIREBASE_PROJECT_ID: "test-project",
    GCP_SERVICE_ACCOUNT_EMAIL: "svc@test-project.iam.gserviceaccount.com",
    GCP_SERVICE_ACCOUNT_PRIVATE_KEY: buildPemPrivateKey(pkcs8),
    AUTH_DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async run() {
                d1Writes.push({ sql, values });
                return { success: true, meta: { changes: 1 } };
              },
              async first() {
                const statement = String(sql);
                if (statement.includes("FROM auth_sessions")) return sessionRow;
                if (statement.includes("FROM auth_users") && statement.includes("WHERE id")) return userRow;
                return null;
              },
              async all() {
                return { results: [] };
              },
            };
          },
        };
      },
    },
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    const method = String(options.method || "GET").toUpperCase();
    if (href.includes("oauth2.googleapis.com/token")) {
      return { ok: true, status: 200, json: async () => ({ access_token: "minted-access-token", expires_in: 3600 }) };
    }
    if (href.includes("api.flutterwave.com/v3/transactions")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "success",
          data: {
            id: "10439234",
            tx_ref: "promocbt_e8e56cc3-9066-4232-a4c9-fce3b219_monthly_1787006621697_5pdzws",
            amount: 2500,
            currency: "NGN",
            status: "successful",
            customer: {
              id: 3597575,
              name: "Timothy Dasa",
              email: "ravesb_2108992d4cbd215b833f_timdasa75@gmail.com",
            },
          },
        }),
      };
    }
    if (href.includes("firestore.googleapis.com")) {
      const docPath = href.split("/documents/")[1]?.split("?")[0] || "";
      firestoreCalls.push({ method, docPath });
      return { ok: true, status: 200, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch in test: ${method} ${href}`);
  };

  try {
    const request = new Request("https://promotion-cbt.example/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://app.example.test",
        Authorization: `Bearer ${sessionId}.${sessionSecret}`,
      },
      body: JSON.stringify({
        txRef: "promocbt_e8e56cc3-9066-4232-a4c9-fce3b219_monthly_1787006621697_5pdzws",
        transactionId: "10439234",
        planCycle: "monthly",
        email: "sarahmdasa@gmail.com",
      }),
    });
    const response = await worker.fetch(request, env);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.plan, "premium");

    // The grant lands: D1 plan flip for the authenticated user + one payment record.
    const planUpdates = d1Writes.filter((write) => write.sql.includes("UPDATE auth_users SET plan = 'premium'"));
    assert.equal(planUpdates.length, 1);
    assert.equal(planUpdates[0].values[0], userId);
    const paymentWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("payments/"));
    assert.equal(paymentWrites.length, 1);
    assert.ok(paymentWrites[0].docPath.startsWith("payments/flw_10439234"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
