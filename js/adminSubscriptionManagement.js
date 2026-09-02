/**
 * Subscription Management Module
 * Handles the admin panel's subscription overview with tabs for:
 * - Active Subscriptions
 * - Expiring Soon
 * - Payment History
 * - Revenue Metrics
 */

import { getRuntimeConfig } from "./authRuntime.js";

let cachedSubscriptions = [];
let cachedPayments = [];
let currentTab = "active-subscriptions";

/**
 * Initialize the subscription management section
 */
export function initSubscriptionManagement() {
  setupTabNavigation();
  loadInitialData();
}

/**
 * Set up tab navigation click handlers
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".admin-tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });
}

/**
 * Switch to a different tab
 */
function switchTab(tabId) {
  currentTab = tabId;

  // Update button states
  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Update content visibility
  document.querySelectorAll(".admin-tab-content").forEach((content) => {
    content.classList.toggle("active", content.id === `tab-${tabId}`);
  });

  // Load data for the selected tab
  loadTabData(tabId);
}

/**
 * Load initial data for the default tab
 */
async function loadInitialData() {
  await Promise.all([loadSubscriptions(), loadPayments()]);
  renderActiveSubscriptions();
  renderRevenueMetrics();
}

/**
 * Load tab-specific data when switching tabs
 */
async function loadTabData(tabId) {
  switch (tabId) {
    case "active-subscriptions":
      renderActiveSubscriptions();
      break;
    case "expiring-soon":
      renderExpiringSoon();
      break;
    case "payment-history":
      renderPaymentHistory();
      break;
    case "revenue-metrics":
      renderRevenueMetrics();
      break;
  }
}

/**
 * Load all subscriptions from the API
 */
async function loadSubscriptions() {
  try {
    const config = getRuntimeConfig();
    const baseUrl = config?.adminApiBaseUrl || config?.cloudflareAuthBaseUrl || "";
    if (!baseUrl) return;

    const session = JSON.parse(localStorage.getItem('promotionCbtSession') || '{}');
    const accessToken = session?.accessToken || '';
    const response = await fetch(`${baseUrl}/adminListUsers`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      },
    });
    const data = await response.json();

    if (data.ok && Array.isArray(data.users)) {
      cachedSubscriptions = data.users.filter(
        (u) => u.plan === "premium" || u.billingCycle
      );
    }
  } catch (error) {
    console.error("[SubscriptionManagement] Failed to load subscriptions:", error);
  }
}

/**
 * Load payment history from the API
 */
async function loadPayments() {
  try {
    const config = getRuntimeConfig();
    const baseUrl = config?.adminApiBaseUrl || config?.cloudflareAuthBaseUrl || "";
    if (!baseUrl) return;

    const session = JSON.parse(localStorage.getItem('promotionCbtSession') || '{}');
    const accessToken = session?.accessToken || '';
    const response = await fetch(`${baseUrl}/adminListPayments`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
      },
    });
    const data = await response.json();

    if (data.ok && Array.isArray(data.payments)) {
      cachedPayments = data.payments;
    }
  } catch (error) {
    console.error("[SubscriptionManagement] Failed to load payments:", error);
  }
}

/**
 * Render active subscriptions list
 */
function renderActiveSubscriptions() {
  const container = document.getElementById("activeSubList");
  const countEl = document.getElementById("activeSubCount");
  if (!container) return;

  const activeSubs = cachedSubscriptions.filter((sub) => {
    const expiresAt = Date.parse(sub.planExpiresAt || "");
    return !expiresAt || expiresAt > Date.now();
  });

  countEl.textContent = activeSubs.length;

  if (activeSubs.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <div class="icon">📋</div>
        <p>No active subscriptions found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeSubs
    .map((sub) => {
      const expiresAt = Date.parse(sub.planExpiresAt || "");
      const isExpiringSoon = expiresAt && expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000;
      const expiryClass = isExpiringSoon ? "expiring-soon" : "";
      const expiryText = expiresAt
        ? new Date(expiresAt).toLocaleDateString()
        : "No expiry";

      return `
        <div class="admin-subscription-item">
          <span class="email">${escapeHtml(sub.email || "")}</span>
          <span class="plan-badge ${sub.billingCycle || "monthly"}">${sub.billingCycle || "monthly"}</span>
          <span class="expiry ${expiryClass}">Expires: ${expiryText}</span>
          <span class="status-badge active">Active</span>
        </div>
      `;
    })
    .join("");
}

/**
 * Render expiring soon subscriptions
 */
function renderExpiringSoon() {
  const container = document.getElementById("expiringSubList");
  const countEl = document.getElementById("expiringSubCount");
  if (!container) return;

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const expiringSoon = cachedSubscriptions.filter((sub) => {
    const expiresAt = Date.parse(sub.planExpiresAt || "");
    return expiresAt && expiresAt > now && expiresAt - now < sevenDays;
  });

  countEl.textContent = expiringSoon.length;

  if (expiringSoon.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <div class="icon">✅</div>
        <p>No subscriptions expiring in the next 7 days.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = expiringSoon
    .map((sub) => {
      const expiresAt = Date.parse(sub.planExpiresAt || "");
      const daysLeft = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));

      return `
        <div class="admin-subscription-item">
          <span class="email">${escapeHtml(sub.email || "")}</span>
          <span class="plan-badge ${sub.billingCycle || "monthly"}">${sub.billingCycle || "monthly"}</span>
          <span class="expiry expiring-soon">${daysLeft} day${daysLeft !== 1 ? "s" : ""} left</span>
          <span class="status-badge expiring">Expiring</span>
        </div>
      `;
    })
    .join("");
}

/**
 * Render payment history list
 */
function renderPaymentHistory() {
  const container = document.getElementById("paymentHistoryList");
  const countEl = document.getElementById("paymentHistoryCount");
  if (!container) return;

  countEl.textContent = cachedPayments.length;

  if (cachedPayments.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <div class="icon">💳</div>
        <p>No payment history found.</p>
      </div>
    `;
    return;
  }

  // Sort by date, newest first
  const sorted = [...cachedPayments].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  container.innerHTML = sorted
    .slice(0, 50) // Show last 50 payments
    .map((payment) => {
      const date = payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString()
        : "Unknown";
      const statusClass = payment.status === "successful" ? "active" : "expired";

      return `
        <div class="admin-payment-item">
          <span class="email">${escapeHtml(payment.email || "")}</span>
          <span class="amount">₦${(payment.amount || 0).toLocaleString()}</span>
          <span class="tx-id">${payment.flwTransactionId || payment.paymentId || "N/A"}</span>
          <span class="date">${date}</span>
          <span class="status-badge ${statusClass}">${payment.status || "unknown"}</span>
        </div>
      `;
    })
    .join("");
}

/**
 * Render revenue metrics
 */
function renderRevenueMetrics() {
  // Total revenue
  const totalRevenue = cachedPayments
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Monthly revenue (last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyRevenue = cachedPayments
    .filter(
      (p) =>
        p.status === "successful" &&
        new Date(p.createdAt || 0).getTime() > thirtyDaysAgo
    )
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Active subscribers
  const activeSubs = cachedSubscriptions.filter((sub) => {
    const expiresAt = Date.parse(sub.planExpiresAt || "");
    return !expiresAt || expiresAt > Date.now();
  });

  // Conversion rate
  const totalUsers = cachedSubscriptions.length || 1;
  const conversionRate = ((activeSubs.length / totalUsers) * 100).toFixed(1);

  // Update DOM
  document.getElementById("totalRevenue").textContent = `₦${totalRevenue.toLocaleString()}`;
  document.getElementById("monthlyRevenue").textContent = `₦${monthlyRevenue.toLocaleString()}`;
  document.getElementById("activeSubscriberCount").textContent = activeSubs.length;
  document.getElementById("conversionRate").textContent = `${conversionRate}%`;

  // Revenue by plan
  renderRevenueByPlan();
}

/**
 * Render revenue breakdown by plan
 */
function renderRevenueByPlan() {
  const container = document.getElementById("revenueByPlanList");
  if (!container) return;

  const plans = ["monthly", "quarterly", "bi-annual", "annual"];
  const revenueByPlan = {};

  plans.forEach((plan) => {
    revenueByPlan[plan] = cachedPayments
      .filter((p) => p.status === "successful" && p.billingCycle === plan)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  });

  container.innerHTML = plans
    .map((plan) => {
      const revenue = revenueByPlan[plan] || 0;
      return `
        <div class="admin-subscription-item">
          <span class="email" style="text-transform: capitalize;">${plan}</span>
          <span class="amount">₦${revenue.toLocaleString()}</span>
        </div>
      `;
    })
    .join("");
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Set up refresh handlers for each tab
 */
export function setupRefreshHandlers() {
  document.getElementById("refreshActiveSubBtn")?.addEventListener("click", async () => {
    await loadSubscriptions();
    renderActiveSubscriptions();
  });

  document.getElementById("refreshPaymentHistoryBtn")?.addEventListener("click", async () => {
    await loadPayments();
    renderPaymentHistory();
  });

  // "See all transactions" button on the dashboard navigates to Payments section
  document.getElementById("refreshRecentPaymentsBtn")?.addEventListener("click", () => {
    const navItem = document.querySelector('[data-admin-nav="payments"]');
    if (navItem) navItem.click();
  });
}
