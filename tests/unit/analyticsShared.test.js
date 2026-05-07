import { test } from "node:test";
import assert from "node:assert/strict";
import {
  averageAttemptScores,
  buildRecentScoreSignal,
  buildTimingSignal,
  classifyRecommendationPattern,
  formatDifficultyLabel,
  formatGlBandLabel,
  getTrafficClassByPercentage,
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
