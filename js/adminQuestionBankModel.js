// Pure model helpers for the admin Question Bank panel (js/adminQuestionBank.js).
// Kept dependency-free so Node unit tests can import them without touching the
// browser import chain (same pattern as appFeedbackView.js).

export const QUESTION_BANK_MAX_STEM_LENGTH = 2000;
export const QUESTION_BANK_MAX_EXPLANATION_LENGTH = 4000;
export const QUESTION_BANK_MAX_OPTIONS = 6;
export const QUESTION_BANK_DIFFICULTY_VALUES = ["easy", "medium", "hard"];
export const QUESTION_BANK_LIST_RENDER_LIMIT = 150;

// Client-side mirror of the Worker's adminSaveQuestionEdit validation so the
// admin sees mistakes before a round-trip. The Worker re-validates; this is
// UX, not security.
export function normalizeQuestionBankFormValues(form, { staticQuestion = null } = {}) {
  const errors = [];
  const stem = String(form?.question || "").trim();
  if (!stem) errors.push("The question stem is required.");
  if (stem.length > QUESTION_BANK_MAX_STEM_LENGTH) {
    errors.push(`The question stem must be ${QUESTION_BANK_MAX_STEM_LENGTH} characters or fewer.`);
  }

  const options = Array.isArray(form?.options) ? form.options.map((option) => String(option || "").trim()) : [];
  if (options.length < 2 || options.length > QUESTION_BANK_MAX_OPTIONS) {
    errors.push(`A question must have between 2 and ${QUESTION_BANK_MAX_OPTIONS} answer options.`);
  } else if (options.some((option) => !option)) {
    errors.push("Every answer option needs non-empty text.");
  }

  const correct = Number(form?.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    errors.push("Select which option is correct.");
  }

  const explanation = String(form?.explanation || "").trim();
  if (!explanation) errors.push("An explanation is required.");
  if (explanation.length > QUESTION_BANK_MAX_EXPLANATION_LENGTH) {
    errors.push(`The explanation must be ${QUESTION_BANK_MAX_EXPLANATION_LENGTH} characters or fewer.`);
  }

  if (staticQuestion && Array.isArray(staticQuestion.options) && options.length && options.length !== staticQuestion.options.length) {
    errors.push("Option count must not change — rewrite or reorder the existing options instead.");
  }

  const difficulty = QUESTION_BANK_DIFFICULTY_VALUES.includes(String(form?.difficulty || "").toLowerCase())
    ? String(form.difficulty).toLowerCase()
    : String(staticQuestion?.difficulty || "medium").toLowerCase();
  const reviewStatus = String(form?.reviewStatus || "approved").toLowerCase() === "needs_review" ? "needs_review" : "approved";

  return {
    errors,
    value: {
      question: stem,
      options,
      correct,
      explanation,
      difficulty,
      reviewStatus,
    },
  };
}

// Filter + cap the bank list render. `questions` is a Map of questionId ->
// { question, subcategoryId, subcategoryName }.
export function filterQuestionBankQuestions({ questions, query = "", subcategoryFilter = "all", limit = QUESTION_BANK_LIST_RENDER_LIMIT }) {
  const needle = String(query || "").trim().toLowerCase();
  const out = [];
  const source = questions instanceof Map ? questions.entries() : [];
  for (const [questionId, entry] of source) {
    if (subcategoryFilter !== "all" && String(entry?.subcategoryId || "") !== subcategoryFilter) continue;
    if (needle) {
      const haystack = `${questionId} ${entry?.question?.question || ""}`.toLowerCase();
      if (!haystack.includes(needle)) continue;
    }
    out.push({ questionId, ...entry });
    if (out.length >= limit) break;
  }
  return out;
}
