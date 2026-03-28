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
import { DEFAULT_MOCK_EXAM_TEMPLATE_ID } from "./mockExamTemplates.js";
import {
  applySessionSetupCopy,
  displayTopics,
  selectTopic,
  showError,
  showScreen,
  showSuccess,
  showWarning,
} from "./ui.js";
import {
  clearPersistedQuizRuntime,
  dismissRetryMissedQuestion,
  getCloudProgressSyncStatus,
  getPersistedQuizRuntime,
  getRetryMissedQueueCount,
  getRetryMissedQueueSnapshot,
  getRetryMissedQuestions,
  getSpacedPracticeDueCount,
  getSpacedPracticeQuestions,
  loadQuestions,
  RETRY_MISSED_TOPIC_ID,
  SPACED_PRACTICE_TOPIC_ID,
  restorePersistedQuizRuntime,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  syncProgressFromCloudNow,
  retakeFullQuiz,
} from "./quiz.js";
import { normalizeExplanationText, parseMarkdown } from "./quiz/formatting.js";
import { debugLog } from "./logger.js";
import { calculateStreakDays, getWeakestTopicId } from "./metrics.js";
import { initializeThemeShortcut, initializeThemeToggle } from "./app/theme.js";
import { setToolbarIcon } from "./app/toolbar.js";
import { createMockSetupController } from "./app/mockSetup.js";
import {
  clearLocalPlanOverride,
  forceCloudPlanSync,
  getAccessibleTopics,
  getCurrentEntitlement,
  getFreeMockExamEligibility,
  getAdminUserDirectory,
  getAdminOperationHistory,
  logAdminOperationToCloud,
  getAuthSummaryLabel,
  getAuthProviderLabel,
  getCurrentUser,
  getCurrentUserUpgradeRequest,
  getLocalPlanOverrides,
  getPlanOverrideSyncMeta,
  getProgressStorageKeyForCurrentUser,
  isCurrentUserAdmin,
  isCloudAuthMisconfigured,
  isCloudProgressSyncEnabled,
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
let pendingMockExamTemplateId = DEFAULT_MOCK_EXAM_TEMPLATE_ID;
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
const SCREEN_STATE_STORAGE_KEY = "cbt_screen_state_v1";
const DASHBOARD_RECOMMENDATION_DISMISSAL_STORAGE_PREFIX = "cbt_dashboard_recommendation_dismissed_v1_";
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
    debugLog(`Admin operation history sync failed: ${error?.message || "request failed."}`);
  }

  const history = readAdminOperationHistory();
  if (countLabel) {
    countLabel.textContent = `Entries: ${history.length}`;
  }

  if (!history.length) {
    container.innerHTML =
      '<div class="admin-request-item"><p class="meta">No admin operations logged yet.</p></div>';
    return;
  }

  container.innerHTML = "";
  const list = document.createElement("div");
  list.className = "mistake-list admin-history-list";

  history.forEach((entry) => {
    const card = document.createElement("article");
    const normalizedStatus = String(entry?.status || "").trim().toLowerCase();
    const statusClass = normalizedStatus === "failed" || normalizedStatus === "rejected"
      ? "rejected"
      : normalizedStatus === "pending"
        ? "pending"
        : normalizedStatus
          ? "approved"
          : "neutral";
    const whenLabel = formatRelativeTime(entry?.createdAt) || formatDateTime(entry?.createdAt);
    card.className = "admin-request-item admin-history-entry";
    card.innerHTML = `
      <div class="admin-history-entry-head">
        <div class="admin-history-entry-title-wrap">
          <h4 class="admin-history-entry-title">${escapeHtml(entry?.action || "Admin action")}</h4>
          <p class="meta">${escapeHtml(whenLabel || "-")}</p>
        </div>
        <span class="admin-badge ${statusClass}">${escapeHtml(entry?.status || "-")}</span>
      </div>
      <div class="admin-history-meta-grid">
        <div class="admin-history-meta-item">
          <span class="eyebrow">Time</span>
          <strong>${escapeHtml(formatDateTime(entry?.createdAt))}</strong>
        </div>
        <div class="admin-history-meta-item">
          <span class="eyebrow">Target</span>
          <strong>${escapeHtml(entry?.target || "-")}</strong>
        </div>
        <div class="admin-history-meta-item">
          <span class="eyebrow">Actor</span>
          <strong>${escapeHtml(entry?.actor || "-")}</strong>
        </div>
        <div class="admin-history-meta-item">
          <span class="eyebrow">Outcome</span>
          <strong>${escapeHtml(entry?.status || "-")}</strong>
        </div>
        <div class="admin-history-meta-item admin-history-meta-item-wide">
          <span class="eyebrow">Details</span>
          <div class="admin-history-message"></div>
        </div>
      </div>
    `;

    const messageCell = card.querySelector(".admin-history-message");
    const messageText = String(entry?.message || "-");
    const linkMatch = messageText.match(/https?:\/\/[^\s]+/);
    if (!linkMatch) {
      messageCell.textContent = messageText;
    } else {
      const rawLink = linkMatch[0];
      const linkUrl = rawLink.replace(/[),.]+$/, "");
      const labelText = messageText
        .replace(rawLink, "")
        .replace(/Manual verification link:?\s*/i, "")
        .trim();

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
          setTimeout(() => {
            copyButton.textContent = "Copy link";
          }, 1500);
        } catch (error) {
          window.prompt("Copy verification link:", linkUrl);
        }
      });

      actions.appendChild(link);
      actions.appendChild(copyButton);
      messageCell.appendChild(actions);
    }

    list.appendChild(card);
  });

  container.appendChild(list);
}function normalizeUpgradeRequestStatus(value) {
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

function getTrafficClassByPercentage(percentage) {
  if (Number(percentage) >= 70) return "traffic-green";
  if (Number(percentage) >= 50) return "traffic-amber";
  return "traffic-red";
}

function getActivityTrafficClass(count) {
  const total = Number(count || 0);
  if (total >= 2) return "traffic-green";
  if (total === 1) return "traffic-amber";
  return "traffic-red";
}

function formatModeLabel(mode) {
  const value = String(mode || "").trim().toLowerCase();
  if (!value) return "Session";
  if (value === "practice") return "Practice";
  if (value === "exam") return "Timed Topic Test";
  if (value === "review") return "Study Review";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatGlBandLabel(glBand) {
  const value = String(glBand || "").trim();
  if (!value) return "";
  if (value.toLowerCase() === "general") return "General";
  return value.replace(/_/g, "-").toUpperCase().replace("GL-", "GL ");
}

function formatDifficultyLabel(difficulty) {
  const value = String(difficulty || "").trim().toLowerCase();
  if (!value) return "";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
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
  const optionMarkup = normalizedOptions
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
  selectEl.innerHTML = includeAllOption
    ? `<option value="all">${escapeHtml(includeAllLabel)}</option>${optionMarkup}`
    : optionMarkup;
  if (normalizedOptions.some((option) => option.value === selectedValue)) {
    selectEl.value = selectedValue;
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
  const optionMarkup = options
    .map((value) => `<option value="${value}">${value} questions</option>`)
    .join("");
  const allLabel = totalQuestions > 0 ? `All available (${totalQuestions})` : "All available";
  selectEl.innerHTML = `${optionMarkup}<option value="all">${escapeHtml(allLabel)}</option>`;
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
    setupSuggestionChips.innerHTML = suggestionChips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
    setupSuggestionSignalChips.classList.toggle("hidden", suggestionSignalChips.length === 0);
    setupSuggestionSignalChips.innerHTML = suggestionSignalChips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
    setupSuggestionConfidence.classList.toggle("hidden", !suggestionConfidenceLabel);
    setupSuggestionConfidence.classList.remove("high", "medium", "low");
    setupSuggestionConfidence.classList.add(["high", "medium", "low"].includes(suggestionConfidenceTone) ? suggestionConfidenceTone : "medium");
    setupSuggestionConfidence.innerHTML = suggestionConfidenceLabel
      ? `<strong>Confidence:</strong> ${escapeHtml(suggestionConfidenceLabel)}${suggestionConfidenceDescription ? `. ${escapeHtml(suggestionConfidenceDescription)}` : ""}`
      : "";
  } else {
    setupSuggestionTitle.textContent = "Suggested Setup";
    setupSuggestionMessage.textContent = "These changes came from your latest results.";
    setupSuggestionChips.innerHTML = "";
    setupSuggestionSignalChips.classList.add("hidden");
    setupSuggestionSignalChips.innerHTML = "";
    setupSuggestionConfidence.classList.add("hidden");
    setupSuggestionConfidence.classList.remove("high", "medium", "low");
    setupSuggestionConfidence.innerHTML = "";
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
function toLocalDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getAttemptTopicLabel(attempt) {
  const topicId = String(attempt?.topicId || "").trim();
  const explicitName = String(attempt?.topicName || "").trim();
  if (topicId === MOCK_EXAM_TOPIC_ID) {
    return explicitName || "Directorate Mock Exam";
  }
  return explicitName || getTopicNameById(topicId);
}

function getAttemptHeadline(attempt) {
  if (String(attempt?.topicId || "").trim() === MOCK_EXAM_TOPIC_ID) {
    return String(attempt?.templateName || "").trim() || "General Mock";
  }
  return getAttemptTopicLabel(attempt);
}

function getTrendMeta(attempt) {
  const parts = [formatModeLabel(attempt?.mode)];
  const topicLabel = getAttemptTopicLabel(attempt);
  if (topicLabel && topicLabel !== getAttemptHeadline(attempt)) {
    parts.push(topicLabel);
  }
  const glBandLabel = formatGlBandLabel(attempt?.glBand);
  if (glBandLabel && glBandLabel !== "General") {
    parts.push(glBandLabel);
  }
  if (Number(attempt?.totalQuestions || 0) > 0) {
    parts.push(`${Number(attempt.totalQuestions)} questions`);
  }
  return parts.filter(Boolean).join(" | ");
}

function buildTrendItems(attempts = []) {
  return attempts
    .slice(-8)
    .reverse()
    .map((attempt) => ({
      id: String(attempt?.attemptId || attempt?.createdAt || Math.random()),
      score: Math.round(Number(attempt?.scorePercentage || 0)),
      headline: getAttemptHeadline(attempt),
      meta: getTrendMeta(attempt),
      when: formatRelativeTime(attempt?.createdAt) || formatDateTime(attempt?.createdAt),
      className: getTrafficClassByPercentage(attempt?.scorePercentage),
    }));
}

function buildWeeklyConsistency(attempts = []) {
  const attemptsByDay = new Map();
  attempts.forEach((attempt) => {
    const dayKey = toLocalDayKey(attempt?.createdAt);
    if (!dayKey) return;
    attemptsByDay.set(dayKey, (attemptsByDay.get(dayKey) || 0) + 1);
  });

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const dayKey = toLocalDayKey(date);
    const count = attemptsByDay.get(dayKey) || 0;
    days.push({
      id: dayKey,
      dayLabel: date.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
      className: getActivityTrafficClass(count),
    });
  }

  return days;
}

function buildTopicMastery(attempts = []) {
  const byTopic = new Map();

  const recordTopicScore = (topicId, topicName, score) => {
    if (!isCoreAnalyticsTopicId(topicId)) return;
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return;

    const existing = byTopic.get(topicId) || {
      topicId,
      topicName: topicName || getTopicNameById(topicId),
      scoreTotal: 0,
      attempts: 0,
    };
    existing.topicName = topicName || existing.topicName;
    existing.scoreTotal += numericScore;
    existing.attempts += 1;
    byTopic.set(topicId, existing);
  };

  attempts.forEach((attempt) => {
    const topicId = String(attempt?.topicId || "").trim();
    const sourceBreakdown = Array.isArray(attempt?.sourceTopicBreakdown)
      ? attempt.sourceTopicBreakdown
      : [];

    if (topicId === MOCK_EXAM_TOPIC_ID && sourceBreakdown.length) {
      sourceBreakdown.forEach((entry) => {
        recordTopicScore(entry?.topicId, entry?.topicName, entry?.accuracy);
      });
      return;
    }

    recordTopicScore(topicId, attempt?.topicName, attempt?.scorePercentage);
  });

  return allTopics
    .filter((topic) => isCoreAnalyticsTopicId(topic?.id))
    .map((topic) => {
      const entry = byTopic.get(topic.id);
      const attemptsCount = Number(entry?.attempts || 0);
      return {
        topicId: topic.id,
        topicName: topic.name || entry?.topicName || topic.id,
        averageScore: attemptsCount
          ? Math.round(entry.scoreTotal / attemptsCount)
          : null,
        attempts: attemptsCount,
      };
    });
}

function buildSubcategoryInsights(attempts = []) {
  const bySubcategory = new Map();

  attempts.forEach((attempt) => {
    const breakdown = Array.isArray(attempt?.subcategoryBreakdown)
      ? attempt.subcategoryBreakdown
      : [];
    breakdown.forEach((entry) => {
      const subcategoryId = String(entry?.subcategoryId || "").trim();
      if (!subcategoryId) return;

      const existing = bySubcategory.get(subcategoryId) || {
        subcategoryId,
        subcategoryName: String(entry?.subcategoryName || subcategoryId).trim(),
        correct: 0,
        answered: 0,
        total: 0,
        sessions: 0,
      };
      existing.correct += Number(entry?.correct || 0);
      existing.answered += Number(entry?.answered || 0);
      existing.total += Number(entry?.total || 0);
      existing.sessions += 1;
      bySubcategory.set(subcategoryId, existing);
    });
  });

  return Array.from(bySubcategory.values())
    .map((entry) => ({
      ...entry,
      accuracy: entry.answered
        ? Math.round((entry.correct / entry.answered) * 100)
        : 0,
    }))
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy ||
        right.total - left.total ||
        left.subcategoryName.localeCompare(right.subcategoryName),
    );
}

function buildDifficultyInsights(attempts = []) {
  const byDifficulty = new Map();

  attempts.forEach((attempt) => {
    const breakdown = Array.isArray(attempt?.difficultyBreakdown)
      ? attempt.difficultyBreakdown
      : [];
    breakdown.forEach((entry) => {
      const difficulty = String(entry?.difficulty || "").trim().toLowerCase();
      if (!difficulty) return;

      const existing = byDifficulty.get(difficulty) || {
        difficulty,
        correct: 0,
        answered: 0,
        total: 0,
        sessions: 0,
      };
      existing.correct += Number(entry?.correct || 0);
      existing.answered += Number(entry?.answered || 0);
      existing.total += Number(entry?.total || 0);
      existing.sessions += 1;
      byDifficulty.set(difficulty, existing);
    });
  });

  const rank = { easy: 0, medium: 1, hard: 2 };
  return Array.from(byDifficulty.values())
    .map((entry) => ({
      ...entry,
      accuracy: entry.answered
        ? Math.round((entry.correct / entry.answered) * 100)
        : 0,
    }))
    .sort(
      (left, right) =>
        left.accuracy - right.accuracy ||
        (rank[left.difficulty] ?? 99) - (rank[right.difficulty] ?? 99) ||
        right.total - left.total,
    );
}

function averageAttemptScores(attempts = []) {
  const scoredAttempts = Array.isArray(attempts)
    ? attempts
        .map((attempt) => Number(attempt?.scorePercentage))
        .filter((score) => Number.isFinite(score))
    : [];
  if (!scoredAttempts.length) return null;
  return Math.round(
    scoredAttempts.reduce((sum, score) => sum + score, 0) / scoredAttempts.length,
  );
}

function getLatestMockWeakTopic(attempt) {
  const sourceBreakdown = Array.isArray(attempt?.sourceTopicBreakdown)
    ? attempt.sourceTopicBreakdown
    : [];
  if (String(attempt?.topicId || "").trim() !== MOCK_EXAM_TOPIC_ID || !sourceBreakdown.length) {
    return null;
  }

  return [...sourceBreakdown].sort(
    (left, right) =>
      Number(left?.accuracy || 0) - Number(right?.accuracy || 0) ||
      Number(right?.total || 0) - Number(left?.total || 0),
  )[0] || null;
}

function buildRecentScoreSignal(attempts = []) {
  const scoredAttempts = Array.isArray(attempts)
    ? attempts.filter((attempt) => Number.isFinite(Number(attempt?.scorePercentage)))
    : [];
  if (scoredAttempts.length < 2) return null;

  const latestWindowSize = Math.min(3, Math.max(1, Math.floor(scoredAttempts.length / 2)));
  const latestWindow = scoredAttempts.slice(-latestWindowSize);
  const previousWindow = scoredAttempts.slice(
    Math.max(0, scoredAttempts.length - latestWindowSize * 2),
    Math.max(0, scoredAttempts.length - latestWindowSize),
  );
  const baselineWindow = previousWindow.length
    ? previousWindow
    : scoredAttempts.slice(0, Math.max(1, scoredAttempts.length - latestWindow.length));
  if (!baselineWindow.length) return null;

  const latestAverage = averageAttemptScores(latestWindow);
  const previousAverage = averageAttemptScores(baselineWindow);
  if (latestAverage === null || previousAverage === null) return null;

  const delta = latestAverage - previousAverage;
  let direction = "steady";
  if (delta >= 6) direction = "improving";
  if (delta <= -6) direction = "slipping";

  return {
    direction,
    delta,
    latestAverage,
    previousAverage,
    latestCount: latestWindow.length,
    previousCount: baselineWindow.length,
  };
}

function getAttemptTimingSignal(attempt) {
  if (String(attempt?.mode || "").trim() !== "exam") return null;

  const topicId = String(attempt?.topicId || "").trim();
  const totalQuestions = Number(attempt?.totalQuestions || 0);
  const allowedSeconds =
    topicId === MOCK_EXAM_TOPIC_ID ? 45 * 60 : getTimedTopicTestDurationSeconds(totalQuestions);
  if (!allowedSeconds) return null;

  const elapsedSeconds = Math.max(0, Math.min(allowedSeconds, Number(attempt?.timeTakenSec || 0)));
  const unansweredCount = Math.max(0, Number(attempt?.unansweredCount || 0));
  const usedRatio = allowedSeconds > 0 ? elapsedSeconds / allowedSeconds : 0;
  let severity = "steady";
  if (unansweredCount > 0 || usedRatio >= 0.95) {
    severity = "high";
  } else if (usedRatio <= 0.6) {
    severity = "comfortable";
  }

  return {
    severity,
    allowedSeconds,
    elapsedSeconds,
    remainingSeconds: Math.max(0, allowedSeconds - elapsedSeconds),
    usedRatio,
    unansweredCount,
  };
}

function buildDashboardRecommendationConfidence(topic, insights) {
  const fallbackTopicId = String(
    topic?.id || insights?.recommendedTopicId || insights?.weakestTopic?.topicId || insights?.latestMockWeakTopic?.topicId || "",
  ).trim();
  const fallbackTopicName = String(
    topic?.name || insights?.weakestTopic?.topicName || insights?.latestMockWeakTopic?.topicName || "",
  ).trim();
  const topicHistory = Array.isArray(insights?.topicMastery)
    ? insights.topicMastery.find((entry) => {
        const entryTopicId = String(entry?.topicId || "").trim();
        const entryTopicName = String(entry?.topicName || "").trim();
        return (fallbackTopicId && entryTopicId === fallbackTopicId) || (!fallbackTopicId && fallbackTopicName && entryTopicName === fallbackTopicName);
      })
    : null;
  const resolvedTopicId = String(topicHistory?.topicId || fallbackTopicId).trim();
  const resolvedTopicName = String(topicHistory?.topicName || fallbackTopicName).trim();
  const weakestTopicMatches =
    String(insights?.weakestTopic?.topicId || "").trim() === resolvedTopicId ||
    (resolvedTopicName && String(insights?.weakestTopic?.topicName || "").trim() === resolvedTopicName);
  const repeatedSubcategorySessions = weakestTopicMatches
    ? Number(insights?.weakestSubcategory?.sessions || 0)
    : 0;
  const topicAttempts = Number(topicHistory?.attempts || insights?.weakestTopic?.attempts || 0);
  const recentScoreSignal = insights?.recentScoreSignal || null;
  const latestTimingSignal = insights?.latestTimingSignal || null;
  const latestMockMatchesTopic =
    String(insights?.latestMockWeakTopic?.topicId || "").trim() === resolvedTopicId ||
    (resolvedTopicName && String(insights?.latestMockWeakTopic?.topicName || "").trim() === resolvedTopicName);
  const trendEvidence = recentScoreSignal?.direction && recentScoreSignal.direction !== "steady" ? 1 : 0;
  const timingEvidence = latestTimingSignal?.severity && latestTimingSignal.severity !== "steady" ? 1 : 0;
  const topicHistoryEvidence = topicAttempts >= 2 ? 1 : 0;
  const repeatedWeakEvidence = repeatedSubcategorySessions >= 2 ? 1 : 0;
  const alignedSignalCount =
    topicHistoryEvidence +
    repeatedWeakEvidence +
    trendEvidence +
    timingEvidence +
    (latestMockMatchesTopic ? 1 : 0);
  const hasStrongHistory = topicAttempts >= 4 || repeatedSubcategorySessions >= 3;
  const totalAttempts = Number(insights?.totalAttempts || 0);

  if (totalAttempts >= 4 && hasStrongHistory && alignedSignalCount >= 2) {
    return {
      label: "Repeated Pattern",
      tone: "high",
      description: "Repeated sessions and multiple aligned signals are pointing to the same follow-up move. This has moved beyond a developing signal because the same weak area keeps surfacing.",
    };
  }

  if (
    (totalAttempts >= 2 && alignedSignalCount >= 2) ||
    (hasStrongHistory && alignedSignalCount >= 2)
  ) {
    return {
      label: "Building Pattern",
      tone: "medium",
      description: "More than one signal is lining up, so this is moving beyond a one-off result, but it is still developing.",
    };
  }

  return {
    label: "Early Pattern",
    tone: "low",
    description: "This is a light starting signal from limited history and should be treated as a guide, not a rule.",
  };
}
function buildDashboardRecommendationSignals(insights) {
  const signalChips = [];
  const recentScoreSignal = insights?.recentScoreSignal || null;
  const latestTimingSignal = insights?.latestTimingSignal || null;

  if (recentScoreSignal?.direction === "slipping") {
    signalChips.push(`Trend: Slipping ${Math.abs(Math.round(recentScoreSignal.delta))} pts`);
  } else if (recentScoreSignal?.direction === "improving") {
    signalChips.push(`Trend: Improving ${Math.round(recentScoreSignal.delta)} pts`);
  }

  if (latestTimingSignal?.severity === "high") {
    signalChips.push(
      latestTimingSignal.unansweredCount > 0
        ? `Pace: ${latestTimingSignal.unansweredCount} Unanswered`
        : "Pace: Under Pressure",
    );
  } else if (latestTimingSignal?.severity === "comfortable") {
    signalChips.push("Pace: Comfortable");
  }

  return signalChips;
}

function getDashboardRecommendationDismissalKey(user) {
  const userId = String(user?.id || "").trim();
  return userId ? `${DASHBOARD_RECOMMENDATION_DISMISSAL_STORAGE_PREFIX}${userId}` : "";
}

function readDismissedDashboardRecommendationSignature(user) {
  const storageKey = getDashboardRecommendationDismissalKey(user);
  if (!storageKey) return "";
  try {
    return String(localStorage.getItem(storageKey) || "").trim();
  } catch (error) {
    return "";
  }
}

function writeDismissedDashboardRecommendationSignature(user, signature) {
  const storageKey = getDashboardRecommendationDismissalKey(user);
  if (!storageKey) return;
  try {
    if (!signature) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, String(signature));
  } catch (error) {
    console.warn("Unable to persist dismissed dashboard recommendation", error);
  }
}

function buildDashboardSuggestionSignature(topic, suggestion) {
  if (!topic || !suggestion) return "";
  return JSON.stringify({
    topicId: String(topic?.id || "").trim(),
    message: String(suggestion?.message || "").trim(),
    chips: Array.isArray(suggestion?.chips) ? suggestion.chips.filter(Boolean) : [],
    signalChips: Array.isArray(suggestion?.signalChips) ? suggestion.signalChips.filter(Boolean) : [],
    confidenceLabel: String(suggestion?.confidenceLabel || "").trim(),
    confidenceTone: String(suggestion?.confidenceTone || "").trim(),
  });
}
function buildRecommendation(insights) {
  if (!insights.totalAttempts) {
    return {
      title: "Start with Public Service Rules.",
      meta: "Best next-step guidance sharpens after your first scored session.",
      signalChips: [],
      confidenceLabel: "",
      confidenceTone: "medium",
      confidenceDescription: "",
    };
  }

  const latestAttempt = insights.latestAttempt;
  const weakestTopic = insights.weakestTopic;
  const weakestSubcategory = insights.weakestSubcategory;
  const weakestDifficulty = insights.weakestDifficulty;
  const latestWeakTopic = insights.latestMockWeakTopic || getLatestMockWeakTopic(latestAttempt);
  const recentScoreSignal = insights.recentScoreSignal || buildRecentScoreSignal(insights.attempts);
  const latestTimingSignal = insights.latestTimingSignal || getAttemptTimingSignal(latestAttempt);
  const recommendationConfidence = buildDashboardRecommendationConfidence({ id: insights.recommendedTopicId }, insights);
  const recommendationSignals = buildDashboardRecommendationSignals(insights);
  const isRepeatedPattern = recommendationConfidence.label === "Repeated Pattern";
  const isBuildingPattern = recommendationConfidence.label === "Building Pattern";
  const recommendationNotes = [];
  if (weakestDifficulty?.answered) {
    recommendationNotes.push(
      `${formatDifficultyLabel(weakestDifficulty.difficulty)} questions are averaging ${weakestDifficulty.accuracy}% accuracy.`,
    );
  }
  if (recentScoreSignal?.direction === "slipping") {
    recommendationNotes.push(
      `Recent scores have slipped ${Math.abs(Math.round(recentScoreSignal.delta))} points across the last ${recentScoreSignal.latestCount} scored session(s).`,
    );
  } else if (recentScoreSignal?.direction === "improving") {
    recommendationNotes.push(
      `Recent scores are up ${Math.round(recentScoreSignal.delta)} points across the last ${recentScoreSignal.latestCount} scored session(s).`,
    );
  }
  if (latestTimingSignal?.severity === "high") {
    recommendationNotes.push(
      latestTimingSignal.unansweredCount > 0
        ? `Latest timed run left ${latestTimingSignal.unansweredCount} question(s) unanswered, so pace needs attention.`
        : "Latest timed run used nearly the full allowed time.",
    );
  } else if (
    latestTimingSignal?.severity === "comfortable" &&
    Number(latestAttempt?.scorePercentage || 0) >= 70
  ) {
    recommendationNotes.push(
      `Latest timed run still finished with ${formatSessionDurationLabel(latestTimingSignal.remainingSeconds)} to spare.`,
    );
  }
  const latestGlBandLabel = formatGlBandLabel(latestAttempt?.glBand);
  if (
    latestAttempt?.topicId === MOCK_EXAM_TOPIC_ID &&
    latestGlBandLabel &&
    latestGlBandLabel !== "General"
  ) {
    recommendationNotes.push(`Latest mock profile: ${latestGlBandLabel}.`);
  }
  const notesSuffix = recommendationNotes.length ? ` ${recommendationNotes.join(" ")}` : "";
  const subcategoryLead =
    isRepeatedPattern
      ? "Repeated weak spot"
      : isBuildingPattern
        ? "Building weak spot"
        : Number(weakestSubcategory?.sessions || 0) > 1
          ? "Current weak spot"
          : "Emerging weak spot";

  if (weakestTopic && weakestSubcategory) {
    return {
      title:
        isRepeatedPattern
          ? recentScoreSignal?.direction === "slipping"
            ? `Prioritize rebuilding with ${weakestTopic.topicName}.`
            : `Prioritize ${weakestTopic.topicName} next.`
          : isBuildingPattern
            ? recentScoreSignal?.direction === "slipping"
              ? `Keep rebuilding with ${weakestTopic.topicName}.`
              : `Keep building with ${weakestTopic.topicName}.`
            : recentScoreSignal?.direction === "slipping"
              ? `Check in on ${weakestTopic.topicName}.`
              : `Explore ${weakestTopic.topicName} next.`,
      meta: `${subcategoryLead}: ${weakestSubcategory.subcategoryName} at ${weakestSubcategory.accuracy}% accuracy across ${weakestSubcategory.sessions} session(s).${notesSuffix}`,
      signalChips: recommendationSignals,
      confidenceLabel: recommendationConfidence.label,
      confidenceTone: recommendationConfidence.tone,
      confidenceDescription: recommendationConfidence.description,
    };
  }

  if (weakestTopic) {
    const latestContext =
      latestWeakTopic?.topicName && latestAttempt?.topicId === MOCK_EXAM_TOPIC_ID
        ? ` Latest mock dip: ${latestWeakTopic.topicName} at ${Math.round(Number(latestWeakTopic.accuracy || 0))}%.`
        : "";
    const topicLead = isRepeatedPattern
      ? "Repeated topic dip"
      : isBuildingPattern
        ? "Building topic dip"
        : "Current topic signal";
    return {
      title:
        isRepeatedPattern
          ? recentScoreSignal?.direction === "slipping"
            ? `Prioritize rebuilding with ${weakestTopic.topicName}.`
            : `Prioritize a timed drill on ${weakestTopic.topicName}.`
          : isBuildingPattern
            ? recentScoreSignal?.direction === "slipping"
              ? `Keep rebuilding with ${weakestTopic.topicName}.`
              : `Strengthen ${weakestTopic.topicName} with a timed drill.`
            : recentScoreSignal?.direction === "slipping"
              ? `Check in on ${weakestTopic.topicName}.`
              : `Sample ${weakestTopic.topicName} next.`,
      meta: `${topicLead}: average mastery there is ${weakestTopic.averageScore}% across ${weakestTopic.attempts} scored session(s).${latestContext}${notesSuffix}`,
      signalChips: recommendationSignals,
      confidenceLabel: recommendationConfidence.label,
      confidenceTone: recommendationConfidence.tone,
      confidenceDescription: recommendationConfidence.description,
    };
  }

  return {
    title: isRepeatedPattern
      ? `Prioritize ${getAttemptHeadline(latestAttempt)} once more.`
      : isBuildingPattern
        ? `Keep building with ${getAttemptHeadline(latestAttempt)}.`
        : `Review ${getAttemptHeadline(latestAttempt)} once more.`,
    meta: `${
      isRepeatedPattern
        ? "The same pressure signals keep resurfacing, so the best next step is a focused reinforcement pass."
        : isBuildingPattern
          ? "Multiple signals are lining up, so the best next step is a focused reinforcement pass."
          : "There is not enough topic-level history yet, so the best next step is a quick reinforcement pass."
    }${notesSuffix}`,
    signalChips: recommendationSignals,
    confidenceLabel: recommendationConfidence.label,
    confidenceTone: recommendationConfidence.tone,
    confidenceDescription: recommendationConfidence.description,
  };
}
function getPreferredRecommendedTopic(insights) {
  if (!cachedTopics.length) return null;
  const preferredIds = [
    insights?.recommendedTopicId || recommendedTopicId,
    "financial_regulations",
    "psr",
    "procurement_act",
  ].filter(Boolean);
  return (
    cachedTopics.find((topic) => preferredIds.includes(topic.id) && isTopicUnlocked(topic)) ||
    cachedTopics.find((topic) => isTopicUnlocked(topic)) ||
    cachedTopics[0] ||
    null
  );
}

function buildDashboardSetupSuggestion(topic, insights) {
  if (!topic || !insights?.totalAttempts) return null;

  const totalQuestions = Number(topic?.availableStudyFilters?.totalQuestions || 0);
  const defaultQuestionCount = Number(topic?.availableStudyFilters?.defaultQuestionCount || 40);
  const currentFilters = normalizeStudyFilters(topic?.studyFilters, {
    totalQuestions,
    defaultQuestionCount,
  });
  const nextFilters = { ...currentFilters };
  const notes = [];
  let questionCountGuidanceActive = false;
  const latestAttempt = insights?.latestAttempt || null;
  const recentScoreSignal = insights?.recentScoreSignal || buildRecentScoreSignal(insights?.attempts);
  const latestTimingSignal = insights?.latestTimingSignal || getAttemptTimingSignal(latestAttempt);
  const availableQuestionCounts = Array.isArray(topic?.availableStudyFilters?.questionCountOptions)
    ? topic.availableStudyFilters.questionCountOptions
    : [];
  const currentQuestionCount = resolveStudyQuestionCount(currentFilters, {
    totalQuestions,
    defaultQuestionCount,
  });
  const questionCountCandidates = [[10, 20, 40, 60, 80], availableQuestionCounts, [currentQuestionCount, totalQuestions]]
    .flat()
    .map((value) => Number(value))
    .filter((value, index, items) => Number.isInteger(value) && value > 0 && items.indexOf(value) === index)
    .sort((left, right) => left - right);
  const chooseQuestionCountAtMost = (limit) => {
    const safeLimit = Math.max(10, Math.min(totalQuestions || limit, Number(limit) || currentQuestionCount));
    const candidates = questionCountCandidates.filter((value) => value <= safeLimit);
    return candidates[candidates.length - 1] || questionCountCandidates[0] || safeLimit;
  };
  const chooseQuestionCountAtLeast = (minimum) => {
    const safeMinimum = Math.max(10, Math.min(totalQuestions || minimum, Number(minimum) || currentQuestionCount));
    return (
      questionCountCandidates.find((value) => value >= safeMinimum) ||
      questionCountCandidates[questionCountCandidates.length - 1] ||
      safeMinimum
    );
  };
  nextFilters.questionFocus = "weak_areas";

  const averageScore = Number(insights?.averageScore ?? 0);
  if (latestTimingSignal?.severity === "high") {
    nextFilters.questionCount = chooseQuestionCountAtMost(Math.min(currentQuestionCount, 20));
    questionCountGuidanceActive = true;
    notes.push(
      latestTimingSignal.unansweredCount > 0
        ? "Shorten the next run so you can finish every question cleanly."
        : "Keep the next timed drill shorter so pacing steadies first.",
    );
  } else if (averageScore > 0 && averageScore < 55) {
    nextFilters.questionCount = chooseQuestionCountAtMost(20);
    questionCountGuidanceActive = true;
    notes.push("Keep the next run shorter so accuracy recovers before you scale back up.");
  } else if (
    averageScore >= 80 &&
    recentScoreSignal?.direction === "improving" &&
    latestTimingSignal?.severity !== "high"
  ) {
    nextFilters.questionCount = chooseQuestionCountAtLeast(40);
    questionCountGuidanceActive = true;
    notes.push("You can stretch the next drill a little further without losing control.");
  } else {
    nextFilters.questionCount = chooseQuestionCountAtMost(20);
    questionCountGuidanceActive = true;
  }

  const weakestDifficulty = insights?.weakestDifficulty || null;
  if (weakestDifficulty?.difficulty) {
    const weakDifficultyAccuracy = Number(weakestDifficulty.accuracy || 0);
    if (latestTimingSignal?.severity === "high" && weakestDifficulty.difficulty === "hard") {
      nextFilters.difficulty = "medium";
      notes.push("Step back to Medium difficulty first so pace and accuracy recover together.");
    } else if (weakDifficultyAccuracy <= 45) {
      nextFilters.difficulty = weakestDifficulty.difficulty === "hard" ? "medium" : weakestDifficulty.difficulty;
      notes.push("Stay around " + formatDifficultyLabel(nextFilters.difficulty) + " difficulty while you rebuild confidence.");
    } else if (
      weakDifficultyAccuracy >= 70 &&
      averageScore >= 70 &&
      recentScoreSignal?.direction !== "slipping"
    ) {
      nextFilters.difficulty = weakestDifficulty.difficulty === "easy" ? "medium" : weakestDifficulty.difficulty;
      notes.push("Keep " + formatDifficultyLabel(nextFilters.difficulty) + " difficulty in the mix for a steadier challenge.");
    }
  }

  const latestMockGlBand =
    insights?.latestAttempt?.topicId === MOCK_EXAM_TOPIC_ID
      ? String(insights?.latestAttempt?.glBand || "").trim().toLowerCase()
      : "";
  if (latestMockGlBand && latestMockGlBand !== "general") {
    nextFilters.targetGlBand = latestMockGlBand;
    notes.push("Carry " + formatGlBandLabel(latestMockGlBand) + " emphasis into this follow-up drill.");
  }

  const summaryChips = [];
  if (nextFilters.questionFocus !== currentFilters.questionFocus) {
    summaryChips.push(formatQuestionFocusLabel(nextFilters.questionFocus));
  }
  if (questionCountGuidanceActive || String(nextFilters.questionCount) !== String(currentFilters.questionCount)) {
    summaryChips.push(String(nextFilters.questionCount) + " Questions");
  }
  if (nextFilters.difficulty !== currentFilters.difficulty && nextFilters.difficulty !== "all") {
    summaryChips.push(formatDifficultyLabel(nextFilters.difficulty));
  }
  if (nextFilters.targetGlBand !== currentFilters.targetGlBand && nextFilters.targetGlBand !== "general") {
    summaryChips.push(formatTargetGlBandLabel(nextFilters.targetGlBand));
  }

  if (!summaryChips.length) return null;

  const weakestSubcategoryName = String(insights?.weakestSubcategory?.subcategoryName || "").trim();
  const focusTopicName = String(
    insights?.latestMockWeakTopic?.topicName || insights?.weakestTopic?.topicName || topic?.name || "this topic",
  ).trim();
  const messageLead = weakestSubcategoryName
    ? "Use " + focusTopicName + " to revisit " + weakestSubcategoryName + "."
    : "Open " + focusTopicName + " with a tighter follow-up setup.";

  const confidence = buildDashboardRecommendationConfidence(topic, insights);
  const signalChips = buildDashboardRecommendationSignals(insights);

  return {
    title: "Suggested Setup",
    message: (messageLead + " " + notes.join(" ")).trim(),
    chips: summaryChips,
    signalChips,
    confidenceLabel: confidence.label,
    confidenceTone: confidence.tone,
    confidenceDescription: confidence.description,
    nextFilters,
  };
}

function buildAnalyticsSnapshot(attempts = []) {
  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + Number(attempt?.scorePercentage || 0),
            0,
          ) / totalAttempts,
        )
      : null;
  const streakDays = calculateStreakDays(attempts);
  const latestAttempt = totalAttempts ? attempts[totalAttempts - 1] : null;
  const trendItems = buildTrendItems(attempts);
  const weeklyConsistency = buildWeeklyConsistency(attempts);
  const topicMastery = buildTopicMastery(attempts);
  const weakestTopic =
    [...topicMastery]
      .filter((entry) => entry.averageScore !== null)
      .sort(
        (left, right) =>
          left.averageScore - right.averageScore ||
          right.attempts - left.attempts ||
          left.topicName.localeCompare(right.topicName),
      )[0] || null;
  const fallbackWeakestId = getWeakestTopicId(attempts);
  const recommendedTopicId =
    weakestTopic?.topicId ||
    (isCoreAnalyticsTopicId(fallbackWeakestId) ? fallbackWeakestId : null);
  const weakestSubcategory = buildSubcategoryInsights(attempts)[0] || null;
  const weakestDifficulty = buildDifficultyInsights(attempts)[0] || null;
  const latestMockWeakTopic = getLatestMockWeakTopic(latestAttempt);
  const recentScoreSignal = buildRecentScoreSignal(attempts);
  const latestTimingSignal = getAttemptTimingSignal(latestAttempt);
  const recommendation = buildRecommendation({
    attempts,
    totalAttempts,
    latestAttempt,
    weakestTopic,
    weakestSubcategory,
    weakestDifficulty,
    latestMockWeakTopic,
    recentScoreSignal,
    latestTimingSignal,
  });

  return {
    attempts,
    totalAttempts,
    averageScore,
    streakDays,
    latestAttempt,
    trendItems,
    weeklyConsistency,
    topicMastery,
    weakestTopic,
    weakestSubcategory,
    weakestDifficulty,
    latestMockWeakTopic,
    recentScoreSignal,
    latestTimingSignal,
    recommendedTopicId,
    recommendation,
  };
}

function getAnalyticsReadinessState(insights) {
  if (!insights?.totalAttempts) {
    return {
      tone: "low",
      title: "Build your first baseline",
      body: "Complete a scored session to unlock readiness signals and a clearer next step.",
    };
  }

  const averageScore = Number(insights.averageScore ?? 0);
  if (averageScore >= 75 && insights.streakDays >= 3) {
    return {
      tone: "high",
      title: "Ready for exam-style drills",
      body: "Your recent scores and consistency are strong enough for more timed reinforcement.",
    };
  }

  if (averageScore >= 60) {
    return {
      tone: "medium",
      title: "Solid foundation, keep tightening weak areas",
      body: "You are building a good base, but the weakest topics still need guided reinforcement.",
    };
  }

  return {
    tone: "low",
    title: "Rebuild weak areas before timed pressure",
    body: "Use practice and review to lift weak areas before leaning too hard on timed sessions.",
  };
}

function renderSupportStateCards(insights = null) {
  const attemptsMeta = document.getElementById("stateAttemptsMeta");
  const reviewQueueMeta = document.getElementById("stateReviewQueueMeta");
  const syncMeta = document.getElementById("stateSyncMeta");
  const summary = readProgressSummary();
  const attemptsCount = Array.isArray(insights?.attempts)
    ? insights.attempts.length
    : Array.isArray(summary?.attempts)
      ? summary.attempts.length
      : 0;
  const retryCount = getRetryMissedQueueCount();
  const spacedDueCount = getSpacedPracticeDueCount();
  const user = getCurrentUser();
  const syncSummary = getHeaderSyncSummary(user);

  if (attemptsMeta) {
    attemptsMeta.textContent = attemptsCount > 0
      ? `You have ${attemptsCount} scored session${attemptsCount === 1 ? "" : "s"} saved. Open Analytics to review your trend.`
      : "Start your first scored session to unlock progress analytics.";
  }

  if (reviewQueueMeta) {
    if (retryCount > 0 && spacedDueCount > 0) {
      reviewQueueMeta.textContent = `${retryCount} retry question${retryCount === 1 ? "" : "s"} and ${spacedDueCount} spaced-review item${spacedDueCount === 1 ? "" : "s"} are ready right now.`;
    } else if (retryCount > 0) {
      reviewQueueMeta.textContent = `${retryCount} retry question${retryCount === 1 ? "" : "s"} are ready from recent mistakes.`;
    } else if (spacedDueCount > 0) {
      reviewQueueMeta.textContent = `${spacedDueCount} spaced-review item${spacedDueCount === 1 ? "" : "s"} are due for reinforcement.`;
    } else {
      reviewQueueMeta.textContent = "No missed questions are queued yet. Finish a session to build your retry path.";
    }
  }

  if (syncMeta) {
    syncMeta.textContent = user
      ? syncSummary.title
      : "Sign in to enable multi-device sync and cross-device recovery.";
  }
}

function resetReviewMistakesFilters() {
  reviewMistakesFilters = { ...REVIEW_MISTAKES_DEFAULT_FILTERS };
}

function getReviewMistakeTopicKey(entry) {
  return String(entry?.sourceTopicId || entry?.question?.sourceTopicId || entry?.sourceTopicName || "").trim();
}

function getReviewMistakeTopicLabel(entry) {
  return String(entry?.sourceTopicName || getTopicNameById(getReviewMistakeTopicKey(entry)) || "Mixed Queue").trim();
}

function getReviewMistakeSubcategoryLabel(question = {}) {
  return String(
    question?.sourceSubcategoryName ||
      question?.sourceSection ||
      question?.topic ||
      "",
  ).trim();
}

function getReviewMistakeDifficultyValue(question = {}) {
  return String(question?.difficulty || "").trim().toLowerCase();
}

function getReviewMistakeDifficultyLabel(question = {}) {
  return formatDifficultyLabel(getReviewMistakeDifficultyValue(question));
}

function getReviewMistakeFilterOptions(entries = []) {
  const topicMap = new Map();
  const subcategorySet = new Set();
  const difficultySet = new Set();

  entries.forEach((entry) => {
    const question = entry?.question || {};
    const topicKey = getReviewMistakeTopicKey(entry);
    const topicLabel = getReviewMistakeTopicLabel(entry);
    if (topicKey && topicLabel && !topicMap.has(topicKey)) {
      topicMap.set(topicKey, topicLabel);
    }

    const subcategory = getReviewMistakeSubcategoryLabel(question);
    if (subcategory) {
      subcategorySet.add(subcategory);
    }

    const difficulty = getReviewMistakeDifficultyValue(question);
    if (difficulty) {
      difficultySet.add(difficulty);
    }
  });

  return {
    topics: Array.from(topicMap.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label })),
    subcategories: Array.from(subcategorySet)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value })),
    difficulties: Array.from(difficultySet)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: formatDifficultyLabel(value) || value })),
  };
}

function applyReviewMistakeFilters(entries = []) {
  return entries.filter((entry) => {
    const question = entry?.question || {};
    if (reviewMistakesFilters.topic !== "all" && getReviewMistakeTopicKey(entry) !== reviewMistakesFilters.topic) {
      return false;
    }
    if (
      reviewMistakesFilters.subcategory !== "all" &&
      getReviewMistakeSubcategoryLabel(question) !== reviewMistakesFilters.subcategory
    ) {
      return false;
    }
    if (
      reviewMistakesFilters.difficulty !== "all" &&
      getReviewMistakeDifficultyValue(question) !== reviewMistakesFilters.difficulty
    ) {
      return false;
    }
    return true;
  });
}

function renderReviewMistakeInlineMarkdown(text, fallback = "") {
  const value = String(text || fallback || "").trim() || String(fallback || "").trim();
  return String(parseMarkdown(value || ""))
    .replace(/^<p>/, "")
    .replace(/<\/p>$/, "");
}

function getReviewMistakeOptionPresentation(question = {}, answerIndex = null) {
  const normalizedIndex = Number(answerIndex);
  const options = Array.isArray(question?.options) ? question.options : [];
  if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0 || normalizedIndex >= options.length) {
    return {
      text: "Answer choice unavailable.",
      html: "<p>Answer choice unavailable.</p>",
    };
  }
  const optionLetter = String.fromCharCode(65 + normalizedIndex);
  const optionText = String(options[normalizedIndex] || "").trim();
  const text = optionText ? `Option ${optionLetter} - ${optionText}` : `Option ${optionLetter}`;
  return {
    text,
    html: parseMarkdown(text),
  };
}

function getReviewMistakePreviousResponse(entry) {
  const question = entry?.question || {};
  const wasUnanswered = String(entry?.lastOutcome || "").trim().toLowerCase() === "unanswered";
  if (wasUnanswered) {
    return {
      title: "Previous Response",
      html: "<p>This question was left unanswered in a prior session.</p>",
    };
  }

  if (!Number.isInteger(entry?.lastUserAnswerIndex)) {
    return {
      title: "Previous Response",
      html: "<p>This miss was saved before answer capture was added, so only the question is available.</p>",
    };
  }

  return {
    title: "Previous Response",
    html: getReviewMistakeOptionPresentation(question, entry.lastUserAnswerIndex).html,
  };
}

function renderReviewMistakesEmptyState({ title, body, primaryAction, secondaryAction = null }) {
  const actions = [primaryAction, secondaryAction]
    .filter(Boolean)
    .map(
      (action) => `
        <button
          class="btn ${escapeHtml(action.variant || "btn-secondary") }"
          data-review-action="${escapeHtml(action.action)}"
          type="button"
        >${escapeHtml(action.label)}</button>
      `,
    )
    .join("");

  return `
    <article class="mistake-item review-mistake-card review-mistakes-empty review-mistake-case review-mistake-case-primary">
      <p class="eyebrow">Review Queue</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="button-row compact-actions review-mistake-actions">
        ${actions}
      </div>
    </article>
  `;
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
  const filterOptions = getReviewMistakeFilterOptions(queueEntries);

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

  const filteredEntries = applyReviewMistakeFilters(queueEntries);
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
    summaryChips.innerHTML = chips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
  }

  if (!user) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "Your review queue is tied to your account.",
      body: "Login or create an account to keep missed questions, retry them later, and sync the queue across devices.",
      primaryAction: { action: "open-login", label: "Login or Register", variant: "btn-primary" },
      secondaryAction: { action: "open-dashboard", label: "Back to Dashboard", variant: "btn-ghost" },
    });
    return;
  }

  if (!queueEntries.length) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "No missed questions queued yet.",
      body: "Complete a scored Practice or Timed Topic Test session and any incorrect or unanswered items will appear here for follow-up.",
      primaryAction: { action: "open-dashboard", label: "Start a Scored Session", variant: "btn-primary" },
      secondaryAction: { action: "open-analytics", label: "Open Analytics", variant: "btn-secondary" },
    });
    return;
  }

  if (!filteredEntries.length) {
    list.innerHTML = renderReviewMistakesEmptyState({
      title: "No questions match these filters.",
      body: "Clear one or more filters to reveal the rest of your retry queue.",
      primaryAction: { action: "clear-filters", label: "Clear Filters", variant: "btn-primary" },
      secondaryAction: { action: "retry-queue", label: "Start Retry Session", variant: "btn-secondary" },
    });
    return;
  }

  list.innerHTML = filteredEntries
    .map((entry, index) => {
      const question = entry?.question || {};
      const topicLabel = getReviewMistakeTopicLabel(entry);
      const subcategoryLabel = getReviewMistakeSubcategoryLabel(question);
      const difficultyLabel = getReviewMistakeDifficultyLabel(question);
      const relativeLabel = formatRelativeTime(entry.updatedAt);
      const statusLabel = relativeLabel ? `Missed ${relativeLabel}` : `Reviewed ${formatDateTime(entry.updatedAt)}`;
      const previousResponse = getReviewMistakePreviousResponse(entry);
      const correctResponse = getReviewMistakeOptionPresentation(question, question?.correct);
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
            <h3>${renderReviewMistakeInlineMarkdown(question?.question, "Question text unavailable.")}</h3>
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
  const readiness = getAnalyticsReadinessState(insights);
  const signalChips = Array.isArray(insights.recommendation?.signalChips)
    ? insights.recommendation.signalChips.filter((entry) => String(entry || "").trim())
    : [];

  if (overviewCard) {
    overviewCard.classList.remove("high", "medium", "low");
    overviewCard.classList.add(readiness.tone);
  }
  if (overviewReadiness) {
    overviewReadiness.textContent = readiness.title;
  }
  if (overviewNarrative) {
    const weakestTopicLead = insights.weakestTopic?.topicName && insights.weakestTopic?.averageScore !== null
      ? `Weakest core topic: ${insights.weakestTopic.topicName} at ${insights.weakestTopic.averageScore}%. `
      : "";
    overviewNarrative.textContent = weakestTopicLead + readiness.body;
  }
  if (overviewSignals) {
    overviewSignals.classList.toggle("hidden", signalChips.length === 0);
    overviewSignals.innerHTML = signalChips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
  }
  if (overviewLatest) {
    const latestWhen = formatRelativeTime(insights.latestAttempt?.createdAt) || formatDateTime(insights.latestAttempt?.createdAt);
    overviewLatest.textContent = insights.latestAttempt
      ? `Latest scored session: ${getAttemptHeadline(insights.latestAttempt)} | ${formatModeLabel(insights.latestAttempt.mode)} | ${latestWhen}`
      : "No scored sessions yet.";
  }
  if (overviewScore) {
    overviewScore.textContent = insights.averageScore === null ? "-" : `${insights.averageScore}%`;
  }
  if (overviewStreak) {
    overviewStreak.textContent = `${insights.streakDays}`;
  }
  if (overviewAttempts) {
    overviewAttempts.textContent = `${insights.totalAttempts}`;
  }

  if (trendList) {
    trendList.innerHTML = insights.trendItems.length
      ? insights.trendItems
          .map(
            (entry) => `
              <div class="analytic-item ${entry.className}">
                <div class="analytic-value">${entry.score}%</div>
                <div class="analytic-label">${escapeHtml(entry.headline)}</div>
                <p class="mock-breakdown-meta">${escapeHtml(entry.meta)}</p>
                <p class="mock-breakdown-meta">${escapeHtml(entry.when)}</p>
              </div>
            `,
          )
          .join("")
      : `
          <div class="analytic-item">
            <div class="analytic-value">-</div>
            <div class="analytic-label">No scored attempts yet</div>
            <p class="mock-breakdown-meta">Complete a practice or timed session to start tracking trend lines.</p>
          </div>
        `;
  }

  if (consistencyList) {
    consistencyList.innerHTML = insights.weeklyConsistency
      .map(
        (entry) => `
          <div class="analytic-item ${entry.className}">
            <div class="analytic-value">${entry.count}</div>
            <div class="analytic-label">${escapeHtml(entry.dayLabel)}</div>
            <p class="mock-breakdown-meta">${escapeHtml(entry.dateLabel)}</p>
            <p class="mock-breakdown-meta">${entry.count === 1 ? "1 attempt" : `${entry.count} attempts`}</p>
          </div>
        `,
      )
      .join("");
  }

  if (heatmapGrid) {
    heatmapGrid.innerHTML = insights.topicMastery
      .map((entry) => {
        if (entry.averageScore === null) {
          return `
            <div class="heatmap-tile">
              <strong>${escapeHtml(entry.topicName)}</strong>
              <span>Not attempted yet</span>
            </div>
          `;
        }
        return `
          <div class="heatmap-tile ${getTrafficClassByPercentage(entry.averageScore)}">
            <strong>${escapeHtml(entry.topicName)}</strong>
            <span>${entry.averageScore}% average</span>
            <span>${entry.attempts} scored session${entry.attempts === 1 ? "" : "s"}</span>
          </div>
        `;
      })
      .join("");
  }

  if (recommendationTitle) {
    recommendationTitle.textContent = insights.recommendation.title;
  }
  if (recommendationMeta) {
    recommendationMeta.textContent = insights.recommendation.meta;
  }
  if (recommendationSignals) {
    recommendationSignals.classList.toggle("hidden", signalChips.length === 0);
    recommendationSignals.innerHTML = signalChips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
  }
  if (recommendationConfidence) {
    const confidenceLabel = String(insights.recommendation?.confidenceLabel || "").trim();
    const confidenceDescription = String(insights.recommendation?.confidenceDescription || "").trim();
    const confidenceTone = String(insights.recommendation?.confidenceTone || "medium").trim().toLowerCase();
    recommendationConfidence.classList.toggle("hidden", !confidenceLabel);
    recommendationConfidence.classList.remove("high", "medium", "low");
    recommendationConfidence.classList.add(["high", "medium", "low"].includes(confidenceTone) ? confidenceTone : "medium");
    recommendationConfidence.innerHTML = confidenceLabel
      ? `<strong>Confidence:</strong> ${escapeHtml(confidenceLabel)}${confidenceDescription ? `. ${escapeHtml(confidenceDescription)}` : ""}`
      : "";
  }
}
function refreshDashboardInsights() {
  const currentUser = getCurrentUser();
  const summary = readProgressSummary();
  const attempts = summary.attempts || [];
  const insights = buildAnalyticsSnapshot(attempts);

  lastSessionTopicId = insights.latestAttempt?.topicId || null;
  recommendedTopicId = insights.recommendedTopicId || cachedTopics[0]?.id || "psr";

  const totalAttemptsStat = document.getElementById("totalAttemptsStat");
  const averageScoreStat = document.getElementById("averageScoreStat");
  const streakStat = document.getElementById("streakStat");
  const streakStatusBadge = document.getElementById("streakStatusBadge");
  const continueTopicTitle = document.getElementById("continueTopicTitle");
  const continueTopicMeta = document.getElementById("continueTopicMeta");
  const continueSessionChips = document.getElementById("continueSessionChips");
  const continueSessionNote = document.getElementById("continueSessionNote");
  const recommendedTopicTitle = document.getElementById("recommendedTopicTitle");
  const recommendedTopicMeta = document.getElementById("recommendedTopicMeta");
  const recommendedTopicChips = document.getElementById("recommendedTopicChips");
  const recommendedTopicSetupMeta = document.getElementById("recommendedTopicSetupMeta");
  const recommendedTopicSignalChips = document.getElementById("recommendedTopicSignalChips");
  const recommendedTopicConfidence = document.getElementById("recommendedTopicConfidence");
  const clearRecommendedSetupBtn = document.getElementById("clearRecommendedSetupBtn");
  const splashResumeBtn = document.getElementById("splashResumeBtn");

  if (totalAttemptsStat) totalAttemptsStat.textContent = String(insights.totalAttempts);
  if (averageScoreStat) {
    averageScoreStat.textContent =
      insights.averageScore === null ? "-" : `${insights.averageScore}%`;
  }
  if (streakStat) {
    streakStat.textContent = `${insights.streakDays} day${insights.streakDays === 1 ? "" : "s"}`;
  }
  if (streakStatusBadge) {
    streakStatusBadge.textContent =
      insights.streakDays >= 5
        ? "On Track"
        : insights.streakDays > 0
          ? "Building momentum"
          : "Start today";
  }

  if (continueTopicTitle && continueTopicMeta) {
    if (insights.latestAttempt?.topicId) {
      continueTopicTitle.textContent = getAttemptHeadline(insights.latestAttempt);
      const modeLabel = formatModeLabel(insights.latestAttempt.mode);
      const relativeTime =
        formatRelativeTime(insights.latestAttempt.createdAt) ||
        formatDateTime(insights.latestAttempt.createdAt);
      const topicContext = getAttemptTopicLabel(insights.latestAttempt);
      const contextPrefix =
        topicContext && topicContext !== getAttemptHeadline(insights.latestAttempt)
          ? `${topicContext} | `
          : "";
      const scoreLabel = `${Math.round(Number(insights.latestAttempt.scorePercentage || 0))}%`;
      continueTopicMeta.textContent = `${contextPrefix}${modeLabel} | ${scoreLabel} | ${relativeTime}`;
      if (continueSessionChips) {
        const chips = [modeLabel, scoreLabel, relativeTime].filter((entry) => String(entry || "").trim());
        continueSessionChips.classList.toggle("hidden", chips.length === 0);
        continueSessionChips.innerHTML = chips
          .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
          .join("");
      }
      if (continueSessionNote) {
        continueSessionNote.classList.remove("hidden");
        continueSessionNote.textContent = "Resume your latest saved flow or re-enter the same topic with context still fresh.";
      }
    } else {
      continueTopicTitle.textContent = "No session yet";
      continueTopicMeta.textContent = "Start a topic to track session continuity.";
      if (continueSessionChips) {
        continueSessionChips.classList.add("hidden");
        continueSessionChips.innerHTML = "";
      }
      if (continueSessionNote) {
        continueSessionNote.classList.add("hidden");
        continueSessionNote.textContent = "Pick up where you left off.";
      }
    }
  }

  const suggestedTopic = getPreferredRecommendedTopic(insights);
  const dashboardSetupSuggestion = buildDashboardSetupSuggestion(suggestedTopic, insights);
  const recommendationSignature = buildDashboardSuggestionSignature(suggestedTopic, dashboardSetupSuggestion);
  const dismissedRecommendationSignature = readDismissedDashboardRecommendationSignature(currentUser);
  const showTunedRecommendation = Boolean(
    dashboardSetupSuggestion && recommendationSignature && recommendationSignature !== dismissedRecommendationSignature,
  );

  if (recommendedTopicTitle && recommendedTopicMeta) {
    recommendedTopicTitle.textContent = insights.recommendation.title;
    recommendedTopicMeta.textContent = insights.recommendation.meta;
  }
  if (recommendedTopicChips) {
    const chips = showTunedRecommendation && Array.isArray(dashboardSetupSuggestion?.chips)
      ? dashboardSetupSuggestion.chips.filter((entry) => String(entry || "").trim())
      : [];
    recommendedTopicChips.classList.toggle("hidden", chips.length === 0);
    recommendedTopicChips.innerHTML = chips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
  }
  if (recommendedTopicSetupMeta) {
    const message = showTunedRecommendation ? String(dashboardSetupSuggestion?.message || "").trim() : "";
    recommendedTopicSetupMeta.classList.toggle("hidden", !message);
    recommendedTopicSetupMeta.textContent = message ? `Suggested setup: ${message}` : "Suggested setup: Reinforce Weak Areas.";
  }
  if (recommendedTopicSignalChips) {
    const signalChips = showTunedRecommendation && Array.isArray(dashboardSetupSuggestion?.signalChips)
      ? dashboardSetupSuggestion.signalChips.filter((entry) => String(entry || "").trim())
      : [];
    recommendedTopicSignalChips.classList.toggle("hidden", signalChips.length === 0);
    recommendedTopicSignalChips.innerHTML = signalChips
      .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
      .join("");
  }
  if (recommendedTopicConfidence) {
    const confidenceLabel = showTunedRecommendation ? String(dashboardSetupSuggestion?.confidenceLabel || "").trim() : "";
    const confidenceDescription = showTunedRecommendation ? String(dashboardSetupSuggestion?.confidenceDescription || "").trim() : "";
    const confidenceTone = String(dashboardSetupSuggestion?.confidenceTone || "medium").trim().toLowerCase();
    recommendedTopicConfidence.classList.toggle("hidden", !confidenceLabel);
    recommendedTopicConfidence.classList.remove("high", "medium", "low");
    recommendedTopicConfidence.classList.add(["high", "medium", "low"].includes(confidenceTone) ? confidenceTone : "medium");
    recommendedTopicConfidence.innerHTML = confidenceLabel
      ? `<strong>Confidence:</strong> ${escapeHtml(confidenceLabel)}${confidenceDescription ? `. ${escapeHtml(confidenceDescription)}` : ""}`
      : "";
  }
  if (clearRecommendedSetupBtn) {
    clearRecommendedSetupBtn.classList.toggle("hidden", !showTunedRecommendation);
    clearRecommendedSetupBtn.onclick = () => {
      if (!currentUser || !recommendationSignature) return;
      writeDismissedDashboardRecommendationSignature(currentUser, recommendationSignature);
      refreshDashboardInsights();
    };
  }

  if (splashResumeBtn) {
    const canResume = Boolean(currentUser && insights.latestAttempt?.topicId);
    splashResumeBtn.classList.toggle("hidden", !canResume);
  }

  renderAnalyticsScreen(insights);
  renderReviewMistakesScreen();
  renderSupportStateCards(insights);
  syncRetryMissedButtonState();
  syncSpacedPracticeButtonState();
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
  const insights = buildAnalyticsSnapshot(summary.attempts || []);
  const topic = getPreferredRecommendedTopic(insights) || cachedTopics[0];
  const dashboardSetupSuggestion = buildDashboardSetupSuggestion(topic, insights);
  const recommendationSignature = buildDashboardSuggestionSignature(topic, dashboardSetupSuggestion);
  const dismissedRecommendationSignature = readDismissedDashboardRecommendationSignature(getCurrentUser());
  const activeDashboardSetupSuggestion =
    dashboardSetupSuggestion && recommendationSignature && recommendationSignature !== dismissedRecommendationSignature
      ? dashboardSetupSuggestion
      : null;
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

function renderUtilityActionButton(button, label, count, emptyTitle) {
  if (!button) return;
  const hasCount = count > 0;
  button.classList.toggle("has-count", hasCount);
  if (hasCount) {
    button.setAttribute("data-count", String(count));
  } else {
    button.removeAttribute("data-count");
  }
  button.textContent = hasCount ? `${label} (${count})` : label;
  button.disabled = count === 0;
  button.setAttribute(
    "aria-label",
    hasCount ? `${label}, ${count} ready` : `${label}, unavailable until you complete more sessions`,
  );
  button.setAttribute("title", hasCount ? `${label}: ${count} ready` : emptyTitle);
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
      failurePrefix: "Unable to start spaced-practice session:",
    },
  );
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
        refreshDashboardInsights();
      }
    });
  }
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
  const retryMissedBtn = document.getElementById("retryMissedBtn");
  const spacedPracticeBtn = document.getElementById("spacedPracticeBtn");
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

  if (retryMissedBtn) {
    retryMissedBtn.addEventListener("click", () => {
      startRetryMissedSession();
    });
  }

  if (spacedPracticeBtn) {
    spacedPracticeBtn.addEventListener("click", () => {
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
    showWarning("This topic is locked on Free plan. Upgrade to access all topics.");
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

function ensureAuthPromptOnStartup() {
  const modal = document.getElementById("authModal");
  if (!modal || !modal.classList.contains("hidden")) return;
  if (getCurrentUser()) return;
  openAuthModal("login");
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

function getHeaderPlanLabel(user) {
  if (!user) return "Guest";
  if (isCurrentUserAdmin()) return "Admin";
  return user.plan === "premium" ? "Premium" : "Free";
}

function getHeaderSyncSummary(user) {
  const provider = getAuthProviderLabel();
  if (!user) {
    return {
      label: "Signed out",
      tone: "muted",
      title: "Login to enable saved progress and sync guidance.",
    };
  }

  if (provider !== "Cloud" || !isCloudProgressSyncEnabled()) {
    return {
      label: "Device only",
      tone: "muted",
      title: "Progress stays on this device until Cloud auth and sync are available.",
    };
  }

  const status = getCloudProgressSyncStatus();
  if (status?.inFlight) {
    return {
      label: "Syncing",
      tone: "medium",
      title: "Progress sync is running now.",
    };
  }

  if (status?.synced && status?.lastSuccessAt) {
    const when = formatRelativeTime(status.lastSuccessAt) || formatDateTime(status.lastSuccessAt);
    return {
      label: "Synced",
      tone: "high",
      title: `Last synced ${when}.`,
    };
  }

  if (status?.lastReason && status.lastReason !== "success") {
    return {
      label: "Retry sync",
      tone: "low",
      title: String(status.lastError || "Cloud sync needs another try.").trim(),
    };
  }

  return {
    label: "Cloud ready",
    tone: "medium",
    title: "Cloud profile is ready to sync progress.",
  };
}

function getHeaderSummaryMarkup(user) {
  const displayName = String(user?.name || user?.email || "Signed in").trim();
  const syncSummary = getHeaderSyncSummary(user);
  const provider = getAuthProviderLabel();
  return {
    markup:
      `<span class="summary-user-line">${escapeHtml(displayName)}</span>` +
      `<span class="summary-pill-row">` +
      `<span class="summary-pill summary-pill-plan">${escapeHtml(getHeaderPlanLabel(user))}</span>` +
      `<span class="summary-pill">${escapeHtml(provider)}</span>` +
      `<span class="summary-pill summary-pill-${syncSummary.tone}">${escapeHtml(syncSummary.label)}</span>` +
      `</span>`,
    title: `${getAuthSummaryLabel()}. ${syncSummary.title}`,
  };
}

function updateAuthUI() {
  const user = getCurrentUser();
  const authActionBtn = document.getElementById("authActionBtn");
  const authActionIcon = document.getElementById("authActionIcon");
  const authToolbarSummary = document.getElementById("authToolbarSummary");
  const headerAdminBtn = document.getElementById("headerAdminBtn");
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
      const headerSummary = getHeaderSummaryMarkup(user);
      authToolbarSummary.innerHTML = headerSummary.markup;
      authToolbarSummary.classList.remove("hidden");
      authToolbarSummary.setAttribute("title", headerSummary.title);
      authToolbarSummary.setAttribute("aria-label", headerSummary.title);
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
      profileSubtitle.textContent = getProfileSubscriptionLabel(user);
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
  updateProfileDataSyncUI();
  refreshUserUpgradeStatus().catch(() => {});
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
    countLabel.textContent = `Overrides: ${entries.length}`;
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
    const safeWarning = status.warning ? `<div class="meta">${escapeHtml(status.warning)}</div>` : "";
    const card = document.createElement("div");
    card.className = "admin-request-item plan-override-item";
    card.innerHTML = `
      <div class="plan-override-item-main">
        <div class="plan-override-item-email"><strong>${safeEmail}</strong></div>
        <div class="meta">Override: <span class="admin-badge ${plan === "premium" ? "approved" : "pending"}">${safePlan}</span></div>
        <div class="meta">Sync: <span class="admin-badge ${syncBadgeClass}">${syncLabel}</span></div>
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
      billingCycle: String(entry?.upgradeBillingCycle || ""),
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
      billingCycle: String(entry?.billingCycle || ""),
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
        <th>Billing</th>
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
    const safeBillingCycle = escapeHtml(formatBillingCycleLabel(request.billingCycle) || "-");
    const safeReference = escapeHtml(request.reference || "-");
    const safeSubmittedAt = escapeHtml(formatDateTime(request.createdAt));
    const safeReviewedAt = escapeHtml(formatDateTime(request.reviewedAt));
    const safeSource = request.source === "cloud-profile" ? "Cloud Profile" : "Local device";
    const isApproved = request.status === "approved";
    row.innerHTML = `
      <td class="email-cell">${safeEmail}</td>
      <td><span class="admin-badge ${statusClass}">Status: ${safeStatus}</span></td>
      <td>${safeAmount}</td>
      <td>${safeBillingCycle}</td>
      <td>${safeReference}</td>
      <td>${safeSubmittedAt}</td>
      <td>${safeReviewedAt || "-"}</td>
      <td>${safeSource}</td>
      <td class="actions-col">
        <button class="btn btn-secondary action-btn" data-approve-id="${escapeHtml(request.id)}" type="button" ${isApproved ? 'disabled aria-disabled="true"' : ""}>Approve</button>
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
              const cloudStatusResult = await setUpgradeRequestStatus(
                target.email,
                "approved",
                "",
                target.billingCycle,
              );
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

function updateProfileDataSyncUI() {
  const hintEl = document.getElementById("profileDataStorageHint");
  const statusEl = document.getElementById("profileCloudSyncStatus");
  const syncNowBtn = document.getElementById("syncProgressNowBtn");
  const user = getCurrentUser();
  const provider = getAuthProviderLabel();
  const cloudSyncEnabled = isCloudProgressSyncEnabled();
  const canCloudSync = Boolean(user && provider === "Cloud" && cloudSyncEnabled);
  const status = canCloudSync ? getCloudProgressSyncStatus() : null;
  const syncFailed = Boolean(status?.lastReason && status?.lastReason !== "success" && status?.lastError);

  if (hintEl) {
    hintEl.textContent = canCloudSync
      ? "Your progress syncs automatically in the background and follows your cloud profile across devices."
      : "Progress data stays on this browser until you sign in with Cloud auth.";
  }

  if (syncNowBtn) {
    syncNowBtn.classList.toggle("hidden", !syncFailed);
    syncNowBtn.disabled = !syncFailed;
  }

  if (!statusEl) return;
  statusEl.classList.remove("hidden");
  statusEl.removeAttribute("title");

  if (!user) {
    statusEl.textContent = "Cloud sync is available after sign in.";
    return;
  }

  if (provider !== "Cloud") {
    statusEl.textContent = "Cloud sync is unavailable in Local auth mode.";
    return;
  }

  if (!cloudSyncEnabled) {
    statusEl.textContent = "Cloud sync is disabled by runtime config.";
    return;
  }

  if (status?.inFlight) {
    statusEl.textContent = "Syncing your latest progress in the background...";
    return;
  }

  if (syncFailed) {
    statusEl.textContent = "Background sync needs attention. Use Retry Sync to try again.";
    statusEl.setAttribute("title", status.lastError);
    return;
  }

  if (status?.lastSuccessAt) {
    statusEl.textContent = `Last synced ${formatRelativeTime(status.lastSuccessAt)}.`;
    statusEl.setAttribute("title", formatDateTime(status.lastSuccessAt));
    return;
  }

  statusEl.textContent = "Automatic sync is ready.";
}

const AMBIENT_CLOUD_SYNC_INTERVAL_MS = 60000;
let ambientCloudSyncIntervalId = null;

function triggerBackgroundProgressSync(options = {}) {
  const { force = false } = options;
  const user = getCurrentUser();
  if (!user || getAuthProviderLabel() !== "Cloud" || !isCloudProgressSyncEnabled()) {
    return Promise.resolve(null);
  }

  updateProfileDataSyncUI();
  return syncProgressFromCloudNow({ force })
    .then((result) => {
      updateProfileDataSyncUI();
      refreshDashboardInsights();
      return result;
    })
    .catch(() => {
      updateProfileDataSyncUI();
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
  const user = getCurrentUser();
  const shouldRun = Boolean(user && getAuthProviderLabel() === "Cloud" && isCloudProgressSyncEnabled());
  if (shouldRun) {
    startAmbientCloudSync();
    return;
  }
  stopAmbientCloudSync();
}

async function hydrateCloudProgressIfNeeded() {
  const user = getCurrentUser();
  if (!user || getAuthProviderLabel() !== "Cloud" || !isCloudProgressSyncEnabled()) {
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
    return { label: "Unknown", badgeClass: "neutral" };
  }
  return { label, badgeClass: "approved" };
}

function getDirectoryExpiryPresentation(entry) {
  const plan = String(entry?.plan || "").toLowerCase();
  const rawExpiry = String(entry?.planExpiresAt || "").trim();
  if (plan !== "premium") {
    return { label: "Free", badgeClass: "neutral", dateLabel: "" };
  }
  if (!rawExpiry) {
    return { label: "No expiry", badgeClass: "neutral", dateLabel: "" };
  }
  const expiryDate = new Date(rawExpiry);
  if (Number.isNaN(expiryDate.getTime())) {
    return { label: "Unknown", badgeClass: "neutral", dateLabel: "" };
  }
  const diffMs = expiryDate.getTime() - Date.now();
  const dateLabel = formatDateTime(rawExpiry);
  if (diffMs < 0) {
    return { label: "Expired", badgeClass: "rejected", dateLabel };
  }
  const warnMs = EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
  if (diffMs <= warnMs) {
    return { label: "Expiring", badgeClass: "pending", dateLabel };
  }
  return { label: "Active", badgeClass: "approved", dateLabel };
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


function renderAdminUserDirectory() {
  const container = document.getElementById("adminUserList");
  const searchInput = document.getElementById("adminUserSearch");
  const statusFilter = document.getElementById("adminStatusFilter");
  const verificationFilter = document.getElementById("adminVerificationFilter");
  const sourceLabel = document.getElementById("adminUserSource");
  const countLabel = document.getElementById("adminUserCount");
  if (!container) return;

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
    const billingBadge = isPremiumPlan
      ? `<span class="admin-badge ${billingCycle.badgeClass}">Billing: ${safeBilling}</span>`
      : "";
    const expiryBadge = isPremiumPlan
      ? `<span class="admin-badge ${expiry.badgeClass}">Expiry: ${safeExpiryLabel}</span>`
      : "";
    const billingDetail = isPremiumPlan
      ? `<div><span class="meta">Billing</span><strong>${safeBilling}</strong></div>`
      : "";
    const expiryDetail = isPremiumPlan
      ? `<div><span class="meta">Expiry</span><strong>${safeExpiryLabel}</strong></div>`
      : "";

    const isSuspended = entry.status === "suspended";
    const accountActionLabel = isSuspended ? "Reactivate" : "Deactivate";
    const accountNextStatus = isSuspended ? "active" : "suspended";
    const safeProfileId = escapeHtml(entry.id);

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

    row.innerHTML = `
      <summary class="admin-user-summary">
        <div class="admin-user-summary-main">
          <div class="admin-user-summary-head">
            <div class="admin-user-email">${safeEmail}</div>
            <div class="admin-user-badges">
              <span class="admin-badge ${planClass}">Plan: ${safePlan}</span>
              ${billingBadge}
              ${expiryBadge}
              <span class="admin-badge ${statusClass}">Status: ${safeStatus}</span>
              <span class="admin-badge ${verification.badgeClass}">Verified: ${safeVerification}</span>
            </div>
          </div>
          ${expiry.dateLabel ? `<div class="meta">Expiry: ${safeExpiryDate}</div>` : ""}
        </div>
        <div class="admin-user-summary-side">
          <span class="meta">View details</span>
        </div>
      </summary>
      <div class="admin-user-details">
        <div class="admin-user-detail-grid">
          <div><span class="meta">Role</span><strong>${safeRole}</strong></div>
          <div><span class="meta">Plan</span><strong>${safePlan}</strong></div>
          ${billingDetail}
          ${expiryDetail}
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
        : "Update account status";
    let actionWarning = "";
    if (action === "set-account-state") {
      const confirmMessage = isDeactivateFlow
        ? `Deactivate ${targetLabel}? They will no longer be able to login.`
        : `Reactivate ${targetLabel}? They will regain access.`;
      const confirmed = confirm(confirmMessage);
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
            await resendVerificationEmailForUser(profileEmail);
            actionWarning = "Verification email sent.";
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
        countLabel.textContent = "Users: 0/0";
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
  const freeTierModal = document.getElementById("freeTierModal");
  const freeTierCloseBtn = document.getElementById("freeTierCloseBtn");
  const freeTierAcknowledgeBtn = document.getElementById("freeTierAcknowledgeBtn");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
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
        await runOperationWithFeedback(
          async () => {
            await loginUser({ email, password });
            await syncProgressFromCloudNow({ force: true }).catch(() => ({}));
            updateAuthUI();
            refreshDashboardInsights();
            await refreshAccessibleTopics();
            closeAuthModal();
            await showScreen("topicSelectionScreen");
            showFreeTierNoticeIfNeeded();
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

        setAuthMessage("Account created successfully.", "success");
        showSuccess("Account created successfully.");
        setTimeout(() => {
          closeAuthModal();
          showScreen("topicSelectionScreen");
          showFreeTierNoticeIfNeeded();
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
        showWarning("Login is required before submitting upgrade evidence.");
        return;
      }
      const reference = document.getElementById("upgradePaymentReference")?.value || "";
      const amount = document.getElementById("upgradeAmountPaid")?.value || "";
      const billingCycle = document.getElementById("upgradeBillingCycle")?.value || "";
      if (!billingCycle) {
        showWarning("Select the billing cycle for your payment (monthly, bi-annual, annual).");
        return;
      }
  try {
        const cloudResult = await runOperationWithFeedback(
          async () => {
            const next = readUpgradeRequests();
            next.push({
              id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              email: user.email,
              reference: String(reference).trim(),
              amount: String(amount).trim(),
              billingCycle: String(billingCycle).trim(),
              note: "Submitted from profile screen",
              status: "pending",
              createdAt: new Date().toISOString(),
            });
            writeUpgradeRequests(next);
            return submitUpgradeRequest({
              reference: String(reference).trim(),
              amount: String(amount).trim(),
              billingCycle: String(billingCycle).trim(),
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
        const cycleInput = document.getElementById("upgradeBillingCycle");
        if (refInput) refInput.value = "";
        if (amtInput) amtInput.value = "";
        if (cycleInput) cycleInput.value = "";
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

  if (adminVerificationFilter) {
    adminVerificationFilter.addEventListener("change", () => {
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


document.addEventListener("DOMContentLoaded", async function () {
  startCloudPlanAutoSync();
  startAdminDirectoryAutoSync();
  initializeDashboardActions();
  initializeReviewMistakesControls();
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
      refreshUserUpgradeStatus().catch(() => {});
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
    refreshAdminUserDirectory();
  }
  ensureAuthPromptOnStartup();

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





























































































































