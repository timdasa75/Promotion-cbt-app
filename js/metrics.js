/**
 * Convert a value to an ISO date string in YYYY-MM-DD format.
 * @param {*} value - The value to convert to a date (e.g., a Date, timestamp, or date string).
 * @returns {string} The date as `YYYY-MM-DD` if the input represents a valid date, otherwise an empty string.
 */

function toIsoDay(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

/**
 * Group questions into buckets and compute per-bucket totals, answered/correct counts, and accuracy.
 * @param {Array} allQuestions - Source questions (defaults to []).
 * @param {Array} userAnswers - User answers aligned by question index (defaults to []).
 * @param {Function} resolveBucket - Function(question, index) that returns an object with `id` and optional `label`; buckets with a falsy trimmed `id` are ignored.
 * @param {Function} [sortComparator] - Optional comparator used to sort the returned array.
 * @returns {Array<Object>} Array of bucket objects with fields:
 *  - `id` (string)
 *  - `label` (string)
 *  - `total` (number) — total questions in the bucket
 *  - `answered` (number) — number of answered questions
 *  - `correct` (number) — number of correct answers
 *  - `wrong` (number) — max(0, answered - correct)
 *  - `unanswered` (number) — max(0, total - answered)
 *  - `accuracy` (number) — percent correct among answered (0–100)
 */
function buildBreakdownByBucket(allQuestions = [], userAnswers = [], resolveBucket, sortComparator) {
  const questions = Array.isArray(allQuestions) ? allQuestions : [];
  const answers = Array.isArray(userAnswers) ? userAnswers : [];
  const grouped = new Map();

  questions.forEach((question, index) => {
    const bucket = typeof resolveBucket === "function" ? resolveBucket(question, index) : null;
    const id = String(bucket?.id || "").trim();
    if (!id) return;

    const label = String(bucket?.label || id).trim();
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        label,
        total: 0,
        answered: 0,
        correct: 0,
      });
    }

    const entry = grouped.get(id);
    entry.total += 1;
    const answer = answers[index];
    if (answer === undefined || answer === null) {
      return;
    }

    entry.answered += 1;
    if (answer === question?.correct) {
      entry.correct += 1;
    }
  });

  const breakdown = Array.from(grouped.values()).map((entry) => {
    const wrong = Math.max(0, entry.answered - entry.correct);
    const unanswered = Math.max(0, entry.total - entry.answered);
    const accuracy = entry.answered > 0 ? Math.round((entry.correct / entry.answered) * 100) : 0;
    return {
      ...entry,
      wrong,
      unanswered,
      accuracy,
    };
  });

  if (typeof sortComparator === "function") {
    breakdown.sort(sortComparator);
  }

  return breakdown;
}

/**
 * Computes the current consecutive-day streak of attempts based on their creation dates.
 *
 * Iterates backward from `now` (inclusive) day-by-day and counts how many consecutive calendar days have at least one attempt. Invalid or blank `createdAt` values are ignored. A missing entry on today does not break the streak check for subsequent days, but any missing day after the first day checked breaks the streak.
 *
 * @param {Array<Object>} attempts - Array of attempt objects; each may contain a `createdAt` value parseable by Date.
 * @param {Date} [now=new Date()] - Reference date to compute the streak from.
 * @returns {number} The number of consecutive days (including `now` if present) with at least one attempt; 0 when `attempts` is empty or contains no valid dates.
 */
export function calculateStreakDays(attempts = [], now = new Date()) {
  if (!Array.isArray(attempts) || attempts.length === 0) return 0;

  const uniqueDays = new Set(
    attempts
      .map((attempt) => toIsoDay(attempt?.createdAt))
      .filter(Boolean),
  );

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayKey = day.toISOString().slice(0, 10);
    if (uniqueDays.has(dayKey)) {
      streak += 1;
      continue;
    }
    if (i === 0) continue;
    break;
  }

  return streak;
}

export function getWeakestTopicId(attempts = []) {
  if (!Array.isArray(attempts) || attempts.length === 0) return null;

  const scoreByTopic = new Map();
  attempts.forEach((attempt) => {
    const topicId = String(attempt?.topicId || "").trim();
    if (!topicId) return;
    const existing = scoreByTopic.get(topicId) || [];
    existing.push(Number(attempt?.scorePercentage || 0));
    scoreByTopic.set(topicId, existing);
  });
  if (!scoreByTopic.size) return null;

  let weakest = null;
  scoreByTopic.forEach((scores, topicId) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (!weakest || avg < weakest.avg) weakest = { topicId, avg };
  });

  return weakest?.topicId || null;
}

/**
 * Compute aggregate scoring metrics from parallel question and answer arrays.
 *
 * @param {Array} allQuestions - Array of question objects aligned by index with `userAnswers`. Each question may include a `correct` value used for comparison.
 * @param {Array} userAnswers - Array of answers aligned by index with `allQuestions`. An entry that is `undefined` or `null` is treated as unanswered.
 * @returns {Object} An object with aggregated scoring fields:
 *   - `correct` (number): count of answers that exactly match the corresponding question's `correct` value.
 *   - `answered` (number): count of non-`null`/`undefined` answers.
 *   - `wrong` (number): `answered - correct`.
 *   - `unanswered` (number): `total - answered`.
 *   - `total` (number): number of questions (length of `allQuestions`).
 *   - `scorePercentage` (number): rounded percentage of `correct` out of `total` (0 if `total` is 0).
 *   - `accuracyRate` (number): rounded percentage of `correct` out of `answered` (0 if `answered` is 0).
 *   - `wrongRate` (number): rounded percentage of `wrong` out of `total` (0 if `total` is 0).
 *   - `unansweredRate` (number): rounded percentage of `unanswered` out of `total` (0 if `total` is 0).
 */
export function calculateScoreFromAnswers(allQuestions = [], userAnswers = []) {
  const questions = Array.isArray(allQuestions) ? allQuestions : [];
  const answers = Array.isArray(userAnswers) ? userAnswers : [];
  const total = questions.length;

  let correct = 0;
  let answered = 0;
  for (let i = 0; i < total; i++) {
    const answer = answers[i];
    if (answer === undefined || answer === null) continue;
    answered += 1;
    if (answer === questions[i]?.correct) {
      correct += 1;
    }
  }

  const wrong = answered - correct;
  const unanswered = total - answered;
  const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const accuracyRate = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const wrongRate = total > 0 ? Math.round((wrong / total) * 100) : 0;
  const unansweredRate = total > 0 ? Math.round((unanswered / total) * 100) : 0;

  return {
    correct,
    answered,
    wrong,
    unanswered,
    total,
    scorePercentage,
    accuracyRate,
    wrongRate,
    unansweredRate,
  };
}

/**
 * Produce a breakdown of questions grouped by source subcategory with counts and accuracy.
 * @param {Array} [allQuestions=[]] - Array of question objects; each question may include `sourceSubcategoryId` and `sourceSubcategoryName`.
 * @param {Array} [userAnswers=[]] - Array of user answers aligned by question index; a missing or null/undefined entry is treated as unanswered.
 * @returns {Array<Object>} Array of breakdown entries where each entry contains:
 *   - `subcategoryId` (string): the bucket id (source subcategory id).
 *   - `subcategoryName` (string): the bucket label (source subcategory name or id).
 *   - `total` (number): number of questions in the subcategory.
 *   - `answered` (number): number of questions the user answered in the subcategory.
 *   - `correct` (number): number of correct answers in the subcategory.
 *   - `wrong` (number): number of answered but incorrect questions in the subcategory.
 *   - `unanswered` (number): number of unanswered questions in the subcategory.
 *   - `accuracy` (number): percentage accuracy for answered questions in the subcategory (rounded integer; 0 if none answered).
 */
export function buildSubcategoryBreakdown(allQuestions = [], userAnswers = []) {
  return buildBreakdownByBucket(
    allQuestions,
    userAnswers,
    (question) => ({
      id: question?.sourceSubcategoryId,
      label: question?.sourceSubcategoryName || question?.sourceSubcategoryId,
    }),
    (left, right) =>
      left.accuracy - right.accuracy ||
      right.total - left.total ||
      left.label.localeCompare(right.label),
  ).map((entry) => ({
    subcategoryId: entry.id,
    subcategoryName: entry.label,
    total: entry.total,
    answered: entry.answered,
    correct: entry.correct,
    wrong: entry.wrong,
    unanswered: entry.unanswered,
    accuracy: entry.accuracy,
  }));
}

/**
 * Produce a breakdown of questions grouped by difficulty.
 *
 * @param {Array} allQuestions - Array of question objects; each may contain a `difficulty` field.
 * @param {Array} userAnswers - Array of user answers aligned by index with `allQuestions`.
 * @returns {Array<Object>} Array of difficulty buckets, each with:
 *  - {string} difficulty - Normalized difficulty id (lowercase).
 *  - {number} total - Number of questions in this difficulty.
 *  - {number} answered - Number of questions the user answered.
 *  - {number} correct - Number of correct answers.
 *  - {number} wrong - Number of incorrect answers.
 *  - {number} unanswered - Number of unanswered questions.
 *  - {number} accuracy - Percentage accuracy for answered questions (0–100, rounded).
 */
export function buildDifficultyBreakdown(allQuestions = [], userAnswers = []) {
  const rank = { easy: 0, medium: 1, hard: 2 };
  return buildBreakdownByBucket(
    allQuestions,
    userAnswers,
    (question) => {
      const difficulty = String(question?.difficulty || "").trim().toLowerCase();
      if (!difficulty) return null;
      return {
        id: difficulty,
        label: difficulty,
      };
    },
    (left, right) => {
      const rankDelta = (rank[left.id] ?? 99) - (rank[right.id] ?? 99);
      if (rankDelta !== 0) return rankDelta;
      return left.label.localeCompare(right.label);
    },
  ).map((entry) => ({
    difficulty: entry.id,
    total: entry.total,
    answered: entry.answered,
    correct: entry.correct,
    wrong: entry.wrong,
    unanswered: entry.unanswered,
    accuracy: entry.accuracy,
  }));
}
