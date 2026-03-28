import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDifficultyBreakdown,
  buildSubcategoryBreakdown,
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

test("buildSubcategoryBreakdown groups current-session results by runtime subcategory", () => {
  const questions = [
    { id: "q1", correct: 0, sourceSubcategoryId: "psr_appointments", sourceSubcategoryName: "Appointments" },
    { id: "q2", correct: 1, sourceSubcategoryId: "psr_appointments", sourceSubcategoryName: "Appointments" },
    { id: "q3", correct: 2, sourceSubcategoryId: "psr_leave", sourceSubcategoryName: "Leave" },
  ];
  const answers = [0, 0, undefined];

  assert.deepEqual(buildSubcategoryBreakdown(questions, answers), [
    {
      subcategoryId: "psr_leave",
      subcategoryName: "Leave",
      total: 1,
      answered: 0,
      correct: 0,
      wrong: 0,
      unanswered: 1,
      accuracy: 0,
    },
    {
      subcategoryId: "psr_appointments",
      subcategoryName: "Appointments",
      total: 2,
      answered: 2,
      correct: 1,
      wrong: 1,
      unanswered: 0,
      accuracy: 50,
    },
  ]);
});

test("buildDifficultyBreakdown groups answers by difficulty in stable order", () => {
  const questions = [
    { id: "q1", correct: 0, difficulty: "medium" },
    { id: "q2", correct: 1, difficulty: "easy" },
    { id: "q3", correct: 2, difficulty: "hard" },
  ];
  const answers = [0, 2, 2];

  assert.deepEqual(buildDifficultyBreakdown(questions, answers), [
    {
      difficulty: "easy",
      total: 1,
      answered: 1,
      correct: 0,
      wrong: 1,
      unanswered: 0,
      accuracy: 0,
    },
    {
      difficulty: "medium",
      total: 1,
      answered: 1,
      correct: 1,
      wrong: 0,
      unanswered: 0,
      accuracy: 100,
    },
    {
      difficulty: "hard",
      total: 1,
      answered: 1,
      correct: 1,
      wrong: 0,
      unanswered: 0,
      accuracy: 100,
    },
  ]);
});
