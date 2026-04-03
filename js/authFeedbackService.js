import {
  listCloudFeedbackSubmissions,
  patchCloudFeedbackSubmissionFields,
  upsertCloudFeedbackSubmission,
} from "./authCloudFirestore.js";
import {
  normalizeEmail,
  normalizeFeedbackCategory,
  normalizeFeedbackSource,
  normalizeFeedbackStatus,
  toIsoTimestamp,
} from "./authNormalization.js";

export const FEEDBACK_MESSAGE_MAX_LENGTH = 1000;
export const FEEDBACK_SUBMIT_COOLDOWN_MS = 60 * 1000;
const FEEDBACK_COOLDOWN_STORAGE_PREFIX = "cbt_feedback_last_submitted_v1_";

export function getFeedbackAccessState({ currentUser = null, session = null, cloudAuthEnabled = false } = {}) {
  if (!currentUser?.email) {
    return {
      allowed: false,
      reason: "login-required",
      message: "Sign in with a Cloud account to send feedback.",
    };
  }

  if (!cloudAuthEnabled) {
    return {
      allowed: false,
      reason: "cloud-disabled",
      message: "Feedback is available only when Cloud sign-in is configured.",
    };
  }

  if (!session || session.provider !== "firebase") {
    return {
      allowed: false,
      reason: "cloud-sign-in-required",
      message: "Feedback is available only when you sign in with a Cloud account.",
    };
  }

  if (!session.accessToken) {
    return {
      allowed: false,
      reason: "session-unavailable",
      message: "Your Cloud session is unavailable. Sign in again to send feedback.",
    };
  }

  return {
    allowed: true,
    reason: "allowed",
    message: "",
  };
}

export function getFeedbackCooldownStorageKey(userId) {
  return `${FEEDBACK_COOLDOWN_STORAGE_PREFIX}${String(userId || "guest").trim() || "guest"}`;
}

function readFeedbackCooldown(userId, storage = localStorage) {
  try {
    if (!storage || typeof storage.getItem !== "function") return "";
    return String(storage.getItem(getFeedbackCooldownStorageKey(userId)) || "").trim();
  } catch (error) {
    return "";
  }
}

function writeFeedbackCooldown(userId, submittedAt, storage = localStorage) {
  try {
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(getFeedbackCooldownStorageKey(userId), String(submittedAt || "").trim());
  } catch (error) {
    // Ignore storage failures.
  }
}

export function getFeedbackCooldownState(
  userId,
  {
    storage = localStorage,
    cooldownMs = FEEDBACK_SUBMIT_COOLDOWN_MS,
    nowMs = Date.now(),
  } = {},
) {
  const lastSubmittedAt = readFeedbackCooldown(userId, storage);
  const lastSubmittedMs = Date.parse(lastSubmittedAt || "");
  if (!lastSubmittedMs) {
    return { lastSubmittedAt: "", remainingMs: 0 };
  }

  const remainingMs = Math.max(0, Number(cooldownMs || 0) - Math.max(0, nowMs - lastSubmittedMs));
  return {
    lastSubmittedAt,
    remainingMs,
  };
}

function normalizeFeedbackMessage(message) {
  const normalized = String(message || "").trim();
  if (!normalized) {
    throw new Error("Feedback message is required.");
  }
  if (normalized.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new Error(`Feedback message must be ${FEEDBACK_MESSAGE_MAX_LENGTH} characters or fewer.`);
  }
  return normalized;
}

function buildFeedbackSubmissionRecord(input = {}, currentUser = null, nowIso = new Date().toISOString(), feedbackId = "") {
  const sourceScreen = normalizeFeedbackSource(input?.sourceScreen);
  const nextCategory = normalizeFeedbackCategory(
    input?.category || (sourceScreen === "quiz" ? "question_issue" : "other"),
  );

  return {
    feedbackId,
    userId: String(currentUser?.id || "").trim(),
    email: normalizeEmail(currentUser?.email || ""),
    category: nextCategory,
    status: "new",
    sourceScreen,
    message: normalizeFeedbackMessage(input?.message),
    createdAt: nowIso,
    updatedAt: nowIso,
    reviewedAt: "",
    reviewedBy: "",
    topicId: String(input?.topicId || "").trim(),
    topicName: String(input?.topicName || "").trim(),
    questionId: String(input?.questionId || "").trim(),
    quizAttemptId: String(input?.quizAttemptId || "").trim(),
    sessionMode: String(input?.sessionMode || "").trim().toLowerCase(),
  };
}

export async function submitFeedbackSubmission(
  input = {},
  {
    cloudAuthEnabled = false,
    currentUser = null,
    session = null,
    refreshSession,
  } = {},
  {
    upsertFeedback = upsertCloudFeedbackSubmission,
    idFactory = () => `fbk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    now = () => new Date().toISOString(),
    storage = localStorage,
    cooldownMs = FEEDBACK_SUBMIT_COOLDOWN_MS,
  } = {},
) {
  const access = getFeedbackAccessState({ currentUser, session, cloudAuthEnabled });
  if (!access.allowed) {
    throw new Error(access.message);
  }

  const userId = String(currentUser?.id || "").trim();
  const cooldown = getFeedbackCooldownState(userId, {
    storage,
    cooldownMs,
    nowMs: Date.now(),
  });
  if (cooldown.remainingMs > 0) {
    throw new Error(
      `Please wait ${Math.ceil(cooldown.remainingMs / 1000)} seconds before sending more feedback.`,
    );
  }

  if (typeof refreshSession !== "function") {
    throw new Error("Cloud session refresh is unavailable.");
  }

  const freshSession = await refreshSession(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const nowIso = toIsoTimestamp(now());
  const feedback = buildFeedbackSubmissionRecord(input, currentUser, nowIso, idFactory());
  await upsertFeedback(freshSession.accessToken, feedback);
  writeFeedbackCooldown(userId, nowIso, storage);
  return {
    feedbackId: feedback.feedbackId,
    createdAt: feedback.createdAt,
    status: feedback.status,
  };
}

export async function getAdminFeedbackSubmissions(
  {
    cloudAuthEnabled = false,
    currentUserIsAdmin = false,
    session = null,
    refreshSession,
  } = {},
  {
    listFeedback = listCloudFeedbackSubmissions,
    limit = 200,
  } = {},
) {
  if (!currentUserIsAdmin) {
    throw new Error("Admin access is restricted.");
  }
  if (!cloudAuthEnabled) {
    throw new Error("Feedback inbox requires Cloud auth and Firestore.");
  }
  if (typeof refreshSession !== "function") {
    throw new Error("Admin cloud session is unavailable.");
  }

  const freshSession = await refreshSession(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Admin cloud session is unavailable.");
  }

  return listFeedback(freshSession.accessToken, limit);
}

export async function updateFeedbackSubmissionStatus(
  feedbackId,
  status,
  {
    cloudAuthEnabled = false,
    currentUserIsAdmin = false,
    session = null,
    refreshSession,
  } = {},
  {
    patchFeedback = patchCloudFeedbackSubmissionFields,
    now = () => new Date().toISOString(),
  } = {},
) {
  const normalizedFeedbackId = String(feedbackId || "").trim();
  if (!normalizedFeedbackId) {
    throw new Error("Feedback id is required.");
  }

  const nextStatus = normalizeFeedbackStatus(status);
  if (!["in_review", "resolved", "dismissed"].includes(nextStatus)) {
    throw new Error("Invalid feedback status.");
  }
  if (!currentUserIsAdmin) {
    throw new Error("Admin access is restricted.");
  }
  if (!cloudAuthEnabled) {
    throw new Error("Feedback inbox requires Cloud auth and Firestore.");
  }
  if (typeof refreshSession !== "function") {
    throw new Error("Admin cloud session is unavailable.");
  }

  const freshSession = await refreshSession(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Admin cloud session is unavailable.");
  }

  const nowIso = toIsoTimestamp(now());
  await patchFeedback(freshSession.accessToken, normalizedFeedbackId, {
    status: { stringValue: nextStatus },
    updatedAt: { timestampValue: nowIso },
    reviewedAt: { timestampValue: nowIso },
    reviewedBy: { stringValue: normalizeEmail(freshSession?.user?.email || "") },
  });

  return {
    feedbackId: normalizedFeedbackId,
    status: nextStatus,
    reviewedAt: nowIso,
  };
}
