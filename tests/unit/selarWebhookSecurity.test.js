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
