const DEFAULT_QUESTION_COUNT = 40;
const QUESTION_COUNT_PRESETS = [10, 20, 40, 60, 80];
const DIFFICULTY_ORDER = ["easy", "medium", "hard"];
const QUESTION_FOCUS_OPTIONS = ["balanced", "weak_areas"];
const TARGET_GLBAND_OPTIONS = ["general", "gl_14_15", "gl_15_16", "gl_16_17"];
export const TIMED_TOPIC_TEST_SECONDS_PER_QUESTION = 45;

/**
 * Normalize a difficulty value to a canonical difficulty string.
 * @param {*} value - Input value to normalize.
 * @returns {string} One of "easy", "medium", or "hard" if the input matches; otherwise an empty string.
 */
function normalizeDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DIFFICULTY_ORDER.includes(normalized) ? normalized : "";
}

/**
 * Normalize a source document value to a trimmed string.
 * @param {*} value - The input value (may be string, null, undefined, or other); nullish values yield an empty string.
 * @returns {string} The input coerced to a string and trimmed of surrounding whitespace.
 */
function normalizeSourceDocument(value) {
  return String(value || "").trim();
}

/**
 * Normalize a question-focus value into a canonical option.
 * @param {*} value - Candidate focus value (string-like); may be nullish.
 * @returns {"balanced"|"weak_areas"} The normalized focus option: `"weak_areas"` when the input matches that option, otherwise `"balanced"`.
 */
function normalizeQuestionFocus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return QUESTION_FOCUS_OPTIONS.includes(normalized) ? normalized : "balanced";
}

/**
 * Normalize a candidate GL-band identifier into a canonical value accepted by the system.
 * @param {string|any} value - Input GL-band value (may be null/undefined, mixed case, contain whitespace or dashes).
 * @returns {string} `'general'` or a canonical GL-band string from TARGET_GLBAND_OPTIONS (e.g., `gl_14_15`).
 */
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

/**
 * Convert a value into a positive integer or return null.
 * @param {*} value - Value to coerce to a positive integer.
 * @returns {number|null} The integer greater than zero if coercion succeeds, otherwise `null`.
 */
function toPositiveInteger(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

/**
 * Choose a default question count capped by the total available questions.
 * @param {*} totalQuestions - Total number of available questions; only a positive integer is considered valid.
 * @param {*} [fallbackValue=DEFAULT_QUESTION_COUNT] - Fallback count used when `totalQuestions` is invalid; coerced to a positive integer and ultimately falls back to `DEFAULT_QUESTION_COUNT` if invalid.
 * @returns {number} The fallback count limited to `totalQuestions` when `totalQuestions` is a positive integer; otherwise the resolved fallback.
 */
function getDefaultQuestionCount(totalQuestions, fallbackValue = DEFAULT_QUESTION_COUNT) {
  const total = toPositiveInteger(totalQuestions);
  const fallback = toPositiveInteger(fallbackValue) || DEFAULT_QUESTION_COUNT;
  if (!total) return fallback;
  return Math.min(fallback, total);
}

/**
 * Determine the effective number of study questions to use given filters and options.
 *
 * Normalizes filters and options, treats a `questionCount` of `"all"` as the full available set,
 * and otherwise returns a positive integer capped by available total questions or the provided defaults.
 *
 * @param {Object} [filters={}] - Filter values that may include `questionCount` (number or `"all"`).
 * @param {Object} [options={}] - Resolution options.
 * @param {number|null} [options.totalQuestions] - Total available questions; used to cap results when present.
 * @param {number} [options.defaultQuestionCount] - Fallback question count used when filters do not specify a valid value.
 * @returns {number} The resolved question count: `totalQuestions` when `questionCount` is `"all"` (or the default if total is missing), or a positive integer parsed from filters or defaults.
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

/**
 * Compute the total duration in seconds for a timed topic test based on the number of questions.
 * @param {number} questionCount - Number of questions; non-integer, non-positive, or invalid values are treated as 0.
 * @returns {number} Total duration in seconds for the test.
 */
export function getTimedTopicTestDurationSeconds(questionCount = 0) {
  const safeQuestionCount = toPositiveInteger(questionCount) || 0;
  return safeQuestionCount * TIMED_TOPIC_TEST_SECONDS_PER_QUESTION;
}

/**
 * Format a duration given in seconds into a compact "hr/min/sec" label.
 * @param {number} totalSeconds - Total duration in seconds; non-numeric or negative values are treated as 0.
 * @returns {string} A label like "1 hr 5 min 3 sec". Hours and minutes are included only when greater than 0; seconds are always included (e.g., "0 sec" for an input of 0).
 */
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
 * Normalize and validate study filter inputs, producing canonical filter values.
 * 
 * @param {Object} [filters={}] - Raw filter inputs (may contain difficulty, sourceDocument, questionCount, questionFocus, targetGlBand).
 * @param {Object} [options={}] - Context options used during normalization.
 * @param {number|null} [options.totalQuestions] - Total available questions used to bound numeric question counts.
 * @param {number} [options.defaultQuestionCount] - Fallback default question count when parsing fails.
 * @returns {{difficulty: string, sourceDocument: string, questionCount: number|string, questionFocus: string, targetGlBand: string}}
 *   An object with canonical filter values:
 *   - `difficulty`: normalized difficulty or `"all"`.
 *   - `sourceDocument`: normalized source document or `"all"`.
 *   - `questionCount`: a positive integer capped by `totalQuestions`, the `defaultQuestionCount`, or the string `"all"`.
 *   - `questionFocus`: normalized question focus (defaults to `"balanced"`).
 *   - `targetGlBand`: normalized target GL-band (defaults to `"general"`).
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
 * Produce available study filter option sets and defaults derived from a list of questions.
 * @param {Array} questions - Array of question objects to scan; invalid inputs are treated as an empty array.
 * @param {Object} [options] - Optional settings.
 * @param {number} [options.defaultQuestionCount] - Fallback default question count to consider when building count options.
 * @param {Object} [options.currentFilters] - Current filter values to normalize into returned `defaults`.
 * @returns {Object} An object describing available filter choices and defaults:
 *  - totalQuestions {number} — total number of input questions.
 *  - difficulties {Array<string>} — subset of canonical difficulties (`DIFFICULTY_ORDER`) present in the data, in canonical order.
 *  - sourceDocuments {Array<string>} — unique source document names sorted alphabetically.
 *  - questionFocusOptions {Array<string>} — available question focus modes (always `["balanced","weak_areas"]`).
 *  - targetGlBandOptions {Array<string>} — includes `"general"` plus any normalized GL bands found.
 *  - questionCountOptions {Array<number>} — numeric question-count presets (and possibly the default) capped below totalQuestions and sorted ascending.
 *  - defaultQuestionCount {number} — computed default question count.
 *  - defaults {Object} — normalized filter values derived from `options.currentFilters` using the computed totals and default.
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
 * Filters and limits a list of questions according to provided study filters.
 * @param {Array<Object>} questions - Array of question objects to filter.
 * @param {Object} filters - Filter settings; supported keys: `difficulty` (string or `"all"`), `sourceDocument` (string or `"all"`), and `questionCount` (number or `"all"`).
 * @returns {Array<Object>} The filtered (and possibly truncated) array of questions.
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

/**
 * Determines whether any study filter category exposes multiple or selectable choices.
 *
 * @param {Object} availableStudyFilters - Object containing available filter option arrays.
 *   Expected keys (optional): `difficulties`, `sourceDocuments`, `questionCountOptions`, `questionFocusOptions`, `targetGlBandOptions`.
 * @returns {boolean} `true` if at least one category offers more than one choice (or any question count options), `false` otherwise.
 */
export function hasStudyFilterChoices(availableStudyFilters = {}) {
  return (
    (Array.isArray(availableStudyFilters?.difficulties) && availableStudyFilters.difficulties.length > 1) ||
    (Array.isArray(availableStudyFilters?.sourceDocuments) && availableStudyFilters.sourceDocuments.length > 1) ||
    (Array.isArray(availableStudyFilters?.questionCountOptions) && availableStudyFilters.questionCountOptions.length > 0) ||
    (Array.isArray(availableStudyFilters?.questionFocusOptions) && availableStudyFilters.questionFocusOptions.length > 1) ||
    (Array.isArray(availableStudyFilters?.targetGlBandOptions) && availableStudyFilters.targetGlBandOptions.length > 1)
  );
}

/**
 * Produce a human-friendly capitalized label for a difficulty value.
 * @param {string} value - Input difficulty value; may be any string (will be normalized).
 * @returns {string} The capitalized difficulty (e.g., "Easy", "Medium", "Hard"), or an empty string if the input is not a recognized difficulty.
 */
export function formatDifficultyFilterLabel(value) {
  const difficulty = normalizeDifficulty(value);
  if (!difficulty) return "";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Produce a human-readable label for a question-focus value.
 * @param {string} value - The question focus input (e.g., "balanced" or "weak_areas"); any value is normalized first.
 * @returns {string} `"Reinforce Weak Areas"` when the normalized value is `weak_areas`, `"Balanced Mix"` otherwise.
 */
export function formatQuestionFocusLabel(value) {
  const normalized = normalizeQuestionFocus(value);
  if (normalized === "weak_areas") return "Reinforce Weak Areas";
  return "Balanced Mix";
}

/**
 * Produce a human-readable label for a target GL-band identifier.
 * @param {string} value - Raw GL-band input (e.g., "general", "gl_14_15", "gl1415"); nullish or unrecognized inputs are treated as "general".
 * @returns {string} The formatted label (e.g., "General" or "GL 14-15").
 */
export function formatTargetGlBandLabel(value) {
  const normalized = normalizeTargetGlBand(value);
  if (normalized === "general") return "General";
  return normalized.replace(/^gl_/, "GL ").replace("_", "-");
}
