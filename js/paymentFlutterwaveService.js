import { getFirebaseConfig } from "./authRuntime.js";

const LOCAL_RECEIPTS_KEY = "promotion_cbt_flutterwave_receipts_v1";

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getPaymentApiBaseUrl() {
  const cfg = getFirebaseConfig();
  return normalizeBaseUrl(cfg.cloudflareAuthBaseUrl || cfg.adminApiBaseUrl || "");
}

function buildPaymentApiUrl(path) {
  const baseUrl = getPaymentApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Payment verification API is not configured.");
  }
  return `${baseUrl}/${String(path || "").replace(/^\/+/, "")}`;
}

async function postPaymentJson(path, body = {}, accessToken = "", fetchImpl = fetch) {
  const token = String(accessToken || "").trim();
  if (!token) {
    throw new Error("Login session is required before payment verification.");
  }

  const response = await fetchImpl(buildPaymentApiUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || payload?.message || "Payment request failed.");
  }
  return payload;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizePaymentReceipt(receipt = {}) {
  const transactionId = String(
    receipt.flwTransactionId ||
      receipt.transactionId ||
      receipt.id ||
      receipt.paymentId ||
      "",
  ).trim();
  const txRef = String(receipt.flwTxRef || receipt.txRef || receipt.tx_ref || "").trim();
  const paymentId = String(receipt.paymentId || (transactionId ? `flw_${transactionId}` : txRef)).trim();
  return {
    paymentId,
    email: normalizeEmail(receipt.email || receipt.customerEmail || receipt.flwCustomerEmail || ""),
    amount: Number(receipt.amount || 0),
    currency: String(receipt.currency || "NGN").trim().toUpperCase() || "NGN",
    plan: String(receipt.plan || "premium").trim() || "premium",
    billingCycle: String(receipt.billingCycle || receipt.planCycle || receipt.flwPaymentPlan || "").trim(),
    status: String(receipt.status || "successful").trim().toLowerCase(),
    flwTransactionId: transactionId,
    flwCustomerEmail: normalizeEmail(receipt.flwCustomerEmail || receipt.customerEmail || receipt.email || ""),
    flwTxRef: txRef,
    txRef,
    createdAt: String(receipt.createdAt || receipt.verifiedAt || receipt.lastPaymentAt || new Date().toISOString()).trim(),
    expiresAt: String(receipt.expiresAt || receipt.planExpiresAt || "").trim(),
  };
}

function readLocalReceipts() {
  try {
    const raw = window.localStorage.getItem(LOCAL_RECEIPTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizePaymentReceipt).filter((entry) => entry.paymentId) : [];
  } catch (error) {
    return [];
  }
}

function writeLocalReceipts(receipts) {
  try {
    window.localStorage.setItem(LOCAL_RECEIPTS_KEY, JSON.stringify(receipts || []));
  } catch (error) {
    // Local receipt history is a convenience cache only.
  }
}

export function savePaymentReceipt(receipt) {
  const normalized = normalizePaymentReceipt(receipt);
  if (!normalized.paymentId) return normalized;
  const receipts = readLocalReceipts();
  const next = [
    normalized,
    ...receipts.filter((entry) => entry.paymentId !== normalized.paymentId),
  ].slice(0, 50);
  writeLocalReceipts(next);
  return normalized;
}

export function getPaymentHistory(email = "") {
  const normalizedEmail = normalizeEmail(email);
  return readLocalReceipts().filter((receipt) => {
    return !normalizedEmail || receipt.email === normalizedEmail || receipt.flwCustomerEmail === normalizedEmail;
  });
}

export function getPaymentReceipt(paymentId) {
  const normalizedId = String(paymentId || "").trim();
  return readLocalReceipts().find((receipt) => receipt.paymentId === normalizedId) || null;
}

export async function verifyFlutterwaveTransaction({
  txRef = "",
  transactionId = "",
  planCycle = "",
  email = "",
} = {}, accessToken = "", fetchImpl = fetch) {

  const payload = await postPaymentJson(
    "payment/verify",
    {
      txRef: String(txRef || "").trim(),
      transactionId: String(transactionId || "").trim(),
      planCycle: String(planCycle || "").trim(),
      email: normalizeEmail(email),
    },
    accessToken,
    fetchImpl,
  );

  if (payload?.receipt) {
    savePaymentReceipt(payload.receipt);
  }
  return payload;
}

export async function getCurrentUserPaymentHistory(accessToken = "", fetchImpl = fetch) {
  return postPaymentJson("payment/history", {}, accessToken, fetchImpl);
}

export async function getAdminPaymentHistory(filters = {}, accessToken = "", fetchImpl = fetch) {
  return postPaymentJson("adminListPayments", filters, accessToken, fetchImpl);
}
