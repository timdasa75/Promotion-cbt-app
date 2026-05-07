import { getAnalyticsReadinessState } from "./appAnalytics.js";

function normalizeSignalChips(entries) {
  return Array.isArray(entries)
    ? entries.filter((entry) => String(entry || "").trim())
    : [];
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
      if (entry.averageScore === null) {
        return `
          <div class="heatmap-tile">
            <strong>${escapeHtml(entry.topicName)}</strong>
            <span>Not attempted yet</span>
          </div>
        `;
      }
      return `
        <div class="heatmap-tile ${getTrafficClassByPercentage(entry.averageScore)}">
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
