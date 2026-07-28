import { getFlutterwavePublicKey } from "./authRuntime.js";
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
const FLUTTERWAVE_CHECKOUT_SCRIPT_URL = "https://checkout.flutterwave.com/v3.js";
let flutterwaveCheckoutLoader = null;

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

export async function loadFlutterwaveCheckout({ timeoutMs = 12000 } = {}) {
  if (typeof window.FlutterwaveCheckout === "function") {
    return window.FlutterwaveCheckout;
  }
  if (flutterwaveCheckoutLoader) {
    return flutterwaveCheckoutLoader;
  }

  flutterwaveCheckoutLoader = new Promise((resolve, reject) => {
    let settled = false;
    let intervalId = null;
    let timeoutId = null;

    const cleanup = () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
    const resolveIfReady = () => {
      if (typeof window.FlutterwaveCheckout !== "function") return false;
      settled = true;
      cleanup();
      resolve(window.FlutterwaveCheckout);
      return true;
    };
    const fail = () => {
      if (settled || resolveIfReady()) return;
      settled = true;
      cleanup();
      flutterwaveCheckoutLoader = null;
      reject(new Error("Unable to load Flutterwave checkout. Check your internet connection or browser blockers, then try again."));
    };

    if (resolveIfReady()) return;

    const script = document.createElement("script");
    script.src = FLUTTERWAVE_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.dataset.flutterwaveCheckoutLoader = "true";
    script.onload = () => {
      if (!resolveIfReady()) fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);

    intervalId = window.setInterval(resolveIfReady, 250);
    timeoutId = window.setTimeout(fail, timeoutMs);
  });

  return flutterwaveCheckoutLoader;
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

export async function handleFlutterwavePayment(cycle, {
  user,
  getAuthToken,
  showWarning = () => {},
  showSuccess = () => {},
  showError = () => {},
  onVerified = null,
  onStartStudying = null,
} = {}) {
  const planCycle = normalizeCycle(cycle);
  if (!planCycle) {
    throw new Error("Select a valid plan before payment.");
  }
  const amount = PLAN_PRICES[planCycle];
  const publicKey = getFlutterwavePublicKey();
  if (!publicKey) {
    throw new Error("Flutterwave public key is not configured.");
  }
  await loadFlutterwaveCheckout();
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) {
    showWarning("Login is required before payment.");
    throw new Error("Login is required before payment.");
  }

  const txRef = buildTxRef(user?.id, planCycle);
  return new Promise((resolve, reject) => {
    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: txRef,
      amount,
      currency: "NGN",
      payment_options: "card",
      customer: {
        email,
        name: formatCheckoutCustomerName(user),
      },
      meta: {
        userId: String(user?.id || ""),
        planCycle,
      },
      customizations: {
        title: "Promotion CBT",
        description: `${formatPlanCycleLabel(planCycle)} Premium Access`,
        logo: `${window.location.origin}/assets/icons/promotion_cbt.png`,
      },
      callback: async (response) => {
        try {
          const transactionId = String(response?.transaction_id || response?.id || "").trim();
          const status = String(response?.status || "").trim().toLowerCase();
          if (status && status !== "successful" && status !== "completed") {
            throw new Error("Flutterwave did not mark this payment as successful.");
          }
          const accessToken = await getAuthToken();
          const result = await verifyFlutterwaveTransaction({
            txRef,
            transactionId,
            planCycle,
            email,
          }, accessToken);
          const receipt = savePaymentReceipt(result.receipt || {
            email,
            amount,
            currency: "NGN",
            billingCycle: planCycle,
            status: "successful",
            flwTransactionId: transactionId,
            flwTxRef: txRef,
          });
          if (typeof onVerified === "function") await onVerified(result);
          showSuccess("Payment verified. Premium access is active.");
          openPaymentReceiptLightbox(receipt, { onStartStudying });
          resolve(result);
        } catch (error) {
          showError(error?.message || "Payment verification failed.");
          reject(error);
        }
      },
      onclose: () => {
        showWarning("Payment window closed. No charge was verified.");
        resolve({ ok: false, closed: true });
      },
    });
  });
}
