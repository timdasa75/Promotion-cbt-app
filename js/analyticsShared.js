import { formatTargetGlBandLabel } from "./studyFilters.js";

export function formatGlBandLabel(glBand) {
  return formatTargetGlBandLabel(glBand);
}

export function formatDifficultyLabel(difficulty) {
  const value = String(difficulty || "").trim().toLowerCase();
  if (!value) return "";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function getTrafficClassByPercentage(percentage) {
  if (Number(percentage) >= 70) return "traffic-green";
  if (Number(percentage) >= 50) return "traffic-amber";
  return "traffic-red";
}

export function averageAttemptScores(attempts = []) {
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

export function buildRecentScoreSignal(attempts = []) {
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

export function buildTimingSignal({
  mode = "",
  allowedSeconds = 0,
  elapsedSeconds = 0,
  unansweredCount = 0,
} = {}) {
  if (String(mode || "").trim() !== "exam") return null;

  const safeAllowedSeconds = Math.max(0, Number(allowedSeconds || 0));
  if (safeAllowedSeconds <= 0) return null;

  const safeElapsedSeconds = Math.max(0, Math.min(safeAllowedSeconds, Number(elapsedSeconds || 0)));
  const safeUnansweredCount = Math.max(0, Number(unansweredCount || 0));
  const usedRatio = safeAllowedSeconds > 0 ? safeElapsedSeconds / safeAllowedSeconds : 0;

  let severity = "steady";
  if (safeUnansweredCount > 0 || usedRatio >= 0.95) {
    severity = "high";
  } else if (usedRatio <= 0.6) {
    severity = "comfortable";
  }

  return {
    severity,
    allowedSeconds: safeAllowedSeconds,
    elapsedSeconds: safeElapsedSeconds,
    remainingSeconds: Math.max(0, safeAllowedSeconds - safeElapsedSeconds),
    usedRatio,
    unansweredCount: safeUnansweredCount,
  };
}


export function classifyRecommendationPattern({
  alignedSignalCount = 0,
  hasStrongHistory = false,
  totalAttempts = 0,
  repeatedMinAligned = 2,
  buildingMinAligned = 2,
  repeatedMinAttempts = 0,
  buildingMinAttempts = 0,
  allowStrongHistoryForBuilding = false,
} = {}) {
  const safeAlignedSignalCount = Math.max(0, Number(alignedSignalCount || 0));
  const safeTotalAttempts = Math.max(0, Number(totalAttempts || 0));
  const safeRepeatedMinAligned = Math.max(0, Number(repeatedMinAligned || 0));
  const safeBuildingMinAligned = Math.max(0, Number(buildingMinAligned || 0));
  const safeRepeatedMinAttempts = Math.max(0, Number(repeatedMinAttempts || 0));
  const safeBuildingMinAttempts = Math.max(0, Number(buildingMinAttempts || 0));
  const strongHistory = Boolean(hasStrongHistory);

  const qualifiesForRepeated =
    strongHistory &&
    safeAlignedSignalCount >= safeRepeatedMinAligned &&
    safeTotalAttempts >= safeRepeatedMinAttempts;
  if (qualifiesForRepeated) return "repeated";

  const qualifiesForBuildingByAttempts =
    safeAlignedSignalCount >= safeBuildingMinAligned &&
    safeTotalAttempts >= safeBuildingMinAttempts;
  const qualifiesForBuildingByHistory =
    allowStrongHistoryForBuilding &&
    strongHistory &&
    safeAlignedSignalCount >= safeBuildingMinAligned;
  if (qualifiesForBuildingByAttempts || qualifiesForBuildingByHistory) {
    return "building";
  }

  return "early";
}


export function buildSubcategoryInsights(attempts = []) {
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

export function buildDifficultyInsights(attempts = []) {
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

export function getLatestMockWeakTopic(attempt, mockExamTopicId = "") {
  const sourceBreakdown = Array.isArray(attempt?.sourceTopicBreakdown)
    ? attempt.sourceTopicBreakdown
    : [];
  if (String(attempt?.topicId || "").trim() !== String(mockExamTopicId || "").trim() || !sourceBreakdown.length) {
    return null;
  }

  return [...sourceBreakdown].sort(
    (left, right) =>
      Number(left?.accuracy || 0) - Number(right?.accuracy || 0) ||
      Number(right?.total || 0) - Number(left?.total || 0),
  )[0] || null;
}
