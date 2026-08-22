// selarVerify.js — server-side Selar order verification for the Worker.
//
// NOTE (2026-08, confirmed by Selar support): Selar exposes NO order-lookup
// API and NO direct webhooks. The api.selar.co/v2/orders contract this module
// was originally built against does not exist (404 invariant to auth). The
// sanctioned automation path is the Zapier bridge: Selar's "New Sale" trigger
// pushes to /payment/webhook/selar behind SELAR_WEBHOOK_SECRET, and the worker
// grants premium on confirmed events. This module is retained as a dormant
// degraded path — it fails closed whenever the API is unreachable — and is
// safe to keep configured (missing/unreachable key = manual review, never a
// lost payment). If Selar ever publishes a real order API or signed webhook,
// rewire verification here and keep the defensive alias handling.

export const SELAR_API_BASE_URL = "https://api.selar.co/v2";

export function readSelarApiConfig(env = {}) {
  return {
    apiKey: String(env.SELAR_API_KEY || "").trim(),
    baseUrl: String(env.SELAR_API_BASE_URL || "").trim() || SELAR_API_BASE_URL,
  };
}

function normalizeReference(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function isSuccessfulStatus(value) {
  const status = normalizeStatus(value);
  if (!status) return false; // Unknown status: cannot confirm a payment.
  return ["successful", "success", "paid", "completed", "delivered", "fulfilled"].includes(status);
}

export function readOrderReference(order = {}) {
  return normalizeReference(
    order?.reference ||
      order?.order_reference ||
      order?.orderReference ||
      order?.order_ref ||
      order?.orderRef ||
      order?.txn_ref ||
      order?.txnRef ||
      order?.transaction_id ||
      order?.transactionId ||
      order?.id ||
      order?.order_id ||
      order?.orderId ||
      order?.payment_reference ||
      order?.paymentReference ||
      "",
  );
}

export function readOrderEmail(order = {}) {
  return normalizeEmail(
    order?.customer_email ||
      order?.customerEmail ||
      order?.buyer_email ||
      order?.buyerEmail ||
      order?.email ||
      order?.customer?.email ||
      order?.buyer?.email ||
      "",
  );
}

export function readOrderAmount(order = {}) {
  const amount = Number(
    order?.amount ||
      order?.price ||
      order?.total ||
      order?.order_amount ||
      order?.orderAmount ||
      order?.paid_amount ||
      order?.paidAmount ||
      0,
  );
  return Number.isFinite(amount) ? amount : 0;
}

export function readOrderStatus(order = {}) {
  return normalizeStatus(
    order?.status ||
      order?.payment_status ||
      order?.paymentStatus ||
      order?.event_status ||
      order?.eventStatus ||
      order?.order_status ||
      order?.orderStatus ||
      "",
  );
}

export function orderMatchesReference(order = {}, expectedReference = "") {
  const expected = normalizeReference(expectedReference);
  if (!expected) return false;
  const candidate = readOrderReference(order);
  if (!candidate) return false;
  // Exact match, or the expected reference appears at the end (some payloads
  // prefix it with "SELAR-" or a numeric id).
  return candidate === expected || candidate.endsWith(expected) || expected.endsWith(candidate);
}

function extractOrderRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result?.orders)) return payload.result.orders;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function readNextPageToken(payload) {
  return String(
    payload?.next_page ||
      payload?.nextPageToken ||
      payload?.next_page_token ||
      payload?.pagination?.next_page ||
      payload?.meta?.next_page ||
      "",
  ).trim();
}

export async function fetchSelarOrders({ apiKey = "", baseUrl = SELAR_API_BASE_URL, fetchImpl = fetch, maxPages = 5 } = {}) {
  if (!apiKey) {
    return { orders: [], verificationUnavailable: true };
  }
  if (typeof fetchImpl !== "function") {
    return { orders: [], verificationUnavailable: true };
  }

  const orders = [];
  let pageUrl = `${baseUrl.replace(/\/+$/, "")}/orders`;
  for (let page = 0; page < maxPages; page += 1) {
    let response;
    try {
      response = await fetchImpl(pageUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
    } catch (error) {
      return { orders, verificationError: error?.message || "Selar API request failed." };
    }

    if (!response.ok) {
      return {
        orders,
        verificationError: `Selar API returned HTTP ${response.status}.`,
        status: response.status,
      };
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      return { orders, verificationError: "Selar API returned a non-JSON response." };
    }

    orders.push(...extractOrderRows(payload));

    const nextToken = readNextPageToken(payload);
    if (!nextToken) break;
    pageUrl = `${baseUrl.replace(/\/+$/, "")}/orders?page=${encodeURIComponent(nextToken)}`;
  }

  return { orders, verificationUnavailable: false };
}

/**
 * Verify a user-submitted Selar order reference against the merchant API.
 *
 * Returns one of:
 *  - { verified: true, order }                        — found, successful, email matches (when present)
 *  - { verified: false, reason: "api_not_configured" }  — no SELAR_API_KEY set
 *  - { verified: false, reason: "order_not_found" }     — no order matched the reference
 *  - { verified: false, reason: "order_not_successful" } — order found but not paid (or status unknown)
 *  - { verified: false, reason: "email_mismatch" }      — order belongs to a different buyer
 *  - { verified: false, reason: "amount_mismatch" }     — order amount does not match the selected plan
 *  - { verified: false, reason: "reference_ambiguous" } — suffix match without buyer email confirmation
 *  - { verified: false, reason: "api_error", error }    — API unreachable / bad response
 */
export async function verifySelarOrderByReference(
  { orderReference = "", buyerEmail = "", expectedAmount = 0, apiKey = "", baseUrl = SELAR_API_BASE_URL } = {},
  { fetchImpl = fetch } = {},
) {
  const reference = normalizeReference(orderReference);
  if (!reference) {
    return { verified: false, reason: "missing_reference" };
  }
  if (!apiKey) {
    return { verified: false, reason: "api_not_configured" };
  }

  const { orders, verificationUnavailable, verificationError, status } = await fetchSelarOrders({
    apiKey,
    baseUrl,
    fetchImpl,
  });

  if (verificationUnavailable) {
    return { verified: false, reason: "api_not_configured" };
  }
  if (verificationError) {
    return { verified: false, reason: "api_error", error: verificationError, status };
  }

  const expectedEmail = normalizeEmail(buyerEmail);

  // Strongest match first: an exact reference match is always acceptable.
  const exactMatch = orders.find((order) => readOrderReference(order) === reference);

  // Suffix / alias matches are only trusted when the order carries a buyer
  // email AND it matches the signed-in user — otherwise a short reference
  // could silently match an unrelated order and grant premium.
  let match = exactMatch;
  if (!match && expectedEmail) {
    match = orders.find(
      (order) => orderMatchesReference(order, reference) && readOrderEmail(order) === expectedEmail,
    );
  }

  if (!match) {
    // A suffix-only match exists but we could not confirm the buyer email.
    const suffixOnly = orders.some((order) => orderMatchesReference(order, reference));
    if (suffixOnly) {
      return { verified: false, reason: "reference_ambiguous" };
    }
    return { verified: false, reason: "order_not_found" };
  }

  const orderStatus = readOrderStatus(match);
  if (!isSuccessfulStatus(orderStatus)) {
    return { verified: false, reason: "order_not_successful", status: orderStatus };
  }

  const orderEmail = readOrderEmail(match);
  if (expectedEmail && orderEmail && orderEmail !== expectedEmail) {
    return { verified: false, reason: "email_mismatch", orderEmail };
  }

  const amount = readOrderAmount(match);
  if (expectedAmount > 0 && amount > 0 && Math.round(amount) !== Math.round(expectedAmount)) {
    return { verified: false, reason: "amount_mismatch", amount };
  }

  return {
    verified: true,
    order: match,
    amount,
    status: orderStatus || "successful",
  };
}
