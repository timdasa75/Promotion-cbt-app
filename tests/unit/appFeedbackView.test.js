import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildFeedbackCharCountLabel,
  buildFeedbackContextSummaryHtml,
  feedbackStatusBadgeClass,
  formatFeedbackCategoryLabel,
  formatFeedbackSourceLabel,
  formatFeedbackStatusLabel,
  formatSessionModeLabel,
  getFeedbackModalCopy,
  trimFeedbackPreview,
} from "../../js/appFeedbackView.js";

test("feedback view label helpers normalize categories, sources, statuses, and modes", () => {
  assert.equal(formatFeedbackCategoryLabel("question_issue"), "Question Issue");
  assert.equal(formatFeedbackSourceLabel("results"), "Results");
  assert.equal(formatFeedbackStatusLabel("in_review"), "In Review");
  assert.equal(formatSessionModeLabel("practice"), "Practice");
  assert.equal(formatSessionModeLabel("custom"), "Custom");
  assert.equal(feedbackStatusBadgeClass("dismissed"), "rejected");
});

test("feedback modal copy and char count labels stay stable", () => {
  assert.deepEqual(getFeedbackModalCopy("quiz"), {
    title: "Report This Question",
    intro: "Tell us what is wrong with this question, answer, or explanation.",
  });
  assert.deepEqual(getFeedbackModalCopy("results"), {
    title: "Share Session Feedback",
    intro: "Tell us what worked, what felt off, or what would improve this results flow.",
  });
  assert.deepEqual(getFeedbackModalCopy("help"), {
    title: "Send Feedback",
    intro: "Share what is working, what is unclear, or what should be improved.",
  });
  assert.equal(buildFeedbackCharCountLabel("hello", 500), "5/500");
});

test("feedback context summary html trims previews and escapes content", () => {
  const html = buildFeedbackContextSummaryHtml(
    {
      topicName: "PSR <Rules>",
      questionId: "Q-12",
      quizAttemptId: "ATT-1",
      sessionMode: "exam",
      questionPreview: "A".repeat(190),
      scoreSummary: "Scored < 50%",
    },
    {
      escapeHtml: (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;"),
    },
  );

  assert.match(html, /Topic/);
  assert.match(html, /PSR &lt;Rules&gt;/);
  assert.match(html, /Question ID/);
  assert.match(html, /Session ID/);
  assert.match(html, /Mode/);
  assert.match(html, /Exam/);
  assert.match(html, /A{177}\.\.\./);
  assert.match(html, /Scored &lt; 50%/);
  assert.equal(trimFeedbackPreview("x".repeat(190)).length, 180);
});

test("feedback context summary html returns empty string without context", () => {
  assert.equal(buildFeedbackContextSummaryHtml(null), "");
});
