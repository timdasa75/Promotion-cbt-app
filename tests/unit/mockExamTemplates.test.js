import test from "node:test";
import assert from "node:assert/strict";

import {
  allocateQuestionsByRelativeWeights,
  buildMockExamBlueprint,
  getDefaultMockExamBlueprint,
} from "../../js/mockExamTemplates.js";

test("allocateQuestionsByRelativeWeights normalizes relative GL-band weights into 40 questions", () => {
  const allocation = allocateQuestionsByRelativeWeights(
    {
      psr: 0.38,
      civil_service_admin: 0.18,
      financial_regulations: 0.11,
      procurement_act: 0.07,
      constitutional_law: 0.09,
      leadership_management: 0.06,
      ict_management: 0.04,
      policy_analysis: 0.04,
      general_current_affairs: 0.06,
      competency_framework: 0.05,
    },
    40,
  );

  const totalQuestions = allocation.reduce((sum, entry) => sum + entry.count, 0);
  assert.equal(totalQuestions, 40);
  assert.equal(allocation[0].topicId, "psr");
  assert.ok(allocation.find((entry) => entry.topicId === "civil_service_admin")?.count >= 6);
});

test("buildMockExamBlueprint uses weighted GL-band config when template sections are absent", () => {
  const blueprint = buildMockExamBlueprint({
    template: {
      id: "gl_16_17",
      glBand: "GL16_17",
      totalQuestions: 40,
    },
    glBandWeights: {
      GL16_17: {
        topicWeights: {
          leadership_management: 0.22,
          policy_analysis: 0.16,
          psr: 0.16,
          financial_regulations: 0.11,
          procurement_act: 0.09,
          civil_service_admin: 0.11,
          constitutional_law: 0.08,
          general_current_affairs: 0.08,
          ict_management: 0.04,
          competency_framework: 0.04,
        },
      },
    },
    fallbackBlueprint: getDefaultMockExamBlueprint(),
  });

  assert.equal(blueprint.reduce((sum, entry) => sum + entry.count, 0), 40);
  assert.equal(blueprint[0].topicId, "leadership_management");
  assert.ok(blueprint.find((entry) => entry.topicId === "policy_analysis")?.count >= 5);
});
