// metrics.js - pure score and progress helpers

function toIsoDay(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

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
