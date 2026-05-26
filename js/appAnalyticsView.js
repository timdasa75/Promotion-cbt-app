import { getAnalyticsReadinessState } from "./appAnalytics.js";

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
}

function normalizeSignalChips(entries) {
  return Array.isArray(entries)
    ? entries.filter((entry) => String(entry || "").trim())
    : [];
}

function getTrafficToneClass(accuracy) {
  if (accuracy < 50) return "traffic-red";
  if (accuracy < 70) return "traffic-amber";
  return "traffic-green";
}

export function buildAnalyticsOverviewModel(
  insights,
  {
    getAttemptHeadline = (attempt) => String(attempt?.topicName || attempt?.topicId || ""),
    formatModeLabel = (value) => String(value || ""),
    formatRelativeTime = () => "",
    formatDateTime = () => "",
  } = {},
) {
  const readiness = getAnalyticsReadinessState(insights);
  const weakestTopicLead = insights?.weakestTopic?.topicName && insights?.weakestTopic?.averageScore !== null
    ? `Weakest core topic: ${insights.weakestTopic.topicName} at ${insights.weakestTopic.averageScore}%. `
    : "";
  const latestWhen = formatRelativeTime(insights?.latestAttempt?.createdAt) || formatDateTime(insights?.latestAttempt?.createdAt);
  return {
    tone: readiness.tone,
    title: readiness.title,
    narrative: weakestTopicLead + readiness.body,
    signalChips: normalizeSignalChips(insights?.recommendation?.signalChips),
    latestText: insights?.latestAttempt
      ? `Latest scored session: ${getAttemptHeadline(insights.latestAttempt)} | ${formatModeLabel(insights.latestAttempt.mode)} | ${latestWhen}`
      : "No scored sessions yet.",
    scoreText: insights?.averageScore === null ? "-" : `${insights.averageScore}%`,
    streakText: `${Number(insights?.streakDays || 0)}`,
    attemptsText: `${Number(insights?.totalAttempts || 0)}`,
  };
}

export function buildAnalyticsTrendHtml(trendItems = [], { escapeHtml = (value) => String(value || "") } = {}) {
  const safeItems = Array.isArray(trendItems) ? trendItems : [];
  if (!safeItems.length) {
    return `
      <div class="analytic-item">
        <div class="analytic-value">-</div>
        <div class="analytic-label">No scored attempts yet</div>
        <p class="mock-breakdown-meta">Complete a practice or timed session to start tracking trend lines.</p>
      </div>
    `;
  }

  return safeItems
    .map(
      (entry) => `
        <div class="analytic-item ${entry.className}">
          <div class="analytic-value">${entry.score}%</div>
          <div class="analytic-label">${escapeHtml(entry.headline)}</div>
          <p class="mock-breakdown-meta">${escapeHtml(entry.meta)}</p>
          <p class="mock-breakdown-meta">${escapeHtml(entry.when)}</p>
        </div>
      `,
    )
    .join("");
}

export function buildAnalyticsConsistencyHtml(weeklyConsistency = [], { escapeHtml = (value) => String(value || "") } = {}) {
  const safeItems = Array.isArray(weeklyConsistency) ? weeklyConsistency : [];
  return safeItems
    .map(
      (entry) => `
        <div class="analytic-item ${entry.className}">
          <div class="analytic-value">${entry.count}</div>
          <div class="analytic-label">${escapeHtml(entry.dayLabel)}</div>
          <p class="mock-breakdown-meta">${escapeHtml(entry.dateLabel)}</p>
          <p class="mock-breakdown-meta">${entry.count === 1 ? "1 attempt" : `${entry.count} attempts`}</p>
        </div>
      `,
    )
    .join("");
}

export function buildAnalyticsHeatmapHtml(
  topicMastery = [],
  {
    escapeHtml = (value) => String(value || ""),
    getTrafficClassByPercentage = () => "",
  } = {},
) {
  const safeItems = Array.isArray(topicMastery) ? topicMastery : [];
  return safeItems
    .map((entry) => {
      const topicId = escapeHtml(String(entry.topicId || ""));
      if (entry.averageScore === null) {
        return `
          <div class="heatmap-tile" data-topic-id="${topicId}">
            <strong>${escapeHtml(entry.topicName)}</strong>
            <span>Not attempted yet</span>
          </div>
        `;
      }
      return `
        <div class="heatmap-tile drillable ${getTrafficClassByPercentage(entry.averageScore)}" data-topic-id="${topicId}">
          <strong>${escapeHtml(entry.topicName)}</strong>
          <span>${entry.averageScore}% average</span>
          <span>${entry.attempts} scored session${entry.attempts === 1 ? "" : "s"}</span>
        </div>
      `;
    })
    .join("");
}

export function buildAnalyticsRecommendationModel(insights) {
  return {
    title: String(insights?.recommendation?.title || ""),
    meta: String(insights?.recommendation?.meta || ""),
    signalChips: normalizeSignalChips(insights?.recommendation?.signalChips),
    confidenceLabel: String(insights?.recommendation?.confidenceLabel || "").trim(),
    confidenceDescription: String(insights?.recommendation?.confidenceDescription || "").trim(),
    confidenceTone: String(insights?.recommendation?.confidenceTone || "medium").trim().toLowerCase(),
  };
}

export function buildWeakSubcategoryHtml(weakestSub) {
  if (!weakestSub?.subcategoryName) return "";
  const accuracy = Number.isFinite(weakestSub.accuracy) ? weakestSub.accuracy : 0;
  const attempts = Number(weakestSub.sessions || 0);
  return `<div class="analytic-item ${getTrafficToneClass(accuracy)}"><div class="analytic-value">${accuracy}%</div><div class="analytic-label">${escapeHtml(weakestSub.subcategoryName)}</div></div><p class="hero-meta analytics-mini-meta">${attempts} session${attempts === 1 ? "" : "s"} across all topics</p>`;
}

export function buildMockHistoryHtml(mockAttempts, { escapeHtml = (s) => String(s || ""), formatRelativeTime = (s) => s, formatModeLabel = (s) => s } = {}) {
  if (!Array.isArray(mockAttempts) || mockAttempts.length === 0) return "";
  const rows = mockAttempts
    .map((att) => {
      const score = Number.isFinite(att.scorePercentage) ? Math.round(att.scorePercentage) : "?";
      const date = formatRelativeTime(String(att.createdAt || ""));
      const mode = formatModeLabel(att.mode || "");
      const template = att.templateName || att.templateId || "";
      const breakdown = Array.isArray(att.sourceTopicBreakdown) ? att.sourceTopicBreakdown : [];
      const details = breakdown
        .map((st) => {
          const acc = Number.isFinite(st.accuracy) ? st.accuracy : 0;
          const toneClass = acc < 40 ? "mock-source-chip-red" : acc < 60 ? "mock-source-chip-amber" : "mock-source-chip-green";
          return `<span class="mock-source-chip ${toneClass}"><span class="mock-source-name">${escapeHtml(st.topicName || st.topicId || "")}</span><span class="mock-source-acc">${acc}%</span></span>`;
        })
        .join(" ");
      return `<div class="mock-history-row"><div class="mock-history-head"><span class="mock-history-score">${escapeHtml(String(score))}%</span><span class="mock-history-date">${escapeHtml(date)}</span>${template ? `<span class="mock-history-template">${escapeHtml(template)}</span>` : ""}</div><div class="mock-history-breakdown">${details}</div></div>`;
    })
    .join("");
  return `<div class="mock-history-list">${rows}</div>`;
}

export function buildDifficultyGapHtml(weakestDiff) {
  if (!weakestDiff?.difficulty) return "";
  const accuracy = Number.isFinite(weakestDiff.accuracy) ? weakestDiff.accuracy : 0;
  const label = String(weakestDiff.difficulty).charAt(0).toUpperCase() + String(weakestDiff.difficulty).slice(1);
  const tip = accuracy < 50 ? `Focus on building ${label.toLowerCase()} fundamentals.`
    : accuracy < 70 ? `Keep practicing ${label.toLowerCase()} questions to improve.`
    : `${label} questions are under control — maintain with occasional review.`;
  return `<div class="analytic-item ${getTrafficToneClass(accuracy)}"><div class="analytic-value">${accuracy}%</div><div class="analytic-label">${escapeHtml(label)}</div></div><p class="hero-meta analytics-mini-meta">${escapeHtml(tip)}</p>`;
}

export function buildDashboardStatsModel(insights) {
  const totalAttempts = Number(insights?.totalAttempts || 0);
  const averageScore = insights?.averageScore === null || insights?.averageScore === undefined
    ? null
    : Number(insights.averageScore);
  const streakDays = Number(insights?.streakDays || 0);

  return {
    totalAttemptsText: String(totalAttempts),
    averageScoreText: Number.isFinite(averageScore) ? `${Math.round(averageScore)}%` : "-",
    streakText: `${streakDays} day${streakDays === 1 ? "" : "s"}`,
    streakBadgeText: streakDays > 0
      ? `${streakDays} day${streakDays === 1 ? "" : "s"} active`
      : "Take one quiz today to begin",
  };
}
