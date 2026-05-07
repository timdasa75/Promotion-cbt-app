import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDashboardRecommendationConfidence,
  buildDashboardRecommendationSignals,
  buildDashboardSetupSuggestion,
  buildDashboardSuggestionSignature,
  buildRecommendation,
  getPreferredRecommendedTopic,
} from "../../js/appRecommendations.js";

test("buildDashboardRecommendationConfidence recognizes repeated patterns from aligned evidence", () => {
  const result = buildDashboardRecommendationConfidence(
    { id: "psr", name: "Public Service Rules" },
    {
      recommendedTopicId: "psr",
      topicMastery: [{ topicId: "psr", topicName: "Public Service Rules", attempts: 5 }],
      weakestTopic: { topicId: "psr", topicName: "Public Service Rules", attempts: 5 },
      weakestSubcategory: { sessions: 3 },
      recentScoreSignal: { direction: "slipping", delta: -8 },
      latestTimingSignal: { severity: "high", unansweredCount: 2 },
      latestMockWeakTopic: { topicId: "psr", topicName: "Public Service Rules" },
      totalAttempts: 6,
    },
  );

  assert.equal(result.label, "Repeated Pattern");
  assert.equal(result.tone, "high");
});

test("buildDashboardRecommendationSignals exposes trend and pace chips", () => {
  assert.deepEqual(
    buildDashboardRecommendationSignals({
      recentScoreSignal: { direction: "slipping", delta: -6 },
      latestTimingSignal: { severity: "high", unansweredCount: 2 },
    }),
    ["Trend: Slipping 6 pts", "Pace: 2 Unanswered"],
  );
});

test("buildRecommendation composes weakest-topic guidance with pacing and difficulty notes", () => {
  const recommendation = buildRecommendation(
    {
      totalAttempts: 4,
      attempts: [{ attemptId: "a1" }],
      recommendedTopicId: "psr",
      latestAttempt: {
        attemptId: "a1",
        topicId: "mock_exam",
        glBand: "GL15_16",
        scorePercentage: 62,
      },
      weakestTopic: { topicId: "psr", topicName: "Public Service Rules", averageScore: 48, attempts: 4 },
      weakestSubcategory: { subcategoryName: "Discipline", accuracy: 42, sessions: 3 },
      weakestDifficulty: { difficulty: "hard", accuracy: 41, answered: 9 },
      latestMockWeakTopic: { topicId: "psr", topicName: "Public Service Rules", accuracy: 38 },
      recentScoreSignal: { direction: "slipping", delta: -7, latestCount: 3 },
      latestTimingSignal: { severity: "high", unansweredCount: 2 },
      topicMastery: [{ topicId: "psr", topicName: "Public Service Rules", attempts: 4 }],
    },
    {
      mockExamTopicId: "mock_exam",
      getAttemptTimingSignal: () => ({ severity: "steady" }),
      formatDifficultyLabel: (value) => String(value).toUpperCase(),
      formatSessionDurationLabel: (value) => `${value}s`,
      formatGlBandLabel: (value) => value === "GL15_16" ? "GL 15-16" : String(value || ""),
      getAttemptHeadline: () => "General Mock",
    },
  );

  assert.equal(recommendation.title, "Prioritize rebuilding with Public Service Rules.");
  assert.match(recommendation.meta, /Repeated weak spot: Discipline at 42% accuracy across 3 session\(s\)\./);
  assert.match(recommendation.meta, /HARD questions are averaging 41% accuracy\./);
  assert.match(recommendation.meta, /Recent scores have slipped 7 points across the last 3 scored session\(s\)\./);
  assert.match(recommendation.meta, /Latest timed run left 2 question\(s\) unanswered/);
  assert.match(recommendation.meta, /Latest mock profile: GL 15-16\./);
  assert.deepEqual(recommendation.signalChips, ["Trend: Slipping 7 pts", "Pace: 2 Unanswered"]);
  assert.equal(recommendation.confidenceLabel, "Repeated Pattern");
  assert.equal(recommendation.confidenceTone, "high");
});


test("getPreferredRecommendedTopic prefers unlocked recommended ids before fallbacks", () => {
  const topic = getPreferredRecommendedTopic(
    { recommendedTopicId: "psr" },
    {
      topics: [
        { id: "financial_regulations", name: "Financial Regulations" },
        { id: "psr", name: "Public Service Rules" },
      ],
      fallbackTopicId: "financial_regulations",
      isTopicUnlocked: (entry) => entry.id !== "psr",
    },
  );

  assert.equal(topic?.id, "financial_regulations");
});

test("buildDashboardSetupSuggestion suggests tighter follow-up filters for weak performance", () => {
  const suggestion = buildDashboardSetupSuggestion(
    {
      id: "psr",
      name: "Public Service Rules",
      studyFilters: { questionCount: 40, difficulty: "all", questionFocus: "all", targetGlBand: "general" },
      availableStudyFilters: {
        totalQuestions: 120,
        defaultQuestionCount: 40,
        questionCountOptions: [10, 20, 40, 60],
      },
    },
    {
      totalAttempts: 5,
      averageScore: 48,
      attempts: [{ attemptId: "a1" }],
      latestAttempt: { topicId: "mock_exam", glBand: "GL15_16" },
      weakestDifficulty: { difficulty: "hard", accuracy: 41, answered: 6 },
      weakestSubcategory: { subcategoryName: "Discipline" },
      weakestTopic: { topicName: "Public Service Rules" },
      latestMockWeakTopic: { topicName: "Public Service Rules" },
      recentScoreSignal: { direction: "slipping", delta: -5, latestCount: 3 },
      latestTimingSignal: { severity: "high", unansweredCount: 2 },
    },
    {
      normalizeStudyFilters: (filters, { defaultQuestionCount }) => ({
        questionCount: Number(filters?.questionCount || defaultQuestionCount),
        difficulty: String(filters?.difficulty || "all"),
        questionFocus: String(filters?.questionFocus || "all"),
        targetGlBand: String(filters?.targetGlBand || "general"),
      }),
      resolveStudyQuestionCount: (filters) => Number(filters?.questionCount || 40),
      getAttemptTimingSignal: () => ({ severity: "steady" }),
      formatDifficultyLabel: (value) => String(value || "").toUpperCase(),
      formatTargetGlBandLabel: (value) => value === "gl15_16" ? "GL 15-16" : String(value || ""),
      formatQuestionFocusLabel: (value) => value === "weak_areas" ? "Weak Areas" : String(value || ""),
      mockExamTopicId: "mock_exam",
      buildDashboardRecommendationConfidence: () => ({ label: "Repeated Pattern", tone: "high", description: "Strong signal" }),
      buildDashboardRecommendationSignals: () => ["Trend: Slipping 5 pts", "Pace: 2 Unanswered"],
    },
  );

  assert.equal(suggestion?.title, "Suggested Setup");
  assert.match(suggestion?.message || "", /Use Public Service Rules to revisit Discipline\./);
  assert.match(suggestion?.message || "", /Shorten the next run so you can finish every question cleanly\./);
  assert.match(suggestion?.message || "", /Step back to Medium difficulty first/);
  assert.match(suggestion?.message || "", /Carry GL 15-16 emphasis into this follow-up drill\./);
  assert.deepEqual(suggestion?.chips, ["Weak Areas", "20 Questions", "MEDIUM", "GL 15-16"]);
  assert.deepEqual(suggestion?.signalChips, ["Trend: Slipping 5 pts", "Pace: 2 Unanswered"]);
  assert.equal(suggestion?.confidenceLabel, "Repeated Pattern");
  assert.equal(suggestion?.nextFilters?.questionCount, 20);
  assert.equal(suggestion?.nextFilters?.difficulty, "medium");
  assert.equal(suggestion?.nextFilters?.targetGlBand, "gl15_16");
});

test("buildDashboardSuggestionSignature keeps suggestion identity stable", () => {
  assert.equal(
    buildDashboardSuggestionSignature(
      { id: "psr" },
      {
        message: "Do this next",
        chips: ["Weak Areas", "20 Questions"],
        signalChips: ["Trend: Slipping 5 pts"],
        confidenceLabel: "Repeated Pattern",
        confidenceTone: "high",
      },
    ),
    JSON.stringify({
      topicId: "psr",
      message: "Do this next",
      chips: ["Weak Areas", "20 Questions"],
      signalChips: ["Trend: Slipping 5 pts"],
      confidenceLabel: "Repeated Pattern",
      confidenceTone: "high",
    }),
  );
});


test("buildRecommendation falls back cleanly before any attempts exist", () => {
  assert.deepEqual(buildRecommendation({ totalAttempts: 0 }), {
    title: "Start with Public Service Rules.",
    meta: "Best next-step guidance sharpens after your first scored session.",
    signalChips: [],
    confidenceLabel: "",
    confidenceTone: "medium",
    confidenceDescription: "",
  });
});
