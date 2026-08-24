// app.js - Main application module

import { loadData, getExamTemplateById, getVisibleExamTemplates } from "./data.js";
import { isFeatureEnabled } from "./features.js";
import {
  formatDifficultyFilterLabel,
  formatQuestionFocusLabel,
  formatSessionDurationLabel,
  formatTargetGlBandLabel,
  getTimedTopicTestDurationSeconds,
  hasStudyFilterChoices,
  normalizeStudyFilters,
  resolveStudyQuestionCount,
} from "./studyFilters.js";
import {
  buildTimingSignal,
  formatDifficultyLabel,
  formatGlBandLabel,
  formatModeLabel,
  getActivityTrafficClass,
  getAttemptHeadline,
  getAttemptTopicLabel,
  getTrafficClassByPercentage,
} from "./analyticsShared.js";
import { DEFAULT_MOCK_EXAM_TEMPLATE_ID } from "./mockExamTemplates.js";
import {
  applySessionSetupCopy,
  displayTopics,
  openPricingModal,
  selectTopic,
  showError,
  showScreen,
  showSuccess,
  showWarning,
  showConfirm
} from "./ui.js";
import {
  clearPersistedQuizRuntime,
  dismissRetryMissedQuestion,
  getCloudProgressSyncStatus,
  getCurrentQuestionFeedbackContext,
  getLatestResultsFeedbackContext,
  getPersistedQuizRuntime,
  getRetryMissedQueueCount,
  getRetryMissedQueueSnapshot,
  getRetryMissedQuestions,
  getSpacedPracticeDueCount,
  getSpacedPracticeQuestions,
  loadQuestions,
  readProgressSummary,
  RETRY_MISSED_TOPIC_ID,
  SPACED_PRACTICE_TOPIC_ID,
  REVISION_TOPIC_ID,
  toggleCurrentQuestionFlag,
  getFlaggedQueueCount,
  getFlaggedQuestions,
  toggleCurrentQuestionBookmark,
  getBookmarkedQueueCount,
  getBookmarkedQuestions,
  toggleBookmarkedQuestion,
  restorePersistedQuizRuntime,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  syncProgressFromCloudNow,
  retakeFullQuiz,
} from "./quiz.js";
import { escapeHtml, normalizeExplanationText, parseMarkdown } from "./quiz/formatting.js";
import { debugLog } from "./logger.js";
import { buildAnalyticsSnapshot as composeAnalyticsSnapshot } from "./appAnalytics.js";
import {
  buildAnalyticsConsistencyHtml,
  buildAnalyticsHeatmapHtml,
  buildAnalyticsOverviewModel,
  buildAnalyticsRecommendationModel,
  buildAnalyticsTrendHtml,
  buildDashboardStatsModel,
} from "./appAnalyticsView.js";
import {
  buildDashboardSetupSuggestion,
  buildDashboardSuggestionSignature,
  buildRecommendation,
  getPreferredRecommendedTopic,
} from "./appRecommendations.js";
import {
  readDismissedDashboardRecommendationSignature,
  writeDismissedDashboardRecommendationSignature,
} from "./appRecommendationDismissals.js";
import {
  clearScreenState,
  readScreenState,
  writeScreenState,
} from "./appScreenStateStorage.js";
import { initializeThemeShortcut, initializeThemeToggle } from "./app/theme.js";
import {
  applyReviewMistakeFilters,
  getReviewMistakeDifficultyLabel,
  getReviewMistakeDifficultyValue,
  getReviewMistakeFilterOptions,
  getReviewMistakeOptionPresentation,
  getReviewMistakePreviousResponse,
  getReviewMistakeSubcategoryLabel,
  getReviewMistakeTopicKey,
  getReviewMistakeTopicLabel,
  renderReviewMistakeInlineMarkdown,
  renderReviewMistakesEmptyState,
} from "./appReviewMistakes.js";
import { setToolbarIcon } from "./app/toolbar.js";
import {
  buildHeaderSummaryModel,
  buildSupportStateCardsModel,
  buildUtilityActionButtonModel,
  getHeaderSyncSummary,
} from "./appSupportView.js";
import {
  buildAdminFeedbackEmptyState,
  buildAdminFeedbackItemModel,
  buildAdminFeedbackStatusMessage,
  buildFeedbackAccessUiModel,
  buildFeedbackCharCountLabel,
  buildFeedbackContextSummaryHtml,
  feedbackStatusBadgeClass,
  filterAdminFeedbackSubmissions,
  formatFeedbackCategoryLabel,
  formatFeedbackSourceLabel,
  formatFeedbackStatusLabel,
  formatSessionModeLabel,
  getFeedbackModalCopy,
} from "./appFeedbackView.js";
import { createMockSetupController } from "./app/mockSetup.js";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  clearLocalPlanOverride,
  bootstrapCloudflareMigrationFromFirebase,
  changeCloudflarePasswordForCurrentUser,
  completeCloudflareMigrationToken,
  createCloudflareMigrationLinkForUser,
  forceCloudPlanSync,
  getAccessibleTopics,
  getAdminFeedbackSubmissions,
  getAdminOperationHistory,
  getAdminUserDirectory,
  getAuthSummaryLabel,
  getAuthProviderLabel,
  getCurrentEntitlement,
  getCurrentAuthToken,
  getCurrentUser,
  getCurrentUserUpgradeRequest,
  getFeedbackAccessState,
  getFreeMockExamEligibility,
  getLocalPlanOverrides,
  getPlanOverrideSyncMeta,
  isCloudAuthMisconfigured,
  isCloudProgressSyncEnabled,
  isCurrentUserAdmin,
  emitFlutterwavePlanActivation,
  logAdminOperationToCloud,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendVerificationEmailForUser,
  resolveCloudflareMigrationToken,
  refreshCurrentUserAfterGrant,
  setPlanOverride,
  setUpgradeRequestStatus,
  startCloudPlanAutoSync,
  submitFeedbackSubmission,
  submitUpgradeRequest,
  updateCloudUserStatusById,
  verifySelarPayment,
  updateFeedbackSubmissionStatus,
} from "./auth.js";
import { getFirebaseConfig, getPaymentProvider, getSelarCheckoutUrl, isCloudAuthEnabled } from "./authRuntime.js";
import "./authGoogle.js";

let currentTopic = null;
let cachedTopics = [];
let activeTopicFilter = "all";
let topicSearchQuery = "";
let allTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;
let adminDirectoryUsers = [];
let adminFeedbackSubmissions = [];
let adminPaymentRows = [];
let activeFeedbackContext = null;
let pendingMockExamTemplateId = DEFAULT_MOCK_EXAM_TEMPLATE_ID;
let pendingMigrationToken = "";
let pendingMigrationMode = "token";
let googleAuthEventsBound = false;
const turnstileWidgetIds = {
  login: null,
  register: null,
};
let turnstileInitStartedAt = 0;
const REVIEW_MISTAKES_DEFAULT_FILTERS = Object.freeze({
  topic: "all",
  subcategory: "all",
  difficulty: "all",
});
let reviewMistakesFilters = { ...REVIEW_MISTAKES_DEFAULT_FILTERS };
const UPGRADE_REQUESTS_STORAGE_KEY = "cbt_upgrade_requests_v1";
const ADMIN_OPERATION_HISTORY_STORAGE_KEY = "cbt_admin_operation_history_v1";
const ADMIN_OPERATION_HISTORY_MAX = 120;
const EXPIRY_WARNING_DAYS = 7;
const LOGIN_EMAIL_PREFILL_STORAGE_KEY = "cbt_login_prefill_email_v1";
const FREE_TIER_NOTICE_STORAGE_PREFIX = "cbt_free_tier_notice_dismissed_v1";
const DEFAULT_ADMIN_DIRECTORY_SYNC_INTERVAL_MS = 60000;
const ADMIN_DIRECTORY_SYNC_STORAGE_KEYS = new Set([
  "cbt_session_v1",
  "cbt_users_v1",
  "cbt_plan_overrides_v1",
  "cbt_plan_override_meta_v1",
  "cbt_admin_directory_cache_v1",
]);
let adminDirectorySyncIntervalHandle = null;
let adminDirectorySyncVisibilityBound = false;
let adminDirectoryRefreshInFlight = null;
let adminFeedbackRefreshInFlight = null;
let volatileUpgradeRequests = [];
let volatileAdminOperationHistory = [];
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
const RETRY_MISSED_TOPIC = {
  id: RETRY_MISSED_TOPIC_ID,
  name: "Retry Missed Questions",
  description: "Practice previously missed questions across your recent sessions.",
  icon: "RM",
  type: "retry_missed",
  skipCategorySelection: true,
  requiresPremium: false,
  mockExamQuestionCount: 40,
};
const SPACED_PRACTICE_TOPIC = {
  id: SPACED_PRACTICE_TOPIC_ID,
  name: "Spaced Practice",
  description: "Review weak questions that are due for reinforcement.",
  icon: "SP",
  type: "spaced_practice",
  skipCategorySelection: true,
  requiresPremium: false,
  mockExamQuestionCount: 40,
};
const REVISION_TOPIC = {
  id: REVISION_TOPIC_ID,
  name: "Revision Mode",
  description: "Review specific questions you flagged for later.",
  icon: "RV",
  type: "revision",
  skipCategorySelection: true,
  requiresPremium: false,
  mockExamQuestionCount: 40,
};

const MOCK_EXAM_TOPIC = {
  id: MOCK_EXAM_TOPIC_ID,
  name: "Directorate Mock Exam",
  description:
    "Timed cross-topic simulation across all 10 core topics. Choose General or a GL 14-17 profile.",
  icon: "",
  type: "mock_exam",
  skipCategorySelection: true,
  requiresPremium: true,
  mockExamQuestionCount: 40,
  selectedTemplateId: DEFAULT_MOCK_EXAM_TEMPLATE_ID,
  examTimeLimitMin: 45,
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
const { buildTopicWithSelectedMockTemplate, configureSessionSetup } = createMockSetupController({
  defaultTemplateId: DEFAULT_MOCK_EXAM_TEMPLATE_ID,
  mockExamTopicId: MOCK_EXAM_TOPIC_ID,
  getTemplates: getMockExamTemplatesForUi,
  applySessionSetupCopy,
  escapeHtml,
  formatGlBandLabel,
  getCurrentEntitlement,
  isCurrentUserAdmin,
  getFreeMockExamEligibility,
  formatDateTime,
  getCurrentTopic: () => currentTopic,
  setCurrentTopicValue: (topic) => {
    currentTopic = topic;
    setCurrentTopic(topic);
    return topic;
  },
  getPendingTemplateId: () => pendingMockExamTemplateId,
  setPendingTemplateId: (templateId) => {
    pendingMockExamTemplateId = String(templateId || DEFAULT_MOCK_EXAM_TEMPLATE_ID);
  },
});

function getAdminDirectorySyncIntervalMs() {
  const cfg = window.PROMOTION_CBT_AUTH || {};
  const value = Number(cfg.adminDirectorySyncIntervalMs);
  if (!Number.isFinite(value) || value < 15000) {
    return DEFAULT_ADMIN_DIRECTORY_SYNC_INTERVAL_MS;
  }
  return Math.min(value, 10 * 60 * 1000);
}

function getTurnstileSiteKey() {
  const cfg = getFirebaseConfig();
  const provider = String(cfg.authProvider || "").trim().toLowerCase();
  if (!cfg.cloudflareAuthBaseUrl || (provider !== "cloudflare" && provider !== "hybrid")) return "";
  return String(cfg.cloudflareTurnstileSiteKey || "").trim();
}

function getTurnstileApi() {
  return window.turnstile && typeof window.turnstile.render === "function"
    ? window.turnstile
    : null;
}

function initializeTurnstileWidgets() {
  const siteKey = getTurnstileSiteKey();
  const loginContainer = document.getElementById("cf-turnstile-login");
  const registerContainer = document.getElementById("cf-turnstile-register");
  [loginContainer, registerContainer].forEach((container) => {
    if (container) container.classList.toggle("hidden", !siteKey);
  });
  if (!siteKey || (!loginContainer && !registerContainer)) return;

  const api = getTurnstileApi();
  if (!api) {
    if (!turnstileInitStartedAt) turnstileInitStartedAt = Date.now();
    if (Date.now() - turnstileInitStartedAt < 10000) {
      window.setTimeout(initializeTurnstileWidgets, 250);
    }
    return;
  }

  if (loginContainer && !turnstileWidgetIds.login) {
    turnstileWidgetIds.login = api.render(loginContainer, { sitekey: siteKey });
  }
  if (registerContainer && !turnstileWidgetIds.register) {
    turnstileWidgetIds.register = api.render(registerContainer, { sitekey: siteKey });
  }
}

function getTurnstileToken(kind) {
  const siteKey = getTurnstileSiteKey();
  if (!siteKey) return "";
  const api = getTurnstileApi();
  const widgetId = turnstileWidgetIds[kind];
  const hasWidget = widgetId !== null && widgetId !== undefined;
  const token = api && hasWidget ? String(api.getResponse(widgetId) || "").trim() : "";
  if (!token) {
    throw new Error("Complete the security check before continuing.");
  }
  return token;
}

function resetTurnstileWidget(kind) {
  const api = getTurnstileApi();
  const widgetId = turnstileWidgetIds[kind];
  const hasWidget = widgetId !== null && widgetId !== undefined;
  if (api && hasWidget && typeof api.reset === "function") {
    api.reset(widgetId);
  }
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
    applyTopicFilters();
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
  activeTopicFilter = filter;
  applyTopicFilters();
}

function applyTopicFilters() {
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
    chip.classList.toggle("active", key === activeTopicFilter);
  });

  const query = String(topicSearchQuery || "").trim().toLowerCase();
  topicCards.forEach((card, index) => {
    const topic = cachedTopics[index];
    const topicType = classifyTopic(topic);
    const chipMatches = activeTopicFilter === "all" || topicType === activeTopicFilter;
    const haystack = [
      topic?.name,
      topic?.description,
      topic?.id,
      ...(Array.isArray(topic?.tags) ? topic.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const textMatches = !query || haystack.includes(query);
    const shouldShow = chipMatches && textMatches;
    card.classList.toggle("hidden", !shouldShow);
  });
}

function getLatestAttemptTopic() {
  const summary = readProgressSummary();
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  const latestAttempt = attempts[attempts.length - 1];
  return latestAttempt?.topicId || null;
}

function normalizeUpgradeRequestRecord(entry) {
  const email = String(entry?.email || "").trim().toLowerCase();
  const createdAt = String(entry?.createdAt || entry?.submittedAt || "").trim();
  const submittedAt = String(entry?.submittedAt || entry?.createdAt || "").trim();
  const explicitId = String(entry?.id || "").trim();
  return {
    id: explicitId || ((email || "request") + "::" + (submittedAt || createdAt || "unknown")),
    email,
    status: normalizeUpgradeRequestStatus(entry?.status),
    reference: String(entry?.reference || "").trim(),
    amount: String(entry?.amount || "").trim(),
    billingCycle: String(entry?.billingCycle || "").trim(),
    note: String(entry?.note || "").trim(),
    reviewNote: String(entry?.reviewNote || "").trim(),
    createdAt,
    submittedAt,
    reviewedAt: String(entry?.reviewedAt || "").trim(),
    reviewedBy: String(entry?.reviewedBy || "").trim(),
    source: String(entry?.source || "local").trim() || "local",
  };
}

function toStoredUpgradeRequestRecord(entry) {
  const normalized = normalizeUpgradeRequestRecord(entry);
  return {
    id: normalized.id,
    email: normalized.email,
    status: normalized.status,
    createdAt: normalized.createdAt,
    submittedAt: normalized.submittedAt,
    reviewedAt: normalized.reviewedAt,
    reviewedBy: normalized.reviewedBy,
    reference: normalized.reference,
    amount: normalized.amount,
    billingCycle: normalized.billingCycle,
    note: normalized.note,
    reviewNote: normalized.reviewNote,
    source: normalized.source,
  };
}

function mergeUpgradeRequestRecords(...groups) {
  const records = new Map();
  groups.forEach((group) => {
    (Array.isArray(group) ? group : []).forEach((entry) => {
      const normalized = normalizeUpgradeRequestRecord(entry);
      if (!normalized.id) return;
      const previous = records.get(normalized.id) || {};
      records.set(normalized.id, { ...previous, ...normalized });
    });
  });
  return Array.from(records.values()).sort((a, b) => {
    const aTime = Date.parse(String(a?.submittedAt || a?.createdAt || "")) || 0;
    const bTime = Date.parse(String(b?.submittedAt || b?.createdAt || "")) || 0;
    return bTime - aTime;
  });
}

function normalizeAdminOperationRecord(entry) {
  const explicitId = String(entry?.id || "").trim();
  const createdAt = String(entry?.createdAt || "").trim();
  return {
    id: explicitId || ((String(entry?.action || "operation").trim().toLowerCase()) + "::" + (createdAt || "unknown")),
    action: String(entry?.action || "").trim() || "operation",
    target: String(entry?.target || "").trim() || "-",
    status: String(entry?.status || "").trim().toLowerCase() || "success",
    message: String(entry?.message || "").trim(),
    actor: String(entry?.actor || "").trim() || "unknown-admin",
    createdAt,
  };
}

function toStoredAdminOperationRecord(entry) {
  const normalized = normalizeAdminOperationRecord(entry);
  return {
    id: normalized.id,
    action: normalized.action,
    status: normalized.status,
    createdAt: normalized.createdAt,
  };
}

function mergeAdminOperationRecords(...groups) {
  const records = new Map();
  groups.forEach((group) => {
    (Array.isArray(group) ? group : []).forEach((entry) => {
      const normalized = normalizeAdminOperationRecord(entry);
      if (!normalized.id) return;
      const previous = records.get(normalized.id) || {};
      records.set(normalized.id, { ...previous, ...normalized });
    });
  });
  return Array.from(records.values())
    .sort((a, b) => {
      const aTime = Date.parse(String(a?.createdAt || "")) || 0;
      const bTime = Date.parse(String(b?.createdAt || "")) || 0;
      return bTime - aTime;
    })
    .slice(0, ADMIN_OPERATION_HISTORY_MAX);
}

function readUpgradeRequests() {
  try {
    const raw = localStorage.getItem(UPGRADE_REQUESTS_STORAGE_KEY);
    if (!raw) return mergeUpgradeRequestRecords(volatileUpgradeRequests);
    const parsed = JSON.parse(raw);
    const persisted = Array.isArray(parsed) ? parsed.map((entry) => toStoredUpgradeRequestRecord(entry)) : [];
    const merged = mergeUpgradeRequestRecords(persisted, volatileUpgradeRequests);
    const serialized = JSON.stringify(persisted);
    if (raw !== serialized) {
      localStorage.setItem(UPGRADE_REQUESTS_STORAGE_KEY, serialized);
    }
    return merged;
  } catch (error) {
    return mergeUpgradeRequestRecords(volatileUpgradeRequests);
  }
}

function writeUpgradeRequests(requests) {
  volatileUpgradeRequests = mergeUpgradeRequestRecords(requests);
  const persisted = volatileUpgradeRequests.map((entry) => toStoredUpgradeRequestRecord(entry));
  localStorage.setItem(UPGRADE_REQUESTS_STORAGE_KEY, JSON.stringify(persisted));
}

function readAdminOperationHistory() {
  try {
    const raw = localStorage.getItem(ADMIN_OPERATION_HISTORY_STORAGE_KEY);
    if (!raw) return mergeAdminOperationRecords(volatileAdminOperationHistory);
    const parsed = JSON.parse(raw);
    const persisted = Array.isArray(parsed) ? parsed.map((entry) => toStoredAdminOperationRecord(entry)) : [];
    const merged = mergeAdminOperationRecords(persisted, volatileAdminOperationHistory);
    const serialized = JSON.stringify(persisted);
    if (raw !== serialized) {
      localStorage.setItem(ADMIN_OPERATION_HISTORY_STORAGE_KEY, serialized);
    }
    return merged;
  } catch (error) {
    return mergeAdminOperationRecords(volatileAdminOperationHistory);
  }
}

function writeAdminOperationHistory(history) {
  volatileAdminOperationHistory = mergeAdminOperationRecords(history);
  const persisted = volatileAdminOperationHistory.map((entry) => toStoredAdminOperationRecord(entry));
  localStorage.setItem(ADMIN_OPERATION_HISTORY_STORAGE_KEY, JSON.stringify(persisted));
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
  logAdminOperationToCloud(nextEntry).catch((error) => {
    debugLog(`Admin operation log sync failed: ${error?.message || "request failed."}`);
  });
}
function clearAdminOperationHistory() {
  writeAdminOperationHistory([]);
}

async function renderAdminOperationHistory() {
  const container = document.getElementById("adminOperationHistoryList");
  const countLabel = document.getElementById("adminOperationHistoryCount");
  if (!container) return;
  try {
    const cloudHistory = await getAdminOperationHistory(ADMIN_OPERATION_HISTORY_MAX);
    if (Array.isArray(cloudHistory) && cloudHistory.length) {
      writeAdminOperationHistory(cloudHistory);
    }
  } catch (error) {
    debugLog("Admin operation history sync failed: " + (error?.message || "request failed."));
  }

  const history = readAdminOperationHistory();
  if (countLabel) {
    countLabel.textContent = String(history.length);
  }

  clearElementContent(container);

  if (!history.length) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "admin-request-item";
    appendMetaLine(emptyCard, "No admin operations logged yet.");
    container.appendChild(emptyCard);
    return;
  }

  const list = document.createElement("div");
  list.className = "mistake-list admin-history-list";

  history.forEach((entry) => {
    const normalizedStatus = String(entry?.status || "").trim().toLowerCase();
    const statusClass = normalizedStatus === "failed" || normalizedStatus === "rejected" ? "rejected" : normalizedStatus === "pending" ? "pending" : normalizedStatus ? "approved" : "neutral";
    const whenLabel = formatRelativeTime(entry?.createdAt) || formatDateTime(entry?.createdAt);
    const card = document.createElement("article");
    card.className = "admin-request-item admin-history-entry";
    const head = document.createElement("div");
    head.className = "admin-history-entry-head";
    const titleWrap = document.createElement("div");
    titleWrap.className = "admin-history-entry-title-wrap";
    const title = document.createElement("h4");
    title.className = "admin-history-entry-title";
    title.textContent = String(entry?.action || "Admin action");
    titleWrap.appendChild(title);
    appendMetaLine(titleWrap, whenLabel || "-");
    const badge = document.createElement("span");
    badge.className = "admin-badge " + statusClass;
    badge.textContent = String(entry?.status || "-");
    head.appendChild(titleWrap);
    head.appendChild(badge);
    card.appendChild(head);
    const metaLine = document.createElement("div");
    metaLine.className = "admin-history-meta-line";
    const appendKv = (label, value) => {
      const kv = document.createElement("span");
      kv.className = "admin-history-meta-kv";
      const eyebrow = document.createElement("span");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = String(value || "-");
      kv.appendChild(eyebrow);
      kv.appendChild(document.createTextNode(" "));
      kv.appendChild(strong);
      metaLine.appendChild(kv);
    };
    appendKv("Time", formatDateTime(entry?.createdAt));
    appendKv("Target", entry?.target || "-");
    appendKv("Actor", entry?.actor || "-");
    appendKv("Outcome", entry?.status || "-");
    card.appendChild(metaLine);
    const messageText = String(entry?.message || "-");
    const linkMatch = messageText.match(/https?:\/\/[^\s]+/);
    if (!linkMatch) {
      const details = document.createElement("div");
      details.className = "admin-history-message admin-history-message-truncate";
      details.textContent = messageText;
      details.setAttribute("title", messageText);
      details.addEventListener("click", () => {
        details.classList.toggle("expanded");
      });
      card.appendChild(details);
    } else {
      const rawLink = linkMatch[0];
      const linkUrl = rawLink.replace(/[),.]+$/, "");
      const labelText = messageText.replace(rawLink, "").replace(/Manual verification link:?\s*/i, "").trim();
      const messageCell = document.createElement("div");
      messageCell.className = "admin-history-message";
      const label = document.createElement("p");
      label.textContent = labelText || "Manual verification link";
      messageCell.appendChild(label);
      const actions = document.createElement("div");
      actions.className = "button-row compact-actions admin-history-message-actions";
      const link = document.createElement("a");
      link.href = linkUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "btn btn-ghost";
      link.textContent = "Open link";
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "btn btn-secondary";
      copyButton.textContent = "Copy link";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(linkUrl);
          copyButton.textContent = "Copied";
          setTimeout(() => { copyButton.textContent = "Copy link"; }, 1500);
        } catch (error) {
          showWarning("Copy failed. Use the Open link button here, then copy the address from the browser bar.");
        }
      });
      actions.appendChild(link);
      actions.appendChild(copyButton);
      messageCell.appendChild(actions);
      card.appendChild(messageCell);
    }
    list.appendChild(card);
  });

  container.appendChild(list);
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
    billingCycle: String(latest?.billingCycle || ""),
    note: String(latest?.note || ""),
    submittedAt: String(latest?.createdAt || ""),
    reviewedAt: String(latest?.reviewedAt || ""),
    reviewedBy: "",
    reviewNote: "",
    source: "local",
  };
}

function buildUpgradeRequestRecordFromDirectoryEntry(entry) {
  const email = String(entry?.email || "").trim().toLowerCase();
  if (!email) return null;

  const status = normalizeUpgradeRequestStatus(entry?.upgradeRequestStatus);
  const hasRequest =
    status !== "none" ||
    Boolean(entry?.upgradeRequestedAt) ||
    Boolean(entry?.upgradePaymentReference) ||
    Boolean(entry?.upgradeAmountPaid) ||
    Boolean(entry?.upgradeBillingCycle) ||
    Boolean(entry?.upgradeRequestNote);

  if (!hasRequest) return null;

  return normalizeUpgradeRequestRecord({
    id: String(entry?.upgradeRequestId || ("req_" + email)),
    email,
    status,
    reference: String(entry?.upgradePaymentReference || ""),
    amount: String(entry?.upgradeAmountPaid || ""),
    billingCycle: String(entry?.upgradeBillingCycle || ""),
    note: String(entry?.upgradeRequestNote || ""),
    reviewNote: String(entry?.upgradeRequestReviewNote || ""),
    submittedAt: String(entry?.upgradeRequestedAt || ""),
    reviewedAt: String(entry?.upgradeReviewedAt || ""),
    reviewedBy: String(entry?.upgradeReviewedBy || ""),
    source: "cloud-profile",
  });
}

function statusBadgeClass(status) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}



function clearElementContent(element) {
  if (element) {
    element.replaceChildren();
  }
}

function appendMetaLine(container, text) {
  if (!container) return null;
  const paragraph = document.createElement("p");
  paragraph.className = "meta";
  paragraph.textContent = String(text || "");
  container.appendChild(paragraph);
  return paragraph;
}

function renderChipList(container, entries, { hiddenWhenEmpty = true, chipClass = "chip" } = {}) {
  if (!container) return;
  const normalizedEntries = (Array.isArray(entries) ? entries : [])
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  if (hiddenWhenEmpty) {
    container.classList.toggle("hidden", normalizedEntries.length === 0);
  }
  clearElementContent(container);
  normalizedEntries.forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = chipClass;
    chip.textContent = entry;
    container.appendChild(chip);
  });
}

function renderConfidenceText(container, label, description = "") {
  if (!container) return;
  const normalizedLabel = String(label || "").trim();
  const normalizedDescription = String(description || "").trim();
  container.classList.toggle("hidden", !normalizedLabel);
  clearElementContent(container);
  if (!normalizedLabel) return;
  const strong = document.createElement("strong");
  strong.textContent = "Confidence:";
  container.appendChild(strong);
  container.appendChild(document.createTextNode(" " + normalizedLabel));
  if (normalizedDescription) {
    container.appendChild(document.createTextNode(". " + normalizedDescription));
  }
}

function getTopicNameById(topicId) {
  const topic = allTopics.find((entry) => entry.id === topicId);
  return topic ? topic.name : "Unknown topic";
}









function getNormalizedStudyFilters(topic) {
  const availableStudyFilters = topic?.availableStudyFilters || {};
  return normalizeStudyFilters(topic?.studyFilters, {
    totalQuestions: availableStudyFilters?.totalQuestions,
    defaultQuestionCount: availableStudyFilters?.defaultQuestionCount || 40,
  });
}

function syncStudyFiltersToCurrentTopic(filters = null) {
  if (!currentTopic || typeof currentTopic !== "object") return null;
  currentTopic.studyFilters = normalizeStudyFilters(filters || currentTopic.studyFilters, {
    totalQuestions: currentTopic?.availableStudyFilters?.totalQuestions,
    defaultQuestionCount: currentTopic?.availableStudyFilters?.defaultQuestionCount || 40,
  });
  setCurrentTopic(currentTopic);
  return currentTopic.studyFilters;
}

function fillSelectOptions(
  selectEl,
  options,
  { selectedValue = "all", includeAllLabel = "All", includeAllOption = true } = {},
) {
  if (!selectEl) return;
  const normalizedOptions = Array.isArray(options) ? options : [];
  clearElementContent(selectEl);

  if (includeAllOption) {
    const option = document.createElement("option");
    option.value = "all";
    option.textContent = includeAllLabel;
    selectEl.appendChild(option);
  }

  normalizedOptions.forEach((entry) => {
    const option = document.createElement("option");
    option.value = String(entry?.value ?? "");
    option.textContent = String(entry?.label ?? "");
    selectEl.appendChild(option);
  });

  if (normalizedOptions.some((option) => String(option?.value) === String(selectedValue))) {
    selectEl.value = String(selectedValue);
    return;
  }
  if (includeAllOption) {
    selectEl.value = "all";
    return;
  }
  selectEl.selectedIndex = normalizedOptions.length ? 0 : -1;
}
function fillQuestionCountOptions(selectEl, availableStudyFilters, selectedValue) {
  if (!selectEl) return;
  const options = Array.isArray(availableStudyFilters?.questionCountOptions)
    ? availableStudyFilters.questionCountOptions
    : [];
  const totalQuestions = Number(availableStudyFilters?.totalQuestions || 0);
  clearElementContent(selectEl);

  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = value + " questions";
    selectEl.appendChild(option);
  });

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = totalQuestions > 0 ? "All available (" + totalQuestions + ")" : "All available";
  selectEl.appendChild(allOption);

  const normalizedSelected = selectedValue === "all" ? "all" : String(Number(selectedValue || 0) || "all");
  selectEl.value = Array.from(selectEl.options).some((option) => option.value === normalizedSelected)
    ? normalizedSelected
    : String(availableStudyFilters?.defaultQuestionCount || 40);
  if (!Array.from(selectEl.options).some((option) => option.value === selectEl.value)) {
    selectEl.value = "all";
  }
}

function updateTimedTopicTestMeta(topic, normalizedFilters, availableStudyFilters) {
  const examModeCard = document.getElementById("examModeCard");
  const meta = examModeCard?.querySelector(".meta");
  if (!meta) return;

  const resolvedQuestionCount = resolveStudyQuestionCount(normalizedFilters, {
    totalQuestions: availableStudyFilters?.totalQuestions,
    defaultQuestionCount: availableStudyFilters?.defaultQuestionCount || 40,
  });
  const estimatedSeconds = getTimedTopicTestDurationSeconds(resolvedQuestionCount);
  const durationLabel = formatSessionDurationLabel(estimatedSeconds);
  const questionLabel = `${resolvedQuestionCount} question${resolvedQuestionCount === 1 ? "" : "s"}`;
  meta.textContent = `Estimated time: ${durationLabel} for ${questionLabel}`;
}

function configureStudyFilterPanel(topic) {
  const panel = document.getElementById("studyFilterPanel");
  const summary = document.getElementById("studyFilterSummary");
  const questionCountField = document.getElementById("studyQuestionCountField");
  const difficultyField = document.getElementById("studyDifficultyField");
  const sourceDocumentField = document.getElementById("studySourceDocumentField");
  const questionFocusField = document.getElementById("studyQuestionFocusField");
  const targetGlBandField = document.getElementById("studyTargetGlBandField");
  const questionCountSelect = document.getElementById("studyQuestionCountSelect");
  const difficultySelect = document.getElementById("studyDifficultySelect");
  const sourceDocumentSelect = document.getElementById("studySourceDocumentSelect");
  const questionFocusSelect = document.getElementById("studyQuestionFocusSelect");
  const targetGlBandSelect = document.getElementById("studyTargetGlBandSelect");
  const setupSuggestionStrip = document.getElementById("setupSuggestionStrip");
  const setupSuggestionTitle = document.getElementById("setupSuggestionTitle");
  const setupSuggestionMessage = document.getElementById("setupSuggestionMessage");
  const setupSuggestionChips = document.getElementById("setupSuggestionChips");
  const setupSuggestionSignalChips = document.getElementById("setupSuggestionSignalChips");
  const setupSuggestionConfidence = document.getElementById("setupSuggestionConfidence");
  const clearSetupSuggestionBtn = document.getElementById("clearSetupSuggestionBtn");

  if (
    !panel ||
    !summary ||
    !questionCountField ||
    !difficultyField ||
    !sourceDocumentField ||
    !questionFocusField ||
    !targetGlBandField ||
    !questionCountSelect ||
    !difficultySelect ||
    !sourceDocumentSelect ||
    !questionFocusSelect ||
    !targetGlBandSelect ||
    !setupSuggestionStrip ||
    !setupSuggestionTitle ||
    !setupSuggestionMessage ||
    !setupSuggestionChips ||
    !setupSuggestionSignalChips ||
    !setupSuggestionConfidence ||
    !clearSetupSuggestionBtn
  ) {
    return;
  }

  const isEnabled = isFeatureEnabled("enableStudyFilters");
  const isTopicFilterable = Boolean(
    topic &&
    topic.id !== MOCK_EXAM_TOPIC_ID &&
    topic.id !== RETRY_MISSED_TOPIC_ID &&
    topic.id !== SPACED_PRACTICE_TOPIC_ID,
  );
  const availableStudyFilters = topic?.availableStudyFilters || null;

  if (!isEnabled || !isTopicFilterable || !availableStudyFilters) {
    panel.classList.add("hidden");
    return;
  }

  const normalizedFilters = getNormalizedStudyFilters(topic);
  const totalQuestions = Number(availableStudyFilters?.totalQuestions || 0);
  const resolvedQuestionCount = resolveStudyQuestionCount(normalizedFilters, {
    totalQuestions,
    defaultQuestionCount: availableStudyFilters?.defaultQuestionCount || 40,
  });
  const estimatedSeconds = getTimedTopicTestDurationSeconds(resolvedQuestionCount);
  const estimatedDurationLabel = formatSessionDurationLabel(estimatedSeconds);
  const questionLabel = `${resolvedQuestionCount} question${resolvedQuestionCount === 1 ? "" : "s"}`;

  fillQuestionCountOptions(questionCountSelect, availableStudyFilters, normalizedFilters.questionCount);
  fillSelectOptions(
    difficultySelect,
    (availableStudyFilters?.difficulties || []).map((difficulty) => ({
      value: difficulty,
      label: formatDifficultyFilterLabel(difficulty),
    })),
    {
      selectedValue: normalizedFilters.difficulty,
      includeAllLabel: "All difficulties",
    },
  );
  fillSelectOptions(
    sourceDocumentSelect,
    (availableStudyFilters?.sourceDocuments || []).map((sourceDocument) => ({
      value: sourceDocument,
      label: sourceDocument,
    })),
    {
      selectedValue: normalizedFilters.sourceDocument,
      includeAllLabel: "All sources",
    },
  );
  fillSelectOptions(
    questionFocusSelect,
    (availableStudyFilters?.questionFocusOptions || []).map((questionFocus) => ({
      value: questionFocus,
      label: formatQuestionFocusLabel(questionFocus),
    })),
    {
      selectedValue: normalizedFilters.questionFocus,
      includeAllLabel: null,
      includeAllOption: false,
    },
  );
  fillSelectOptions(
    targetGlBandSelect,
    (availableStudyFilters?.targetGlBandOptions || []).map((targetGlBand) => ({
      value: targetGlBand,
      label: formatTargetGlBandLabel(targetGlBand),
    })),
    {
      selectedValue: normalizedFilters.targetGlBand,
      includeAllLabel: null,
      includeAllOption: false,
    },
  );

  const showQuestionCount = (availableStudyFilters?.questionCountOptions || []).length > 0;
  const showDifficulty = (availableStudyFilters?.difficulties || []).length > 1;
  const showSourceDocument = (availableStudyFilters?.sourceDocuments || []).length > 1;
  const showQuestionFocus = (availableStudyFilters?.questionFocusOptions || []).length > 1;
  const showTargetGlBand = (availableStudyFilters?.targetGlBandOptions || []).length > 1;

  questionCountField.classList.toggle("hidden", !showQuestionCount);
  difficultyField.classList.toggle("hidden", !showDifficulty);
  sourceDocumentField.classList.toggle("hidden", !showSourceDocument);
  questionFocusField.classList.toggle("hidden", !showQuestionFocus);
  targetGlBandField.classList.toggle("hidden", !showTargetGlBand);

  panel.classList.toggle(
    "hidden",
    !showQuestionCount && !hasStudyFilterChoices(availableStudyFilters),
  );

  updateTimedTopicTestMeta(topic, normalizedFilters, availableStudyFilters);

  const setupSuggestion = topic?.sessionSetupSuggestion || null;
  const suggestionChips = Array.isArray(setupSuggestion?.chips)
    ? setupSuggestion.chips.filter((entry) => String(entry || "").trim())
    : [];
  const suggestionSignalChips = Array.isArray(setupSuggestion?.signalChips)
    ? setupSuggestion.signalChips.filter((entry) => String(entry || "").trim())
    : [];
  const suggestionConfidenceLabel = String(setupSuggestion?.confidenceLabel || "").trim();
  const suggestionConfidenceDescription = String(setupSuggestion?.confidenceDescription || "").trim();
  const suggestionConfidenceTone = String(setupSuggestion?.confidenceTone || "medium").trim().toLowerCase();
  setupSuggestionStrip.classList.toggle("hidden", !setupSuggestion);
  if (setupSuggestion) {
    setupSuggestionTitle.textContent = String(setupSuggestion.title || "Suggested Setup");
    setupSuggestionMessage.textContent = String(setupSuggestion.message || "These changes came from your latest results.");
    renderChipList(setupSuggestionChips, suggestionChips);
    renderChipList(setupSuggestionSignalChips, suggestionSignalChips);
    setupSuggestionSignalChips.classList.toggle("hidden", suggestionSignalChips.length === 0);
    setupSuggestionConfidence.classList.remove("high", "medium", "low");
    setupSuggestionConfidence.classList.add(["high", "medium", "low"].includes(suggestionConfidenceTone) ? suggestionConfidenceTone : "medium");
    renderConfidenceText(setupSuggestionConfidence, suggestionConfidenceLabel, suggestionConfidenceDescription);
  } else {
    setupSuggestionTitle.textContent = "Suggested Setup";
    setupSuggestionMessage.textContent = "These changes came from your latest results.";
    renderChipList(setupSuggestionChips, [], { hiddenWhenEmpty: false });
    setupSuggestionSignalChips.classList.add("hidden");
    renderChipList(setupSuggestionSignalChips, [], { hiddenWhenEmpty: false });
    setupSuggestionConfidence.classList.add("hidden");
    setupSuggestionConfidence.classList.remove("high", "medium", "low");
    renderConfidenceText(setupSuggestionConfidence, "");
  }

  const emphasisParts = [];
  if (normalizedFilters.questionFocus !== "balanced") {
    emphasisParts.push(formatQuestionFocusLabel(normalizedFilters.questionFocus));
  }
  if (normalizedFilters.targetGlBand !== "general") {
    emphasisParts.push(formatTargetGlBandLabel(normalizedFilters.targetGlBand) + " emphasis");
  }
  summary.textContent = totalQuestions > 0
    ? "Adjust the setup before you begin. " + totalQuestions + " questions are available in the current topic scope. Current timed estimate: " + estimatedDurationLabel + " for " + questionLabel + "." + (emphasisParts.length ? " Current emphasis: " + emphasisParts.join(" + ") + "." : "")
    : "Adjust the setup before you begin.";

  clearSetupSuggestionBtn.onclick = () => {
    if (currentTopic && typeof currentTopic === "object" && currentTopic.sessionSetupSuggestion) {
      currentTopic.sessionSetupSuggestion = null;
      setCurrentTopic(currentTopic);
      configureStudyFilterPanel(currentTopic);
      persistScreenState("modeSelectionScreen");
    }
  };

  const handleChange = () => {
    if (currentTopic && typeof currentTopic === "object" && currentTopic.sessionSetupSuggestion) {
      currentTopic.sessionSetupSuggestion = null;
      setCurrentTopic(currentTopic);
    }
    syncStudyFiltersToCurrentTopic({
      questionCount: questionCountSelect.value,
      difficulty: difficultySelect.value,
      sourceDocument: sourceDocumentSelect.value,
      questionFocus: questionFocusSelect.value,
      targetGlBand: targetGlBandSelect.value,
    });
    configureStudyFilterPanel(currentTopic);
    persistScreenState("modeSelectionScreen");
  };

  questionCountSelect.onchange = handleChange;
  difficultySelect.onchange = handleChange;
  sourceDocumentSelect.onchange = handleChange;
  questionFocusSelect.onchange = handleChange;
  targetGlBandSelect.onchange = handleChange;
}
function applySessionSetupState(topic) {
  configureSessionSetup(topic);
  configureStudyFilterPanel(topic);
}

function isCoreAnalyticsTopicId(topicId) {
  const value = String(topicId || "").trim();
  return Boolean(
    value &&
    value !== MOCK_EXAM_TOPIC_ID &&
    value !== RETRY_MISSED_TOPIC_ID &&
    value !== SPACED_PRACTICE_TOPIC_ID,
  );
}














function getAttemptTimingSignal(attempt) {
  const topicId = String(attempt?.topicId || "").trim();
  const totalQuestions = Number(attempt?.totalQuestions || 0);
  const allowedSeconds =
    topicId === MOCK_EXAM_TOPIC_ID ? 45 * 60 : getTimedTopicTestDurationSeconds(totalQuestions);

  return buildTimingSignal({
    mode: attempt?.mode,
    allowedSeconds,
    elapsedSeconds: attempt?.timeTakenSec,
    unansweredCount: attempt?.unansweredCount,
  });
}

function buildAppAnalyticsSnapshot(attempts) {
  return composeAnalyticsSnapshot(attempts, {
    topics: allTopics,
    isIncludedTopicId: isCoreAnalyticsTopicId,
    getFallbackTopicName: getTopicNameById,
    mockExamTopicId: MOCK_EXAM_TOPIC_ID,
    getAttemptHeadline: (attempt) => getAttemptHeadline(attempt, {
      mockExamTopicId: MOCK_EXAM_TOPIC_ID,
      getTopicNameById,
    }),
    getAttemptTopicLabel: (attempt) => getAttemptTopicLabel(attempt, {
      mockExamTopicId: MOCK_EXAM_TOPIC_ID,
      getTopicNameById,
    }),
    getWhenLabel: (attempt) =>
      formatRelativeTime(attempt?.createdAt) || formatDateTime(attempt?.createdAt),
    getDayLabel: (date) => date.toLocaleDateString(undefined, { weekday: "short" }),
    getDateLabel: (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    getWeeklyActivityClass: getActivityTrafficClass,
    getAttemptTimingSignal,
    buildRecommendation: (insights) =>
      buildRecommendation(insights, {
        mockExamTopicId: MOCK_EXAM_TOPIC_ID,
        getAttemptTimingSignal,
        formatDifficultyLabel,
        formatSessionDurationLabel,
        formatGlBandLabel,
        getAttemptHeadline: (attempt) =>
          getAttemptHeadline(attempt, { mockExamTopicId: MOCK_EXAM_TOPIC_ID, getTopicNameById }),
      }),
  });
}

function renderSupportStateCards(insights = null) {
  const attemptsMeta = document.getElementById("stateAttemptsMeta");
  const reviewQueueMeta = document.getElementById("stateReviewQueueMeta");
  const syncMeta = document.getElementById("stateSyncMeta");
  const summary = readProgressSummary();
  const user = getCurrentUser();
  const supportModel = buildSupportStateCardsModel({
    attempts: Array.isArray(insights?.attempts) ? insights.attempts : summary?.attempts,
    retryCount: getRetryMissedQueueCount(),
    spacedDueCount: getSpacedPracticeDueCount(),
    syncSummary: getHeaderSyncSummary(user, {
      providerLabel: getAuthProviderLabel(),
      syncEnabled: isCloudProgressSyncEnabled(),
      syncStatus: getCloudProgressSyncStatus(),
      formatRelativeTime,
      formatDateTime,
    }),
    hasUser: Boolean(user),
  });

  if (attemptsMeta) attemptsMeta.textContent = supportModel.attemptsMeta;
  if (reviewQueueMeta) reviewQueueMeta.textContent = supportModel.reviewQueueMeta;
  if (syncMeta) syncMeta.textContent = supportModel.syncMeta;
}

function renderUtilityActionButton(button, label, count, emptyTitle) {
  if (!button) return;
  const model = buildUtilityActionButtonModel({ label, count, emptyTitle });
  button.classList.toggle("has-count", model.hasCount);
  if (model.hasCount) {
    button.setAttribute("data-count", model.countText);
  } else {
    button.removeAttribute("data-count");
  }
  button.textContent = model.text;
  button.disabled = model.disabled;
  button.setAttribute("aria-label", model.ariaLabel);
  button.setAttribute("title", model.title);
}

function resetReviewMistakesFilters() {
  reviewMistakesFilters = { ...REVIEW_MISTAKES_DEFAULT_FILTERS };
}

function renderReviewMistakesScreen() {
  const user = getCurrentUser();
  const intro = document.getElementById("reviewMistakesIntro");
  const summaryChips = document.getElementById("reviewMistakesSummaryChips");
  const topicFilter = document.getElementById("reviewMistakesTopicFilter");
  const subcategoryFilter = document.getElementById("reviewMistakesSubcategoryFilter");
  const difficultyFilter = document.getElementById("reviewMistakesDifficultyFilter");
  const list = document.getElementById("reviewMistakesList");
  const startBtn = document.getElementById("reviewMistakesStartBtn");
  const clearFiltersBtn = document.getElementById("reviewMistakesClearFiltersBtn");
  if (!list) return;

  const queueEntries = user ? getRetryMissedQueueSnapshot(80) : [];
  const filterOptions = getReviewMistakeFilterOptions(queueEntries, {
    getTopicNameById,
    formatDifficultyLabel,
  });

  fillSelectOptions(topicFilter, filterOptions.topics, {
    selectedValue: reviewMistakesFilters.topic,
    includeAllLabel: "All Topics",
  });
  reviewMistakesFilters.topic = topicFilter?.value || "all";

  fillSelectOptions(subcategoryFilter, filterOptions.subcategories, {
    selectedValue: reviewMistakesFilters.subcategory,
    includeAllLabel: "All Subcategories",
  });
  reviewMistakesFilters.subcategory = subcategoryFilter?.value || "all";

  fillSelectOptions(difficultyFilter, filterOptions.difficulties, {
    selectedValue: reviewMistakesFilters.difficulty,
    includeAllLabel: "All Difficulties",
  });
  reviewMistakesFilters.difficulty = difficultyFilter?.value || "all";

  [topicFilter, subcategoryFilter, difficultyFilter].forEach((select) => {
    if (!select) return;
    select.disabled = queueEntries.length === 0;
  });

  const filteredEntries = applyReviewMistakeFilters(queueEntries, reviewMistakesFilters);
  const hasActiveFilters = Object.values(reviewMistakesFilters).some((value) => value !== "all");

  if (startBtn) {
    const queueCount = queueEntries.length;
    startBtn.textContent = queueCount > 0
      ? `Start Retry Session (${Math.min(queueCount, 40)})`
      : "Start Retry Session";
    startBtn.disabled = queueCount === 0;
    startBtn.setAttribute(
      "title",
      queueCount > 0
        ? "Launch a focused retry session from your queued mistakes."
        : user
          ? "Complete a scored session to build your review queue."
          : "Sign in and complete a scored session to build your review queue.",
    );
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.classList.toggle("hidden", !hasActiveFilters);
  }

  if (intro) {
    if (!user) {
      intro.textContent = "Sign in to save missed questions and return to them with the right context later.";
    } else if (!queueEntries.length) {
      intro.textContent = "Missed or unanswered questions from scored sessions will appear here automatically with the correct answer and rationale.";
    } else if (!filteredEntries.length) {
      intro.textContent = "No review items match the current filters. Clear one or more filters to reopen the rest of your retry bank.";
    } else {
      intro.textContent = `Review ${filteredEntries.length} of ${queueEntries.length} queued mistake${queueEntries.length === 1 ? "" : "s"} with topic, difficulty, and explanation context intact.`;
    }
  }

  if (summaryChips) {
    const uniqueTopics = new Set(queueEntries.map((entry) => getReviewMistakeTopicKey(entry)).filter(Boolean)).size;
    const hardCount = queueEntries.filter(
      (entry) => getReviewMistakeDifficultyValue(entry?.question || {}) === "hard",
    ).length;
    const latestUpdatedAt = queueEntries[0]?.updatedAt || "";
    const latestLabel = formatRelativeTime(latestUpdatedAt) || formatDateTime(latestUpdatedAt);
    const chips = !user
      ? []
      : queueEntries.length
        ? [
            `${queueEntries.length} queued`,
            `${uniqueTopics} topic${uniqueTopics === 1 ? "" : "s"}`,
            hardCount > 0 ? `${hardCount} hard` : "Mixed difficulty",
            latestLabel ? `Latest miss ${latestLabel}` : "",
            hasActiveFilters ? "Filtered view" : "",
          ].filter(Boolean)
        : ["Queue ready after your next scored session"];
    summaryChips.classList.toggle("hidden", chips.length === 0);
    renderChipList(summaryChips, chips);
  }

  if (!user) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "Your review queue is tied to your account.",
      body: "Login or create an account to keep missed questions, retry them later, and sync the queue across devices.",
      primaryAction: { action: "open-login", label: "Login or Register", variant: "btn-primary" },
      secondaryAction: { action: "open-dashboard", label: "Back to Dashboard", variant: "btn-ghost" },
    }, { escapeHtml });
    return;
  }

  if (!queueEntries.length) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "No missed questions queued yet.",
      body: "Complete a scored Practice or Timed Topic Test session and any incorrect or unanswered items will appear here for follow-up.",
      primaryAction: { action: "open-dashboard", label: "Start a Scored Session", variant: "btn-primary" },
      secondaryAction: { action: "open-analytics", label: "Open Analytics", variant: "btn-secondary" },
    }, { escapeHtml });
    return;
  }

  if (!filteredEntries.length) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "No questions match these filters.",
      body: "Clear one or more filters to reveal the rest of your retry queue.",
      primaryAction: { action: "clear-filters", label: "Clear Filters", variant: "btn-primary" },
      secondaryAction: { action: "retry-queue", label: "Start Retry Session", variant: "btn-secondary" },
    }, { escapeHtml });
    return;
  }

  list.innerHTML = filteredEntries
    .map((entry, index) => {
      const question = entry?.question || {};
      const topicLabel = getReviewMistakeTopicLabel(entry, { getTopicNameById });
      const subcategoryLabel = getReviewMistakeSubcategoryLabel(question);
      const difficultyLabel = getReviewMistakeDifficultyLabel(question, { formatDifficultyLabel });
      const relativeLabel = formatRelativeTime(entry.updatedAt);
      const statusLabel = relativeLabel ? `Missed ${relativeLabel}` : `Reviewed ${formatDateTime(entry.updatedAt)}`;
      const previousResponse = getReviewMistakePreviousResponse(entry, { parseMarkdown });
      const correctResponse = getReviewMistakeOptionPresentation(question, question?.correct, { parseMarkdown });
      const explanationHtml = parseMarkdown(
        normalizeExplanationText(String(question?.explanation || "").trim()),
      );
      const sourceMetaParts = [
        String(question?.sourceDocument || "").trim(),
        String(question?.sourceSection || "").trim(),
      ].filter(Boolean);
      const topicExists = cachedTopics.some(
        (topic) => String(topic?.id || "").trim() === String(entry?.sourceTopicId || "").trim(),
      );

      return `
        <article class="mistake-item review-mistake-card review-mistake-case ${index === 0 ? "review-mistake-case-primary" : ""}">
          <div class="review-mistake-meta">
            <span class="chip">${escapeHtml(topicLabel)}</span>
            ${subcategoryLabel ? `<span class="chip subtle">${escapeHtml(subcategoryLabel)}</span>` : ""}
            ${difficultyLabel ? `<span class="chip subtle">${escapeHtml(difficultyLabel)}</span>` : ""}
            <span class="hero-meta">${escapeHtml(statusLabel)}</span>
          </div>
          <div class="review-question-body">
            <h3>${renderReviewMistakeInlineMarkdown(question?.question, { fallback: "Question text unavailable.", parseMarkdown })}</h3>
            ${
              sourceMetaParts.length
                ? `<p class="hero-meta">${escapeHtml(sourceMetaParts.join(" | "))}</p>`
                : ""
            }
          </div>
          <div class="review-answer-grid">
            <div class="review-answer-block your-answer">
              <span class="eyebrow">${escapeHtml(previousResponse.title)}</span>
              <div class="review-answer-copy">${previousResponse.html}</div>
            </div>
            <div class="review-answer-block correct-answer">
              <span class="eyebrow">Correct Answer</span>
              <div class="review-answer-copy">${correctResponse.html}</div>
            </div>
          </div>
          <details>
            <summary>View explanation</summary>
            <div class="review-answer-copy">${explanationHtml}</div>
          </details>
          <div class="button-row compact-actions review-mistake-actions">
            ${
              topicExists
                ? `<button class="btn btn-ghost" data-review-action="open-topic" data-topic-id="${escapeHtml(entry?.sourceTopicId || "")}" type="button">Open Topic</button>`
                : ""
            }
            <button class="btn btn-secondary" data-review-action="dismiss" data-entry-id="${escapeHtml(entry?.id || "")}" type="button">Mark Understood</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAnalyticsScreen(insights) {
  const overviewCard = document.getElementById("analyticsOverviewCard");
  const overviewReadiness = document.getElementById("analyticsOverviewReadiness");
  const overviewNarrative = document.getElementById("analyticsOverviewNarrative");
  const overviewSignals = document.getElementById("analyticsOverviewSignals");
  const overviewLatest = document.getElementById("analyticsOverviewLatest");
  const overviewScore = document.getElementById("analyticsOverviewScore");
  const overviewStreak = document.getElementById("analyticsOverviewStreak");
  const overviewAttempts = document.getElementById("analyticsOverviewAttempts");
  const trendList = document.getElementById("analyticsTrendList");
  const consistencyList = document.getElementById("analyticsConsistencyList");
  const heatmapGrid = document.getElementById("analyticsHeatmapGrid");
  const recommendationTitle = document.getElementById("analyticsRecommendationTitle");
  const recommendationMeta = document.getElementById("analyticsRecommendationMeta");
  const recommendationSignals = document.getElementById("analyticsRecommendationSignals");
  const recommendationConfidence = document.getElementById("analyticsRecommendationConfidence");

  const overview = buildAnalyticsOverviewModel(insights, {
    getAttemptHeadline: (attempt) => getAttemptHeadline(attempt, { mockExamTopicId: MOCK_EXAM_TOPIC_ID, getTopicNameById }),
    formatModeLabel,
    formatRelativeTime,
    formatDateTime,
  });
  const recommendation = buildAnalyticsRecommendationModel(insights);

  if (overviewCard) {
    overviewCard.classList.remove("high", "medium", "low");
    overviewCard.classList.add(overview.tone);
  }
  if (overviewReadiness) {
    overviewReadiness.textContent = overview.title;
  }
  if (overviewNarrative) {
    overviewNarrative.textContent = overview.narrative;
  }
  if (overviewSignals) {
    renderChipList(overviewSignals, overview.signalChips);
  }
  if (overviewLatest) {
    overviewLatest.textContent = overview.latestText;
  }
  if (overviewScore) {
    overviewScore.textContent = overview.scoreText;
  }
  if (overviewStreak) {
    overviewStreak.textContent = overview.streakText;
  }
  if (overviewAttempts) {
    overviewAttempts.textContent = overview.attemptsText;
  }

  if (trendList) {
    trendList.innerHTML = buildAnalyticsTrendHtml(insights.trendItems, { escapeHtml });
  }

  if (consistencyList) {
    consistencyList.innerHTML = buildAnalyticsConsistencyHtml(insights.weeklyConsistency, { escapeHtml });
  }

  if (heatmapGrid) {
    heatmapGrid.innerHTML = buildAnalyticsHeatmapHtml(insights.topicMastery, {
      escapeHtml,
      getTrafficClassByPercentage,
    });
  }

  if (recommendationTitle) {
    recommendationTitle.textContent = recommendation.title;
  }
  if (recommendationMeta) {
    recommendationMeta.textContent = recommendation.meta;
  }
  if (recommendationSignals) {
    renderChipList(recommendationSignals, recommendation.signalChips);
  }
  if (recommendationConfidence) {
    recommendationConfidence.classList.remove("high", "medium", "low");
    recommendationConfidence.classList.add(["high", "medium", "low"].includes(recommendation.confidenceTone) ? recommendation.confidenceTone : "medium");
    renderConfidenceText(recommendationConfidence, recommendation.confidenceLabel, recommendation.confidenceDescription);
  }
}

function renderDashboardStats(insights) {
  const totalAttemptsStat = document.getElementById("totalAttemptsStat");
  const averageScoreStat = document.getElementById("averageScoreStat");
  const streakStat = document.getElementById("streakStat");
  const streakStatusBadge = document.getElementById("streakStatusBadge");
  const stats = buildDashboardStatsModel(insights);

  if (totalAttemptsStat) totalAttemptsStat.textContent = stats.totalAttemptsText;
  if (averageScoreStat) averageScoreStat.textContent = stats.averageScoreText;
  if (streakStat) streakStat.textContent = stats.streakText;
  if (streakStatusBadge) streakStatusBadge.textContent = stats.streakBadgeText;
}

function refreshDashboardInsights() {
  const summary = readProgressSummary();
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  const insights = buildAppAnalyticsSnapshot(attempts);
  recommendedTopicId = String(insights?.recommendedTopicId || "").trim() || null;
  renderDashboardStats(insights);
  renderAnalyticsScreen(insights);
  renderDashboardRecommendationSetup(insights);
  renderSupportStateCards(insights);
  syncRetryMissedButtonState();
  syncSpacedPracticeButtonState();
  syncRevisionButtonState();
  renderBookmarkManager();
  return insights;
}

function getActiveDashboardSetupSuggestion(insights) {
  const topic = getPreferredRecommendedTopic(insights, {
    topics: cachedTopics,
    fallbackTopicId: recommendedTopicId,
    isTopicUnlocked,
  });
  if (!topic) return null;

  const suggestion = buildDashboardSetupSuggestion(topic, insights, {
    normalizeStudyFilters,
    resolveStudyQuestionCount,
    getAttemptTimingSignal,
    formatDifficultyLabel,
    formatTargetGlBandLabel,
    formatQuestionFocusLabel,
    mockExamTopicId: MOCK_EXAM_TOPIC_ID,
  });
  const signature = buildDashboardSuggestionSignature(topic, suggestion);
  const dismissedSignature = readDismissedDashboardRecommendationSignature(getCurrentUser());
  if (!suggestion || !signature || signature === dismissedSignature) return null;
  return { topic, suggestion, signature };
}

function renderDashboardRecommendationSetup(insights) {
  const recommendation = buildAnalyticsRecommendationModel(insights);
  const title = document.getElementById("recommendedTopicTitle");
  const meta = document.getElementById("recommendedTopicMeta");
  const chipsContainer = document.getElementById("recommendedTopicChips");
  const setupMeta = document.getElementById("recommendedTopicSetupMeta");
  const signalChips = document.getElementById("recommendedTopicSignalChips");
  const confidence = document.getElementById("recommendedTopicConfidence");
  const clearButton = document.getElementById("clearRecommendedSetupBtn");
  const active = getActiveDashboardSetupSuggestion(insights);
  const suggestion = active?.suggestion || null;

  if (title) title.textContent = recommendation.title;
  if (meta) meta.textContent = recommendation.meta;
  renderChipList(chipsContainer, suggestion?.chips || []);
  if (setupMeta) {
    setupMeta.textContent = suggestion ? `Suggested setup: ${suggestion.message}` : "";
    setupMeta.classList.toggle("hidden", !suggestion);
  }
  renderChipList(signalChips, suggestion?.signalChips || []);
  if (confidence) {
    confidence.classList.remove("high", "medium", "low");
    if (suggestion) {
      const tone = String(suggestion.confidenceTone || "medium").trim().toLowerCase();
      confidence.classList.add(["high", "medium", "low"].includes(tone) ? tone : "medium");
      renderConfidenceText(confidence, suggestion.confidenceLabel, suggestion.confidenceDescription);
    } else {
      renderConfidenceText(confidence, "");
    }
  }
  if (clearButton) {
    clearButton.classList.toggle("hidden", !suggestion);
    clearButton.onclick = suggestion
      ? () => {
          writeDismissedDashboardRecommendationSignature(getCurrentUser(), active.signature);
          renderDashboardRecommendationSetup(insights);
        }
      : null;
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

  const summary = readProgressSummary();
  const insights = buildAppAnalyticsSnapshot(summary.attempts || []);
  const activeDashboardSetup = getActiveDashboardSetupSuggestion(insights);
  const topic = activeDashboardSetup?.topic || getPreferredRecommendedTopic(insights, {
    topics: cachedTopics,
    fallbackTopicId: recommendedTopicId,
    isTopicUnlocked,
  }) || cachedTopics[0];
  const activeDashboardSetupSuggestion = activeDashboardSetup?.suggestion || null;
  const nextTopic = activeDashboardSetupSuggestion
    ? {
        ...topic,
        studyFilters: {
          ...normalizeStudyFilters(topic?.studyFilters, {
            totalQuestions: topic?.availableStudyFilters?.totalQuestions,
            defaultQuestionCount: topic?.availableStudyFilters?.defaultQuestionCount || 40,
          }),
          ...activeDashboardSetupSuggestion.nextFilters,
        },
        sessionSetupSuggestion: {
          title: activeDashboardSetupSuggestion.title,
          message: activeDashboardSetupSuggestion.message,
          chips: Array.isArray(activeDashboardSetupSuggestion.chips) ? activeDashboardSetupSuggestion.chips : [],
          signalChips: Array.isArray(activeDashboardSetupSuggestion.signalChips) ? activeDashboardSetupSuggestion.signalChips : [],
          confidenceLabel: String(activeDashboardSetupSuggestion.confidenceLabel || "").trim(),
          confidenceTone: String(activeDashboardSetupSuggestion.confidenceTone || "medium").trim(),
          confidenceDescription: String(activeDashboardSetupSuggestion.confidenceDescription || "").trim(),
        },
      }
    : topic;

  await handleTopicSelect(nextTopic);
}

function syncRetryMissedButtonState() {
  const retryMissedBtn = document.getElementById("retryMissedBtn");
  const queueCount = getRetryMissedQueueCount();
  renderUtilityActionButton(
    retryMissedBtn,
    "Retry Missed",
    queueCount,
    "Complete a quiz to build your retry queue.",
  );
  renderSupportStateCards();
}

function syncSpacedPracticeButtonState() {
  const spacedPracticeBtn = document.getElementById("spacedPracticeBtn");
  const dueCount = getSpacedPracticeDueCount();
  renderUtilityActionButton(
    spacedPracticeBtn,
    "Spaced Practice",
    dueCount,
    "Finish more sessions to schedule spaced review.",
  );
  renderSupportStateCards();
}
async function startRetryMissedSession() {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }

  const retryQuestions = getRetryMissedQuestions(40);
  if (!retryQuestions.length) {
    showWarning("No missed-question queue yet. Complete a quiz to build your retry set.");
    syncRetryMissedButtonState();
    return;
  }

  currentTopic = { ...RETRY_MISSED_TOPIC };
  setCurrentTopic(currentTopic);
  setCurrentMode("practice");

  await runOperationWithFeedback(
    () => loadQuestions(retryQuestions),
    {
      loadingMessage: "Loading retry-missed queue...",
      successMessage: "",
      failurePrefix: "Unable to start retry-missed session:",
    },
  );
}

async function startSpacedPracticeSession() {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }

  const spacedQuestions = await getSpacedPracticeQuestions(40);
  if (!spacedQuestions.length) {
    showWarning("No due spaced-practice questions yet. Keep practicing and check back shortly.");
    syncSpacedPracticeButtonState();
    return;
  }

  currentTopic = { ...SPACED_PRACTICE_TOPIC };
  setCurrentTopic(currentTopic);
  setCurrentMode("practice");

  await runOperationWithFeedback(
    () => loadQuestions(spacedQuestions),
    {
      loadingMessage: "Loading spaced-practice queue...",
      successMessage: "",
      failurePrefix: "Unable to start spaced practice session:",
    },
  );
}

function syncRevisionButtonState() {
  const revisionModeBtn = document.getElementById("revisionModeBtn");
  const queueCount = getFlaggedQueueCount();
  renderUtilityActionButton(
    revisionModeBtn,
    "Revision (Flagged)",
    queueCount,
    "Flag questions during a quiz to review them here.",
  );
}

async function startRevisionSession() {
  const flaggedQuestions = getFlaggedQuestions(40);
  if (!flaggedQuestions.length) {
    showWarning("No flagged questions yet. Flag questions during a quiz to review them here.");
    syncRevisionButtonState();
    return;
  }

  currentTopic = { ...REVISION_TOPIC };
  setCurrentTopic(currentTopic);
  setCurrentMode("practice");

  await runOperationWithFeedback(
    () => loadQuestions(flaggedQuestions),
    {
      loadingMessage: "Loading flagged questions...",
      successMessage: "",
      failurePrefix: "Unable to start revision session:",
    },
  );
}

// Bookmark Manager functions
function renderBookmarkManager() {
  const shell = document.getElementById("bookmarkManagerShell");
  const list = document.getElementById("bookmarkManagerList");
  const countEl = document.getElementById("bookmarkManagerCount");
  const startBtn = document.getElementById("startBookmarkReviewBtn");
  const clearBtn = document.getElementById("clearBookmarksBtn");

  if (!shell || !list) return;

  const bookmarked = getBookmarkedQuestions(100);
  
  if (bookmarked.length === 0) {
    shell.classList.add("hidden");
    return;
  }

  shell.classList.remove("hidden");
  countEl.textContent = `${bookmarked.length} question${bookmarked.length === 1 ? "" : "s"} saved for later review.`;

  list.innerHTML = "";
  bookmarked.forEach((q, index) => {
    const item = document.createElement("div");
    item.className = "bookmark-manager-item";
    item.innerHTML = `
      <span class="question-preview">${escapeHtml(q.question || "")}</span>
      <span class="topic-label">${escapeHtml(q.sourceTopicName || "Unknown")}</span>
      <button class="remove-bookmark" data-index="${index}" title="Remove bookmark">&times;</button>
    `;
    list.appendChild(item);
  });

  // Add remove handlers
  list.querySelectorAll(".remove-bookmark").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      if (Number.isFinite(idx) && bookmarked[idx]) {
        toggleBookmarkedQuestion(bookmarked[idx], { id: bookmarked[idx].sourceTopicId, name: bookmarked[idx].sourceTopicName });
        renderBookmarkManager();
      }
    });
  });

  // Start review button
  if (startBtn) {
    startBtn.onclick = async () => {
      const questions = getBookmarkedQuestions(40);
      if (!questions.length) {
        showWarning("No bookmarked questions to review.");
        return;
      }
      currentTopic = { ...REVISION_TOPIC };
      setCurrentTopic(currentTopic);
      setCurrentMode("practice");
      await runOperationWithFeedback(
        () => loadQuestions(questions),
        {
          loadingMessage: "Loading bookmarked questions...",
          successMessage: "",
          failurePrefix: "Unable to start review session:",
        },
      );
    };
  }

  // Clear all button
  if (clearBtn) {
    clearBtn.onclick = () => {
      const confirmed = window.confirm("Remove all bookmarked questions?");
      if (!confirmed) return;
      const all = getBookmarkedQuestions(1000);
      all.forEach((q) => {
        toggleBookmarkedQuestion(q, { id: q.sourceTopicId, name: q.sourceTopicName });
      });
      renderBookmarkManager();
    };
  }
}

function initializeReviewMistakesControls() {
  const topicFilter = document.getElementById("reviewMistakesTopicFilter");
  const subcategoryFilter = document.getElementById("reviewMistakesSubcategoryFilter");
  const difficultyFilter = document.getElementById("reviewMistakesDifficultyFilter");
  const startBtn = document.getElementById("reviewMistakesStartBtn");
  const clearFiltersBtn = document.getElementById("reviewMistakesClearFiltersBtn");
  const list = document.getElementById("reviewMistakesList");

  if (topicFilter) {
    topicFilter.addEventListener("change", () => {
      reviewMistakesFilters.topic = String(topicFilter.value || "all");
      renderReviewMistakesScreen();
    });
  }

  if (subcategoryFilter) {
    subcategoryFilter.addEventListener("change", () => {
      reviewMistakesFilters.subcategory = String(subcategoryFilter.value || "all");
      renderReviewMistakesScreen();
    });
  }

  if (difficultyFilter) {
    difficultyFilter.addEventListener("change", () => {
      reviewMistakesFilters.difficulty = String(difficultyFilter.value || "all");
      renderReviewMistakesScreen();
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startRetryMissedSession();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      resetReviewMistakesFilters();
      renderReviewMistakesScreen();
    });
  }

  if (list) {
    list.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("[data-review-action]");
      if (!actionButton) return;
      const action = String(actionButton.dataset.reviewAction || "").trim();
      if (!action) return;

      if (action === "open-login") {
        openAuthModal("login");
        return;
      }

      if (action === "open-dashboard") {
        await showScreen("topicSelectionScreen");
        return;
      }

      if (action === "open-analytics") {
        await showScreen("analyticsScreen");
        return;
      }

      if (action === "clear-filters") {
        resetReviewMistakesFilters();
        renderReviewMistakesScreen();
        return;
      }

      if (action === "retry-queue") {
        startRetryMissedSession();
        return;
      }

      if (action === "open-topic") {
        const topicId = String(actionButton.dataset.topicId || "").trim();
        const topic = cachedTopics.find((entry) => String(entry?.id || "").trim() === topicId);
        if (!topic) {
          showWarning("This topic is not currently available.");
          return;
        }
        await handleTopicSelect(topic);
        return;
      }

      if (action === "dismiss") {
        const entryId = String(actionButton.dataset.entryId || "").trim();
        const removed = dismissRetryMissedQuestion(entryId);
        if (removed) {
          showSuccess("Removed from your review queue.");
        } else {
          showWarning("That question is no longer in the queue.");
        }
        renderReviewMistakesScreen();
        refreshDashboardInsights();
      }
    });
  }
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
    studyFilters: currentTopic?.studyFilters || null,
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
        studyFilters: runtime?.topic?.studyFilters || null,
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
          studyFilters: saved.studyFilters || null,
        };
        currentTopic = hydratedTopic;
        setCurrentTopic(hydratedTopic);
        applySessionSetupState(hydratedTopic);
      }
    }
    await showScreen("modeSelectionScreen");
    showWarning("Session was restored. Return to Session Setup to continue.");
    return true;
  }

  if (savedScreenId === "resultsScreen") {
    await showScreen("modeSelectionScreen");
    showWarning("Results cannot be restored after refresh. Return to Session Setup to continue.");
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
        studyFilters: saved.studyFilters || null,
      };
      currentTopic = hydratedTopic;
      setCurrentTopic(hydratedTopic);
      await selectTopic(hydratedTopic);
      applySessionSetupState(hydratedTopic);
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
    renderAdminFeedbackList();
    await refreshAdminUserDirectory();
    await refreshAdminFeedbackSubmissions();
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

  const topicSearchInput = document.getElementById("topicSearch");
  if (topicSearchInput) {
    topicSearchInput.addEventListener("input", () => {
      topicSearchQuery = topicSearchInput.value;
      applyTopicFilters();
    });
  }

  const dashboardSpacedPracticeBtn = document.getElementById("spacedPracticeBtn");
  const retryMissedBtn = document.getElementById("retryMissedBtn");
  const dashboardRevisionBtn = document.getElementById("revisionModeBtn");

  if (retryMissedBtn) {
    retryMissedBtn.addEventListener("click", () => {
      startRetryMissedSession();
    });
  }

  if (dashboardRevisionBtn) {
    dashboardRevisionBtn.addEventListener("click", () => {
      startRevisionSession();
    });
  }

  if (dashboardSpacedPracticeBtn) {
    dashboardSpacedPracticeBtn.addEventListener("click", () => {
      startSpacedPracticeSession();
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


function isTopicUnlocked(topic) {
  if (topic?.id === MOCK_EXAM_TOPIC_ID) {
    const entitlement = getCurrentEntitlement();
    if (entitlement.id === "premium") return true;
    const status = getFreeMockExamEligibility();
    return Boolean(status?.allowed);
  }
  if (topic?.requiresPremium) {
    const entitlement = getCurrentEntitlement();
    return entitlement.id === "premium";
  }
  const unlocked = getAccessibleTopics(allTopics);
  return unlocked.some((entry) => entry.id === topic?.id);
}

async function handleTopicSelect(topic, options = {}) {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }
  if (!isTopicUnlocked(topic)) {
    openPremiumModal();
    return;
  }

  let nextTopic = topic;
  if (topic?.id === MOCK_EXAM_TOPIC_ID) {
    const templates = getMockExamTemplatesForUi();
    const requestedTemplateId = String(
      options?.selectedTemplateId || topic?.selectedTemplateId || pendingMockExamTemplateId || DEFAULT_MOCK_EXAM_TEMPLATE_ID,
    );
    const selectedTemplate =
      templates.find((template) => template?.id === requestedTemplateId) ||
      templates.find((template) => template?.id === DEFAULT_MOCK_EXAM_TEMPLATE_ID) ||
      templates[0] ||
      null;

    if (selectedTemplate) {
      nextTopic = buildTopicWithSelectedMockTemplate(topic, selectedTemplate);
      pendingMockExamTemplateId = String(selectedTemplate.id || DEFAULT_MOCK_EXAM_TEMPLATE_ID);
    }
  }

  currentTopic = nextTopic;
  setCurrentTopic(nextTopic);
  const shouldSkipSelect =
    Boolean(options?.autoStartMode) && nextTopic?.id === MOCK_EXAM_TOPIC_ID;
  if (!shouldSkipSelect) {
    try {
      await runOperationWithFeedback(
        () => selectTopic(nextTopic),
        {
          loadingMessage: "Loading topic content...",
          successMessage: "",
          failurePrefix: "Unable to load topic:",
        },
      );
    } catch (error) {
      return;
    }
  }

  if (options?.autoStartMode) {
    startQuiz(options.autoStartMode);
    return;
  }

  const practiceModeCard = document.getElementById("practiceModeCard");
  const examModeCard = document.getElementById("examModeCard");
  const reviewModeCard = document.getElementById("reviewModeCard");
  const startMockExamBtn = document.getElementById("startMockExamBtn");

  if (practiceModeCard) practiceModeCard.onclick = () => startQuiz("practice");
  if (examModeCard) examModeCard.onclick = () => startQuiz("exam");
  if (reviewModeCard) reviewModeCard.onclick = () => startQuiz("review");
  if (startMockExamBtn) startMockExamBtn.onclick = () => startQuiz("exam");
applySessionSetupState(currentTopic);
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
  syncStudyFiltersToCurrentTopic({
    questionCount: document.getElementById("studyQuestionCountSelect")?.value,
    difficulty: document.getElementById("studyDifficultySelect")?.value,
    sourceDocument: document.getElementById("studySourceDocumentSelect")?.value,
    questionFocus: document.getElementById("studyQuestionFocusSelect")?.value,
    targetGlBand: document.getElementById("studyTargetGlBandSelect")?.value,
  });
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
  const migrationForm = document.getElementById("migrationForm");
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
  if (modal) modal.classList.add("hidden");
  setAuthMessage("");
}

function openPremiumModal() {
  const modal = document.getElementById("premiumModal");
  if (modal) modal.classList.remove("hidden");
}

function closePremiumModal() {
  const modal = document.getElementById("premiumModal");
  if (modal) modal.classList.add("hidden");
}

function closePricingModal() {
  const modal = document.getElementById("pricingModal");
  if (modal) modal.classList.add("hidden");
}

function setMigrationMessage(message = "", type = "error") {
  const migrationMessage = document.getElementById("migrationMessage");
  if (!migrationMessage) return;
  if (!message) {
    migrationMessage.textContent = "";
    migrationMessage.className = "auth-message hidden";
    return;
  }
  migrationMessage.textContent = message;
  migrationMessage.className = `auth-message ${type}`;
}

function clearMigrationQueryParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("migration");
    window.history.replaceState({}, document.title, url.toString());
  } catch (error) {
    // Ignore URL cleanup issues.
  }
}

function openMigrationModal(details = {}, { mode = "token" } = {}) {
  const modal = document.getElementById("migrationModal");
  const emailHint = document.getElementById("migrationEmailHint");
  const title = document.getElementById("migrationModalTitle");
  const intro = document.getElementById("migrationModalIntro");
  const submitButton = document.querySelector("#migrationForm button[type='submit']");
  if (!modal) return;
  pendingMigrationMode = mode;
  if (title) {
    title.textContent = mode === "firebase-session"
      ? "Update Your Password"
      : mode === "cloudflare-session"
        ? "Change Your Password"
        : "Set Your New Password";
  }
  if (intro) {
    intro.textContent = mode === "firebase-session"
      ? "You're signed in. To keep access seamless, set a new password now for future sign-ins."
      : mode === "cloudflare-session"
        ? "You're signed in with your new account. Choose a fresh password now and we'll keep you signed in."
        : "Use your one-time secure link to set a new password and continue signing in to your account.";
  }
  if (submitButton) {
    submitButton.textContent = mode === "cloudflare-session" ? "Save new password" : "Save password and sign in";
  }
  if (emailHint) {
    const email = String(details?.email || "").trim();
    const expiresAt = String(details?.expiresAt || "").trim();
    emailHint.textContent = email
      ? `Account: ${email}${mode === "token" && expiresAt ? ` ? Link expires ${formatDateTime(expiresAt)}` : ""}`
      : mode === "firebase-session" || mode === "cloudflare-session"
        ? "Set a new password for this account."
        : "Use this one-time secure link to choose your new password.";
  }
  setMigrationMessage("");
  modal.classList.remove("hidden");
}

function closeMigrationModal({ clearToken = false } = {}) {
  const modal = document.getElementById("migrationModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  const form = document.getElementById("migrationForm");
  if (form) {
    form.reset();
  }
  setMigrationMessage("");
  if (clearToken) {
    pendingMigrationToken = "";
    clearMigrationQueryParam();
  }
  pendingMigrationMode = "token";
}

async function handleMigrationLinkOnStartup() {
  const token = new URLSearchParams(window.location.search || "").get("migration");
  if (!token) return false;
  pendingMigrationToken = String(token || "").trim();
  if (!pendingMigrationToken) return false;
  try {
    const payload = await resolveCloudflareMigrationToken(pendingMigrationToken);
    openMigrationModal(payload?.migration || {}, { mode: "token" });
    return true;
  } catch (error) {
    openAuthModal("login");
    setAuthMessage(error?.message || "Password setup link is unavailable.");
    clearMigrationQueryParam();
    pendingMigrationToken = "";
    return false;
  }
}

function ensureAuthPromptOnStartup() {
  const modal = document.getElementById("authModal");
  if (!modal || !modal.classList.contains("hidden")) return;
  if (getCurrentUser()) return;
  openAuthModal("login");
}

// ── Password Reset Token Handling ─────────────────────────────────────────
let pendingPasswordResetToken = "";

function clearPasswordResetQueryParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
  } catch (_) {}
}

async function handlePasswordResetLinkOnStartup() {
  const token = new URLSearchParams(window.location.search || "").get("token");
  if (!token) return false;
  pendingPasswordResetToken = String(token || "").trim();
  if (!pendingPasswordResetToken) return false;

  // Show the password reset screen directly
  const resetScreen = document.getElementById("resetPasswordScreen");
  const messageEl = document.getElementById("resetPasswordMessage");
  if (messageEl) {
    messageEl.textContent = "Enter your new password below.";
  }
  showScreen("resetPasswordScreen");
  clearPasswordResetQueryParam();
  return true;
}

async function handlePasswordResetSubmit(event) {
  event.preventDefault();
  const newPassword = document.getElementById("resetNewPassword")?.value || "";
  const confirmPassword = document.getElementById("resetConfirmPassword")?.value || "";
  const errorEl = document.getElementById("resetPasswordError");

  if (!pendingPasswordResetToken) {
    if (errorEl) {
      errorEl.textContent = "Invalid or expired reset link. Please request a new one.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  if (newPassword.length < 8) {
    if (errorEl) {
      errorEl.textContent = "Password must be at least 8 characters.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (errorEl) {
      errorEl.textContent = "Passwords do not match.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  try {
    const cfg = getFirebaseConfig();
    const authApiBase = cfg.cloudflareAuthBaseUrl || "";
    if (!authApiBase) {
      throw new Error("Auth API is not configured.");
    }
    const response = await fetch(`${authApiBase}/auth/password/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: pendingPasswordResetToken,
        password: newPassword,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || result?.message || "Password reset failed.");
    }

    // Store the session
    if (result.session) {
      sessionStorage.setItem("cbt_session_token", result.session);
    }
    if (result.user) {
      localStorage.setItem("cbt_current_user", JSON.stringify(result.user));
    }

    pendingPasswordResetToken = "";
    showSuccess("Password reset successfully! You are now signed in.");
    await updateAuthUI();
    closeAuthModal();
    showScreen("topicSelectionScreen");
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || "Password reset failed. Please try again.";
      errorEl.classList.remove("hidden");
    }
  }
}

function initializePasswordResetScreen() {
  const resetForm = document.getElementById("resetPasswordForm");
  if (resetForm) {
    resetForm.addEventListener("submit", handlePasswordResetSubmit);
  }
  const backBtn = document.getElementById("resetPasswordBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      pendingPasswordResetToken = "";
      openAuthModal("login");
    });
  }
}

function getMockExamTemplatesForUi() {
  const loadedTemplates = isFeatureEnabled("enableGlBandTemplateUi")
    ? getVisibleExamTemplates()
    : [];
  if (loadedTemplates.length) {
    return loadedTemplates;
  }

  const fallbackTemplate = getExamTemplateById(DEFAULT_MOCK_EXAM_TEMPLATE_ID);
  if (fallbackTemplate) {
    return [fallbackTemplate];
  }

  return [
    {
      id: DEFAULT_MOCK_EXAM_TEMPLATE_ID,
      name: "General Mock",
      description: "Balanced directorate mock across all 10 core topics.",
      glBand: "general",
      totalQuestions: 40,
      timeLimitMin: 45,
      visible: true,
    },
  ];
}

function getFreeTierNoticeStorageKey(user) {
  const identifier = user?.id || user?.email || "guest";
  return `${FREE_TIER_NOTICE_STORAGE_PREFIX}_${identifier}`;
}

function setFreeTierNoticeContent(entitlement) {
  const list = document.getElementById("freeTierLimitList");
  if (!list) return;
  const items = [];
  if (entitlement?.maxTopics) {
    items.push(
      `Up to ${entitlement.maxTopics} topic${entitlement.maxTopics === 1 ? "" : "s"} at a time.`,
    );
  }
  if (entitlement?.maxSubcategories) {
    items.push(`Up to ${entitlement.maxSubcategories} subtopics per topic.`);
  }
  if (entitlement?.maxQuestionsPerSubcategory) {
    items.push(`Up to ${entitlement.maxQuestionsPerSubcategory} questions per subtopic.`);
  }
  items.push("1 weekly free mock exam attempt (resets every 7 days from your registration time).");
  items.push("Upgrade to unlock full access and premium features.");
  list.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function openFreeTierNotice() {
  const modal = document.getElementById("freeTierModal");
  if (!modal) return;
  const checkbox = document.getElementById("freeTierDontShowAgain");
  if (checkbox) checkbox.checked = false;
  modal.classList.remove("hidden");
}

function closeFreeTierNotice() {
  const modal = document.getElementById("freeTierModal");
  if (!modal) return;
  const checkbox = document.getElementById("freeTierDontShowAgain");
  if (checkbox?.checked) {
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(getFreeTierNoticeStorageKey(user), "true");
    }
  }
  modal.classList.add("hidden");
}

function showFreeTierNoticeIfNeeded() {
  const user = getCurrentUser();
  if (!user) return;
  const entitlement = getCurrentEntitlement();
  if (!entitlement || entitlement.id !== "free") return;
  const key = getFreeTierNoticeStorageKey(user);
  if (localStorage.getItem(key) === "true") return;
  setFreeTierNoticeContent(entitlement);
  openFreeTierNotice();
}

async function refreshAccessibleTopics() {
  cachedTopics = allTopics;
  await displayTopics(cachedTopics, handleTopicSelect);
  applyTopicFilters();
}

async function refreshUserUpgradeStatus() {
  const container = document.getElementById("profileUpgradeStatus");
  if (!container) return;

  const user = getCurrentUser();
  if (!user?.email) {
    container.classList.add("hidden");
    clearElementContent(container);
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

  container.classList.remove("hidden");
  clearElementContent(container);

  if (!request) {
    appendMetaLine(container, "No payment confirmation has been submitted yet.");
    return;
  }

  const status = normalizeUpgradeRequestStatus(request.status);
  const statusLabel = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending Admin Review";
  const headerRow = document.createElement("div");
  headerRow.className = "button-row";
  const title = document.createElement("strong");
  title.textContent = "Payment Confirmation Status";
  const badge = document.createElement("span");
  badge.className = "admin-badge " + statusBadgeClass(status);
  badge.textContent = statusLabel;
  headerRow.appendChild(title);
  headerRow.appendChild(badge);
  container.appendChild(headerRow);
  appendMetaLine(container, "Submitted: " + formatDateTime(request.submittedAt || request.createdAt));
  appendMetaLine(container, "Reference: " + (request.reference || "-"));
  appendMetaLine(container, "Amount: " + (request.amount || "-"));
  if (request.note) appendMetaLine(container, "Note: " + request.note);
  if (request.reviewNote) appendMetaLine(container, "Review note: " + request.reviewNote);
  if (request.reviewedAt) appendMetaLine(container, "Reviewed: " + formatDateTime(request.reviewedAt));
}

async function renderProfilePaymentHistory() {

  const container = document.getElementById("profilePaymentList");
  if (!container) return;

  const user = getCurrentUser();
  if (!user?.email) {
    container.innerHTML = '<p class="hero-meta">Login to view payment history.</p>';
    return;
  }

  const [
    paymentUi,
    paymentService,
  ] = await Promise.all([
    import("./paymentFlutterwave.js"),
    import("./paymentFlutterwaveService.js"),
  ]);

  const openReceipt = (receipt) =>
    paymentUi.openPaymentReceiptLightbox(receipt, {
      onStartStudying: () => showScreen("topicSelectionScreen"),
    });

  const localReceipts = paymentUi.renderLocalPaymentHistory(user.email, container, {
    onReceipt: openReceipt,
  });

  let payload = null;
  try {
    const token = await getCurrentAuthToken();
    payload = await paymentService.getCurrentUserPaymentHistory(token);
  } catch (error) {
    if (!localReceipts.length) {
      container.innerHTML =
        '<p class="hero-meta">No payment history yet. Upgrade to Premium to get started.</p>';
    }
    return;
  }

  const payments = Array.isArray(payload?.payments)
    ? payload.payments.map(paymentService.normalizePaymentReceipt)
    : [];
  if (!payments.length) {
    if (!localReceipts.length) {
      container.innerHTML =
        '<p class="hero-meta">No payment history yet. Upgrade to Premium to get started.</p>';
    }
    return;
  }

  container.innerHTML = payments
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0))
    .map((receipt, index) => {
      const status = String(receipt.status || "successful").toLowerCase();
      const badgeClass = status === "successful" || status === "success" ? "approved" : "pending";
      return `
        <div class="payment-history-row">
          <span>${escapeHtml(formatDateTime(receipt.createdAt))}</span>
          <strong>${escapeHtml(paymentUi.formatPlanCycleLabel(receipt.billingCycle) || "-")}</strong>
          <span>${escapeHtml(paymentUi.formatPaymentAmount(receipt.amount, receipt.currency))}</span>
          <span class="admin-badge ${badgeClass}">${escapeHtml(status || "successful")}</span>
          <button class="btn btn-ghost btn-sm" data-payment-receipt-index="${index}" type="button">Receipt</button>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-payment-receipt-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const receipt = payments[Number(button.getAttribute("data-payment-receipt-index"))];
      if (receipt) openReceipt(receipt);
    });
  });
}

function getHeaderPlanLabel(user) {
  if (!user) return "Guest";
  if (isCurrentUserAdmin()) return "Admin";
  return user.plan === "premium" ? "Premium" : "Free";
}

function renderHeaderSummary(container, user) {
  if (!container) return "";
  clearElementContent(container);
  const headerModel = buildHeaderSummaryModel({
    user,
    planLabel: getHeaderPlanLabel(user),
  });
  const userLine = document.createElement("span");
  userLine.className = "summary-user-line";
  userLine.textContent = headerModel.displayName;
  const pillRow = document.createElement("span");
  pillRow.className = "summary-pill-row";
  headerModel.pills.forEach((entry) => {
    const pill = document.createElement("span");
    pill.className = entry.className;
    pill.textContent = entry.text;
    pillRow.appendChild(pill);
  });
  container.appendChild(userLine);
  container.appendChild(pillRow);
  return getAuthSummaryLabel() + ". " + headerModel.syncTitle;
}

// Refresh only the header summary (auth pill row) so the sync pill stays in
// step with the profile sync status after a background sync attempt — without
// re-rendering the whole auth UI.
function refreshHeaderSummary() {
  const container = document.getElementById("authToolbarSummary");
  if (!container) return;
  const user = getCurrentUser();
  if (!user) {
    container.textContent = "";
    container.classList.add("hidden");
    container.removeAttribute("title");
    container.removeAttribute("aria-label");
    return;
  }
  const headerSummaryTitle = renderHeaderSummary(container, user);
  container.classList.remove("hidden");
  container.setAttribute("title", headerSummaryTitle);
  container.setAttribute("aria-label", headerSummaryTitle);
}

function updateAuthUI() {
  const user = getCurrentUser();

  const authActionBtn = document.getElementById("authActionBtn");
  const authActionIcon = document.getElementById("authActionIcon");
  const authToolbarSummary = document.getElementById("authToolbarSummary");
  const headerAdminBtn = document.getElementById("headerAdminBtn");
  const headerProfileBtn = document.getElementById("headerProfileBtn");
  const authModeHint = document.getElementById("authModeHint");
  const authModalIntro = document.getElementById("authModalIntro");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
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
      const headerSummaryTitle = renderHeaderSummary(authToolbarSummary, user);
      authToolbarSummary.classList.remove("hidden");
      authToolbarSummary.setAttribute("title", headerSummaryTitle);
      authToolbarSummary.setAttribute("aria-label", headerSummaryTitle);
    } else {
      authToolbarSummary.textContent = "";
      authToolbarSummary.classList.add("hidden");
      authToolbarSummary.removeAttribute("title");
      authToolbarSummary.removeAttribute("aria-label");
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
  {
    const cloudConfigMissing = isCloudAuthMisconfigured();
    const configuredProvider = getAuthProviderLabel("configured");
    const activeProvider = getAuthProviderLabel();
    const supportsLegacyFirebaseRecovery = isCloudAuthEnabled();
    const supportsSignedInCloudflarePasswordChange = Boolean(user) && (activeProvider === "Hybrid" || activeProvider === "Cloudflare");

    if (authModeHint) {
      authModeHint.textContent = cloudConfigMissing
        ? "Auth mode: Cloud required (runtime config missing)"
        : configuredProvider === "Cloud"
          ? "Auth mode: Cloud (multi-device)"
          : configuredProvider === "Hybrid"
            ? "Auth mode: Hybrid (Cloudflare primary, Firebase fallback)"
            : configuredProvider === "Cloudflare"
              ? "Auth mode: Cloudflare (migration phase)"
              : configuredProvider === "Demo"
                ? "Auth mode: Demo (single-device, no password storage)"
                : "Auth mode: Cloud required";
    }

    if (authModalIntro) {
      authModalIntro.textContent = cloudConfigMissing
        ? "Cloud authentication is required on this deployment."
        : configuredProvider === "Cloud" || configuredProvider === "Hybrid" || configuredProvider === "Cloudflare"
          ? "Register or login with your email to continue."
          : configuredProvider === "Demo"
            ? "Local demo access is available on this device only. Passwords are not stored."
            : "Cloud authentication is required on this deployment.";
    }

    if (!googleAuthEventsBound) {
      googleAuthEventsBound = true;
      window.addEventListener("google-login-success", async () => {
        try {
          updateAuthUI();
          closeAuthModal();
          try { await refreshAccessibleTopics(); } catch (e) { /* best-effort */ }
          try { startCloudPlanAutoSync(); } catch (e) { /* ignore */ }
          showSuccess("Signed in with Google.");
        } catch (err) {
          console.error("Error handling google-login-success:", err);
          showWarning("Signed in but UI update failed.");
        }
      });

      window.addEventListener("google-login-error", (evt) => {
        const detail = evt?.detail || {};
        const message = detail?.message || detail?.error || "Google sign-in failed.";
        showWarning(message);
      });
    }

    if (migrationForm) {
    migrationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!["firebase-session", "cloudflare-session"].includes(pendingMigrationMode) && !pendingMigrationToken) {
        setMigrationMessage("This password setup link is missing or has already been used.");
        return;
      }
      const password = document.getElementById("migrationPassword")?.value || "";
      const confirmPassword = document.getElementById("migrationConfirmPassword")?.value || "";
      if (password !== confirmPassword) {
        setMigrationMessage("Passwords do not match.");
        return;
      }
      try {
        await runOperationWithFeedback(
          async () => pendingMigrationMode === "firebase-session"
            ? bootstrapCloudflareMigrationFromFirebase(password)
            : pendingMigrationMode === "cloudflare-session"
              ? changeCloudflarePasswordForCurrentUser(password)
              : completeCloudflareMigrationToken(pendingMigrationToken, password),
          {
            loadingMessage: "Saving your new password...",
            successMessage: (output) => output?.payload?.warning || "Password set successfully.",
            failurePrefix: pendingMigrationMode === "cloudflare-session"
              ? "Unable to update password:"
              : "Unable to complete migration:",
          },
        );
        pendingMigrationToken = "";
        clearMigrationQueryParam();
        updateAuthUI();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        closeMigrationModal();
        closeAuthModal();
        await showScreen("topicSelectionScreen");
        showFreeTierNoticeIfNeeded();
      } catch (error) {
        setMigrationMessage(error?.message || (pendingMigrationMode === "cloudflare-session" ? "Unable to update password." : "Unable to complete migration."));
      }
    });
  }

  if (forgotPasswordBtn) {
      forgotPasswordBtn.classList.toggle("hidden", !supportsLegacyFirebaseRecovery);
      forgotPasswordBtn.disabled = !supportsLegacyFirebaseRecovery;
      forgotPasswordBtn.title = configuredProvider === "Hybrid"
        ? "If you're signed out, we'll either send a reset email or record a recovery request for follow-up."
        : forgotPasswordBtn.title;
    }

    if (changePasswordBtn) {
      const canUseChangePassword = supportsLegacyFirebaseRecovery || supportsSignedInCloudflarePasswordChange;
      changePasswordBtn.classList.toggle("hidden", !canUseChangePassword);
      changePasswordBtn.disabled = !canUseChangePassword;
      changePasswordBtn.title = supportsSignedInCloudflarePasswordChange
        ? "Choose a new password while signed in."
        : configuredProvider === "Hybrid"
          ? "If you're signed out, use Forgot password. If you're signed in, you can change it here."
          : changePasswordBtn.title;
    }
  }
  if (profileDisplayName) {
    profileDisplayName.textContent =
      user?.name || user?.displayName || user?.email || "Guest User";
  }
  if (profileSubtitle) {
    if (!user) {
      profileSubtitle.textContent = "Login to manage your profile";
    } else if (isCurrentUserAdmin()) {
      profileSubtitle.textContent = "Admin access";
    } else {
      profileSubtitle.textContent = getProfileSubscriptionLabel(user);
    }
  }
  if (profileAvatar) {
    const seed = user?.name || user?.displayName || user?.email || "GU";
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
  updateProfileDataSyncUI();
  renderFeedbackUiState();
  refreshProfileUpgradeSection().catch(() => {});
  renderPremiumCTA();
}

function renderPremiumCTA() {
  const user = getCurrentUser();
  const isFree = user && user.plan !== "premium" && !isCurrentUserAdmin();

  const headerUpgradeBtn = document.getElementById("headerUpgradeBtn");
  const premiumCtaCard = document.getElementById("premiumCtaCard");
  const resultsPremiumCta = document.getElementById("resultsPremiumCta");

  if (headerUpgradeBtn) headerUpgradeBtn.classList.toggle("hidden", !isFree);
  if (premiumCtaCard) premiumCtaCard.classList.toggle("hidden", !isFree);
  if (resultsPremiumCta) resultsPremiumCta.classList.toggle("hidden", !isFree);
}

function renderAdminOverrides() {
  const container = document.getElementById("adminOverrideList");
  if (!container) return;
  container.innerHTML = "";
  const overrides = getLocalPlanOverrides();
  const syncMeta = getPlanOverrideSyncMeta();
  const entries = Object.entries(overrides);
  const countLabel = document.getElementById("adminOverrideCount");
  if (countLabel) {
    countLabel.textContent = String(entries.length);
  }
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
    const safeUpdatedAt = status.updatedAt ? escapeHtml(formatDateTime(status.updatedAt)) : "";
    const safeWarning = status.warning ? `<div class="meta">${escapeHtml(status.warning)}</div>` : "";
    const card = document.createElement("div");
    card.className = "admin-request-item plan-override-item";
    card.innerHTML = `
      <div class="plan-override-item-main">
        <div class="plan-override-item-email"><strong>${safeEmail}</strong></div>
        <div class="meta">Override: <span class="admin-badge ${plan === "premium" ? "approved" : "pending"}">${safePlan}</span></div>
        <div class="meta">Sync: <span class="admin-badge ${syncBadgeClass}">${syncLabel}</span></div>
        ${safeUpdatedAt ? `<div class="meta">Updated: ${safeUpdatedAt}</div>` : ""}
        ${safeWarning}
      </div>
      <div class="button-row compact-actions">
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

  const searchInput = document.getElementById("adminRequestSearch");
  const statusFilter = document.getElementById("adminRequestStatusFilter");
  const sourceFilter = document.getElementById("adminRequestSourceFilter");
  const countLabel = document.getElementById("adminRequestCount");
  const query = String(searchInput?.value || "").trim().toLowerCase();
  const statusValue = String(statusFilter?.value || "all").toLowerCase();
  const sourceValue = String(sourceFilter?.value || "all").toLowerCase();

  const cloudRequests = adminDirectoryUsers
    .map((entry) => buildUpgradeRequestRecordFromDirectoryEntry(entry))
    .filter(Boolean);
  const localRequests = readUpgradeRequests();
  const requests = mergeUpgradeRequestRecords(cloudRequests, localRequests);
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
    countLabel.textContent = `${filtered.length}/${requests.length}`;
  }

  if (!filtered.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No Selar upgrade confirmations found yet.</p></div>';
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
        <th>Plan</th>
        <th>Reference</th>
        <th>Submitted</th>
        <th>Source</th>
        <th class="actions-col">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  filtered.forEach((request, index) => {
    const row = document.createElement("tr");
    const statusClass = statusBadgeClass(request.status);
    const sourceLabel = request.source === "cloud-profile" ? "Cloud Profile" : "Local Device";
    row.innerHTML = `
      <td class="email-cell">${escapeHtml(request.email || "-")}</td>
      <td><span class="admin-badge ${statusClass}">${escapeHtml(request.status || "pending")}</span></td>
      <td>${escapeHtml(request.amount || "-")}</td>
      <td>${escapeHtml(formatBillingCycleLabel(request.billingCycle) || "-")}</td>
      <td>${escapeHtml(request.reference || "-")}</td>
      <td>${escapeHtml(formatDateTime(request.submittedAt || request.createdAt))}</td>
      <td>${escapeHtml(sourceLabel)}</td>
      <td class="actions-col">
        <button class="btn btn-ghost action-btn" data-request-index="${index}" data-request-action="approve" type="button">Approve</button>
        <button class="btn btn-ghost action-btn" data-request-index="${index}" data-request-action="reject" type="button">Reject</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  container.innerHTML = "";
  container.appendChild(tableWrap);
  tableWrap.appendChild(table);

  tableWrap.querySelectorAll("[data-request-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const request = filtered[Number(button.getAttribute("data-request-index"))];
      const action = String(button.getAttribute("data-request-action") || "");
      if (!request?.email || !action) return;
      const nextStatus = action === "approve" ? "approved" : "rejected";
      const reviewNote = action === "approve"
        ? "Payment confirmation approved."
        : "Payment confirmation rejected.";
      try {
        const result = await runOperationWithFeedback(
          () => setUpgradeRequestStatus(request.email, nextStatus, reviewNote, request.billingCycle),
          {
            loadingMessage: `${action === "approve" ? "Approving" : "Rejecting"} payment confirmation...`,
            successMessage: () => `Payment confirmation ${nextStatus}.`,
            failurePrefix: "Unable to update request:",
          },
        );
        logAdminOperation({
          action: `${action === "approve" ? "Approve" : "Reject"} Selar confirmation`,
          target: request.email,
          status: result?.warning ? "warning" : "success",
          message: result?.warning || reviewNote,
        });
        await refreshAdminUserDirectory();
        renderAdminRequests();
        renderAdminOverrides();
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: `${action === "approve" ? "Approve" : "Reject"} Selar confirmation`,
          target: request.email,
          status: "failed",
          message: error?.message || "Unknown error.",
        });
        renderAdminOperationHistory();
      }
    });
  });
}

function refreshProfileUpgradeSection() {
  const provider = getPaymentProvider();
  const user = getCurrentUser();
  const isPremium = user?.plan === "premium";

  const upgradeShell = document.getElementById("profileUpgradeShell");
  const flutterwaveForm = document.getElementById("flutterwaveUpgradeForm");
  const paymentSection = document.getElementById("profilePaymentSection");
  const upgradeTitle = document.getElementById("profileUpgradeTitle");
  const upgradeSubtitle = document.getElementById("profileUpgradeSubtitle");
  const subscriptionInfo = document.getElementById("profileSubscriptionInfo");
  const subscriptionBadges = document.getElementById("profileSubscriptionBadges");

  if (isPremium) {
    // Premium users: hide upgrade shell, show payment history and subscription info
    if (upgradeShell) upgradeShell.style.display = "none";
    if (paymentSection) paymentSection.style.display = "";

    // Populate subscription info
    if (subscriptionInfo && subscriptionBadges) {
      subscriptionInfo.style.display = "";
      const cycleLabel = formatBillingCycleLabel(user?.billingCycle || user?.subscriptionType || user?.planInterval);
      const rawExpiry = String(user?.planExpiresAt || user?.subscriptionExpiresAt || user?.planExpiryAt || user?.expiresAt || "").trim();
      const subDate = user?.lastPaymentAt || user?.createdAt || "";

      let html = '';
      if (cycleLabel) {
        html += `<span class="admin-badge approved">Plan: ${escapeHtml(cycleLabel)}</span>`;
      }
      if (subDate && subDate !== "-") {
        html += `<span class="admin-badge approved">Subscribed: ${escapeHtml(formatDate(subDate))}</span>`;
      }
      if (rawExpiry) {
        const expiryDate = new Date(rawExpiry);
        if (!Number.isNaN(expiryDate.getTime())) {
          const diffMs = expiryDate.getTime() - Date.now();
          if (diffMs < 0) {
            html += `<span class="admin-badge rejected">Expired: ${escapeHtml(formatDateTime(rawExpiry))}</span>`;
          } else {
            const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
            const countdown = daysLeft <= 30 ? `${daysLeft} days left` : `${Math.ceil(daysLeft / 30)} months left`;
            const badgeClass = daysLeft <= EXPIRY_WARNING_DAYS ? "pending" : "approved";
            html += `<span class="admin-badge ${badgeClass}">Expires: ${escapeHtml(formatDateTime(rawExpiry))}</span>`;
            html += `<span class="admin-badge ${badgeClass}">${escapeHtml(countdown)}</span>`;
          }
        }
      }
      subscriptionBadges.innerHTML = html || '<span class="admin-badge approved">Premium Access</span>';
    }

    return renderProfilePaymentHistory();
  }

  // Non-premium users: show upgrade button
  if (flutterwaveForm) flutterwaveForm.style.display = "";
  if (upgradeShell) upgradeShell.style.display = "";
  if (paymentSection) paymentSection.style.display = "none";
  if (subscriptionInfo) subscriptionInfo.style.display = "none";
  if (upgradeTitle) upgradeTitle.textContent = "Upgrade to Premium";
  if (upgradeSubtitle) upgradeSubtitle.textContent = "Unlock all practice topics, detailed analytics, and priority support.";

  // Wire up the upgrade button
  const profileUpgradeBtn = document.getElementById("profileUpgradeBtn");
  if (profileUpgradeBtn) {
    profileUpgradeBtn.onclick = () => handleUpgradeClick();
  }

  return Promise.resolve();
}

// After an automatic grant, refresh the in-memory session so the plan badge
// and premium unlocks appear immediately (Firebase and Cloudflare providers).
async function refreshAuthSessionAfterGrant() {
  try {
    await refreshCurrentUserAfterGrant();
    refreshDashboardInsights();
  } catch (error) {
    debugLog("Session refresh after grant failed: " + (error?.message || "request failed."));
  }
}async function renderAdminPayments() {
  const container = document.getElementById("adminRequestList");
  if (!container) return;

  container.innerHTML = "";
  const searchInput = document.getElementById("adminRequestSearch");
  const statusFilter = document.getElementById("adminRequestStatusFilter");
  const planFilter = document.getElementById("adminRequestSourceFilter");
  const sortSelect = document.getElementById("adminRequestSort");
  const countLabel = document.getElementById("adminRequestCount");
  const query = String(searchInput?.value || "").trim().toLowerCase();
  const statusValue = String(statusFilter?.value || "all").toLowerCase();
  const planValue = String(planFilter?.value || "all").toLowerCase();

  if (sortSelect) {
    adminRequestSortValue = sortSelect.value || "newest";
  }

  let payments = [];
  try {
    const [{ getAdminPaymentHistory, normalizePaymentReceipt }, { formatPaymentAmount }] =
      await Promise.all([
        import("./paymentFlutterwaveService.js"),
        import("./paymentFlutterwave.js"),
      ]);
    const token = await getCurrentAuthToken();
    const payload = await getAdminPaymentHistory(
      {
        search: query,
        status: statusValue,
        planCycle: planValue,
        pageSize: 100,
      },
      token,
    );
    payments = Array.isArray(payload?.payments)
      ? payload.payments.map(normalizePaymentReceipt)
      : [];
    adminPaymentRows = payments;

    const filtered = payments
      .filter((payment) => {
        const status = String(payment.status || "").toLowerCase();
        const cycle = String(payment.billingCycle || "").toLowerCase();
        if (statusValue !== "all" && status !== statusValue) return false;
        if (planValue !== "all" && cycle !== planValue) return false;
        if (!query) return true;
        return (
          payment.email.includes(query) ||
          String(payment.flwTxRef || "").toLowerCase().includes(query) ||
          String(payment.flwTransactionId || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        switch (adminRequestSortValue) {
          case "oldest":
            return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
          case "email-asc":
            return String(a.email || "").localeCompare(String(b.email || ""));
          case "email-desc":
            return String(b.email || "").localeCompare(String(a.email || ""));
          case "newest":
          default:
            return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
        }
      });

  if (countLabel) {
    countLabel.textContent = `${filtered.length}/${payments.length}`;
  }

    if (!filtered.length) {
      container.innerHTML =
        '<div class="admin-request-item"><p class="meta">No Flutterwave payments found yet.</p></div>';
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
          <th>Amount</th>
          <th>Plan</th>
          <th>Tx Ref</th>
          <th>Date</th>
          <th>Status</th>
          <th class="actions-col">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    filtered.forEach((payment, index) => {
      const status = String(payment.status || "successful").toLowerCase();
      const statusClass = status === "successful" || status === "success" ? "approved" : "pending";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="email-cell">${escapeHtml(payment.email || "-")}</td>
        <td>${escapeHtml(formatPaymentAmount(payment.amount, payment.currency))}</td>
        <td>${escapeHtml(formatBillingCycleLabel(payment.billingCycle) || "-")}</td>
        <td>${escapeHtml(payment.flwTxRef || payment.paymentId || "-")}</td>
        <td>${escapeHtml(formatDateTime(payment.createdAt))}</td>
        <td><span class="admin-badge ${statusClass}">${escapeHtml(status)}</span></td>
        <td class="actions-col">
          <button class="btn btn-ghost action-btn" data-payment-index="${index}" type="button">View</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    container.appendChild(tableWrap);
    tableWrap.appendChild(table);
    tableWrap.querySelectorAll("[data-payment-index]").forEach((button) => {
      button.addEventListener("click", async () => {
        const receipt = filtered[Number(button.getAttribute("data-payment-index"))];
        if (!receipt) return;
        const { openPaymentReceiptLightbox } = await import("./paymentFlutterwave.js");
        openPaymentReceiptLightbox(receipt, {
          onStartStudying: () => showScreen("topicSelectionScreen"),
        });
      });
    });
    return;
  } catch (error) {
    payments = adminPaymentRows;
    if (!payments.length) {
      payments = adminDirectoryUsers
        .filter((entry) => entry?.flwTransactionId)
        .map((entry) => ({
          paymentId: `flw_${entry.flwTransactionId}`,
          email: String(entry?.email || "").trim().toLowerCase(),
          amount: 0,
          currency: "NGN",
          billingCycle: String(entry?.flwPaymentPlan || entry?.billingCycle || ""),
          status: "successful",
          flwTransactionId: String(entry?.flwTransactionId || ""),
          flwCustomerEmail: String(entry?.flwCustomerEmail || entry?.email || "").trim().toLowerCase(),
          flwTxRef: "",
          createdAt: String(entry?.lastPaymentAt || ""),
          expiresAt: String(entry?.planExpiresAt || ""),
        }));
    }
  }

  const filtered = payments.filter((payment) => {
    const status = String(payment.status || "").toLowerCase();
    const cycle = String(payment.billingCycle || "").toLowerCase();
    if (statusValue !== "all" && status !== statusValue) return false;
    if (planValue !== "all" && cycle !== planValue) return false;
    if (!query) return true;
    return (
      String(payment.email || "").includes(query) ||
      String(payment.flwTxRef || "").toLowerCase().includes(query) ||
      String(payment.flwTransactionId || "").toLowerCase().includes(query)
    );
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length}/${payments.length}`;
  }

  if (!filtered.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No Flutterwave payments found yet.</p></div>';
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
        <th>Amount</th>
        <th>Plan</th>
        <th>Tx Ref</th>
        <th>Date</th>
        <th>Status</th>
        <th class="actions-col">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  filtered.forEach((payment, index) => {
    const row = document.createElement("tr");
    const safeStatus = escapeHtml(payment.status || "successful");
    const statusClass = safeStatus === "successful" || safeStatus === "success" ? "approved" : "pending";
    row.innerHTML = `
      <td class="email-cell">${escapeHtml(payment.email || "-")}</td>
      <td>${escapeHtml(payment.amount ? `NGN ${Number(payment.amount).toLocaleString("en-NG")}` : "-")}</td>
      <td>${escapeHtml(formatBillingCycleLabel(payment.billingCycle) || "-")}</td>
      <td>${escapeHtml(payment.flwTxRef || payment.paymentId || "-")}</td>
      <td>${escapeHtml(formatDateTime(payment.createdAt))}</td>
      <td><span class="admin-badge ${statusClass}">${safeStatus}</span></td>
      <td class="actions-col">
        <button class="btn btn-ghost action-btn" data-payment-index="${index}" type="button">View</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  container.appendChild(tableWrap);
  tableWrap.appendChild(table);

  tableWrap.querySelectorAll("[data-payment-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      const receipt = filtered[Number(button.getAttribute("data-payment-index"))];
      if (!receipt) return;
      const { openPaymentReceiptLightbox } = await import("./paymentFlutterwave.js");
      openPaymentReceiptLightbox(receipt, {
        onStartStudying: () => showScreen("topicSelectionScreen"),
      });
    });
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatRelativeTime(value) {
  if (!value) return "";
  const timestamp = Date.parse(String(value));
  if (!timestamp) return "";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function updateFeedbackCharCount() {
  const messageInput = document.getElementById("feedbackMessage");
  const counter = document.getElementById("feedbackCharCount");
  if (!messageInput || !counter) return;
  counter.textContent = buildFeedbackCharCountLabel(messageInput.value, FEEDBACK_MESSAGE_MAX_LENGTH);
}

function buildFeedbackClientInfo() {
  let userAgent = "";
  let viewport = "";
  if (typeof navigator !== "undefined") {
    userAgent = String(navigator.userAgent || "").trim();
  }
  if (typeof window !== "undefined") {
    const width = Number(window.innerWidth || window.screen?.width || 0);
    const height = Number(window.innerHeight || window.screen?.height || 0);
    if (width && height) viewport = `${width}x${height}`;
  }
  const user = getCurrentUser();
  return {
    provider: getAuthProviderLabel() || "",
    plan: String(user?.plan || "").trim() || "",
    viewport,
    userAgent: userAgent.slice(0, 240),
  };
}

function renderFeedbackContextSummary(context = null) {
  const container = document.getElementById("feedbackContextSummary");
  if (!container) return;
  const html = buildFeedbackContextSummaryHtml(context, { escapeHtml });
  if (!html) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }
  container.classList.remove("hidden");
  container.innerHTML = html;
}

function closeFeedbackModal() {
  const modal = document.getElementById("feedbackModal");
  const form = document.getElementById("feedbackForm");
  const messageInput = document.getElementById("feedbackMessage");
  const categorySelect = document.getElementById("feedbackCategory");
  if (modal) {
    modal.classList.add("hidden");
  }
  if (form) {
    form.reset();
  }
  if (messageInput) {
    messageInput.value = "";
  }
  if (categorySelect) {
    categorySelect.value = "";
  }
  activeFeedbackContext = null;
  renderFeedbackContextSummary(null);
  updateFeedbackCharCount();
}

function openFeedbackModal(context = {}) {
  const access = getFeedbackAccessState();
  if (!access.allowed) {
    showWarning(access.message);
    return;
  }

  const modal = document.getElementById("feedbackModal");
  const title = document.getElementById("feedbackModalTitle");
  const intro = document.getElementById("feedbackModalIntro");
  const categorySelect = document.getElementById("feedbackCategory");
  const messageInput = document.getElementById("feedbackMessage");
  if (!modal || !title || !intro || !categorySelect || !messageInput) return;

  activeFeedbackContext = context && typeof context === "object" ? { ...context } : {};
  const copy = getFeedbackModalCopy(activeFeedbackContext?.sourceScreen);
  title.textContent = copy.title;
  intro.textContent = copy.intro;
  categorySelect.value = String(activeFeedbackContext?.defaultCategory || "").trim().toLowerCase();
  messageInput.value = "";
  renderFeedbackContextSummary(activeFeedbackContext);
  updateFeedbackCharCount();
  modal.classList.remove("hidden");
  messageInput.focus();
}

function renderFeedbackUiState() {
  const access = getFeedbackAccessState();
  const model = buildFeedbackAccessUiModel(access);
  const helpBtn = document.getElementById("openHelpFeedbackBtn");
  const helpNote = document.getElementById("helpFeedbackNote");
  const quizBtn = document.getElementById("openQuizFeedbackBtn");
  const resultsBtn = document.getElementById("openResultsFeedbackBtn");
  const feedbackModal = document.getElementById("feedbackModal");

  [helpBtn, dashboardFeedbackBtn, headerFeedbackBtn].forEach((button) => {
    if (!button) return;
    button.disabled = model.buttonDisabled;
    button.setAttribute("aria-disabled", model.buttonAriaDisabled);
    button.title = model.buttonTitle;
  });

  if (helpNote) {
    helpNote.textContent = model.helpNoteText;
    helpNote.classList.toggle("hidden", model.helpNoteHidden);
  }

  if (quizBtn) {
    quizBtn.classList.toggle("hidden", model.quizHidden);
  }
  if (resultsBtn) {
    resultsBtn.classList.toggle("hidden", model.resultsHidden);
  }

  if (model.shouldCloseModal && feedbackModal && !feedbackModal.classList.contains("hidden")) {
    closeFeedbackModal();
  }
}
function renderAdminFeedbackList() {
  const container = document.getElementById("adminFeedbackList");
  const searchInput = document.getElementById("adminFeedbackSearch");
  const statusFilter = document.getElementById("adminFeedbackStatusFilter");
  const categoryFilter = document.getElementById("adminFeedbackCategoryFilter");
  const sourceFilter = document.getElementById("adminFeedbackSourceFilter");
  const sortSelect = document.getElementById("adminFeedbackSort");
  const countLabel = document.getElementById("adminFeedbackCount");
  if (!container) return;

  if (sortSelect) {
    adminFeedbackSortValue = sortSelect.value || "newest";
  }

  const filtered = filterAdminFeedbackSubmissions(adminFeedbackSubmissions, {
    query: searchInput?.value,
    status: statusFilter?.value,
    category: categoryFilter?.value,
    source: sourceFilter?.value,
  });

  // Apply sorting
  filtered.sort((a, b) => {
    switch (adminFeedbackSortValue) {
      case "oldest":
        return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
      case "email-asc":
        return String(a.email || "").localeCompare(String(b.email || ""));
      case "email-desc":
        return String(b.email || "").localeCompare(String(a.email || ""));
      case "newest":
      default:
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    }
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length}/${adminFeedbackSubmissions.length}`;
  }

  container.innerHTML = "";
  if (!filtered.length) {
    const emptyCopy = buildAdminFeedbackEmptyState(adminFeedbackSubmissions.length);
    container.innerHTML = `<div class="admin-request-item"><p class="meta">${escapeHtml(emptyCopy)}</p></div>`;
    return;
  }

  const list = document.createElement("div");
  list.className = "admin-feedback-list";

  filtered.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "admin-feedback-item";
    const itemModel = buildAdminFeedbackItemModel(entry, {
      formatDateTime,
      formatRelativeTime,
      escapeHtml,
    });
    item.innerHTML = itemModel.html;
    item.querySelectorAll(".admin-feedback-message-truncate").forEach((messageEl) => {
      messageEl.addEventListener("click", () => {
        messageEl.classList.toggle("expanded");
      });
    });
    list.appendChild(item);
  });

  container.appendChild(list);

  list.querySelectorAll("[data-feedback-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const feedbackId = String(button.getAttribute("data-feedback-id") || "").trim();
      const nextStatus = String(button.getAttribute("data-feedback-status") || "").trim().toLowerCase();
      if (!feedbackId || !nextStatus) return;
      const target = adminFeedbackSubmissions.find((entry) => String(entry?.feedbackId || "") === feedbackId);
      const targetLabel = target?.email || feedbackId;
      try {
        await runOperationWithFeedback(
          () => updateFeedbackSubmissionStatus(feedbackId, nextStatus),
          {
            loadingMessage: "Updating feedback status...",
            successMessage: buildAdminFeedbackStatusMessage(nextStatus),
            failurePrefix: "Unable to update feedback:",
          },
        );
        logAdminOperation({
          action: "Update feedback status",
          target: targetLabel,
          status: "success",
          message: buildAdminFeedbackStatusMessage(nextStatus),
        });
      } catch (error) {
        logAdminOperation({
          action: "Update feedback status",
          target: targetLabel,
          status: "failed",
          message: error?.message || "Unknown error.",
        });
      } finally {
        renderAdminOperationHistory();
        await refreshAdminFeedbackSubmissions();
      }
    });
  });
}

function hasCloudBackedAdminSession() {
  if (!isCurrentUserAdmin()) return false;
  const provider = String(getAuthProviderLabel() || "").trim().toLowerCase();
  return provider === "cloud" || provider === "cloudflare" || provider === "hybrid";
}

function hasCloudBackedUserSession() {
  const user = getCurrentUser();
  if (!user) return false;
  const provider = String(getAuthProviderLabel() || "").trim().toLowerCase();
  return provider === "cloud" || provider === "cloudflare" || provider === "hybrid";
}

async function refreshAdminFeedbackSubmissions() {
  if (adminFeedbackRefreshInFlight) {
    return adminFeedbackRefreshInFlight;
  }
  adminFeedbackRefreshInFlight = (async () => {
    const notice = document.getElementById("adminFeedbackNotice");
    const countLabel = document.getElementById("adminFeedbackCount");
    if (!hasCloudBackedAdminSession()) {
      adminFeedbackSubmissions = [];
      renderAdminFeedbackList();
      if (countLabel) {
        countLabel.textContent = "0/0";
      }
      if (notice) {
        notice.textContent = isCurrentUserAdmin()
          ? "Feedback inbox requires a cloud-backed admin session."
          : "";
        notice.classList.toggle("hidden", !notice.textContent);
      }
      return [];
    }

    try {
      const rows = await getAdminFeedbackSubmissions();
      adminFeedbackSubmissions = Array.isArray(rows) ? rows : [];
      renderAdminFeedbackList();
      if (notice) {
        notice.textContent = "";
        notice.classList.add("hidden");
      }
      return adminFeedbackSubmissions;
    } catch (error) {
      adminFeedbackSubmissions = [];
      renderAdminFeedbackList();
      if (countLabel) {
        countLabel.textContent = "0/0";
      }
      if (notice) {
        const rawMessage = String(error?.message || "").trim();
        const providerLabel = String(getAuthProviderLabel() || "").trim();
        const feedbackLoadMessage =
          rawMessage === "Cloud session is unavailable." || rawMessage === "Data request failed."
            ? (providerLabel === "Hybrid"
                ? "Feedback inbox needs a cloud-backed admin session. Sign in through the cloud auth path instead of device-only mode."
                : "Feedback inbox requires a cloud-backed admin session.")
            : rawMessage || "Unable to load feedback inbox.";
        notice.textContent = feedbackLoadMessage;
        notice.classList.remove("hidden");
      }
      console.error("Failed to refresh feedback inbox:", error);
      return [];
    }
  })();

  try {
    return await adminFeedbackRefreshInFlight;
  } finally {
    adminFeedbackRefreshInFlight = null;
  }
}

function updateProfileDataSyncUI() {
  // Auth provider / cloud-sync messaging is intentionally hidden from the UI.
  // Sync itself keeps running in the background; only the status copy is
  // suppressed. Elements may not exist (removed from the markup), so every
  // lookup is null-guarded.
  const hintEl = document.getElementById("profileDataStorageHint");
  const statusEl = document.getElementById("profileCloudSyncStatus");
  const syncNowBtn = document.getElementById("syncProgressNowBtn");
  if (hintEl) hintEl.classList.add("hidden");
  if (statusEl) statusEl.classList.add("hidden");
  if (syncNowBtn) syncNowBtn.classList.add("hidden");
}

const AMBIENT_CLOUD_SYNC_INTERVAL_MS = 60000;
let ambientCloudSyncIntervalId = null;

function triggerBackgroundProgressSync(options = {}) {
  const { force = false } = options;
  if (!hasCloudBackedUserSession() || !isCloudProgressSyncEnabled()) {
    return Promise.resolve(null);
  }

  updateProfileDataSyncUI();
  return syncProgressFromCloudNow({ force })
    .then((result) => {
      updateProfileDataSyncUI();
      refreshHeaderSummary();
      refreshDashboardInsights();
      return result;
    })
    .catch(() => {
      updateProfileDataSyncUI();
      refreshHeaderSummary();
      return null;
    });
}

function startAmbientCloudSync() {
  if (ambientCloudSyncIntervalId) return;
  ambientCloudSyncIntervalId = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    triggerBackgroundProgressSync();
  }, AMBIENT_CLOUD_SYNC_INTERVAL_MS);
}

function stopAmbientCloudSync() {
  if (!ambientCloudSyncIntervalId) return;
  window.clearInterval(ambientCloudSyncIntervalId);
  ambientCloudSyncIntervalId = null;
}

function refreshAmbientCloudSyncState() {
  const shouldRun = Boolean(hasCloudBackedUserSession() && isCloudProgressSyncEnabled());
  if (shouldRun) {
    startAmbientCloudSync();
    return;
  }
  stopAmbientCloudSync();
}

async function hydrateCloudProgressIfNeeded() {
  if (!hasCloudBackedUserSession() || !isCloudProgressSyncEnabled()) {
    return null;
  }

  const summary = readProgressSummary();
  const attemptsCount = Array.isArray(summary?.attempts) ? summary.attempts.length : 0;
  const hasLocalProgress = attemptsCount > 0 || getRetryMissedQueueCount() > 0 || getSpacedPracticeDueCount() > 0;
  if (hasLocalProgress) {
    return null;
  }

  updateProfileDataSyncUI();
  try {
    const result = await syncProgressFromCloudNow({ force: true });
    updateProfileDataSyncUI();
    refreshDashboardInsights();
    return result;
  } catch {
    updateProfileDataSyncUI();
    return null;
  }
}
function getDirectoryVerificationPresentation(emailVerified) {
  if (emailVerified === true) {
    return { label: "Yes", badgeClass: "approved", dataValue: "true" };
  }
  if (emailVerified === false) {
    return { label: "No", badgeClass: "rejected", dataValue: "false" };
  }
  return { label: "Unknown", badgeClass: "neutral", dataValue: "unknown" };
}

function formatBillingCycleLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("month")) return "Monthly";
  if (lower.includes("quarter")) return "Quarterly";
  if (lower.includes("bi") || lower.includes("semi") || lower.includes("half")) return "Bi-Annual";
  if (lower.includes("year") || lower.includes("ann")) return "Annual";
  return raw.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

function getDirectoryBillingCyclePresentation(entry) {
  const plan = String(entry?.plan || "").toLowerCase();
  if (plan !== "premium") {
    return { label: "Free", badgeClass: "neutral" };
  }
  const label = formatBillingCycleLabel(entry?.billingCycle || entry?.subscriptionType || entry?.planInterval);
  if (!label) {
    // Try to infer from lastPaymentAt — if they paid, they have a cycle
    if (entry?.lastPaymentAt) {
      return { label: "Premium", badgeClass: "approved" };
    }
    return { label: "Premium", badgeClass: "approved" };
  }
  return { label, badgeClass: "approved" };
}

function getDirectoryExpiryPresentation(entry) {
  const plan = String(entry?.plan || "").toLowerCase();
  let rawExpiry = String(entry?.planExpiresAt || "").trim();
  if (plan !== "premium") {
    return { label: "Free", badgeClass: "neutral", dateLabel: "", countdown: "" };
  }
  // If no explicit expiry, try to compute from lastPaymentAt + billingCycle
  if (!rawExpiry && entry?.lastPaymentAt) {
    const cycle = String(entry?.billingCycle || entry?.subscriptionType || entry?.planInterval || "").toLowerCase();
    const cycleDays = cycle.includes("year") ? 365 : cycle.includes("quarter") ? 90 : 30; // default monthly
    const paymentDate = new Date(entry.lastPaymentAt);
    if (!Number.isNaN(paymentDate.getTime())) {
      rawExpiry = new Date(paymentDate.getTime() + cycleDays * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  if (!rawExpiry) {
    // No expiry data but user is premium — show as active with subscription date
    const subDate = entry?.lastPaymentAt || entry?.createdAt || "";
    const subLabel = subDate ? `Since ${formatDate(subDate)}` : "Active";
    return { label: "Active", badgeClass: "approved", dateLabel: subLabel, countdown: "" };
  }
  const expiryDate = new Date(rawExpiry);
  if (Number.isNaN(expiryDate.getTime())) {
    return { label: "Unknown", badgeClass: "neutral", dateLabel: "", countdown: "" };
  }
  const diffMs = expiryDate.getTime() - Date.now();
  const dateLabel = formatDateTime(rawExpiry);
  if (diffMs < 0) {
    return { label: "Expired", badgeClass: "rejected", dateLabel, countdown: "" };
  }
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const countdown = daysLeft <= 30 ? `${daysLeft}d left` : `${Math.ceil(daysLeft / 30)}mo left`;
  const warnMs = EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
  if (diffMs <= warnMs) {
    return { label: "Expiring", badgeClass: "pending", dateLabel, countdown };
  }
  return { label: "Active", badgeClass: "approved", dateLabel, countdown };
}

function getProfileSubscriptionLabel(user) {
  if (!user) return "";
  if (user.plan !== "premium") return "Free access";
  const cycleLabel = formatBillingCycleLabel(user?.billingCycle || user?.subscriptionType || user?.planInterval);
  const cycleSuffix = cycleLabel ? ` (${cycleLabel})` : "";
  const rawExpiry = String(user?.planExpiresAt || user?.subscriptionExpiresAt || user?.planExpiryAt || user?.expiresAt || "").trim();
  if (!rawExpiry) return `Premium access${cycleSuffix}`;
  const expiryDate = new Date(rawExpiry);
  if (Number.isNaN(expiryDate.getTime())) {
    return `Premium access${cycleSuffix} (expiry unknown)`;
  }
  const dateLabel = formatDateTime(rawExpiry);
  if (expiryDate.getTime() < Date.now()) {
    return `Premium access${cycleSuffix} (expired ${dateLabel})`;
  }
  return `Premium access${cycleSuffix} (expires ${dateLabel})`;
}


let adminUserSortValue = "newest";
let adminRequestSortValue = "newest";
let adminFeedbackSortValue = "newest";

function renderAdminUserDirectory() {
  const container = document.getElementById("adminUserList");
  const searchInput = document.getElementById("adminUserSearch");
  const statusFilter = document.getElementById("adminStatusFilter");
  const verificationFilter = document.getElementById("adminVerificationFilter");
  const sortSelect = document.getElementById("adminUserSort");
  const sourceLabel = document.getElementById("adminUserSource");
  const countLabel = document.getElementById("adminUserCount");
  if (!container) return;

  if (sortSelect) {
    adminUserSortValue = sortSelect.value || "newest";
  }

  const query = String(searchInput?.value || "").trim().toLowerCase();
  const status = String(statusFilter?.value || "all").toLowerCase();
  const verification = String(verificationFilter?.value || "all").toLowerCase();
  const filtered = adminDirectoryUsers.filter((entry) => {
    const emailMatch = !query || String(entry.email || "").toLowerCase().includes(query);
    const statusMatch = status === "all" || entry.status === status;
    const verificationMatch =
      verification === "all" ||
      (verification === "verified" && entry.emailVerified === true) ||
      (verification === "unverified" && entry.emailVerified === false) ||
      (verification === "unknown" && entry.emailVerified !== true && entry.emailVerified !== false);
    return emailMatch && statusMatch && verificationMatch;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    switch (adminUserSortValue) {
      case "oldest":
        return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
      case "email-asc":
        return String(a.email || "").localeCompare(String(b.email || ""));
      case "email-desc":
        return String(b.email || "").localeCompare(String(a.email || ""));
      case "last-seen":
        return (Date.parse(b.lastSeenAt) || 0) - (Date.parse(a.lastSeenAt) || 0);
      case "newest":
      default:
        return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    }
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length}/${adminDirectoryUsers.length}`;
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

  const list = document.createElement("div");
  list.className = "admin-user-cards";

  filtered.forEach((entry) => {
    const row = document.createElement("details");
    row.className = "admin-user-card";
    const roleClass = entry.role === "admin" ? "approved" : "pending";
    const planClass = entry.plan === "premium" ? "approved" : "pending";
    const statusClass = entry.status === "suspended" ? "rejected" : "approved";
    const verification = getDirectoryVerificationPresentation(entry.emailVerified);
    const expiry = getDirectoryExpiryPresentation(entry);
    const billingCycle = getDirectoryBillingCyclePresentation(entry);

    const safeEmail = escapeHtml(entry.email);
    const safeRole = escapeHtml(entry.role);
    const safePlan = escapeHtml(entry.plan);
    const safeStatus = escapeHtml(entry.status);
    const safeSource = escapeHtml(entry.source || "-");
    const safeCreated = escapeHtml(formatDateTime(entry.createdAt));
    const safeLastSeen = escapeHtml(formatDateTime(entry.lastSeenAt));
    const safeExpiryDate = escapeHtml(expiry.dateLabel);
    const expiryLabel = entry.plan === "premium" ? expiry.label : "N/A";
    const safeExpiryLabel = escapeHtml(expiryLabel);
    const safeBilling = escapeHtml(billingCycle.label);
    const safeVerification = escapeHtml(verification.label);
    const isPremiumPlan = entry.plan === "premium";
    const safeCountdown = escapeHtml(expiry.countdown || "");
    const countdownBadge = isPremiumPlan && safeCountdown
      ? `<span class="admin-badge pending">${safeCountdown}</span>`
      : "";
    const billingBadge = isPremiumPlan
      ? `<span class="admin-badge ${billingCycle.badgeClass}">Billing: ${safeBilling}</span>`
      : "";
    const expiryBadge = isPremiumPlan
      ? `<span class="admin-badge ${expiry.badgeClass}">Expiry: ${safeExpiryLabel}</span>`
      : "";
    // Subscription date: prefer lastPaymentAt, fallback to createdAt
    const subDate = isPremiumPlan ? (entry?.lastPaymentAt || entry?.createdAt || "") : "";
    const safeSubDate = escapeHtml(subDate ? formatDate(subDate) : "");
    const subDateBadge = isPremiumPlan && safeSubDate && safeSubDate !== "-"
      ? `<span class="admin-badge approved">Subscribed: ${safeSubDate}</span>`
      : "";
    const billingDetail = isPremiumPlan
      ? `<div><span class="meta">Billing</span><strong>${safeBilling}</strong></div>`
      : "";
    const expiryDetail = isPremiumPlan
      ? `<div><span class="meta">Expiry</span><strong>${safeExpiryLabel}</strong>${safeExpiryDate ? ` <span class="meta">(${safeExpiryDate})</span>` : ""}${safeCountdown ? ` <span class="admin-badge pending">${safeCountdown}</span>` : ""}</div>`
      : "";
    const subDateDetail = isPremiumPlan && safeSubDate && safeSubDate !== "-"
      ? `<div><span class="meta">Subscribed</span><strong>${safeSubDate}</strong></div>`
      : "";

    const isSuspended = entry.status === "suspended";
    const accountActionLabel = isSuspended ? "Reactivate" : "Deactivate";
    const accountNextStatus = isSuspended ? "active" : "suspended";
    const hasCloudflareLogin = entry.source === "cloudflare-auth";
    const cloudflareActionLabel = hasCloudflareLogin ? "Create password reset link" : "Create password setup link";
    const safeProfileId = escapeHtml(entry.id);
    const safeProfileRole = escapeHtml(entry.role || "user");
    const safeProfileStatus = escapeHtml(entry.status || "active");

    const upgradeStatus = normalizeUpgradeRequestStatus(entry?.upgradeRequestStatus);
    const hasUpgrade =
      upgradeStatus !== "none" ||
      Boolean(entry?.upgradeRequestedAt) ||
      Boolean(entry?.upgradePaymentReference) ||
      Boolean(entry?.upgradeAmountPaid);
    const safeUpgradeStatus = escapeHtml(upgradeStatus === "none" ? "-" : upgradeStatus);
    const safeUpgradeRequestedAt = escapeHtml(formatDateTime(entry?.upgradeRequestedAt || ""));
    const safeUpgradeAmount = escapeHtml(entry?.upgradeAmountPaid || "-");
    const safeUpgradeReference = escapeHtml(entry?.upgradePaymentReference || "-");

    const safeDates = `${safeCreated === "-" ? "" : `Created: ${safeCreated}`}${safeCreated !== "-" && safeLastSeen !== "-" ? " · " : ""}${safeLastSeen === "-" ? "" : `Last seen: ${safeLastSeen}`}`;

    row.innerHTML = `
      <summary class="admin-user-summary">
        <div class="admin-user-summary-main">
          <div class="admin-user-summary-head">
            <div class="admin-user-email">${safeEmail}</div>
            <div class="admin-user-badges">
              <span class="admin-badge ${planClass}">Plan: ${safePlan}</span>
              ${billingBadge}
              ${expiryBadge}
              ${countdownBadge}
              ${subDateBadge}
              <span class="admin-badge ${statusClass}">Status: ${safeStatus}</span>
              <span class="admin-badge ${verification.badgeClass}">Verified: ${safeVerification}</span>
            </div>
          </div>
        </div>
        <div class="admin-user-summary-side" title="Account activity dates">
          <span class="meta">${safeDates || "No dates recorded"}</span>
        </div>
      </summary>
      <div class="admin-user-details">
        <div class="admin-user-detail-grid">
          <div><span class="meta">Role</span><strong>${safeRole}</strong></div>
          <div><span class="meta">Plan</span><strong>${safePlan}</strong></div>
          ${billingDetail}
          ${expiryDetail}
          ${subDateDetail}
          <div><span class="meta">Status</span><strong>${safeStatus}</strong></div>
          <div><span class="meta">Verified</span><strong>${safeVerification}</strong></div>
          <div><span class="meta">Created</span><strong>${safeCreated}</strong></div>
          <div><span class="meta">Last Seen</span><strong>${safeLastSeen}</strong></div>
          <div><span class="meta">Source</span><strong>${safeSource}</strong></div>
        </div>
        ${hasUpgrade ? `
        <div class="admin-user-upgrade">
          <div class="meta">Upgrade Request</div>
          <div class="admin-user-detail-grid">
            <div><span class="meta">Status</span><strong>${safeUpgradeStatus}</strong></div>
            <div><span class="meta">Requested</span><strong>${safeUpgradeRequestedAt}</strong></div>
            <div><span class="meta">Amount</span><strong>${safeUpgradeAmount}</strong></div>
            <div><span class="meta">Reference</span><strong>${safeUpgradeReference}</strong></div>
          </div>
        </div>
        ` : ""}
        <div class="admin-user-actions">
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
              <button class="directory-action directory-action-menu-item" data-action="resend-verification" data-profile-email="${safeEmail}" data-email-verified="${verification.dataValue}" type="button" role="menuitem">
                Resend verification
              </button>
              <button class="directory-action directory-action-menu-item" data-action="create-cloudflare-link" data-profile-email="${safeEmail}" data-profile-role="${safeProfileRole}" data-profile-plan="${safePlan}" data-profile-status="${safeProfileStatus}" data-email-verified="${verification.dataValue}" data-profile-source="${safeSource}" type="button" role="menuitem">
                ${cloudflareActionLabel}
              </button>
              <button class="directory-action directory-action-menu-item danger" data-action="set-account-state" data-profile-id="${safeProfileId}" data-profile-email="${safeEmail}" data-next-status="${accountNextStatus}" type="button" role="menuitem">
                ${accountActionLabel} account
              </button>
            </div>
          </details>
        </div>
      </div>
    `;

    list.appendChild(row);
  });

  container.appendChild(list);

  list.querySelectorAll(".directory-action-menu").forEach((menuEl) => {
    menuEl.addEventListener("toggle", () => {
      if (!menuEl.open) return;
      list.querySelectorAll(".directory-action-menu[open]").forEach((other) => {
        if (other !== menuEl) {
          other.open = false;
        }
      });
    });
  });

  list.addEventListener("click", async (event) => {
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
    const profileRole = String(button.dataset.profileRole || "user").trim().toLowerCase();
    const profilePlan = String(button.dataset.profilePlan || "free").trim().toLowerCase();
    const profileStatus = String(button.dataset.profileStatus || "active").trim().toLowerCase();
    const profileSource = String(button.dataset.profileSource || "").trim().toLowerCase();
    const nextStatus = String(button.dataset.nextStatus || "").trim().toLowerCase();
    const emailVerificationState = String(button.dataset.emailVerified || "").trim().toLowerCase();
    const isEmailVerified = emailVerificationState === "true";
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
            : action === "create-cloudflare-link"
              ? (profileSource === "cloudflare-auth" ? "Create password reset link" : "Create password setup link")
        : "Update account status";
    let actionWarning = "";
    if (action === "set-account-state") {
      const confirmMessage = isDeactivateFlow
        ? `Deactivate ${targetLabel}? They will no longer be able to login.`
        : `Reactivate ${targetLabel}? They will regain access.`;
      const confirmed = await showConfirm({
        title: isDeactivateFlow ? "Deactivate User" : "Activate User",
        message: confirmMessage,
        okText: isDeactivateFlow ? "Deactivate" : "Activate"
      });
      if (!confirmed) return;
    }
    if (action === "resend-verification" && isEmailVerified) {
      showWarning(`${targetLabel} is already verified.`);
      return;
    }
  try {
      await runOperationWithFeedback(
        async () => {
          if (action === "send-reset") {
            await requestPasswordReset(profileEmail, window.location.href);
            actionWarning = "Password reset sent.";
            return;
          }
          if (action === "resend-verification") {
            const resendResult = await resendVerificationEmailForUser(profileEmail);
            actionWarning = String(
              resendResult?.warning
              || (resendResult?.delivered === false
                ? "Verification email delivery is unavailable in the current backend path."
                : "Verification email sent."),
            ).trim();
            return;
          }
          if (action === "create-cloudflare-link") {
            const result = await createCloudflareMigrationLinkForUser({
              email: profileEmail,
              role: profileRole,
              plan: profilePlan,
              status: profileStatus,
              emailVerified: isEmailVerified,
              continueUrl: window.location.origin + window.location.pathname,
            });
            const link = String(result?.url || "").trim();
            if (!link) {
              throw new Error("Password setup link could not be created.");
            }
            try {
              await navigator.clipboard.writeText(link);
              actionWarning = `${profileSource === "cloudflare-auth" ? "Password reset link" : "Password setup link"} copied to clipboard.`;
            } catch (clipboardError) {
              actionWarning = `${profileSource === "cloudflare-auth" ? "Password reset link" : "Password setup link"} generated. Copy link from operation history: ${link}`;
            }
            return;
          }
          if (action === "set-account-state") {
            await updateCloudUserStatusById(profileId, nextStatus);
            actionWarning = "Account status updated.";
            return;
          }
        },
        {
          loadingMessage: `${actionLabel}...`,
          successMessage: actionWarning || "Action completed.",
          failurePrefix: "Action failed:",
        },
      );
      logAdminOperation({
        action: actionLabel,
        target: targetLabel,
        status: "success",
        message: actionWarning || "Action completed successfully.",
      });
    } catch (error) {
      logAdminOperation({
        action: actionLabel,
        target: targetLabel,
        status: "failed",
        message: error?.message || "Unknown error.",
      });
    } finally {
      renderAdminOperationHistory();
      await refreshAdminUserDirectory();
    }
  });
}

async function refreshAdminUserDirectory() {
  if (adminDirectoryRefreshInFlight) {
    return adminDirectoryRefreshInFlight;
  }
  adminDirectoryRefreshInFlight = (async () => {
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
          result.source === "cloud-auth"
            ? "Source: Firebase Auth (live)"
              : result.source === "cloud"
                ? "Source: Cloud profiles"
                : "Source: Local fallback";
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
        countLabel.textContent = "0/0";
      }
      if (notice) {
        notice.textContent = error.message || "Unable to load admin user directory.";
        notice.classList.remove("hidden");
      }
      console.error("Failed to refresh admin user directory:", error);
    }
  })();
  try {
    await adminDirectoryRefreshInFlight;
  } finally {
    adminDirectoryRefreshInFlight = null;
  }
}

function shouldAutoSyncAdminDirectory() {
  if (!isCurrentUserAdmin() || document.hidden) return false;
  const profileScreen = document.getElementById("profileScreen");
  return Boolean(profileScreen && !profileScreen.classList.contains("hidden"));
}

function startAdminDirectoryAutoSync() {
  if (adminDirectorySyncIntervalHandle) return;
  const syncIntervalMs = getAdminDirectorySyncIntervalMs();
  adminDirectorySyncIntervalHandle = setInterval(() => {
    if (!shouldAutoSyncAdminDirectory()) return;
    refreshAdminUserDirectory();
  }, syncIntervalMs);

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
        renderAdminFeedbackList();
        await refreshAdminUserDirectory();
        await refreshAdminFeedbackSubmissions();
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
  const freeTierModal = document.getElementById("freeTierModal");
  const migrationModal = document.getElementById("migrationModal");
  const freeTierCloseBtn = document.getElementById("freeTierCloseBtn");
  const freeTierAcknowledgeBtn = document.getElementById("freeTierAcknowledgeBtn");
  const migrationCloseBtn = document.getElementById("migrationCloseBtn");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const migrationForm = document.getElementById("migrationForm");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  const syncProgressNowBtn = document.getElementById("syncProgressNowBtn");
  const submitUpgradeEvidenceBtn = document.getElementById("submitUpgradeEvidenceBtn");
  const applyPlanOverrideBtn = document.getElementById("applyPlanOverrideBtn");
  const refreshAdminUsersBtn = document.getElementById("refreshAdminUsersBtn");
  const adminUserSearch = document.getElementById("adminUserSearch");
  const adminStatusFilter = document.getElementById("adminStatusFilter");
  const adminVerificationFilter = document.getElementById("adminVerificationFilter");
  const adminRequestSearch = document.getElementById("adminRequestSearch");
  const adminRequestStatusFilter = document.getElementById("adminRequestStatusFilter");
  const adminRequestSourceFilter = document.getElementById("adminRequestSourceFilter");
  const refreshAdminRequestsBtn = document.getElementById("refreshAdminRequestsBtn");
  const clearAdminOperationHistoryBtn = document.getElementById(
    "clearAdminOperationHistoryBtn",
  );
  const openHelpFeedbackBtn = document.getElementById("openHelpFeedbackBtn");
  const dashboardFeedbackBtn = document.getElementById("dashboardFeedbackBtn");
  const headerFeedbackBtn = document.getElementById("headerFeedbackBtn");
  const openQuizFeedbackBtn = document.getElementById("openQuizFeedbackBtn");
  const openResultsFeedbackBtn = document.getElementById("openResultsFeedbackBtn");
  const feedbackModal = document.getElementById("feedbackModal");
  const feedbackCloseBtn = document.getElementById("feedbackCloseBtn");
  const feedbackCancelBtn = document.getElementById("feedbackCancelBtn");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackMessage = document.getElementById("feedbackMessage");

  initializeTurnstileWidgets();
  const adminFeedbackSearch = document.getElementById("adminFeedbackSearch");
  const adminFeedbackStatusFilter = document.getElementById("adminFeedbackStatusFilter");
  const adminFeedbackCategoryFilter = document.getElementById("adminFeedbackCategoryFilter");
  const adminFeedbackSourceFilter = document.getElementById("adminFeedbackSourceFilter");
  const refreshAdminFeedbackBtn = document.getElementById("refreshAdminFeedbackBtn");

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

  if (migrationCloseBtn) {
    migrationCloseBtn.addEventListener("click", () => closeMigrationModal({ clearToken: true }));
  }

  if (migrationModal) {
    migrationModal.addEventListener("click", (event) => {
      if (event.target === migrationModal) closeMigrationModal({ clearToken: true });
    });
  }

  if (freeTierCloseBtn) {
    freeTierCloseBtn.addEventListener("click", closeFreeTierNotice);
  }

  if (freeTierAcknowledgeBtn) {
    freeTierAcknowledgeBtn.addEventListener("click", closeFreeTierNotice);
  }

  if (freeTierModal) {
    freeTierModal.addEventListener("click", (event) => {
      if (event.target === freeTierModal) closeFreeTierNotice();
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
        const turnstileToken = getTurnstileToken("login");
        await runOperationWithFeedback(
          async () => {
            const loginResult = await loginUser({ email, password, turnstileToken });
            await syncProgressFromCloudNow({ force: true }).catch(() => ({}));
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            if (typeof window.processFlutterwavePaymentReturn === "function") {
              await window.processFlutterwavePaymentReturn();
            }
            closeAuthModal();
            await showScreen("topicSelectionScreen");
            showFreeTierNoticeIfNeeded();
            if (loginResult?.shouldPromptPasswordUpgrade) {
              openMigrationModal({ email: loginResult?.email || email }, { mode: "firebase-session" });
            }
            return loginResult;
          },
          {
            loadingMessage: "Signing in...",
            successMessage: (result) => result?.authMessage || "Login successful.",
            failurePrefix: "Login failed:",
          },
        );
      } catch (error) {
        resetTurnstileWidget("login");
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
        const turnstileToken = getTurnstileToken("register");
        const registration = await runOperationWithFeedback(
          async () => {
            const created = await registerUser({ name, email, password, turnstileToken });
            await syncProgressFromCloudNow({ force: true }).catch(() => ({}));
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
              "Account created. Check your email to verify before login. If it is not in your inbox, check Spam or Junk.",
          );
          return;
        }

        const successCopy = registration?.message || "Account created successfully.";
        setAuthMessage(successCopy, "success");
        showSuccess(successCopy);
        setTimeout(() => {
          closeAuthModal();
          showScreen("topicSelectionScreen");
          showFreeTierNoticeIfNeeded();
        }, 450);
      } catch (error) {
        resetTurnstileWidget("register");
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
        const result = await runOperationWithFeedback(
          () => requestPasswordReset(email, window.location.href),
          {
            loadingMessage: "Preparing account recovery...",
            successMessage: (output) => output?.message || "If this email matches an account, recovery instructions will follow shortly.",
            failurePrefix: "Unable to start account recovery:",
          },
        );
        setAuthMessage(result?.message || "If this email matches an account, recovery instructions will follow shortly.", "success");
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
      const activeProvider = getAuthProviderLabel();
      if (activeProvider === "Hybrid" || activeProvider === "Cloudflare") {
        openMigrationModal({ email }, { mode: "cloudflare-session" });
        return;
      }
      try {
        await runOperationWithFeedback(
          () => requestPasswordReset(email, window.location.href),
          {
            loadingMessage: "Preparing account recovery...",
            successMessage: (output) => output?.message || "If this email matches an account, recovery instructions will follow shortly.",
            failurePrefix: "Unable to start account recovery:",
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

  if (syncProgressNowBtn) {
    syncProgressNowBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user) {
        showWarning("Login is required before syncing progress.");
        return;
      }
  try {
        const result = await runOperationWithFeedback(
          async () => {
            const synced = await syncProgressFromCloudNow({ force: true });
            refreshDashboardInsights();
            updateProfileDataSyncUI();
            return synced;
          },
          {
            loadingMessage: "Retrying cloud sync...",
            successMessage: () => "Cloud sync checked again.",
            failurePrefix: "Retry sync failed:",
          },
        );
        if (!result?.synced && result?.warning) {
          showWarning(result.warning);
        }
      } catch (error) {
        // Error toast already displayed by runOperationWithFeedback.
      }
    });
  }

  if (submitUpgradeEvidenceBtn) {
    submitUpgradeEvidenceBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      if (!user?.email) {
        showWarning("Login is required before submitting your Selar confirmation.");
        return;
      }
      const reference = document.getElementById("upgradePaymentReference")?.value || "";
      const amount = document.getElementById("upgradeAmountPaid")?.value || "";
      const billingCycle = document.getElementById("upgradeBillingCycle")?.value || "";
      if (!String(reference).trim()) {
        showWarning("Enter your Selar order reference before submitting.");
        return;
      }
      if (!billingCycle) {
        showWarning("Select the billing cycle for your Selar payment.");
        return;
      }

      const normalizedReference = String(reference).trim();
      const normalizedCycle = String(billingCycle).trim();
      const normalizedAmount = String(amount).trim();

      // 1) Try fully-automatic verification: the Worker checks the reference
      //    against Selar's merchant API and grants premium immediately.
      const verification = await runOperationWithFeedback(
        () => verifySelarPayment(normalizedReference, normalizedCycle),
        {
          loadingMessage: "Verifying your Selar payment...",
          successMessage: "",
          failurePrefix: "Unable to verify Selar payment:",
        },
      ).catch((error) => ({
        verified: false,
        reason: "request-failed",
        warning: error?.message || "Verification is unavailable right now.",
      }));

      if (verification?.verified) {
        const next = readUpgradeRequests();
        next.push({
          id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          email: user.email,
          reference: normalizedReference,
          amount: normalizedAmount,
          billingCycle: normalizedCycle,
          note: "Auto-verified via Selar API",
          status: "approved",
          createdAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: "selar-api",
          reviewNote: "Order reference confirmed against Selar merchant API.",
        });
        writeUpgradeRequests(next);
        showSuccess(
          verification.warning ||
          "Your Selar payment was verified and your premium access is now active.",
        );
        clearSelarConfirmationForm();
        await refreshProfileUpgradeSection().catch(() => {});
        await forceCloudPlanSync().catch(() => {});
        await refreshUserUpgradeStatus().catch(() => {});
        await refreshAuthSessionAfterGrant();
        return;
      }

      // 2) Verification unavailable / not confirmed: fall back to the manual
      //    review queue so no payment is ever lost.
      try {
        const cloudResult = await runOperationWithFeedback(
          async () => {
            const next = readUpgradeRequests();
            next.push({
              id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              email: user.email,
              reference: normalizedReference,
              amount: normalizedAmount,
              billingCycle: normalizedCycle,
              note: "Submitted from Selar confirmation form",
              status: "pending",
              createdAt: new Date().toISOString(),
            });
            writeUpgradeRequests(next);
            return submitUpgradeRequest({
              reference: normalizedReference,
              amount: normalizedAmount,
              billingCycle: normalizedCycle,
              note: "Submitted from Selar confirmation form",
            });
          },
          {
            loadingMessage: "Submitting Selar confirmation...",
            successMessage: "",
            failurePrefix: "Unable to submit Selar confirmation:",
          },
        );

        const baseCopy = cloudResult.cloudSaved
          ? "Selar confirmation submitted and synced. Admin review is pending."
          : "Selar confirmation submitted. Admin review is pending.";
        const fallbackNote = verification?.warning
          ? ` ${verification.warning}`
          : "";
        if (cloudResult.cloudSaved) {
          showSuccess(`${baseCopy}${cloudResult.warning ? ` ${cloudResult.warning}` : ""}${fallbackNote}`.trim());
        } else {
          showWarning(`${baseCopy}${cloudResult.warning || ""}${fallbackNote}`.trim());
        }
      } catch (error) {
        showError(`Unable to submit Selar confirmation: ${error?.message || "request failed."}`);
      }

      clearSelarConfirmationForm();
      refreshProfileUpgradeSection().catch(() => {});
      if (isCurrentUserAdmin()) {
        await refreshAdminUserDirectory();
        renderAdminRequests();
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
  const adminRequestSort = document.getElementById("adminRequestSort");
  if (adminRequestSort) {
    adminRequestSort.addEventListener("change", () => renderAdminRequests());
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
            loadingMessage: "Refreshing payment history...",
            successMessage: "Payment history refreshed.",
            failurePrefix: "Unable to refresh payments:",
          },
        );
        logAdminOperation({
          action: "Refresh payment history",
          target: "payment history",
          status: "success",
          message: "Payments refreshed from the current data source.",
        });
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: "Refresh payment history",
          target: "payment history",
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
      const confirmed = await showConfirm({
        title: "Clear History",
        message: "Clear all operation history entries on this device?",
        okText: "Clear History"
      });
      if (!confirmed) {
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

  if (openHelpFeedbackBtn) {
    openHelpFeedbackBtn.addEventListener("click", () => {
      openFeedbackModal({
        sourceScreen: "help",
        defaultCategory: "",
      });
    });
  }

  if (dashboardFeedbackBtn) {
    dashboardFeedbackBtn.addEventListener("click", () => {
      openFeedbackModal({
        sourceScreen: "help",
        defaultCategory: "",
      });
    });
  }

  const handleUpgradeClick = () => {
    closePremiumModal();
    openPricingModal();
  };

  const handlePlanSelect = async (cycle) => {
    const user = getCurrentUser();
    if (!user?.email) {
      closePricingModal();
      openAuthModal("login");
      showWarning(getPaymentProvider() === "selar"
        ? "Login is required before opening Selar checkout."
        : "Login is required before starting card payment.");
      return;
    }
    closePricingModal();

    if (getPaymentProvider() === "selar") {
      const checkoutUrl = getSelarCheckoutUrl(cycle);
      if (!checkoutUrl) {
        showWarning("Selar checkout link is not configured for this plan. Add it to runtime auth config.");
        showScreen("profileScreen");
        return;
      }

      const opened = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      showScreen("profileScreen");
      setTimeout(() => {
        const cycleInput = document.getElementById("upgradeBillingCycle");
        const referenceInput = document.getElementById("upgradePaymentReference");
        if (cycleInput) cycleInput.value = String(cycle || "");
        if (referenceInput) referenceInput.focus();
      }, 150);

      if (opened) {
        showSuccess("Selar checkout opened. After payment, submit your Selar order reference here.");
      } else {
        showWarning("Selar checkout could not open automatically. Open the Selar product link, then return here with your order reference.");
      }
      return;
    }

    try {
      const { handleFlutterwavePayment } = await import("./paymentFlutterwave.js");
      await handleFlutterwavePayment(cycle, {
        user,
        showWarning,
        showSuccess,
        showError,
        getAuthToken: getCurrentAuthToken,
        onVerified: async (result) => {
          emitFlutterwavePlanActivation(result);
          updateAuthUI();
          refreshDashboardInsights();
          await refreshAccessibleTopics();
          refreshProfileUpgradeSection().catch(() => {});
          if (isCurrentUserAdmin()) {
            renderAdminRequests();
          }
        },
      });
    } catch (error) {
      showError(error?.message || "Payment could not be started.");
    }
  };

  // Completes a Flutterwave redirect return: verifies the transaction,
  // refreshes the UI, and opens the receipt lightbox. Runs at boot (after
  // session restore) and again after login to cover pending returns.
  const processFlutterwavePaymentReturn = async () => {
    try {
      const { handleFlutterwavePaymentReturn } = await import("./paymentFlutterwave.js");
      await handleFlutterwavePaymentReturn({
        getAuthToken: getCurrentAuthToken,
        showWarning,
        showSuccess,
        showError,
        email: String(getCurrentUser()?.email || ""),
        onStartStudying: () => showScreen("topicSelectionScreen"),
        onVerified: async (result) => {
          emitFlutterwavePlanActivation(result);
          updateAuthUI();
          refreshDashboardInsights();
          await refreshAccessibleTopics();
          refreshProfileUpgradeSection().catch(() => {});
          if (isCurrentUserAdmin()) {
            renderAdminRequests();
          }
        },
      });
    } catch (_) {
      // A failed payment return must never block normal app startup.
    }
  };

  window.processFlutterwavePaymentReturn = processFlutterwavePaymentReturn;

  const headerUpgradeBtn = document.getElementById("headerUpgradeBtn");
  if (headerUpgradeBtn) headerUpgradeBtn.addEventListener("click", handleUpgradeClick);

  const dashboardUpgradeBtn = document.getElementById("dashboardUpgradeBtn");
  if (dashboardUpgradeBtn) dashboardUpgradeBtn.addEventListener("click", handleUpgradeClick);

  const resultsUpgradeBtn = document.getElementById("resultsUpgradeBtn");
  if (resultsUpgradeBtn) resultsUpgradeBtn.addEventListener("click", handleUpgradeClick);

  const premiumExplorePlansBtn = document.getElementById("premiumExplorePlansBtn");
  if (premiumExplorePlansBtn) premiumExplorePlansBtn.addEventListener("click", handleUpgradeClick);

  const pricingCloseBtn = document.getElementById("pricingCloseBtn");
  if (pricingCloseBtn) pricingCloseBtn.addEventListener("click", closePricingModal);

  const selectPlanBtns = document.querySelectorAll(".select-plan-btn");
  selectPlanBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const cycle = e.target.closest(".pricing-card")?.dataset.planCycle;
      if (cycle) handlePlanSelect(cycle);
    });
  });

  const premiumMaybeLaterBtn = document.getElementById("premiumMaybeLaterBtn");
  if (premiumMaybeLaterBtn) premiumMaybeLaterBtn.addEventListener("click", closePremiumModal);

  const premiumCloseBtn = document.getElementById("premiumCloseBtn");
  if (premiumCloseBtn) premiumCloseBtn.addEventListener("click", closePremiumModal);

  const premiumModal = document.getElementById("premiumModal");
  if (premiumModal) {
    premiumModal.addEventListener("click", (event) => {
      if (event.target === premiumModal) closePremiumModal();
    });
  }

  if (headerFeedbackBtn) {
    headerFeedbackBtn.addEventListener("click", () => {
      openFeedbackModal({
        sourceScreen: "help",
        defaultCategory: "",
      });
    });
  }

  if (openQuizFeedbackBtn) {
    openQuizFeedbackBtn.addEventListener("click", () => {
      const context = getCurrentQuestionFeedbackContext();
      if (!context) {
        showWarning("Question details are unavailable right now. Please try again on the active question.");
        return;
      }
      openFeedbackModal(context);
    });
  }

  if (openResultsFeedbackBtn) {
    openResultsFeedbackBtn.addEventListener("click", () => {
      const context = getLatestResultsFeedbackContext() || {
        sourceScreen: "results",
        defaultCategory: "",
        topicId: String(currentTopic?.id || "").trim(),
        topicName: String(currentTopic?.name || "").trim(),
        sessionMode: String(getCurrentMode() || "").trim().toLowerCase(),
      };
      openFeedbackModal(context);
    });
  }

  if (feedbackCloseBtn) {
    feedbackCloseBtn.addEventListener("click", closeFeedbackModal);
  }

  if (feedbackCancelBtn) {
    feedbackCancelBtn.addEventListener("click", closeFeedbackModal);
  }

  if (feedbackModal) {
    feedbackModal.addEventListener("click", (event) => {
      if (event.target === feedbackModal) {
        closeFeedbackModal();
      }
    });
  }

  if (feedbackMessage) {
    feedbackMessage.addEventListener("input", updateFeedbackCharCount);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!feedbackModal || feedbackModal.classList.contains("hidden")) return;
    closeFeedbackModal();
  });

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const category = document.getElementById("feedbackCategory")?.value || "";
      const message = document.getElementById("feedbackMessage")?.value || "";
      const context = activeFeedbackContext && typeof activeFeedbackContext === "object"
        ? { ...activeFeedbackContext }
        : { sourceScreen: "help" };

      try {
        await runOperationWithFeedback(
          async () => {
            const clientInfo = buildFeedbackClientInfo();
            return submitFeedbackSubmission({
              sourceScreen: context.sourceScreen || "help",
              category,
              message,
              topicId: context.topicId || "",
              topicName: context.topicName || "",
              questionId: context.questionId || "",
              quizAttemptId: context.quizAttemptId || "",
              sessionMode: context.sessionMode || "",
              questionPreview: context.questionPreview || "",
              scoreSummary: context.scoreSummary || "",
              difficulty: context.difficulty || "",
              sourceDocument: context.sourceDocument || "",
              sourceSection: context.sourceSection || "",
              subcategoryName: context.subcategoryName || "",
              clientInfo,
            });
          },
          {
            loadingMessage: "Sending feedback...",
            successMessage: "Feedback sent. Thank you.",
            failurePrefix: "Unable to send feedback:",
          },
        );
        closeFeedbackModal();
        if (isCurrentUserAdmin()) {
          refreshAdminFeedbackSubmissions().catch(() => {});
        }
      } catch (error) {
        // Error toast already displayed by runOperationWithFeedback.
      }
    });
  }

  if (adminFeedbackSearch) {
    adminFeedbackSearch.addEventListener("input", () => renderAdminFeedbackList());
  }

  if (adminFeedbackStatusFilter) {
    adminFeedbackStatusFilter.addEventListener("change", () => renderAdminFeedbackList());
  }

  if (adminFeedbackCategoryFilter) {
    adminFeedbackCategoryFilter.addEventListener("change", () => renderAdminFeedbackList());
  }

  if (adminFeedbackSourceFilter) {
    adminFeedbackSourceFilter.addEventListener("change", () => renderAdminFeedbackList());
  }

  const adminFeedbackSort = document.getElementById("adminFeedbackSort");
  if (adminFeedbackSort) {
    adminFeedbackSort.addEventListener("change", () => renderAdminFeedbackList());
  }

  if (refreshAdminFeedbackBtn) {
    refreshAdminFeedbackBtn.addEventListener("click", async () => {
      if (!isCurrentUserAdmin()) {
        showWarning("Admin access is restricted.");
        return;
      }
      try {
        await runOperationWithFeedback(
          async () => {
            await refreshAdminFeedbackSubmissions();
          },
          {
            loadingMessage: "Refreshing feedback inbox...",
            successMessage: "Feedback inbox refreshed.",
            failurePrefix: "Unable to refresh feedback inbox:",
          },
        );
        logAdminOperation({
          action: "Refresh feedback inbox",
          target: "feedback queue",
          status: "success",
          message: "Feedback inbox refreshed from Firestore.",
        });
        renderAdminOperationHistory();
      } catch (error) {
        logAdminOperation({
          action: "Refresh feedback inbox",
          target: "feedback queue",
          status: "failed",
          message: error?.message || "Unknown error.",
        });
        renderAdminOperationHistory();
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

  if (adminVerificationFilter) {
    adminVerificationFilter.addEventListener("change", () => {
      renderAdminUserDirectory();
    });
  }

  const adminUserSort = document.getElementById("adminUserSort");
  if (adminUserSort) {
    adminUserSort.addEventListener("change", () => {
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

  const shareResultBtn = document.getElementById("shareResultBtn");
  if (shareResultBtn) {
    shareResultBtn.addEventListener("click", async () => {
      const scoreElement = document.getElementById("finalScore");
      const score = scoreElement ? scoreElement.textContent : "a great score";
      const topicName = currentTopic ? currentTopic.name : "my exams";
      
      const shareData = {
        title: 'Promotion CBT Result',
        text: `I just scored ${score} in "${topicName}" on Promotion CBT! Can you beat my score?`,
        url: window.location.href,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
          showSuccess("Score copied to clipboard!");
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error sharing:", err);
        }
      }
    });
  }
}

function initializeQuizScreenHandlers() {
  const flagQuestionBtn = document.getElementById("flagQuestionBtn");
  if (flagQuestionBtn) {
    flagQuestionBtn.addEventListener("click", () => {
      toggleCurrentQuestionFlag();
      syncRevisionButtonState(); // in case they go to dashboard next
    });
  }

  const bookmarkQuestionBtn = document.getElementById("bookmarkQuestionBtn");
  if (bookmarkQuestionBtn) {
    bookmarkQuestionBtn.addEventListener("click", () => {
      toggleCurrentQuestionBookmark();
    });
  }
}

// Wire a clear-text (✕) control into every .search-wrap search box. The
// button appears once the input has content and dispatches an input event so
// the box's own filter listener re-runs with the cleared value.
function initializeSearchClearControls() {
  document.querySelectorAll(".search-wrap input[type='search']").forEach((input) => {
    const wrap = input.closest(".search-wrap");
    const clearButton = wrap ? wrap.querySelector(".search-clear") : null;
    if (!wrap || !clearButton) return;
    const sync = () => wrap.classList.toggle("has-text", Boolean(input.value));
    input.addEventListener("input", sync);
    clearButton.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      sync();
    });
    sync();
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  startCloudPlanAutoSync();
  startAdminDirectoryAutoSync();
  initializeDashboardActions();
  initializeSearchClearControls();
  initializeReviewMistakesControls();
  initializeScreenLinkHandlers();
  initializePasswordToggles();
  initializeThemeShortcut();
  initializeAuthUI();
  initializePasswordResetScreen();
  updateAuthUI();
  showLoadingOverlay(true);
  try {
    const handledResetLink = await handlePasswordResetLinkOnStartup();
    await init();
    if (!handledResetLink) {
      await handleMigrationLinkOnStartup();
    }
  } finally {
    showLoadingOverlay(false);
  }
  initializeResultButtons();
  initializeQuizScreenHandlers();
  refreshDashboardInsights();

  document.addEventListener("screenchange", (event) => {
    persistScreenState(event?.detail?.screenId);
    renderFeedbackUiState();
    renderPremiumCTA();
    if (
      event?.detail?.screenId === "topicSelectionScreen" ||
      event?.detail?.screenId === "analyticsScreen" ||
      event?.detail?.screenId === "reviewMistakesScreen" ||
      event?.detail?.screenId === "statesScreen"
    ) {
      refreshDashboardInsights();
    }
    if (event?.detail?.screenId === "profileScreen") {
      updateProfileDataSyncUI();
      refreshProfileUpgradeSection().catch(() => {});
    }
    if (event?.detail?.screenId === "reviewMistakesScreen") {
      renderReviewMistakesScreen();
    }
    if (event?.detail?.screenId === "adminScreen" && isCurrentUserAdmin()) {
      renderAdminFeedbackList();
      refreshAdminFeedbackSubmissions().catch(() => {});
    }
  });

  document.addEventListener("sessionsetupchange", (event) => {
    const topic = event?.detail?.topic;
    if (!topic) return;
    currentTopic = topic;
    applySessionSetupState(topic);
  });

  document.addEventListener("cloudprogresssyncchange", () => {
    updateProfileDataSyncUI();
    refreshDashboardInsights();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      triggerBackgroundProgressSync({ force: true });
    }
  });

  window.addEventListener("focus", () => {
    triggerBackgroundProgressSync({ force: true });
  });

  window.addEventListener("online", () => {
    triggerBackgroundProgressSync({ force: true });
  });

  await restoreScreenState();
  updateProfileDataSyncUI();
  await hydrateCloudProgressIfNeeded();
  refreshAmbientCloudSyncState();
  refreshDashboardInsights();
  triggerBackgroundProgressSync({ force: true });
  if (isCurrentUserAdmin()) {
    renderAdminRequests();
    renderAdminOverrides();
    renderAdminFeedbackList();
    refreshAdminUserDirectory();
    refreshAdminFeedbackSubmissions().catch(() => {});
  }
  // A Flutterwave redirect return lands on this page with
  // status/tx_ref/transaction_id query params; verify and activate now that
  // the session is restored (or store it pending login).
  if (typeof window.processFlutterwavePaymentReturn === "function") {
    await window.processFlutterwavePaymentReturn();
  }
  const openedMigrationFlow = await handleMigrationLinkOnStartup();
  if (!openedMigrationFlow) {
    ensureAuthPromptOnStartup();
  }

  document.addEventListener("authplanchange", async () => {
    updateAuthUI();
    refreshAmbientCloudSyncState();
    triggerBackgroundProgressSync({ force: true });
    refreshDashboardInsights();
    await refreshAccessibleTopics();
    if (isCurrentUserAdmin()) {
      renderAdminOverrides();
    }
  });

  initializeThemeToggle();
});






