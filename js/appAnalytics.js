import {
  buildDifficultyInsights,
  buildRecentScoreSignal,
  buildSubcategoryInsights,
  buildTopicMastery,
  buildTrendItems,
  buildWeeklyConsistency,
  getLatestMockWeakTopic,
} from "./analyticsShared.js";
import { calculateStreakDays, getWeakestTopicId } from "./metrics.js";

function getWeakestScoredTopic(topicMastery = []) {
  return [...(Array.isArray(topicMastery) ? topicMastery : [])]
    .filter((entry) => entry.averageScore !== null)
    .sort(
      (left, right) =>
        left.averageScore - right.averageScore ||
        right.attempts - left.attempts ||
        left.topicName.localeCompare(right.topicName),
    )[0] || null;
}

export function buildAnalyticsSnapshot(
  attempts = [],
  {
    topics = [],
    isIncludedTopicId = () => true,
    getFallbackTopicName = (topicId) => topicId,
    mockExamTopicId = "",
    getAttemptHeadline = () => "",
    getAttemptTopicLabel = () => "",
    getWhenLabel = () => "",
    getDayLabel = (date) => date.toLocaleDateString(undefined, { weekday: "short" }),
    getDateLabel = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    getWeeklyActivityClass = () => "",
    getAttemptTimingSignal = () => null,
    buildRecommendation = () => null,
  } = {},
) {
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const totalAttempts = safeAttempts.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(
          safeAttempts.reduce(
            (sum, attempt) => sum + Number(attempt?.scorePercentage || 0),
            0,
          ) / totalAttempts,
        )
      : null;
  const streakDays = calculateStreakDays(safeAttempts);
  const latestAttempt = totalAttempts ? safeAttempts[totalAttempts - 1] : null;
  const trendItems = buildTrendItems(safeAttempts, {
    getHeadline: (attempt) => getAttemptHeadline(attempt),
    getTopicLabel: (attempt) => getAttemptTopicLabel(attempt),
    getWhenLabel: (attempt) => getWhenLabel(attempt),
  });
  const weeklyConsistency = buildWeeklyConsistency(safeAttempts, {
    getDayLabel,
    getDateLabel,
    getClassName: getWeeklyActivityClass,
  });
  const topicMastery = buildTopicMastery(safeAttempts, {
    topics,
    isIncludedTopicId: isIncludedTopicId,
    getFallbackTopicName,
    mockExamTopicId,
  });
  const weakestTopic = getWeakestScoredTopic(topicMastery);
  const fallbackWeakestId = getWeakestTopicId(safeAttempts);
  const recommendedTopicId =
    weakestTopic?.topicId ||
    (isIncludedTopicId(fallbackWeakestId) ? fallbackWeakestId : null);
  const weakestSubcategory = buildSubcategoryInsights(safeAttempts)[0] || null;
  const weakestDifficulty = buildDifficultyInsights(safeAttempts)[0] || null;
  const latestMockWeakTopic = getLatestMockWeakTopic(latestAttempt, mockExamTopicId);
  const recentScoreSignal = buildRecentScoreSignal(safeAttempts);
  const latestTimingSignal = getAttemptTimingSignal(latestAttempt);
  const recommendation = buildRecommendation({
    attempts: safeAttempts,
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
    attempts: safeAttempts,
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

export function getAnalyticsReadinessState(insights) {
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
