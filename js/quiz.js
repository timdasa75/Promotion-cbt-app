// quiz.js - Module for quiz logic

import { showScreen, showError, showWarning } from "./ui.js";
import { extractQuestionsByCategory, fetchTopicDataFiles } from "./topicSources.js";
import { debugLog } from "./logger.js";
import { getTopics, getExamTemplateById, getGLBandWeights } from "./data.js";
import { isFeatureEnabled } from "./features.js";
import {
  applyStudyFilters,
  formatQuestionFocusLabel,
  formatSessionDurationLabel,
  formatTargetGlBandLabel,
  getTimedTopicTestDurationSeconds,
  normalizeStudyFilters,
  summarizeStudyFilterOptions,
} from "./studyFilters.js";
import {
  DEFAULT_MOCK_EXAM_TEMPLATE_ID,
  buildMockExamBlueprint,
  getDefaultMockExamBlueprint,
} from "./mockExamTemplates.js";
import {
  buildDifficultyBreakdown,
  buildSubcategoryBreakdown,
  calculateScoreFromAnswers,
} from "./metrics.js";
import { escapeHtml, parseMarkdown, normalizeExplanationText } from "./quiz/formatting.js";
import {
  buildQuestionSelectionProfile,
  normalizeGLBandKey,
  prioritizeQuestionPool,
} from "./questionPriority.js";
import {
  EXAM_CRITICAL_THRESHOLD_SEC,
  EXAM_WARNING_MESSAGES,
  EXAM_WARNING_RESET_THRESHOLD_SEC,
} from "./constants.js";
import {
  getCurrentEntitlement,
  getFreeMockExamEligibility,
  recordFreeMockExamUsage,
  getCurrentUser,
  getProgressStorageKeyForCurrentUser,
  isCloudProgressSyncEnabled,
  readCloudProgressSummary,
  writeCloudProgressSummary,
} from "./auth.js";


function clearOptionFeedbackLabel(optionEl) {
  if (!optionEl) return;
  const existing = optionEl.querySelector(".option-feedback-label");
  if (existing) existing.remove();
}

function applyOptionFeedbackLabel(optionEl) {
  if (!optionEl) return;
  clearOptionFeedbackLabel(optionEl);

  const isIncorrect =
    optionEl.classList.contains("incorrect") ||
    optionEl.classList.contains("user-incorrect");
  const isCorrect = optionEl.classList.contains("correct");
  if (!isCorrect && !isIncorrect) return;

  const badge = document.createElement("span");
  badge.className = `option-feedback-label ${isIncorrect ? "incorrect" : "correct"}`;
  badge.textContent = isIncorrect ? "Incorrect" : "Correct";
  optionEl.appendChild(badge);
}

function refreshOptionFeedbackLabels() {
  const options = document.querySelectorAll(".option-btn");
  options.forEach((optionEl) => applyOptionFeedbackLabel(optionEl));
}

/**
 * Quiz state management
 */
const quizState = {
  allQuestions: [],
  originalQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  userAnswers: [],
  incorrectAnswers: [],
  feedbackShown: [], // Track if feedback has been shown for each question
  timer: null,
  timeLeft: 0,
};
const QUIZ_RUNTIME_STORAGE_KEY = "cbt_quiz_runtime_v1";
const QUIZ_RUNTIME_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETRY_MISSED_STORAGE_PREFIX = "cbt_retry_missed_v1_";
const SPACED_PRACTICE_STORAGE_PREFIX = "cbt_spaced_practice_v1_";
const RETRY_MISSED_MAX_ITEMS = 300;
const RETRY_MISSED_DEFAULT_SESSION_SIZE = 40;
const SPACED_PRACTICE_MAX_ITEMS = 600;
const SPACED_PRACTICE_DEFAULT_SESSION_SIZE = 40;
const SPACED_PRACTICE_MIN_EASE = 1.3;
const SPACED_PRACTICE_MAX_EASE = 3.2;
const SPACED_PRACTICE_DEFAULT_EASE = 2.5;
const SPACED_PRACTICE_MASTERY_REPETITIONS = 4;
const SPACED_PRACTICE_MASTERY_INTERVAL_DAYS = 21;
const MAX_PROGRESS_ATTEMPTS = 50;
const PROGRESS_SYNC_DEVICE_ID_STORAGE_KEY = "cbt_progress_device_id_v1";
const CLOUD_PROGRESS_SYNC_MIN_INTERVAL_MS = 8000;
const CLOUD_PROGRESS_SYNC_EVENT = "cloudprogresssyncchange";

let cloudProgressSyncInFlight = null;
let lastCloudProgressSyncMs = 0;
const cloudProgressSyncStatus = {
  inFlight: false,
  synced: false,
  lastAttemptAt: "",
  lastSuccessAt: "",
  lastError: "",
  lastReason: "",
};

function emitCloudProgressSyncStatus() {
  if (typeof document === "undefined" || typeof CustomEvent !== "function") return;
  document.dispatchEvent(
    new CustomEvent(CLOUD_PROGRESS_SYNC_EVENT, {
      detail: getCloudProgressSyncStatus(),
    }),
  );
}

function setCloudProgressSyncStatus(next = {}) {
  Object.assign(cloudProgressSyncStatus, next);
  emitCloudProgressSyncStatus();
}

export function getCloudProgressSyncStatus() {
  return { ...cloudProgressSyncStatus };
}

function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function getProgressAttemptIdentity(attempt = {}) {
  const byId = String(attempt?.attemptId || "").trim();
  if (byId) return byId;
  const topicId = String(attempt?.topicId || "").trim().toLowerCase();
  const mode = String(attempt?.mode || "").trim().toLowerCase();
  const createdAt = String(attempt?.createdAt || "").trim();
  const score = String(Math.round(clampNumber(attempt?.scorePercentage, { min: 0, max: 100, fallback: 0 })));
  const total = String(Math.floor(clampNumber(attempt?.totalQuestions, { min: 0, max: 1000, fallback: 0 })));
  return `legacy:${topicId}|${mode}|${createdAt}|${score}|${total}`;
}

function normalizeProgressCount(value, { fallback = 0, max = 1000 } = {}) {
  return Math.floor(clampNumber(value, { min: 0, max, fallback }));
}

function normalizeStructuredBreakdown(items, { idKey, nameKey = "", sortComparator = null } = {}) {
  const entries = Array.isArray(items) ? items : [];
  const normalized = entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = String(entry?.[idKey] || "").trim();
      if (!id) return null;

      const total = normalizeProgressCount(entry?.total, { fallback: 0, max: 1000 });
      const answered = normalizeProgressCount(entry?.answered, { fallback: 0, max: total });
      const correct = normalizeProgressCount(entry?.correct, { fallback: 0, max: answered });
      const wrong = normalizeProgressCount(entry?.wrong, {
        fallback: Math.max(0, answered - correct),
        max: answered,
      });
      const unanswered = normalizeProgressCount(entry?.unanswered, {
        fallback: Math.max(0, total - answered),
        max: total,
      });
      const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      const next = {
        [idKey]: id,
        total,
        answered,
        correct,
        wrong,
        unanswered,
        accuracy,
      };
      if (nameKey) {
        next[nameKey] = String(entry?.[nameKey] || id).trim();
      }
      return next;
    })
    .filter(Boolean);

  if (typeof sortComparator === "function") {
    normalized.sort(sortComparator);
  }

  return normalized;
}

function normalizeSubcategoryBreakdownEntries(items) {
  return normalizeStructuredBreakdown(items, {
    idKey: "subcategoryId",
    nameKey: "subcategoryName",
    sortComparator: (left, right) =>
      left.accuracy - right.accuracy ||
      right.total - left.total ||
      left.subcategoryName.localeCompare(right.subcategoryName),
  });
}

function normalizeDifficultyBreakdownEntries(items) {
  const rank = { easy: 0, medium: 1, hard: 2 };
  return normalizeStructuredBreakdown(items, {
    idKey: "difficulty",
    sortComparator: (left, right) => {
      const rankDelta = (rank[left.difficulty] ?? 99) - (rank[right.difficulty] ?? 99);
      if (rankDelta !== 0) return rankDelta;
      return left.difficulty.localeCompare(right.difficulty);
    },
  });
}

function normalizeSourceTopicBreakdownEntries(items) {
  return normalizeStructuredBreakdown(items, {
    idKey: "topicId",
    nameKey: "topicName",
    sortComparator: (left, right) =>
      right.accuracy - left.accuracy ||
      right.correct - left.correct ||
      left.topicName.localeCompare(right.topicName),
  });
}

function normalizeProgressAttempt(attempt = {}) {
  const topicId = String(attempt?.topicId || "").trim();
  if (!topicId) return null;
  const topicName = String(attempt?.topicName || topicId).trim();
  const mode = String(attempt?.mode || "practice").trim().toLowerCase();
  const createdAtRaw = String(attempt?.createdAt || "").trim();
  const createdAt = Number.isNaN(Date.parse(createdAtRaw))
    ? new Date().toISOString()
    : new Date(createdAtRaw).toISOString();
  const attemptId = getProgressAttemptIdentity({ ...attempt, topicId, mode, createdAt });
  return {
    attemptId,
    topicId,
    topicName,
    mode,
    scorePercentage: Math.round(
      clampNumber(attempt?.scorePercentage, { min: 0, max: 100, fallback: 0 }),
    ),
    totalQuestions: Math.floor(
      clampNumber(attempt?.totalQuestions, { min: 0, max: 1000, fallback: 0 }),
    ),
    createdAt,
    deviceId: String(attempt?.deviceId || "").trim(),
    templateId: String(attempt?.templateId || "").trim(),
    templateName: String(attempt?.templateName || "").trim(),
    glBand: String(attempt?.glBand || "").trim(),
    timeTakenSec: Number.isFinite(Number(attempt?.timeTakenSec))
      ? normalizeProgressCount(attempt?.timeTakenSec, { fallback: 0, max: 86400 })
      : null,
    correctCount: normalizeProgressCount(attempt?.correctCount, { fallback: 0, max: 1000 }),
    wrongCount: normalizeProgressCount(attempt?.wrongCount, { fallback: 0, max: 1000 }),
    unansweredCount: normalizeProgressCount(attempt?.unansweredCount, { fallback: 0, max: 1000 }),
    subcategoryBreakdown: normalizeSubcategoryBreakdownEntries(attempt?.subcategoryBreakdown),
    difficultyBreakdown: normalizeDifficultyBreakdownEntries(attempt?.difficultyBreakdown),
    sourceTopicBreakdown: normalizeSourceTopicBreakdownEntries(attempt?.sourceTopicBreakdown),
  };
}

function normalizeProgressSummary(summary) {
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  const byIdentity = new Map();
  attempts.forEach((attempt) => {
    const normalized = normalizeProgressAttempt(attempt);
    if (!normalized) return;
    const previous = byIdentity.get(normalized.attemptId);
    if (!previous) {
      byIdentity.set(normalized.attemptId, normalized);
      return;
    }
    const previousMs = Date.parse(previous.createdAt || "") || 0;
    const nextMs = Date.parse(normalized.createdAt || "") || 0;
    if (nextMs >= previousMs) {
      byIdentity.set(normalized.attemptId, normalized);
    }
  });

  const normalizedAttempts = Array.from(byIdentity.values())
    .sort((a, b) => {
      const aMs = Date.parse(a.createdAt || "") || 0;
      const bMs = Date.parse(b.createdAt || "") || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a.attemptId || "").localeCompare(String(b.attemptId || ""));
    })
    .slice(-MAX_PROGRESS_ATTEMPTS);

  return { attempts: normalizedAttempts };
}

function mergeProgressSummaries(localSummary, cloudSummary) {
  const local = normalizeProgressSummary(localSummary);
  const cloud = normalizeProgressSummary(cloudSummary);
  return normalizeProgressSummary({
    attempts: [...local.attempts, ...cloud.attempts],
  });
}

function areProgressSummariesEqual(a, b) {
  const left = normalizeProgressSummary(a);
  const right = normalizeProgressSummary(b);
  return JSON.stringify(left) === JSON.stringify(right);
}

function getProgressSyncDeviceId() {
  try {
    const existing = String(window.localStorage.getItem(PROGRESS_SYNC_DEVICE_ID_STORAGE_KEY) || "").trim();
    if (existing) return existing;
    const nextId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(PROGRESS_SYNC_DEVICE_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch (error) {
    return `dev-${Date.now().toString(36)}`;
  }
}

function createProgressAttemptId(createdAtIso) {
  const timestampMs = Date.parse(createdAtIso || "") || Date.now();
  return `a-${timestampMs.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isCloudProgressSyncReady() {
  return Boolean(isCloudProgressSyncEnabled() && getCurrentUser()?.id);
}
export const RETRY_MISSED_TOPIC_ID = "retry_missed";
export const SPACED_PRACTICE_TOPIC_ID = "spaced_practice";

let reviewContext = "study"; // "study" (pre-quiz) or "session" (post-quiz)
let lastCompletedSession = null;
const MOCK_EXAM_TOPIC_ID = "mock_exam";

function clampIndex(value, length) {
  const max = Math.max(0, Number(length || 0) - 1);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(max, Math.max(0, Math.floor(numeric)));
}

function normalizeRuntimeAnswers(values, total) {
  const size = Number(total || 0);
  const answers = Array.isArray(values) ? values.slice(0, size) : [];
  const normalized = new Array(size).fill(undefined);
  answers.forEach((value, index) => {
    if (value === null || value === undefined || value === "") {
      return;
    }
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 0) {
      normalized[index] = numeric;
    }
  });
  return normalized;
}

function normalizeRuntimeFeedback(values, total) {
  const size = Number(total || 0);
  const feedback = Array.isArray(values) ? values.slice(0, size) : [];
  const normalized = new Array(size).fill(false);
  feedback.forEach((value, index) => {
    normalized[index] = Boolean(value);
  });
  return normalized;
}

function readQuizRuntimeStorageRaw() {
  try {
    const raw = window.localStorage.getItem(QUIZ_RUNTIME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function buildRuntimeTopicPayload(topic) {
  if (!topic || typeof topic !== "object") return null;
  return {
    id: String(topic.id || ""),
    name: String(topic.name || ""),
    description: String(topic.description || ""),
    file: String(topic.file || ""),
    type: String(topic.type || ""),
    skipCategorySelection: Boolean(topic.skipCategorySelection),
    requiresPremium: Boolean(topic.requiresPremium),
    mockExamQuestionCount: Number(topic.mockExamQuestionCount || 0) || null,
    selectedCategory: String(topic.selectedCategory || "all"),
    allowedCategoryIds: Array.isArray(topic.allowedCategoryIds)
      ? topic.allowedCategoryIds.filter(Boolean)
      : null,
    studyFilters: topic?.studyFilters || null,
    selectedTemplateId: String(topic?.selectedTemplateId || ""),
    selectedTemplateName: String(topic?.selectedTemplateName || ""),
    glBand: String(topic?.glBand || ""),
    examTimeLimitMin: Number(topic?.examTimeLimitMin || 0) || null,
    mockExamBlueprint: Array.isArray(topic.mockExamBlueprint)
      ? topic.mockExamBlueprint
          .map((entry) => ({
            topicId: String(entry?.topicId || ""),
            count: Number(entry?.count || 0),
          }))
          .filter((entry) => entry.topicId && entry.count > 0)
      : null,
  };
}

function getPersistedQuizRuntimeForCurrentUser() {
  const saved = readQuizRuntimeStorageRaw();
  if (!saved) return null;

  const user = getCurrentUser();
  const userId = String(user?.id || "");
  if (!userId || String(saved?.userId || "") !== userId) {
    return null;
  }

  const mode = String(saved?.mode || "");
  if (mode !== "practice" && mode !== "exam") {
    return null;
  }

  const savedAt = Date.parse(String(saved?.savedAt || ""));
  if (!savedAt || Date.now() - savedAt > QUIZ_RUNTIME_MAX_AGE_MS) {
    return null;
  }

  if (!Array.isArray(saved?.questions) || !saved.questions.length) {
    return null;
  }

  if (!saved?.topic || typeof saved.topic !== "object" || !saved.topic.id) {
    return null;
  }

  return saved;
}

function persistQuizRuntime() {
  const user = getCurrentUser();
  const userId = String(user?.id || "");

  if (!userId || !currentTopic?.id) {
    clearPersistedQuizRuntime();
    return;
  }

  if (currentMode !== "practice" && currentMode !== "exam") {
    clearPersistedQuizRuntime();
    return;
  }

  const questions = Array.isArray(quizState.originalQuestions) && quizState.originalQuestions.length
    ? quizState.originalQuestions
    : quizState.allQuestions;
  if (!Array.isArray(questions) || !questions.length) {
    clearPersistedQuizRuntime();
    return;
  }

  const totalQuestions = questions.length;
  const payload = {
    userId,
    mode: currentMode,
    topic: buildRuntimeTopicPayload(currentTopic),
    questions,
    currentQuestionIndex: clampIndex(quizState.currentQuestionIndex, totalQuestions),
    userAnswers: normalizeRuntimeAnswers(quizState.userAnswers, totalQuestions),
    feedbackShown: normalizeRuntimeFeedback(quizState.feedbackShown, totalQuestions),
    timeLeft: Math.max(0, Number(quizState.timeLeft || 0)),
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(QUIZ_RUNTIME_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore storage quota/persistence errors.
  }
}

export function clearPersistedQuizRuntime() {
  window.localStorage.removeItem(QUIZ_RUNTIME_STORAGE_KEY);
}

export function getPersistedQuizRuntime() {
  return getPersistedQuizRuntimeForCurrentUser();
}

export function restorePersistedQuizRuntime(runtime, topicOverride = null) {
  const source = runtime && typeof runtime === "object" ? runtime : getPersistedQuizRuntimeForCurrentUser();
  if (!source) return null;

  const mode = String(source.mode || "");
  if (mode !== "practice" && mode !== "exam") return null;

  const questions = Array.isArray(source.questions) ? source.questions : [];
  if (!questions.length) return null;

  const totalQuestions = questions.length;
  const runtimeTopic =
    topicOverride && typeof topicOverride === "object"
      ? {
          ...source.topic,
          ...topicOverride,
        }
      : source.topic;
  if (!runtimeTopic?.id) return null;

  currentTopic = runtimeTopic;
  setCurrentMode(mode);
  quizState.allQuestions = [...questions];
  quizState.originalQuestions = [...questions];

  initializeQuiz({
    preserveAnswers: true,
    context: "session",
    keepOriginalQuestions: true,
    restoreState: {
      currentQuestionIndex: clampIndex(source.currentQuestionIndex, totalQuestions),
      userAnswers: normalizeRuntimeAnswers(source.userAnswers, totalQuestions),
      feedbackShown: normalizeRuntimeFeedback(source.feedbackShown, totalQuestions),
      timeLeft: Math.max(0, Number(source.timeLeft || 0)),
    },
  });

  return {
    topic: runtimeTopic,
    mode,
  };
}

function isMockExamTopic(topic) {
  return topic?.id === MOCK_EXAM_TOPIC_ID || topic?.type === "mock_exam";
}

function getDisplayTopicName(topic) {
  if (!topic || typeof topic !== "object") return "";
  const baseName = String(topic?.name || "").trim();
  const selectedTemplateName = String(
    topic?.selectedTemplateName || getMockExamTemplate(topic)?.name || "",
  ).trim();
  if (isMockExamTopic(topic) && selectedTemplateName) {
    return baseName + " - " + selectedTemplateName;
  }
  return baseName;
}

function getMockExamTemplate(topic) {
  if (!isMockExamTopic(topic)) {
    return null;
  }
  if (!isFeatureEnabled("enableTemplateLoading") || !isFeatureEnabled("enableTemplateDrivenMocks")) {
    return null;
  }

  const selectedTemplateId = String(
    topic?.selectedTemplateId || DEFAULT_MOCK_EXAM_TEMPLATE_ID,
  ).trim();
  return (
    getExamTemplateById(selectedTemplateId) ||
    getExamTemplateById(DEFAULT_MOCK_EXAM_TEMPLATE_ID) ||
    null
  );
}

function getMockExamBlueprint(topic) {
  const fallbackBlueprint =
    Array.isArray(topic?.mockExamBlueprint) && topic.mockExamBlueprint.length
      ? topic.mockExamBlueprint
      : getDefaultMockExamBlueprint();

  const template = getMockExamTemplate(topic);
  if (template) {
    const blueprint = buildMockExamBlueprint({
      template,
      glBandWeights: getGLBandWeights(),
      fallbackBlueprint,
    });
    if (blueprint.length) {
      return blueprint;
    }
  }

  return Array.isArray(fallbackBlueprint) ? fallbackBlueprint : getDefaultMockExamBlueprint();
}

function getMockExamQuestionTarget(topic, blueprint = null) {
  const template = getMockExamTemplate(topic);
  const configuredTarget = Number(
    template?.totalQuestions || topic?.mockExamQuestionCount || 0,
  );
  if (Number.isFinite(configuredTarget) && configuredTarget > 0) {
    return Math.floor(configuredTarget);
  }

  const resolvedBlueprint = Array.isArray(blueprint) ? blueprint : getMockExamBlueprint(topic);
  const blueprintTotal = resolvedBlueprint.reduce(
    (sum, entry) => sum + Math.max(0, Number(entry?.count || 0)),
    0,
  );
  return blueprintTotal > 0 ? blueprintTotal : 40;
}

function getConfiguredExamTimeLimitSeconds(topic, questionCount = 0) {
  const template = getMockExamTemplate(topic);
  const configuredMinutes = Number(topic?.examTimeLimitMin || template?.timeLimitMin || 0);
  if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return Math.floor(configuredMinutes * 60);
  }

  const safeQuestionCount = Math.max(0, Number(questionCount || 0));
  return getTimedTopicTestDurationSeconds(safeQuestionCount);
}

function getQuestionSelectionKey(question, sourceTopicId = "") {
  const questionId = String(question?.id || "").trim();
  if (questionId) return sourceTopicId + ":" + questionId;

  const prompt = String(question?.question || "").trim();
  if (prompt) return sourceTopicId + ":" + prompt;

  return "";
}

async function buildTopicQuestionPool(sourceTopic) {
  const topicDataFiles = await fetchTopicDataFiles(sourceTopic, { tolerateFailures: true });
  const pool = [];
  topicDataFiles.forEach((topicData) => {
    pool.push(...extractQuestionsByCategory(topicData, "all", {}));
  });

  return pool.map((question) => ({
    ...question,
    sourceTopicId: sourceTopic.id,
    sourceTopicName: sourceTopic.name,
  }));
}

function updateQuizSessionEstimate() {
  const estimateElement = document.getElementById("quizSessionEstimate");
  if (!estimateElement) return;

  if (currentMode !== "exam") {
    estimateElement.textContent = "";
    estimateElement.classList.add("hidden");
    return;
  }

  const allowedSeconds = getConfiguredExamTimeLimitSeconds(currentTopic, quizState.allQuestions.length);
  if (!allowedSeconds) {
    estimateElement.textContent = "";
    estimateElement.classList.add("hidden");
    return;
  }

  estimateElement.textContent = ` | Allowed: ${formatSessionDurationLabel(allowedSeconds)}`;
  estimateElement.classList.remove("hidden");
}

function buildQuestionSelectionProfileForSession({
  summary = readProgressSummary(),
  topic = currentTopic,
  mode = currentMode || "practice",
  currentTopicId = topic?.id || "",
  glBand = getActiveSessionGlBand(topic),
} = {}) {
  const normalizedStudyFilters = normalizeStudyFilters(topic?.studyFilters);
  return buildQuestionSelectionProfile(summary, {
    currentTopicId,
    glBand,
    mode,
    focusPreference: normalizedStudyFilters.questionFocus,
  });
}
async function buildMockExamQuestions(topic) {
  const baseTopics = getTopics().filter((entry) => entry?.id && entry.file);
  const topicMap = new Map(baseTopics.map((entry) => [entry.id, entry]));
  const blueprint = getMockExamBlueprint(topic);
  const targetQuestionCount = getMockExamQuestionTarget(topic, blueprint);
  const template = getMockExamTemplate(topic);
  const activeGLBand = String(template?.glBand || topic?.glBand || "");
  const shouldShuffleQuestions = template?.shuffleQuestions !== false;
  const selectedQuestions = [];
  const selectedKeys = new Set();
  const loadedPools = new Map();
  const progressSummary = readProgressSummary();
  const selectionProfileCache = new Map();

  async function getPoolForTopic(sourceTopic) {
    if (!sourceTopic?.id) return [];
    if (loadedPools.has(sourceTopic.id)) {
      return loadedPools.get(sourceTopic.id);
    }
    const pool = await buildTopicQuestionPool(sourceTopic);
    loadedPools.set(sourceTopic.id, pool);
    return pool;
  }

  function getSelectionProfile(sourceTopicId = "") {
    const cacheKey = String(sourceTopicId || "__all__");
    if (selectionProfileCache.has(cacheKey)) {
      return selectionProfileCache.get(cacheKey);
    }

    const profile = buildQuestionSelectionProfileForSession({
      summary: progressSummary,
      topic,
      mode: "exam",
      currentTopicId: sourceTopicId,
      glBand: activeGLBand,
    });
    selectionProfileCache.set(cacheKey, profile);
    return profile;
  }

  function appendUniqueQuestions(pool, count, sourceTopicId = "") {
    const picked = prioritizeQuestionPool(pool, getSelectionProfile(sourceTopicId))
      .filter((question) => {
        const key = getQuestionSelectionKey(question, question?.sourceTopicId || "");
        return key && !selectedKeys.has(key);
      })
      .slice(0, Math.max(0, count));

    picked.forEach((question) => {
      const key = getQuestionSelectionKey(question, question?.sourceTopicId || "");
      if (key) selectedKeys.add(key);
    });
    selectedQuestions.push(...picked);
  }

  for (const item of blueprint) {
    const sourceTopic = topicMap.get(item.topicId);
    if (!sourceTopic) continue;
    const pool = await getPoolForTopic(sourceTopic);
    if (!pool.length) continue;
    appendUniqueQuestions(pool, Math.min(item.count, pool.length), sourceTopic.id);
    if (selectedQuestions.length >= targetQuestionCount) break;
  }

  if (selectedQuestions.length < targetQuestionCount) {
    const blueprintTopicIds = new Set(blueprint.map((entry) => entry.topicId));
    const fallbackTopics = [
      ...blueprint
        .map((entry) => topicMap.get(entry.topicId))
        .filter(Boolean),
      ...baseTopics.filter((entry) => !blueprintTopicIds.has(entry.id)),
    ];
    const fallbackPool = [];
    for (const sourceTopic of fallbackTopics) {
      const pool = await getPoolForTopic(sourceTopic);
      fallbackPool.push(...pool);
    }
    appendUniqueQuestions(fallbackPool, targetQuestionCount - selectedQuestions.length, "");
  }

  const finalizedQuestions = selectedQuestions.slice(0, targetQuestionCount);
  return shouldShuffleQuestions ? shuffleArray(finalizedQuestions) : finalizedQuestions;
}
function buildMockExamTopicBreakdown() {
  const byTopic = new Map();

  quizState.allQuestions.forEach((question, index) => {
    const topicId = question?.sourceTopicId || "";
    if (!topicId) return;
    const topicName = question?.sourceTopicName || topicId;
    if (!byTopic.has(topicId)) {
      byTopic.set(topicId, {
        topicId,
        topicName,
        total: 0,
        answered: 0,
        correct: 0,
      });
    }
    const entry = byTopic.get(topicId);
    entry.total += 1;

    const answer = quizState.userAnswers[index];
    if (answer !== undefined) {
      entry.answered += 1;
      if (answer === question.correct) {
        entry.correct += 1;
      }
    }
  });

  return Array.from(byTopic.values())
    .map((entry) => ({
      ...entry,
      wrong: Math.max(0, entry.answered - entry.correct),
      unanswered: Math.max(0, entry.total - entry.answered),
      accuracy: entry.answered
        ? Math.round((entry.correct / entry.answered) * 100)
        : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct || a.topicName.localeCompare(b.topicName));
}

function formatGlBandLabel(glBand) {
  return formatTargetGlBandLabel(glBand);
}

function formatDifficultyLabel(difficulty) {
  const value = String(difficulty || "").trim().toLowerCase();
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTopicSessionGlBand(topic) {
  const normalizedStudyFilters = normalizeStudyFilters(topic?.studyFilters);
  const emphasis = normalizeGLBandKey(normalizedStudyFilters.targetGlBand);
  return emphasis && emphasis !== "general" ? emphasis : "";
}

function getActiveSessionGlBand(topic) {
  return String(
    topic?.glBand || getMockExamTemplate(topic)?.glBand || getTopicSessionGlBand(topic) || "",
  ).trim();
}

function getQuestionPreferredGlBand(question) {
  const bandPriority = {
    gl_14_15: 1,
    gl_15_16: 2,
    gl_16_17: 3,
  };
  const questionBands = Array.isArray(question?.glBands)
    ? question.glBands
        .map((entry) => normalizeGLBandKey(entry))
        .filter((entry) => entry && entry !== "general")
        .sort(
          (left, right) =>
            (bandPriority[right] || 0) - (bandPriority[left] || 0) || left.localeCompare(right),
        )
    : [];
  return questionBands[0] || "";
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

function buildRecentAttemptSignal(attempts = []) {
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

function getSessionTimingSignal({ mode = currentMode, timeElapsed = 0, configuredExamSeconds = 0, unansweredCount = 0 } = {}) {
  if (mode !== "exam" || configuredExamSeconds <= 0) return null;

  const safeConfiguredSeconds = Math.max(0, Number(configuredExamSeconds || 0));
  const elapsedSeconds = Math.max(0, Math.min(safeConfiguredSeconds, Number(timeElapsed || 0)));
  const remainingSeconds = Math.max(0, safeConfiguredSeconds - elapsedSeconds);
  const safeUnansweredCount = Math.max(0, Number(unansweredCount || 0));
  const usedRatio = safeConfiguredSeconds > 0 ? elapsedSeconds / safeConfiguredSeconds : 0;
  let severity = "steady";
  if (safeUnansweredCount > 0 || usedRatio >= 0.95) {
    severity = "high";
  } else if (usedRatio <= 0.6) {
    severity = "comfortable";
  }

  return {
    severity,
    elapsedSeconds,
    remainingSeconds,
    usedRatio,
    unansweredCount: safeUnansweredCount,
  };
}

function buildResultsRecommendationConfidence({
  weakestSessionSubcategory = null,
  topicAttemptCount = 0,
  unansweredCount = 0,
  incorrectCount = 0,
  recentScoreSignal = null,
  timingSignal = null,
} = {}) {
  const repeatedSessions = Number(weakestSessionSubcategory?.sessions || 0);
  const issueCount = Math.max(0, Number(incorrectCount || 0)) + Math.max(0, Number(unansweredCount || 0));
  const repeatedWeakEvidence = repeatedSessions >= 2 ? 1 : 0;
  const topicHistoryEvidence = Number(topicAttemptCount || 0) >= 2 ? 1 : 0;
  const issueEvidence = issueCount >= 4 ? 1 : 0;
  const trendEvidence = recentScoreSignal?.direction && recentScoreSignal.direction !== "steady" ? 1 : 0;
  const timingEvidence = timingSignal?.severity && timingSignal.severity !== "steady" ? 1 : 0;
  const alignedSignalCount =
    repeatedWeakEvidence +
    topicHistoryEvidence +
    issueEvidence +
    trendEvidence +
    timingEvidence;
  const hasStrongHistory = repeatedSessions >= 3 || Number(topicAttemptCount || 0) >= 4;

  if (hasStrongHistory && alignedSignalCount >= 2) {
    return {
      label: "Repeated Pattern",
      tone: "high",
      description: "This weak spot is repeating across sessions and the surrounding signals keep pointing in the same direction. It has moved beyond a developing signal because the same weakness keeps resurfacing.",
    };
  }

  if (alignedSignalCount >= 2) {
    return {
      label: "Building Pattern",
      tone: "medium",
      description: "More than one signal is lining up, so this is moving beyond a one-off result, but it is still developing.",
    };
  }

  return {
    label: "Early Pattern",
    tone: "low",
    description: "This is based on a lighter sample, so treat it as a direction check in the next session.",
  };

}
function buildResultsRecommendationSignals({ recentScoreSignal = null, timingSignal = null } = {}) {
  const chips = [];
  const noteParts = [];

  if (recentScoreSignal?.direction === "slipping") {
    chips.push("Trend: Slipping");
    noteParts.push(
      `Recent scored sessions are down ${Math.abs(Math.round(recentScoreSignal.delta))} point(s), so keep the next pass corrective.`,
    );
  } else if (recentScoreSignal?.direction === "improving") {
    chips.push("Trend: Improving");
    noteParts.push(
      `Recent scored sessions are up ${Math.round(recentScoreSignal.delta)} point(s), so the added challenge is deliberate.`,
    );
  }

  if (timingSignal?.severity === "high") {
    chips.push("Pace: Under Pressure");
    noteParts.push(
      timingSignal.unansweredCount > 0
        ? `Time pressure left ${timingSignal.unansweredCount} question(s) unanswered in this session.`
        : "This session used nearly the full allowed time.",
    );
  } else if (timingSignal?.severity === "comfortable") {
    chips.push("Pace: Comfortable");
    noteParts.push(`You still had ${formatSessionDurationLabel(timingSignal.remainingSeconds)} remaining.`);
  }

  return {
    chips,
    note: noteParts.join(" "),
  };
}

function buildRecommendedSessionSetup({
  topic = currentTopic,
  mode = currentMode,
  scorePercentage = 0,
  incorrectCount = 0,
  unansweredCount = 0,
  timeElapsed = 0,
  configuredExamSeconds = 0,
  difficultyBreakdown = [],
  recentScoreSignal = null,
  recommendationConfidence = null,
  timingSignal = null,
} = {}) {
  if (
    !topic?.id ||
    isMockExamTopic(topic) ||
    topic?.id === RETRY_MISSED_TOPIC_ID ||
    topic?.id === SPACED_PRACTICE_TOPIC_ID
  ) {
    return null;
  }
  if (mode === "review") return null;

  const totalQuestions = quizState.allQuestions.length;
  const currentFilters = normalizeStudyFilters(topic?.studyFilters, {
    totalQuestions,
  });
  const nextFilters = { ...currentFilters };
  const recommendationParts = [];
  let changed = false;

  const availableQuestionCounts = [10, 20, 40, 60, 80]
    .filter((value) => value < totalQuestions)
    .concat(totalQuestions)
    .filter((value, index, items) => Number.isInteger(value) && value > 0 && items.indexOf(value) === index)
    .sort((left, right) => left - right);
  const currentQuestionCount = nextFilters.questionCount === "all"
    ? totalQuestions
    : Number(nextFilters.questionCount) || totalQuestions;
  const chooseQuestionCountAtMost = (limit) => {
    const safeLimit = Math.max(10, Math.min(totalQuestions, Number(limit) || totalQuestions));
    const candidates = availableQuestionCounts.filter((value) => value <= safeLimit);
    return candidates[candidates.length - 1] || availableQuestionCounts[0] || safeLimit;
  };
  const chooseQuestionCountAtLeast = (minimum) => {
    const safeMinimum = Math.max(10, Math.min(totalQuestions, Number(minimum) || totalQuestions));
    return availableQuestionCounts.find((value) => value >= safeMinimum) || availableQuestionCounts[availableQuestionCounts.length - 1] || safeMinimum;
  };
  const lowerDifficulty = (value) => {
    if (value === "hard") return "medium";
    if (value === "medium") return "easy";
    return value;
  };

  if (
    (incorrectCount > 0 || unansweredCount > 0 || scorePercentage < 70) &&
    nextFilters.questionFocus !== "weak_areas"
  ) {
    nextFilters.questionFocus = "weak_areas";
    recommendationParts.push(`Switch to ${formatQuestionFocusLabel(nextFilters.questionFocus)}.`);
    changed = true;
  }

  const glBandCounts = new Map();
  quizState.allQuestions.forEach((question, index) => {
    const userAnswer = quizState.userAnswers[index];
    const isIncorrect = userAnswer !== undefined && userAnswer !== question?.correct;
    const isUnanswered = userAnswer === undefined;
    if (!isIncorrect && !isUnanswered) return;

    const preferredBand = getQuestionPreferredGlBand(question);
    if (!preferredBand) return;
    glBandCounts.set(preferredBand, (glBandCounts.get(preferredBand) || 0) + 1);
  });

  const recommendedGlBand =
    Array.from(glBandCounts.entries()).sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )[0]?.[0] || "";
  const currentGlBand = normalizeGLBandKey(nextFilters.targetGlBand);
  if (recommendedGlBand && recommendedGlBand !== currentGlBand) {
    nextFilters.targetGlBand = recommendedGlBand;
    recommendationParts.push(
      `Lean the session toward ${formatTargetGlBandLabel(recommendedGlBand)} questions.`,
    );
    changed = true;
  }

  const isTimedSession = mode === "exam" && configuredExamSeconds > 0;
  const resolvedTimingSignal = timingSignal || getSessionTimingSignal({
    mode,
    timeElapsed,
    configuredExamSeconds,
    unansweredCount,
  });
  const remainingRatio = isTimedSession && resolvedTimingSignal
    ? Math.max(0, resolvedTimingSignal.remainingSeconds) / configuredExamSeconds
    : 0;
  const pressureRatio = isTimedSession && resolvedTimingSignal
    ? Math.min(1, resolvedTimingSignal.elapsedSeconds / configuredExamSeconds)
    : 0;
  const hardestDifficulty = Array.isArray(difficultyBreakdown)
    ? difficultyBreakdown.find((entry) => entry?.difficulty === "hard")
    : null;
  const hardAccuracy = hardestDifficulty?.answered ? hardestDifficulty.accuracy : null;

  if (isTimedSession && (unansweredCount > 0 || pressureRatio >= 0.95 || scorePercentage < 55)) {
    const reducedQuestionCount = chooseQuestionCountAtMost(currentQuestionCount <= 20 ? currentQuestionCount : 20);
    if (reducedQuestionCount < currentQuestionCount) {
      nextFilters.questionCount = reducedQuestionCount;
      recommendationParts.push(`Trim the next timed run to ${reducedQuestionCount} questions to steady your pace.`);
      changed = true;
    }
  } else if (isTimedSession && scorePercentage >= 80 && remainingRatio >= 0.2) {
    const expandedQuestionCount = chooseQuestionCountAtLeast(Math.max(currentQuestionCount, 40));
    if (expandedQuestionCount > currentQuestionCount) {
      nextFilters.questionCount = expandedQuestionCount;
      recommendationParts.push(`Stretch the next timed run to ${expandedQuestionCount} questions while your pace is strong.`);
      changed = true;
    }
  }

  if ((scorePercentage < 60 || (hardAccuracy !== null && hardAccuracy < 50)) && nextFilters.difficulty !== "easy") {
    const suggestedDifficulty = lowerDifficulty(nextFilters.difficulty === "all" ? "hard" : nextFilters.difficulty);
    if (suggestedDifficulty && suggestedDifficulty !== nextFilters.difficulty) {
      nextFilters.difficulty = suggestedDifficulty;
      recommendationParts.push(`Lower the difficulty focus to ${suggestedDifficulty} for the next pass.`);
      changed = true;
    }
  } else if (scorePercentage >= 85 && remainingRatio >= 0.2 && nextFilters.difficulty !== "hard") {
    nextFilters.difficulty = "hard";
    recommendationParts.push("Push the next pass toward hard questions while your accuracy is stable.");
    changed = true;
  }

  if (!changed) return null;

  const signalSummary = buildResultsRecommendationSignals({
    recentScoreSignal,
    timingSignal: resolvedTimingSignal,
  });
  if (signalSummary.note) {
    recommendationParts.push(signalSummary.note);
  }

  const summaryChips = [];
  if (String(nextFilters.questionCount) !== String(currentFilters.questionCount)) {
    summaryChips.push(`${nextFilters.questionCount} Questions`);
  }
  if (nextFilters.difficulty !== currentFilters.difficulty && nextFilters.difficulty !== "all") {
    summaryChips.push(nextFilters.difficulty.charAt(0).toUpperCase() + nextFilters.difficulty.slice(1));
  }
  if (nextFilters.questionFocus !== currentFilters.questionFocus) {
    summaryChips.push(formatQuestionFocusLabel(nextFilters.questionFocus));
  }
  if (nextFilters.targetGlBand !== currentFilters.targetGlBand && nextFilters.targetGlBand !== "general") {
    summaryChips.push(formatTargetGlBandLabel(nextFilters.targetGlBand));
  }

  return {
    title: "Tune the Next Session",
    body: recommendationParts.join(" "),
    buttonLabel: "Use Suggested Setup",
    action: "setup_tune",
    nextFilters,
    summaryChips,
    signalChips: signalSummary.chips,
    confidenceLabel: recommendationConfidence?.label || "",
    confidenceTone: recommendationConfidence?.tone || "medium",
    confidenceDescription: recommendationConfidence?.description || "",
  };
}
function getTrafficClassByPercentage(percentage) {
  if (percentage >= 70) return "traffic-green";
  if (percentage >= 50) return "traffic-amber";
  return "traffic-red";
}

function getInverseTrafficClassByPercentage(percentage) {
  if (percentage <= 20) return "traffic-green";
  if (percentage <= 40) return "traffic-amber";
  return "traffic-red";
}

function applyTrafficClass(element, className) {
  if (!element) return;
  element.classList.remove("traffic-green", "traffic-amber", "traffic-red");
  if (className) element.classList.add(className);
}

/**
 * DOM Elements cache
 */

function readProgressSummary() {
  try {
    const raw = window.localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return normalizeProgressSummary(parsed);
  } catch (error) {
    return { attempts: [] };
  }
}

function saveProgressSummary(summary) {
  const normalized = normalizeProgressSummary(summary);
  try {
    window.localStorage.setItem(getProgressStorageKeyForCurrentUser(), JSON.stringify(normalized));
  } catch (error) {
    console.warn("Unable to persist progress summary", error);
  }
}

function getRetryMissedStorageKeyForCurrentUser() {
  const user = getCurrentUser();
  const userId = String(user?.id || "").trim();
  return userId ? `${RETRY_MISSED_STORAGE_PREFIX}${userId}` : "";
}

function normalizeRetryQueueEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return null;
  const question = entry?.question;
  if (!question || typeof question !== "object") return null;
  const id = String(entry?.id || normalizeQuestionFingerprint(question) || "").trim();
  if (!id) return null;

  const updatedAtRaw = String(entry?.updatedAt || "").trim();
  const updatedAt = Number.isNaN(Date.parse(updatedAtRaw))
    ? new Date().toISOString()
    : new Date(updatedAtRaw).toISOString();
  const parsedAnswerIndex = Number(entry?.lastUserAnswerIndex);
  const lastUserAnswerIndex = Number.isInteger(parsedAnswerIndex) && parsedAnswerIndex >= 0
    ? parsedAnswerIndex
    : null;
  const lastOutcome = String(entry?.lastOutcome || "").trim().toLowerCase() === "unanswered"
    ? "unanswered"
    : "incorrect";

  return {
    id,
    updatedAt,
    sourceTopicId: String(entry?.sourceTopicId || question?.sourceTopicId || "").trim(),
    sourceTopicName: String(entry?.sourceTopicName || question?.sourceTopicName || "").trim(),
    lastUserAnswerIndex,
    lastOutcome,
    question: { ...question },
  };
}

function normalizeRetryQueue(queue) {
  const items = Array.isArray(queue) ? queue : [];
  const byId = new Map();
  items.forEach((entry) => {
    const normalized = normalizeRetryQueueEntry(entry);
    if (!normalized) return;
    const previous = byId.get(normalized.id);
    if (!previous) {
      byId.set(normalized.id, normalized);
      return;
    }
    const previousMs = Date.parse(previous.updatedAt || "") || 0;
    const nextMs = Date.parse(normalized.updatedAt || "") || 0;
    if (nextMs >= previousMs) {
      byId.set(normalized.id, normalized);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => {
      const aMs = Date.parse(a.updatedAt || "") || 0;
      const bMs = Date.parse(b.updatedAt || "") || 0;
      if (aMs !== bMs) return bMs - aMs;
      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .slice(0, RETRY_MISSED_MAX_ITEMS);
}

function mergeRetryQueues(localQueue, cloudQueue) {
  return normalizeRetryQueue([...(Array.isArray(localQueue) ? localQueue : []), ...(Array.isArray(cloudQueue) ? cloudQueue : [])]);
}

function areRetryQueuesEqual(a, b) {
  return JSON.stringify(normalizeRetryQueue(a)) === JSON.stringify(normalizeRetryQueue(b));
}

function readRetryMissedQueue() {
  const storageKey = getRetryMissedStorageKeyForCurrentUser();
  if (!storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeRetryQueue(parsed);
  } catch (error) {
    return [];
  }
}

function saveRetryMissedQueue(queue) {
  const storageKey = getRetryMissedStorageKeyForCurrentUser();
  if (!storageKey) return;
  const normalized = normalizeRetryQueue(queue);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Unable to persist retry queue", error);
  }
}

function getSpacedPracticeStorageKeyForCurrentUser() {
  const user = getCurrentUser();
  const userId = String(user?.id || "").trim();
  return userId ? `${SPACED_PRACTICE_STORAGE_PREFIX}${userId}` : "";
}

function normalizeSpacedPracticeEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry?.id || "").trim();
  const sourceTopicId = String(entry?.sourceTopicId || "").trim();
  const questionId = String(entry?.questionId || "").trim();
  const fingerprint = String(entry?.fingerprint || "").trim();
  if (!id || !sourceTopicId || (!questionId && !fingerprint)) return null;

  const dueAtRaw = String(entry?.dueAt || "").trim();
  const dueAt = Number.isNaN(Date.parse(dueAtRaw))
    ? new Date().toISOString()
    : new Date(dueAtRaw).toISOString();

  const reviewedAtRaw = String(entry?.lastReviewedAt || "").trim();
  const lastReviewedAt = Number.isNaN(Date.parse(reviewedAtRaw))
    ? ""
    : new Date(reviewedAtRaw).toISOString();

  return {
    id,
    sourceTopicId,
    sourceTopicName: String(entry?.sourceTopicName || "").trim(),
    questionId,
    fingerprint,
    dueAt,
    intervalDays: Math.max(1, Math.floor(clampNumber(entry?.intervalDays, { min: 1, max: 365, fallback: 1 }))),
    easeFactor: clampNumber(entry?.easeFactor, {
      min: SPACED_PRACTICE_MIN_EASE,
      max: SPACED_PRACTICE_MAX_EASE,
      fallback: SPACED_PRACTICE_DEFAULT_EASE,
    }),
    repetitions: Math.max(0, Math.floor(clampNumber(entry?.repetitions, { min: 0, max: 50, fallback: 0 }))),
    reviewCount: Math.max(0, Math.floor(clampNumber(entry?.reviewCount, { min: 0, max: 5000, fallback: 0 }))),
    lapses: Math.max(0, Math.floor(clampNumber(entry?.lapses, { min: 0, max: 5000, fallback: 0 }))),
    lastResult: String(entry?.lastResult || "").trim().toLowerCase() === "correct" ? "correct" : "incorrect",
    lastReviewedAt,
  };
}

function normalizeSpacedPracticeQueue(queue) {
  const items = Array.isArray(queue) ? queue : [];
  const byId = new Map();
  items.forEach((entry) => {
    const normalized = normalizeSpacedPracticeEntry(entry);
    if (!normalized) return;
    const previous = byId.get(normalized.id);
    if (!previous) {
      byId.set(normalized.id, normalized);
      return;
    }
    const previousMs = Date.parse(previous.lastReviewedAt || previous.dueAt || "") || 0;
    const nextMs = Date.parse(normalized.lastReviewedAt || normalized.dueAt || "") || 0;
    if (nextMs >= previousMs) {
      byId.set(normalized.id, normalized);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => {
      const aMs = Date.parse(a.dueAt || "") || 0;
      const bMs = Date.parse(b.dueAt || "") || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .slice(0, SPACED_PRACTICE_MAX_ITEMS);
}

function mergeSpacedPracticeQueues(localQueue, cloudQueue) {
  return normalizeSpacedPracticeQueue([
    ...(Array.isArray(localQueue) ? localQueue : []),
    ...(Array.isArray(cloudQueue) ? cloudQueue : []),
  ]);
}

function areSpacedPracticeQueuesEqual(a, b) {
  return JSON.stringify(normalizeSpacedPracticeQueue(a)) === JSON.stringify(normalizeSpacedPracticeQueue(b));
}

function readSpacedPracticeQueue() {
  const storageKey = getSpacedPracticeStorageKeyForCurrentUser();
  if (!storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeSpacedPracticeQueue(parsed);
  } catch (error) {
    return [];
  }
}

function saveSpacedPracticeQueue(queue) {
  const storageKey = getSpacedPracticeStorageKeyForCurrentUser();
  if (!storageKey) return;
  const normalized = normalizeSpacedPracticeQueue(queue);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Unable to persist spaced-practice queue", error);
  }
}
export async function syncProgressFromCloudNow({ force = false } = {}) {

  if (!isCloudProgressSyncReady()) {
    setCloudProgressSyncStatus({
      inFlight: false,
      synced: false,
      lastReason: "disabled-or-no-user",
    });
    return { synced: false, reason: "disabled-or-no-user" };
  }

  const now = Date.now();
  if (!force && now - lastCloudProgressSyncMs < CLOUD_PROGRESS_SYNC_MIN_INTERVAL_MS) {
    setCloudProgressSyncStatus({
      inFlight: false,
      lastReason: "throttled",
    });
    return { synced: false, reason: "throttled" };
  }

  if (cloudProgressSyncInFlight) {
    return cloudProgressSyncInFlight;
  }

  setCloudProgressSyncStatus({
    inFlight: true,
    synced: false,
    lastAttemptAt: new Date().toISOString(),
    lastReason: "in-progress",
  });

  cloudProgressSyncInFlight = (async () => {
    const localSummary = readProgressSummary();
    const localRetryQueue = readRetryMissedQueue();
    const localSpacedQueue = readSpacedPracticeQueue();

    let cloudPayload;
    try {
      cloudPayload = await readCloudProgressSummary();
    } catch (error) {
      const warning = error?.message || "Unable to fetch cloud progress.";
      setCloudProgressSyncStatus({
        inFlight: false,
        synced: false,
        lastError: warning,
        lastReason: "cloud-read-failed",
      });
      return {
        synced: false,
        reason: "cloud-read-failed",
        warning,
      };
    }

    const cloudSummary = normalizeProgressSummary(cloudPayload?.summary || { attempts: [] });
    const mergedSummary = mergeProgressSummaries(localSummary, cloudSummary);
    const cloudRetryQueue = normalizeRetryQueue(cloudPayload?.retryQueue || []);
    const mergedRetryQueue = mergeRetryQueues(localRetryQueue, cloudRetryQueue);
    const cloudSpacedQueue = normalizeSpacedPracticeQueue(cloudPayload?.spacedQueue || []);
    const mergedSpacedQueue = mergeSpacedPracticeQueues(localSpacedQueue, cloudSpacedQueue);
    const localChanged = !areProgressSummariesEqual(localSummary, mergedSummary);
    const localRetryQueueChanged = !areRetryQueuesEqual(localRetryQueue, mergedRetryQueue);
    const localSpacedQueueChanged = !areSpacedPracticeQueuesEqual(localSpacedQueue, mergedSpacedQueue);

    if (localChanged) {
      saveProgressSummary(mergedSummary);
    }
    if (localRetryQueueChanged) {
      saveRetryMissedQueue(mergedRetryQueue);
    }
    if (localSpacedQueueChanged) {
      saveSpacedPracticeQueue(mergedSpacedQueue);
    }

    const shouldPush =
      !cloudPayload?.exists ||
      !areProgressSummariesEqual(cloudSummary, mergedSummary) ||
      !areRetryQueuesEqual(cloudRetryQueue, mergedRetryQueue) ||
      !areSpacedPracticeQueuesEqual(cloudSpacedQueue, mergedSpacedQueue);
    if (shouldPush) {
      try {
        await writeCloudProgressSummary(mergedSummary, {
          deviceId: getProgressSyncDeviceId(),
          retryQueue: mergedRetryQueue,
          spacedQueue: mergedSpacedQueue,
        });
      } catch (error) {
        const warning = error?.message || "Unable to save progress to cloud.";
        setCloudProgressSyncStatus({
          inFlight: false,
          synced: false,
          lastError: warning,
          lastReason: "cloud-write-failed",
        });
        return {
          synced: false,
          reason: "cloud-write-failed",
          warning,
        };
      }
    }

    lastCloudProgressSyncMs = Date.now();
    setCloudProgressSyncStatus({
      inFlight: false,
      synced: true,
      lastSuccessAt: new Date().toISOString(),
      lastError: "",
      lastReason: "success",
    });
    return {
      synced: true,
      pulled: Boolean(cloudPayload?.exists),
      pushed: shouldPush,
      attempts: mergedSummary.attempts.length,
      retryQueueSize: mergedRetryQueue.length,
      spacedQueueSize: mergedSpacedQueue.length,
      spacedDueCount: mergedSpacedQueue.filter((entry) => (Date.parse(entry?.dueAt || "") || 0) <= Date.now()).length,
    };
  })();

  try {
    return await cloudProgressSyncInFlight;
  } catch (error) {
    setCloudProgressSyncStatus({
      inFlight: false,
      synced: false,
      lastError: error?.message || "Unexpected sync failure.",
      lastReason: "unexpected-error",
    });
    throw error;
  } finally {
    cloudProgressSyncInFlight = null;
  }
}

function queueCloudProgressSync(reason = "") {
  if (!isCloudProgressSyncReady()) return;
  syncProgressFromCloudNow().catch((error) => {
    console.warn(`Cloud progress sync failed (${reason || "background"}):`, error);
  });
}
function normalizeQuestionFingerprint(question = {}) {
  const byId = String(question?.id || "").trim();
  if (byId) return `id:${byId}`;
  const byText = String(question?.question || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return byText ? `text:${byText}` : "";
}

function toRetryQueueEntry(question, userAnswer = undefined) {
  const fingerprint = normalizeQuestionFingerprint(question);
  if (!fingerprint) return null;
  const parsedAnswerIndex = Number(userAnswer);
  const lastUserAnswerIndex = Number.isInteger(parsedAnswerIndex) && parsedAnswerIndex >= 0
    ? parsedAnswerIndex
    : null;
  return {
    id: fingerprint,
    updatedAt: new Date().toISOString(),
    sourceTopicId: String(question?.sourceTopicId || currentTopic?.id || ""),
    sourceTopicName: String(question?.sourceTopicName || currentTopic?.name || ""),
    lastUserAnswerIndex,
    lastOutcome: lastUserAnswerIndex === null ? "unanswered" : "incorrect",
    question: { ...question },
  };
}

function buildSpacedPracticeEntryId(question, sourceTopicId = "") {
  const topicId = String(sourceTopicId || "").trim();
  const fingerprint = normalizeQuestionFingerprint(question);
  if (!topicId || !fingerprint) return "";
  return `${topicId}|${fingerprint}`;
}

function createSpacedPracticeSeedEntry(question) {
  const sourceTopicId = String(question?.sourceTopicId || currentTopic?.id || "").trim();
  const sourceTopicName = String(question?.sourceTopicName || currentTopic?.name || "").trim();
  const fingerprint = normalizeQuestionFingerprint(question);
  const id = buildSpacedPracticeEntryId(question, sourceTopicId);
  if (!id || !sourceTopicId || !fingerprint) return null;

  return {
    id,
    sourceTopicId,
    sourceTopicName,
    questionId: String(question?.id || "").trim(),
    fingerprint,
  };
}

function scheduleSpacedPracticeEntry(previousEntry, isCorrect, seedEntry) {
  const normalizedSeed = seedEntry && typeof seedEntry === "object" ? seedEntry : null;
  if (!normalizedSeed?.id || !normalizedSeed?.sourceTopicId) return null;

  const previous = normalizeSpacedPracticeEntry(previousEntry || {}) || {
    id: normalizedSeed.id,
    sourceTopicId: normalizedSeed.sourceTopicId,
    sourceTopicName: normalizedSeed.sourceTopicName,
    questionId: normalizedSeed.questionId,
    fingerprint: normalizedSeed.fingerprint,
    dueAt: new Date().toISOString(),
    intervalDays: 1,
    easeFactor: SPACED_PRACTICE_DEFAULT_EASE,
    repetitions: 0,
    reviewCount: 0,
    lapses: 0,
    lastResult: "incorrect",
    lastReviewedAt: "",
  };

  let repetitions = Number(previous.repetitions || 0);
  let intervalDays = Math.max(1, Number(previous.intervalDays || 1));
  let easeFactor = clampNumber(previous.easeFactor, {
    min: SPACED_PRACTICE_MIN_EASE,
    max: SPACED_PRACTICE_MAX_EASE,
    fallback: SPACED_PRACTICE_DEFAULT_EASE,
  });
  let lapses = Math.max(0, Number(previous.lapses || 0));

  const quality = isCorrect ? 4 : 2;
  easeFactor = clampNumber(
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    { min: SPACED_PRACTICE_MIN_EASE, max: SPACED_PRACTICE_MAX_EASE, fallback: SPACED_PRACTICE_DEFAULT_EASE },
  );

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    if (repetitions <= 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
  }

  const reviewedAtIso = new Date().toISOString();
  const dueAtIso = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

  return normalizeSpacedPracticeEntry({
    id: normalizedSeed.id,
    sourceTopicId: normalizedSeed.sourceTopicId,
    sourceTopicName: normalizedSeed.sourceTopicName,
    questionId: normalizedSeed.questionId,
    fingerprint: normalizedSeed.fingerprint,
    dueAt: dueAtIso,
    intervalDays,
    easeFactor,
    repetitions,
    reviewCount: Math.max(0, Number(previous.reviewCount || 0)) + 1,
    lapses,
    lastResult: isCorrect ? "correct" : "incorrect",
    lastReviewedAt: reviewedAtIso,
  });
}

function syncSpacedPracticeQueueFromSession() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  if (!Array.isArray(quizState.allQuestions) || !quizState.allQuestions.length) return;

  const queueMap = new Map(
    readSpacedPracticeQueue()
      .filter((entry) => entry && typeof entry === "object" && entry.id)
      .map((entry) => [String(entry.id), entry]),
  );

  quizState.allQuestions.forEach((question, index) => {
    const seed = createSpacedPracticeSeedEntry(question);
    if (!seed) return;

    const userAnswer = quizState.userAnswers[index];
    const isCorrect = userAnswer === question?.correct;
    const existing = queueMap.get(seed.id);

    if (!existing && isCorrect) {
      return;
    }

    const next = scheduleSpacedPracticeEntry(existing, isCorrect, seed);
    if (!next) return;

    if (
      isCorrect &&
      next.repetitions >= SPACED_PRACTICE_MASTERY_REPETITIONS &&
      next.intervalDays >= SPACED_PRACTICE_MASTERY_INTERVAL_DAYS
    ) {
      queueMap.delete(seed.id);
      return;
    }

    queueMap.set(seed.id, next);
  });

  const nextQueue = Array.from(queueMap.values())
    .sort((a, b) => {
      const aMs = Date.parse(a?.dueAt || "") || 0;
      const bMs = Date.parse(b?.dueAt || "") || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    })
    .slice(0, SPACED_PRACTICE_MAX_ITEMS);

  saveSpacedPracticeQueue(nextQueue);
  queueCloudProgressSync("spaced-queue-updated");
}

function getSpacedPracticeQueueSnapshot(nowMs = Date.now()) {
  const queue = readSpacedPracticeQueue();
  const due = queue.filter((entry) => (Date.parse(entry?.dueAt || "") || 0) <= nowMs);
  const nextDueEntry = queue
    .filter((entry) => (Date.parse(entry?.dueAt || "") || 0) > nowMs)
    .sort((a, b) => (Date.parse(a?.dueAt || "") || 0) - (Date.parse(b?.dueAt || "") || 0))[0] || null;

  return {
    total: queue.length,
    dueCount: due.length,
    nextDueAt: String(nextDueEntry?.dueAt || ""),
    dueEntries: due,
  };
}

export function getSpacedPracticeDueCount() {
  return getSpacedPracticeQueueSnapshot().dueCount;
}

export function getSpacedPracticeQueueStatus() {
  const snapshot = getSpacedPracticeQueueSnapshot();
  return {
    total: snapshot.total,
    dueCount: snapshot.dueCount,
    nextDueAt: snapshot.nextDueAt,
  };
}

async function resolveSpacedPracticeQuestions(entries, limit) {
  const selectedEntries = Array.isArray(entries) ? entries : [];
  if (!selectedEntries.length) return [];

  const topicMap = new Map((Array.isArray(getTopics()) ? getTopics() : []).map((topic) => [String(topic?.id || ""), topic]));
  const grouped = new Map();
  selectedEntries.forEach((entry) => {
    const topicId = String(entry?.sourceTopicId || "").trim();
    if (!topicId) return;
    if (!grouped.has(topicId)) grouped.set(topicId, []);
    grouped.get(topicId).push(entry);
  });

  const resolvedByEntryId = new Map();

  for (const [topicId, topicEntries] of grouped.entries()) {
    if (resolvedByEntryId.size >= limit) break;
    const topic = topicMap.get(topicId);
    if (!topic?.file) continue;

    let topicDataFiles = [];
    try {
      topicDataFiles = await fetchTopicDataFiles(topic, { tolerateFailures: true });
    } catch (error) {
      topicDataFiles = [];
    }
    if (!topicDataFiles.length) continue;

    const questionById = new Map();
    const questionByFingerprint = new Map();

    topicDataFiles.forEach((topicData) => {
      extractQuestionsByCategory(topicData, "all", {}).forEach((question) => {
        const questionId = String(question?.id || "").trim();
        if (questionId && !questionById.has(questionId)) {
          questionById.set(questionId, question);
        }
        const fingerprint = normalizeQuestionFingerprint(question);
        if (fingerprint && !questionByFingerprint.has(fingerprint)) {
          questionByFingerprint.set(fingerprint, question);
        }
      });
    });

    topicEntries.forEach((entry) => {
      if (resolvedByEntryId.size >= limit) return;
      let question = null;
      const questionId = String(entry?.questionId || "").trim();
      if (questionId && questionById.has(questionId)) {
        question = questionById.get(questionId);
      }
      if (!question) {
        const fingerprint = String(entry?.fingerprint || "").trim();
        if (fingerprint && questionByFingerprint.has(fingerprint)) {
          question = questionByFingerprint.get(fingerprint);
        }
      }
      if (!question) return;

      resolvedByEntryId.set(entry.id, {
        ...question,
        sourceTopicId: String(entry.sourceTopicId || topic.id || ""),
        sourceTopicName: String(entry.sourceTopicName || topic.name || ""),
      });
    });
  }

  const ordered = [];
  for (const entry of selectedEntries) {
    if (ordered.length >= limit) break;
    const question = resolvedByEntryId.get(String(entry?.id || ""));
    if (question) {
      ordered.push(question);
    }
  }
  return ordered;
}

export async function getSpacedPracticeQuestions(limit = SPACED_PRACTICE_DEFAULT_SESSION_SIZE) {
  const max = Number(limit);
  const normalizedLimit = Number.isFinite(max) && max > 0
    ? Math.floor(max)
    : SPACED_PRACTICE_DEFAULT_SESSION_SIZE;

  const snapshot = getSpacedPracticeQueueSnapshot();
  if (!snapshot.dueEntries.length) return [];

  const candidateEntries = snapshot.dueEntries
    .sort((a, b) => {
      const aMs = Date.parse(a?.dueAt || "") || 0;
      const bMs = Date.parse(b?.dueAt || "") || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    })
    .slice(0, normalizedLimit * 3);

  return resolveSpacedPracticeQuestions(candidateEntries, normalizedLimit);
}

function syncRetryMissedQueueFromSession() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  if (!Array.isArray(quizState.allQuestions) || !quizState.allQuestions.length) return;

  const queueMap = new Map(
    readRetryMissedQueue()
      .filter((entry) => entry && typeof entry === "object" && entry.id && entry.question)
      .map((entry) => [String(entry.id), entry]),
  );

  quizState.allQuestions.forEach((question, index) => {
    const userAnswer = quizState.userAnswers[index];
    const entry = toRetryQueueEntry(question, userAnswer);
    if (!entry) return;
    const isMissed = userAnswer !== question?.correct;
    if (isMissed) {
      queueMap.set(entry.id, entry);
      return;
    }
    queueMap.delete(entry.id);
  });

  const nextQueue = Array.from(queueMap.values())
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, RETRY_MISSED_MAX_ITEMS);
  saveRetryMissedQueue(nextQueue);
  queueCloudProgressSync("retry-queue-updated");
}

export function getRetryMissedQueueCount() {
  return readRetryMissedQueue().length;
}

export function getRetryMissedQuestions(limit = RETRY_MISSED_DEFAULT_SESSION_SIZE) {
  const max = Number(limit);
  const normalizedLimit = Number.isFinite(max) && max > 0 ? Math.floor(max) : RETRY_MISSED_DEFAULT_SESSION_SIZE;
  return readRetryMissedQueue()
    .filter((entry) => entry?.question && typeof entry.question === "object")
    .slice(0, normalizedLimit)
    .map((entry) => ({
      ...entry.question,
      sourceTopicId: String(entry.sourceTopicId || entry.question?.sourceTopicId || ""),
      sourceTopicName: String(entry.sourceTopicName || entry.question?.sourceTopicName || ""),
    }));
}

export function getRetryMissedQueueSnapshot(limit = RETRY_MISSED_MAX_ITEMS) {
  const max = Number(limit);
  const normalizedLimit = Number.isFinite(max) && max > 0 ? Math.floor(max) : RETRY_MISSED_MAX_ITEMS;
  return readRetryMissedQueue()
    .slice(0, normalizedLimit)
    .map((entry) => ({
      id: String(entry?.id || "").trim(),
      updatedAt: String(entry?.updatedAt || "").trim(),
      sourceTopicId: String(entry?.sourceTopicId || entry?.question?.sourceTopicId || "").trim(),
      sourceTopicName: String(entry?.sourceTopicName || entry?.question?.sourceTopicName || "").trim(),
      lastUserAnswerIndex: Number.isInteger(entry?.lastUserAnswerIndex) ? entry.lastUserAnswerIndex : null,
      lastOutcome: String(entry?.lastOutcome || "incorrect").trim().toLowerCase() === "unanswered"
        ? "unanswered"
        : "incorrect",
      question: entry?.question && typeof entry.question === "object" ? { ...entry.question } : null,
    }))
    .filter((entry) => entry.id && entry.question);
}

export function dismissRetryMissedQuestion(entryId) {
  const normalizedId = String(entryId || "").trim();
  if (!normalizedId) return false;
  const currentQueue = readRetryMissedQueue();
  const nextQueue = currentQueue.filter((entry) => String(entry?.id || "").trim() !== normalizedId);
  if (nextQueue.length === currentQueue.length) return false;
  saveRetryMissedQueue(nextQueue);
  queueCloudProgressSync("retry-queue-dismissed");
  return true;
}

function recordAttemptResult({
  topicId,
  topicName,
  mode,
  scorePercentage,
  totalQuestions,
  templateId = "",
  templateName = "",
  glBand = "",
  timeTakenSec = null,
  correctCount = 0,
  wrongCount = 0,
  unansweredCount = 0,
  subcategoryBreakdown = [],
  difficultyBreakdown = [],
  sourceTopicBreakdown = [],
}) {
  const user = getCurrentUser();
  if (!user) return { summary: { attempts: [] }, attempt: null };
  const summary = readProgressSummary();
  const createdAt = new Date().toISOString();
  const attempt = {
    attemptId: createProgressAttemptId(createdAt),
    topicId,
    topicName,
    mode,
    scorePercentage,
    totalQuestions,
    createdAt,
    deviceId: getProgressSyncDeviceId(),
    templateId,
    templateName,
    glBand,
    timeTakenSec,
    correctCount,
    wrongCount,
    unansweredCount,
    subcategoryBreakdown,
    difficultyBreakdown,
    sourceTopicBreakdown,
  };
  summary.attempts.push(attempt);
  const normalized = normalizeProgressSummary(summary);
  saveProgressSummary(normalized);
  queueCloudProgressSync("attempt-recorded");
  return {
    summary: normalized,
    attempt: normalized.attempts.find((entry) => entry.attemptId === attempt.attemptId) || null,
  };
}

function calculateProgressInsights(summary, currentTopicId) {
  const attempts = summary?.attempts || [];
  const recent = attempts.slice(-5);

  const avgRecentScore = recent.length
    ? Math.round(recent.reduce((acc, a) => acc + (a.scorePercentage || 0), 0) / recent.length)
    : null;

  const byTopic = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.topicId) return;
    if (!byTopic.has(attempt.topicId)) {
      byTopic.set(attempt.topicId, {
        topicId: attempt.topicId,
        topicName: attempt.topicName || attempt.topicId,
        scores: [],
      });
    }
    byTopic.get(attempt.topicId).scores.push(attempt.scorePercentage || 0);
  });

  const topicAverages = Array.from(byTopic.values()).map((entry) => ({
    topicId: entry.topicId,
    topicName: entry.topicName,
    avgScore: Math.round(entry.scores.reduce((acc, score) => acc + score, 0) / entry.scores.length),
  }));

  const sortedByScore = [...topicAverages].sort((a, b) => a.avgScore - b.avgScore);
  const weakestTopic = sortedByScore.length ? sortedByScore[0] : null;
  const strongestTopic = sortedByScore.length
    ? sortedByScore[sortedByScore.length - 1]
    : null;

  const recommendedTopic = weakestTopic && weakestTopic.topicId !== currentTopicId
    ? weakestTopic.topicName
    : null;

  return {
    attemptsCount: attempts.length,
    avgRecentScore,
    strongestTopic,
    weakestTopic,
    recommendedTopic,
  };
}

const domElements = {
  questionElement: null,
  optionsContainer: null,
  submitButton: null,
  nextButton: null,
  prevButton: null,
  progressBar: null,
  questionCounter: null,
  timerDisplay: null,
  finalScore: null,
  performanceText: null,
};

/**
 * Get DOM elements when needed
 */
function getDOMElements() {
  domElements.questionElement = document.getElementById("questionText");
  domElements.optionsContainer = document.getElementById("optionsContainer");
  domElements.submitButton = document.getElementById("submitBtn");
  domElements.nextButton = document.getElementById("nextBtn");
  domElements.prevButton = document.getElementById("prevBtn");
  domElements.progressBar = document.getElementById("progressFill");
  domElements.questionCounter = document.getElementById("currentQ");
  domElements.timerDisplay = document.getElementById("timeLeft");
  domElements.finalScore = document.getElementById("finalScore");
  domElements.performanceText = document.getElementById("performanceText");
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Start the quiz timer
 */
function startTimer() {
  updateTimerDisplay();
  quizState.timer = setInterval(() => {
    if (currentMode === "practice") {
      quizState.timeLeft++;
      updateTimerDisplay();
      return;
    }

    quizState.timeLeft--;
    updateTimerDisplay();

    if (quizState.timeLeft <= 0) {
      quizState.timeLeft = 0;
      updateTimerDisplay();
      clearInterval(quizState.timer);
      // Auto-submit exam when time runs out
      if (currentMode === "exam") {
        debugLog("Exam time expired - auto-submitting");
        // Calculate score for answered questions
        calculateExamScore();
      }
      showResults();
    }
  }, 1000);
}

/**
 * Show time warning based on remaining time
 * @param {string} message - Warning message to display
 */
function showTimeWarning(message) {
  const timerContainer = document.getElementById("timerDisplay");

  if (timerContainer) {
    // Remove all timer classes first
    timerContainer.classList.remove("warning", "critical", "urgent");

    // Add different classes based on time remaining
    if (quizState.timeLeft <= 60) {
      // Last minute - critical state
      timerContainer.classList.add("critical", "urgent");
    } else if (quizState.timeLeft <= 120) {
      // Last 2 minutes - warning state
      timerContainer.classList.add("warning");
    }
  }
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function updatePracticePacingNotice() {
  const notice = document.getElementById("practicePacingNotice");
  const timerContainer = document.getElementById("timerDisplay");
  if (!notice || !timerContainer) return;

  if (currentMode !== "practice") {
    notice.classList.add("hidden");
    notice.textContent = "";
    timerContainer.classList.remove("warning", "critical", "urgent");
    return;
  }

  const examEquivalentSeconds = getConfiguredExamTimeLimitSeconds(currentTopic, quizState.allQuestions?.length || 0);
  if (!examEquivalentSeconds || quizState.timeLeft <= examEquivalentSeconds) {
    notice.classList.add("hidden");
    notice.textContent = "";
    timerContainer.classList.remove("warning", "critical", "urgent");
    return;
  }

  const overrun = quizState.timeLeft - examEquivalentSeconds;
  notice.textContent = `You are ${formatDuration(overrun)} beyond exam pace. Keep going and speed up your decision time.`;
  notice.classList.remove("hidden");
  timerContainer.classList.add("warning");
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
  const timeLeftElement = document.getElementById("timeLeft");
  if (!timeLeftElement) return;

  const timeLeft = quizState.timeLeft;
  timeLeftElement.textContent = formatDuration(timeLeft);

  if (currentMode !== "exam") {
    updatePracticePacingNotice();
    return;
  }

  // Check if we need to show time warnings or reset to normal state
  if (timeLeft <= EXAM_CRITICAL_THRESHOLD_SEC && timeLeft > 0) {
    // Last 10 seconds
    showTimeWarning(`${timeLeft} seconds remaining!`);
  } else if (EXAM_WARNING_MESSAGES[timeLeft]) {
    showTimeWarning(EXAM_WARNING_MESSAGES[timeLeft]);
  } else if (timeLeft > EXAM_WARNING_RESET_THRESHOLD_SEC) {
    // If we have more than 2 minutes left, ensure normal state
    const timerContainer = document.getElementById("timerDisplay");
    if (timerContainer) {
      timerContainer.classList.remove("warning", "critical", "urgent");
    }
  }
}

/**
 * Show the current question
 */
function showQuestion() {
  debugLog(
    "showQuestion called, index:",
    quizState.currentQuestionIndex,
    "of",
    quizState.allQuestions.length,
  );
  if (quizState.currentQuestionIndex >= quizState.allQuestions.length) {
    showResults();
    return;
  }
  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  debugLog("Current question:", question);
  
  // Query DOM elements here to ensure they exist
  const questionElement = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");
  const quizScreen = document.getElementById("quizScreen");
  debugLog("showQuestion DOM check:", {
    questionElement,
    optionsContainer,
    quizScreen,
  });
  if (!questionElement || !optionsContainer || !quizScreen) {
    console.error("Quiz screen or question elements not found in DOM.");
    showError(
      "Quiz screen or question elements not found. Please check your HTML IDs.",
    );
    return;
  }
  
  // Make sure quiz screen is visible
  quizScreen.classList.remove("hidden");
  quizScreen.classList.add("active");
  
  questionElement.innerHTML = `
    <div class="question-number-container">
      <span class="question-number">${quizState.currentQuestionIndex + 1}</span>
    </div>
    <div class="question-text-container">
      ${parseMarkdown(question.question)}
    </div>
  `;

  // Clear previous options
  optionsContainer.innerHTML = "";

  // Handle explanation visibility based on mode
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    const feedbackVisible = Boolean(
      quizState.feedbackShown[quizState.currentQuestionIndex],
    );
    // Hide explanation container in exam mode
    if (currentMode === "exam") {
      explanationDiv.classList.remove("show");
      explanationDiv.style.display = "none";
    } else if (currentMode === "practice" && !feedbackVisible) {
      // Keep practice rationale hidden until user explicitly submits.
      explanationDiv.innerHTML = "";
      explanationDiv.classList.remove("show");
      explanationDiv.style.display = "none";
    } else {
      explanationDiv.style.display = "block";
    }
  }

        // Add new options
    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerHTML = `
                  <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                  <div class="option-text">${parseMarkdown(option)}</div>
              `;
  
        // Different behavior based on mode
        if (currentMode === "review") {
          button.disabled = true;
          const originalQuestionIndex = quizState.originalQuestions.indexOf(question);

          if (reviewContext === "study") {
            // Pre-quiz review: always reveal the correct answer and explanation.
            if (index === question.correct) {
              button.classList.add("correct");
            }
          } else if (quizState.userAnswers[originalQuestionIndex] !== undefined) {
            // Post-quiz review: show user's answer state for the completed session.
            if (quizState.userAnswers[originalQuestionIndex] === index) {
              button.classList.add("selected");
              if (index !== question.correct) {
                button.classList.add("user-incorrect");
              }
            }
            if (index === question.correct) {
              button.classList.add("correct");
            }
          }
        } else if (currentMode === "exam") {
          // In exam mode, options are not disabled until selected
          // Once an option is selected, it stays selected and disabled
          button.onclick = () => selectOption(index);
        } else {
          // Practice mode
          button.onclick = () => selectOption(index);
        }
  
        // If user already answered this question, show their answer
        const originalQuestionIndex = quizState.originalQuestions.indexOf(question);
        if (quizState.userAnswers[originalQuestionIndex] !== undefined) {
          if (quizState.userAnswers[originalQuestionIndex] === index) {
            button.classList.add("selected");
          }
  
          // In practice mode, show feedback only after submit.
          // In review mode, always show answer state.
          // In exam mode, don't show feedback until exam is completed to maintain exam integrity
          const feedbackVisible =
            currentMode === "review" ||
            (currentMode === "practice" &&
              Boolean(quizState.feedbackShown[originalQuestionIndex]));
          if (feedbackVisible) {
            if (index === question.correct) {
              button.classList.add("correct");
            } else if (
              quizState.userAnswers[originalQuestionIndex] === index &&
              index !== question.correct
            ) {
              button.classList.add("incorrect");
            }
          }
        }
  
        optionsContainer.appendChild(button);
      });
    refreshOptionFeedbackLabels();
    // In practice mode, if feedback has already been shown for this question, display it and update navigation
    if (currentMode === "practice" && quizState.feedbackShown[quizState.currentQuestionIndex]) {
      setTimeout(() => {
        showExplanation();
        const explanationDiv = document.getElementById("explanation");
        if (explanationDiv) {
          explanationDiv.classList.add("show");
          explanationDiv.style.display = "block";
        }
        // Update navigation to show Next button since feedback was already shown
        updateNavigation();
      }, 100);
    }

    if (currentMode === "review") {
      showExplanation();
      const reviewExplanationDiv = document.getElementById("explanation");
      if (reviewExplanationDiv) {
        reviewExplanationDiv.classList.add("show");
        reviewExplanationDiv.style.display = "block";
      }
    }
  } else {
    optionsContainer.innerHTML =
      '<div class="error-message">No options found for this question.</div>';
  }

  // Update navigation and progress
  updateNavigation();
  updateProgress();
  if (currentMode !== "review" || reviewContext === "study") {
    showQuestionMap();
  }
}

/**
 * Handle option selection
 * @param {number} selectedIndex - Index of selected option
 */
function selectOption(selectedIndex) {
  const question = quizState.allQuestions[quizState.currentQuestionIndex];

  // For exam mode: record answer but don't show feedback immediately
  if (currentMode === "exam") {
    quizState.userAnswers[quizState.currentQuestionIndex] = selectedIndex;

    const options = document.querySelectorAll(".option-btn");
    options.forEach((option, index) => {
      option.classList.remove("selected");
      if (index === selectedIndex) {
        option.classList.add("selected");
      }
    });

    // Enable next button
    domElements.nextButton.disabled = false;
    updateNavigation();

    // Update progress bar to reflect answered question
    updateProgress();

    // Don't show explanation in exam mode
    const explanationDiv = document.getElementById("explanation");
    if (explanationDiv) {
      explanationDiv.classList.remove("show");
    }
    persistQuizRuntime();
    return;
  }

  // For practice and review modes: show immediate feedback
  // Store the selected answer but don't increment score (score calculated at end)
  quizState.userAnswers[quizState.currentQuestionIndex] = selectedIndex;

  // Query DOM elements inside function
  const optionsContainer = document.getElementById("optionsContainer");
  if (!optionsContainer) return;

  // Update UI
  const options = document.querySelectorAll(".option-btn");
  options.forEach((option, index) => {
    // Don't disable options in practice mode to allow changing answers
    option.classList.remove("selected", "correct", "incorrect");
    clearOptionFeedbackLabel(option);

    if (index === selectedIndex) {
      option.classList.add("selected");
      // Don't show correct/incorrect in practice mode to allow experimentation
    }
  });

  // Update navigation to handle button state
  updateNavigation();

  // Update progress bar to reflect answered question
  updateProgress();
  showQuestionMap();
  persistQuizRuntime();
}

/**
 * Update navigation buttons based on current state and mode
 */
function updateNavigation() {
  const submitButton = domElements.submitButton;
  const nextButton = domElements.nextButton;
  const prevButton = domElements.prevButton;
  const endExamButton = document.getElementById("endExamBtn");
  if (!submitButton || !nextButton || !prevButton) return;

  if (endExamButton) {
    const canEndExam = currentMode === "exam";
    endExamButton.classList.toggle("hidden", !canEndExam);
    endExamButton.disabled = !canEndExam;
    endExamButton.onclick = () => {
      if (!endExamButton.disabled) confirmEndExam();
    };
  }

  // Previous button
  prevButton.disabled = quizState.currentQuestionIndex === 0;
  prevButton.setAttribute("aria-disabled", prevButton.disabled);
  prevButton.title = prevButton.disabled
    ? "No previous question"
    : "Go to previous question";
  prevButton.textContent = "Previous";

  if (currentMode === "review") {
    // In review mode, next button is always enabled (study/session).
    nextButton.disabled = false;
    submitButton.style.display = "none";
    nextButton.style.display = "inline-flex";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
    prevButton.onclick = () => {
      if (!prevButton.disabled) previousQuestion();
    };
  } else if (currentMode === "exam") {
    // In exam mode, allow answer revision before final exam submission.
    prevButton.disabled = quizState.currentQuestionIndex === 0;
    prevButton.setAttribute("aria-disabled", prevButton.disabled);
    prevButton.title = prevButton.disabled
      ? "No previous question"
      : "Go to previous question";

    // Enable next button once an answer is selected
    nextButton.disabled = quizState.userAnswers[quizState.currentQuestionIndex] === undefined;
    submitButton.style.display = "none";
    nextButton.style.display = "inline-flex";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
  } else {
    // In practice mode, handle Submit/Next button visibility
    if (quizState.userAnswers[quizState.currentQuestionIndex] === undefined) {
      // No answer selected yet - show Next button (disabled)
      submitButton.style.display = "none";
      nextButton.style.display = "inline-flex";
      nextButton.disabled = true;
      nextButton.textContent = "Next";
      nextButton.onclick = () => {
        if (!nextButton.disabled) nextQuestion();
      };
    } else if (!quizState.feedbackShown[quizState.currentQuestionIndex]) {
      // Answer selected but feedback not shown yet - show Submit button
      submitButton.style.display = "inline-flex";
      nextButton.style.display = "none";
      submitButton.disabled = false;
      submitButton.onclick = () => {
        if (!submitButton.disabled) handleSubmit();
      };
    } else {
      // Answer selected and feedback shown - show Next button
      submitButton.style.display = "none";
      nextButton.style.display = "inline-flex";
      nextButton.disabled = false;
      nextButton.textContent = "Next";
      nextButton.onclick = () => {
        if (!nextButton.disabled) nextQuestion();
      };
    }
  }

  // Handle last question
  if (quizState.currentQuestionIndex === quizState.allQuestions.length - 1) {
    if (currentMode === "review") {
      nextButton.textContent =
        reviewContext === "study" ? "End Study Review" : "End Review";
      nextButton.onclick = () => {
        if (!nextButton.disabled) {
          if (reviewContext === "study") {
            showScreen("modeSelectionScreen");
          } else {
            showScreen("resultsScreen");
          }
        }
      };
    } else if (currentMode === "exam") {
      nextButton.textContent = "Submit Exam";
      nextButton.onclick = () => {
        if (!nextButton.disabled) showResults();
      };
    } else {
      nextButton.textContent = "Finish Quiz";
      nextButton.onclick = () => {
        if (!nextButton.disabled) showResults();
      };
    }
  } else {
    nextButton.textContent = "Next";
    nextButton.onclick = () => {
      if (!nextButton.disabled) nextQuestion();
    };
  }

  // Add click event listeners for navigation buttons
  prevButton.onclick = () => {
    if (!prevButton.disabled) previousQuestion();
  };

  // Keyboard support: Enter/Space on focused buttons
  [prevButton, submitButton, nextButton, endExamButton].filter(Boolean).forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!btn.disabled) btn.click();
      }
    });
  });
}

/**
 * Update progress bar based on answered questions
 */
function updateProgress() {
  const progressBar = domElements.progressBar;
  const questionCounter = domElements.questionCounter;
  const totalQ = document.getElementById("totalQ");
  if (!progressBar || !questionCounter || !totalQ) return;

  // Ensure we have a valid total
  const total = Number(
    Array.isArray(quizState.allQuestions) ? quizState.allQuestions.length : 0,
  );
  totalQ.textContent = total;
  if (total === 0) {
    progressBar.style.width = "0%";
    if (questionCounter) questionCounter.textContent = "0";
    if (totalQ) totalQ.textContent = "0";
    return;
  }

  // Calculate progress percentage based on current question index in filtered set
  const progress = ((quizState.currentQuestionIndex + 1) / total) * 100;
  progressBar.style.width = `${progress}%`;
  if (questionCounter)
    questionCounter.textContent = `${quizState.currentQuestionIndex + 1}`;
  if (totalQ) totalQ.textContent = total;
}

/**
 * Move to next question
 */
function nextQuestion() {
  // Clear explanation when moving to the next question
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    explanationDiv.innerHTML = "";
    explanationDiv.classList.remove("show");
  }

  if (quizState.currentQuestionIndex < quizState.allQuestions.length - 1) {
    quizState.currentQuestionIndex++;
    showQuestion();
    // Update navigation after moving to next question
    updateNavigation();
    persistQuizRuntime();
  } else {
    showResults();
  }
}

/**
 * Handle submit action (show feedback and explanation)
 */
function handleSubmit() {
  // Ensure an answer was selected and feedback hasn't been shown yet
  if (
    quizState.userAnswers[quizState.currentQuestionIndex] === undefined ||
    quizState.feedbackShown[quizState.currentQuestionIndex]
  )
    return;

  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  const selectedIndex = quizState.userAnswers[quizState.currentQuestionIndex];
  const options = document.querySelectorAll(".option-btn");

  // Update UI to show correct/incorrect feedback
  options.forEach((option, index) => {
    option.classList.remove("selected", "correct", "incorrect");
    clearOptionFeedbackLabel(option);

    if (index === selectedIndex) {
      option.classList.add("selected");
      if (index === question.correct) {
        option.classList.add("correct");
      } else {
        option.classList.add("incorrect");
      }
    }

    if (index === question.correct) {
      option.classList.add("correct");
    }
    applyOptionFeedbackLabel(option);
  });

  // Show explanation immediately
  showExplanation();
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) {
    explanationDiv.classList.add("show");
    explanationDiv.style.display = "block";
  }

  // Mark that feedback has been shown for this question
  quizState.feedbackShown[quizState.currentQuestionIndex] = true;

  // Update navigation to show Next button
  updateNavigation();
  persistQuizRuntime();
}

/**
 * Submit current answer (can be called from app.js) - kept for compatibility but not used in UI
 */
function submitAnswer() {
  // This function is now primarily for external compatibility if needed,
  // but the main submit logic is in handleSubmit for practice mode.
  // For other modes, it still advances.
  if (currentMode === "practice") {
    handleSubmit(); // Call the new submit handler
  } else {
    // For other modes, advance to next question
    if (quizState.currentQuestionIndex < quizState.allQuestions.length - 1) nextQuestion();
    else showResults();
  }
}

/**
 * Move to previous question
 */
function previousQuestion() {
  if (quizState.currentQuestionIndex > 0) {
    quizState.currentQuestionIndex--;
    showQuestion();
    // Update navigation after moving to previous question
    updateNavigation();
    persistQuizRuntime();
  }
}

/**
 * Calculate exam score when time runs out
 */
function calculateExamScore() {
  const scoreSnapshot = calculateScoreFromAnswers(quizState.allQuestions, quizState.userAnswers);
  quizState.score = scoreSnapshot.correct;
  debugLog(
    "Exam auto-submitted. Final score:",
    quizState.score,
    "out of",
    quizState.allQuestions.length,
  );
}

function getAnsweredQuestionCount() {
  return quizState.userAnswers.reduce(
    (count, answer) => count + (answer !== undefined ? 1 : 0),
    0,
  );
}

function confirmEndExam() {
  if (currentMode !== "exam") return;

  const totalQuestions = quizState.allQuestions.length;
  const answeredCount = getAnsweredQuestionCount();
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const warningMessage = [
    "End this exam now?",
    "",
    "This will submit your current answers immediately and move straight to Results.",
    `Answered: ${answeredCount}/${totalQuestions}`,
    `Unanswered: ${unansweredCount}`,
    `Time remaining: ${formatDuration(quizState.timeLeft)}`,
    "",
    "Only use this if you are sure you want to finish early.",
  ].join("\n");

  if (!window.confirm(warningMessage)) {
    return;
  }

  debugLog("Exam ended early by user");
  showResults();
}

/**
 * Show explanation for the current question
 */
function showExplanation() {
  const explanationDiv = document.getElementById("explanation");
  if (!explanationDiv) return;

  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  const selectedIndex = quizState.userAnswers[quizState.currentQuestionIndex];
  const hasAnswered = selectedIndex !== undefined;
  const isCorrect = hasAnswered && selectedIndex === question.correct;
  const correctLetter = String.fromCharCode(65 + question.correct);
  const selectedLetter = hasAnswered ? String.fromCharCode(65 + selectedIndex) : null;
  const selectedText = hasAnswered ? question.options?.[selectedIndex] || "" : "";
  const correctText = question.options?.[question.correct] || "";
  const safeSelectedText = escapeHtml(selectedText);
  const safeCorrectText = escapeHtml(correctText);

  let statusPanel = "";
  if (currentMode === "practice" && hasAnswered) {
    statusPanel = `
      <section class="feedback-status ${isCorrect ? "feedback-status-correct" : "feedback-status-incorrect"}">
        <p class="feedback-verdict"><strong>${isCorrect ? "Correct response" : "Incorrect response"}</strong></p>
        <p><strong>Your answer:</strong> Option ${selectedLetter} ${safeSelectedText ? `- ${safeSelectedText}` : ""}</p>
        ${isCorrect ? "" : `<p><strong>Expected answer:</strong> Option ${correctLetter} ${safeCorrectText ? `- ${safeCorrectText}` : ""}</p>`}
      </section>
    `;
  } else if (currentMode === "review") {
    statusPanel = `
      <section class="feedback-status">
        <p class="feedback-verdict"><strong>Reference answer</strong></p>
        <p><strong>Correct answer:</strong> Option ${correctLetter} ${safeCorrectText ? `- ${safeCorrectText}` : ""}</p>
      </section>
    `;
  }

  explanationDiv.innerHTML = `
        <h4>Rationale</h4>
        ${statusPanel}
        <div class="explanation-body">${parseMarkdown(
          normalizeExplanationText(question.explanation),
        )}</div>
    `;
}

// Expose navigation functions for external wiring
export {
  previousQuestion,
  nextQuestion,
  submitAnswer,
  initializeQuiz,
  retakeFullQuiz,
};
// Also attach to window for compatibility

function reviewIncorrectAnswers() {
  applyReviewFilter("incorrect");
}

function retakeFullQuiz() {
  if (quizState.originalQuestions.length > 0) {
    quizState.allQuestions = quizState.originalQuestions;
    quizState.originalQuestions = [];
    initializeQuiz();
    return true;
  }
  return false;
}

// Show quiz results
function showResults() {
  clearInterval(quizState.timer);
  clearPersistedQuizRuntime();
  calculateExamScore(); // Ensure score is calculated before displaying results
  const finalScore = document.getElementById("finalScore");
  const performanceText = document.getElementById("performanceText");
  if (!finalScore || !performanceText) return;

  // Update stats display
  const correctCount = document.getElementById("correctCount");
  const wrongCount = document.getElementById("wrongCount");
  const unansweredCount = document.getElementById("unansweredCount");
  const timeSpent = document.getElementById("timeSpent");
  const allowedTime = document.getElementById("allowedTime");
  const allowedTimeBlock = document.getElementById("allowedTimeBlock");
  const timingSummaryCard = document.getElementById("timingSummaryCard");
  const timingVerdict = document.getElementById("timingVerdict");
  const scorePacingVerdict = document.getElementById("scorePacingVerdict");

  quizState.incorrectAnswers = [];
  for (let i = 0; i < quizState.allQuestions.length; i++) {
    if (quizState.userAnswers[i] !== quizState.allQuestions[i].correct) {
      quizState.incorrectAnswers.push(quizState.allQuestions[i]);
    }
  }

  if (currentMode === "review") {
    if (reviewContext === "study") {
      showScreen("modeSelectionScreen");
      return;
    }
    showScreen("resultsScreen");
    return;
  }

  const scoreSnapshot = calculateScoreFromAnswers(quizState.allQuestions, quizState.userAnswers);
  const answered = scoreSnapshot.answered;
  const correct = scoreSnapshot.correct;
  const wrong = scoreSnapshot.wrong;
  const unanswered = scoreSnapshot.unanswered;

  if (correctCount) correctCount.textContent = correct;
  if (wrongCount) wrongCount.textContent = wrong;
  if (unansweredCount) unansweredCount.textContent = unanswered;
  const configuredExamSeconds = getConfiguredExamTimeLimitSeconds(
    currentTopic,
    quizState.allQuestions.length,
  );
  const timeElapsed = currentMode === "exam"
    ? Math.max(0, configuredExamSeconds - quizState.timeLeft)
    : Math.max(0, quizState.timeLeft);
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const timeSpentLabel = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  if (timeSpent) {
    timeSpent.textContent = timeSpentLabel;
  }
  const allowedTimeLabel = formatDuration(configuredExamSeconds);
  if (allowedTime) {
    allowedTime.textContent = allowedTimeLabel;
  }
  if (allowedTimeBlock) {
    allowedTimeBlock.classList.toggle("hidden", currentMode !== "exam");
  }
  if (timingSummaryCard) {
    timingSummaryCard.classList.toggle("dual-timing", currentMode === "exam");
  }
  const remainingTime = Math.max(0, configuredExamSeconds - timeElapsed);
  if (timingVerdict) {
    if (currentMode === "exam") {
      timingVerdict.textContent = remainingTime > 0
        ? `Finished with ${formatDuration(remainingTime)} remaining.`
        : "Used the full allowed time.";
    } else {
      timingVerdict.textContent = "Untimed session. Work at your own pace.";
    }
  }
  const scorePercentage = scoreSnapshot.scorePercentage;
  const accuracyRate = scoreSnapshot.accuracyRate;
  const unansweredRate = scoreSnapshot.unansweredRate;
  const wrongRate = scoreSnapshot.wrongRate;
  const overallTrafficClass = getTrafficClassByPercentage(scorePercentage);
  const accuracyTrafficClass = getTrafficClassByPercentage(accuracyRate);
  const unansweredTrafficClass = getInverseTrafficClassByPercentage(unansweredRate);
  const wrongTrafficClass = getInverseTrafficClassByPercentage(wrongRate);
  finalScore.textContent = `${scorePercentage}%`;
  applyTrafficClass(finalScore, overallTrafficClass);

  // Capture the just-completed quiz session for post-quiz review filters.
  lastCompletedSession = {
    questions: [...quizState.originalQuestions],
    userAnswers: [...quizState.userAnswers],
    topicId: currentTopic?.id || null,
    sourceMode: currentMode,
  };
  syncRetryMissedQueueFromSession();
  syncSpacedPracticeQueueFromSession();

  const mockTopicBreakdown = isMockExamTopic(currentTopic)
    ? buildMockExamTopicBreakdown()
    : [];
  const subcategoryBreakdown = buildSubcategoryBreakdown(quizState.allQuestions, quizState.userAnswers);
  const difficultyBreakdown = buildDifficultyBreakdown(quizState.allQuestions, quizState.userAnswers);
  const resolvedTemplate = getMockExamTemplate(currentTopic);
  const templateId = String(currentTopic?.selectedTemplateId || resolvedTemplate?.id || "").trim();
  const templateName = String(currentTopic?.selectedTemplateName || resolvedTemplate?.name || "").trim();
  const glBand = String(getActiveSessionGlBand(currentTopic)).trim();
  const recordedProgress =
    currentTopic?.id === RETRY_MISSED_TOPIC_ID
      ? { summary: readProgressSummary(), attempt: null }
      : recordAttemptResult({
          topicId: currentTopic?.id,
          topicName: getDisplayTopicName(currentTopic),
          mode: currentMode,
          scorePercentage,
          totalQuestions: quizState.allQuestions.length,
          templateId,
          templateName,
          glBand,
          timeTakenSec: timeElapsed,
          correctCount: correct,
          wrongCount: wrong,
          unansweredCount: unanswered,
          subcategoryBreakdown,
          difficultyBreakdown,
          sourceTopicBreakdown: mockTopicBreakdown,
        });
  const progressSummary = recordedProgress.summary;
  const progressInsights = calculateProgressInsights(progressSummary, currentTopic?.id);
  const strongestTopicName = escapeHtml(
    progressInsights.strongestTopic?.topicName || "Not enough data yet",
  );
  const weakestTopicName = escapeHtml(
    progressInsights.weakestTopic?.topicName || "Not enough data yet",
  );
  const weakestSessionSubcategory =
    subcategoryBreakdown.find((entry) => entry.answered > 0) ||
    subcategoryBreakdown[0] ||
    null;
  const weakestSessionSubcategoryName = escapeHtml(
    weakestSessionSubcategory?.subcategoryName || "No subcategory data yet",
  );
  const weakestSessionSubcategoryMeta = weakestSessionSubcategory
    ? `${weakestSessionSubcategory.accuracy}% accuracy ? ${weakestSessionSubcategory.correct}/${weakestSessionSubcategory.answered} correct (answered)${
        weakestSessionSubcategory.unanswered > 0
          ? ` ? ${weakestSessionSubcategory.unanswered} unanswered`
          : ""
      }`
    : "This session did not include enough subcategory detail yet.";
  const retryQueueCount = getRetryMissedQueueCount();
  const currentTopicAttemptCount = (progressSummary?.attempts || []).filter(
    (attempt) => String(attempt?.topicId || "").trim() === String(currentTopic?.id || "").trim(),
  ).length;
  const recentScoreSignal = buildRecentAttemptSignal(progressSummary?.attempts || []);
  const latestTimingSignal = getSessionTimingSignal({
    mode: currentMode,
    timeElapsed,
    configuredExamSeconds,
    unansweredCount: unanswered,
  });
  const filteredIncorrectCount = quizState.incorrectAnswers.length - unanswered;
  const recommendationConfidence = buildResultsRecommendationConfidence({
    weakestSessionSubcategory,
    topicAttemptCount: currentTopicAttemptCount,
    unansweredCount: unanswered,
    incorrectCount: filteredIncorrectCount,
    recentScoreSignal,
    timingSignal: latestTimingSignal,
  });
  const fallbackSignalSummary = buildResultsRecommendationSignals({
    recentScoreSignal,
    timingSignal: latestTimingSignal,
  });
  const canLaunchRetryQueue =
    currentTopic?.id !== RETRY_MISSED_TOPIC_ID &&
    quizState.incorrectAnswers.length > 0 &&
    retryQueueCount > 0;
  const retryPath = canLaunchRetryQueue
    ? {
        title: `Retry Missed Questions (${retryQueueCount})`,
        body: weakestSessionSubcategory?.subcategoryName
          ? `Start Retry Missed to revisit ${weakestSessionSubcategory.subcategoryName} and the other questions you missed in this session.`
          : "Start Retry Missed to revisit the questions you missed in this session.",
        buttonLabel: `Retry Missed (${Math.min(retryQueueCount, RETRY_MISSED_DEFAULT_SESSION_SIZE)})`,
        action: "retry_queue",
      }
    : quizState.incorrectAnswers.length > 0
      ? {
          title: "Review Missed Questions",
          body: "Review the missed questions now while the explanations are still fresh.",
          buttonLabel: "Review Missed Questions",
          action: "review_incorrect",
        }
      : scorePercentage >= 70
        ? {
            title: "Move into a Timed Drill",
            body: "You finished strongly. Retake this session or move into a fresh timed drill next.",
            buttonLabel: "Retake Session",
            action: "retake",
          }
        : {
            title: "Slow Down with Practice",
            body: "Retake this session in Practice to slow down and learn from the explanations.",
            buttonLabel: "Retake Session",
            action: "retake",
          };
  const sessionSetupRecommendation = buildRecommendedSessionSetup({
    topic: currentTopic,
    mode: currentMode,
    scorePercentage,
    incorrectCount: filteredIncorrectCount,
    unansweredCount: unanswered,
    timeElapsed,
    configuredExamSeconds,
    difficultyBreakdown,
    recentScoreSignal,
    recommendationConfidence,
    timingSignal: latestTimingSignal,
  });
  const followUpAction = {
    ...(sessionSetupRecommendation || retryPath),
    confidenceLabel: sessionSetupRecommendation?.confidenceLabel || recommendationConfidence.label,
    confidenceTone: sessionSetupRecommendation?.confidenceTone || recommendationConfidence.tone,
    confidenceDescription:
      sessionSetupRecommendation?.confidenceDescription || recommendationConfidence.description,
    signalChips: Array.isArray(sessionSetupRecommendation?.signalChips)
      ? sessionSetupRecommendation.signalChips
      : fallbackSignalSummary.chips,
    body: sessionSetupRecommendation
      ? sessionSetupRecommendation.body
      : [retryPath.body, fallbackSignalSummary.note].filter(Boolean).join(" "),
  };
  const recommendedTopicText = weakestSessionSubcategory && quizState.incorrectAnswers.length > 0
    ? `Reinforce ${escapeHtml(weakestSessionSubcategory.subcategoryName)} next. ${escapeHtml(followUpAction.body)}`
    : progressInsights.recommendedTopic
      ? `Prioritize ${escapeHtml(progressInsights.recommendedTopic)} next.`
      : scorePercentage >= 70
        ? "You are ready for a timed drill in your next session."
        : "Review missed questions first, then retake this topic in Practice.";
  const normalizedStudyFilters = normalizeStudyFilters(currentTopic?.studyFilters, {
    totalQuestions: quizState.allQuestions.length,
  });
  const sessionProfileCards = [
    {
      value: currentMode === "exam" ? "Timed Topic Test" : currentMode === "review" ? "Study Review" : "Practice",
      label: "Behavior",
      trafficClass: currentMode === "exam" ? accuracyTrafficClass : overallTrafficClass,
    },
    {
      value: timeSpentLabel,
      label: "Time Used",
      trafficClass: accuracyTrafficClass,
    },
  ];
  if (templateName) {
    sessionProfileCards.push({
      value: templateName,
      label: "Template",
      trafficClass: overallTrafficClass,
    });
  }
  sessionProfileCards.push({
    value: formatQuestionFocusLabel(normalizedStudyFilters.questionFocus),
    label: "Session Focus",
    trafficClass: currentMode === "exam" ? accuracyTrafficClass : overallTrafficClass,
  });
  const glBandLabel = formatGlBandLabel(glBand);
  if (glBandLabel) {
    sessionProfileCards.push({
      value: glBandLabel,
      label: isMockExamTopic(currentTopic) ? "GL Band" : "Directorate Emphasis",
      trafficClass: overallTrafficClass,
    });
  }
  const subcategoryBreakdownHtml = subcategoryBreakdown.length
    ? `
        <div class="section-head screen-header mock-breakdown-head">
            <h2>Current Session by Subcategory</h2>
            <p>Accuracy across the categories touched in this session.</p>
        </div>
        <div class="analytics-grid mock-breakdown-grid">
            ${subcategoryBreakdown
              .slice(0, 4)
              .map(
                (entry) => `
                <div class="analytic-item mock-breakdown-item ${getTrafficClassByPercentage(entry.accuracy)}">
                    <div class="analytic-value">${entry.accuracy}%</div>
                    <div class="analytic-label">${escapeHtml(entry.subcategoryName)}</div>
                    <p class="mock-breakdown-meta">${entry.correct}/${entry.answered} correct (answered)</p>
                    <p class="mock-breakdown-meta">Coverage: ${entry.answered}/${entry.total}</p>
                </div>
            `,
              )
              .join("")}
        </div>
      `
    : "";
  const difficultyBreakdownHtml = difficultyBreakdown.length
    ? `
        <div class="section-head screen-header mock-breakdown-head">
            <h2>Current Session by Difficulty</h2>
            <p>Use this to see whether speed or accuracy dropped as questions became harder.</p>
        </div>
        <div class="analytics-grid mock-breakdown-grid">
            ${difficultyBreakdown
              .map(
                (entry) => `
                <div class="analytic-item mock-breakdown-item ${getTrafficClassByPercentage(entry.accuracy)}">
                    <div class="analytic-value">${entry.accuracy}%</div>
                    <div class="analytic-label">${escapeHtml(formatDifficultyLabel(entry.difficulty))}</div>
                    <p class="mock-breakdown-meta">${entry.correct}/${entry.answered} correct (answered)</p>
                    <p class="mock-breakdown-meta">Coverage: ${entry.answered}/${entry.total}</p>
                </div>
            `,
              )
              .join("")}
        </div>
      `
    : "";
  const mockBreakdownHtml = mockTopicBreakdown.length
    ? `
        <div class="section-head screen-header mock-breakdown-head">
            <h2>Mock Exam Topic Breakdown</h2>
            <p>Performance split across all sampled source topics.</p>
        </div>
        <div class="analytics-grid mock-breakdown-grid">
            ${mockTopicBreakdown
              .map(
                (entry) => `
                <div class="analytic-item mock-breakdown-item ${getTrafficClassByPercentage(entry.accuracy)}">
                    <div class="analytic-value">${entry.accuracy}%</div>
                    <div class="analytic-label">${escapeHtml(entry.topicName)}</div>
                    <p class="mock-breakdown-meta">${entry.correct}/${entry.answered} correct (answered)</p>
                    <p class="mock-breakdown-meta">Coverage: ${entry.answered}/${entry.total}</p>
                </div>
            `,
              )
              .join("")}
        </div>
      `
    : "";

  // Enhanced performance analysis
  let performanceMessage = "";
  let performanceClass = "";

  if (scorePercentage >= 90) {
    performanceMessage =
      "Outstanding! You have mastered this topic exceptionally well.";
    performanceClass = "excellent";
  } else if (scorePercentage >= 80) {
    performanceMessage =
      "Excellent! You have a strong understanding of this topic.";
    performanceClass = "excellent";
  } else if (scorePercentage >= 70) {
    performanceMessage = "Very Good! You have a solid grasp of the material.";
    performanceClass = "good";
  } else if (scorePercentage >= 60) {
    performanceMessage =
      "Good job! You have a good understanding of the key concepts.";
    performanceClass = "good";
  } else if (scorePercentage >= 50) {
    performanceMessage =
      "Fair performance. Review the material and strengthen weak areas.";
    performanceClass = "average";
  } else if (scorePercentage >= 40) {
    performanceMessage =
      "Keep practicing! Focus on understanding the core concepts.";
    performanceClass = "average";
  } else {
    performanceMessage =
      "This topic needs significant review. Consider studying the material more thoroughly.";
    performanceClass = "poor";
  }

  performanceText.textContent = performanceMessage;
  performanceText.className = `performance ${performanceClass}`;

  if (scorePacingVerdict) {
    let pacingMessage = "Steady untimed run. Build consistency before adding more speed.";
    if (currentMode === "exam") {
      const remainingRatio = configuredExamSeconds > 0 ? remainingTime / configuredExamSeconds : 0;
      if (scorePercentage >= 80 && remainingRatio >= 0.2) {
        pacingMessage = "Strong finish with time to spare. You can push into tougher timed drills next.";
      } else if (scorePercentage >= 70 && remainingRatio <= 0.1) {
        pacingMessage = "Solid result under time pressure. Keep that pace, but stay sharp on weak areas.";
      } else if (scorePercentage >= 70) {
        pacingMessage = "Solid timed result with a stable pace. Keep building consistency.";
      } else if (remainingRatio >= 0.2) {
        pacingMessage = "You had time left. Slow down a little next time and trade speed for accuracy.";
      } else {
        pacingMessage = "Accuracy slipped under time pressure. Try Practice or a shorter timed drill before the next full run.";
      }
    } else if (scorePercentage >= 70) {
      pacingMessage = "Steady untimed run. You are in a good place to add speed in the next session.";
    }
    scorePacingVerdict.textContent = pacingMessage;
  }

  const followUpConfidenceToneClass =
    followUpAction.confidenceTone === "high"
      ? "high"
      : followUpAction.confidenceTone === "low"
        ? "low"
        : "medium";
  const followUpSummaryChipsHtml = Array.isArray(followUpAction.summaryChips) && followUpAction.summaryChips.length
    ? `
        <div class="chip-row setup-suggestion-chips" id="resultsFollowUpSummaryChips">
            ${followUpAction.summaryChips
              .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
              .join("")}
        </div>
      `
    : `<div class="chip-row setup-suggestion-chips hidden" id="resultsFollowUpSummaryChips"></div>`;
  const followUpSignalChipsHtml = Array.isArray(followUpAction.signalChips) && followUpAction.signalChips.length
    ? `
        <div class="chip-row recommendation-signal-chips" id="resultsFollowUpSignalChips">
            ${followUpAction.signalChips
              .map((entry) => `<span class="chip">${escapeHtml(String(entry))}</span>`)
              .join("")}
        </div>
      `
    : `<div class="chip-row recommendation-signal-chips hidden" id="resultsFollowUpSignalChips"></div>`;
  const followUpConfidenceHtml = followUpAction.confidenceLabel
    ? `
        <p class="recommendation-confidence ${followUpConfidenceToneClass}" id="resultsFollowUpConfidence">
            <strong>Confidence:</strong> ${escapeHtml(followUpAction.confidenceLabel)}
            ${followUpAction.confidenceDescription ? `- ${escapeHtml(followUpAction.confidenceDescription)}` : ""}
        </p>
      `
    : `<p class="recommendation-confidence hidden" id="resultsFollowUpConfidence"></p>`;
  const followUpClearActionHtml = followUpAction.action === "setup_tune"
    ? `
        <div class="setup-suggestion-actions results-followup-actions">
            <button class="btn btn-ghost btn-sm" id="clearResultsSetupSuggestionBtn" type="button">Clear Setup Hint</button>
        </div>
      `
    : "";
  // Add detailed analytics
  const analyticsDiv =
    document.getElementById("categoryBreakdown") ||
    document.createElement("div");
  analyticsDiv.id = "categoryBreakdown";
    analyticsDiv.innerHTML = `
        <div class="section-head screen-header">
            <h2>Performance Insights</h2>
            <p>Track your strengths, weak points, and the clearest next move.</p>
        </div>
        <div class="analytics-grid">
            <div class="analytic-item ${overallTrafficClass}">
                <div class="analytic-value">${scorePercentage}%</div>
                <div class="analytic-label">Overall Score</div>
            </div>
            <div class="analytic-item ${accuracyTrafficClass}">
                <div class="analytic-value">${correct}/${quizState.allQuestions.length}</div>
                <div class="analytic-label">Correct Answers</div>
            </div>
            <div class="analytic-item ${accuracyTrafficClass}">
                <div class="analytic-value">${accuracyRate}%</div>
                <div class="analytic-label">Accuracy Rate</div>
            </div>
            <div class="analytic-item ${unansweredTrafficClass}">
                <div class="analytic-value">${unanswered}</div>
                <div class="analytic-label">Unanswered</div>
            </div>
        </div>
        <div class="insight-grid">
            <article class="insight-card action primary">
                <p class="eyebrow">Best Next Step</p>
                <h3 id="resultsFollowUpTitle">${escapeHtml(followUpAction.title)}</h3>
                <p id="resultsFollowUpBody">${escapeHtml(followUpAction.body)}</p>
                ${followUpSummaryChipsHtml}
                ${followUpSignalChipsHtml}
                ${followUpConfidenceHtml}
                ${followUpClearActionHtml}
            </article>
            <article class="insight-card weakest">
                <p class="eyebrow">Weakest Session Subcategory</p>
                <h3>${weakestSessionSubcategoryName}</h3>
                <p>${escapeHtml(weakestSessionSubcategoryMeta)}</p>
            </article>
            <article class="insight-card strongest">
                <p class="eyebrow">Strongest Area</p>
                <h3>${strongestTopicName}</h3>
                <p>${progressInsights.strongestTopic ? `${progressInsights.strongestTopic.avgScore}% average` : "Complete more sessions to unlock this insight."}</p>
            </article>
            <article class="insight-card weakest">
                <p class="eyebrow">Weakest Area</p>
                <h3>${weakestTopicName}</h3>
                <p>${progressInsights.weakestTopic ? `${progressInsights.weakestTopic.avgScore}% average` : "Complete more sessions to unlock this insight."}</p>
            </article>
            <article class="insight-card trend">
                <p class="eyebrow">Recent Trend</p>
                <h3>${progressInsights.avgRecentScore ?? "-"}${progressInsights.avgRecentScore !== null ? "%" : ""}</h3>
                <p>Based on your latest 5 attempts across topics.</p>
            </article>
            <article class="insight-card trend">
                <p class="eyebrow">Total Attempts</p>
                <h3>${progressInsights.attemptsCount}</h3>
                <p>Consistent practice improves retention and exam speed.</p>
            </article>
        </div>
        <div class="recommendation ${scorePercentage >= 70 ? "success" : "improvement"}">
            <strong>Best Next Step:</strong> ${recommendedTopicText}
        </div>
        <div class="section-head screen-header mock-breakdown-head">
            <h2>Session Profile</h2>
            <p>The current result is now stored with richer analytics for later review.</p>
        </div>
        <div class="analytics-grid mock-breakdown-grid">
            ${sessionProfileCards
              .map(
                (entry) => `
                <div class="analytic-item mock-breakdown-item ${entry.trafficClass}">
                    <div class="analytic-value">${escapeHtml(entry.value)}</div>
                    <div class="analytic-label">${escapeHtml(entry.label)}</div>
                </div>
            `,
              )
              .join("")}
        </div>
        ${subcategoryBreakdownHtml}
        ${difficultyBreakdownHtml}
        ${mockBreakdownHtml}
    `;

  // Insert analytics after stats if not already present
  if (!document.getElementById("categoryBreakdown")) {
    const statsDiv = document.getElementById("resultsStats");
    if (statsDiv) {
      statsDiv.parentNode.insertBefore(analyticsDiv, statsDiv.nextSibling);
    }
  }

  const resultHero = document.querySelector("#resultsScreen .result-hero");
  applyTrafficClass(resultHero, overallTrafficClass);

  const resultStatCards = Array.from(document.querySelectorAll("#resultsStats .stat-card"));
  if (resultStatCards.length >= 4) {
    applyTrafficClass(resultStatCards[0], accuracyTrafficClass);
    applyTrafficClass(resultStatCards[1], wrongTrafficClass);
    applyTrafficClass(resultStatCards[2], unansweredTrafficClass);
    applyTrafficClass(resultStatCards[3], accuracyTrafficClass);
  }

  let resultsSetupSuggestionDismissed = false;
  const resultsFollowUpSummaryChips = document.getElementById("resultsFollowUpSummaryChips");
  const resultsFollowUpSignalChips = document.getElementById("resultsFollowUpSignalChips");
  const resultsFollowUpConfidence = document.getElementById("resultsFollowUpConfidence");
  const clearResultsSetupSuggestionBtn = document.getElementById("clearResultsSetupSuggestionBtn");
  const renderResultsFollowUpSuggestionState = () => {
    const shouldShowSetupHint = followUpAction.action === "setup_tune" && !resultsSetupSuggestionDismissed;
    if (resultsFollowUpSummaryChips) {
      resultsFollowUpSummaryChips.classList.toggle(
        "hidden",
        !shouldShowSetupHint || !Array.isArray(followUpAction.summaryChips) || followUpAction.summaryChips.length === 0,
      );
    }
    if (resultsFollowUpSignalChips) {
      resultsFollowUpSignalChips.classList.toggle(
        "hidden",
        !shouldShowSetupHint || !Array.isArray(followUpAction.signalChips) || followUpAction.signalChips.length === 0,
      );
    }
    if (resultsFollowUpConfidence) {
      resultsFollowUpConfidence.classList.toggle("hidden", !shouldShowSetupHint || !followUpAction.confidenceLabel);
    }
    if (clearResultsSetupSuggestionBtn) {
      clearResultsSetupSuggestionBtn.classList.toggle("hidden", !shouldShowSetupHint);
    }
    const retryPathResultsBtn = document.getElementById("retryPathResultsBtn");
    if (retryPathResultsBtn && followUpAction.action === "setup_tune") {
      retryPathResultsBtn.textContent = shouldShowSetupHint ? followUpAction.buttonLabel : "Open Session Setup";
    }
  };
  renderResultsFollowUpSuggestionState();
  if (clearResultsSetupSuggestionBtn) {
    clearResultsSetupSuggestionBtn.onclick = () => {
      resultsSetupSuggestionDismissed = true;
      renderResultsFollowUpSuggestionState();
    };
  }

  const dashboardRetryMissedBtn = document.getElementById("retryMissedBtn");
  if (dashboardRetryMissedBtn) {
    dashboardRetryMissedBtn.textContent = retryQueueCount > 0 ? `Retry Missed (${retryQueueCount})` : "Retry Missed";
    dashboardRetryMissedBtn.disabled = retryQueueCount === 0;
  }

  const retryPathResultsBtn = document.getElementById("retryPathResultsBtn");
  if (retryPathResultsBtn) {
    retryPathResultsBtn.classList.remove("hidden");
    retryPathResultsBtn.textContent = followUpAction.buttonLabel;
    retryPathResultsBtn.onclick = () => {
      if (followUpAction.action === "setup_tune") {
        const baseStudyFilters = normalizeStudyFilters(currentTopic?.studyFilters, {
          totalQuestions: quizState.allQuestions.length,
        });
        const shouldCarrySetupSuggestion = !resultsSetupSuggestionDismissed;
        const mergedStudyFilters = shouldCarrySetupSuggestion
          ? {
              ...baseStudyFilters,
              ...followUpAction.nextFilters,
            }
          : baseStudyFilters;
        const nextTopic = {
          ...currentTopic,
          studyFilters: mergedStudyFilters,
          sessionSetupSuggestion: shouldCarrySetupSuggestion
            ? {
                title: followUpAction.title,
                message: followUpAction.body,
                chips: Array.isArray(followUpAction.summaryChips) ? followUpAction.summaryChips : [],
                signalChips: Array.isArray(followUpAction.signalChips) ? followUpAction.signalChips : [],
                confidenceLabel: String(followUpAction.confidenceLabel || "").trim(),
                confidenceTone: String(followUpAction.confidenceTone || "medium").trim().toLowerCase(),
                confidenceDescription: String(followUpAction.confidenceDescription || "").trim(),
              }
            : null,
          availableStudyFilters:
            currentTopic?.availableStudyFilters ||
            summarizeStudyFilterOptions(quizState.originalQuestions, {
              currentFilters: mergedStudyFilters,
              defaultQuestionCount: mergedStudyFilters.questionCount,
            }),
        };
        setCurrentTopic(nextTopic);
        showScreen("modeSelectionScreen");
        if (typeof document !== "undefined" && typeof CustomEvent === "function") {
          document.dispatchEvent(
            new CustomEvent("sessionsetupchange", {
              detail: { topic: nextTopic },
            }),
          );
        }
        return;
      }
      if (followUpAction.action === "retry_queue") {
        if (dashboardRetryMissedBtn && !dashboardRetryMissedBtn.disabled) {
          dashboardRetryMissedBtn.click();
          return;
        }
        startPostQuizReview("incorrect");
        return;
      }
      if (followUpAction.action === "review_incorrect") {
        startPostQuizReview("incorrect");
        return;
      }
      retakeFullQuiz();
    };
  }

  const reviewIncorrectResultsBtn = document.getElementById("reviewIncorrectResultsBtn");
  if (reviewIncorrectResultsBtn) {
    if (quizState.incorrectAnswers.length > 0) {
      reviewIncorrectResultsBtn.classList.remove("hidden");
      reviewIncorrectResultsBtn.onclick = () => {
        startPostQuizReview("incorrect");
      };
    } else {
      reviewIncorrectResultsBtn.classList.add("hidden");
    }
  }

  const reviewAnswersBtn = document.getElementById("reviewAnswersBtn");
  if (reviewAnswersBtn) {
    reviewAnswersBtn.onclick = () => {
      startPostQuizReview("all");
    };
  }

  showScreen("resultsScreen");
}

export let currentTopic = null;
export let currentMode = "";

export function setCurrentTopic(topic) {
  debugLog("setCurrentTopic called with:", topic);
  currentTopic = topic;
}

export function setCurrentMode(mode) {
  debugLog("setCurrentMode called with:", mode);
  currentMode = mode;
  if (mode === "review") {
    reviewContext = "study";
    clearPersistedQuizRuntime();
  }
  
  // Update the quiz mode display in the header
  const quizModeDisplay = document.getElementById("quizModeDisplay");
  if (quizModeDisplay) {
    let modeText = mode;
    switch(mode) {
      case "practice":
        modeText = "Practice";
        break;
      case "exam":
        modeText = "Timed Topic Test";
        break;
      case "review":
        modeText = "Study Review";
        break;
      default:
        modeText = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    quizModeDisplay.textContent = modeText;
  }
}

export function getCurrentMode() {
  return currentMode;
}

// Load questions for the selected topic
export async function loadQuestions(questions = null) {
  if (questions) {
    const prioritizedQuestions = currentMode === "review"
      ? [...questions]
      : prioritizeQuestionPool(
          questions,
          buildQuestionSelectionProfileForSession({
            topic: currentTopic,
            mode: currentMode || "practice",
          }),
        );
    quizState.allQuestions = prioritizedQuestions;
    quizState.originalQuestions = prioritizedQuestions;
    initializeQuiz({ context: currentMode === "review" ? "study" : "session" });
    return;
  }


  try {
    if (!currentTopic) {
      throw new Error("Invalid topic selected");
    }

    if (!getCurrentUser()) {
      throw new Error("Please login to continue.");
    }

    const quizContainer = document.getElementById("quizScreen");
    if (!quizContainer) {
      throw new Error("Quiz screen element not found");
    }

    showScreen("quizScreen");
    let loadingEl = quizContainer.querySelector(".loading");
    if (!loadingEl) {
      loadingEl = document.createElement("div");
      loadingEl.className = "loading";
      loadingEl.textContent = "Loading questions...";
      const quizContentGrid = quizContainer.querySelector(".quiz-content-grid");
      if (quizContentGrid) quizContentGrid.parentNode.insertBefore(loadingEl, quizContentGrid);
      else (quizContainer.querySelector(".quiz-card") || quizContainer).appendChild(loadingEl);
    } else {
      loadingEl.textContent = "Loading questions...";
    }

    if (isMockExamTopic(currentTopic)) {
      const entitlement = getCurrentEntitlement();
      if (entitlement.id !== "premium") {
        const mockStatus = getFreeMockExamEligibility();
        if (!mockStatus.allowed) {
          const nextDate = mockStatus.nextEligibleAt
            ? new Date(mockStatus.nextEligibleAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "";
          showWarning(
            `Free mock exam is available weekly. Next free attempt ${nextDate ? `on ${nextDate}` : "soon"}. Upgrade for unlimited mock exams.`,
          );
          showScreen("topicSelectionScreen");
          return;
        }
        recordFreeMockExamUsage();
      }
      quizState.allQuestions = await buildMockExamQuestions(currentTopic);
    } else {
      if (!currentTopic.file) {
        throw new Error("Invalid topic selected");
      }
      const selectedCategory = currentTopic.selectedCategory || "all";
      const entitlement = getCurrentEntitlement();
      const extractionOptions = {
        allowedCategoryIds:
          Array.isArray(currentTopic.allowedCategoryIds) &&
          currentTopic.allowedCategoryIds.length
            ? currentTopic.allowedCategoryIds
            : null,
        maxQuestionsPerSubcategory:
          typeof entitlement.maxQuestionsPerSubcategory === "number"
            ? entitlement.maxQuestionsPerSubcategory
            : null,
      };
      const topicDataFiles = await fetchTopicDataFiles(currentTopic, { tolerateFailures: true });

      quizState.allQuestions = [];
      topicDataFiles.forEach((topicData) => {
        quizState.allQuestions.push(
          ...extractQuestionsByCategory(topicData, selectedCategory, extractionOptions),
        );
      });
    }
    const normalizedStudyFilters = normalizeStudyFilters(currentTopic?.studyFilters, {
      totalQuestions: quizState.allQuestions.length,
      defaultQuestionCount: 40,
    });

    if (
      isFeatureEnabled("enableStudyFilters") &&
      !isMockExamTopic(currentTopic) &&
      currentTopic?.id !== RETRY_MISSED_TOPIC_ID &&
      currentTopic?.id !== SPACED_PRACTICE_TOPIC_ID
    ) {
      quizState.allQuestions = applyStudyFilters(quizState.allQuestions, {
        ...normalizedStudyFilters,
        questionCount: "all",
      });
    }

    if (quizState.allQuestions.length === 0) {
      showError("No questions match the current study filters. Adjust the setup filters and try again.");
      showScreen("modeSelectionScreen");
      return;
    }

    const template = getMockExamTemplate(currentTopic);
    const isFinalizedMockExam = isMockExamTopic(currentTopic) && template?.shuffleQuestions !== false;

    if (!isFinalizedMockExam) {
      quizState.allQuestions = prioritizeQuestionPool(
        quizState.allQuestions,
        buildQuestionSelectionProfileForSession({
          topic: currentTopic,
          mode: currentMode || "practice",
        }),
      );
    }

    let targetQuestionCap =
      Number(currentTopic?.mockExamQuestionCount) > 0
        ? Number(currentTopic.mockExamQuestionCount)
        : 40;

    if (
      isFeatureEnabled("enableStudyFilters") &&
      !isMockExamTopic(currentTopic) &&
      currentTopic?.id !== RETRY_MISSED_TOPIC_ID &&
      currentTopic?.id !== SPACED_PRACTICE_TOPIC_ID
    ) {
      targetQuestionCap = normalizedStudyFilters.questionCount === "all"
        ? null
        : Number(normalizedStudyFilters.questionCount || 40);
    }

    if (Number.isFinite(targetQuestionCap) && targetQuestionCap > 0 && quizState.allQuestions.length > targetQuestionCap) {
      quizState.allQuestions = quizState.allQuestions.slice(0, targetQuestionCap);
    }


    initializeQuiz({ context: currentMode === "review" ? "study" : "session" });
  } catch (error) {
    console.error("Error loading questions:", error);
    showError("Failed to load questions. Please try again.");
    showScreen("topicSelectionScreen");
  }
}

let reviewFilter = "all";

function startPostQuizReview(filter = "all") {
  if (!lastCompletedSession || !lastCompletedSession.questions?.length) {
    showError("No completed quiz session available for review.");
    return;
  }

  setCurrentMode("review");
  reviewContext = "session";
  quizState.allQuestions = [...lastCompletedSession.questions];
  quizState.originalQuestions = [...lastCompletedSession.questions];
  quizState.userAnswers = [...lastCompletedSession.userAnswers];
  quizState.currentQuestionIndex = 0;
  quizState.feedbackShown = new Array(quizState.allQuestions.length).fill(true);

  initializeQuiz({ preserveAnswers: true, context: "session", keepOriginalQuestions: true });
  applyReviewFilter(filter);
}

function jumpToQuestion(index) {
    if (currentMode === "review") {
        if (index < 0 || index >= quizState.allQuestions.length) return;
        quizState.currentQuestionIndex = index;
        showQuestion();
        if (reviewContext === "session") {
            showReviewControls();
        }
    } else {
        quizState.currentQuestionIndex = index;
        showQuestion();
    }
}

function applyReviewFilter(filter) {
    if (currentMode !== "review" || reviewContext !== "session") {
        return;
    }
    reviewFilter = filter;
    quizState.allQuestions = getFilteredQuestions();
    quizState.currentQuestionIndex = 0;
    if (quizState.allQuestions.length > 0) {
        showQuestion();
        showReviewControls();
    } else {
        showError("No questions match the selected filter.");
    }
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    Boolean(target.isContentEditable)
  );
}

function isQuizScreenActive() {
  const quizScreen = document.getElementById("quizScreen");
  return Boolean(quizScreen && !quizScreen.classList.contains("hidden"));
}

function getCurrentOptionCount() {
  const question = quizState.allQuestions[quizState.currentQuestionIndex];
  return Array.isArray(question?.options) ? question.options.length : 0;
}

function handleLetterSelection(event) {
  if (currentMode === "review") return false;
  const key = String(event.key || "").toLowerCase();
  const keyMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
  if (!(key in keyMap)) return false;

  const index = keyMap[key];
  if (index >= getCurrentOptionCount()) return false;
  selectOption(index);
  return true;
}

function moveSelectionByArrow(delta) {
  if (currentMode === "review") return false;
  const optionCount = getCurrentOptionCount();
  if (!optionCount) return false;

  const selected = quizState.userAnswers[quizState.currentQuestionIndex];
  const base = typeof selected === "number" ? selected : delta > 0 ? -1 : 0;
  const nextIndex = (base + delta + optionCount) % optionCount;
  selectOption(nextIndex);
  return true;
}

function triggerById(id) {
  const button = document.getElementById(id);
  if (!button || button.disabled || button.classList.contains("hidden")) return false;
  button.click();
  return true;
}

function handleQuizKeyboardShortcuts(event) {
  if (!isQuizScreenActive()) return;
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  if (handleLetterSelection(event)) {
    event.preventDefault();
    return;
  }

  if (event.key === "ArrowUp") {
    if (moveSelectionByArrow(-1)) event.preventDefault();
    return;
  }

  if (event.key === "ArrowDown") {
    if (moveSelectionByArrow(1)) event.preventDefault();
    return;
  }

  if (event.key === "ArrowLeft") {
    if (triggerById("prevBtn")) event.preventDefault();
    return;
  }

  if (event.key === "ArrowRight") {
    if (triggerById("nextBtn")) event.preventDefault();
    return;
  }

  if (event.key === "Enter") {
    if (currentMode === "practice") {
      if (triggerById("submitBtn") || triggerById("nextBtn")) {
        event.preventDefault();
      }
      return;
    }
    if (triggerById("nextBtn")) {
      event.preventDefault();
    }
  }
}

let keyboardShortcutsBound = false;
function bindKeyboardShortcuts() {
  if (keyboardShortcutsBound) return;
  keyboardShortcutsBound = true;
  document.addEventListener("keydown", handleQuizKeyboardShortcuts);
}

let quizPersistenceBound = false;
function bindQuizPersistence() {
  if (quizPersistenceBound) return;
  quizPersistenceBound = true;

  window.addEventListener("beforeunload", () => {
    persistQuizRuntime();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      persistQuizRuntime();
    }
  });
}

function getFilteredQuestions() {
    switch (reviewFilter) {
        case "correct":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] === q.correct);
        case "incorrect":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] !== undefined && quizState.userAnswers[i] !== q.correct);
        case "unanswered":
            return quizState.originalQuestions.filter((q, i) => quizState.userAnswers[i] === undefined);
        default:
            return quizState.originalQuestions;
    }
}

document.getElementById("reviewAllBtn").onclick = () => applyReviewFilter("all");
document.getElementById("reviewCorrectBtn").onclick = () => applyReviewFilter("correct");
document.getElementById("reviewIncorrectBtn").onclick = () => applyReviewFilter("incorrect");
document.getElementById("reviewUnansweredBtn").onclick = () => applyReviewFilter("unanswered");
bindKeyboardShortcuts();
bindQuizPersistence();

function showReviewControls() {
    const reviewControls = document.getElementById("reviewControls");
    const reviewNavigator = document.getElementById("reviewNavigator");
    const reviewFilters = document.getElementById("reviewFilters");

    if (reviewControls && reviewNavigator) {
        if (reviewContext !== "session") {
            reviewControls.classList.add("hidden");
            return;
        }

        reviewControls.classList.remove("hidden");
        reviewNavigator.innerHTML = "";

        if (reviewFilters) {
            reviewFilters.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
            const activeMap = {
                all: "reviewAllBtn",
                correct: "reviewCorrectBtn",
                incorrect: "reviewIncorrectBtn",
                unanswered: "reviewUnansweredBtn",
            };
            const activeChip = document.getElementById(activeMap[reviewFilter]);
            if (activeChip) activeChip.classList.add("active");
        }

        quizState.allQuestions.forEach((question, index) => {
            const navBtn = document.createElement("button");
            navBtn.className = "nav-btn";
            navBtn.textContent = index + 1;
            navBtn.onclick = () => jumpToQuestion(index);

            const originalIndex = quizState.originalQuestions.indexOf(question);
            const answer = quizState.userAnswers[originalIndex];

            if (answer === undefined) {
                navBtn.classList.add("unanswered");
            } else if (answer === question.correct) {
                navBtn.classList.add("correct");
            } else {
                navBtn.classList.add("incorrect");
            }

            if (index === quizState.currentQuestionIndex) {
                navBtn.classList.add("current");
            }

            reviewNavigator.appendChild(navBtn);
        });
    }
}

function showQuestionMap() {
    const questionMap = document.getElementById("questionMap");

    if (questionMap) {
        questionMap.classList.remove("hidden");
        questionMap.innerHTML = "";

        quizState.allQuestions.forEach((_, index) => {
            const navBtn = document.createElement("button");
            navBtn.className = "nav-btn";
            navBtn.textContent = index + 1;
            navBtn.onclick = () => jumpToQuestion(index);

            if (quizState.userAnswers[index] !== undefined) {
                navBtn.classList.add("answered");
            }

            if (index === quizState.currentQuestionIndex) {
                navBtn.classList.add("current");
            }

            questionMap.appendChild(navBtn);
        });
    }
}

// Initialize the quiz
function initializeQuiz(options = {}) {
  const {
    preserveAnswers = false,
    context = "study",
    keepOriginalQuestions = false,
    restoreState = null,
  } = options;

  reviewContext = context;
  if (!keepOriginalQuestions) {
    quizState.originalQuestions = [...quizState.allQuestions];
  }
  quizState.score = 0;
  const totalQuestions = quizState.allQuestions.length;
  if (restoreState && typeof restoreState === "object") {
    quizState.currentQuestionIndex = clampIndex(restoreState.currentQuestionIndex, totalQuestions);
    quizState.userAnswers = normalizeRuntimeAnswers(restoreState.userAnswers, totalQuestions);
    quizState.feedbackShown = normalizeRuntimeFeedback(restoreState.feedbackShown, totalQuestions);
  } else {
    quizState.currentQuestionIndex = 0;
    if (!preserveAnswers) {
      quizState.userAnswers = [];
    } else {
      quizState.userAnswers = normalizeRuntimeAnswers(quizState.userAnswers, totalQuestions);
    }
    // Initialize feedbackShown array to track if feedback has been shown for each question
    quizState.feedbackShown = new Array(totalQuestions).fill(false);
  }

  // Show the quiz screen first, then set up timer
  showScreen("quizScreen");

  // Now that the screen is shown, get DOM elements
  getDOMElements();

  if (currentMode === "review" && reviewContext === "session") {
    showReviewControls();
    const questionMap = document.getElementById("questionMap");
    if (questionMap) {
      questionMap.classList.add("hidden");
    }
  } else {
    const reviewControls = document.getElementById("reviewControls");
    if (reviewControls) {
      reviewControls.classList.add("hidden");
    }
    showQuestionMap();
  }

  // Set up timer if in exam mode
  const timerContainer = document.getElementById("timerDisplay");
  const timerBadge = timerContainer ? timerContainer.querySelector(".timer-badge") : null;
  if (currentMode === "exam") {
    const maxExamTime = getConfiguredExamTimeLimitSeconds(currentTopic, quizState.allQuestions.length);
    if (restoreState && Number.isFinite(Number(restoreState.timeLeft))) {
      quizState.timeLeft = Math.max(0, Math.min(maxExamTime, Number(restoreState.timeLeft)));
    } else {
      quizState.timeLeft = maxExamTime;
    }
    clearInterval(quizState.timer); // Clear any existing timer before starting a new one
    startTimer();

    // Show and style exam mode specific UI
    if (timerContainer) {
      timerContainer.classList.remove("hidden");
      timerContainer.classList.add("modern-timer");
      timerContainer.setAttribute("title", "Remaining time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Timer";
    }
    updatePracticePacingNotice();
  } else if (currentMode === "practice") {
    if (restoreState && Number.isFinite(Number(restoreState.timeLeft))) {
      quizState.timeLeft = Math.max(0, Number(restoreState.timeLeft));
    } else {
      quizState.timeLeft = 0;
    }
    clearInterval(quizState.timer);
    startTimer();

    if (timerContainer) {
      timerContainer.classList.remove("hidden");
      timerContainer.classList.add("modern-timer");
      timerContainer.setAttribute("title", "Elapsed time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Elapsed";
    }
    updatePracticePacingNotice();
  } else {
    clearInterval(quizState.timer);
    quizState.timeLeft = 0;
    updateTimerDisplay();

    // Hide timer for non-exam modes
    if (timerContainer) {
      timerContainer.classList.add("hidden");
      timerContainer.classList.remove("modern-timer");
      timerContainer.setAttribute("title", "Remaining time");
    }
    if (timerBadge) {
      timerBadge.textContent = "Timer";
    }
    updatePracticePacingNotice();
  }
  // Remove loading indicator if present
  const quizContainer = document.getElementById("quizScreen");
  const loadingEl = quizContainer
    ? quizContainer.querySelector(".loading")
    : null;
  if (loadingEl) loadingEl.remove();

  // Update topic title
  const topicTitleElement = document.getElementById("quizTopicTitle");
  if (topicTitleElement && currentTopic) {
    topicTitleElement.textContent = "Topic: " + getDisplayTopicName(currentTopic);
  }
  updateQuizSessionEstimate();

  showQuestion();

  // Initialize progress bar
  updateProgress();
  persistQuizRuntime();
}












































