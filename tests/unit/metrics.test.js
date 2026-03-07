import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateScoreFromAnswers,
  calculateStreakDays,
  getWeakestTopicId,
} from "../../js/metrics.js";

test("calculateScoreFromAnswers returns correct aggregate stats", () => {
  const questions = [
    { id: "q1", correct: 1 },
    { id: "q2", correct: 0 },
    { id: "q3", correct: 2 },
    { id: "q4", correct: 3 },
  ];
  const answers = [1, 2, undefined, 3];
  const result = calculateScoreFromAnswers(questions, answers);

  assert.deepEqual(result, {
    correct: 2,
    answered: 3,
    wrong: 1,
    unanswered: 1,
    total: 4,
    scorePercentage: 50,
    accuracyRate: 67,
    wrongRate: 25,
    unansweredRate: 25,
  });
});

test("calculateStreakDays handles continuous and broken streaks", () => {
  const now = new Date("2026-03-03T08:00:00.000Z");
  const attempts = [
    { createdAt: "2026-03-03T07:00:00.000Z" },
    { createdAt: "2026-03-02T07:00:00.000Z" },
    { createdAt: "2026-03-01T07:00:00.000Z" },
    { createdAt: "2026-02-27T07:00:00.000Z" },
  ];
  assert.equal(calculateStreakDays(attempts, now), 3);
});

test("calculateStreakDays can continue from yesterday when no attempt exists today", () => {
  const now = new Date("2026-03-03T08:00:00.000Z");
  const attempts = [
    { createdAt: "2026-03-02T07:00:00.000Z" },
    { createdAt: "2026-03-01T07:00:00.000Z" },
  ];
  assert.equal(calculateStreakDays(attempts, now), 2);
});

test("getWeakestTopicId picks topic with lowest average score", () => {
  const attempts = [
    { topicId: "psr", scorePercentage: 80 },
    { topicId: "psr", scorePercentage: 70 },
    { topicId: "ict_management", scorePercentage: 55 },
    { topicId: "ict_management", scorePercentage: 50 },
  ];

  assert.equal(getWeakestTopicId(attempts), "ict_management");
});
