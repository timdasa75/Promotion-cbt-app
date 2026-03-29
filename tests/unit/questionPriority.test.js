import test from "node:test";
import assert from "node:assert/strict";

import {
  buildQuestionSelectionProfile,
  normalizeGLBandKey,
  prioritizeQuestionPool,
  questionMatchesGLBand,
  scoreQuestionForSelection,
} from "../../js/questionPriority.js";

test("normalizeGLBandKey normalizes GL labels consistently", () => {
  assert.equal(normalizeGLBandKey("GL 16-17"), "gl_16_17");
  assert.equal(normalizeGLBandKey("gl15_16"), "gl_15_16");
  assert.equal(normalizeGLBandKey("General"), "general");
});

test("questionMatchesGLBand respects question metadata", () => {
  const question = { glBands: ["GL14_15", "GL16_17"] };
  assert.equal(questionMatchesGLBand(question, "GL 16-17"), true);
  assert.equal(questionMatchesGLBand(question, "GL15_16"), false);
});

test("buildQuestionSelectionProfile identifies weak subcategories, topics, and difficulty buckets", () => {
  const summary = {
    attempts: [
      {
        topicId: "psr",
        subcategoryBreakdown: [
          { subcategoryId: "psr_discipline", total: 5, answered: 5, correct: 2 },
          { subcategoryId: "psr_leave", total: 5, answered: 5, correct: 5 },
        ],
        difficultyBreakdown: [
          { difficulty: "easy", total: 4, answered: 4, correct: 4 },
          { difficulty: "hard", total: 6, answered: 6, correct: 2 },
        ],
        sourceTopicBreakdown: [
          { topicId: "psr", total: 10, answered: 10, correct: 7 },
          { topicId: "policy_analysis", total: 4, answered: 4, correct: 1 },
        ],
      },
      {
        topicId: "mock_exam",
        subcategoryBreakdown: [
          { subcategoryId: "psr_discipline", total: 4, answered: 4, correct: 1 },
          { subcategoryId: "psr_leave", total: 4, answered: 4, correct: 3 },
        ],
        difficultyBreakdown: [
          { difficulty: "medium", total: 4, answered: 4, correct: 3 },
          { difficulty: "hard", total: 4, answered: 4, correct: 1 },
        ],
        sourceTopicBreakdown: [
          { topicId: "psr", total: 4, answered: 4, correct: 1 },
          { topicId: "policy_analysis", total: 4, answered: 4, correct: 1 },
        ],
      },
    ],
  };

  const profile = buildQuestionSelectionProfile(summary, {
    currentTopicId: "psr",
    glBand: "GL16_17",
    mode: "practice",
    focusPreference: "weak_areas",
  });

  assert.equal(profile.glBand, "gl_16_17");
  assert.equal(profile.focusPreference, "weak_areas");
  assert.equal(profile.weakSubcategoryIds.has("psr_discipline"), true);
  assert.equal(profile.weakDifficultyIds.has("hard"), true);
  assert.equal(profile.weakTopicIds.has("policy_analysis"), true);
});

test("prioritizeQuestionPool lifts GL matches and weak-area questions first", () => {
  const profile = buildQuestionSelectionProfile(
    {
      attempts: [
        {
          topicId: "psr",
          subcategoryBreakdown: [
            { subcategoryId: "psr_discipline", total: 6, answered: 6, correct: 2 },
            { subcategoryId: "psr_leave", total: 6, answered: 6, correct: 6 },
          ],
          difficultyBreakdown: [
            { difficulty: "hard", total: 6, answered: 6, correct: 2 },
            { difficulty: "easy", total: 4, answered: 4, correct: 4 },
          ],
          sourceTopicBreakdown: [
            { topicId: "psr", total: 12, answered: 12, correct: 8 },
          ],
        },
      ],
    },
    {
      currentTopicId: "psr",
      glBand: "GL16_17",
      mode: "practice",
      focusPreference: "weak_areas",
    },
  );

  const strongQuestion = {
    id: "q1",
    sourceTopicId: "psr",
    sourceSubcategoryId: "psr_discipline",
    difficulty: "hard",
    glBands: ["GL16_17"],
    tags: ["public_accountability"],
  };
  const fallbackQuestion = {
    id: "q2",
    sourceTopicId: "psr",
    sourceSubcategoryId: "psr_leave",
    difficulty: "easy",
    glBands: ["GL14_15"],
    tags: ["leave"],
  };

  const ordered = prioritizeQuestionPool([fallbackQuestion, strongQuestion], profile);
  assert.equal(ordered[0].id, "q1");
  assert.ok(scoreQuestionForSelection(strongQuestion, profile) > scoreQuestionForSelection(fallbackQuestion, profile));
});

test("weak-area focus increases the selection score for weak questions", () => {
  const weakQuestion = {
    id: "q1",
    sourceTopicId: "psr",
    sourceSubcategoryId: "psr_discipline",
    difficulty: "hard",
    glBands: ["GL16_17"],
    tags: ["public_accountability"],
  };

  const balancedProfile = buildQuestionSelectionProfile(
    {
      attempts: [
        {
          topicId: "psr",
          subcategoryBreakdown: [
            { subcategoryId: "psr_discipline", total: 6, answered: 6, correct: 2 },
          ],
          difficultyBreakdown: [
            { difficulty: "hard", total: 6, answered: 6, correct: 2 },
          ],
          sourceTopicBreakdown: [
            { topicId: "psr", total: 6, answered: 6, correct: 2 },
          ],
        },
      ],
    },
    {
      currentTopicId: "psr",
      glBand: "GL16_17",
      mode: "practice",
      focusPreference: "balanced",
    },
  );

  const weakAreasProfile = buildQuestionSelectionProfile(
    {
      attempts: [
        {
          topicId: "psr",
          subcategoryBreakdown: [
            { subcategoryId: "psr_discipline", total: 6, answered: 6, correct: 2 },
          ],
          difficultyBreakdown: [
            { difficulty: "hard", total: 6, answered: 6, correct: 2 },
          ],
          sourceTopicBreakdown: [
            { topicId: "psr", total: 6, answered: 6, correct: 2 },
          ],
        },
      ],
    },
    {
      currentTopicId: "psr",
      glBand: "GL16_17",
      mode: "practice",
      focusPreference: "weak_areas",
    },
  );

  assert.ok(
    scoreQuestionForSelection(weakQuestion, weakAreasProfile) >
      scoreQuestionForSelection(weakQuestion, balancedProfile),
  );
});

test("scenario-heavy governance questions are prioritized for GL 16-17", () => {
  const profile = buildQuestionSelectionProfile(
    { attempts: [] },
    {
      currentTopicId: "leadership_management",
      glBand: "GL16_17",
      mode: "exam",
      focusPreference: "balanced",
    },
  );

  const scenarioQuestion = {
    id: "q1",
    sourceTopicId: "leadership_management",
    sourceSubcategoryId: "lead_strategic_management",
    difficulty: "hard",
    glBands: ["GL16_17"],
    question:
      "A director is reviewing competing priorities during a governance meeting. Which action best preserves accountability and strategic alignment?",
    tags: ["governance", "public_accountability", "strategic_alignment"],
    questionType: "single_best_answer",
  };

  const plainQuestion = {
    id: "q2",
    sourceTopicId: "leadership_management",
    sourceSubcategoryId: "lead_strategic_management",
    difficulty: "hard",
    glBands: ["GL16_17"],
    question: "Leadership involves setting direction and coordinating teams.",
    tags: ["leadership"],
    questionType: "single_best_answer",
  };

  assert.ok(
    scoreQuestionForSelection(scenarioQuestion, profile) > scoreQuestionForSelection(plainQuestion, profile),
  );
  assert.equal(prioritizeQuestionPool([plainQuestion, scenarioQuestion], profile)[0].id, "q1");
});


test("GL 16-17 prioritizes strategic policy/compliance subcategories over generic higher-band items", () => {
  const profile = buildQuestionSelectionProfile(
    { attempts: [] },
    {
      currentTopicId: "policy_analysis",
      glBand: "GL16_17",
      mode: "exam",
      focusPreference: "balanced",
    },
  );

  const strategicQuestion = {
    id: "q1",
    sourceTopicId: "policy_analysis",
    sourceSubcategoryId: "pol_implementation_evaluation",
    difficulty: "hard",
    glBands: ["GL16_17"],
    tags: ["governance"],
    questionType: "judgement",
    question: "During implementation review, which action best strengthens accountability and policy performance?",
  };

  const genericQuestion = {
    id: "q2",
    sourceTopicId: "policy_analysis",
    sourceSubcategoryId: "pol_formulation_cycle",
    difficulty: "hard",
    glBands: ["GL16_17"],
    tags: ["policy"],
    questionType: "single_best_answer",
    question: "Policy formulation includes agenda setting and consultation.",
  };

  assert.ok(
    scoreQuestionForSelection(strategicQuestion, profile) > scoreQuestionForSelection(genericQuestion, profile),
  );
  assert.equal(prioritizeQuestionPool([genericQuestion, strategicQuestion], profile)[0].id, "q1");
});

test("GL 15-16 lifts verbal and analytical competency items above plain quantitative ones when both are eligible", () => {
  const profile = buildQuestionSelectionProfile(
    { attempts: [] },
    {
      currentTopicId: "competency_framework",
      glBand: "GL15_16",
      mode: "exam",
      focusPreference: "balanced",
    },
  );

  const analyticalQuestion = {
    id: "q1",
    sourceTopicId: "competency_framework",
    sourceSubcategoryId: "comp_verbal_reasoning",
    difficulty: "medium",
    glBands: ["GL15_16", "GL16_17"],
    tags: ["analytical_reasoning", "official_communication"],
    questionType: "analytical_reasoning",
    question: "A director reviews a memo and asks for the most defensible conclusion from the reported evidence.",
  };

  const quantitativeQuestion = {
    id: "q2",
    sourceTopicId: "competency_framework",
    sourceSubcategoryId: "comp_numerical_reasoning",
    difficulty: "medium",
    glBands: ["GL14_15", "GL15_16"],
    tags: ["numerical_reasoning"],
    questionType: "single_best_answer",
    question: "What is 15% of 200,000?",
  };

  assert.ok(
    scoreQuestionForSelection(analyticalQuestion, profile) > scoreQuestionForSelection(quantitativeQuestion, profile),
  );
  assert.equal(prioritizeQuestionPool([quantitativeQuestion, analyticalQuestion], profile)[0].id, "q1");
});
