/**
 * Subscription Management Module
 * Handles the admin panel's payment section with 2 tabs:
 * - Subscriptions: Summary stats + filterable subscription list
 * - Transactions: Summary stats + unified transaction table
 */

import { getRuntimeConfig } from "./authRuntime.js";

let cachedSubscriptions = [];
let cachedPayments = [];
let currentTab = "subscriptions";

/**
 * Set user data from the main admin panel and enrich with payment expiry dates.
 * Expiry dates live in Firestore payment receipts, not in auth_users.
 */
export function setSubscriptionUserData(users) {
  if (!Array.isArray(users)) return;
  
  // Build a map of email -> latest payment expiry from cached payments
  const paymentExpiryMap = {};
  const paymentCycleMap = {};
  cachedPayments.forEach((p) => {
    const email = (p.email || p.flwCustomerEmail || '').toLowerCase();
    if (!email) return;
    if (!paymentExpiryMap[email] || (p.expiresAt && p.expiresAt > paymentExpiryMap[email])) {
      paymentExpiryMap[email] = p.expiresAt || '';
    }
    if (p.billingCycle) paymentCycleMap[email] = p.billingCycle;
  });
  
  cachedSubscriptions = users
    .filter((u) => u.plan === "premium")
    .map((u) => ({
      ...u,
      planExpiresAt: paymentExpiryMap[u.email] || '',
      billingCycle: paymentCycleMap[u.email] || u.billingCycle || '',
    }));
  
  // Re-render if already initialized
  if (document.getElementById("activeSubList")) {
    renderSubscriptionsTab();
    renderTransactionsTab();
  }
}

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
  enrichSubscriptionsWithPaymentData();
  renderSubscriptionsTab();
  renderTransactionsTab();
}

/**
 * Enrich cached subscriptions with expiry dates from cached payments
 */
function enrichSubscriptionsWithPaymentData() {
  const paymentExpiryMap = {};
  const paymentCycleMap = {};
  cachedPayments.forEach((p) => {
    const email = (p.email || p.flwCustomerEmail || '').toLowerCase();
    if (!email) return;
    if (!paymentExpiryMap[email] || (p.expiresAt && p.expiresAt > paymentExpiryMap[email])) {
      paymentExpiryMap[email] = p.expiresAt || '';
    }
    if (p.billingCycle) paymentCycleMap[email] = p.billingCycle;
  });
  cachedSubscriptions = cachedSubscriptions.map((u) => ({
    ...u,
    planExpiresAt: paymentExpiryMap[u.email] || u.planExpiresAt || '',
    billingCycle: paymentCycleMap[u.email] || u.billingCycle || '',
  }));
}

/**
 * Load tab-specific data when switching tabs
 */
async function loadTabData(tabId) {
  switch (tabId) {
    case "subscriptions":
      renderSubscriptionsTab();
      break;
    case "transactions":
      renderTransactionsTab();
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
 * Get subscription status for a subscription
 */
function getSubscriptionStatus(sub) {
  const expiresAt = Date.parse(sub.planExpiresAt || "");
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  if (!expiresAt) return "active"; // No expiry = active (admin override)
  if (expiresAt < now) return "expired";
  if (expiresAt - now < sevenDays) return "expiring";
  return "active";
}

/**
 * Render the entire Subscriptions tab (summary stats + list)
 */
function renderSubscriptionsTab() {
  // Calculate summary stats
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  const activeSubs = cachedSubscriptions.filter((sub) => {
    const status = getSubscriptionStatus(sub);
    return status === "active";
  });
  
  const expiringSoon = cachedSubscriptions.filter((sub) => {
    return getSubscriptionStatus(sub) === "expiring";
  });
  
  const totalRevenue = cachedPayments
    .filter((p) => p.status === "successful")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalUsers = cachedSubscriptions.length || 1;
  const conversionRate = ((activeSubs.length / totalUsers) * 100).toFixed(1);

  // Update summary stats
  const totalActiveEl = document.getElementById("totalActiveSubs");
  const expiringSoonEl = document.getElementById("expiringSoonCount");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const conversionRateEl = document.getElementById("conversionRate");
  
  if (totalActiveEl) totalActiveEl.textContent = activeSubs.length;
  if (expiringSoonEl) expiringSoonEl.textContent = expiringSoon.length;
  if (totalRevenueEl) totalRevenueEl.textContent = `₦${totalRevenue.toLocaleString()}`;
  if (conversionRateEl) conversionRateEl.textContent = `${conversionRate}%`;

  // Render the subscription list
  renderSubscriptionList();
}

/**
 * Render the subscription list with filters
 */
function renderSubscriptionList() {
  const container = document.getElementById("activeSubList");
  const countEl = document.getElementById("activeSubCount");
  if (!container) return;

  // Get filter values
  const statusFilter = document.getElementById("activeSubFilter")?.value || "all";
  const planFilter = document.getElementById("activeSubPlanFilter")?.value || "all";
  const searchTerm = (document.getElementById("activeSubSearch")?.value || "").toLowerCase();

  // Apply filters
  let filtered = cachedSubscriptions.map((sub) => ({
    ...sub,
    _status: getSubscriptionStatus(sub),
  }));

  if (statusFilter !== "all") {
    filtered = filtered.filter((sub) => sub._status === statusFilter);
  }
  if (planFilter !== "all") {
    filtered = filtered.filter((sub) => (sub.billingCycle || "monthly") === planFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter((sub) => 
      (sub.email || "").toLowerCase().includes(searchTerm)
    );
  }

  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <div class="icon">📋</div>
        <p>No subscriptions found matching your filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((sub) => {
      const source = sub.planSource || sub.plan_source || '';
      const sourceLabel = source === 'override' ? ' (Admin)' : source === 'payment' ? ' (Paid)' : '';
      let expiryText;
      const expiresAt = Date.parse(sub.planExpiresAt || "");
      
      if (expiresAt) {
        const daysLeft = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysLeft < 0) {
          expiryText = 'Expired';
        } else if (daysLeft === 0) {
          expiryText = 'Expires today';
        } else if (daysLeft <= 7) {
          expiryText = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
        } else {
          expiryText = new Date(expiresAt).toLocaleDateString();
        }
      } else if (source === 'override') {
        expiryText = 'No expiry (Admin)';
      } else {
        expiryText = 'No expiry';
      }
      
      const cycleLabel = sub.billingCycle || 'premium';
      const statusClass = sub._status === 'expired' ? 'expired' : 
                          sub._status === 'expiring' ? 'expiring' : 'active';
      const statusLabel = sub._status === 'expired' ? 'Expired' : 
                          sub._status === 'expiring' ? 'Expiring' : 'Active';

      return `
        <div class="admin-subscription-item">
          <span class="email">${escapeHtml(sub.email || "")}${sourceLabel}</span>
          <span class="plan-badge ${cycleLabel}">${cycleLabel}</span>
          <span class="expiry ${statusClass === 'expiring' ? 'expiring-soon' : ''}">${expiryText}</span>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
      `;
    })
    .join("");
}

/**
 * Render the entire Transactions tab (summary stats + table)
 */
function renderTransactionsTab() {
  // Calculate summary stats
  const totalTx = cachedPayments.length;
  const successfulTx = cachedPayments.filter((p) => p.status === "successful").length;
  const pendingTx = cachedPayments.filter((p) => p.status === "pending").length;
  const failedTx = cachedPayments.filter((p) => p.status === "failed").length;

  // Update summary stats
  const totalTxEl = document.getElementById("totalTransactions");
  const successfulTxEl = document.getElementById("successfulTxCount");
  const pendingTxEl = document.getElementById("pendingTxCount");
  const failedTxEl = document.getElementById("failedTxCount");
  
  if (totalTxEl) totalTxEl.textContent = totalTx;
  if (successfulTxEl) successfulTxEl.textContent = successfulTx;
  if (pendingTxEl) pendingTxEl.textContent = pendingTx;
  if (failedTxEl) failedTxEl.textContent = failedTx;

  // Render the transactions table
  renderTransactionsTable();
}

/**
 * Render the transactions table with filters
 */
function renderTransactionsTable() {
  const container = document.getElementById("paymentHistoryList");
  const countEl = document.getElementById("paymentHistoryCount");
  if (!container) return;

  // Get filter values
  const statusFilter = document.getElementById("paymentHistoryStatus")?.value || "all";
  const searchTerm = (document.getElementById("paymentHistorySearch")?.value || "").toLowerCase();

  // Apply filters
  let filtered = [...cachedPayments];

  if (statusFilter !== "all") {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }
  if (searchTerm) {
    filtered = filtered.filter((p) => 
      (p.email || "").toLowerCase().includes(searchTerm) ||
      (p.flwTransactionId || "").toLowerCase().includes(searchTerm) ||
      (p.paymentId || "").toLowerCase().includes(searchTerm)
    );
  }

  // Sort by date, newest first
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr class="admin-transactions-empty">
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--ink-600);">No transactions found</td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((payment) => {
      const date = payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString()
        : "Unknown";
      const statusClass = payment.status === "successful" ? "active" : 
                          payment.status === "pending" ? "warning" : "expired";

      return `
        <tr>
          <td>${escapeHtml(payment.email || "")}</td>
          <td>₦${(payment.amount || 0).toLocaleString()}</td>
          <td>${escapeHtml(payment.billingCycle || "N/A")}</td>
          <td><span class="status-badge ${statusClass}">${payment.status || "unknown"}</span></td>
          <td class="tx-id">${payment.flwTransactionId || payment.paymentId || "N/A"}</td>
          <td>${date}</td>
        </tr>
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
  // Subscriptions tab refresh
  document.getElementById("refreshActiveSubBtn")?.addEventListener("click", async () => {
    await loadSubscriptions();
    enrichSubscriptionsWithPaymentData();
    renderSubscriptionsTab();
  });

  // Transactions tab refresh
  document.getElementById("refreshPaymentHistoryBtn")?.addEventListener("click", async () => {
    await loadPayments();
    enrichSubscriptionsWithPaymentData();
    renderTransactionsTab();
  });

  // Filter change handlers for subscriptions
  document.getElementById("activeSubFilter")?.addEventListener("change", () => {
    renderSubscriptionList();
  });
  document.getElementById("activeSubPlanFilter")?.addEventListener("change", () => {
    renderSubscriptionList();
  });
  document.getElementById("activeSubSearch")?.addEventListener("input", () => {
    renderSubscriptionList();
  });

  // Filter change handlers for transactions
  document.getElementById("paymentHistoryStatus")?.addEventListener("change", () => {
    renderTransactionsTable();
  });
  document.getElementById("paymentHistorySearch")?.addEventListener("input", () => {
    renderTransactionsTable();
  });
}
