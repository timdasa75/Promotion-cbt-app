export const DEFAULT_MOCK_EXAM_TEMPLATE_ID = "general";
export const DEFAULT_MOCK_EXAM_BLUEPRINT = Object.freeze([
  { topicId: "psr", count: 4 },
  { topicId: "financial_regulations", count: 4 },
  { topicId: "procurement_act", count: 4 },
  { topicId: "constitutional_law", count: 4 },
  { topicId: "civil_service_admin", count: 4 },
  { topicId: "leadership_management", count: 4 },
  { topicId: "ict_management", count: 4 },
  { topicId: "policy_analysis", count: 4 },
  { topicId: "general_current_affairs", count: 4 },
  { topicId: "competency_framework", count: 4 },
]);

export const SUPPORTED_GL_BANDS = Object.freeze([
  "general",
  "GL14_15",
  "GL15_16",
  "GL16_17",
]);

/**
 * Produce a sanitized blueprint: an array of topic/count entries suitable for use as a mock-exam blueprint.
 * @param {Array} blueprint - Input array whose entries may contain `topicId` and `count`; any non-array input is treated as empty.
 * @returns {Array<{topicId: string, count: number}>} Array of entries where `topicId` is a trimmed non-empty string and `count` is an integer greater than 0.
export function sanitizeBlueprint(blueprint) {
  if (!Array.isArray(blueprint)) return [];
  return blueprint
    .map((entry) => ({
      topicId: String(entry?.topicId || "").trim(),
      count: Math.max(0, Math.floor(Number(entry?.count || 0))),
    }))
    .filter((entry) => entry.topicId && entry.count > 0);
}

/**
 * Retrieve the sanitized default mock exam blueprint.
 *
 * @returns {Array<{topicId: string, count: number}>} An array of blueprint entries for the default template; each entry has a trimmed, non-empty `topicId` and a positive integer `count`.
 */
export function getDefaultMockExamBlueprint() {
  return sanitizeBlueprint(DEFAULT_MOCK_EXAM_BLUEPRINT);
}

/**
 * Convert a mapping of topic weights into a sanitized array of weight entries.
 * @param {Object<string, *>} topicWeights - Object whose keys are topic IDs and values are raw weights; falsy input is treated as empty.
 * @returns {Array<{topicId: string, weight: number, index: number}>} An array of entries where `topicId` is trimmed, `weight` is a finite number greater than 0, and `index` is the original enumeration order.
 */
function sanitizeWeightEntries(topicWeights = {}) {
  return Object.entries(topicWeights || {})
    .map(([topicId, rawWeight], index) => ({
      topicId: String(topicId || "").trim(),
      weight: Number(rawWeight),
      index,
    }))
    .filter((entry) => entry.topicId && Number.isFinite(entry.weight) && entry.weight > 0);
}

/**
 * Convert a map of topic weights into an array of normalized relative weights.
 * @param {Object<string, number>} topicWeights - Object whose keys are topic IDs and values are numeric weights.
 * @returns {Array<{topicId: string, weight: number, rawWeight: number, index: number}>} Array of entries where `weight` is the normalized fraction of the total, `rawWeight` is the original numeric weight, and `index` is the original entry order; returns an empty array if no valid entries or total weight is zero or negative.
 */
export function normalizeRelativeTopicWeights(topicWeights = {}) {
  const entries = sanitizeWeightEntries(topicWeights);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!entries.length || totalWeight <= 0) return [];

  return entries.map((entry) => ({
    topicId: entry.topicId,
    weight: entry.weight / totalWeight,
    rawWeight: entry.weight,
    index: entry.index,
  }));
}

/**
 * Allocate a total number of questions across topics according to their relative weights.
 *
 * Converts the provided relative weights into integer question counts that sum to the requested total by
 * assigning each topic the floor of its proportional quota and then distributing any remaining slots to topics
 * with the largest fractional remainders (ties broken by larger weight then original index). Topics with
 * non-positive or invalid weights are ignored.
 *
 * @param {Object} topicWeights - An object mapping topicId (string) to a numeric weight.
 * @param {number} [totalQuestions=40] - The total number of questions to allocate; non-integer values are floored and negative values are treated as 0.
 * @returns {Array<{topicId: string, count: number}>} An array of topic allocations with positive `count` values, ordered by each topic's original index.
export function allocateQuestionsByRelativeWeights(topicWeights = {}, totalQuestions = 40) {
  const normalizedEntries = normalizeRelativeTopicWeights(topicWeights);
  const total = Math.max(0, Math.floor(Number(totalQuestions || 0)));
  if (!normalizedEntries.length || total <= 0) return [];

  const allocations = normalizedEntries.map((entry) => {
    const quota = entry.weight * total;
    const baseCount = Math.floor(quota);
    return {
      topicId: entry.topicId,
      count: baseCount,
      remainder: quota - baseCount,
      weight: entry.weight,
      index: entry.index,
    };
  });

  let allocated = allocations.reduce((sum, entry) => sum + entry.count, 0);
  const slotsRemaining = Math.max(0, total - allocated);

  allocations
    .slice()
    .sort((left, right) => {
      if (right.remainder !== left.remainder) return right.remainder - left.remainder;
      if (right.weight !== left.weight) return right.weight - left.weight;
      return left.index - right.index;
    })
    .slice(0, slotsRemaining)
    .forEach((entry) => {
      const target = allocations.find((item) => item.topicId === entry.topicId);
      if (target) target.count += 1;
    });

  allocated = allocations.reduce((sum, entry) => sum + entry.count, 0);
  if (allocated !== total && allocations.length) {
    allocations[0].count += total - allocated;
  }

  return allocations
    .filter((entry) => entry.count > 0)
    .sort((left, right) => left.index - right.index)
    .map(({ topicId, count }) => ({ topicId, count }));
}

/**
 * Build a mock exam blueprint from a template, GL-band weight definitions, or a fallback.
 *
 * The function returns the first available blueprint in this priority:
 * 1. `template.sections` (sanitized) if present and non-empty.
 * 2. An allocation derived from `glBand` + `glBandWeights` using `template.totalQuestions`.
 * 3. The sanitized `fallbackBlueprint`.
 *
 * @param {Object} [options] - Options bag.
 * @param {Object|null} [options.template=null] - Template object that may contain:
 *   `sections` (array of { topicId, count }), `glBand` (string), and `totalQuestions` (number).
 * @param {Object} [options.glBandWeights={}] - Mapping of GL band identifiers to weight definitions
 *   (expected shape: { [glBand]: { topicWeights: { [topicId]: number } } }).
 * @param {Array|Object|null} [options.fallbackBlueprint=null] - Fallback blueprint to sanitize and use
 *   if no template sections or weight-based allocation produce a blueprint.
 * @returns {Array<{topicId: string, count: number}>} An array of sanitized blueprint entries with
 *   `topicId` and positive integer `count`. Empty array if no valid source produced entries.
 */
export function buildMockExamBlueprint({ template = null, glBandWeights = {}, fallbackBlueprint = null } = {}) {
  const templateSections = sanitizeBlueprint(template?.sections);
  if (templateSections.length) {
    return templateSections;
  }

  const glBand = String(template?.glBand || "").trim();
  const topicWeights =
    glBand && glBand !== "general" && glBandWeights && typeof glBandWeights === "object"
      ? glBandWeights[glBand]?.topicWeights || {}
      : {};
  const totalQuestions = Math.max(0, Math.floor(Number(template?.totalQuestions || 0)));
  const weightedBlueprint = allocateQuestionsByRelativeWeights(topicWeights, totalQuestions);
  if (weightedBlueprint.length) {
    return weightedBlueprint;
  }

  return sanitizeBlueprint(fallbackBlueprint);
}
