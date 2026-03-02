// app.js - Main application module

import { loadData } from "./data.js";
import {
  displayTopics,
  selectTopic,
  showError,
  showScreen,
  showSuccess,
  showWarning,
} from "./ui.js";
import {
  clearPersistedQuizRuntime,
  getPersistedQuizRuntime,
  loadQuestions,
  restorePersistedQuizRuntime,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";
import { debugLog } from "./logger.js";
import {
  clearLocalPlanOverride,
  forceCloudPlanSync,
  getAccessibleTopics,
  getCurrentEntitlement,
  getAdminUserDirectory,
  getAuthSummaryLabel,
  getAuthProviderLabel,
  getCurrentUser,
  getCurrentUserUpgradeRequest,
  getLocalPlanOverrides,
  getPlanOverrideSyncMeta,
  getProgressStorageKeyForCurrentUser,
  isCurrentUserAdmin,
  isCloudAuthMisconfigured,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resendVerificationEmailForUser,
  registerUser,
  setUpgradeRequestStatus,
  startCloudPlanAutoSync,
  submitUpgradeRequest,
  setPlanOverride,
  updateCloudUserStatusById,
} from "./auth.js";

let currentTopic = null;
let cachedTopics = [];
let allTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;
let adminDirectoryUsers = [];
const UPGRADE_REQUESTS_STORAGE_KEY = "cbt_upgrade_requests_v1";
const ADMIN_OPERATION_HISTORY_STORAGE_KEY = "cbt_admin_operation_history_v1";
const ADMIN_OPERATION_HISTORY_MAX = 120;
const LOGIN_EMAIL_PREFILL_STORAGE_KEY = "cbt_login_prefill_email_v1";
const SCREEN_STATE_STORAGE_KEY = "cbt_screen_state_v1";
const ADMIN_DIRECTORY_SYNC_INTERVAL_MS = 15000;
const ADMIN_DIRECTORY_SYNC_STORAGE_KEYS = new Set([
  "cbt_session_v1",
  "cbt_users_v1",
  "cbt_plan_overrides_v1",
  "cbt_plan_override_meta_v1",
  "cbt_admin_directory_cache_v1",
]);
let adminDirectorySyncIntervalHandle = null;
let adminDirectorySyncVisibilityBound = false;
const RESTORABLE_SCREEN_IDS = new Set([
  "splashScreen",
  "topicSelectionScreen",
  "categorySelectionScreen",
  "modeSelectionScreen",
  "quizScreen",
  "resultsScreen",
  "profileScreen",
  "adminScreen",
  "helpScreen",
  "analyticsScreen",
  "reviewMistakesScreen",
  "statesScreen",
]);
const MOCK_EXAM_TOPIC_ID = "mock_exam";
const MOCK_EXAM_TOPIC = {
  id: MOCK_EXAM_TOPIC_ID,
  name: "Directorate Mock Exam",
  description:
    "Cross-topic simulated promotion CBT built from all 10 core topics.",
  icon: "🧪",
  type: "mock_exam",
  skipCategorySelection: true,
  requiresPremium: true,
  mockExamQuestionCount: 40,
  mockExamBlueprint: [
    { topicId: "psr", count: 4 },
    { topicId: "financial_regulations", count: 4 },
    { topicId: "procurement_act", count: 4 },
    { topicId: "constitutional_law", count: 4 },
    { topicId: "civil_service_admin", count: 4 },
    { topicId: "leadership_management", count: 4 },
    { topicId: "ict_management", count: 4 },
    { topicId: "policy_analysis", count: 4 },
    { topicId: "general_current_affairs", count: 4 },
    { topicId: "competency_framework", count: 4 },
  ],
};

function setToolbarIcon(target, svgMarkup) {
  if (!target) return;
  target.innerHTML = svgMarkup;
}

function showLoadingOverlay(show, message = "Loading Promotion CBT...") {
  const overlay = document.getElementById("appLoadingOverlay");
  const messageEl = document.getElementById("appLoadingMessage");
  if (!overlay) return;
  if (messageEl && show) {
    messageEl.textContent = message;
  }
  overlay.classList.toggle("is-hidden", !show);
}

async function runOperationWithFeedback(
  task,
  {
    loadingMessage = "Processing request...",
    successMessage = "",
    failurePrefix = "",
  } = {},
) {
  showLoadingOverlay(true, loadingMessage);
  try {
    const result = await task();
    const resolvedSuccess =
      typeof successMessage === "function" ? successMessage(result) : successMessage;
    if (resolvedSuccess) {
      showSuccess(resolvedSuccess);
    }
    return result;
  } catch (error) {
    const errorText = String(error?.message || "Operation failed.");
    const nextMessage = failurePrefix ? `${failurePrefix} ${errorText}` : errorText;
    showError(nextMessage);
    throw error;
  } finally {
    showLoadingOverlay(false);
  }
}

function getAuthToolbarIconMarkup(isSignedIn) {
  if (isSignedIn) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10 6h-6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6"></path>
        <path d="M14 8l4 4-4 4"></path>
        <path d="M18 12H8"></path>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 6h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6"></path>
      <path d="M10 8l-4 4 4 4"></path>
      <path d="M6 12h10"></path>
    </svg>
  `;
}

function getThemeToolbarIconMarkup(isDarkMode) {
  if (isDarkMode) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="M4.93 4.93l1.41 1.41"></path>
        <path d="M17.66 17.66l1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="M4.93 19.07l1.41-1.41"></path>
        <path d="M17.66 6.34l1.41-1.41"></path>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
    </svg>
  `;
}

function syncThemeTogglePresentation() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeToggleIcon");
  if (!themeToggle || !themeIcon) return;
  const isDarkMode = document.body.classList.contains("dark-mode");
  setToolbarIcon(themeIcon, getThemeToolbarIconMarkup(isDarkMode));
  const tooltip = isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", tooltip);
  themeToggle.setAttribute("title", tooltip);
  themeToggle.setAttribute("data-tooltip", tooltip);
}

function withSyntheticTopics(topicsData) {
  const baseTopics = Array.isArray(topicsData) ? [...topicsData] : [];
  if (baseTopics.some((topic) => topic?.id === MOCK_EXAM_TOPIC_ID)) {
    return baseTopics;
  }
  return [...baseTopics, { ...MOCK_EXAM_TOPIC }];
}

async function init() {
  try {
    debugLog("Initializing app...");
    const topicsData = await loadData();
    allTopics = withSyntheticTopics(topicsData);
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

function readAdminOperationHistory() {
  try {
    const raw = localStorage.getItem(ADMIN_OPERATION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeAdminOperationHistory(history) {
  const normalized = Array.isArray(history) ? history.slice(0, ADMIN_OPERATION_HISTORY_MAX) : [];
  localStorage.setItem(ADMIN_OPERATION_HISTORY_STORAGE_KEY, JSON.stringify(normalized));
}

function logAdminOperation({ action = "", target = "", status = "success", message = "" } = {}) {
  const user = getCurrentUser();
  const nextEntry = {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: String(action || "").trim() || "operation",
    target: String(target || "").trim() || "-",
    status: String(status || "").trim().toLowerCase() === "failed" ? "failed" : "success",
    message: String(message || "").trim(),
    actor: String(user?.email || "").trim().toLowerCase() || "unknown-admin",
    createdAt: new Date().toISOString(),
  };
  const history = readAdminOperationHistory();
  history.unshift(nextEntry);
  writeAdminOperationHistory(history);
}

function clearAdminOperationHistory() {
  writeAdminOperationHistory([]);
}

function renderAdminOperationHistory() {
  const container = document.getElementById("adminOperationHistoryList");
  const countLabel = document.getElementById("adminOperationHistoryCount");
  if (!container) return;

  const history = readAdminOperationHistory();
  if (countLabel) {
    countLabel.textContent = `Entries: ${history.length}`;
  }

  if (!history.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No admin operations logged yet.</p></div>';
    return;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "admin-table-wrap";

  const table = document.createElement("table");
  table.className = "admin-user-table admin-history-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Time</th>
        <th>Action</th>
        <th>Target</th>
        <th>Status</th>
        <th>Actor</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  history.forEach((entry) => {
    const row = document.createElement("tr");
    const statusClass = entry.status === "failed" ? "rejected" : "approved";
    row.innerHTML = `
      <td>${escapeHtml(formatDateTime(entry.createdAt))}</td>
      <td>${escapeHtml(entry.action || "-")}</td>
      <td class="email-cell">${escapeHtml(entry.target || "-")}</td>
      <td><span class="admin-badge ${statusClass}">${escapeHtml(entry.status || "-")}</span></td>
      <td class="email-cell">${escapeHtml(entry.actor || "-")}</td>
      <td>${escapeHtml(entry.message || "-")}</td>
    `;
    tbody.appendChild(row);
  });

  tableWrap.appendChild(table);
  container.innerHTML = "";
  container.appendChild(tableWrap);
}

function normalizeUpgradeRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return "none";
}

function getLatestLocalUpgradeRequestForEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const requests = readUpgradeRequests().filter(
    (entry) => String(entry?.email || "").trim().toLowerCase() === normalizedEmail,
  );
  if (!requests.length) return null;

  const latest = requests
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(String(a?.createdAt || "")) || 0;
      const bTime = Date.parse(String(b?.createdAt || "")) || 0;
      return bTime - aTime;
    })[0];

  return {
    id: String(latest?.id || ""),
    email: normalizedEmail,
    status: normalizeUpgradeRequestStatus(latest?.status),
    reference: String(latest?.reference || ""),
    amount: String(latest?.amount || ""),
    note: String(latest?.note || ""),
    submittedAt: String(latest?.createdAt || ""),
    reviewedAt: String(latest?.reviewedAt || ""),
    reviewedBy: "",
    reviewNote: "",
    source: "local",
  };
}

function statusBadgeClass(status) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function readScreenState() {
  try {
    const raw = localStorage.getItem(SCREEN_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function writeScreenState(state) {
  localStorage.setItem(SCREEN_STATE_STORAGE_KEY, JSON.stringify(state || {}));
}

function clearScreenState() {
  localStorage.removeItem(SCREEN_STATE_STORAGE_KEY);
}

function persistScreenState(screenId) {
  const user = getCurrentUser();
  if (!user) return;

  const normalizedScreenId = String(screenId || "").trim();
  if (!normalizedScreenId || !RESTORABLE_SCREEN_IDS.has(normalizedScreenId)) {
    return;
  }

  const mode = String(getCurrentMode() || "").trim();
  writeScreenState({
    userId: String(user.id || ""),
    screenId: normalizedScreenId,
    topicId: String(currentTopic?.id || ""),
    selectedCategory: String(currentTopic?.selectedCategory || ""),
    allowedCategoryIds: Array.isArray(currentTopic?.allowedCategoryIds)
      ? currentTopic.allowedCategoryIds.filter(Boolean)
      : null,
    mode: mode || null,
    savedAt: new Date().toISOString(),
  });
}

async function restoreScreenState() {
  const user = getCurrentUser();
  if (!user) {
    clearScreenState();
    return false;
  }

  const saved = readScreenState();
  if (!saved) return false;

  if (saved.userId && String(saved.userId) !== String(user.id || "")) {
    return false;
  }

  const savedScreenId = String(saved.screenId || "").trim();
  if (!savedScreenId || !RESTORABLE_SCREEN_IDS.has(savedScreenId)) {
    return false;
  }

  if ((savedScreenId === "adminScreen" || savedScreenId === "statesScreen") && !isCurrentUserAdmin()) {
    return false;
  }

  if (savedScreenId === "quizScreen") {
    const runtime = getPersistedQuizRuntime();
    const runtimeTopicId = String(runtime?.topic?.id || "").trim();
    const catalogTopic = runtimeTopicId
      ? cachedTopics.find((entry) => entry.id === runtimeTopicId)
      : null;

    if (runtime && catalogTopic && isTopicUnlocked(catalogTopic)) {
      const hydratedTopic = {
        ...catalogTopic,
        ...runtime.topic,
        selectedCategory: String(runtime?.topic?.selectedCategory || "all"),
        allowedCategoryIds: Array.isArray(runtime?.topic?.allowedCategoryIds)
          ? runtime.topic.allowedCategoryIds.filter(Boolean)
          : null,
      };
      const restored = restorePersistedQuizRuntime(runtime, hydratedTopic);
      if (restored?.topic) {
        currentTopic = restored.topic;
        setCurrentTopic(restored.topic);
        showWarning("Restored your in-progress quiz session.");
        return true;
      }
    }

    const topicId = String(saved.topicId || "").trim();
    if (topicId) {
      const topic = cachedTopics.find((entry) => entry.id === topicId);
      if (topic && isTopicUnlocked(topic)) {
        const hydratedTopic = {
          ...topic,
          selectedCategory: String(saved.selectedCategory || "all"),
          allowedCategoryIds: Array.isArray(saved.allowedCategoryIds)
            ? saved.allowedCategoryIds.filter(Boolean)
            : null,
        };
        currentTopic = hydratedTopic;
        setCurrentTopic(hydratedTopic);
      }
    }
    await showScreen("modeSelectionScreen");
    showWarning("Session was restored. Re-select a mode to continue.");
    return true;
  }

  if (savedScreenId === "resultsScreen") {
    await showScreen("modeSelectionScreen");
    showWarning("Results cannot be restored after refresh. Re-select a mode to continue.");
    return true;
  }

  if (savedScreenId === "modeSelectionScreen" || savedScreenId === "categorySelectionScreen") {
    const topicId = String(saved.topicId || "").trim();
    const topic = topicId ? cachedTopics.find((entry) => entry.id === topicId) : null;
    if (topic && isTopicUnlocked(topic)) {
      const hydratedTopic = {
        ...topic,
        selectedCategory: String(saved.selectedCategory || "all"),
        allowedCategoryIds: Array.isArray(saved.allowedCategoryIds)
          ? saved.allowedCategoryIds.filter(Boolean)
          : null,
      };
      currentTopic = hydratedTopic;
      setCurrentTopic(hydratedTopic);
      await selectTopic(hydratedTopic);
      if (savedScreenId === "modeSelectionScreen") {
        await showScreen("modeSelectionScreen");
      }
      return true;
    }

    await showScreen("topicSelectionScreen");
    return true;
  }

  if (savedScreenId === "adminScreen") {
    renderAdminRequests();
    renderAdminOverrides();
    await refreshAdminUserDirectory();
  }

  await showScreen(savedScreenId);
  return true;
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
      await openAdminScreen();
    });
  }
}

function initializeScreenLinkHandlers() {
  const linkElements = document.querySelectorAll("[data-screen-target]");
  linkElements.forEach((element) => {
    const target = String(element.dataset.screenTarget || "").trim();
    if (!target) return;
    element.addEventListener("click", () => {
      showScreen(target);
    });
  });
}

function getPasswordToggleIconMarkup(isVisible) {
  if (isVisible) {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 5.1A10.3 10.3 0 0 1 12 4.8c5.5 0 9.3 4.7 10.3 7.2-.5 1.2-1.7 2.9-3.5 4.3"></path>
        <path d="M6.1 7.1A14.8 14.8 0 0 0 1.8 12c1 2.6 4.8 7.2 10.2 7.2 1 0 2-.2 2.9-.5"></path>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M1.8 12c1-2.6 4.8-7.2 10.2-7.2s9.3 4.7 10.2 7.2c-1 2.6-4.8 7.2-10.2 7.2S2.8 14.6 1.8 12z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
}

function initializePasswordToggles() {
  const buttons = document.querySelectorAll(".password-toggle-btn");
  buttons.forEach((button) => {
    const targetId = String(button.dataset.target || "").trim();
    if (!targetId) return;
    const input = document.getElementById(targetId);
    if (!input) return;
    const iconContainer = button.querySelector(".password-toggle-icon");
    if (iconContainer) {
      iconContainer.innerHTML = getPasswordToggleIconMarkup(false);
    }
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      if (iconContainer) {
        iconContainer.innerHTML = getPasswordToggleIconMarkup(!showing);
      }
      const nextLabel = showing ? "Show" : "Hide";
      button.setAttribute("aria-pressed", String(!showing));
      button.setAttribute("aria-label", `${nextLabel} password`);
      button.setAttribute("title", `${nextLabel} password`);
    });
  });
}

function initializeThemeShortcut() {
  const toggleLink = document.querySelector("[data-theme-action='toggle']");
  if (!toggleLink) return;
  toggleLink.addEventListener("click", () => {
    document.getElementById("themeToggle")?.click();
  });
}

function isTopicUnlocked(topic) {
  if (topic?.requiresPremium) {
    const entitlement = getCurrentEntitlement();
    return entitlement.id === "premium";
  }
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
  try {
    await runOperationWithFeedback(
      () => selectTopic(topic),
      {
        loadingMessage: "Loading topic content...",
        successMessage: "",
        failurePrefix: "Unable to load topic:",
      },
    );
  } catch (error) {
    return;
  }

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
  if (mode === "login") {
    const loginEmailInput = document.getElementById("loginEmail");
    const loginPasswordInput = document.getElementById("loginPassword");
    const savedPrefill = String(localStorage.getItem(LOGIN_EMAIL_PREFILL_STORAGE_KEY) || "")
      .trim()
      .toLowerCase();
    if (loginEmailInput && savedPrefill) {
      loginEmailInput.value = savedPrefill;
      if (loginPasswordInput) loginPasswordInput.value = "";
      localStorage.removeItem(LOGIN_EMAIL_PREFILL_STORAGE_KEY);
    }
  }
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

async function refreshUserUpgradeStatus() {
  const container = document.getElementById("profileUpgradeStatus");
  if (!container) return;

  const user = getCurrentUser();
  if (!user?.email) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  let request = null;
  try {
    request = await getCurrentUserUpgradeRequest();
  } catch (error) {
    request = null;
  }
  if (!request) {
    request = getLatestLocalUpgradeRequestForEmail(user.email);
  }

  if (!request) {
    container.classList.remove("hidden");
    container.innerHTML =
      '<p class="meta">No payment confirmation has been submitted yet.</p>';
    return;
  }

  const status = normalizeUpgradeRequestStatus(request.status);
  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : "Pending Admin Review";
  const reviewMeta = request.reviewedAt
    ? `<p class="meta">Reviewed: ${escapeHtml(formatDateTime(request.reviewedAt))}</p>`
    : "";

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="button-row">
      <strong>Payment Confirmation Status</strong>
      <span class="admin-badge ${statusBadgeClass(status)}">${statusLabel}</span>
    </div>
    <p class="meta">Submitted: ${escapeHtml(formatDateTime(request.submittedAt))}</p>
    <p class="meta">Reference: ${escapeHtml(request.reference || "-")}</p>
    <p class="meta">Amount: ${escapeHtml(request.amount || "-")}</p>
    ${request.note ? `<p class="meta">Note: ${escapeHtml(request.note)}</p>` : ""}
    ${request.reviewNote ? `<p class="meta">Review note: ${escapeHtml(request.reviewNote)}</p>` : ""}
    ${reviewMeta}
  `;
}

function updateAuthUI() {
  const user = getCurrentUser();
  const authActionBtn = document.getElementById("authActionBtn");
  const authActionIcon = document.getElementById("authActionIcon");
  const authToolbarSummary = document.getElementById("authToolbarSummary");
  const headerProfileBtn = document.getElementById("headerProfileBtn");
  const authModeHint = document.getElementById("authModeHint");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileSubtitle = document.getElementById("profileSubtitle");
  const profileAvatar = document.getElementById("profileAvatar");
  const openAdminBtn = document.getElementById("openAdminBtn");
  const openStatesBtn = document.getElementById("openStatesBtn");
  const isAdmin = isCurrentUserAdmin();
  if (authActionBtn && authActionIcon) {
    const isSignedIn = Boolean(user);
    setToolbarIcon(authActionIcon, getAuthToolbarIconMarkup(isSignedIn));
    const tooltip = isSignedIn ? "Logout" : "Login";
    authActionBtn.setAttribute("aria-label", tooltip);
    authActionBtn.setAttribute("title", tooltip);
    authActionBtn.setAttribute("data-tooltip", tooltip);
  }
  if (authToolbarSummary) {
    if (user) {
      authToolbarSummary.textContent = getAuthSummaryLabel();
      authToolbarSummary.classList.remove("hidden");
      authToolbarSummary.setAttribute("title", getAuthSummaryLabel());
    } else {
      authToolbarSummary.textContent = "";
      authToolbarSummary.classList.add("hidden");
      authToolbarSummary.removeAttribute("title");
    }
  }
  if (headerProfileBtn) {
    const tooltip = user ? "Open profile settings" : "Login to access profile settings";
    headerProfileBtn.setAttribute("aria-label", tooltip);
    headerProfileBtn.setAttribute("title", tooltip);
    headerProfileBtn.setAttribute("data-tooltip", tooltip);
  }
  if (headerAdminBtn) {
    const adminTooltip = isAdmin ? "Open admin panel" : "Admin access restricted";
    headerAdminBtn.classList.toggle("hidden", !isAdmin);
    headerAdminBtn.setAttribute("aria-label", adminTooltip);
    headerAdminBtn.setAttribute("title", adminTooltip);
    headerAdminBtn.setAttribute("data-tooltip", adminTooltip);
  }
  if (authModeHint) {
    const cloudConfigMissing = isCloudAuthMisconfigured();
    const provider = getAuthProviderLabel();
    authModeHint.textContent = cloudConfigMissing
      ? "Auth mode: Cloud required (runtime config missing)"
      : provider === "Cloud"
        ? "Auth mode: Cloud (multi-device)"
        : "Auth mode: Local (single-device)";
  }
  if (profileDisplayName) {
    profileDisplayName.textContent = user?.name || "Guest User";
  }
  if (profileSubtitle) {
    if (!user) {
      profileSubtitle.textContent = "Login to manage your profile";
    } else if (isCurrentUserAdmin()) {
      profileSubtitle.textContent = "Admin access";
    } else {
      profileSubtitle.textContent = user.plan === "premium" ? "Premium access" : "Free access";
    }
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
  if (openAdminBtn) {
    openAdminBtn.classList.toggle("hidden", !isAdmin);
  }
  if (openStatesBtn) {
    openStatesBtn.classList.toggle("hidden", !isAdmin);
  }
  refreshUserUpgradeStatus().catch(() => {});
}

function renderAdminOverrides() {
  const container = document.getElementById("adminOverrideList");
  if (!container) return;
  container.innerHTML = "";
  const overrides = getLocalPlanOverrides();
  const syncMeta = getPlanOverrideSyncMeta();
  const entries = Object.entries(overrides);
  if (!entries.length) {
    container.innerHTML = '<div class="admin-request-item"><p class="meta">No local overrides yet.</p></div>';
    return;
  }

  entries.forEach(([email, plan]) => {
    const status = syncMeta[email] || {};
    const syncBadgeClass = status.cloudUpdated ? "approved" : "pending";
    const syncLabel = status.cloudUpdated ? "Cloud+Local" : "Local only";
    const safeEmail = escapeHtml(email);
    const safePlan = escapeHtml(plan);
    const safeWarning = status.warning ? `<div class="meta">${escapeHtml(status.warning)}</div>` : "";
    const card = document.createElement("div");
    card.className = "admin-request-item";
    card.innerHTML = `
      <div><strong>${safeEmail}</strong></div>
      <div class="meta">Current override: <span class="admin-badge ${plan === "premium" ? "approved" : "pending"}">${safePlan}</span></div>
      <div class="meta">Sync status: <span class="admin-badge ${syncBadgeClass}">${syncLabel}</span></div>
      ${safeWarning}
      <div class="button-row">
        <button class="btn btn-ghost" data-clear-email="${safeEmail}" type="button">Clear Override</button>
      </div>
    `;
    const clearBtn = card.querySelector("[data-clear-email]");
    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        try {
          await runOperationWithFeedback(
            async () => {
              clearLocalPlanOverride(email);
              updateAuthUI();
              refreshDashboardInsights();
              await refreshAccessibleTopics();
              renderAdminOverrides();
            },
            {
              loadingMessage: "Clearing plan override...",
              successMessage: `Override cleared for ${email}.`,
              failurePrefix: "Unable to clear override:",
            },
          );
          logAdminOperation({
            action: "Clear plan override",
            target: email,
            status: "success",
            message: "Local override removed.",
          });
        } catch (error) {
          logAdminOperation({
            action: "Clear plan override",
            target: email,
            status: "failed",
            message: error?.message || "Unknown error.",
          });
        } finally {
          renderAdminOperationHistory();
        }
      });
    }
    container.appendChild(card);
  });
}

function renderAdminRequests() {
  const container = document.getElementById("adminRequestList");
  if (!container) return;
  const cloudRequests = adminDirectoryUsers
    .filter((entry) => {
      const status = normalizeUpgradeRequestStatus(entry?.upgradeRequestStatus);
      return (
        status !== "none" ||
        Boolean(entry?.upgradeRequestedAt) ||
        Boolean(entry?.upgradePaymentReference) ||
        Boolean(entry?.upgradeAmountPaid)
      );
    })
    .map((entry) => ({
      id: String(entry?.upgradeRequestId || `req_${String(entry?.email || "").toLowerCase()}`),
      email: String(entry?.email || "").trim().toLowerCase(),
      status: normalizeUpgradeRequestStatus(entry?.upgradeRequestStatus),
      reference: String(entry?.upgradePaymentReference || ""),
      amount: String(entry?.upgradeAmountPaid || ""),
      note: String(entry?.upgradeRequestNote || ""),
      reviewNote: String(entry?.upgradeRequestReviewNote || ""),
      createdAt: String(entry?.upgradeRequestedAt || ""),
      reviewedAt: String(entry?.upgradeReviewedAt || ""),
      reviewedBy: String(entry?.upgradeReviewedBy || ""),
      source: "cloud-profile",
    }))
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;
      return bTime - aTime;
    });

  const localRequests = readUpgradeRequests()
    .slice()
    .reverse()
    .map((entry) => ({
      id: String(entry?.id || ""),
      email: String(entry?.email || "").trim().toLowerCase(),
      status: normalizeUpgradeRequestStatus(entry?.status),
      reference: String(entry?.reference || ""),
      amount: String(entry?.amount || ""),
      note: String(entry?.note || ""),
      reviewNote: "",
      createdAt: String(entry?.createdAt || ""),
      reviewedAt: String(entry?.reviewedAt || ""),
      reviewedBy: "",
      source: "local",
    }));

  const requests = [];
  const seenEmails = new Set();
  cloudRequests.forEach((entry) => {
    if (!entry.email) return;
    seenEmails.add(entry.email);
    requests.push(entry);
  });
  localRequests.forEach((entry) => {
    if (!entry.email || seenEmails.has(entry.email)) return;
    requests.push(entry);
  });

  container.innerHTML = "";
  const searchInput = document.getElementById("adminRequestSearch");
  const statusFilter = document.getElementById("adminRequestStatusFilter");
  const sourceFilter = document.getElementById("adminRequestSourceFilter");
  const countLabel = document.getElementById("adminRequestCount");
  const query = String(searchInput?.value || "").trim().toLowerCase();
  const statusValue = String(statusFilter?.value || "all").toLowerCase();
  const sourceValue = String(sourceFilter?.value || "all").toLowerCase();

  const filtered = requests.filter((request) => {
    if (statusValue !== "all" && request.status !== statusValue) return false;
    if (sourceValue !== "all" && request.source !== sourceValue) return false;
    if (!query) return true;
    return (
      request.email.includes(query) ||
      request.reference.toLowerCase().includes(query) ||
      request.note.toLowerCase().includes(query)
    );
  });

  if (countLabel) {
    countLabel.textContent = `Requests: ${filtered.length}/${requests.length}`;
  }

  if (!filtered.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No upgrade requests submitted yet.</p></div>';
    return;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "admin-request-table-wrap";
  const table = document.createElement("table");
  table.className = "admin-request-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Email</th>
        <th>Status</th>
        <th>Amount</th>
        <th>Reference</th>
        <th>Submitted</th>
        <th>Reviewed</th>
        <th>Source</th>
        <th class="actions-col">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  filtered.forEach((request) => {
    const row = document.createElement("tr");
    const statusClass = statusBadgeClass(request.status);
    const safeEmail = escapeHtml(request.email);
    const safeStatus = escapeHtml(request.status || "pending");
    const safeAmount = escapeHtml(request.amount || "-");
    const safeReference = escapeHtml(request.reference || "-");
    const safeSubmittedAt = escapeHtml(formatDateTime(request.createdAt));
    const safeReviewedAt = escapeHtml(formatDateTime(request.reviewedAt));
    const safeSource = request.source === "cloud-profile" ? "Cloud Profile" : "Local device";
    row.innerHTML = `
      <td class="email-cell">${safeEmail}</td>
      <td><span class="admin-badge ${statusClass}">${safeStatus}</span></td>
      <td>${safeAmount}</td>
      <td>${safeReference}</td>
      <td>${safeSubmittedAt}</td>
      <td>${safeReviewedAt || "-"}</td>
      <td>${safeSource}</td>
      <td class="actions-col">
        <button class="btn btn-secondary action-btn" data-approve-id="${escapeHtml(request.id)}" type="button">Approve</button>
        <button class="btn btn-ghost action-btn" data-reject-id="${escapeHtml(request.id)}" type="button">Reject</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  container.appendChild(tableWrap);
  tableWrap.appendChild(table);

  tableWrap
    .querySelectorAll(".action-btn")
    .forEach((button) => button.addEventListener("click", async () => {
      const approveId = button.getAttribute("data-approve-id");
      const rejectId = button.getAttribute("data-reject-id");
      if (approveId) {
        const target = filtered.find((entry) => entry.id === approveId);
        if (!target) return;
        const now = new Date().toISOString();
        try {
          await runOperationWithFeedback(
            async () => {
              const next = readUpgradeRequests().map((entry) => {
                const sameId = String(entry?.id || "") === target.id;
                const sameEmailPending =
                  String(entry?.email || "").trim().toLowerCase() === target.email &&
                  normalizeUpgradeRequestStatus(entry?.status) === "pending";
                if (!sameId && !sameEmailPending) return entry;
                return { ...entry, status: "approved", reviewedAt: now };
              });
              writeUpgradeRequests(next);
              const cloudStatusResult = await setUpgradeRequestStatus(target.email, "approved");
              const overrideResult = await setPlanOverride(target.email, "premium");
              updateAuthUI();
              refreshDashboardInsights();
              await refreshAccessibleTopics();
              await refreshAdminUserDirectory();
              renderAdminRequests();
              renderAdminOverrides();
              renderAdminOperationHistory();
              if (cloudStatusResult.warning) {
                showWarning(`Status sync notice: ${cloudStatusResult.warning}`);
              }
              if (overrideResult.warning) {
                showWarning(`Plan override saved. ${overrideResult.warning}`);
              }
              logAdminOperation({
                action: "Approve upgrade request",
                target: target.email,
                status: "success",
                message: "Marked as approved and applied premium override.",
              });
            },
            {
              loadingMessage: "Approving upgrade request...",
              successMessage: `Upgrade request approved for ${target.email}.`,
              failurePrefix: "Approve action failed:",
            },
          );
        } catch (error) {
          logAdminOperation({
            action: "Approve upgrade request",
            target: target.email,
            status: "failed",
            message: error?.message || "Unknown error.",
          });
          renderAdminOperationHistory();
        }
        return;
      }
      if (rejectId) {
        const target = filtered.find((entry) => entry.id === rejectId);
        if (!target) return;
        const now = new Date().toISOString();
        try {
          await runOperationWithFeedback(
            async () => {
              const next = readUpgradeRequests().map((entry) => {
                const sameId = String(entry?.id || "") === target.id;
                const sameEmailPending =
                  String(entry?.email || "").trim().toLowerCase() === target.email &&
                  normalizeUpgradeRequestStatus(entry?.status) === "pending";
                if (!sameId && !sameEmailPending) return entry;
                return { ...entry, status: "rejected", reviewedAt: now };
              });
              writeUpgradeRequests(next);
              const cloudStatusResult = await setUpgradeRequestStatus(target.email, "rejected");
              await refreshAdminUserDirectory();
              renderAdminRequests();
              renderAdminOperationHistory();
              if (cloudStatusResult.warning) {
                showWarning(`Status sync notice: ${cloudStatusResult.warning}`);
              }
              logAdminOperation({
                action: "Reject upgrade request",
                target: target.email,
                status: "success",
                message: "Marked as rejected.",
              });
            },
            {
              loadingMessage: "Rejecting upgrade request...",
              successMessage: `Upgrade request rejected for ${target.email}.`,
              failurePrefix: "Reject action failed:",
            },
          );
        } catch (error) {
          logAdminOperation({
            action: "Reject upgrade request",
            target: target.email,
            status: "failed",
            message: error?.message || "Unknown error.",
          });
          renderAdminOperationHistory();
        }
      }
    }));
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
  const countLabel = document.getElementById("adminUserCount");
  if (!container) return;

  const query = String(searchInput?.value || "").trim().toLowerCase();
  const status = String(statusFilter?.value || "all").toLowerCase();
  const filtered = adminDirectoryUsers.filter((entry) => {
    const emailMatch = !query || String(entry.email || "").toLowerCase().includes(query);
    const statusMatch = status === "all" || entry.status === status;
    return emailMatch && statusMatch;
  });
  if (countLabel) {
    countLabel.textContent = `Users: ${filtered.length}/${adminDirectoryUsers.length}`;
  }

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
        <th>Verified</th>
        <th>Created</th>
        <th>Last Seen</th>
        <th class="actions-col">Actions</th>
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
    const safeEmail = escapeHtml(entry.email);
    const safeRole = escapeHtml(entry.role);
    const safePlan = escapeHtml(entry.plan);
    const safeStatus = escapeHtml(entry.status);
    const safeCreated = escapeHtml(formatDateTime(entry.createdAt));
    const safeLastSeen = escapeHtml(formatDateTime(entry.lastSeenAt));
    const isSuspended = entry.status === "suspended";
    const accountActionLabel = isSuspended ? "Reactivate" : "Deactivate";
    const accountNextStatus = isSuspended ? "active" : "suspended";
    const safeProfileId = escapeHtml(entry.id);
    const verifiedLabel = entry.emailVerified ? "Yes" : "No";
    const verifiedClass = entry.emailVerified ? "approved" : "pending";
    row.innerHTML = `
      <td class="email-cell">${safeEmail}</td>
      <td><span class="admin-badge ${roleClass}">${safeRole}</span></td>
      <td><span class="admin-badge ${planClass}">${safePlan}</span></td>
      <td><span class="admin-badge ${statusClass}">${safeStatus}</span></td>
      <td><span class="admin-badge ${verifiedClass}">${verifiedLabel}</span></td>
      <td>${safeCreated}</td>
      <td>${safeLastSeen}</td>
      <td class="actions-col">
        <details class="directory-action-menu">
          <summary class="directory-action-menu-toggle" aria-label="User actions" title="User actions">
            <span class="toolbar-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="5" r="1.8"></circle>
                <circle cx="12" cy="12" r="1.8"></circle>
                <circle cx="12" cy="19" r="1.8"></circle>
              </svg>
            </span>
          </summary>
          <div class="directory-action-menu-list" role="menu" aria-label="User actions menu">
            <button class="directory-action directory-action-menu-item" data-action="send-reset" data-profile-email="${safeEmail}" type="button" role="menuitem">
              Reset password
            </button>
            <button class="directory-action directory-action-menu-item" data-action="resend-verification" data-profile-email="${safeEmail}" data-email-verified="${entry.emailVerified ? "true" : "false"}" type="button" role="menuitem">
              Resend verification
            </button>
            <button class="directory-action directory-action-menu-item danger" data-action="set-account-state" data-profile-id="${safeProfileId}" data-profile-email="${safeEmail}" data-next-status="${accountNextStatus}" type="button" role="menuitem">
              ${accountActionLabel} account
            </button>
          </div>
        </details>
      </td>
    `;
    tbody.appendChild(row);
  });

  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  table.querySelectorAll(".directory-action-menu").forEach((menuEl) => {
    menuEl.addEventListener("toggle", () => {
      if (!menuEl.open) return;
      table.querySelectorAll(".directory-action-menu[open]").forEach((other) => {
        if (other !== menuEl) {
          other.open = false;
        }
      });
    });
  });

  table.addEventListener("click", async (event) => {
    const button = event.target.closest(".directory-action");
    if (!button) return;
    const menu = button.closest(".directory-action-menu");
    if (menu) {
      menu.open = false;
    }
    const action = button.dataset.action;
    if (!action) return;
    const profileId = button.dataset.profileId;
    const profileEmail = button.dataset.profileEmail;
    const nextStatus = String(button.dataset.nextStatus || "").trim().toLowerCase();
    const isEmailVerified = String(button.dataset.emailVerified || "").trim().toLowerCase() === "true";
    const targetLabel = profileEmail || profileId || "unknown-user";
    const isDeactivateFlow = action === "set-account-state" && nextStatus === "suspended";
    const isReactivateFlow = action === "set-account-state" && nextStatus === "active";
    const actionLabel = isDeactivateFlow
      ? "Deactivate user account"
      : isReactivateFlow
        ? "Reactivate user account"
        : action === "send-reset"
          ? "Send password reset"
          : action === "resend-verification"
            ? "Resend verification email"
        : "Update account status";
    let actionWarning = "";
    if (action === "set-account-state") {
      const confirmMessage = isDeactivateFlow
        ? `Deactivate ${targetLabel}? They will no longer be able to login.`
        : `Reactivate ${targetLabel}? They will be able to login again.`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    if (action === "send-reset") {
      if (!confirm(`Send password reset email to ${targetLabel}?`)) {
        return;
      }
    }
    if (action === "resend-verification") {
      if (isEmailVerified) {
        showWarning(`${targetLabel} is already verified.`);
        return;
      }
      if (!confirm(`Resend verification email to ${targetLabel}?`)) {
        return;
      }
    }
    try {
      await runOperationWithFeedback(
        async () => {
          if (action === "set-account-state") {
            const resolvedStatus = nextStatus === "active" ? "active" : "suspended";
            await updateCloudUserStatusById(profileId, resolvedStatus);
            if (resolvedStatus === "suspended") {
              actionWarning =
                "Permanent Firebase Auth deletion is unavailable on Spark. Delete from Firebase Console when needed.";
            }
          } else if (action === "send-reset") {
            await requestPasswordReset(profileEmail, window.location.href);
          } else if (action === "resend-verification") {
            const resendResult = await resendVerificationEmailForUser(
              profileEmail,
              window.location.href,
            );
            actionWarning = String(resendResult?.warning || "").trim();
          }
          await refreshAdminUserDirectory();
          renderAdminUserDirectory();
        },
        {
          loadingMessage: isDeactivateFlow
            ? "Deactivating user account..."
            : isReactivateFlow
              ? "Reactivating user account..."
              : action === "send-reset"
                ? "Sending password reset email..."
                : action === "resend-verification"
                  ? "Sending verification email..."
              : "Updating account status...",
          successMessage: isDeactivateFlow
            ? "User account deactivated."
            : isReactivateFlow
              ? "User account reactivated."
              : action === "send-reset"
                ? `Password reset email sent to ${targetLabel}.`
                : action === "resend-verification"
                  ? `Verification email resent to ${targetLabel}.`
              : "Account status updated.",
          failurePrefix: isDeactivateFlow
            ? "User deactivation failed:"
            : isReactivateFlow
              ? "User reactivation failed:"
              : action === "send-reset"
                ? "Password reset failed:"
                : action === "resend-verification"
                  ? "Resend verification failed:"
              : "Status update failed:",
        },
      );
      logAdminOperation({
        action: actionLabel,
        target: targetLabel,
        status: "success",
        message:
          isDeactivateFlow
            ? actionWarning || "Suspended in cloud profile."
            : isReactivateFlow
              ? "Restored to active status."
              : action === "send-reset"
                ? "Password reset email sent."
                : action === "resend-verification"
                  ? actionWarning || "Verification email resent."
              : `Status updated to ${nextStatus || "target value"}.`,
      });
      renderAdminOperationHistory();
      if (actionWarning) {
        showWarning(actionWarning);
      }
    } catch (error) {
      logAdminOperation({
        action: actionLabel,
        target: targetLabel,
        status: "failed",
        message: error?.message || "Unknown error.",
      });
      renderAdminOperationHistory();
    }
  });
}

async function refreshAdminUserDirectory() {
  if (!isCurrentUserAdmin()) return;
  const notice = document.getElementById("adminUserDirectoryNotice");
  const sourceLabel = document.getElementById("adminUserSource");
  const countLabel = document.getElementById("adminUserCount");
  try {
    const result = await getAdminUserDirectory();
    adminDirectoryUsers = Array.isArray(result.users) ? result.users : [];
    renderAdminUserDirectory();
    renderAdminRequests();
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
    renderAdminRequests();
    if (sourceLabel) {
      sourceLabel.textContent = "Source: unavailable";
    }
    if (countLabel) {
      countLabel.textContent = "Users: 0/0";
    }
    if (notice) {
      notice.textContent = error.message || "Unable to load admin user directory.";
      notice.classList.remove("hidden");
    }
    console.error("Failed to refresh admin user directory:", error);
  }
}

function shouldAutoSyncAdminDirectory() {
  if (!isCurrentUserAdmin() || document.hidden) return false;
  const profileScreen = document.getElementById("profileScreen");
  return Boolean(profileScreen && !profileScreen.classList.contains("hidden"));
}

function startAdminDirectoryAutoSync() {
  if (adminDirectorySyncIntervalHandle) return;
  adminDirectorySyncIntervalHandle = setInterval(() => {
    if (!shouldAutoSyncAdminDirectory()) return;
    refreshAdminUserDirectory();
  }, ADMIN_DIRECTORY_SYNC_INTERVAL_MS);

  if (adminDirectorySyncVisibilityBound) return;
  adminDirectorySyncVisibilityBound = true;

  document.addEventListener("visibilitychange", () => {
    if (shouldAutoSyncAdminDirectory()) {
      refreshAdminUserDirectory();
    }
  });

  window.addEventListener("focus", () => {
    if (shouldAutoSyncAdminDirectory()) {
      refreshAdminUserDirectory();
    }
  });

  window.addEventListener("storage", (event) => {
    if (!isCurrentUserAdmin()) return;
    if (!ADMIN_DIRECTORY_SYNC_STORAGE_KEYS.has(String(event?.key || ""))) return;
    refreshAdminUserDirectory();
  });
}

async function openAdminScreen() {
  if (!isCurrentUserAdmin()) {
    showWarning("Admin access is restricted.");
    return;
  }
  try {
    await runOperationWithFeedback(
      async () => {
        renderAdminRequests();
        renderAdminOverrides();
        renderAdminOperationHistory();
        await refreshAdminUserDirectory();
        await showScreen("adminScreen");
      },
      {
        loadingMessage: "Loading admin panel...",
        successMessage: "",
        failurePrefix: "Unable to open admin panel:",
      },
    );
  } catch (error) {
    // Error toast already displayed by runOperationWithFeedback.
  }
}

async function performLogout() {
  try {
    await runOperationWithFeedback(
      async () => {
        logoutUser();
        clearScreenState();
        clearPersistedQuizRuntime();
        currentTopic = null;
        updateAuthUI();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        await showScreen("splashScreen");
      },
      {
        loadingMessage: "Signing out...",
        successMessage: "Logged out successfully.",
        failurePrefix: "Logout failed:",
      },
    );
  } catch (error) {
    // Error toast already displayed by runOperationWithFeedback.
  }
}

function initializeAuthUI() {
  const authActionBtn = document.getElementById("authActionBtn");
  const headerProfileBtn = document.getElementById("headerProfileBtn");
  const headerAdminBtn = document.getElementById("headerAdminBtn");
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authModal = document.getElementById("authModal");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  const submitUpgradeEvidenceBtn = document.getElementById("submitUpgradeEvidenceBtn");
  const applyPlanOverrideBtn = document.getElementById("applyPlanOverrideBtn");
  const refreshAdminUsersBtn = document.getElementById("refreshAdminUsersBtn");
  const adminUserSearch = document.getElementById("adminUserSearch");
  const adminStatusFilter = document.getElementById("adminStatusFilter");
  const adminRequestSearch = document.getElementById("adminRequestSearch");
  const adminRequestStatusFilter = document.getElementById("adminRequestStatusFilter");
  const adminRequestSourceFilter = document.getElementById("adminRequestSourceFilter");
  const refreshAdminRequestsBtn = document.getElementById("refreshAdminRequestsBtn");
  const clearAdminOperationHistoryBtn = document.getElementById(
    "clearAdminOperationHistoryBtn",
  );

  if (authActionBtn) {
    authActionBtn.addEventListener("click", async () => {
      if (getCurrentUser()) {
        await performLogout();
        return;
      }
      openAuthModal("login");
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
      if (isCloudAuthMisconfigured()) {
        setAuthMessage(
          "Cloud auth config is missing on this deployment. Please contact support to fix runtime secrets.",
        );
        return;
      }
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      try {
        await runOperationWithFeedback(
          async () => {
            await loginUser({ email, password });
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            closeAuthModal();
            await showScreen("topicSelectionScreen");
          },
          {
            loadingMessage: "Signing in...",
            successMessage: "Login successful.",
            failurePrefix: "Login failed:",
          },
        );
      } catch (error) {
        setAuthMessage(error.message || "Login failed.");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isCloudAuthMisconfigured()) {
        setAuthMessage(
          "Cloud auth config is missing on this deployment. Registration is temporarily unavailable.",
        );
        return;
      }
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
        const registration = await runOperationWithFeedback(
          async () => {
            const created = await registerUser({ name, email, password });
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            return created;
          },
          {
            loadingMessage: "Creating account...",
            successMessage: "",
            failurePrefix: "Registration failed:",
          },
        );

        if (registration?.requiresEmailVerification) {
          localStorage.setItem(
            LOGIN_EMAIL_PREFILL_STORAGE_KEY,
            String(email || "").trim().toLowerCase(),
          );
          closeAuthModal();
          showSuccess(
            registration?.message ||
              "Account created. Check your email to verify before login.",
          );
          return;
        }

        setAuthMessage("Account created successfully.", "success");
        showSuccess("Account created successfully.");
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
      if (isCloudAuthMisconfigured()) {
        setAuthMessage(
          "Cloud auth config is missing on this deployment. Password reset is temporarily unavailable.",
        );
        return;
      }
      const email = document.getElementById("loginEmail")?.value || "";
      if (!email) {
        setAuthMessage("Enter your email first, then click Forgot password.");
        return;
      }
      try {
        await runOperationWithFeedback(
          () => requestPasswordReset(email, window.location.href),
          {
            loadingMessage: "Sending password reset link...",
            successMessage: "Password reset link sent. Check your email inbox.",
            failurePrefix: "Unable to send password reset link:",
          },
        );
        setAuthMessage("Password reset link sent. Check your email inbox.", "success");
      } catch (error) {
        setAuthMessage(error.message || "Unable to send password reset link.");
      }
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      if (isCloudAuthMisconfigured()) {
        showWarning(
          "Cloud auth config is missing on this deployment. Password reset is temporarily unavailable.",
        );
        return;
      }
      const user = getCurrentUser();
      const email = user?.email || "";
      if (!email) {
        showWarning("Login is required to change password.");
        return;
      }
      try {
        await runOperationWithFeedback(
          () => requestPasswordReset(email, window.location.href),
          {
            loadingMessage: "Sending password reset link...",
            successMessage: "Password reset link sent to your registered email.",
            failurePrefix: "Unable to send password reset link:",
          },
        );
      } catch (error) {
        // Error toast already displayed by runOperationWithFeedback.
      }
    });
  }

  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", async () => {
      await performLogout();
    });
  }

  if (submitUpgradeEvidenceBtn) {
    submitUpgradeEvidenceBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user?.email) {
        showWarning("Login is required before submitting upgrade evidence.");
        return;
      }
      const reference = document.getElementById("upgradePaymentReference")?.value || "";
      const amount = document.getElementById("upgradeAmountPaid")?.value || "";
      try {
        const cloudResult = await runOperationWithFeedback(
          async () => {
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
            return submitUpgradeRequest({
              reference: String(reference).trim(),
              amount: String(amount).trim(),
              note: "Submitted from profile screen",
            });
          },
          {
            loadingMessage: "Submitting payment evidence...",
            successMessage: "",
            failurePrefix: "Unable to submit payment evidence:",
          },
        );

        if (cloudResult.cloudSaved) {
          showSuccess(
            cloudResult.warning
              ? `Upgrade evidence submitted and synced. Admin review is pending. ${cloudResult.warning}`.trim()
              : "Upgrade evidence submitted and synced. Admin review is pending.",
          );
        } else {
          showWarning(
            `Upgrade evidence submitted. Admin review is pending. ${cloudResult.warning || ""}`.trim(),
          );
        }
        const refInput = document.getElementById("upgradePaymentReference");
        const amtInput = document.getElementById("upgradeAmountPaid");
        if (refInput) refInput.value = "";
        if (amtInput) amtInput.value = "";
        refreshUserUpgradeStatus().catch(() => {});
        if (isCurrentUserAdmin()) {
          await refreshAdminUserDirectory();
          renderAdminRequests();
        }
      } catch (error) {
        // Error toast already displayed by runOperationWithFeedback.
      }
    });
  }

  if (headerProfileBtn) {
    headerProfileBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      showScreen("profileScreen");
    });
  }
  if (headerAdminBtn) {
    headerAdminBtn.addEventListener("click", async () => {
      await openAdminScreen();
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
        const overrideResult = await runOperationWithFeedback(
          async () => {
            const result = await setPlanOverride(email, plan);
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            renderAdminOverrides();
            return result;
          },
          {
            loadingMessage: "Applying plan override...",
            successMessage: "",
            failurePrefix: "Failed to apply override:",
          },
        );
        showWarning(
          overrideResult.cloudUpdated
            ? "Plan override applied (cloud and local)."
            : `Plan override applied (local). ${overrideResult.warning || ""}`.trim(),
        );
        logAdminOperation({
          action: "Apply plan override",
          target: String(email || "").trim().toLowerCase(),
          status: "success",
          message: overrideResult.cloudUpdated
            ? `Updated ${plan} in cloud and local state.`
            : `Updated ${plan} locally. ${overrideResult.warning || ""}`.trim(),
        });
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: "Apply plan override",
          target: String(email || "").trim().toLowerCase(),
          status: "failed",
          message: error?.message || "Unknown error.",
        });
        renderAdminOperationHistory();
      }
    });
  }

  if (refreshAdminUsersBtn) {
    refreshAdminUsersBtn.addEventListener("click", async () => {
      try {
        const syncResult = await runOperationWithFeedback(
          async () => {
            const result = await forceCloudPlanSync();
            renderAdminRequests();
            renderAdminOverrides();
            await refreshAdminUserDirectory();
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            return result;
          },
          {
            loadingMessage: "Refreshing admin directory...",
            successMessage: "Admin directory refreshed.",
            failurePrefix: "Refresh failed:",
          },
        );
        if (!syncResult.synced && syncResult.warning) {
          showWarning(`Cloud sync notice: ${syncResult.warning}`);
        }
        logAdminOperation({
          action: "Refresh users and overrides",
          target: "admin directory",
          status: "success",
          message: syncResult.synced
            ? "Cloud sync succeeded."
            : `Cloud sync partial: ${syncResult.warning || "fallback applied."}`,
        });
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: "Refresh users and overrides",
          target: "admin directory",
          status: "failed",
          message: error?.message || "Unknown error.",
        });
        renderAdminOperationHistory();
      }
    });
  }

  if (adminRequestSearch) {
    adminRequestSearch.addEventListener("input", () => renderAdminRequests());
  }
  if (adminRequestStatusFilter) {
    adminRequestStatusFilter.addEventListener("change", () => renderAdminRequests());
  }
  if (adminRequestSourceFilter) {
    adminRequestSourceFilter.addEventListener("change", () => renderAdminRequests());
  }
  if (refreshAdminRequestsBtn) {
    refreshAdminRequestsBtn.addEventListener("click", async () => {
      try {
        await runOperationWithFeedback(
          async () => {
            await refreshAdminUserDirectory();
            renderAdminRequests();
          },
          {
            loadingMessage: "Refreshing upgrade requests...",
            successMessage: "Upgrade requests refreshed.",
            failurePrefix: "Unable to refresh requests:",
          },
        );
        logAdminOperation({
          action: "Refresh upgrade requests",
          target: "upgrade queue",
          status: "success",
          message: "Requests refreshed from current data source.",
        });
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: "Refresh upgrade requests",
          target: "upgrade queue",
          status: "failed",
          message: error?.message || "Unknown error.",
        });
        renderAdminOperationHistory();
      }
    });
  }

  if (clearAdminOperationHistoryBtn) {
    clearAdminOperationHistoryBtn.addEventListener("click", async () => {
      if (!isCurrentUserAdmin()) {
        showWarning("Admin access is restricted.");
        return;
      }
      if (!confirm("Clear all operation history entries on this device?")) {
        return;
      }
      try {
        await runOperationWithFeedback(
          async () => {
            clearAdminOperationHistory();
            renderAdminOperationHistory();
          },
          {
            loadingMessage: "Clearing operation history...",
            successMessage: "Operation history cleared.",
            failurePrefix: "Unable to clear operation history:",
          },
        );
      } catch (error) {
        // Error toast already displayed by runOperationWithFeedback.
      }
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

document.addEventListener("DOMContentLoaded", async function () {
  startCloudPlanAutoSync();
  startAdminDirectoryAutoSync();
  initializeDashboardActions();
  initializeScreenLinkHandlers();
  initializePasswordToggles();
  initializeThemeShortcut();
  initializeAuthUI();
  updateAuthUI();
  showLoadingOverlay(true);
  try {
    await init();
  } finally {
    showLoadingOverlay(false);
  }
  initializeResultButtons();
  refreshDashboardInsights();

  document.addEventListener("screenchange", (event) => {
    persistScreenState(event?.detail?.screenId);
    if (event?.detail?.screenId === "topicSelectionScreen") {
      refreshDashboardInsights();
    }
    if (event?.detail?.screenId === "profileScreen") {
      refreshUserUpgradeStatus().catch(() => {});
    }
  });

  await restoreScreenState();
  if (isCurrentUserAdmin()) {
    renderAdminRequests();
    renderAdminOverrides();
    refreshAdminUserDirectory();
  }

  document.addEventListener("authplanchange", async () => {
    updateAuthUI();
    refreshDashboardInsights();
    await refreshAccessibleTopics();
    if (isCurrentUserAdmin()) {
      renderAdminOverrides();
    }
  });

  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  const osDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && osDark)) {
    body.classList.add("dark-mode");
  } else {
    body.classList.remove("dark-mode");
  }
  syncThemeTogglePresentation();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode");

      if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
      syncThemeTogglePresentation();
    });
  }
});
