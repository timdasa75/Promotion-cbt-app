import { normalizeEmail, normalizeFeedbackCategory, normalizeFeedbackSource, normalizeFeedbackStatus, normalizePlan, normalizeRole, normalizeStatus, normalizeUpgradeRequestStatus, toIsoTimestamp } from "./authNormalization.js";

const CLOUD_PROGRESS_MAX_ATTEMPTS = 50;
const CLOUD_PROGRESS_MAX_SUMMARY_BYTES = 300000;
const CLOUD_PROGRESS_MAX_RETRY_QUEUE_ITEMS = 300;
const CLOUD_PROGRESS_MAX_RETRY_QUEUE_BYTES = 650000;
const CLOUD_PROGRESS_MAX_SPACED_QUEUE_BYTES = 650000;

export function readFirestoreStringField(field) {
  if (!field || typeof field !== "object") return "";
  if (typeof field.stringValue === "string") return field.stringValue;
  if (typeof field.timestampValue === "string") return field.timestampValue;
  return "";
}

export function buildFirestoreProfileFields(profile) {
  return {
    email: { stringValue: normalizeEmail(profile?.email || "") },
    name: { stringValue: String(profile?.name || profile?.email || "User") },
    plan: { stringValue: normalizePlan(profile?.plan) },
    role: { stringValue: normalizeRole(profile?.role) },
    status: { stringValue: normalizeStatus(profile?.status) },
    createdAt: { timestampValue: toIsoTimestamp(profile?.createdAt) },
    lastSeenAt: { timestampValue: toIsoTimestamp(profile?.lastSeenAt) },
    emailVerified: { booleanValue: Boolean(profile?.emailVerified) },
  };
}

export function buildFirestoreUpgradeRequestFields(request) {
  const status = normalizeUpgradeRequestStatus(request?.status);
  return {
    requestId: { stringValue: String(request?.requestId || "").trim() },
    userId: { stringValue: String(request?.userId || "").trim() },
    email: { stringValue: normalizeEmail(request?.email || "") },
    status: { stringValue: status === "none" ? "pending" : status },
    paymentReference: { stringValue: String(request?.reference || "").trim() },
    amountPaid: { stringValue: String(request?.amount || "").trim() },
    billingCycle: { stringValue: String(request?.billingCycle || "").trim() },
    note: { stringValue: String(request?.note || "").trim() },
    submittedAt: { stringValue: toIsoTimestamp(request?.submittedAt) },
    reviewedAt: { stringValue: String(request?.reviewedAt || "").trim() },
    reviewedBy: { stringValue: normalizeEmail(request?.reviewedBy || "") },
    reviewNote: { stringValue: String(request?.reviewNote || "").trim() },
  };
}

export function parseFirestoreProfileDocument(document) {
  const fields = document?.fields || {};
  const pathParts = String(document?.name || "").split("/");
  const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");
  const hasExplicitVerifiedField =
    Object.prototype.hasOwnProperty.call(fields, "emailVerified") &&
    Object.prototype.hasOwnProperty.call(fields?.emailVerified || {}, "booleanValue");
  return {
    id,
    email: normalizeEmail(fields?.email?.stringValue || ""),
    name: String(fields?.name?.stringValue || ""),
    plan: normalizePlan(fields?.plan?.stringValue || "free"),
    billingCycle: String(
      readFirestoreStringField(fields?.billingCycle) ||
        readFirestoreStringField(fields?.subscriptionType) ||
        readFirestoreStringField(fields?.planInterval) ||
        "",
    ),
    role: normalizeRole(fields?.role?.stringValue || "user"),
    status: normalizeStatus(fields?.status?.stringValue || "active"),
    createdAt: String(fields?.createdAt?.timestampValue || ""),
    lastSeenAt: String(fields?.lastSeenAt?.timestampValue || ""),
    planExpiresAt: String(
      readFirestoreStringField(fields?.planExpiresAt) ||
        readFirestoreStringField(fields?.subscriptionExpiresAt) ||
        readFirestoreStringField(fields?.planExpiryAt) ||
        "",
    ),
    emailVerified: hasExplicitVerifiedField ? Boolean(fields?.emailVerified?.booleanValue) : null,
    upgradeRequestId: String(readFirestoreStringField(fields?.upgradeRequestId) || ""),
    upgradeRequestStatus: normalizeUpgradeRequestStatus(
      readFirestoreStringField(fields?.upgradeRequestStatus),
    ),
    upgradePaymentReference: String(readFirestoreStringField(fields?.upgradePaymentReference) || ""),
    upgradeAmountPaid: String(readFirestoreStringField(fields?.upgradeAmountPaid) || ""),
    upgradeBillingCycle: String(readFirestoreStringField(fields?.upgradeBillingCycle) || ""),
    upgradeRequestNote: String(readFirestoreStringField(fields?.upgradeRequestNote) || ""),
    upgradeRequestedAt: String(readFirestoreStringField(fields?.upgradeRequestedAt) || ""),
    upgradeReviewedAt: String(readFirestoreStringField(fields?.upgradeReviewedAt) || ""),
    upgradeReviewedBy: normalizeEmail(readFirestoreStringField(fields?.upgradeReviewedBy) || ""),
    upgradeRequestReviewNote: String(readFirestoreStringField(fields?.upgradeRequestReviewNote) || ""),
  };
}

function buildOptionalTimestampField(value) {
  const normalized = String(value || "").trim();
  return normalized ? { timestampValue: toIsoTimestamp(normalized) } : { stringValue: "" };
}

export function buildFirestoreFeedbackFields(feedback) {
  return {
    feedbackId: { stringValue: String(feedback?.feedbackId || feedback?.id || "").trim() },
    userId: { stringValue: String(feedback?.userId || "").trim() },
    email: { stringValue: normalizeEmail(feedback?.email || "") },
    category: { stringValue: normalizeFeedbackCategory(feedback?.category) },
    status: { stringValue: normalizeFeedbackStatus(feedback?.status) },
    sourceScreen: { stringValue: normalizeFeedbackSource(feedback?.sourceScreen) },
    message: { stringValue: String(feedback?.message || "").trim() },
    createdAt: { timestampValue: toIsoTimestamp(feedback?.createdAt) },
    updatedAt: { timestampValue: toIsoTimestamp(feedback?.updatedAt || feedback?.createdAt) },
    reviewedAt: buildOptionalTimestampField(feedback?.reviewedAt),
    reviewedBy: { stringValue: normalizeEmail(feedback?.reviewedBy || "") },
    topicId: { stringValue: String(feedback?.topicId || "").trim() },
    topicName: { stringValue: String(feedback?.topicName || "").trim() },
    questionId: { stringValue: String(feedback?.questionId || "").trim() },
    quizAttemptId: { stringValue: String(feedback?.quizAttemptId || "").trim() },
    sessionMode: { stringValue: String(feedback?.sessionMode || "").trim().toLowerCase() },
  };
}

export function parseFirestoreFeedbackDocument(document) {
  const fields = document?.fields || {};
  const pathParts = String(document?.name || "").split("/");
  const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");
  return {
    feedbackId: String(readFirestoreStringField(fields?.feedbackId) || id),
    userId: String(readFirestoreStringField(fields?.userId) || ""),
    email: normalizeEmail(readFirestoreStringField(fields?.email) || ""),
    category: normalizeFeedbackCategory(readFirestoreStringField(fields?.category)),
    status: normalizeFeedbackStatus(readFirestoreStringField(fields?.status)),
    sourceScreen: normalizeFeedbackSource(readFirestoreStringField(fields?.sourceScreen)),
    message: String(readFirestoreStringField(fields?.message) || ""),
    createdAt: String(readFirestoreStringField(fields?.createdAt) || ""),
    updatedAt: String(readFirestoreStringField(fields?.updatedAt) || ""),
    reviewedAt: String(readFirestoreStringField(fields?.reviewedAt) || ""),
    reviewedBy: normalizeEmail(readFirestoreStringField(fields?.reviewedBy) || ""),
    topicId: String(readFirestoreStringField(fields?.topicId) || ""),
    topicName: String(readFirestoreStringField(fields?.topicName) || ""),
    questionId: String(readFirestoreStringField(fields?.questionId) || ""),
    quizAttemptId: String(readFirestoreStringField(fields?.quizAttemptId) || ""),
    sessionMode: String(readFirestoreStringField(fields?.sessionMode) || "").trim().toLowerCase(),
  };
}
export function buildUpdateMask(fieldPaths) {
  const params = new URLSearchParams();
  (Array.isArray(fieldPaths) ? fieldPaths : []).forEach((fieldPath) => {
    params.append("updateMask.fieldPaths", String(fieldPath || ""));
  });
  return params.toString();
}

export function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

export function getProgressAttemptIdentity(attempt = {}) {
  const byId = String(attempt?.attemptId || "").trim();
  if (byId) return byId;
  const topicId = String(attempt?.topicId || "").trim().toLowerCase();
  const mode = String(attempt?.mode || "").trim().toLowerCase();
  const createdAt = toIsoTimestamp(attempt?.createdAt, "");
  const score = String(Math.round(clampNumber(attempt?.scorePercentage, { min: 0, max: 100, fallback: 0 })));
  const total = String(Math.floor(clampNumber(attempt?.totalQuestions, { min: 0, max: 1000, fallback: 0 })));
  return `legacy:${topicId}|${mode}|${createdAt}|${score}|${total}`;
}

export function normalizeProgressAttempt(attempt = {}) {
  const topicId = String(attempt?.topicId || "").trim();
  if (!topicId) return null;

  return {
    attemptId: getProgressAttemptIdentity(attempt),
    topicId,
    topicName: String(attempt?.topicName || topicId).trim(),
    mode: String(attempt?.mode || "practice").trim().toLowerCase(),
    scorePercentage: Math.round(
      clampNumber(attempt?.scorePercentage, { min: 0, max: 100, fallback: 0 }),
    ),
    totalQuestions: Math.floor(
      clampNumber(attempt?.totalQuestions, { min: 0, max: 1000, fallback: 0 }),
    ),
    createdAt: toIsoTimestamp(attempt?.createdAt, new Date().toISOString()),
    deviceId: String(attempt?.deviceId || "").trim(),
  };
}

export function normalizeProgressSummary(summary) {
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  const byIdentity = new Map();
  attempts.forEach((attempt) => {
    const normalized = normalizeProgressAttempt(attempt);
    if (!normalized) return;
    const previous = byIdentity.get(normalized.attemptId);
    if (!previous) {
      byIdentity.set(normalized.attemptId, normalized);
      return;
    }
    const previousMs = Date.parse(previous.createdAt || "") || 0;
    const nextMs = Date.parse(normalized.createdAt || "") || 0;
    if (nextMs >= previousMs) {
      byIdentity.set(normalized.attemptId, normalized);
    }
  });

  const normalizedAttempts = Array.from(byIdentity.values())
    .sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;
      if (aTime !== bTime) return aTime - bTime;
      return String(a.attemptId || "").localeCompare(String(b.attemptId || ""));
    })
    .slice(-CLOUD_PROGRESS_MAX_ATTEMPTS);

  return { attempts: normalizedAttempts };
}

export function parseProgressSummaryJson(raw) {
  if (!raw) return { attempts: [] };
  try {
    const parsed = JSON.parse(String(raw || ""));
    return normalizeProgressSummary(parsed);
  } catch (error) {
    return { attempts: [] };
  }
}

export function serializeProgressSummary(summary) {
  const normalized = normalizeProgressSummary(summary);
  let attempts = [...normalized.attempts];
  let serialized = JSON.stringify({ attempts });
  while (serialized.length > CLOUD_PROGRESS_MAX_SUMMARY_BYTES && attempts.length > 1) {
    attempts.shift();
    serialized = JSON.stringify({ attempts });
  }
  return {
    normalized: { attempts },
    serialized,
  };
}

export function normalizeRetryQueueEntry(entry = {}) {
  const id = String(entry?.id || "").trim();
  if (!id) return null;
  const question = entry?.question;
  if (!question || typeof question !== "object") return null;

  return {
    id,
    updatedAt: toIsoTimestamp(entry?.updatedAt, new Date().toISOString()),
    sourceTopicId: String(entry?.sourceTopicId || "").trim(),
    sourceTopicName: String(entry?.sourceTopicName || "").trim(),
    question: { ...question },
  };
}

export function normalizeRetryQueue(queue) {
  const items = Array.isArray(queue) ? queue : [];
  const byId = new Map();
  items.forEach((entry) => {
    const normalized = normalizeRetryQueueEntry(entry);
    if (!normalized) return;
    const previous = byId.get(normalized.id);
    if (!previous) {
      byId.set(normalized.id, normalized);
      return;
    }
    const previousMs = Date.parse(previous.updatedAt || "") || 0;
    const nextMs = Date.parse(normalized.updatedAt || "") || 0;
    if (nextMs >= previousMs) {
      byId.set(normalized.id, normalized);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => {
      const aMs = Date.parse(a.updatedAt || "") || 0;
      const bMs = Date.parse(b.updatedAt || "") || 0;
      if (aMs !== bMs) return bMs - aMs;
      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .slice(0, CLOUD_PROGRESS_MAX_RETRY_QUEUE_ITEMS);
}

export function parseRetryQueueJson(raw) {
  if (!raw) return [];
  try {
    return normalizeRetryQueue(JSON.parse(String(raw || "")));
  } catch (error) {
    return [];
  }
}

export function serializeRetryQueue(queue) {
  let normalized = normalizeRetryQueue(queue);
  let serialized = JSON.stringify(normalized);
  while (serialized.length > CLOUD_PROGRESS_MAX_RETRY_QUEUE_BYTES && normalized.length > 1) {
    normalized.pop();
    serialized = JSON.stringify(normalized);
  }
  return {
    normalized,
    serialized,
  };
}

export function normalizeSpacedQueueEntry(entry = {}) {
  const questionId = String(entry?.questionId || "").trim();
  if (!questionId) return null;

  return {
    questionId,
    easeFactor: clampNumber(entry?.easeFactor, { min: 1.3, max: 3.2, fallback: 2.5 }),
    intervalDays: Math.max(1, Math.floor(clampNumber(entry?.intervalDays, { min: 1, max: 365, fallback: 1 }))),
    repetitions: Math.max(0, Math.floor(clampNumber(entry?.repetitions, { min: 0, max: 50, fallback: 0 }))),
    reviewCount: Math.max(0, Math.floor(clampNumber(entry?.reviewCount, { min: 0, max: 5000, fallback: 0 }))),
    lapses: Math.max(0, Math.floor(clampNumber(entry?.lapses, { min: 0, max: 5000, fallback: 0 }))),
    dueAt: toIsoTimestamp(entry?.dueAt, new Date().toISOString()),
    lastReviewedAt: toIsoTimestamp(entry?.lastReviewedAt, ""),
  };
}

export function normalizeSpacedQueue(queue) {
  const items = Array.isArray(queue) ? queue : [];
  const byQuestionId = new Map();
  items.forEach((entry) => {
    const normalized = normalizeSpacedQueueEntry(entry);
    if (!normalized) return;
    byQuestionId.set(normalized.questionId, normalized);
  });

  return Array.from(byQuestionId.values()).sort((a, b) => {
    const aMs = Date.parse(a.dueAt || "") || 0;
    const bMs = Date.parse(b.dueAt || "") || 0;
    if (aMs !== bMs) return aMs - bMs;
    return String(a.questionId || "").localeCompare(String(b.questionId || ""));
  });
}

export function parseSpacedQueueJson(raw) {
  if (!raw) return [];
  try {
    return normalizeSpacedQueue(JSON.parse(String(raw || "")));
  } catch (error) {
    return [];
  }
}

export function serializeSpacedQueue(queue) {
  let normalized = normalizeSpacedQueue(queue);
  let serialized = JSON.stringify(normalized);
  while (serialized.length > CLOUD_PROGRESS_MAX_SPACED_QUEUE_BYTES && normalized.length > 0) {
    normalized = normalized.slice(0, normalized.length - 1);
    serialized = JSON.stringify(normalized);
  }
  return {
    normalized,
    serialized,
  };
}

export function parseCloudProgressDocument(document) {
  const fields = document?.fields || {};
  return {
    summary: parseProgressSummaryJson(readFirestoreStringField(fields?.progressSummaryJson)),
    retryQueue: parseRetryQueueJson(readFirestoreStringField(fields?.retryQueueJson)),
    spacedQueue: parseSpacedQueueJson(readFirestoreStringField(fields?.spacedQueueJson)),
    updatedAt: String(fields?.updatedAt?.timestampValue || ""),
    deviceId: String(readFirestoreStringField(fields?.deviceId) || ""),
    schemaVersion: Number.parseInt(String(fields?.schemaVersion?.integerValue || "0"), 10) || 0,
  };
}

