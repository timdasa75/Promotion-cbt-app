// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showError, showScreen, showWarning } from "./ui.js";
import {
  loadQuestions,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";
import { debugLog } from "./logger.js";
import {
  clearLocalPlanOverride,
  getAccessibleTopics,
  getAdminUserDirectory,
  getAuthSummaryLabel,
  getAuthProviderLabel,
  getCurrentUser,
  getLocalPlanOverrides,
  getProgressStorageKeyForCurrentUser,
  isCurrentUserAdmin,
  loginUser,
  logoutUser,
  requestPasswordReset,
  registerUser,
  setLocalPlanOverride,
} from "./auth.js";

let currentTopic = null;
let cachedTopics = [];
let allTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;
let adminDirectoryUsers = [];
const UPGRADE_REQUESTS_STORAGE_KEY = "cbt_upgrade_requests_v1";

async function init() {
  try {
    debugLog("Initializing app...");
    const topicsData = await loadData();
    allTopics = Array.isArray(topicsData) ? topicsData : [];
    cachedTopics = allTopics;
    debugLog("Loaded topics:", topicsData);
    if (!topicsData || topicsData.length === 0) {
      console.error("No topics loaded");
      showError("No topics available. Please check data files.");
      return;
    }
    await displayTopics(cachedTopics, handleTopicSelect);
    refreshDashboardInsights();
    debugLog("Displayed topics");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to load quiz data. Please try again later.");
  }
}

function classifyTopic(topic) {
  const id = topic?.id || "";
  const documentIds = new Set([
    "psr",
    "financial_regulations",
    "procurement_act",
    "constitutional_law",
  ]);
  const recentIds = new Set(["general_current_affairs"]);
  if (recentIds.has(id)) return "recent";
  if (id === "competency_framework") return "competency";
  if (documentIds.has(id)) return "document";
  return "competency";
}

function applyTopicFilter(filter) {
  const topicCards = Array.from(document.querySelectorAll("#topicList .topic-card"));
  if (!topicCards.length) return;

  const chipMap = {
    all: document.getElementById("filterAllBtn"),
    document: document.getElementById("filterDocumentBtn"),
    competency: document.getElementById("filterCompetencyBtn"),
    recent: document.getElementById("filterRecentBtn"),
  };

  Object.entries(chipMap).forEach(([key, chip]) => {
    if (!chip) return;
    chip.classList.toggle("active", key === filter);
  });

  topicCards.forEach((card, index) => {
    const topic = cachedTopics[index];
    const topicType = classifyTopic(topic);
    const shouldShow = filter === "all" || topicType === filter;
    card.classList.toggle("hidden", !shouldShow);
  });
}

function getLatestAttemptTopic() {
  try {
    const raw = localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts) || !parsed.attempts.length) {
      return null;
    }
    const latestAttempt = parsed.attempts[parsed.attempts.length - 1];
    return latestAttempt?.topicId || null;
  } catch (error) {
    return null;
  }
}

function readProgressSummary() {
  try {
    const raw = localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch (error) {
    return { attempts: [] };
  }
}

function readUpgradeRequests() {
  try {
    const raw = localStorage.getItem(UPGRADE_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeUpgradeRequests(requests) {
  localStorage.setItem(UPGRADE_REQUESTS_STORAGE_KEY, JSON.stringify(requests || []));
}

function getTopicNameById(topicId) {
  const topic = allTopics.find((entry) => entry.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

function calculateStreakDays(attempts) {
  if (!attempts.length) return 0;
  const uniqueDays = new Set(
    attempts
      .map((attempt) => (attempt.createdAt || "").slice(0, 10))
      .filter(Boolean),
  );

  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayKey = day.toISOString().slice(0, 10);
    if (uniqueDays.has(dayKey)) {
      streak += 1;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

function getWeakestTopicId(attempts) {
  if (!attempts.length) return null;
  const scoreByTopic = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.topicId) return;
    const existing = scoreByTopic.get(attempt.topicId) || [];
    existing.push(Number(attempt.scorePercentage || 0));
    scoreByTopic.set(attempt.topicId, existing);
  });
  if (!scoreByTopic.size) return null;

  let weakest = null;
  scoreByTopic.forEach((scores, topicId) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (!weakest || avg < weakest.avg) {
      weakest = { topicId, avg };
    }
  });
  return weakest?.topicId || null;
}

function refreshDashboardInsights() {
  const currentUser = getCurrentUser();
  const summary = readProgressSummary();
  const attempts = summary.attempts || [];

  const totalAttempts = attempts.length;
  const average =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + Number(attempt.scorePercentage || 0),
            0,
          ) / totalAttempts,
        )
      : null;
  const streakDays = calculateStreakDays(attempts);
  const latestAttempt = totalAttempts ? attempts[totalAttempts - 1] : null;

  lastSessionTopicId = latestAttempt?.topicId || null;
  recommendedTopicId = getWeakestTopicId(attempts) || cachedTopics[0]?.id || "psr";

  const totalAttemptsStat = document.getElementById("totalAttemptsStat");
  const averageScoreStat = document.getElementById("averageScoreStat");
  const streakStat = document.getElementById("streakStat");
  const streakStatusBadge = document.getElementById("streakStatusBadge");
  const continueTopicTitle = document.getElementById("continueTopicTitle");
  const continueTopicMeta = document.getElementById("continueTopicMeta");
  const recommendedTopicTitle = document.getElementById("recommendedTopicTitle");
  const recommendedTopicMeta = document.getElementById("recommendedTopicMeta");
  const splashResumeBtn = document.getElementById("splashResumeBtn");

  if (totalAttemptsStat) totalAttemptsStat.textContent = String(totalAttempts);
  if (averageScoreStat) {
    averageScoreStat.textContent = average === null ? "-" : `${average}%`;
  }
  if (streakStat) {
    streakStat.textContent = `${streakDays} day${streakDays === 1 ? "" : "s"}`;
  }
  if (streakStatusBadge) {
    streakStatusBadge.textContent =
      streakDays >= 5 ? "On Track" : streakDays > 0 ? "Building momentum" : "Start today";
  }

  if (continueTopicTitle && continueTopicMeta) {
    if (latestAttempt?.topicId) {
      continueTopicTitle.textContent = getTopicNameById(latestAttempt.topicId);
      const modeLabel = latestAttempt.mode
        ? `${latestAttempt.mode.charAt(0).toUpperCase()}${latestAttempt.mode.slice(1)}`
        : "Session";
      continueTopicMeta.textContent = `${modeLabel} mode, last score: ${Math.round(
        Number(latestAttempt.scorePercentage || 0),
      )}%`;
    } else {
      continueTopicTitle.textContent = "No session yet";
      continueTopicMeta.textContent = "Start a topic to track session continuity.";
    }
  }

  if (recommendedTopicTitle && recommendedTopicMeta) {
    recommendedTopicTitle.textContent = getTopicNameById(recommendedTopicId);
    recommendedTopicMeta.textContent =
      totalAttempts > 0
        ? "Based on your weakest average score area."
        : "Recommendation will adapt after your first attempts.";
  }

  if (splashResumeBtn) {
    const canResume = Boolean(currentUser && latestAttempt?.topicId);
    splashResumeBtn.classList.toggle("hidden", !canResume);
  }
}

async function resumeLastSession() {
  if (!cachedTopics.length) {
    showError("Topics are still loading. Please try again.");
    return;
  }

  const lastTopicId = lastSessionTopicId || getLatestAttemptTopic();
  const topic = cachedTopics.find((t) => t.id === lastTopicId) || cachedTopics[0];

  if (!lastTopicId) {
    showWarning("No previous session found yet. Starting with your first topic.");
  }

  await handleTopicSelect(topic);
}

async function startRecommendation() {
  if (!cachedTopics.length) {
    showError("Topics are still loading. Please try again.");
    return;
  }

  const preferredIds = [recommendedTopicId, "financial_regulations", "psr", "procurement_act"];
  const topic = cachedTopics.find((t) => preferredIds.includes(t.id)) || cachedTopics[0];

  await handleTopicSelect(topic);
}

function initializeDashboardActions() {
  const startLearningBtn = document.getElementById("startLearningBtn");
  const splashResumeBtn = document.getElementById("splashResumeBtn");
  const resumeBtn = document.getElementById("resumeSessionBtn");
  const resumeCard = document.getElementById("resumeSessionCard");
  const recommendationBtn = document.getElementById("startRecommendationBtn");
  const recommendationCard = document.getElementById("recommendedTopicCard");
  const filterAllBtn = document.getElementById("filterAllBtn");
  const filterDocumentBtn = document.getElementById("filterDocumentBtn");
  const filterCompetencyBtn = document.getElementById("filterCompetencyBtn");
  const filterRecentBtn = document.getElementById("filterRecentBtn");
  const openAdminBtn = document.getElementById("openAdminBtn");

  if (startLearningBtn) {
    startLearningBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      showScreen("topicSelectionScreen");
    });
  }

  if (splashResumeBtn) {
    splashResumeBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      resumeLastSession();
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      resumeLastSession();
    });
  }
  if (resumeCard) {
    resumeCard.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      resumeLastSession();
    });
  }

  if (recommendationBtn) {
    recommendationBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      startRecommendation();
    });
  }
  if (recommendationCard) {
    recommendationCard.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      startRecommendation();
    });
  }

  if (filterAllBtn) {
    filterAllBtn.addEventListener("click", () => {
      applyTopicFilter("all");
    });
  }

  if (filterDocumentBtn) {
    filterDocumentBtn.addEventListener("click", () => {
      applyTopicFilter("document");
    });
  }

  if (filterCompetencyBtn) {
    filterCompetencyBtn.addEventListener("click", () => {
      applyTopicFilter("competency");
    });
  }

  if (filterRecentBtn) {
    filterRecentBtn.addEventListener("click", () => {
      applyTopicFilter("recent");
    });
  }

  if (openAdminBtn) {
    openAdminBtn.addEventListener("click", async () => {
      if (!isCurrentUserAdmin()) {
        showWarning("Admin access is restricted.");
        return;
      }
      renderAdminRequests();
      renderAdminOverrides();
      await refreshAdminUserDirectory();
      showScreen("adminScreen");
    });
  }
}

function isTopicUnlocked(topic) {
  const unlocked = getAccessibleTopics(allTopics);
  return unlocked.some((entry) => entry.id === topic?.id);
}

async function handleTopicSelect(topic) {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }
  if (!isTopicUnlocked(topic)) {
    showWarning("This topic is locked on Free plan. Upgrade to access all topics.");
    return;
  }
  currentTopic = topic;
  setCurrentTopic(topic);
  await selectTopic(topic);

  const practiceModeCard = document.getElementById("practiceModeCard");
  const examModeCard = document.getElementById("examModeCard");
  const reviewModeCard = document.getElementById("reviewModeCard");

  if (practiceModeCard) practiceModeCard.onclick = () => startQuiz("practice");
  if (examModeCard) examModeCard.onclick = () => startQuiz("exam");
  if (reviewModeCard) reviewModeCard.onclick = () => startQuiz("review");

  const quizTitle = document.getElementById("modeQuizTitle");
  const quizDescription = document.getElementById("modeQuizDescription");
  const selectedTopicName = document.getElementById("selectedTopicName");
  if (quizTitle) quizTitle.textContent = topic.name;
  if (quizDescription) quizDescription.textContent = topic.description;
  if (selectedTopicName) selectedTopicName.textContent = topic.name;
}

function startQuiz(mode) {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }
  if (!currentTopic) {
    showError("No topic selected.");
    return;
  }
  setCurrentMode(mode);
  loadQuestions();
}

function setAuthMessage(message, type = "error") {
  const authMessage = document.getElementById("authMessage");
  if (!authMessage) return;
  if (!message) {
    authMessage.textContent = "";
    authMessage.className = "auth-message hidden";
    return;
  }
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
}

function setActiveAuthTab(mode) {
  const isRegister = mode === "register";
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");

  if (loginForm) loginForm.classList.toggle("hidden", isRegister);
  if (registerForm) registerForm.classList.toggle("hidden", !isRegister);
  if (loginTab) loginTab.classList.toggle("active", !isRegister);
  if (registerTab) registerTab.classList.toggle("active", isRegister);
  setAuthMessage("");
}

function openAuthModal(mode = "login") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  setActiveAuthTab(mode);
  modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("hidden");
  setAuthMessage("");
}

async function refreshAccessibleTopics() {
  cachedTopics = allTopics;
  await displayTopics(cachedTopics, handleTopicSelect);
}

function updateAuthUI() {
  const user = getCurrentUser();
  const authActionLabel = document.getElementById("authActionLabel");
  const authModeHint = document.getElementById("authModeHint");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileSubtitle = document.getElementById("profileSubtitle");
  const profileAvatar = document.getElementById("profileAvatar");
  const accountMenuAdminBtn = document.getElementById("accountMenuAdminBtn");
  const openAdminBtn = document.getElementById("openAdminBtn");
  const isAdmin = isCurrentUserAdmin();
  if (authActionLabel) {
    authActionLabel.textContent = user ? getAuthSummaryLabel() : "Login";
  }
  if (authModeHint) {
    const provider = getAuthProviderLabel();
    authModeHint.textContent =
      provider === "Cloud"
        ? "Auth mode: Cloud (multi-device)"
        : "Auth mode: Local (single-device)";
  }
  if (profileDisplayName) {
    profileDisplayName.textContent = user?.name || "Guest User";
  }
  if (profileSubtitle) {
    profileSubtitle.textContent = user?.email || "Login to manage your profile";
  }
  if (profileAvatar) {
    const seed = user?.name || user?.email || "GU";
    const initials = seed
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
    profileAvatar.textContent = initials || "GU";
  }
  if (accountMenuAdminBtn) {
    accountMenuAdminBtn.classList.toggle("hidden", !isAdmin);
  }
  if (openAdminBtn) {
    openAdminBtn.classList.toggle("hidden", !isAdmin);
  }
}

function renderAdminOverrides() {
  const container = document.getElementById("adminOverrideList");
  if (!container) return;
  container.innerHTML = "";
  const overrides = getLocalPlanOverrides();
  const entries = Object.entries(overrides);
  if (!entries.length) {
    container.innerHTML = '<div class="admin-request-item"><p class="meta">No local overrides yet.</p></div>';
    return;
  }

  entries.forEach(([email, plan]) => {
    const card = document.createElement("div");
    card.className = "admin-request-item";
    card.innerHTML = `
      <div><strong>${email}</strong></div>
      <div class="meta">Current override: <span class="admin-badge ${plan === "premium" ? "approved" : "pending"}">${plan}</span></div>
      <div class="button-row">
        <button class="btn btn-ghost" data-clear-email="${email}" type="button">Clear Override</button>
      </div>
    `;
    const clearBtn = card.querySelector("[data-clear-email]");
    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        clearLocalPlanOverride(email);
        updateAuthUI();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        renderAdminOverrides();
      });
    }
    container.appendChild(card);
  });
}

function renderAdminRequests() {
  const container = document.getElementById("adminRequestList");
  if (!container) return;
  const requests = readUpgradeRequests();
  container.innerHTML = "";
  if (!requests.length) {
    container.innerHTML = '<div class="admin-request-item"><p class="meta">No upgrade requests submitted yet.</p></div>';
    return;
  }

  requests
    .slice()
    .reverse()
    .forEach((request) => {
      const card = document.createElement("div");
      card.className = "admin-request-item";
      const statusClass =
        request.status === "approved"
          ? "approved"
          : request.status === "rejected"
            ? "rejected"
            : "pending";
      card.innerHTML = `
        <div class="button-row">
          <strong>${request.email}</strong>
          <span class="admin-badge ${statusClass}">${request.status || "pending"}</span>
        </div>
        <div class="meta">Submitted: ${new Date(request.createdAt).toLocaleString()}</div>
        <div class="meta">Ref: ${request.reference || "-"}</div>
        <div class="meta">Amount: ${request.amount || "-"}</div>
        <div class="meta">Note: ${request.note || "-"}</div>
        <div class="button-row">
          <button class="btn btn-secondary" data-approve-id="${request.id}" type="button">Approve</button>
          <button class="btn btn-ghost" data-reject-id="${request.id}" type="button">Reject</button>
        </div>
      `;

      const approveBtn = card.querySelector("[data-approve-id]");
      const rejectBtn = card.querySelector("[data-reject-id]");
      if (approveBtn) {
        approveBtn.addEventListener("click", async () => {
          const next = readUpgradeRequests().map((entry) =>
            entry.id === request.id
              ? { ...entry, status: "approved", reviewedAt: new Date().toISOString() }
              : entry,
          );
          writeUpgradeRequests(next);
          setLocalPlanOverride(request.email, "premium");
          updateAuthUI();
          refreshDashboardInsights();
          await refreshAccessibleTopics();
          renderAdminRequests();
          renderAdminOverrides();
        });
      }
      if (rejectBtn) {
        rejectBtn.addEventListener("click", () => {
          const next = readUpgradeRequests().map((entry) =>
            entry.id === request.id
              ? { ...entry, status: "rejected", reviewedAt: new Date().toISOString() }
              : entry,
          );
          writeUpgradeRequests(next);
          renderAdminRequests();
        });
      }
      container.appendChild(card);
    });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function renderAdminUserDirectory() {
  const container = document.getElementById("adminUserList");
  const searchInput = document.getElementById("adminUserSearch");
  const statusFilter = document.getElementById("adminStatusFilter");
  const sourceLabel = document.getElementById("adminUserSource");
  if (!container) return;

  const query = String(searchInput?.value || "").trim().toLowerCase();
  const status = String(statusFilter?.value || "all").toLowerCase();
  const filtered = adminDirectoryUsers.filter((entry) => {
    const emailMatch = !query || String(entry.email || "").toLowerCase().includes(query);
    const statusMatch = status === "all" || entry.status === status;
    return emailMatch && statusMatch;
  });

  container.innerHTML = "";
  if (!filtered.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No users match the current filter.</p></div>';
    if (sourceLabel && !adminDirectoryUsers.length) {
      sourceLabel.textContent = "Source: unavailable";
    }
    return;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "admin-table-wrap";

  const table = document.createElement("table");
  table.className = "admin-user-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Email</th>
        <th>Role</th>
        <th>Plan</th>
        <th>Status</th>
        <th>Created</th>
        <th>Last Seen</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  filtered.forEach((entry) => {
    const row = document.createElement("tr");
    const roleClass = entry.role === "admin" ? "approved" : "pending";
    const planClass = entry.plan === "premium" ? "approved" : "pending";
    const statusClass = entry.status === "suspended" ? "rejected" : "approved";
    row.innerHTML = `
      <td class="email-cell">${entry.email}</td>
      <td><span class="admin-badge ${roleClass}">${entry.role}</span></td>
      <td><span class="admin-badge ${planClass}">${entry.plan}</span></td>
      <td><span class="admin-badge ${statusClass}">${entry.status}</span></td>
      <td>${formatDateTime(entry.createdAt)}</td>
      <td>${formatDateTime(entry.lastSeenAt)}</td>
    `;
    tbody.appendChild(row);
  });

  tableWrap.appendChild(table);
  container.appendChild(tableWrap);
}

async function refreshAdminUserDirectory() {
  if (!isCurrentUserAdmin()) return;
  const notice = document.getElementById("adminUserDirectoryNotice");
  const sourceLabel = document.getElementById("adminUserSource");
  try {
    const result = await getAdminUserDirectory();
    adminDirectoryUsers = Array.isArray(result.users) ? result.users : [];
    renderAdminUserDirectory();
    if (sourceLabel) {
      sourceLabel.textContent =
        result.source === "cloud" ? "Source: Cloud profiles" : "Source: Local fallback";
    }
    if (notice) {
      if (result.warning) {
        notice.textContent = result.warning;
        notice.classList.remove("hidden");
      } else {
        notice.textContent = "";
        notice.classList.add("hidden");
      }
    }
  } catch (error) {
    adminDirectoryUsers = [];
    renderAdminUserDirectory();
    if (sourceLabel) {
      sourceLabel.textContent = "Source: unavailable";
    }
    if (notice) {
      notice.textContent = error.message || "Unable to load admin user directory.";
      notice.classList.remove("hidden");
    }
  }
}

function closeAccountMenu() {
  const accountMenu = document.getElementById("accountMenu");
  if (accountMenu) accountMenu.classList.add("hidden");
}

function toggleAccountMenu() {
  const accountMenu = document.getElementById("accountMenu");
  if (!accountMenu) return;
  accountMenu.classList.toggle("hidden");
}

async function performLogout() {
  logoutUser();
  closeAccountMenu();
  currentTopic = null;
  updateAuthUI();
  refreshDashboardInsights();
  await refreshAccessibleTopics();
  showScreen("splashScreen");
}

function initializeAuthUI() {
  const authActionBtn = document.getElementById("authActionBtn");
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authModal = document.getElementById("authModal");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const accountMenu = document.getElementById("accountMenu");
  const accountMenuAdminBtn = document.getElementById("accountMenuAdminBtn");
  const accountMenuProfileBtn = document.getElementById("accountMenuProfileBtn");
  const accountMenuLogoutBtn = document.getElementById("accountMenuLogoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  const submitUpgradeEvidenceBtn = document.getElementById("submitUpgradeEvidenceBtn");
  const applyPlanOverrideBtn = document.getElementById("applyPlanOverrideBtn");
  const refreshAdminUsersBtn = document.getElementById("refreshAdminUsersBtn");
  const adminUserSearch = document.getElementById("adminUserSearch");
  const adminStatusFilter = document.getElementById("adminStatusFilter");

  if (authActionBtn) {
    authActionBtn.addEventListener("click", async () => {
      if (getCurrentUser()) {
        toggleAccountMenu();
      } else {
        openAuthModal("login");
      }
    });
  }

  if (accountMenu) {
    document.addEventListener("click", (event) => {
      if (
        !accountMenu.classList.contains("hidden") &&
        !accountMenu.contains(event.target) &&
        !authActionBtn?.contains(event.target)
      ) {
        closeAccountMenu();
      }
    });
  }

  if (accountMenuProfileBtn) {
    accountMenuProfileBtn.addEventListener("click", () => {
      closeAccountMenu();
      showScreen("profileScreen");
    });
  }

  if (accountMenuAdminBtn) {
    accountMenuAdminBtn.addEventListener("click", async () => {
      closeAccountMenu();
      if (!isCurrentUserAdmin()) {
        showWarning("Admin access is restricted.");
        return;
      }
      renderAdminRequests();
      renderAdminOverrides();
      await refreshAdminUserDirectory();
      showScreen("adminScreen");
    });
  }

  if (accountMenuLogoutBtn) {
    accountMenuLogoutBtn.addEventListener("click", async () => {
      await performLogout();
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", closeAuthModal);
  }

  if (authModal) {
    authModal.addEventListener("click", (event) => {
      if (event.target === authModal) closeAuthModal();
    });
  }

  if (loginTab) loginTab.addEventListener("click", () => setActiveAuthTab("login"));
  if (registerTab) registerTab.addEventListener("click", () => setActiveAuthTab("register"));

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      try {
        await loginUser({ email, password });
        updateAuthUI();
        closeAccountMenu();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        closeAuthModal();
        showScreen("topicSelectionScreen");
      } catch (error) {
        setAuthMessage(error.message || "Login failed.");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("registerName")?.value || "";
      const email = document.getElementById("registerEmail")?.value || "";
      const password = document.getElementById("registerPassword")?.value || "";
      const confirmPassword =
        document.getElementById("registerConfirmPassword")?.value || "";
      if (password !== confirmPassword) {
        setAuthMessage("Passwords do not match.");
        return;
      }
      try {
        await registerUser({ name, email, password });
        updateAuthUI();
        closeAccountMenu();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        setAuthMessage("Account created successfully.", "success");
        setTimeout(() => {
          closeAuthModal();
          showScreen("topicSelectionScreen");
        }, 450);
      } catch (error) {
        setAuthMessage(error.message || "Registration failed.");
      }
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail")?.value || "";
      if (!email) {
        setAuthMessage("Enter your email first, then click Forgot password.");
        return;
      }
      try {
        await requestPasswordReset(email, window.location.href);
        setAuthMessage("Password reset link sent. Check your email inbox.", "success");
      } catch (error) {
        setAuthMessage(error.message || "Unable to send password reset link.");
      }
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      const email = user?.email || "";
      if (!email) {
        showWarning("Login is required to change password.");
        return;
      }
      try {
        await requestPasswordReset(email, window.location.href);
        showWarning("Password reset link sent to your registered email.");
      } catch (error) {
        showError(error.message || "Unable to send password reset link.");
      }
    });
  }

  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", async () => {
      await performLogout();
    });
  }

  if (submitUpgradeEvidenceBtn) {
    submitUpgradeEvidenceBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user?.email) {
        showWarning("Login is required before submitting upgrade evidence.");
        return;
      }
      const reference = document.getElementById("upgradePaymentReference")?.value || "";
      const amount = document.getElementById("upgradeAmountPaid")?.value || "";
      const next = readUpgradeRequests();
      next.push({
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        email: user.email,
        reference: String(reference).trim(),
        amount: String(amount).trim(),
        note: "Submitted from profile screen",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      writeUpgradeRequests(next);
      showWarning("Upgrade evidence submitted. Admin review is pending.");
      const refInput = document.getElementById("upgradePaymentReference");
      const amtInput = document.getElementById("upgradeAmountPaid");
      if (refInput) refInput.value = "";
      if (amtInput) amtInput.value = "";
      if (isCurrentUserAdmin()) {
        renderAdminRequests();
      }
    });
  }

  if (applyPlanOverrideBtn) {
    applyPlanOverrideBtn.addEventListener("click", async () => {
      if (!isCurrentUserAdmin()) {
        showWarning("Admin access is restricted.");
        return;
      }
      const email = document.getElementById("adminOverrideEmail")?.value || "";
      const plan = document.getElementById("adminOverridePlan")?.value || "free";
      try {
        setLocalPlanOverride(email, plan);
        updateAuthUI();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        renderAdminOverrides();
        showWarning("Plan override applied.");
      } catch (error) {
        showError(error.message || "Failed to apply override.");
      }
    });
  }

  if (refreshAdminUsersBtn) {
    refreshAdminUsersBtn.addEventListener("click", async () => {
      await refreshAdminUserDirectory();
    });
  }

  if (adminUserSearch) {
    adminUserSearch.addEventListener("input", () => {
      renderAdminUserDirectory();
    });
  }

  if (adminStatusFilter) {
    adminStatusFilter.addEventListener("change", () => {
      renderAdminUserDirectory();
    });
  }
}

function initializeResultButtons() {
  const retakeQuizBtn = document.getElementById("retakeQuizBtn");

  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener("click", () => {
      if (currentTopic) {
        if (!retakeFullQuiz()) {
          startQuiz(getCurrentMode());
        }
      }
    });
  }
}

window.startQuiz = startQuiz;

document.addEventListener("DOMContentLoaded", function () {
  initializeDashboardActions();
  initializeAuthUI();
  updateAuthUI();
  init();
  initializeResultButtons();
  refreshDashboardInsights();
  if (isCurrentUserAdmin()) {
    renderAdminRequests();
    renderAdminOverrides();
    refreshAdminUserDirectory();
  }

  document.addEventListener("screenchange", (event) => {
    if (event?.detail?.screenId === "topicSelectionScreen") {
      refreshDashboardInsights();
    }
  });

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  const osDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && osDark)) {
    body.classList.add("dark-mode");
    if (themeIcon) themeIcon.textContent = "Dark";
  } else {
    body.classList.remove("dark-mode");
    if (themeIcon) themeIcon.textContent = "Light";
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode");

      if (body.classList.contains("dark-mode")) {
        if (themeIcon) themeIcon.textContent = "Dark";
        localStorage.setItem("theme", "dark");
      } else {
        if (themeIcon) themeIcon.textContent = "Light";
        localStorage.setItem("theme", "light");
      }
    });
  }
});
