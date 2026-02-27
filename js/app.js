// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showError, showScreen, showWarning } from "./ui.js";
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
  registerUser,
  setUpgradeRequestStatus,
  startCloudPlanAutoSync,
  submitUpgradeRequest,
  setPlanOverride,
} from "./auth.js";

let currentTopic = null;
let cachedTopics = [];
let allTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;
let adminDirectoryUsers = [];
const UPGRADE_REQUESTS_STORAGE_KEY = "cbt_upgrade_requests_v1";
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
  const accountMenuAdminBtn = document.getElementById("accountMenuAdminBtn");
  const openAdminBtn = document.getElementById("openAdminBtn");
  const openStatesBtn = document.getElementById("openStatesBtn");
  const isAdmin = isCurrentUserAdmin();
  if (authActionBtn && authActionIcon) {
    const isSignedIn = Boolean(user);
    setToolbarIcon(authActionIcon, getAuthToolbarIconMarkup(isSignedIn));
    const tooltip = isSignedIn
      ? "Account options (profile/admin/logout)"
      : "Login or register";
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
        if (cloudStatusResult.warning) {
          showWarning(`Status sync notice: ${cloudStatusResult.warning}`);
        }
        if (overrideResult.warning) {
          showWarning(`Plan override saved. ${overrideResult.warning}`);
        }
        return;
      }
      if (rejectId) {
        const target = filtered.find((entry) => entry.id === rejectId);
        if (!target) return;
        const now = new Date().toISOString();
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
        if (cloudStatusResult.warning) {
          showWarning(`Status sync notice: ${cloudStatusResult.warning}`);
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
    const safeEmail = escapeHtml(entry.email);
    const safeRole = escapeHtml(entry.role);
    const safePlan = escapeHtml(entry.plan);
    const safeStatus = escapeHtml(entry.status);
    const safeCreated = escapeHtml(formatDateTime(entry.createdAt));
    const safeLastSeen = escapeHtml(formatDateTime(entry.lastSeenAt));
    row.innerHTML = `
      <td class="email-cell">${safeEmail}</td>
      <td><span class="admin-badge ${roleClass}">${safeRole}</span></td>
      <td><span class="admin-badge ${planClass}">${safePlan}</span></td>
      <td><span class="admin-badge ${statusClass}">${safeStatus}</span></td>
      <td>${safeCreated}</td>
      <td>${safeLastSeen}</td>
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
  clearScreenState();
  clearPersistedQuizRuntime();
  closeAccountMenu();
  currentTopic = null;
  updateAuthUI();
  refreshDashboardInsights();
  await refreshAccessibleTopics();
  showScreen("splashScreen");
}

function initializeAuthUI() {
  const authActionBtn = document.getElementById("authActionBtn");
  const headerProfileBtn = document.getElementById("headerProfileBtn");
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
  const adminRequestSearch = document.getElementById("adminRequestSearch");
  const adminRequestStatusFilter = document.getElementById("adminRequestStatusFilter");
  const adminRequestSourceFilter = document.getElementById("adminRequestSourceFilter");
  const refreshAdminRequestsBtn = document.getElementById("refreshAdminRequestsBtn");

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
      if (isCloudAuthMisconfigured()) {
        setAuthMessage(
          "Cloud auth config is missing on this deployment. Please contact support to fix runtime secrets.",
        );
        return;
      }
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
        const registration = await registerUser({ name, email, password });
        updateAuthUI();
        closeAccountMenu();
        refreshDashboardInsights();
        await refreshAccessibleTopics();

        if (registration?.requiresEmailVerification) {
          localStorage.setItem(
            LOGIN_EMAIL_PREFILL_STORAGE_KEY,
            String(email || "").trim().toLowerCase(),
          );
          closeAuthModal();
          showWarning(
            registration?.message ||
              "Registration submitted. Check your email to confirm your account before login.",
          );
          return;
        }

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
        await requestPasswordReset(email, window.location.href);
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
    submitUpgradeEvidenceBtn.addEventListener("click", async () => {
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
      const cloudResult = await submitUpgradeRequest({
        reference: String(reference).trim(),
        amount: String(amount).trim(),
        note: "Submitted from profile screen",
      });

      if (cloudResult.cloudSaved) {
        showWarning(
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
    });
  }

  if (headerProfileBtn) {
    headerProfileBtn.addEventListener("click", () => {
      closeAccountMenu();
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      showScreen("profileScreen");
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
        const overrideResult = await setPlanOverride(email, plan);
        updateAuthUI();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        renderAdminOverrides();
        showWarning(
          overrideResult.cloudUpdated
            ? "Plan override applied (cloud and local)."
            : `Plan override applied (local). ${overrideResult.warning || ""}`.trim(),
        );
      } catch (error) {
        showError(error.message || "Failed to apply override.");
      }
    });
  }

  if (refreshAdminUsersBtn) {
    refreshAdminUsersBtn.addEventListener("click", async () => {
      const syncResult = await forceCloudPlanSync();
      if (!syncResult.synced && syncResult.warning) {
        showWarning(`Cloud sync notice: ${syncResult.warning}`);
      }
      renderAdminRequests();
      renderAdminOverrides();
      await refreshAdminUserDirectory();
      updateAuthUI();
      refreshDashboardInsights();
      await refreshAccessibleTopics();
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
      await refreshAdminUserDirectory();
      renderAdminRequests();
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
  initializeAuthUI();
  updateAuthUI();
  await init();
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
