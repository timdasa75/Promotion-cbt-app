import { getFlutterwavePublicKey } from "./authRuntime.js";
import { showConfirm } from "./ui.js";

// Load the Flutterwave inline SDK if not already present.
function ensureFlutterwaveSdk() {
  if (typeof window.FlutterwaveCheckout === "function") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[src*='checkout.flutterwave.com']");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flutterwave SDK."));
    document.head.appendChild(script);
  });
}
import {
  getPaymentHistory,
  normalizePaymentReceipt,
  savePaymentReceipt,
  verifyFlutterwaveTransaction,
} from "./paymentFlutterwaveService.js";
import { escapeHtml } from "./quiz/formatting.js";

export const PLAN_PRICES = Object.freeze({
  monthly: 2500,
  quarterly: 5500,
  "bi-annual": 7500,
  annual: 12000,
});

const PLAN_LABELS = Object.freeze({
  monthly: "Monthly",
  quarterly: "Quarterly",
  "bi-annual": "Bi-Annual",
  annual: "Annual",
});
function normalizeCycle(value) {
  const cycle = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(PLAN_PRICES, cycle) ? cycle : "";
}

export function formatPlanCycleLabel(value) {
  const cycle = normalizeCycle(value);
  return cycle ? PLAN_LABELS[cycle] : String(value || "").trim();
}

export function formatPaymentAmount(amount, currency = "NGN") {
  const numeric = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: String(currency || "NGN").trim().toUpperCase() || "NGN",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(numeric) ? numeric : 0);
  } catch (error) {
    return `NGN ${Number.isFinite(numeric) ? numeric.toLocaleString("en-NG") : "0"}`;
  }
}

function formatDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTxRef(userId, cycle) {
  const random = Math.random().toString(36).slice(2, 8);
  const safeUserId = String(userId || "user").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "user";
  return `promocbt_${safeUserId}_${cycle}_${Date.now()}_${random}`;
}

function formatCheckoutCustomerName(user) {
  const rawName = String(user?.name || user?.displayName || "").trim();
  const cleanedName = rawName
    .replace(/\s+\d{10,}\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const email = String(user?.email || "").trim();
  return cleanedName || email || "Promotion CBT User";
}

export function buildReceiptHtml(receipt = {}) {
  const normalized = normalizePaymentReceipt(receipt);
  const rows = [
    ["Plan", formatPlanCycleLabel(normalized.billingCycle)],
    ["Amount", formatPaymentAmount(normalized.amount, normalized.currency)],
    ["Receipt", normalized.paymentId || "-"],
    ["Transaction ID", normalized.flwTransactionId || "-"],
    ["Paid", formatDate(normalized.createdAt) || "-"],
    ["Expires", formatDate(normalized.expiresAt) || "-"],
  ];
  return `
    <div class="receipt-summary-grid">
      ${rows.map(([label, value]) => `
        <div class="receipt-summary-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "-")}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

export function openPaymentReceiptLightbox(receipt = {}, { onStartStudying = null } = {}) {
  const normalized = normalizePaymentReceipt(receipt);
  const modal = document.getElementById("paymentReceiptModal");
  const body = document.getElementById("paymentReceiptBody");
  const details = document.getElementById("paymentReceiptDetails");
  const closeBtn = document.getElementById("paymentReceiptCloseBtn");
  const startBtn = document.getElementById("paymentReceiptStartBtn");
  const detailsBtn = document.getElementById("paymentReceiptDetailsBtn");
  if (!modal || !body) return;

  body.innerHTML = buildReceiptHtml(normalized);
  if (details) {
    details.textContent = JSON.stringify(normalized, null, 2);
    details.classList.add("hidden");
  }
  const close = () => modal.classList.add("hidden");
  if (closeBtn) closeBtn.onclick = close;
  if (startBtn) {
    startBtn.onclick = () => {
      close();
      if (typeof onStartStudying === "function") onStartStudying();
    };
  }
  if (detailsBtn && details) {
    detailsBtn.onclick = () => details.classList.toggle("hidden");
  }
  modal.onclick = (event) => {
    if (event.target === modal) close();
  };
  modal.classList.remove("hidden");
}

export function renderLocalPaymentHistory(email, container, { onReceipt = null } = {}) {
  if (!container) return [];
  const receipts = getPaymentHistory(email);
  if (!receipts.length) {
    container.innerHTML = '<p class="hero-meta">No payment history yet. Upgrade to Premium to get started.</p>';
    return receipts;
  }

  container.innerHTML = receipts.map((receipt, index) => `
    <div class="payment-history-row">
      <span>${escapeHtml(formatDate(receipt.createdAt) || "-")}</span>
      <strong>${escapeHtml(formatPlanCycleLabel(receipt.billingCycle) || "-")}</strong>
      <span>${escapeHtml(formatPaymentAmount(receipt.amount, receipt.currency))}</span>
      <span class="admin-badge approved">Success</span>
      <button class="btn btn-ghost btn-sm" data-local-receipt-index="${index}" type="button">Receipt</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-local-receipt-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const receipt = receipts[Number(button.getAttribute("data-local-receipt-index"))];
      if (receipt && typeof onReceipt === "function") onReceipt(receipt);
    });
  });
  return receipts;
}

// Flutterwave's hosted checkout is fronted by a Cloudflare WAF that blocks
// URLs whose query params contain the literal hostname "localhost" (SSRF
// protection). Local dev must therefore reference the app via 127.0.0.1 (or
// [::1]) instead of localhost. Public/production origins pass through
// untouched.
export function wafSafeAppUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.hostname.toLowerCase() === "localhost") {
      url.hostname = "127.0.0.1";
    }
    return url.toString();
  } catch (_) {
    return String(value || "");
  }
}

export function buildFlutterwaveCheckoutUrl({
  publicKey,
  txRef,
  amount,
  currency = "NGN",
  planCycle = "",
  user = null,
  redirectUrl = "",
}) {
  const params = new URLSearchParams();
  params.set("public_key", publicKey);
  params.set("tx_ref", txRef);
  params.set("amount", String(amount));
  params.set("currency", String(currency || "NGN").trim().toUpperCase() || "NGN");
  params.set("payment_options", "card");
  if (redirectUrl) params.set("redirect_url", wafSafeAppUrl(redirectUrl));
  const email = String(user?.email || "").trim().toLowerCase();
  if (email) params.set("customer[email]", email);
  params.set("customer[name]", formatCheckoutCustomerName(user));
  params.set("customizations[title]", "Promotion CBT");
  params.set("customizations[description]", `${formatPlanCycleLabel(planCycle)} Premium Access`);
  // Only include logo URL when NOT on localhost — Flutterwave's WAF blocks
  // URLs containing localhost/127.0.0.1 in the logo param, and local URLs
  // are unreachable from Flutterwave's servers anyway.
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname);
  if (!isLocalhost) {
    params.set("customizations[logo]", wafSafeAppUrl(`${window.location.origin}/assets/icons/promotion_cbt.png`));
  }
  if (user?.id) params.set("meta[userId]", String(user.id));
  if (planCycle) params.set("meta[planCycle]", planCycle);
  return `https://checkout.flutterwave.com/v3/hosted/pay?${params.toString()}`;
}

const PENDING_PAYMENT_RETURN_KEY = "promotion_cbt_pending_flw_return_v1";

function planCycleFromTxRef(txRef) {
  const match = String(txRef || "").match(/^promocbt_[a-zA-Z0-9-]{4,32}_([a-z-]+)_\d+_[a-z0-9]+$/i);
  return match ? normalizeCycle(match[1]) : "";
}

function readPendingFlutterwavePaymentReturn() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_PAYMENT_RETURN_KEY) || "null");
    return parsed && parsed.txRef && parsed.transactionId
      ? {
          status: "successful",
          txRef: String(parsed.txRef),
          transactionId: String(parsed.transactionId),
          planCycle: normalizeCycle(parsed.planCycle),
        }
      : null;
  } catch (_) {
    return null;
  }
}

function savePendingFlutterwavePaymentReturn(ret) {
  try {
    window.localStorage.setItem(
      PENDING_PAYMENT_RETURN_KEY,
      JSON.stringify({
        txRef: ret.txRef,
        transactionId: ret.transactionId,
        planCycle: ret.planCycle,
      }),
    );
  } catch (_) {}
}

function clearPendingFlutterwavePaymentReturn() {
  try {
    window.localStorage.removeItem(PENDING_PAYMENT_RETURN_KEY);
  } catch (_) {}
}

export function parseFlutterwavePaymentReturnParams(search = window.location.search) {
  const params = new URLSearchParams(String(search || ""));
  const status = String(params.get("status") || "").trim().toLowerCase();
  const txRef = String(params.get("tx_ref") || "").trim();
  const transactionId = String(params.get("transaction_id") || "").trim();
  const planCycle = normalizeCycle(params.get("payment_cycle")) || planCycleFromTxRef(txRef);
  // Accept entries with just a tx_ref (the webhook or poller can supply the transaction_id later).
  if (!txRef) return null;
  return { status, txRef, transactionId: transactionId || "", planCycle };
}

// Processes a Flutterwave redirect return (status/tx_ref/transaction_id in the
// URL) or a pending return stored for a not-yet-logged-in user. Verifies the
// transaction server-side, saves the receipt, and opens the receipt lightbox.
// Returns false when there is nothing to process.
export async function handleFlutterwavePaymentReturn({
  getAuthToken = async () => "",
  showWarning = () => {},
  showSuccess = () => {},
  showError = () => {},
  email = "",
  onVerified = null,
  onStartStudying = null,
} = {}) {
  let ret = parseFlutterwavePaymentReturnParams();
  const fromUrl = Boolean(ret);
  if (!ret) ret = readPendingFlutterwavePaymentReturn();
  if (!ret) return false;

  if (fromUrl) {
    // Drop the payment params from the address bar so a refresh never
    // re-verifies the same transaction.
    try {
      const url = new URL(window.location.href);
      ["status", "tx_ref", "transaction_id", "payment_cycle"].forEach((key) =>
        url.searchParams.delete(key),
      );
      window.history.replaceState({}, "", url.toString());
    } catch (_) {}
  }

  if (ret.status && ret.status !== "successful" && ret.status !== "completed") {
    clearPendingFlutterwavePaymentReturn();
    showWarning("Payment was not completed. No charge was verified.");
    return true;
  }

  const accessToken = String((await getAuthToken().catch(() => "")) || "");
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!accessToken || !normalizedEmail) {
    savePendingFlutterwavePaymentReturn(ret);
    showWarning("Payment received. Log in to complete your Premium activation.");
    return true;
  }

  clearPendingFlutterwavePaymentReturn();
  try {
    const result = await verifyFlutterwaveTransaction({
      txRef: ret.txRef,
      transactionId: ret.transactionId,
      planCycle: ret.planCycle,
      email: normalizedEmail,
    }, accessToken);
    const receipt = savePaymentReceipt(result.receipt || {
      email: normalizedEmail,
      amount: PLAN_PRICES[ret.planCycle] || 0,
      currency: "NGN",
      billingCycle: ret.planCycle,
      status: "successful",
      flwTransactionId: ret.transactionId,
      flwTxRef: ret.txRef,
    });
    if (typeof onVerified === "function") await onVerified(result);
    showSuccess("Payment verified. Premium access is active.");
    openPaymentReceiptLightbox(receipt, { onStartStudying });
    return true;
  } catch (error) {
    showError(error?.message || "Payment verification failed.");
    return true;
  }
}

// Starts the Flutterwave inline payment flow.  FlutterwaveCheckout() opens a
// modal overlay on the current page; on success the callback fires, and we
// verify server-side + open the receipt lightbox.
//
// NOTE: the hosted /v3/hosted/pay endpoint has getpaidSetup() commented out
// for non-popup navigations, so window.location.assign() to that URL renders
// a blank page.  The inline approach is the only reliable integration path.
export async function handleFlutterwavePayment(cycle, { user, showWarning = () => {}, showSuccess = () => {}, showError = () => {}, getAuthToken = async () => "", onVerified = null } = {}) {
  const planCycle = normalizeCycle(cycle);
  if (!planCycle) {
    throw new Error("Select a valid plan before payment.");
  }
  const amount = PLAN_PRICES[planCycle];
  const publicKey = getFlutterwavePublicKey();
  if (!publicKey) {
    throw new Error("Flutterwave public key is not configured.");
  }
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) {
    showWarning("Login is required before payment.");
    throw new Error("Login is required before payment.");
  }

  // Show styled confirmation dialog before opening checkout
  const confirmed = await showConfirm({
    title: "Proceed to Payment",
    message: `You are about to pay ₦${amount.toLocaleString()} for ${formatPlanCycleLabel(planCycle)} Premium Access. Do you want to continue?`,
    okText: "Continue to Payment",
    cancelText: "Cancel"
  });

  if (!confirmed) {
    throw new Error("Payment cancelled by user.");
  }

  const txRef = buildTxRef(user?.id, planCycle);

  await ensureFlutterwaveSdk();

  // Track whether the callback has already handled the result.
  let callbackHandled = false;
  let resolvePromise;
  const resultPromise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    try {
      /* global FlutterwaveCheckout */
      FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount,
        currency: "NGN",
        payment_options: "card",
        customer: { email, name: formatCheckoutCustomerName(user) },
        customizations: {
          title: "Promotion CBT",
          description: `${formatPlanCycleLabel(planCycle)} Premium Access`,
        },
        meta: {
          userId: user?.id || "",
          planCycle,
        },
        async callback(response) {
          if (callbackHandled) return;
          const flwRef = response?.tx?.flwRef || "";
          const flwTxId = response?.tx?.id || "";
          const status = response?.tx?.status || "";


          // If the callback fired with empty data (SSL/network error in the
          // checkout library's internal flow), don't mark as handled — let
          // the recovery poller detect the grant via /payment/history.
          if (!flwTxId && !status) {

            return;
          }

          callbackHandled = true;
          if (status === "successful" || status === "completed") {
            try {
              const token = await getAuthToken().catch(() => "");
              if (!token) {
                showError("Session expired. Please log in again to complete payment verification.");
                resolve({ ok: false, txRef, error: "no_token" });
                return;
              }
              const result = await verifyFlutterwaveTransaction({
                txRef,
                transactionId: String(flwTxId),
                planCycle,
                email,
              }, token);

              if (result?.receipt) openPaymentReceiptLightbox(result.receipt);
              if (typeof onVerified === "function") await onVerified(result);
              showSuccess("Payment verified. Premium access is active.");
              resolve({ ok: true, txRef, result });
            } catch (err) {

              showError(err?.message || "Payment verification failed.");
              resolve({ ok: false, txRef, error: err?.message });
            }
          } else {
            showWarning("Payment was not completed.");
            resolve({ ok: false, txRef, status });
          }
        },
        onclose() {
          if (callbackHandled) return;
          callbackHandled = true;
          showWarning("Payment window was closed.");
          resolve({ ok: false, txRef, closed: true });
        },
      });
    } catch (err) {
      reject(err);
    }
  });

  // ── Recovery poller ──────────────────────────────────────────────────
  // When the callback fires with empty data (SSL error on events endpoint),
  // verify the payment directly via /payment/verify using just the tx_ref.
  // The Worker looks up the transaction by tx_ref in Flutterwave's API.
  let verified = false;
  const RECOVERY_POLL_INTERVAL = 5000;
  const RECOVERY_POLL_MAX = 120000;
  let elapsed = 0;
  const pollTimer = setInterval(async () => {
    if (callbackHandled || verified || elapsed >= RECOVERY_POLL_MAX) {
      clearInterval(pollTimer);
      return;
    }
    elapsed += RECOVERY_POLL_INTERVAL;
    try {
      const token = await getAuthToken().catch(() => "");
      if (!token) return;

      // First, check if the webhook already granted access.
      const { getCurrentUserPaymentHistory } = await import("./paymentFlutterwaveService.js");
      const histPayload = await getCurrentUserPaymentHistory(token);
      const payments = Array.isArray(histPayload?.payments) ? histPayload.payments : [];
      const match = payments.find((p) => p.flwTxRef === txRef);
      if (match && (match.status === "successful" || match.status === "success")) {
        // Verify the payment hasn't expired
        const expiresAt = Date.parse(match.expiresAt || "");
        if (expiresAt && expiresAt < Date.now()) {
          // Payment expired, don't grant premium
          callbackHandled = true;
          clearInterval(pollTimer);
          showWarning("Payment has expired. Please try again.");
          resolve({ ok: false, txRef, error: "expired" });
          return;
        }
        verified = true;
        callbackHandled = true;
        clearInterval(pollTimer);

        const { normalizePaymentReceipt: norm } = await import("./paymentFlutterwaveService.js");
        const normalized = norm(match);
        openPaymentReceiptLightbox(normalized);
        if (typeof onVerified === "function") await onVerified({ receipt: normalized });
        showSuccess("Payment verified via recovery. Premium access is active.");
        resolvePromise({ ok: true, txRef, result: { receipt: normalized } });
        return;
      }

      // No history record yet — try direct verification via tx_ref.
      // The Worker will look up the transaction in Flutterwave's API by tx_ref.

      const { verifyFlutterwaveTransaction: verifyTx } = await import("./paymentFlutterwaveService.js");
      const result = await verifyTx({
        txRef,
        transactionId: "",
        planCycle,
        email,
      }, token);
      if (result?.receipt) {
        // Verify the payment hasn't expired
        const expiresAt = Date.parse(result.receipt.expiresAt || "");
        if (expiresAt && expiresAt < Date.now()) {
          callbackHandled = true;
          clearInterval(pollTimer);
          showWarning("Payment has expired. Please try again.");
          resolve({ ok: false, txRef, error: "expired" });
          return;
        }
        verified = true;
        callbackHandled = true;
        clearInterval(pollTimer);

        openPaymentReceiptLightbox(result.receipt);
        if (typeof onVerified === "function") await onVerified(result);
        showSuccess("Payment verified. Premium access is active.");
        resolvePromise({ ok: true, txRef, result });
      }
    } catch (err) {

    }
  }, RECOVERY_POLL_INTERVAL);

  resultPromise.then(() => clearInterval(pollTimer));
  return resultPromise;
}
