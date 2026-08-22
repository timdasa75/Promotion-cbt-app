// Unit tests for the Flutterwave hosted checkout flow in js/paymentFlutterwave.js:
// the checkout URL builder and the redirect-return parameter parser. These pin
// the contract between the app and Flutterwave's hosted payment page so a
// silent drift (e.g. a dropped meta field or a misparsed return) is caught.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildFlutterwaveCheckoutUrl,
  parseFlutterwavePaymentReturnParams,
  wafSafeAppUrl,
} from "../../js/paymentFlutterwave.js";

// buildFlutterwaveCheckoutUrl reads window.location.origin for the logo URL.
// Node's test runner executes test callbacks after registration, so the stub
// must live at module scope rather than in a synchronous try/finally.
const originalWindow = globalThis.window;
globalThis.window = { location: { origin: "http://localhost:5500", hostname: "localhost", pathname: "/" } };
test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test("buildFlutterwaveCheckoutUrl includes the hosted pay endpoint and all required params", () => {
  const url = buildFlutterwaveCheckoutUrl({
    publicKey: "FLWPUBK_TEST-abc123-X",
    txRef: "promocbt_uid123_monthly_1700000000000_abc123",
    amount: 2500,
    planCycle: "monthly",
    user: { id: "uid123", email: "buyer@example.com", name: "Buyer One" },
    redirectUrl: "http://localhost:5500/?payment_cycle=monthly",
  });

  assert.ok(url.startsWith("https://checkout.flutterwave.com/v3/hosted/pay?"));
  const params = new URLSearchParams(url.split("?")[1]);
  assert.equal(params.get("public_key"), "FLWPUBK_TEST-abc123-X");
  assert.equal(params.get("tx_ref"), "promocbt_uid123_monthly_1700000000000_abc123");
  assert.equal(params.get("amount"), "2500");
  assert.equal(params.get("currency"), "NGN");
  assert.equal(params.get("payment_options"), "card");  // The WAF-safe rewrite must replace localhost with 127.0.0.1 in every
  // app-referencing param (Flutterwave's Cloudflare blocks "localhost").
  assert.equal(params.get("redirect_url"), "http://127.0.0.1:5500/?payment_cycle=monthly");
  // On localhost the logo URL is omitted entirely — Flutterwave's WAF blocks
  // localhost/127.0.0.1 in the logo param, and local URLs are unreachable
  // from Flutterwave's servers anyway.
  assert.equal(params.get("customizations[logo]"), null);
  assert.equal(params.get("customer[email]"), "buyer@example.com");
  assert.equal(params.get("customer[name]"), "Buyer One");
  assert.equal(params.get("meta[userId]"), "uid123");
  assert.equal(params.get("meta[planCycle]"), "monthly");
  assert.equal(params.get("customizations[title]"), "Promotion CBT");
});

test("buildFlutterwaveCheckoutUrl includes logo on public origins but omits it on localhost", () => {
  // On localhost → no logo
  const localUrl = buildFlutterwaveCheckoutUrl({
    publicKey: "FLWPUBK_TEST-abc123-X",
    txRef: "promocbt_uid123_monthly_1700000000000_abc123",
    amount: 2500,
    planCycle: "monthly",
    user: { id: "uid123", email: "buyer@example.com", name: "Buyer" },
    redirectUrl: "http://localhost:5500/?payment_cycle=monthly",
  });
  const localParams = new URLSearchParams(localUrl.split("?")[1]);
  assert.equal(localParams.get("customizations[logo]"), null);

  // On public origin → logo present
  const savedOrigin = globalThis.window.location.origin;
  const savedHostname = globalThis.window.location.hostname;
  globalThis.window.location.origin = "https://promotion-cbt.example.com";
  globalThis.window.location.hostname = "promotion-cbt.example.com";
  try {
    const publicUrl = buildFlutterwaveCheckoutUrl({
      publicKey: "FLWPUBK_TEST-abc123-X",
      txRef: "promocbt_uid123_monthly_1700000000000_abc123",
      amount: 2500,
      planCycle: "monthly",
      user: { id: "uid123", email: "buyer@example.com", name: "Buyer" },
      redirectUrl: "https://promotion-cbt.example.com/?payment_cycle=monthly",
    });
    const publicParams = new URLSearchParams(publicUrl.split("?")[1]);
    assert.equal(
      publicParams.get("customizations[logo]"),
      "https://promotion-cbt.example.com/assets/icons/promotion_cbt.png",
    );
  } finally {
    globalThis.window.location.origin = savedOrigin;
    globalThis.window.location.hostname = savedHostname;
  }
});

test("buildFlutterwaveCheckoutUrl omits meta userId when the user has no id", () => {
  const url = buildFlutterwaveCheckoutUrl({
    publicKey: "FLWPUBK_TEST-abc123-X",
    txRef: "promocbt_uid123_monthly_1700000000000_abc123",
    amount: 2500,
    planCycle: "monthly",
    user: { email: "buyer@example.com" },
  });
  const params = new URLSearchParams(url.split("?")[1]);
  assert.equal(params.get("meta[userId]"), null);
  assert.equal(params.get("meta[planCycle]"), "monthly");
});

test("wafSafeAppUrl rewrites localhost but leaves public origins and IPv6 loopback alone", () => {
  assert.equal(wafSafeAppUrl("http://localhost:5500/"), "http://127.0.0.1:5500/");
  assert.equal(
    wafSafeAppUrl("http://localhost:5500/?payment_cycle=monthly"),
    "http://127.0.0.1:5500/?payment_cycle=monthly",
  );
  assert.equal(wafSafeAppUrl("http://[::1]:5500/"), "http://[::1]:5500/");
  assert.equal(
    wafSafeAppUrl("https://promotioncbt.github.io/promotion-cbt-app/"),
    "https://promotioncbt.github.io/promotion-cbt-app/",
  );
});

test("parseFlutterwavePaymentReturnParams reads the redirect return query", () => {
  const ret = parseFlutterwavePaymentReturnParams(
    "?status=successful&tx_ref=promocbt_uid123_monthly_1700000000000_abc123&transaction_id=10439234&payment_cycle=monthly",
  );
  assert.deepEqual(ret, {
    status: "successful",
    txRef: "promocbt_uid123_monthly_1700000000000_abc123",
    transactionId: "10439234",
    planCycle: "monthly",
  });
});

test("parseFlutterwavePaymentReturnParams derives the plan cycle from the tx_ref when payment_cycle is absent", () => {
  const ret = parseFlutterwavePaymentReturnParams(
    "?status=successful&tx_ref=promocbt_uid123_bi-annual_1700000000000_abc123&transaction_id=10439234",
  );
  assert.equal(ret.planCycle, "bi-annual");
});

test("parseFlutterwavePaymentReturnParams returns null without a tx_ref", () => {
  assert.equal(parseFlutterwavePaymentReturnParams("?status=successful"), null);
  assert.equal(parseFlutterwavePaymentReturnParams(""), null);
});

test("parseFlutterwavePaymentReturnParams returns entry with tx_ref but missing transaction_id", () => {
  const ret = parseFlutterwavePaymentReturnParams("?tx_ref=x&status=successful");
  assert.equal(ret.txRef, "x");
  assert.equal(ret.transactionId, "");
});
