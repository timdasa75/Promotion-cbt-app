const DEFAULT_QUESTION_COUNT = 40;
const QUESTION_COUNT_PRESETS = [10, 20, 40, 60, 80];
const DIFFICULTY_ORDER = ["easy", "medium", "hard"];
const QUESTION_FOCUS_OPTIONS = ["balanced", "weak_areas"];
const TARGET_GLBAND_OPTIONS = ["general", "gl_14_15", "gl_15_16", "gl_16_17"];
export const TIMED_TOPIC_TEST_SECONDS_PER_QUESTION = 45;

function normalizeDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DIFFICULTY_ORDER.includes(normalized) ? normalized : "";
}

function normalizeSourceDocument(value) {
  return String(value || "").trim();
}

function normalizeQuestionFocus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return QUESTION_FOCUS_OPTIONS.includes(normalized) ? normalized : "balanced";
}

function normalizeTargetGlBand(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "_");

  if (!normalized || normalized === "general") return "general";
  if (normalized.startsWith("gl") && !normalized.startsWith("gl_")) {
    const nextValue = normalized.replace(/^gl/, "gl_");
    return TARGET_GLBAND_OPTIONS.includes(nextValue) ? nextValue : "general";
  }
  return TARGET_GLBAND_OPTIONS.includes(normalized) ? normalized : "general";
}

function toPositiveInteger(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function getDefaultQuestionCount(totalQuestions, fallbackValue = DEFAULT_QUESTION_COUNT) {
  const total = toPositiveInteger(totalQuestions);
  const fallback = toPositiveInteger(fallbackValue) || DEFAULT_QUESTION_COUNT;
  if (!total) return fallback;
  return Math.min(fallback, total);
}

/**
 * Resolve the effective question count for a study session after applying defaults, caps, and the special 'all' sentinel.
 * This lets setup screens accept loose input while quiz generation always receives a concrete safe count.
 */
export function resolveStudyQuestionCount(filters = {}, options = {}) {
  const totalQuestions = toPositiveInteger(options?.totalQuestions);
  const defaultQuestionCount = getDefaultQuestionCount(
    totalQuestions,
    options?.defaultQuestionCount,
  );
  const normalized = normalizeStudyFilters(filters, {
    totalQuestions,
    defaultQuestionCount,
  });

  if (normalized.questionCount === "all") {
    return totalQuestions || defaultQuestionCount;
  }

  return toPositiveInteger(normalized.questionCount) || defaultQuestionCount;
}

export function getTimedTopicTestDurationSeconds(questionCount = 0) {
  const safeQuestionCount = toPositiveInteger(questionCount) || 0;
  return safeQuestionCount * TIMED_TOPIC_TEST_SECONDS_PER_QUESTION;
}

export function formatSessionDurationLabel(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec`);
  }

  return parts.join(" ");
}

/**
 * Normalize raw study-filter input into the canonical filter shape used across setup, persistence, and question selection.
 * Centralizing this prevents the app from drifting into slightly different filter semantics in different screens.
 */
export function normalizeStudyFilters(filters = {}, options = {}) {
  const totalQuestions = toPositiveInteger(options?.totalQuestions);
  const defaultQuestionCount = getDefaultQuestionCount(
    totalQuestions,
    options?.defaultQuestionCount,
  );

  const difficulty = normalizeDifficulty(filters?.difficulty) || "all";
  const sourceDocument = normalizeSourceDocument(filters?.sourceDocument) || "all";
  const questionFocus = normalizeQuestionFocus(filters?.questionFocus);
  const targetGlBand = normalizeTargetGlBand(filters?.targetGlBand);

  const rawQuestionCount = String(filters?.questionCount || "").trim().toLowerCase();
  let questionCount = defaultQuestionCount;
  if (rawQuestionCount === "all") {
    questionCount = "all";
  } else {
    const parsed = toPositiveInteger(filters?.questionCount);
    if (parsed) {
      questionCount = totalQuestions ? Math.min(parsed, totalQuestions) : parsed;
    }
  }

  return {
    difficulty,
    sourceDocument,
    questionCount,
    questionFocus,
    targetGlBand,
  };
}

/**
 * Inspect a question pool and derive the filter options that should be shown to the user for that specific session.
 * The result includes both the available choices and the normalized defaults that fit the current pool.
 */
export function summarizeStudyFilterOptions(questions = [], options = {}) {
  const items = Array.isArray(questions) ? questions : [];
  const totalQuestions = items.length;
  const difficultySet = new Set();
  const sourceDocumentSet = new Set();
  const targetGlBandSet = new Set();

  items.forEach((question) => {
    const difficulty = normalizeDifficulty(question?.difficulty);
    if (difficulty) {
      difficultySet.add(difficulty);
    }

    const sourceDocument = normalizeSourceDocument(question?.sourceDocument);
    if (sourceDocument) {
      sourceDocumentSet.add(sourceDocument);
    }

    const glBands = Array.isArray(question?.glBands) ? question.glBands : [];
    glBands.forEach((entry) => {
      const normalized = normalizeTargetGlBand(entry);
      if (normalized && normalized !== "general") {
        targetGlBandSet.add(normalized);
      }
    });
  });

  const questionCountOptions = QUESTION_COUNT_PRESETS.filter((value) => value < totalQuestions);
  const defaultQuestionCount = getDefaultQuestionCount(
    totalQuestions,
    options?.defaultQuestionCount,
  );
  if (
    toPositiveInteger(defaultQuestionCount) &&
    defaultQuestionCount < totalQuestions &&
    !questionCountOptions.includes(defaultQuestionCount)
  ) {
    questionCountOptions.push(defaultQuestionCount);
  }
  questionCountOptions.sort((left, right) => left - right);

  return {
    totalQuestions,
    difficulties: DIFFICULTY_ORDER.filter((entry) => difficultySet.has(entry)),
    sourceDocuments: Array.from(sourceDocumentSet.values()).sort((left, right) =>
      left.localeCompare(right),
    ),
    questionFocusOptions: [...QUESTION_FOCUS_OPTIONS],
    targetGlBandOptions: TARGET_GLBAND_OPTIONS.filter(
      (entry) => entry === "general" || targetGlBandSet.has(entry),
    ),
    questionCountOptions,
    defaultQuestionCount,
    defaults: normalizeStudyFilters(options?.currentFilters, {
      totalQuestions,
      defaultQuestionCount,
    }),
  };
}

/**
 * Apply the normalized study filters to a question list in the same order the setup UI promises them: difficulty, source document, then question-count truncation.
 */
export function applyStudyFilters(questions = [], filters = {}) {
  const items = Array.isArray(questions) ? [...questions] : [];
  const normalized = normalizeStudyFilters(filters, { totalQuestions: items.length });

  let filtered = items;

  if (normalized.difficulty !== "all") {
    filtered = filtered.filter(
      (question) => normalizeDifficulty(question?.difficulty) === normalized.difficulty,
    );
  }

  if (normalized.sourceDocument !== "all") {
    filtered = filtered.filter(
      (question) => normalizeSourceDocument(question?.sourceDocument) === normalized.sourceDocument,
    );
  }

  if (normalized.questionCount !== "all" && filtered.length > normalized.questionCount) {
    filtered = filtered.slice(0, normalized.questionCount);
  }

  return filtered;
}

export function hasStudyFilterChoices(availableStudyFilters = {}) {
  return (
    (Array.isArray(availableStudyFilters?.difficulties) && availableStudyFilters.difficulties.length > 1) ||
    (Array.isArray(availableStudyFilters?.sourceDocuments) && availableStudyFilters.sourceDocuments.length > 1) ||
    (Array.isArray(availableStudyFilters?.questionCountOptions) && availableStudyFilters.questionCountOptions.length > 0) ||
    (Array.isArray(availableStudyFilters?.questionFocusOptions) && availableStudyFilters.questionFocusOptions.length > 1) ||
    (Array.isArray(availableStudyFilters?.targetGlBandOptions) && availableStudyFilters.targetGlBandOptions.length > 1)
  );
}

export function formatDifficultyFilterLabel(value) {
  const difficulty = normalizeDifficulty(value);
  if (!difficulty) return "";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export function formatQuestionFocusLabel(value) {
  const normalized = normalizeQuestionFocus(value);
  if (normalized === "weak_areas") return "Reinforce Weak Areas";
  return "Balanced Mix";
}

export function formatTargetGlBandLabel(value) {
  const normalized = normalizeTargetGlBand(value);
  if (normalized === "general") return "General";
  return normalized.replace(/^gl_/, "GL ").replace("_", "-");
}

