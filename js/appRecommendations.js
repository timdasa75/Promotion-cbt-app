import {
  buildRecentScoreSignal,
  classifyRecommendationPattern,
  getLatestMockWeakTopic,
} from "./analyticsShared.js";

export function buildDashboardRecommendationConfidence(topic, insights) {
  const fallbackTopicId = String(
    topic?.id || insights?.recommendedTopicId || insights?.weakestTopic?.topicId || insights?.latestMockWeakTopic?.topicId || "",
  ).trim();
  const fallbackTopicName = String(
    topic?.name || insights?.weakestTopic?.topicName || insights?.latestMockWeakTopic?.topicName || "",
  ).trim();
  const topicHistory = Array.isArray(insights?.topicMastery)
    ? insights.topicMastery.find((entry) => {
        const entryTopicId = String(entry?.topicId || "").trim();
        const entryTopicName = String(entry?.topicName || "").trim();
        return (fallbackTopicId && entryTopicId === fallbackTopicId) || (!fallbackTopicId && fallbackTopicName && entryTopicName === fallbackTopicName);
      })
    : null;
  const resolvedTopicId = String(topicHistory?.topicId || fallbackTopicId).trim();
  const resolvedTopicName = String(topicHistory?.topicName || fallbackTopicName).trim();
  const weakestTopicMatches =
    String(insights?.weakestTopic?.topicId || "").trim() === resolvedTopicId ||
    (resolvedTopicName && String(insights?.weakestTopic?.topicName || "").trim() === resolvedTopicName);
  const repeatedSubcategorySessions = weakestTopicMatches
    ? Number(insights?.weakestSubcategory?.sessions || 0)
    : 0;
  const topicAttempts = Number(topicHistory?.attempts || insights?.weakestTopic?.attempts || 0);
  const recentScoreSignal = insights?.recentScoreSignal || null;
  const latestTimingSignal = insights?.latestTimingSignal || null;
  const latestMockMatchesTopic =
    String(insights?.latestMockWeakTopic?.topicId || "").trim() === resolvedTopicId ||
    (resolvedTopicName && String(insights?.latestMockWeakTopic?.topicName || "").trim() === resolvedTopicName);
  const trendEvidence = recentScoreSignal?.direction && recentScoreSignal.direction !== "steady" ? 1 : 0;
  const timingEvidence = latestTimingSignal?.severity && latestTimingSignal.severity !== "steady" ? 1 : 0;
  const topicHistoryEvidence = topicAttempts >= 2 ? 1 : 0;
  const repeatedWeakEvidence = repeatedSubcategorySessions >= 2 ? 1 : 0;
  const alignedSignalCount =
    topicHistoryEvidence +
    repeatedWeakEvidence +
    trendEvidence +
    timingEvidence +
    (latestMockMatchesTopic ? 1 : 0);
  const hasStrongHistory = topicAttempts >= 4 || repeatedSubcategorySessions >= 3;
  const totalAttempts = Number(insights?.totalAttempts || 0);

  const patternLevel = classifyRecommendationPattern({
    alignedSignalCount,
    hasStrongHistory,
    totalAttempts,
    repeatedMinAttempts: 4,
    buildingMinAttempts: 2,
    allowStrongHistoryForBuilding: true,
  });

  if (patternLevel === "repeated") {
    return {
      label: "Repeated Pattern",
      tone: "high",
      description: "Repeated sessions and multiple aligned signals are pointing to the same follow-up move. This has moved beyond a developing signal because the same weak area keeps surfacing.",
    };
  }

  if (patternLevel === "building") {
    return {
      label: "Building Pattern",
      tone: "medium",
      description: "More than one signal is lining up, so this is moving beyond a one-off result, but it is still developing.",
    };
  }

  return {
    label: "Early Pattern",
    tone: "low",
    description: "This is a light starting signal from limited history and should be treated as a guide, not a rule.",
  };
}

export function buildDashboardRecommendationSignals(insights) {
  const signalChips = [];
  const recentScoreSignal = insights?.recentScoreSignal || null;
  const latestTimingSignal = insights?.latestTimingSignal || null;

  if (recentScoreSignal?.direction === "slipping") {
    signalChips.push(`Trend: Slipping ${Math.abs(Math.round(recentScoreSignal.delta))} pts`);
  } else if (recentScoreSignal?.direction === "improving") {
    signalChips.push(`Trend: Improving ${Math.round(recentScoreSignal.delta)} pts`);
  }

  if (latestTimingSignal?.severity === "high") {
    signalChips.push(
      latestTimingSignal.unansweredCount > 0
        ? `Pace: ${latestTimingSignal.unansweredCount} Unanswered`
        : "Pace: Under Pressure",
    );
  } else if (latestTimingSignal?.severity === "comfortable") {
    signalChips.push("Pace: Comfortable");
  }

  return signalChips;
}

export function buildRecommendation(
  insights,
  {
    mockExamTopicId = "",
    getAttemptTimingSignal = () => null,
    formatDifficultyLabel = (value) => String(value || ""),
    formatSessionDurationLabel = (value) => String(value ?? ""),
    formatGlBandLabel = (value) => String(value || ""),
    getAttemptHeadline = (attempt) => String(attempt?.topicName || attempt?.topicId || "this session"),
  } = {},
) {
  if (!insights.totalAttempts) {
    return {
      title: "Start with Public Service Rules.",
      meta: "Best next-step guidance sharpens after your first scored session.",
      signalChips: [],
      confidenceLabel: "",
      confidenceTone: "medium",
      confidenceDescription: "",
    };
  }

  const latestAttempt = insights.latestAttempt;
  const weakestTopic = insights.weakestTopic;
  const weakestSubcategory = insights.weakestSubcategory;
  const weakestDifficulty = insights.weakestDifficulty;
  const latestWeakTopic = insights.latestMockWeakTopic || getLatestMockWeakTopic(latestAttempt, mockExamTopicId);
  const recentScoreSignal = insights.recentScoreSignal || buildRecentScoreSignal(insights.attempts);
  const latestTimingSignal = insights.latestTimingSignal || getAttemptTimingSignal(latestAttempt);
  const recommendationConfidence = buildDashboardRecommendationConfidence({ id: insights.recommendedTopicId }, insights);
  const recommendationSignals = buildDashboardRecommendationSignals(insights);
  const isRepeatedPattern = recommendationConfidence.label === "Repeated Pattern";
  const isBuildingPattern = recommendationConfidence.label === "Building Pattern";
  const recommendationNotes = [];
  if (weakestDifficulty?.answered) {
    recommendationNotes.push(
      `${formatDifficultyLabel(weakestDifficulty.difficulty)} questions are averaging ${weakestDifficulty.accuracy}% accuracy.`,
    );
  }
  if (recentScoreSignal?.direction === "slipping") {
    recommendationNotes.push(
      `Recent scores have slipped ${Math.abs(Math.round(recentScoreSignal.delta))} points across the last ${recentScoreSignal.latestCount} scored session(s).`,
    );
  } else if (recentScoreSignal?.direction === "improving") {
    recommendationNotes.push(
      `Recent scores are up ${Math.round(recentScoreSignal.delta)} points across the last ${recentScoreSignal.latestCount} scored session(s).`,
    );
  }
  if (latestTimingSignal?.severity === "high") {
    recommendationNotes.push(
      latestTimingSignal.unansweredCount > 0
        ? `Latest timed run left ${latestTimingSignal.unansweredCount} question(s) unanswered, so pace needs attention.`
        : "Latest timed run used nearly the full allowed time.",
    );
  } else if (
    latestTimingSignal?.severity === "comfortable" &&
    Number(latestAttempt?.scorePercentage || 0) >= 70
  ) {
    recommendationNotes.push(
      `Latest timed run still finished with ${formatSessionDurationLabel(latestTimingSignal.remainingSeconds)} to spare.`,
    );
  }
  const latestGlBandLabel = formatGlBandLabel(latestAttempt?.glBand);
  if (
    latestAttempt?.topicId === mockExamTopicId &&
    latestGlBandLabel &&
    latestGlBandLabel !== "General"
  ) {
    recommendationNotes.push(`Latest mock profile: ${latestGlBandLabel}.`);
  }
  const notesSuffix = recommendationNotes.length ? ` ${recommendationNotes.join(" ")}` : "";
  const subcategoryLead =
    isRepeatedPattern
      ? "Repeated weak spot"
      : isBuildingPattern
        ? "Building weak spot"
        : Number(weakestSubcategory?.sessions || 0) > 1
          ? "Current weak spot"
          : "Emerging weak spot";

  if (weakestTopic && weakestSubcategory) {
    return {
      title:
        isRepeatedPattern
          ? recentScoreSignal?.direction === "slipping"
            ? `Prioritize rebuilding with ${weakestTopic.topicName}.`
            : `Prioritize ${weakestTopic.topicName} next.`
          : isBuildingPattern
            ? recentScoreSignal?.direction === "slipping"
              ? `Keep rebuilding with ${weakestTopic.topicName}.`
              : `Keep building with ${weakestTopic.topicName}.`
            : recentScoreSignal?.direction === "slipping"
              ? `Check in on ${weakestTopic.topicName}.`
              : `Explore ${weakestTopic.topicName} next.`,
      meta: `${subcategoryLead}: ${weakestSubcategory.subcategoryName} at ${weakestSubcategory.accuracy}% accuracy across ${weakestSubcategory.sessions} session(s).${notesSuffix}`,
      signalChips: recommendationSignals,
      confidenceLabel: recommendationConfidence.label,
      confidenceTone: recommendationConfidence.tone,
      confidenceDescription: recommendationConfidence.description,
    };
  }

  if (weakestTopic) {
    const latestContext =
      latestWeakTopic?.topicName && latestAttempt?.topicId === mockExamTopicId
        ? ` Latest mock dip: ${latestWeakTopic.topicName} at ${Math.round(Number(latestWeakTopic.accuracy || 0))}%.`
        : "";
    const topicLead = isRepeatedPattern
      ? "Repeated topic dip"
      : isBuildingPattern
        ? "Building topic dip"
        : "Current topic signal";
    return {
      title:
        isRepeatedPattern
          ? recentScoreSignal?.direction === "slipping"
            ? `Prioritize rebuilding with ${weakestTopic.topicName}.`
            : `Prioritize a timed drill on ${weakestTopic.topicName}.`
          : isBuildingPattern
            ? recentScoreSignal?.direction === "slipping"
              ? `Keep rebuilding with ${weakestTopic.topicName}.`
              : `Strengthen ${weakestTopic.topicName} with a timed drill.`
            : recentScoreSignal?.direction === "slipping"
              ? `Check in on ${weakestTopic.topicName}.`
              : `Sample ${weakestTopic.topicName} next.`,
      meta: `${topicLead}: average mastery there is ${weakestTopic.averageScore}% across ${weakestTopic.attempts} scored session(s).${latestContext}${notesSuffix}`,
      signalChips: recommendationSignals,
      confidenceLabel: recommendationConfidence.label,
      confidenceTone: recommendationConfidence.tone,
      confidenceDescription: recommendationConfidence.description,
    };
  }

  const latestHeadline = getAttemptHeadline(latestAttempt);
  return {
    title: isRepeatedPattern
      ? `Prioritize ${latestHeadline} once more.`
      : isBuildingPattern
        ? `Keep building with ${latestHeadline}.`
        : `Review ${latestHeadline} once more.`,
    meta: `${
      isRepeatedPattern
        ? "The same pressure signals keep resurfacing, so the best next step is a focused reinforcement pass."
        : isBuildingPattern
          ? "Multiple signals are lining up, so the best next step is a focused reinforcement pass."
          : "There is not enough topic-level history yet, so the best next step is a quick reinforcement pass."
    }${notesSuffix}`,
    signalChips: recommendationSignals,
    confidenceLabel: recommendationConfidence.label,
    confidenceTone: recommendationConfidence.tone,
    confidenceDescription: recommendationConfidence.description,
  };
}
