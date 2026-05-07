import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminFeedbackEmptyState,
  buildAdminFeedbackItemModel,
  buildAdminFeedbackStatusMessage,
  buildFeedbackAccessUiModel,
  buildFeedbackCharCountLabel,
  buildFeedbackContextSummaryHtml,
  feedbackStatusBadgeClass,
  filterAdminFeedbackSubmissions,
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

test("feedback access model derives button and visibility state", () => {
  assert.deepEqual(buildFeedbackAccessUiModel({ allowed: false, message: "Sign in first." }), {
    buttonDisabled: true,
    buttonAriaDisabled: "true",
    buttonTitle: "Sign in first.",
    helpNoteHidden: false,
    helpNoteText: "Sign in first.",
    quizHidden: true,
    resultsHidden: true,
    shouldCloseModal: true,
  });
});

test("admin feedback helpers filter, summarize, and format entries", () => {
  const rows = [
    {
      feedbackId: "f1",
      email: "tim@example.com",
      message: "First report",
      topicName: "PSR Rules",
      topicId: "psr_rules",
      questionId: "Q-9",
      quizAttemptId: "A-1",
      sourceScreen: "quiz",
      category: "bug",
      status: "in_review",
      sessionMode: "practice",
      createdAt: "2026-05-07T08:00:00Z",
      reviewedAt: "2026-05-07T09:00:00Z",
      reviewedBy: "admin@example.com",
    },
    {
      feedbackId: "f2",
      email: "other@example.com",
      message: "Second report",
      sourceScreen: "results",
      category: "suggestion",
      status: "resolved",
    },
  ];

  const filtered = filterAdminFeedbackSubmissions(rows, { query: "tim", status: "in_review", category: "bug", source: "quiz" });
  assert.equal(filtered.length, 1);
  assert.equal(buildAdminFeedbackEmptyState(0), "No feedback submitted yet.");
  assert.equal(buildAdminFeedbackEmptyState(2), "No feedback matches the current filter.");
  assert.equal(buildAdminFeedbackStatusMessage("resolved"), "Feedback marked as Resolved.");

  const item = buildAdminFeedbackItemModel(filtered[0], {
    formatDateTime: () => "May 7",
    formatRelativeTime: () => "today",
    escapeHtml: (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;"),
  });
  assert.equal(item.feedbackId, "f1");
  assert.match(item.html, /Status: In Review/);
  assert.match(item.html, /Category: Bug/);
  assert.match(item.html, /Source: Quiz/);
  assert.match(item.html, /Mode: Practice/);
  assert.match(item.html, /Mark In Review/);
});
