import {
  normalizeEmail,
  normalizeEmailVerificationState,
  normalizeStatus,
  toOptionalIsoTimestamp,
} from "./authNormalization.js";
import { getFirebaseConfig } from "./authRuntime.js";


function getCloudFunctionsBaseUrl() {
  const { firebaseProjectId, firebaseFunctionsRegion } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://${encodeURIComponent(firebaseFunctionsRegion)}-${encodeURIComponent(firebaseProjectId)}.cloudfunctions.net`;
}

function buildAdminApiUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  if (!cleanPath) {
    throw new Error("Admin API path is required.");
  }

  const { adminApiBaseUrl } = getFirebaseConfig();
  if (adminApiBaseUrl) {
    return `${adminApiBaseUrl}/${cleanPath}`;
  }

  return `${getCloudFunctionsBaseUrl()}/${cleanPath}`;
}

async function postAdminApiJson(url, accessToken, body = {}, fetchImpl = fetch) {
  if (!accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || payload?.message || "Admin API request failed.";
    throw new Error(message);
  }

  return payload;
}

export async function deleteUserViaCloudFunction(userId, accessToken, fetchImpl = fetch) {
  if (!userId) {
    throw new Error("User identifier is required.");
  }

  return postAdminApiJson(buildAdminApiUrl("adminDeleteUserById"), accessToken, { userId }, fetchImpl);
}

export async function listUsersViaCloudFunction(accessToken, fetchImpl = fetch) {
  const payload = await postAdminApiJson(buildAdminApiUrl("adminListUsers"), accessToken, {}, fetchImpl);
  const users = Array.isArray(payload?.users) ? payload.users : [];
  return users.map((entry) => ({
    id: String(entry?.id || entry?.uid || entry?.localId || ""),
    email: normalizeEmail(entry?.email || ""),
    name: String(entry?.name || entry?.displayName || ""),
    emailVerified: normalizeEmailVerificationState(entry?.emailVerified, false),
    disabled: Boolean(entry?.disabled),
    createdAt: toOptionalIsoTimestamp(entry?.createdAt),
    lastSignInAt: toOptionalIsoTimestamp(entry?.lastSignInAt),
  }));
}

export async function lookupUsersViaAdminApi(emails, accessToken, fetchImpl = fetch) {
  const normalizedEmails = Array.from(
    new Set(
      (Array.isArray(emails) ? emails : [])
        .map((entry) => normalizeEmail(entry))
        .filter((entry) => entry && entry.includes("@")),
    ),
  );
  if (!normalizedEmails.length) {
    return new Map();
  }

  const payload = await postAdminApiJson(
    buildAdminApiUrl("adminLookupUsers"),
    accessToken,
    { emails: normalizedEmails },
    fetchImpl,
  );
  const users = Array.isArray(payload?.users) ? payload.users : [];
  const verificationByEmail = new Map();
  users.forEach((entry) => {
    const email = normalizeEmail(entry?.email || "");
    if (!email) return;
    verificationByEmail.set(email, Boolean(entry?.emailVerified));
  });
  return verificationByEmail;
}

export async function setUserStatusViaAdminApi(userId, status, accessToken, fetchImpl = fetch) {
  if (!userId) {
    throw new Error("User identifier is required.");
  }

  const payload = await postAdminApiJson(
    buildAdminApiUrl("adminSetUserStatus"),
    accessToken,
    {
      userId,
      status: normalizeStatus(status),
    },
    fetchImpl,
  );

  return {
    warning: String(payload?.warning || "").trim(),
    authDisabledSynced: Boolean(payload?.authDisabledSynced),
  };
}

export async function sendVerificationViaAdminApi(email, continueUrl, accessToken, fetchImpl = fetch) {
  return postAdminApiJson(
    buildAdminApiUrl("adminSendVerificationEmail"),
    accessToken,
    {
      email: normalizeEmail(email),
      continueUrl: String(continueUrl || "").trim(),
    },
    fetchImpl,
  );
}

export async function listAdminOperationsViaAdminApi(limit, accessToken, fetchImpl = fetch) {
  const payload = await postAdminApiJson(
    buildAdminApiUrl("adminListOperations"),
    accessToken,
    { limit },
    fetchImpl,
  );
  return Array.isArray(payload?.operations) ? payload.operations : [];
}

export async function logAdminOperationViaAdminApi(entry, accessToken, fetchImpl = fetch) {
  return postAdminApiJson(buildAdminApiUrl("adminLogOperation"), accessToken, entry || {}, fetchImpl);
}
