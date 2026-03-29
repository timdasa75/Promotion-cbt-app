/**
 * Produce a shuffled copy of the provided array using a Fisher–Yates shuffle.
 * @param {Array} array - The array to shuffle; non-array inputs are treated as an empty array.
 * @returns {Array} A new array containing the elements of `array` in randomized order.
 */

function shuffleArray(array) {
  const items = Array.isArray(array) ? [...array] : [];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

/**
 * Normalize a focus preference to either "weak_areas" or "balanced".
 * @param {*} value - Preference value; compared case-insensitively after trimming.
 * @returns {'weak_areas'|'balanced'} `'weak_areas'` if `value` equals `"weak_areas"` (case-insensitive, trimmed), `'balanced'` otherwise.
 */
function normalizeFocusPreference(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "weak_areas" ? "weak_areas" : "balanced";
}

/**
 * Produces a set of normalized tag strings from an input list.
 * @param {Array<any>} tags - Array of tag values; non-array inputs are treated as empty.
 * @returns {Set<string>} A Set of lowercase, trimmed, non-empty tag strings.
 */
function normalizeTags(tags) {
  return new Set(
    (Array.isArray(tags) ? tags : [])
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Count how many expected tag values exist in a normalized set of tags.
 * @param {Set<string>} normalizedTags - A set of tag strings that are already lowercased and trimmed.
 * @param {Array<string>} expectedTags - An array of tag values; each entry will be coerced to string, trimmed, and lowercased before checking.
 * @returns {number} The number of entries from `expectedTags` found in `normalizedTags`.
 */
function countMatchingTags(normalizedTags, expectedTags) {
  if (!(normalizedTags instanceof Set) || !normalizedTags.size) return 0;
  return (Array.isArray(expectedTags) ? expectedTags : []).reduce(
    (count, tag) => count + (normalizedTags.has(String(tag || "").trim().toLowerCase()) ? 1 : 0),
    0,
  );
}

/**
 * Normalizes question text for comparison and matching.
 * @param {*} value - Input text or value to normalize; falsy values become an empty string.
 * @returns {string} The text coerced to a string, trimmed, lowercased, with consecutive whitespace collapsed to single spaces.
 */
function normalizeQuestionText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Canonicalizes a GL band identifier into a normalized key.
 * @param {*} value - The input value to normalize; falsy values yield an empty string.
 * @returns {string} A normalized GL band key (for example, "gl_16_17" or "general"), or an empty string if the input is empty or cannot be normalized.
 */
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

/**
 * Determine whether a question belongs to the given GL band.
 * @param {Object} question - Question object that may include a `glBands` array of band identifiers.
 * @param {string} glBand - Target GL band identifier to check (will be normalized).
 * @returns {boolean} `true` if the question's normalized GL bands include the normalized target band, `false` otherwise.
 */
export function questionMatchesGLBand(question, glBand) {
  const targetBand = normalizeGLBandKey(glBand);
  if (!targetBand || targetBand === "general") return false;
  const questionBands = Array.isArray(question?.glBands)
    ? question.glBands.map((entry) => normalizeGLBandKey(entry)).filter(Boolean)
    : [];
  return questionBands.includes(targetBand);
}

/**
 * Aggregate breakdown entries by a specified id field, summing counts and deriving wrong and accuracy.
 *
 * @param {Array<Object>} items - Array of breakdown entries; each entry may contain the id field, and numeric `total`, `answered`, and `correct` properties.
 * @param {string} idKey - The property name to use as the grouping id for each entry (coerced to trimmed string); entries with empty id are skipped.
 * @returns {Array<Object>} An array of aggregated entries with keys: `id` (string), `total` (number), `answered` (number), `correct` (number), `wrong` (number, = max(0, answered - correct)), and `accuracy` (integer percentage, = round((correct / answered) * 100) or 0 when answered is 0).
 */
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

/**
 * Selects the identifiers that represent the weakest performance areas from a list of breakdown entries.
 *
 * Filters out entries with total below `minTotal`, sorts remaining entries by ascending accuracy, then by descending total, then by id, and returns up to `maxItems` ids. If any entries have accuracy below `threshold`, only those below-threshold entries are considered for the top selection; otherwise the full sorted list is used.
 *
 * @param {Array<Object>} entries - Array of breakdown entries each expected to contain at least an `id` and numeric `total`; entries may also include `accuracy`, `answered`, and `correct`.
 * @param {Object} [options] - Selection options.
 * @param {number} [options.maxItems=5] - Maximum number of ids to return.
 * @param {number} [options.minTotal=1] - Minimum `total` required for an entry to be considered.
 * @param {number} [options.threshold=75] - Accuracy threshold used to prefer below-threshold entries.
 * @returns {Array<string|number>} An array of selected entry ids (up to `maxItems`) representing the weakest areas.
 */
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

/**
 * Selects the most recent attempts relevant to an optional topic and returns the last N of them.
 *
 * Filters summary.attempts by currentTopicId (matching attempt.topicId or any entry.topicId in attempt.sourceTopicBreakdown). If the filtered list has fewer than 3 items, the full attempts list is used instead. The returned array contains up to `recentAttemptLimit` of the most recent attempts (default 12), where `recentAttemptLimit` is coerced to a minimum of 1.
 * 
 * @param {Object} summary - Object that may contain an `attempts` array.
 * @param {string} [currentTopicId] - Optional topic id to scope attempts; trimmed and compared as a string.
 * @param {number} [recentAttemptLimit=12] - Maximum number of recent attempts to return; coerced to an integer >= 1.
 * @returns {Array<Object>} An array of attempt objects (most recent last) limited to the specified count.
 */
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

/**
 * Compute a numeric preference score for a difficulty label within a GL band.
 *
 * @param {string} difficulty - Difficulty label (e.g., "easy", "medium", "hard"); input is trimmed and lowercased.
 * @param {string} glBand - GL band identifier (e.g., "gl_16_17"); value is normalized before lookup.
 * @returns {number} Preference score according to the band-specific mapping:
 * - gl_16_17: `hard` → 28, `medium` → 14, others → 0
 * - gl_15_16: `medium` → 24, `hard` → 16, others → 4
 * - gl_14_15: `easy` → 22, `medium` → 12, others → 0
 * - any other or empty difficulty → 0
 */
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

/**
 * Assigns a small preference score when question tags contain band-specific important tags.
 * @param {Array|string|Set} tags - Question tags; accepts an array, Set, or other iterable of tag strings. Non-array inputs are coerced and empty/invalid inputs yield no score.
 * @param {string} glBand - GL band identifier (will be normalized); if empty or "general" no band-specific score is applied.
 * @returns {number} 18 if any strategic tag is present for `gl_16_17`, 14 if any managerial tag is present for `gl_15_16`, 12 if any foundational tag is present for `gl_14_15`, `0` otherwise. */
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

/**
 * Compute a band-specific preference score based on the question's source subcategory.
 * @param {Object} question - Question object; the function reads `question.sourceSubcategoryId`.
 * @param {string} glBand - GL band identifier (will be normalized). Supported bands with scores in the map include `gl_15_16` and `gl_16_17`.
 * @returns {number} The mapped preference score for the normalized band and subcategory, or `0` if the band or subcategory is not recognized.
 */
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

/**
 * Assigns a GL-band-specific preference score based on the question type label.
 *
 * Maps common type labels to numeric preference weights for supported bands:
 * - gl_16_17: `"scenario"` → 18, `"judgement"` → 12
 * - gl_15_16: `"scenario"` → 14, `"judgement"` → 10
 * All other bands or missing/empty inputs yield 0.
 *
 * @param {string} questionType - Question type label to evaluate (e.g., "scenario", "judgement").
 * @param {string} glBand - GL band identifier (will be normalized before matching).
 * @returns {number} The preference score for the given type and band, or `0` if no applicable match.
 */
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

/**
 * Computes a scenario/case relevance score for a question using tags, question text, and question type.
 *
 * Examines normalized tags, common scenario/case text patterns, and the question type to produce a numeric signal
 * that boosts questions resembling scenario/case items for supported GL bands; returns 0 for an empty or unsupported
 * band (including `"general"` and `"gl_14_15"`).
 *
 * @param {Object} question - The question object (may contain `tags`, `question`, `prompt`, and `questionType`).
 * @param {string} glBand - The requested GL band identifier (will be normalized).
 * @returns {number} The accumulated scenario/case signal score (0 when no signal applies). 
 */
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

/**
 * Build a selection profile describing the learner context and recent weak areas used to score questions.
 *
 * @param {Object} summary - Attempts summary object containing recent attempts and breakdowns.
 * @param {Object} [options] - Profile construction options.
 * @param {string} [options.currentTopicId=""] - Topic id to scope recent attempts; trimmed to a string.
 * @param {string} [options.glBand=""] - Desired GL band identifier; normalized via normalizeGLBandKey.
 * @param {string} [options.mode="practice"] - Mode string; trimmed and lowercased.
 * @param {number} [options.recentAttemptLimit=12] - Maximum number of recent attempts to consider (coerced to at least 1).
 * @param {string} [options.focusPreference="balanced"] - Focus preference normalized to `"weak_areas"` or `"balanced"`.
 * @returns {Object} An object containing:
 *  - currentTopicId: trimmed topic id string,
 *  - glBand: normalized GL band key,
 *  - mode: normalized mode string,
 *  - focusPreference: normalized focus preference,
 *  - weakSubcategoryIds: Set of weak subcategory ids,
 *  - weakDifficultyIds: Set of weak difficulty ids,
 *  - weakTopicIds: Set of weak topic ids.
 */
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

/**
 * Compute a numeric relevance score for a question using a selection profile.
 *
 * The score combines GL-band compatibility, weak-area membership (subcategory, topic, difficulty),
 * and several preference signals (difficulty, tags, subcategory mapping, question type, scenario signals).
 * A higher score indicates greater priority for selection.
 *
 * @param {Object} question - The question record to score. Expected readable properties include:
 *   `glBands`, `sourceSubcategoryId`, `sourceTopicId`, `difficulty`, `tags`, and `questionType`.
 * @param {Object} [profile={}] - Selection profile and preference signals.
 *   @param {string} [profile.glBand] - Requested GL band (will be normalized).
 *   @param {string} [profile.focusPreference] - Focus mode; `"weak_areas"` increases weak-area boosts.
 *   @param {Set<string>} [profile.weakSubcategoryIds] - Weak subcategory ids.
 *   @param {Set<string>} [profile.weakTopicIds] - Weak topic ids.
 *   @param {Set<string>} [profile.weakDifficultyIds] - Weak difficulty ids (lowercased).
 *   @param {string} [profile.mode] - Selection mode, e.g., `"practice"`.
 * @returns {number} The computed relevance score; larger values indicate higher priority.
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

/**
 * Order a pool of questions for selection using profile signals and stable tie-breaking.
 *
 * @param {Array} pool - Array of question objects to prioritize.
 * @param {Object} [profile] - Selection profile that may contain scoring signals.
 * @param {string} [profile.glBand] - Normalized GL band hint used to prefer matching questions.
 * @param {Set<string>} [profile.weakSubcategoryIds] - IDs of weak subcategories to boost.
 * @param {Set<string>} [profile.weakDifficultyIds] - Difficulty labels to boost.
 * @param {Set<string>} [profile.weakTopicIds] - IDs of weak topics to boost.
 * @returns {Array} An array of the input questions reordered so higher-relevance questions appear earlier; if no scoring signals are present, returns a randomly shuffled copy of the input.
 */
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
