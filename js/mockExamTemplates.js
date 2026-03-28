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

export function sanitizeBlueprint(blueprint) {
  if (!Array.isArray(blueprint)) return [];
  return blueprint
    .map((entry) => ({
      topicId: String(entry?.topicId || "").trim(),
      count: Math.max(0, Math.floor(Number(entry?.count || 0))),
    }))
    .filter((entry) => entry.topicId && entry.count > 0);
}

export function getDefaultMockExamBlueprint() {
  return sanitizeBlueprint(DEFAULT_MOCK_EXAM_BLUEPRINT);
}

function sanitizeWeightEntries(topicWeights = {}) {
  return Object.entries(topicWeights || {})
    .map(([topicId, rawWeight], index) => ({
      topicId: String(topicId || "").trim(),
      weight: Number(rawWeight),
      index,
    }))
    .filter((entry) => entry.topicId && Number.isFinite(entry.weight) && entry.weight > 0);
}

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
