// questionPriority.js - pure helpers for metadata-aware question ordering

function shuffleArray(array) {
  const items = Array.isArray(array) ? [...array] : [];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function normalizeFocusPreference(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "weak_areas" ? "weak_areas" : "balanced";
}

function normalizeTags(tags) {
  return new Set(
    (Array.isArray(tags) ? tags : [])
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean),
  );
}

function countMatchingTags(normalizedTags, expectedTags) {
  if (!(normalizedTags instanceof Set) || !normalizedTags.size) return 0;
  return (Array.isArray(expectedTags) ? expectedTags : []).reduce(
    (count, tag) => count + (normalizedTags.has(String(tag || "").trim().toLowerCase()) ? 1 : 0),
    0,
  );
}

function normalizeQuestionText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeGLBandKey(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "_");
  if (!raw) return "";
  if (raw === "general") return "general";
  if (raw.startsWith("gl") && !raw.startsWith("gl_")) {
    return raw.replace(/^gl/, "gl_");
  }
  return raw;
}

export function questionMatchesGLBand(question, glBand) {
  const targetBand = normalizeGLBandKey(glBand);
  if (!targetBand || targetBand === "general") return false;
  const questionBands = Array.isArray(question?.glBands)
    ? question.glBands.map((entry) => normalizeGLBandKey(entry)).filter(Boolean)
    : [];
  return questionBands.includes(targetBand);
}

function aggregateBreakdownEntries(items = [], idKey) {
  const grouped = new Map();
  const entries = Array.isArray(items) ? items : [];

  entries.forEach((entry) => {
    const id = String(entry?.[idKey] || "").trim();
    if (!id) return;

    const total = Math.max(0, Number(entry?.total || 0));
    const answered = Math.max(0, Number(entry?.answered || 0));
    const correct = Math.max(0, Number(entry?.correct || 0));

    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        total: 0,
        answered: 0,
        correct: 0,
      });
    }

    const next = grouped.get(id);
    next.total += total;
    next.answered += answered;
    next.correct += correct;
  });

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    wrong: Math.max(0, entry.answered - entry.correct),
    accuracy: entry.answered > 0 ? Math.round((entry.correct / entry.answered) * 100) : 0,
  }));
}

function rankWeakAreas(entries = [], { maxItems = 5, minTotal = 1, threshold = 75 } = {}) {
  const ranked = (Array.isArray(entries) ? entries : [])
    .filter((entry) => Number(entry?.total || 0) >= minTotal)
    .sort((left, right) =>
      (left.accuracy || 0) - (right.accuracy || 0) ||
      (right.total || 0) - (left.total || 0) ||
      String(left.id || "").localeCompare(String(right.id || "")),
    );

  const belowThreshold = ranked.filter((entry) => (entry.accuracy || 0) < threshold);
  const source = belowThreshold.length ? belowThreshold : ranked;
  return source.slice(0, maxItems).map((entry) => entry.id);
}

function getRelevantAttempts(summary, currentTopicId, recentAttemptLimit) {
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  const topicId = String(currentTopicId || "").trim();
  const relevant = topicId
    ? attempts.filter((attempt) => {
        if (String(attempt?.topicId || "").trim() === topicId) return true;
        return Array.isArray(attempt?.sourceTopicBreakdown)
          ? attempt.sourceTopicBreakdown.some(
              (entry) => String(entry?.topicId || "").trim() === topicId,
            )
          : false;
      })
    : attempts;

  const selected = relevant.length >= 3 ? relevant : attempts;
  const limit = Math.max(1, Number(recentAttemptLimit || 12));
  return selected.slice(-limit);
}

function getDifficultyPreferenceScore(difficulty, glBand) {
  const band = normalizeGLBandKey(glBand);
  const level = String(difficulty || "").trim().toLowerCase();
  if (!level) return 0;

  if (band === "gl_16_17") {
    if (level === "hard") return 28;
    if (level === "medium") return 14;
    return 0;
  }

  if (band === "gl_15_16") {
    if (level === "medium") return 24;
    if (level === "hard") return 16;
    return 4;
  }

  if (band === "gl_14_15") {
    if (level === "easy") return 22;
    if (level === "medium") return 12;
    return 0;
  }

  return 0;
}

function getTagPreferenceScore(tags, glBand) {
  const normalizedTags = normalizeTags(tags);
  if (!normalizedTags.size) return 0;

  const band = normalizeGLBandKey(glBand);
  if (band === "gl_16_17") {
    const strategicTags = [
      "public_accountability",
      "risk_control",
      "risk_management",
      "decision_transparency",
      "strategic_alignment",
      "stakeholder_negotiation",
      "anti_corruption",
      "conflict_of_interest",
      "audit_trail",
      "stewardship",
      "governance",
    ];
    return strategicTags.some((tag) => normalizedTags.has(tag)) ? 18 : 0;
  }

  if (band === "gl_15_16") {
    const managerialTags = [
      "operational_discipline",
      "compliance_assurance",
      "record_management",
      "citizen_focused_service",
      "performance_standards",
      "service_integrity",
      "grievance",
      "service_delivery",
    ];
    return managerialTags.some((tag) => normalizedTags.has(tag)) ? 14 : 0;
  }

  if (band === "gl_14_15") {
    const foundationalTags = [
      "code_of_conduct",
      "registry",
      "records",
      "leave",
      "allowances",
      "training",
      "retirement",
      "posting_definition",
    ];
    return foundationalTags.some((tag) => normalizedTags.has(tag)) ? 12 : 0;
  }

  return 0;
}

function getSubcategoryPreferenceScore(question, glBand) {
  const band = normalizeGLBandKey(glBand);
  const subcategoryId = String(question?.sourceSubcategoryId || "").trim();
  if (!band || !subcategoryId) return 0;

  const scoreMap = {
    gl_15_16: {
      fin_budgeting: 10,
      fin_procurement: 10,
      fin_audits_sanctions: 14,
      proc_bidding_evaluation: 10,
      proc_transparency_ethics: 12,
      proc_implementation_sanctions: 14,
      clg_legal_compliance: 10,
      foi_exemptions_public_interest: 12,
      foi_offences_penalties: 12,
      csh_service_delivery_grievance: 10,
      eth_anti_corruption: 12,
      eth_conflict_interest: 10,
      lead_management_performance: 10,
      lead_strategic_management: 14,
      neg_dispute_law: 12,
      ict_e_governance: 10,
      ict_security: 14,
      pol_analysis_methods: 10,
      pol_implementation_evaluation: 14,
      pol_public_sector_planning: 14,
      ca_public_service_reforms: 10,
      ca_national_governance: 10,
      comp_verbal_reasoning: 10,
    },
    gl_16_17: {
      psr_discipline: 10,
      circ_personnel_performance: 10,
      fin_audits_sanctions: 16,
      proc_transparency_ethics: 16,
      proc_implementation_sanctions: 16,
      foi_exemptions_public_interest: 14,
      foi_offences_penalties: 14,
      eth_anti_corruption: 16,
      eth_conflict_interest: 14,
      lead_strategic_management: 18,
      neg_dispute_law: 14,
      ict_security: 14,
      pol_implementation_evaluation: 18,
      pol_public_sector_planning: 16,
      ca_public_service_reforms: 12,
      ca_national_governance: 12,
      ca_international_affairs: 10,
      comp_verbal_reasoning: 12,
    },
  };

  return scoreMap[band]?.[subcategoryId] || 0;
}

function getQuestionTypePreferenceScore(questionType, glBand) {
  const band = normalizeGLBandKey(glBand);
  const type = String(questionType || "").trim().toLowerCase();
  if (!band || !type) return 0;

  if (band === "gl_16_17") {
    if (type.includes("scenario")) return 18;
    if (type.includes("judgement")) return 12;
    return 0;
  }

  if (band === "gl_15_16") {
    if (type.includes("scenario")) return 14;
    if (type.includes("judgement")) return 10;
    return 0;
  }

  return 0;
}

function getScenarioSignalScore(question, glBand) {
  const band = normalizeGLBandKey(glBand);
  if (!band || band === "general" || band === "gl_14_15") return 0;

  const normalizedTags = normalizeTags(question?.tags);
  const normalizedText = normalizeQuestionText(question?.question || question?.prompt || "");
  const questionType = String(question?.questionType || "").trim().toLowerCase();

  const tagSignalsByBand = {
    gl_15_16: [
      "governance",
      "risk_management",
      "compliance_assurance",
      "performance_standards",
      "service_delivery",
      "service_integrity",
      "grievance",
      "record_management",
      "stakeholder_negotiation",
      "public_accountability",
      "operational_discipline",
      "contingency",
    ],
    gl_16_17: [
      "governance",
      "risk_management",
      "risk_control",
      "public_accountability",
      "strategic_alignment",
      "stakeholder_negotiation",
      "anti_corruption",
      "conflict_of_interest",
      "audit_trail",
      "stewardship",
      "decision_transparency",
      "contingency",
    ],
  };

  const scenarioPatterns = [
    /\bwhich (?:action|option|response|step) best\b/,
    /\bwhat should\b/,
    /\bhow should\b/,
    /\bduring\b/,
    /\bfaced with\b/,
    /\bin response to\b/,
    /\bto address\b/,
    /\bcompeting priorities\b/,
    /\ba (?:director|supervisor|manager|unit|department|ministry|agency)\b/,
    /\breceives?\b/,
    /\breview(?:ing|s)\b/,
  ];

  let score = 0;
  const matchingTags = countMatchingTags(normalizedTags, tagSignalsByBand[band] || []);
  if (matchingTags > 0) {
    const maxTagBoost = band === "gl_16_17" ? 24 : 18;
    score += Math.min(maxTagBoost, matchingTags * 6);
  }

  const patternMatches = scenarioPatterns.reduce(
    (count, pattern) => count + (pattern.test(normalizedText) ? 1 : 0),
    0,
  );
  if (patternMatches >= 3) {
    score += band === "gl_16_17" ? 18 : 14;
  } else if (patternMatches >= 1) {
    score += band === "gl_16_17" ? 9 : 7;
  }

  if (questionType.includes("scenario") || questionType.includes("case")) {
    score += band === "gl_16_17" ? 14 : 10;
  }

  return score;
}

export function buildQuestionSelectionProfile(
  summary,
  {
    currentTopicId = "",
    glBand = "",
    mode = "practice",
    recentAttemptLimit = 12,
    focusPreference = "balanced",
  } = {},
) {
  const recentAttempts = getRelevantAttempts(summary, currentTopicId, recentAttemptLimit);
  const subcategoryEntries = aggregateBreakdownEntries(
    recentAttempts.flatMap((attempt) =>
      Array.isArray(attempt?.subcategoryBreakdown) ? attempt.subcategoryBreakdown : [],
    ),
    "subcategoryId",
  );
  const difficultyEntries = aggregateBreakdownEntries(
    recentAttempts.flatMap((attempt) =>
      Array.isArray(attempt?.difficultyBreakdown) ? attempt.difficultyBreakdown : [],
    ),
    "difficulty",
  );
  const topicEntries = aggregateBreakdownEntries(
    recentAttempts.flatMap((attempt) =>
      Array.isArray(attempt?.sourceTopicBreakdown) ? attempt.sourceTopicBreakdown : [],
    ),
    "topicId",
  );

  return {
    currentTopicId: String(currentTopicId || "").trim(),
    glBand: normalizeGLBandKey(glBand),
    mode: String(mode || "practice").trim().toLowerCase(),
    focusPreference: normalizeFocusPreference(focusPreference),
    weakSubcategoryIds: new Set(
      rankWeakAreas(subcategoryEntries, { maxItems: 6, minTotal: 2, threshold: 76 }),
    ),
    weakDifficultyIds: new Set(
      rankWeakAreas(difficultyEntries, { maxItems: 2, minTotal: 2, threshold: 74 }),
    ),
    weakTopicIds: new Set(
      rankWeakAreas(topicEntries, { maxItems: 4, minTotal: 2, threshold: 72 }),
    ),
  };
}

export function scoreQuestionForSelection(question, profile = {}) {
  if (!question || typeof question !== "object") return 0;

  let score = 0;
  const glBand = normalizeGLBandKey(profile?.glBand);
  const weakAreaMultiplier = profile?.focusPreference === "weak_areas" ? 1.85 : 1;

  if (glBand && glBand !== "general") {
    if (questionMatchesGLBand(question, glBand)) {
      score += 160;
    } else if (Array.isArray(question?.glBands) && question.glBands.length) {
      score -= 20;
    }
  }

  const subcategoryId = String(question?.sourceSubcategoryId || "").trim();
  if (subcategoryId && profile?.weakSubcategoryIds instanceof Set && profile.weakSubcategoryIds.has(subcategoryId)) {
    score += Math.round(95 * weakAreaMultiplier);
  }

  const topicId = String(question?.sourceTopicId || "").trim();
  if (topicId && profile?.weakTopicIds instanceof Set && profile.weakTopicIds.has(topicId)) {
    score += Math.round(55 * weakAreaMultiplier);
  }

  const difficulty = String(question?.difficulty || "").trim().toLowerCase();
  if (difficulty && profile?.weakDifficultyIds instanceof Set && profile.weakDifficultyIds.has(difficulty)) {
    score += Math.round(42 * weakAreaMultiplier);
  }

  score += getDifficultyPreferenceScore(difficulty, glBand);
  score += getTagPreferenceScore(question?.tags, glBand);
  score += getSubcategoryPreferenceScore(question, glBand);
  score += getQuestionTypePreferenceScore(question?.questionType, glBand);
  score += getScenarioSignalScore(question, glBand);

  if (profile?.mode === "practice" && subcategoryId && profile?.weakSubcategoryIds instanceof Set && profile.weakSubcategoryIds.has(subcategoryId)) {
    score += Math.round(12 * weakAreaMultiplier);
  }

  return score;
}

export function prioritizeQuestionPool(pool, profile = {}) {
  const shuffled = shuffleArray(Array.isArray(pool) ? pool : []);
  if (!shuffled.length) return [];

  const hasSignals =
    Boolean(normalizeGLBandKey(profile?.glBand)) ||
    (profile?.weakSubcategoryIds instanceof Set && profile.weakSubcategoryIds.size > 0) ||
    (profile?.weakDifficultyIds instanceof Set && profile.weakDifficultyIds.size > 0) ||
    (profile?.weakTopicIds instanceof Set && profile.weakTopicIds.size > 0);

  if (!hasSignals) return shuffled;

  return shuffled
    .map((question, index) => ({
      question,
      index,
      score: scoreQuestionForSelection(question, profile),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.question);
}
