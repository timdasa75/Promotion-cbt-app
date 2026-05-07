import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAnalyticsSnapshot, getAnalyticsReadinessState } from "../../js/appAnalytics.js";

test("buildAnalyticsSnapshot composes shared analytics helpers into one stable snapshot", () => {
  const attempts = [
    {
      attemptId: "a1",
      topicId: "psr",
      topicName: "Public Service Rules",
      mode: "practice",
      scorePercentage: 60,
      totalQuestions: 20,
      createdAt: "2026-05-06T09:00:00Z",
      subcategoryBreakdown: [
        { subcategoryId: "ethics", subcategoryName: "Ethics", correct: 2, answered: 4, total: 4 },
      ],
      difficultyBreakdown: [
        { difficulty: "medium", correct: 2, answered: 4, total: 4 },
      ],
    },
    {
      attemptId: "a2",
      topicId: "mock_exam",
      templateName: "General Mock",
      mode: "exam",
      scorePercentage: 80,
      totalQuestions: 40,
      createdAt: "2026-05-07T09:00:00Z",
      sourceTopicBreakdown: [
        { topicId: "psr", topicName: "Public Service Rules", accuracy: 70, total: 5 },
        { topicId: "proc", topicName: "Public Procurement", accuracy: 40, total: 6 },
      ],
      subcategoryBreakdown: [
        { subcategoryId: "procurement", subcategoryName: "Procurement", correct: 1, answered: 3, total: 3 },
      ],
      difficultyBreakdown: [
        { difficulty: "hard", correct: 1, answered: 3, total: 3 },
      ],
      unansweredCount: 1,
      timeTakenSec: 2300,
    },
  ];

  const snapshot = buildAnalyticsSnapshot(attempts, {
    topics: [
      { id: "psr", name: "Public Service Rules" },
      { id: "proc", name: "Public Procurement" },
    ],
    isIncludedTopicId: (topicId) => topicId !== "mock_exam",
    getFallbackTopicName: (topicId) => `Fallback ${topicId}`,
    mockExamTopicId: "mock_exam",
    getAttemptHeadline: (attempt) => attempt.templateName || attempt.topicName || attempt.topicId,
    getAttemptTopicLabel: (attempt) => attempt.topicName || attempt.topicId,
    getWhenLabel: (attempt) => `when:${attempt.attemptId}`,
    getDayLabel: (date) => date.toISOString().slice(8, 10),
    getDateLabel: (date) => date.toISOString().slice(5, 10),
    getWeeklyActivityClass: (count) => `count-${count}`,
    getAttemptTimingSignal: (attempt) => attempt ? { severity: "high", unansweredCount: 1, remainingSeconds: 400 } : null,
    buildRecommendation: (insights) => ({
      title: `Next: ${insights.weakestTopic?.topicName || "none"}`,
      confidenceTone: "medium",
    }),
  });

  assert.equal(snapshot.totalAttempts, 2);
  assert.equal(snapshot.averageScore, 70);
  assert.equal(snapshot.latestAttempt?.attemptId, "a2");
  assert.equal(snapshot.topicMastery[0]?.topicId, "psr");
  assert.equal(snapshot.topicMastery[0]?.averageScore, 65);
  assert.equal(snapshot.topicMastery[1]?.topicId, "proc");
  assert.equal(snapshot.weakestTopic?.topicId, "proc");
  assert.equal(snapshot.recommendedTopicId, "proc");
  assert.equal(snapshot.weakestSubcategory?.subcategoryId, "procurement");
  assert.equal(snapshot.weakestDifficulty?.difficulty, "hard");
  assert.equal(snapshot.latestMockWeakTopic?.topicId, "proc");
  assert.equal(snapshot.recentScoreSignal?.direction, "improving");
  assert.equal(snapshot.latestTimingSignal?.severity, "high");
  assert.equal(snapshot.recommendation?.title, "Next: Public Procurement");
  assert.equal(snapshot.trendItems[0]?.id, "a2");
  assert.equal(snapshot.weeklyConsistency[snapshot.weeklyConsistency.length - 1]?.count, 1);
});

test("getAnalyticsReadinessState classifies readiness bands from snapshot summaries", () => {
  assert.deepEqual(getAnalyticsReadinessState({ totalAttempts: 0 }), {
    tone: "low",
    title: "Build your first baseline",
    body: "Complete a scored session to unlock readiness signals and a clearer next step.",
  });

  assert.deepEqual(getAnalyticsReadinessState({ totalAttempts: 4, averageScore: 78, streakDays: 3 }), {
    tone: "high",
    title: "Ready for exam-style drills",
    body: "Your recent scores and consistency are strong enough for more timed reinforcement.",
  });

  assert.deepEqual(getAnalyticsReadinessState({ totalAttempts: 4, averageScore: 64, streakDays: 1 }), {
    tone: "medium",
    title: "Solid foundation, keep tightening weak areas",
    body: "You are building a good base, but the weakest topics still need guided reinforcement.",
  });

  assert.deepEqual(getAnalyticsReadinessState({ totalAttempts: 3, averageScore: 42, streakDays: 2 }), {
    tone: "low",
    title: "Rebuild weak areas before timed pressure",
    body: "Use practice and review to lift weak areas before leaning too hard on timed sessions.",
  });
});
