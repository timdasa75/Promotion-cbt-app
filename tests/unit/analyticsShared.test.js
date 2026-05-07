import { test } from "node:test";
import assert from "node:assert/strict";
import {
  averageAttemptScores,
  buildDifficultyInsights,
  buildRecentScoreSignal,
  buildSubcategoryInsights,
  buildTimingSignal,
  buildTopicMastery,
  buildWeeklyConsistency,
  classifyRecommendationPattern,
  formatDifficultyLabel,
  formatGlBandLabel,
  getLatestMockWeakTopic,
  getTrafficClassByPercentage,
  toLocalDayKey,
} from "../../js/analyticsShared.js";

test("analytics shared formatters normalize labels consistently", () => {
  assert.equal(formatDifficultyLabel("hard"), "Hard");
  assert.equal(formatDifficultyLabel("  MEDIUM "), "Medium");
  assert.equal(formatDifficultyLabel(""), "");

  assert.equal(formatGlBandLabel("general"), "General");
  assert.equal(formatGlBandLabel("gl_15_16"), "GL 15-16");
});

test("analytics shared traffic helper maps score bands", () => {
  assert.equal(getTrafficClassByPercentage(85), "traffic-green");
  assert.equal(getTrafficClassByPercentage(50), "traffic-amber");
  assert.equal(getTrafficClassByPercentage(20), "traffic-red");
});

test("analytics shared averageAttemptScores ignores invalid entries", () => {
  const average = averageAttemptScores([
    { scorePercentage: 80 },
    { scorePercentage: "60" },
    { scorePercentage: "bad" },
    {},
  ]);
  assert.equal(average, 70);
  assert.equal(averageAttemptScores([]), null);
});

test("analytics shared recent score signal detects improving and slipping runs", () => {
  const improving = buildRecentScoreSignal([
    { scorePercentage: 40 },
    { scorePercentage: 45 },
    { scorePercentage: 65 },
    { scorePercentage: 70 },
  ]);
  assert.equal(improving?.direction, "improving");
  assert.equal(improving?.latestAverage, 68);
  assert.equal(improving?.previousAverage, 43);

  const slipping = buildRecentScoreSignal([
    { scorePercentage: 80 },
    { scorePercentage: 78 },
    { scorePercentage: 54 },
    { scorePercentage: 50 },
  ]);
  assert.equal(slipping?.direction, "slipping");
  assert.equal(slipping?.latestAverage, 52);
  assert.equal(slipping?.previousAverage, 79);

  assert.equal(buildRecentScoreSignal([{ scorePercentage: 55 }]), null);
});

test("analytics shared timing signal normalizes exam pacing states", () => {
  const comfortable = buildTimingSignal({
    mode: "exam",
    allowedSeconds: 1800,
    elapsedSeconds: 900,
    unansweredCount: 0,
  });
  assert.deepEqual(comfortable, {
    severity: "comfortable",
    allowedSeconds: 1800,
    elapsedSeconds: 900,
    remainingSeconds: 900,
    usedRatio: 0.5,
    unansweredCount: 0,
  });

  const highPressure = buildTimingSignal({
    mode: "exam",
    allowedSeconds: 1200,
    elapsedSeconds: 1400,
    unansweredCount: 2,
  });
  assert.equal(highPressure?.severity, "high");
  assert.equal(highPressure?.elapsedSeconds, 1200);
  assert.equal(highPressure?.remainingSeconds, 0);
  assert.equal(highPressure?.unansweredCount, 2);

  assert.equal(buildTimingSignal({ mode: "study", allowedSeconds: 1200, elapsedSeconds: 600 }), null);
  assert.equal(buildTimingSignal({ mode: "exam", allowedSeconds: 0, elapsedSeconds: 600 }), null);
});

test("analytics shared recommendation classifier distinguishes early, building, and repeated patterns", () => {
  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 1,
      hasStrongHistory: false,
      totalAttempts: 1,
      repeatedMinAttempts: 4,
      buildingMinAttempts: 2,
      allowStrongHistoryForBuilding: true,
    }),
    "early",
  );

  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 2,
      hasStrongHistory: false,
      totalAttempts: 2,
      repeatedMinAttempts: 4,
      buildingMinAttempts: 2,
      allowStrongHistoryForBuilding: true,
    }),
    "building",
  );

  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 2,
      hasStrongHistory: true,
      totalAttempts: 4,
      repeatedMinAttempts: 4,
      buildingMinAttempts: 2,
      allowStrongHistoryForBuilding: true,
    }),
    "repeated",
  );

  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 2,
      hasStrongHistory: true,
      totalAttempts: 0,
      allowStrongHistoryForBuilding: true,
    }),
    "repeated",
  );
  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 2,
      hasStrongHistory: true,
      totalAttempts: 0,
      repeatedMinAttempts: 3,
      buildingMinAttempts: 3,
      allowStrongHistoryForBuilding: false,
    }),
    "early",
  );
  assert.equal(
    classifyRecommendationPattern({
      alignedSignalCount: 2,
      hasStrongHistory: true,
      totalAttempts: 0,
      repeatedMinAttempts: 3,
      buildingMinAttempts: 3,
      allowStrongHistoryForBuilding: true,
    }),
    "building",
  );
});


test("analytics shared subcategory and difficulty insights aggregate and sort weakest areas first", () => {
  const attempts = [
    {
      subcategoryBreakdown: [
        { subcategoryId: "procurement", subcategoryName: "Procurement", correct: 2, answered: 4, total: 4 },
        { subcategoryId: "ethics", subcategoryName: "Ethics", correct: 3, answered: 3, total: 3 },
      ],
      difficultyBreakdown: [
        { difficulty: "hard", correct: 1, answered: 4, total: 4 },
        { difficulty: "easy", correct: 3, answered: 3, total: 3 },
      ],
    },
    {
      subcategoryBreakdown: [
        { subcategoryId: "procurement", subcategoryName: "Procurement", correct: 1, answered: 2, total: 2 },
        { subcategoryId: "ethics", subcategoryName: "Ethics", correct: 1, answered: 2, total: 2 },
      ],
      difficultyBreakdown: [
        { difficulty: "hard", correct: 2, answered: 4, total: 4 },
        { difficulty: "medium", correct: 1, answered: 2, total: 2 },
      ],
    },
  ];

  const subcategoryInsights = buildSubcategoryInsights(attempts);
  assert.equal(subcategoryInsights[0]?.subcategoryId, "procurement");
  assert.equal(subcategoryInsights[0]?.accuracy, 50);
  assert.equal(subcategoryInsights[0]?.sessions, 2);
  assert.equal(subcategoryInsights[1]?.subcategoryId, "ethics");
  assert.equal(subcategoryInsights[1]?.accuracy, 80);

  const difficultyInsights = buildDifficultyInsights(attempts);
  assert.equal(difficultyInsights[0]?.difficulty, "hard");
  assert.equal(difficultyInsights[0]?.accuracy, 38);
  assert.equal(difficultyInsights[1]?.difficulty, "medium");
  assert.equal(difficultyInsights[1]?.accuracy, 50);
  assert.equal(difficultyInsights[2]?.difficulty, "easy");
  assert.equal(difficultyInsights[2]?.accuracy, 100);
});

test("analytics shared latest mock weak topic only considers mock-attempt source breakdown", () => {
  const mockAttempt = {
    topicId: "mock_exam",
    sourceTopicBreakdown: [
      { topicId: "topic_a", topicName: "Topic A", accuracy: 75, total: 6 },
      { topicId: "topic_b", topicName: "Topic B", accuracy: 40, total: 5 },
      { topicId: "topic_c", topicName: "Topic C", accuracy: 40, total: 8 },
    ],
  };

  const weakest = getLatestMockWeakTopic(mockAttempt, "mock_exam");
  assert.equal(weakest?.topicId, "topic_c");
  assert.equal(getLatestMockWeakTopic(mockAttempt, "study_topic"), null);
  assert.equal(getLatestMockWeakTopic({ topicId: "mock_exam", sourceTopicBreakdown: [] }, "mock_exam"), null);
});


test("analytics shared topic mastery merges direct topic attempts with mock source breakdowns", () => {
  const topics = [
    { id: "psr", name: "Public Service Rules" },
    { id: "proc", name: "Public Procurement" },
    { id: "ignored", name: "Ignored Topic" },
  ];
  const attempts = [
    { topicId: "psr", topicName: "Public Service Rules", scorePercentage: 60 },
    {
      topicId: "mock_exam",
      sourceTopicBreakdown: [
        { topicId: "psr", topicName: "Public Service Rules", accuracy: 80 },
        { topicId: "proc", topicName: "Public Procurement", accuracy: 40 },
      ],
    },
    { topicId: "ignored", topicName: "Ignored Topic", scorePercentage: 99 },
  ];

  const mastery = buildTopicMastery(attempts, {
    topics,
    isIncludedTopicId: (topicId) => topicId !== "ignored",
    getFallbackTopicName: (topicId) => `Fallback ${topicId}`,
    mockExamTopicId: "mock_exam",
  });

  assert.deepEqual(mastery, [
    {
      topicId: "psr",
      topicName: "Public Service Rules",
      averageScore: 70,
      attempts: 2,
    },
    {
      topicId: "proc",
      topicName: "Public Procurement",
      averageScore: 40,
      attempts: 1,
    },
  ]);
});


test("analytics shared local day keys and weekly consistency bucket attempts by day", () => {
  assert.equal(toLocalDayKey("2026-05-07T10:30:00Z"), "2026-05-07");
  assert.equal(toLocalDayKey("not-a-date"), "");

  const weekly = buildWeeklyConsistency(
    [
      { createdAt: "2026-05-05T08:00:00Z" },
      { createdAt: "2026-05-05T18:00:00Z" },
      { createdAt: "2026-05-07T09:00:00Z" },
    ],
    {
      now: new Date("2026-05-07T12:00:00Z"),
      getDayLabel: (date) => date.toISOString().slice(8, 10),
      getDateLabel: (date) => date.toISOString().slice(5, 10),
      getClassName: (count) => `count-${count}`,
    },
  );

  assert.equal(weekly.length, 7);
  assert.deepEqual(weekly.map((entry) => ({ id: entry.id, count: entry.count, className: entry.className })), [
    { id: "2026-05-01", count: 0, className: "count-0" },
    { id: "2026-05-02", count: 0, className: "count-0" },
    { id: "2026-05-03", count: 0, className: "count-0" },
    { id: "2026-05-04", count: 0, className: "count-0" },
    { id: "2026-05-05", count: 2, className: "count-2" },
    { id: "2026-05-06", count: 0, className: "count-0" },
    { id: "2026-05-07", count: 1, className: "count-1" },
  ]);
});
