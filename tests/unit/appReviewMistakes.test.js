import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyReviewMistakeFilters,
  getReviewMistakeDifficultyLabel,
  getReviewMistakeFilterOptions,
  getReviewMistakeOptionPresentation,
  getReviewMistakePreviousResponse,
  getReviewMistakeTopicLabel,
  renderReviewMistakeInlineMarkdown,
  renderReviewMistakesEmptyState,
} from "../../js/appReviewMistakes.js";

const sampleEntries = [
  {
    sourceTopicId: "psr",
    question: {
      sourceSubcategoryName: "Discipline",
      difficulty: "hard",
      options: ["Alpha", "Beta"],
    },
    updatedAt: "2026-05-07T09:00:00Z",
  },
  {
    sourceTopicName: "Financial Regulations",
    question: {
      sourceSection: "Revenue",
      difficulty: "medium",
      options: ["Gamma", "Delta"],
    },
    updatedAt: "2026-05-06T09:00:00Z",
  },
];

test("review mistake filter options normalize topics, subcategories, and difficulties", () => {
  const options = getReviewMistakeFilterOptions(sampleEntries, {
    getTopicNameById: (topicId) => (topicId === "psr" ? "Public Service Rules" : topicId),
    formatDifficultyLabel: (value) => String(value || "").toUpperCase(),
  });

  assert.deepEqual(options.topics, [
    { value: "Financial Regulations", label: "Financial Regulations" },
    { value: "psr", label: "Public Service Rules" },
  ]);
  assert.deepEqual(options.subcategories, [
    { value: "Discipline", label: "Discipline" },
    { value: "Revenue", label: "Revenue" },
  ]);
  assert.deepEqual(options.difficulties, [
    { value: "hard", label: "HARD" },
    { value: "medium", label: "MEDIUM" },
  ]);
});

test("review mistake filters narrow entries by active selections", () => {
  const filtered = applyReviewMistakeFilters(sampleEntries, {
    topic: "psr",
    subcategory: "Discipline",
    difficulty: "hard",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].sourceTopicId, "psr");
});

test("review mistake helpers render previous and correct responses", () => {
  const option = getReviewMistakeOptionPresentation(
    { options: ["Alpha", "Beta"] },
    1,
    { parseMarkdown: (value) => `<p>${value}</p>` },
  );
  assert.equal(option.text, "Option B - Beta");
  assert.equal(option.html, "<p>Option B - Beta</p>");

  const previous = getReviewMistakePreviousResponse(
    { question: { options: ["Alpha", "Beta"] }, lastUserAnswerIndex: 0 },
    { parseMarkdown: (value) => `<p>${value}</p>` },
  );
  assert.equal(previous.title, "Previous Response");
  assert.equal(previous.html, "<p>Option A - Alpha</p>");
});

test("review mistake markdown and labels stay presentation-friendly", () => {
  assert.equal(
    renderReviewMistakeInlineMarkdown("**Hello**", { parseMarkdown: () => "<p><strong>Hello</strong></p>" }),
    "<strong>Hello</strong>",
  );
  assert.equal(
    getReviewMistakeTopicLabel({ sourceTopicId: "psr" }, { getTopicNameById: () => "Public Service Rules" }),
    "Public Service Rules",
  );
  assert.equal(
    getReviewMistakeDifficultyLabel({ difficulty: "hard" }, { formatDifficultyLabel: (value) => String(value).toUpperCase() }),
    "HARD",
  );
});

test("review mistake empty state renders CTA markup safely", () => {
  const html = renderReviewMistakesEmptyState(
    {
      title: "No items",
      body: "Try again later",
      primaryAction: { action: "open-dashboard", label: "Back", variant: "btn-primary" },
    },
    { escapeHtml: (value) => String(value || "") },
  );

  assert.match(html, /No items/);
  assert.match(html, /data-review-action="open-dashboard"/);
  assert.match(html, /Back/);
});
