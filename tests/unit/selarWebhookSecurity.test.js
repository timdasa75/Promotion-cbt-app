import test from "node:test";
import assert from "node:assert/strict";

import worker from "../../workers/admin-bridge/worker.js";

const WEBHOOK_URL = "https://promotion-cbt.example/payment/webhook/selar";

async function callSelarWebhook({ secret, signature, body = {}, env = {} } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (signature !== undefined) headers["x-selar-signature"] = String(signature);
  const request = new Request(WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const response = await worker.fetch(request, { ...env, SELAR_WEBHOOK_SECRET: secret });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // non-JSON body
  }
  return { status: response.status, payload };
}

test("selar webhook fails closed when no secret is configured", async () => {
  const { status } = await callSelarWebhook({
    secret: "",
    signature: "anything",
    body: { customer_email: "buyer@example.com", product_name: "Promotion CBT Monthly" },
  });
  assert.equal(status, 503);
});

test("selar webhook rejects a wrong shared secret", async () => {
  const { status } = await callSelarWebhook({
    secret: "correct-horse-battery-staple",
    signature: "wrong-secret",
    body: { customer_email: "buyer@example.com", product_name: "Promotion CBT Monthly" },
  });
  assert.equal(status, 403);
});

test("selar webhook rejects a missing signature header", async () => {
  const { status } = await callSelarWebhook({
    secret: "correct-horse-battery-staple",
    signature: "",
    body: { customer_email: "buyer@example.com", product_name: "Promotion CBT Monthly" },
  });
  assert.equal(status, 403);
});

test("selar webhook accepts a matching secret and ignores non-successful events", async () => {
  const { status, payload } = await callSelarWebhook({
    secret: "correct-horse-battery-staple",
    signature: "correct-horse-battery-staple",
    body: {
      status: "failed",
      customer_email: "buyer@example.com",
      product_name: "Promotion CBT Monthly",
    },
  });
  assert.equal(status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ignored, true);
});

test("selar webhook accepts a matching secret and ignores invalid emails", async () => {
  const { status, payload } = await callSelarWebhook({
    secret: "correct-horse-battery-staple",
    signature: "correct-horse-battery-staple",
    body: {
      status: "successful",
      customer_email: "not-an-email",
      product_name: "Promotion CBT Monthly",
    },
  });
  assert.equal(status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ignored, true);
});

test("selar webhook honors alternate signature header names", async () => {
  const request = new Request(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": "shared-secret-value",
    },
    body: JSON.stringify({ status: "failed", customer_email: "buyer@example.com" }),
  });
  const response = await worker.fetch(request, { SELAR_WEBHOOK_SECRET: "shared-secret-value" });
  assert.equal(response.status, 200);
});

function buildPemPrivateKey(pkcs8ArrayBuffer) {
  const base64 = Buffer.from(pkcs8ArrayBuffer).toString("base64");
  const lines = base64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

// Full successful Zapier-payload simulation: a real signature, a minted
// service-account token, an accounts:lookup that resolves the buyer, and
// Firestore/D1 grants that all succeed. Asserts the premium grant record is
// written exactly once (single delivery, no duplicate writes).
test("selar webhook processes a full successful Zapier payload and writes the premium grant exactly once", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const d1Writes = [];
  const firestoreCalls = [];
  const lookupBodies = [];

  const env = {
    SELAR_WEBHOOK_SECRET: "webhook-shared-secret",
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
    if (href.includes("identitytoolkit.googleapis.com") && href.includes("accounts:lookup")) {
      lookupBodies.push(JSON.parse(String(options.body || "{}")));
      return { ok: true, status: 200, json: async () => ({ users: [{ localId: "buyer-uid-1", email: "buyer@example.com" }] }) };
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
        "x-selar-signature": "webhook-shared-secret",
      },
      body: JSON.stringify({
        customer_email: "buyer@example.com",
        product_name: "Promotion CBT Premium - Monthly Access",
        order_reference: "SELAR-ORDER-12345",
        amount: "2500",
        currency: "NGN",
      }),
    });
    const response = await worker.fetch(request, env);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.processed, true);

    // The premium grant record (Firestore payments doc) is written exactly once.
    const paymentWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("payments/"));
    assert.equal(paymentWrites.length, 1);
    assert.equal(paymentWrites[0].docPath, "payments/selar_SELAR-ORDER-12345");

    // The buyer's entitlement profile is patched exactly once.
    const profileWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("profiles/"));
    assert.equal(profileWrites.length, 1);
    assert.equal(profileWrites[0].docPath, "profiles/buyer-uid-1");

    // The D1 plan flip runs exactly once.
    const planUpdates = d1Writes.filter((write) => write.sql.includes("UPDATE auth_users SET plan = 'premium'"));
    assert.equal(planUpdates.length, 1);
    assert.equal(planUpdates[0].values[0], "buyer-uid-1");

    // The buyer lookup used the webhook email.
    assert.equal(lookupBodies.length, 1);
    assert.deepEqual(lookupBodies[0].email, ["buyer@example.com"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Regression: Zapier's free "Code by Zapier" step only allows ~1s of execution,
// but a cold Worker running the full grant chain can exceed that. When a runtime
// ctx is available the route must return the 200 immediately (validation only)
// and run the grant in the background via ctx.waitUntil, so the step never
// trips the limit — while still writing the premium grant exactly once.
test("selar webhook defers the grant via ctx.waitUntil and still writes it exactly once", async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const d1Writes = [];
  const firestoreCalls = [];
  const lookupBodies = [];
  const deferred = [];

  const env = {
    SELAR_WEBHOOK_SECRET: "webhook-shared-secret",
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
    if (href.includes("identitytoolkit.googleapis.com") && href.includes("accounts:lookup")) {
      lookupBodies.push(JSON.parse(String(options.body || "{}")));
      return { ok: true, status: 200, json: async () => ({ users: [{ localId: "buyer-uid-1", email: "buyer@example.com" }] }) };
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
        "x-selar-signature": "webhook-shared-secret",
      },
      body: JSON.stringify({
        customer_email: "buyer@example.com",
        product_name: "Promotion CBT Premium - Monthly Access",
        order_reference: "SELAR-ORDER-12345",
        amount: "2500",
        currency: "NGN",
      }),
    });

    const ctx = { waitUntil: (promise) => deferred.push(promise) };
    const response = await worker.fetch(request, env, ctx);

    // The handler must defer exactly once and claim acceptance immediately.
    assert.equal(deferred.length, 1);
    const writesAtResponse = {
      payments: firestoreCalls.filter((c) => c.method === "PATCH" && c.docPath.startsWith("payments/")).length,
      planUpdates: d1Writes.filter((w) => w.sql.includes("UPDATE auth_users SET plan = 'premium'")).length,
    };

    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.processed, true);

    // The grant is still in flight at response time (that is the whole point).
    assert.equal(writesAtResponse.payments, 0);
    assert.equal(writesAtResponse.planUpdates, 0);

    // Let the background work finish, then confirm exactly-once writes.
    await Promise.all(deferred);

    const paymentWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("payments/"));
    assert.equal(paymentWrites.length, 1);
    assert.equal(paymentWrites[0].docPath, "payments/selar_SELAR-ORDER-12345");

    const profileWrites = firestoreCalls.filter((call) => call.method === "PATCH" && call.docPath.startsWith("profiles/"));
    assert.equal(profileWrites.length, 1);
    assert.equal(profileWrites[0].docPath, "profiles/buyer-uid-1");

    const planUpdates = d1Writes.filter((write) => write.sql.includes("UPDATE auth_users SET plan = 'premium'"));
    assert.equal(planUpdates.length, 1);
    assert.equal(planUpdates[0].values[0], "buyer-uid-1");

    assert.equal(lookupBodies.length, 1);
    assert.deepEqual(lookupBodies[0].email, ["buyer@example.com"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
