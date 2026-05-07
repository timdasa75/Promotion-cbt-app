import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAnalyticsConsistencyHtml,
  buildAnalyticsHeatmapHtml,
  buildAnalyticsOverviewModel,
  buildAnalyticsRecommendationModel,
  buildAnalyticsTrendHtml,
} from "../../js/appAnalyticsView.js";

test("buildAnalyticsOverviewModel composes readiness and latest session summary", () => {
  const model = buildAnalyticsOverviewModel(
    {
      totalAttempts: 4,
      averageScore: 78,
      streakDays: 3,
      weakestTopic: { topicName: "Public Service Rules", averageScore: 51 },
      latestAttempt: { topicName: "Public Service Rules", mode: "practice", createdAt: "2026-05-07T09:00:00Z" },
      recommendation: { signalChips: ["Trend: Improving 8 pts", ""] },
    },
    {
      getAttemptHeadline: () => "Public Service Rules",
      formatModeLabel: () => "Practice",
      formatRelativeTime: () => "today",
      formatDateTime: () => "May 7",
    },
  );

  assert.equal(model.tone, "high");
  assert.equal(model.title, "Ready for exam-style drills");
  assert.match(model.narrative, /Weakest core topic: Public Service Rules at 51%\./);
  assert.equal(model.latestText, "Latest scored session: Public Service Rules | Practice | today");
  assert.deepEqual(model.signalChips, ["Trend: Improving 8 pts"]);
  assert.equal(model.scoreText, "78%");
  assert.equal(model.streakText, "3");
  assert.equal(model.attemptsText, "4");
});

test("buildAnalyticsTrendHtml returns empty state and populated cards", () => {
  const empty = buildAnalyticsTrendHtml([]);
  assert.match(empty, /No scored attempts yet/);

  const html = buildAnalyticsTrendHtml([
    { className: "high", score: 82, headline: "PSR", meta: "Practice", when: "today" },
  ]);
  assert.match(html, /analytic-item high/);
  assert.match(html, /82%/);
  assert.match(html, /PSR/);
});

test("buildAnalyticsConsistencyHtml formats daily attempt cards", () => {
  const html = buildAnalyticsConsistencyHtml([
    { className: "medium", count: 2, dayLabel: "Thu", dateLabel: "May 7" },
  ]);
  assert.match(html, /analytic-item medium/);
  assert.match(html, /2 attempts/);
});

test("buildAnalyticsHeatmapHtml distinguishes attempted and untouched topics", () => {
  const html = buildAnalyticsHeatmapHtml(
    [
      { topicName: "PSR", averageScore: 64, attempts: 3 },
      { topicName: "Procurement", averageScore: null, attempts: 0 },
    ],
    { getTrafficClassByPercentage: (value) => (value >= 60 ? "medium" : "low") },
  );
  assert.match(html, /heatmap-tile medium/);
  assert.match(html, /64% average/);
  assert.match(html, /Not attempted yet/);
});

test("buildAnalyticsRecommendationModel normalizes recommendation display fields", () => {
  const model = buildAnalyticsRecommendationModel({
    recommendation: {
      title: "Next: PSR",
      meta: "Revisit weak areas",
      signalChips: ["Trend: Slipping 5 pts", ""],
      confidenceLabel: "Repeated Pattern",
      confidenceDescription: "Strong repeat signal",
      confidenceTone: "HIGH",
    },
  });

  assert.deepEqual(model, {
    title: "Next: PSR",
    meta: "Revisit weak areas",
    signalChips: ["Trend: Slipping 5 pts"],
    confidenceLabel: "Repeated Pattern",
    confidenceDescription: "Strong repeat signal",
    confidenceTone: "high",
  });
});
