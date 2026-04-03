import { firestoreRequest } from "./authFirebaseTransport.js";
import {
  buildFirestoreFeedbackFields,
  buildFirestoreProfileFields,
  buildFirestoreUpgradeRequestFields,
  buildUpdateMask,
  parseFirestoreFeedbackDocument,
  parseFirestoreProfileDocument,
} from "./authFirestoreModels.js";
import { normalizeEmail } from "./authNormalization.js";

const CLOUD_PROGRESS_COLLECTION = "progress";
const FEEDBACK_COLLECTION = "feedbackSubmissions";

export async function getCloudProgressDocument(idToken, userId, requester = firestoreRequest) {
  if (!idToken || !userId) return null;
  try {
    return await requester(`documents/${CLOUD_PROGRESS_COLLECTION}/${encodeURIComponent(userId)}`, {
      method: "GET",
      idToken,
    });
  } catch (error) {
    if (error?.httpStatus === 404 || String(error?.code || "") === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export async function getCloudProfileById(idToken, id, requester = firestoreRequest) {
  if (!id) return null;
  try {
    const document = await requester(`documents/profiles/${encodeURIComponent(id)}`, {
      method: "GET",
      idToken,
    });
    return parseFirestoreProfileDocument(document);
  } catch (error) {
    if (error?.httpStatus === 404 || String(error?.code || "") === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export async function findCloudProfilesByEmail(idToken, email, limit = 1, requester = firestoreRequest) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  const response = await requester("documents:runQuery", {
    method: "POST",
    idToken,
    body: {
      structuredQuery: {
        from: [{ collectionId: "profiles" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "email" },
            op: "EQUAL",
            value: { stringValue: normalizedEmail },
          },
        },
        limit: Number(limit) > 0 ? Number(limit) : 1,
      },
    },
  });

  return (Array.isArray(response) ? response : [])
    .map((entry) => parseFirestoreProfileDocument(entry?.document))
    .filter(Boolean);
}

export async function listCloudProfiles(idToken, requester = firestoreRequest) {
  const rows = [];
  let pageToken = "";
  let loop = 0;

  do {
    const params = new URLSearchParams();
    params.set("pageSize", "200");
    if (pageToken) params.set("pageToken", pageToken);

    const payload = await requester(`documents/profiles?${params.toString()}`, {
      method: "GET",
      idToken,
    });

    const documents = Array.isArray(payload?.documents) ? payload.documents : [];
    documents.forEach((document) => {
      const parsed = parseFirestoreProfileDocument(document);
      if (parsed) rows.push(parsed);
    });

    pageToken = String(payload?.nextPageToken || "");
    loop += 1;
  } while (pageToken && loop < 25);

  return rows.sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

export async function listCloudFeedbackSubmissions(idToken, limit = 200, requester = firestoreRequest) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  const response = await requester("documents:runQuery", {
    method: "POST",
    idToken,
    body: {
      structuredQuery: {
        from: [{ collectionId: FEEDBACK_COLLECTION }],
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: safeLimit,
      },
    },
  });

  return (Array.isArray(response) ? response : [])
    .map((entry) => parseFirestoreFeedbackDocument(entry?.document))
    .filter(Boolean);
}

export async function upsertCloudFeedbackSubmission(idToken, feedback, requester = firestoreRequest) {
  const feedbackId = String(feedback?.feedbackId || feedback?.id || "").trim();
  if (!feedbackId) {
    throw new Error("Feedback id is required.");
  }

  const query = buildUpdateMask([
    "feedbackId",
    "userId",
    "email",
    "category",
    "status",
    "sourceScreen",
    "message",
    "createdAt",
    "updatedAt",
    "reviewedAt",
    "reviewedBy",
    "topicId",
    "topicName",
    "questionId",
    "quizAttemptId",
    "sessionMode",
  ]);

  await requester(`documents/${FEEDBACK_COLLECTION}/${encodeURIComponent(feedbackId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: buildFirestoreFeedbackFields(feedback),
    },
  });
}

export async function patchCloudFeedbackSubmissionFields(idToken, feedbackId, fields, requester = firestoreRequest) {
  const normalizedFeedbackId = String(feedbackId || "").trim();
  if (!normalizedFeedbackId) {
    throw new Error("Feedback id is required.");
  }

  const nextFields = fields && typeof fields === "object" ? fields : {};
  const fieldPaths = Object.keys(nextFields).filter(Boolean);
  if (!fieldPaths.length) {
    return;
  }

  const query = buildUpdateMask(fieldPaths);
  await requester(`documents/${FEEDBACK_COLLECTION}/${encodeURIComponent(normalizedFeedbackId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: nextFields,
    },
  });
}
export async function upsertCloudProfile(idToken, profile, requester = firestoreRequest) {
  const profileId = String(profile?.id || "").trim();
  if (!profileId) throw new Error("Profile id is required.");

  const query = buildUpdateMask([
    "email",
    "name",
    "plan",
    "role",
    "status",
    "createdAt",
    "lastSeenAt",
    "emailVerified",
  ]);

  await requester(`documents/profiles/${encodeURIComponent(profileId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: buildFirestoreProfileFields(profile),
    },
  });
}

export async function patchCloudProfileFields(idToken, profileId, fields, requester = firestoreRequest) {
  const normalizedProfileId = String(profileId || "").trim();
  if (!normalizedProfileId) {
    throw new Error("Profile id is required.");
  }

  const nextFields = fields && typeof fields === "object" ? fields : {};
  const fieldPaths = Object.keys(nextFields).filter(Boolean);
  if (!fieldPaths.length) {
    return;
  }

  const query = buildUpdateMask(fieldPaths);
  await requester(`documents/profiles/${encodeURIComponent(normalizedProfileId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: nextFields,
    },
  });
}

export async function upsertCloudUpgradeRequestRecord(idToken, request, requester = firestoreRequest) {
  const requestId = String(request?.requestId || "").trim();
  if (!requestId) {
    throw new Error("Request id is required.");
  }

  const query = buildUpdateMask([
    "requestId",
    "userId",
    "email",
    "status",
    "paymentReference",
    "amountPaid",
    "billingCycle",
    "note",
    "submittedAt",
    "reviewedAt",
    "reviewedBy",
    "reviewNote",
  ]);

  await requester(`documents/upgradeRequests/${encodeURIComponent(requestId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: buildFirestoreUpgradeRequestFields(request),
    },
  });
}


