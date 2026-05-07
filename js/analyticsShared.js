import { formatTargetGlBandLabel } from "./studyFilters.js";

export function formatGlBandLabel(glBand) {
  return formatTargetGlBandLabel(glBand);
}

export function formatDifficultyLabel(difficulty) {
  const value = String(difficulty || "").trim().toLowerCase();
  if (!value) return "";
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function getTrafficClassByPercentage(percentage) {
  if (Number(percentage) >= 70) return "traffic-green";
  if (Number(percentage) >= 50) return "traffic-amber";
  return "traffic-red";
}

export function averageAttemptScores(attempts = []) {
  const scoredAttempts = Array.isArray(attempts)
    ? attempts
        .map((attempt) => Number(attempt?.scorePercentage))
        .filter((score) => Number.isFinite(score))
    : [];
  if (!scoredAttempts.length) return null;
  return Math.round(
    scoredAttempts.reduce((sum, score) => sum + score, 0) / scoredAttempts.length,
  );
}

export function buildRecentScoreSignal(attempts = []) {
  const scoredAttempts = Array.isArray(attempts)
    ? attempts.filter((attempt) => Number.isFinite(Number(attempt?.scorePercentage)))
    : [];
  if (scoredAttempts.length < 2) return null;

  const latestWindowSize = Math.min(3, Math.max(1, Math.floor(scoredAttempts.length / 2)));
  const latestWindow = scoredAttempts.slice(-latestWindowSize);
  const previousWindow = scoredAttempts.slice(
    Math.max(0, scoredAttempts.length - latestWindowSize * 2),
    Math.max(0, scoredAttempts.length - latestWindowSize),
  );
  const baselineWindow = previousWindow.length
    ? previousWindow
    : scoredAttempts.slice(0, Math.max(1, scoredAttempts.length - latestWindow.length));
  if (!baselineWindow.length) return null;

  const latestAverage = averageAttemptScores(latestWindow);
  const previousAverage = averageAttemptScores(baselineWindow);
  if (latestAverage === null || previousAverage === null) return null;

  const delta = latestAverage - previousAverage;
  let direction = "steady";
  if (delta >= 6) direction = "improving";
  if (delta <= -6) direction = "slipping";

  return {
    direction,
    delta,
    latestAverage,
    previousAverage,
    latestCount: latestWindow.length,
    previousCount: baselineWindow.length,
  };
}

export function buildTimingSignal({
  mode = "",
  allowedSeconds = 0,
  elapsedSeconds = 0,
  unansweredCount = 0,
} = {}) {
  if (String(mode || "").trim() !== "exam") return null;

  const safeAllowedSeconds = Math.max(0, Number(allowedSeconds || 0));
  if (safeAllowedSeconds <= 0) return null;

  const safeElapsedSeconds = Math.max(0, Math.min(safeAllowedSeconds, Number(elapsedSeconds || 0)));
  const safeUnansweredCount = Math.max(0, Number(unansweredCount || 0));
  const usedRatio = safeAllowedSeconds > 0 ? safeElapsedSeconds / safeAllowedSeconds : 0;

  let severity = "steady";
  if (safeUnansweredCount > 0 || usedRatio >= 0.95) {
    severity = "high";
  } else if (usedRatio <= 0.6) {
    severity = "comfortable";
  }

  return {
    severity,
    allowedSeconds: safeAllowedSeconds,
    elapsedSeconds: safeElapsedSeconds,
    remainingSeconds: Math.max(0, safeAllowedSeconds - safeElapsedSeconds),
    usedRatio,
    unansweredCount: safeUnansweredCount,
  };
}
