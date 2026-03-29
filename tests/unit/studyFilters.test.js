import test from "node:test";
import assert from "node:assert/strict";

import {
  applyStudyFilters,
  formatDifficultyFilterLabel,
  formatQuestionFocusLabel,
  formatSessionDurationLabel,
  formatTargetGlBandLabel,
  getTimedTopicTestDurationSeconds,
  hasStudyFilterChoices,
  normalizeStudyFilters,
  resolveStudyQuestionCount,
  summarizeStudyFilterOptions,
} from "../../js/studyFilters.js";

test("normalizeStudyFilters applies stable defaults", () => {
  const filters = normalizeStudyFilters({}, { totalQuestions: 24, defaultQuestionCount: 40 });

  assert.deepEqual(filters, {
    difficulty: "all",
    sourceDocument: "all",
    questionCount: 24,
    questionFocus: "balanced",
    targetGlBand: "general",
  });
});

test("summarizeStudyFilterOptions derives choices from question metadata", () => {
  const summary = summarizeStudyFilterOptions(
    [
      { difficulty: "easy", sourceDocument: "PSR 2021", glBands: ["GL14_15"] },
      { difficulty: "hard", sourceDocument: "PSR 2021", glBands: ["GL15_16", "GL16_17"] },
      { difficulty: "medium", sourceDocument: "Circular 2024", glBands: ["GL15_16"] },
    ],
    {
      currentFilters: {
        difficulty: "hard",
        questionCount: 10,
        questionFocus: "weak_areas",
        targetGlBand: "GL15_16",
      },
    },
  );

  assert.equal(summary.totalQuestions, 3);
  assert.deepEqual(summary.difficulties, ["easy", "medium", "hard"]);
  assert.deepEqual(summary.sourceDocuments, ["Circular 2024", "PSR 2021"]);
  assert.deepEqual(summary.questionFocusOptions, ["balanced", "weak_areas"]);
  assert.deepEqual(summary.targetGlBandOptions, ["general", "gl_14_15", "gl_15_16", "gl_16_17"]);
  assert.equal(summary.defaults.difficulty, "hard");
  assert.equal(summary.defaults.questionCount, 3);
  assert.equal(summary.defaults.questionFocus, "weak_areas");
  assert.equal(summary.defaults.targetGlBand, "gl_15_16");
});

test("applyStudyFilters narrows by difficulty and source document before question count", () => {
  const filtered = applyStudyFilters(
    [
      { id: "q1", difficulty: "easy", sourceDocument: "PSR 2021" },
      { id: "q2", difficulty: "hard", sourceDocument: "PSR 2021" },
      { id: "q3", difficulty: "hard", sourceDocument: "Circular 2024" },
      { id: "q4", difficulty: "hard", sourceDocument: "PSR 2021" },
    ],
    {
      difficulty: "hard",
      sourceDocument: "PSR 2021",
      questionCount: 1,
      questionFocus: "weak_areas",
      targetGlBand: "gl_16_17",
    },
  );

  assert.deepEqual(filtered.map((entry) => entry.id), ["q2"]);
});

test("hasStudyFilterChoices returns true when the setup has meaningful alternatives", () => {
  assert.equal(
    hasStudyFilterChoices({
      difficulties: ["easy"],
      sourceDocuments: ["PSR 2021"],
      questionCountOptions: [],
      questionFocusOptions: ["balanced"],
      targetGlBandOptions: ["general"],
    }),
    false,
  );

  assert.equal(
    hasStudyFilterChoices({
      difficulties: ["easy"],
      sourceDocuments: ["PSR 2021"],
      questionCountOptions: [],
      questionFocusOptions: ["balanced"],
      targetGlBandOptions: ["general", "gl_15_16"],
    }),
    true,
  );
});

test("formatters expose stable labels for the setup UI", () => {
  assert.equal(formatDifficultyFilterLabel("medium"), "Medium");
  assert.equal(formatDifficultyFilterLabel("unknown"), "");
  assert.equal(formatQuestionFocusLabel("balanced"), "Balanced Mix");
  assert.equal(formatQuestionFocusLabel("weak_areas"), "Reinforce Weak Areas");
  assert.equal(formatTargetGlBandLabel("general"), "General");
  assert.equal(formatTargetGlBandLabel("GL16_17"), "GL 16-17");
});


test("timed topic test estimate scales with question count", () => {
  const questionCount = resolveStudyQuestionCount(
    { questionCount: 10 },
    { totalQuestions: 120, defaultQuestionCount: 40 },
  );
  const durationSeconds = getTimedTopicTestDurationSeconds(questionCount);

  assert.equal(questionCount, 10);
  assert.equal(durationSeconds, 450);
  assert.equal(formatSessionDurationLabel(durationSeconds), "7 min 30 sec");
  assert.equal(formatSessionDurationLabel(getTimedTopicTestDurationSeconds(40)), "30 min");
});
