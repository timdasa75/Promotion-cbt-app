import test from "node:test";
import assert from "node:assert/strict";

import {
  orderMatchesReference,
  readOrderEmail,
  readOrderReference,
  readOrderStatus,
  readSelarApiConfig,
  verifySelarOrderByReference,
} from "../../workers/admin-bridge/selarVerify.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("readSelarApiConfig resolves defaults", () => {
  const config = readSelarApiConfig({ SELAR_API_KEY: "  key-123  " });
  assert.equal(config.apiKey, "key-123");
  assert.equal(config.baseUrl, "https://api.selar.co/v2");

  const custom = readSelarApiConfig({ SELAR_API_KEY: "k", SELAR_API_BASE_URL: "https://api.selar.com/v2" });
  assert.equal(custom.baseUrl, "https://api.selar.com/v2");
});

test("order reference matching handles aliases and prefixes", () => {
  assert.equal(orderMatchesReference({ reference: "ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ order_reference: "ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ orderRef: "ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ txn_ref: "ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ id: "ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ reference: "SELAR-ORD-12345" }, "ORD-12345"), true);
  assert.equal(orderMatchesReference({ reference: "ORD-99999" }, "ORD-12345"), false);
  assert.equal(orderMatchesReference({}, "ORD-12345"), false);
});

test("order email and status extraction", () => {
  assert.equal(readOrderEmail({ customer_email: "Buyer@Example.com" }), "buyer@example.com");
  assert.equal(readOrderEmail({ customer: { email: "nested@example.com" } }), "nested@example.com");
  assert.equal(readOrderEmail({}), "");
  assert.equal(readOrderStatus({ payment_status: "paid" }), "paid");
  assert.equal(readOrderStatus({ event_status: "successful" }), "successful");
});

test("verifySelarOrderByReference returns api_not_configured without a key", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", apiKey: "" },
    { fetchImpl: async () => jsonResponse({}) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "api_not_configured");
});

test("verifySelarOrderByReference verifies a matching successful order", async () => {
  const orders = [
    { reference: "ORD-1", status: "successful", customer_email: "buyer@example.com", amount: 2500 },
    { reference: "ORD-2", status: "pending", customer_email: "other@example.com" },
  ];
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders }) },
  );
  assert.equal(result.verified, true);
  assert.equal(result.reason, undefined);
  assert.equal(result.amount, 2500);
  assert.equal(result.order.reference, "ORD-1");
});

test("verifySelarOrderByReference rejects a pending order", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-2", buyerEmail: "other@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-2", status: "pending" }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "order_not_successful");
});

test("verifySelarOrderByReference rejects an order with unknown status", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-3", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-3", customer_email: "buyer@example.com" }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "order_not_successful");
});

test("verifySelarOrderByReference rejects a suffix match without email confirmation", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "SELAR-ORD-1" }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "reference_ambiguous");
});

test("verifySelarOrderByReference accepts a suffix match when the email is confirmed", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "SELAR-ORD-1", status: "successful", customer_email: "buyer@example.com" }] }) },
  );
  assert.equal(result.verified, true);
});

test("verifySelarOrderByReference rejects an amount mismatch", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", expectedAmount: 12000, apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-1", status: "successful", customer_email: "buyer@example.com", amount: 2500 }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "amount_mismatch");
});

test("verifySelarOrderByReference accepts an amount match", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", expectedAmount: 2500, apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-1", status: "successful", customer_email: "buyer@example.com", amount: 2500 }] }) },
  );
  assert.equal(result.verified, true);
  assert.equal(result.amount, 2500);
});

test("verifySelarOrderByReference rejects a buyer-email mismatch", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "someone-else@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-1", status: "successful", customer_email: "buyer@example.com" }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "email_mismatch");
});

test("verifySelarOrderByReference returns order_not_found when nothing matches", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "NOPE", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ orders: [{ reference: "ORD-1", status: "successful" }] }) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "order_not_found");
});

test("verifySelarOrderByReference surfaces API errors", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => jsonResponse({ error: "bad key" }, 401) },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "api_error");
  assert.equal(result.status, 401);
});

test("verifySelarOrderByReference surfaces network failures", async () => {
  const result = await verifySelarOrderByReference(
    { orderReference: "ORD-1", buyerEmail: "buyer@example.com", apiKey: "key" },
    { fetchImpl: async () => { throw new Error("socket hang up"); } },
  );
  assert.equal(result.verified, false);
  assert.equal(result.reason, "api_error");
});
