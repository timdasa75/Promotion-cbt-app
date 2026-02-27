// auth.js - auth/session + entitlement helpers

const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";
const PLAN_OVERRIDES_STORAGE_KEY = "cbt_plan_overrides_v1";
const PLAN_OVERRIDE_META_STORAGE_KEY = "cbt_plan_override_meta_v1";
const ADMIN_DIRECTORY_CACHE_STORAGE_KEY = "cbt_admin_directory_cache_v1";
const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];
const PLAN_SYNC_INTERVAL_MS = 30 * 1000;
const CLOUD_PLAN_POLL_MS = 5 * 1000;
const TOKEN_REFRESH_SKEW_MS = 30 * 1000;
const LOCAL_PASSWORD_ALGO_V2 = "pbkdf2_sha256";
const LOCAL_PASSWORD_ITERATIONS = 120000;

let cloudPlanSyncInFlight = false;
let cloudPlanPollingHandle = null;
let cloudPlanVisibilityBound = false;

const FREE_PLAN = {
  id: "free",
  maxTopics: 1,
  maxSubcategories: 3,
  maxQuestionsPerSubcategory: 10,
};

const PREMIUM_PLAN = {
  id: "premium",
  maxTopics: null,
  maxSubcategories: null,
  maxQuestionsPerSubcategory: null,
};

function emitPlanChange(previousPlan, nextPlan) {
  if (!previousPlan || !nextPlan || previousPlan === nextPlan) return;
  document.dispatchEvent(
    new CustomEvent("authplanchange", {
      detail: { previousPlan, nextPlan },
    }),
  );
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePlan(value) {
  return String(value || "").toLowerCase() === "premium" ? "premium" : "free";
}

function normalizeRole(value) {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "user";
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase() === "suspended" ? "suspended" : "active";
}

function normalizeUpgradeRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return "none";
}

function toIsoTimestamp(value, fallback = new Date().toISOString()) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function fromFirebaseMillisToIso(value, fallback = new Date().toISOString()) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Date(numeric).toISOString();
}

function getFirebaseConfig() {
  const cfg = window.PROMOTION_CBT_AUTH || {};
  const firebaseApiKey = String(cfg.firebaseApiKey || cfg.apiKey || "").trim();
  const firebaseProjectId = String(cfg.firebaseProjectId || cfg.projectId || "").trim();
  const firebaseAuthDomain = String(cfg.firebaseAuthDomain || cfg.authDomain || "").trim();
  return { firebaseApiKey, firebaseProjectId, firebaseAuthDomain };
}

function getIdentityToolkitDeleteUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/accounts:delete`;
}

async function deleteFirebaseAuthUserById(localId, accessToken) {
  if (!localId) {
    throw new Error("User identifier is required.");
  }
  if (!accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const url = getIdentityToolkitDeleteUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ localId }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || "Firebase Authentication deletion failed.";
    throw new Error(message);
  }
}

function isLocalDevelopmentHost() {
  const host = String(window.location.hostname || "").trim().toLowerCase();
  return host === "" || host === "localhost" || host === "127.0.0.1";
}

function isCloudAuthEnabled() {
  const { firebaseApiKey, firebaseProjectId } = getFirebaseConfig();
  return Boolean(firebaseApiKey && firebaseProjectId);
}

export function isCloudAuthRequired() {
  if (typeof window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH === "boolean") {
    return window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH;
  }
  return !isLocalDevelopmentHost();
}

export function isCloudAuthMisconfigured() {
  return isCloudAuthRequired() && !isCloudAuthEnabled();
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function readJsonStorage(storage, key) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed || null;
  } catch (error) {
    return null;
  }
}

function readSession() {
  const sessionScoped = readJsonStorage(window.sessionStorage, SESSION_STORAGE_KEY);
  if (sessionScoped) return sessionScoped;

  const legacyPersistent = readJsonStorage(window.localStorage, SESSION_STORAGE_KEY);
  if (legacyPersistent) {
    // Migrate legacy persistent session to session-scoped storage.
    try {
      window.sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(legacyPersistent),
      );
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage migration issues.
    }
    return legacyPersistent;
  }

  return null;
}

function writeSession(session) {
  const payload = JSON.stringify(session);
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
  } catch (error) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, payload);
  }
  // Ensure tokens are not kept in persistent storage after write.
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore cleanup failures.
  }
}

function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore cleanup failures.
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore cleanup failures.
  }
}

function sessionIsExpired(session) {
  if (!session?.expiresAt) return false;
  return Date.now() >= Number(session.expiresAt);
}

function readPlanOverrides() {
  try {
    const raw = localStorage.getItem(PLAN_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writePlanOverrides(overrides) {
  localStorage.setItem(PLAN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides || {}));
}

function readPlanOverrideMeta() {
  try {
    const raw = localStorage.getItem(PLAN_OVERRIDE_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writePlanOverrideMeta(meta) {
  localStorage.setItem(PLAN_OVERRIDE_META_STORAGE_KEY, JSON.stringify(meta || {}));
}

function readAdminDirectoryCache() {
  try {
    const raw = localStorage.getItem(ADMIN_DIRECTORY_CACHE_STORAGE_KEY);
    if (!raw) return { users: [], syncedAt: "" };
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      syncedAt: String(parsed?.syncedAt || ""),
    };
  } catch (error) {
    return { users: [], syncedAt: "" };
  }
}

function writeAdminDirectoryCache(users, syncedAt = new Date().toISOString()) {
  localStorage.setItem(
    ADMIN_DIRECTORY_CACHE_STORAGE_KEY,
    JSON.stringify({
      users: Array.isArray(users) ? users : [],
      syncedAt: String(syncedAt || ""),
    }),
  );
}

async function hashPassword(password) {
  const value = String(password || "");
  if (!value) return "";

  if (window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return btoa(unescape(encodeURIComponent(value)));
}

function generatePasswordSalt() {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

async function derivePasswordHash(password, salt, iterations = LOCAL_PASSWORD_ITERATIONS) {
  const normalizedPassword = String(password || "");
  const normalizedSalt = String(salt || "");
  if (!normalizedPassword || !normalizedSalt) return "";

  if (window.crypto?.subtle) {
    const material = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(normalizedPassword),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: new TextEncoder().encode(normalizedSalt),
        iterations: Number(iterations) || LOCAL_PASSWORD_ITERATIONS,
      },
      material,
      256,
    );
    const bytes = Array.from(new Uint8Array(bits));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return hashPassword(`${normalizedSalt}:${normalizedPassword}`);
}

async function buildLocalPasswordRecord(password) {
  const salt = generatePasswordSalt();
  const hash = await derivePasswordHash(password, salt, LOCAL_PASSWORD_ITERATIONS);
  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgo: LOCAL_PASSWORD_ALGO_V2,
    passwordIterations: LOCAL_PASSWORD_ITERATIONS,
  };
}

async function verifyLocalPassword(user, password) {
  if (!user || !password) return false;

  if (
    String(user.passwordAlgo || "") === LOCAL_PASSWORD_ALGO_V2 &&
    String(user.passwordSalt || "")
  ) {
    const iterations = Number(user.passwordIterations || LOCAL_PASSWORD_ITERATIONS);
    const hash = await derivePasswordHash(password, user.passwordSalt, iterations);
    return hash === String(user.passwordHash || "");
  }

  const legacyHash = await hashPassword(password);
  return legacyHash === String(user.passwordHash || "");
}

function mapFirebaseAuthError(message) {
  const code = String(message || "").trim().toUpperCase();
  const mapped = {
    EMAIL_EXISTS: "An account with this email already exists.",
    EMAIL_NOT_FOUND:
      "No account exists for this email yet. Register first, or create the user in Firebase Authentication.",
    INVALID_PASSWORD: "Invalid email or password.",
    INVALID_LOGIN_CREDENTIALS: "Invalid email or password.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later.",
    USER_DISABLED: "This account has been disabled.",
    OPERATION_NOT_ALLOWED: "Email/password sign-in is not enabled for this Firebase project.",
    INVALID_EMAIL: "Enter a valid email address.",
    WEAK_PASSWORD: "Password must be at least 6 characters.",
    INVALID_ID_TOKEN: "Session expired. Please login again.",
    TOKEN_EXPIRED: "Session expired. Please login again.",
  };
  return mapped[code] || message || "Authentication request failed.";
}

async function firebaseAuthRequest(endpoint, { method = "POST", body = null } = {}) {
  const { firebaseApiKey } = getFirebaseConfig();
  if (!firebaseApiKey) {
    throw new Error("Firebase configuration is missing.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Authentication request failed.";
    throw new Error(mapFirebaseAuthError(message));
  }

  return payload;
}

async function firebaseRefreshToken(refreshToken) {
  const { firebaseApiKey } = getFirebaseConfig();
  if (!firebaseApiKey) {
    throw new Error("Firebase configuration is missing.");
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(String(refreshToken || ""))}`,
    },
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Token refresh failed.";
    throw new Error(mapFirebaseAuthError(message));
  }

  return payload;
}

function getFirestoreBaseUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase configuration is missing.");
  }
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseProjectId,
  )}/databases/(default)`;
}

async function firestoreRequest(path, { method = "GET", body = null, idToken = "" } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${getFirestoreBaseUrl()}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Data request failed.";
    const firestoreError = new Error(message);
    firestoreError.httpStatus = response.status;
    firestoreError.code = String(payload?.error?.status || "");
    throw firestoreError;
  }

  return payload;
}

function buildCloudUserFromLookupUser(user, fallbackPlan = "free") {
  const email = normalizeEmail(user?.email || "");
  const name = String(user?.displayName || email || "User");
  return {
    id: String(user?.localId || ""),
    name,
    email,
    plan: normalizePlan(fallbackPlan),
    createdAt: fromFirebaseMillisToIso(user?.createdAt),
    emailVerified: Boolean(user?.emailVerified),
  };
}

function buildCloudUserFromAuthPayload(payload) {
  const email = normalizeEmail(payload?.email || "");
  return {
    id: String(payload?.localId || ""),
    name: String(payload?.displayName || email || "User"),
    email,
    plan: "free",
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };
}

function writeCloudSessionFromAuthPayload(payload, userOverride = null) {
  const accessToken = String(payload?.idToken || "");
  const refreshToken = String(payload?.refreshToken || "");
  const expiresIn = Number(payload?.expiresIn || 0);
  const user = userOverride || buildCloudUserFromAuthPayload(payload);

  if (!accessToken || !refreshToken || !user?.id) {
    return null;
  }

  const sessionRecord = {
    provider: "firebase",
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
    createdAt: new Date().toISOString(),
  };
  writeSession(sessionRecord);
  return sessionRecord;
}

async function ensureCloudSessionActive(session = readSession(), { clearOnFailure = false } = {}) {
  if (!session || session.provider !== "firebase") return session;

  const expiresAt = Number(session.expiresAt || 0);
  if (expiresAt && expiresAt - Date.now() > TOKEN_REFRESH_SKEW_MS) {
    return session;
  }

  if (!session.refreshToken) {
    if (clearOnFailure) clearSession();
    return null;
  }

  try {
    const payload = await firebaseRefreshToken(session.refreshToken);
    const updated = {
      ...session,
      accessToken: String(payload.id_token || ""),
      refreshToken: String(payload.refresh_token || session.refreshToken || ""),
      expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
      user: {
        ...(session.user || {}),
        id: String(payload.user_id || session?.user?.id || ""),
        email: normalizeEmail(payload.user_email || session?.user?.email || ""),
      },
    };
    writeSession(updated);
    return updated;
  } catch (error) {
    if (clearOnFailure) clearSession();
    throw error;
  }
}

async function lookupFirebaseUser(idToken) {
  const payload = await firebaseAuthRequest("accounts:lookup", {
    method: "POST",
    body: { idToken },
  });
  if (!Array.isArray(payload?.users) || !payload.users.length) {
    return null;
  }
  return payload.users[0];
}

function buildFirestoreProfileFields(profile) {
  return {
    email: { stringValue: normalizeEmail(profile?.email || "") },
    name: { stringValue: String(profile?.name || profile?.email || "User") },
    plan: { stringValue: normalizePlan(profile?.plan) },
    role: { stringValue: normalizeRole(profile?.role) },
    status: { stringValue: normalizeStatus(profile?.status) },
    createdAt: { timestampValue: toIsoTimestamp(profile?.createdAt) },
    lastSeenAt: { timestampValue: toIsoTimestamp(profile?.lastSeenAt) },
  };
}

function buildFirestoreUpgradeRequestFields(request) {
  const status = normalizeUpgradeRequestStatus(request?.status);
  return {
    requestId: { stringValue: String(request?.requestId || "").trim() },
    userId: { stringValue: String(request?.userId || "").trim() },
    email: { stringValue: normalizeEmail(request?.email || "") },
    status: { stringValue: status === "none" ? "pending" : status },
    paymentReference: { stringValue: String(request?.reference || "").trim() },
    amountPaid: { stringValue: String(request?.amount || "").trim() },
    note: { stringValue: String(request?.note || "").trim() },
    submittedAt: { stringValue: toIsoTimestamp(request?.submittedAt) },
    reviewedAt: { stringValue: String(request?.reviewedAt || "").trim() },
    reviewedBy: { stringValue: normalizeEmail(request?.reviewedBy || "") },
    reviewNote: { stringValue: String(request?.reviewNote || "").trim() },
  };
}

function readFirestoreStringField(field) {
  if (!field || typeof field !== "object") return "";
  if (typeof field.stringValue === "string") return field.stringValue;
  if (typeof field.timestampValue === "string") return field.timestampValue;
  return "";
}

function parseFirestoreProfileDocument(document) {
  const fields = document?.fields || {};
  const pathParts = String(document?.name || "").split("/");
  const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");
  return {
    id,
    email: normalizeEmail(fields?.email?.stringValue || ""),
    name: String(fields?.name?.stringValue || ""),
    plan: normalizePlan(fields?.plan?.stringValue || "free"),
    role: normalizeRole(fields?.role?.stringValue || "user"),
    status: normalizeStatus(fields?.status?.stringValue || "active"),
    createdAt: String(fields?.createdAt?.timestampValue || ""),
    lastSeenAt: String(fields?.lastSeenAt?.timestampValue || ""),
    upgradeRequestId: String(readFirestoreStringField(fields?.upgradeRequestId) || ""),
    upgradeRequestStatus: normalizeUpgradeRequestStatus(
      readFirestoreStringField(fields?.upgradeRequestStatus),
    ),
    upgradePaymentReference: String(readFirestoreStringField(fields?.upgradePaymentReference) || ""),
    upgradeAmountPaid: String(readFirestoreStringField(fields?.upgradeAmountPaid) || ""),
    upgradeRequestNote: String(readFirestoreStringField(fields?.upgradeRequestNote) || ""),
    upgradeRequestedAt: String(readFirestoreStringField(fields?.upgradeRequestedAt) || ""),
    upgradeReviewedAt: String(readFirestoreStringField(fields?.upgradeReviewedAt) || ""),
    upgradeReviewedBy: normalizeEmail(readFirestoreStringField(fields?.upgradeReviewedBy) || ""),
    upgradeRequestReviewNote: String(readFirestoreStringField(fields?.upgradeRequestReviewNote) || ""),
  };
}

function buildUpdateMask(fieldPaths) {
  const params = new URLSearchParams();
  (Array.isArray(fieldPaths) ? fieldPaths : []).forEach((fieldPath) => {
    params.append("updateMask.fieldPaths", String(fieldPath || ""));
  });
  return params.toString();
}

async function getCloudProfileById(idToken, id) {
  if (!id) return null;
  try {
    const document = await firestoreRequest(`documents/profiles/${encodeURIComponent(id)}`, {
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

async function findCloudProfilesByEmail(idToken, email, limit = 1) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return [];

  const response = await firestoreRequest("documents:runQuery", {
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

async function listCloudProfiles(idToken) {
  const rows = [];
  let pageToken = "";
  let loop = 0;

  do {
    const params = new URLSearchParams();
    params.set("pageSize", "200");
    if (pageToken) params.set("pageToken", pageToken);

    const payload = await firestoreRequest(`documents/profiles?${params.toString()}`, {
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

async function upsertCloudProfile(idToken, profile) {
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
  ]);

  await firestoreRequest(`documents/profiles/${encodeURIComponent(profileId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: buildFirestoreProfileFields(profile),
    },
  });
}

async function patchCloudProfileFields(idToken, profileId, fields) {
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
  await firestoreRequest(`documents/profiles/${encodeURIComponent(normalizedProfileId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: nextFields,
    },
  });
}

async function upsertCloudUpgradeRequestRecord(idToken, request) {
  const requestId = String(request?.requestId || "").trim();
  if (!requestId) {
    throw new Error("Upgrade request id is required.");
  }

  const query = buildUpdateMask([
    "requestId",
    "userId",
    "email",
    "status",
    "paymentReference",
    "amountPaid",
    "note",
    "submittedAt",
    "reviewedAt",
    "reviewedBy",
    "reviewNote",
  ]);

  await firestoreRequest(`documents/upgradeRequests/${encodeURIComponent(requestId)}?${query}`, {
    method: "PATCH",
    idToken,
    body: {
      fields: buildFirestoreUpgradeRequestFields(request),
    },
  });
}

function normalizeDirectoryRow(row) {
  const email = normalizeEmail(row?.email || "");
  return {
    id: String(row?.id || email || `user_${Math.random().toString(36).slice(2, 8)}`),
    email: email || "unknown@email",
    role: normalizeRole(row?.role),
    status: normalizeStatus(row?.status),
    plan: normalizePlan(row?.plan),
    createdAt: String(row?.createdAt || row?.created_at || ""),
    lastSeenAt: String(row?.lastSeenAt || row?.last_seen_at || ""),
    upgradeRequestId: String(row?.upgradeRequestId || ""),
    upgradeRequestStatus: normalizeUpgradeRequestStatus(row?.upgradeRequestStatus),
    upgradePaymentReference: String(row?.upgradePaymentReference || ""),
    upgradeAmountPaid: String(row?.upgradeAmountPaid || ""),
    upgradeRequestNote: String(row?.upgradeRequestNote || ""),
    upgradeRequestedAt: String(row?.upgradeRequestedAt || ""),
    upgradeReviewedAt: String(row?.upgradeReviewedAt || ""),
    upgradeReviewedBy: normalizeEmail(row?.upgradeReviewedBy || ""),
    upgradeRequestReviewNote: String(row?.upgradeRequestReviewNote || ""),
    source: "cloud",
  };
}

function applyPlanOverrideForEmail(user) {
  if (!user?.email) return user;
  const overrides = readPlanOverrides();
  const overridePlan = overrides[normalizeEmail(user.email)];
  if (!overridePlan) return user;
  return { ...user, plan: overridePlan };
}

async function resolveCloudPlan(session) {
  if (!session?.accessToken || !session?.user) {
    return normalizePlan(session?.user?.plan || "free");
  }
  const defaultPlan = normalizePlan(session.user.plan || "free");

  try {
    if (session.user.id) {
      const byId = await getCloudProfileById(session.accessToken, session.user.id);
      if (byId?.plan) return normalizePlan(byId.plan);
    }
    if (session.user.email) {
      const byEmail = await findCloudProfilesByEmail(session.accessToken, session.user.email, 1);
      if (byEmail.length && byEmail[0]?.plan) return normalizePlan(byEmail[0].plan);
    }
  } catch (error) {
    // Optional profile sync path; fallback to current plan.
  }

  return defaultPlan;
}

async function syncCloudPlanInSession(session) {
  if (!session?.provider || session.provider !== "firebase" || !session.user) {
    return session;
  }

  const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
  if (!freshSession) return session;

  const previousPlan = normalizePlan(freshSession.user.plan || "free");
  const plan = await resolveCloudPlan(freshSession);
  const updated = {
    ...freshSession,
    lastPlanSyncAt: new Date().toISOString(),
    user: {
      ...freshSession.user,
      plan,
    },
  };
  writeSession(updated);
  emitPlanChange(previousPlan, plan);
  return updated;
}

async function syncCloudPlanNow() {
  const session = readSession();
  if (
    !session ||
    session.provider !== "firebase" ||
    !session.accessToken ||
    !session.user ||
    cloudPlanSyncInFlight
  ) {
    return;
  }

  cloudPlanSyncInFlight = true;
  try {
    await syncCloudPlanInSession(session);
  } catch (error) {
    // Best effort background sync.
  } finally {
    cloudPlanSyncInFlight = false;
  }
}

export async function forceCloudPlanSync() {
  const session = readSession();
  if (
    !session ||
    session.provider !== "firebase" ||
    !session.accessToken ||
    !session.user
  ) {
    return { synced: false, warning: "Cloud session is unavailable." };
  }

  if (cloudPlanSyncInFlight) {
    return { synced: false, warning: "Plan sync is already in progress." };
  }

  cloudPlanSyncInFlight = true;
  try {
    await syncCloudPlanInSession(session);
    return { synced: true, warning: "" };
  } catch (error) {
    return {
      synced: false,
      warning: error?.message || "Unable to sync cloud plan right now.",
    };
  } finally {
    cloudPlanSyncInFlight = false;
  }
}

export function startCloudPlanAutoSync() {
  if (!isCloudAuthEnabled() || cloudPlanPollingHandle) return;

  cloudPlanPollingHandle = setInterval(() => {
    syncCloudPlanNow();
  }, CLOUD_PLAN_POLL_MS);

  if (!cloudPlanVisibilityBound) {
    cloudPlanVisibilityBound = true;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        syncCloudPlanNow();
      }
    });
  }
}

function buildProfilePayloadFromSession(session, existingProfile = null) {
  const user = session?.user || {};
  const email = normalizeEmail(user.email || existingProfile?.email || "");
  const isAdmin = getConfiguredAdminEmails().includes(email);
  return {
    id: String(user.id || existingProfile?.id || ""),
    email,
    name: String(user.name || existingProfile?.name || email || "User"),
    plan: normalizePlan(existingProfile?.plan || user.plan || "free"),
    role: normalizeRole(existingProfile?.role || (isAdmin ? "admin" : "user")),
    status: normalizeStatus(existingProfile?.status || "active"),
    createdAt: toIsoTimestamp(existingProfile?.createdAt || user.createdAt || new Date().toISOString()),
    lastSeenAt: new Date().toISOString(),
  };
}

async function ensureCloudProfileInSession(session) {
  if (!session?.provider || session.provider !== "firebase") return session;
  if (!session?.accessToken || !session?.user?.id || !session?.user?.email) {
    return session;
  }

  const existing = await getCloudProfileById(session.accessToken, session.user.id);
  const payload = buildProfilePayloadFromSession(session, existing);
  await upsertCloudProfile(session.accessToken, payload);

  const updated = {
    ...session,
    user: {
      ...session.user,
      name: payload.name,
      email: payload.email,
      plan: payload.plan,
      createdAt: payload.createdAt,
    },
  };
  writeSession(updated);
  return updated;
}

async function refreshCloudUserInSession(session) {
  const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) return null;

  const lookupUser = await lookupFirebaseUser(freshSession.accessToken);
  if (!lookupUser) return null;

  const user = buildCloudUserFromLookupUser(lookupUser, freshSession?.user?.plan || "free");
  const withUser = {
    ...freshSession,
    user: {
      ...freshSession.user,
      ...user,
    },
  };
  writeSession(withUser);

  const withProfile = await ensureCloudProfileInSession(withUser);
  const updated = await syncCloudPlanInSession(withProfile);
  writeSession(updated);
  return updated;
}

async function registerUserCloud({ name, email, password }) {
  const trimmedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (!trimmedName) throw new Error("Name is required.");
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  let payload = await firebaseAuthRequest("accounts:signUp", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      returnSecureToken: true,
    },
  });

  if (trimmedName && payload?.idToken) {
    try {
      const updatePayload = await firebaseAuthRequest("accounts:update", {
        method: "POST",
        body: {
          idToken: payload.idToken,
          displayName: trimmedName,
          returnSecureToken: true,
        },
      });
      payload = {
        ...payload,
        ...updatePayload,
      };
    } catch (error) {
      // Non-blocking; continue registration.
    }
  }

  const saved = writeCloudSessionFromAuthPayload(payload, {
    id: String(payload?.localId || ""),
    name: String(payload?.displayName || trimmedName || normalizedEmail || "User"),
    email: normalizeEmail(payload?.email || normalizedEmail),
    plan: "free",
    createdAt: new Date().toISOString(),
    emailVerified: false,
  });
  if (!saved) {
    throw new Error("Registration failed.");
  }

  await ensureCloudProfileInSession(saved);

  await firebaseAuthRequest("accounts:sendOobCode", {
    method: "POST",
    body: {
      requestType: "VERIFY_EMAIL",
      idToken: saved.accessToken,
    },
  });

  clearSession();
  return {
    user: null,
    requiresEmailVerification: true,
    message: "Account created. Check your email to confirm before login.",
  };
}

async function loginUserCloud({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Email and password are required.");
  }

  const payload = await firebaseAuthRequest("accounts:signInWithPassword", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      returnSecureToken: true,
    },
  });

  const saved = writeCloudSessionFromAuthPayload(payload);
  if (!saved) {
    throw new Error("Login failed.");
  }

  const synced = await refreshCloudUserInSession(saved);
  if (!synced?.user) {
    clearSession();
    throw new Error("Login failed.");
  }

  if (!synced.user.emailVerified) {
    try {
      await firebaseAuthRequest("accounts:sendOobCode", {
        method: "POST",
        body: {
          requestType: "VERIFY_EMAIL",
          idToken: synced.accessToken,
        },
      });
    } catch (error) {
      // Keep primary verification flow even if resend fails.
    }
    clearSession();
    throw new Error("Please verify your email before login. Check your inbox.");
  }

  return synced.user;
}

function logoutCloud() {
  clearSession();
}

async function registerUserLocal({ name, email, password }) {
  const trimmedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (!trimmedName) throw new Error("Name is required.");
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }
  if (normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const users = readUsers();
  const exists = users.some((u) => normalizeEmail(u.email) === normalizedEmail);
  if (exists) {
    throw new Error("An account with this email already exists.");
  }

  const passwordRecord = await buildLocalPasswordRecord(normalizedPassword);
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    email: normalizedEmail,
    ...passwordRecord,
    plan: "free",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  writeSession({ provider: "local", userId: user.id, createdAt: new Date().toISOString() });
  return {
    user: sanitizeUserLocal(user),
    requiresEmailVerification: false,
    message: "",
  };
}

async function loginUserLocal({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Email and password are required.");
  }

  const users = readUsers();
  const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const validPassword = await verifyLocalPassword(user, normalizedPassword);
  if (!validPassword) {
    throw new Error("Invalid email or password.");
  }

  if (String(user.passwordAlgo || "") !== LOCAL_PASSWORD_ALGO_V2) {
    const upgradedRecord = await buildLocalPasswordRecord(normalizedPassword);
    const upgradedUsers = users.map((entry) =>
      entry.id === user.id ? { ...entry, ...upgradedRecord } : entry,
    );
    writeUsers(upgradedUsers);
  }

  writeSession({ provider: "local", userId: user.id, createdAt: new Date().toISOString() });
  return sanitizeUserLocal(user);
}

function sanitizeUserLocal(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || "free",
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  if (isCloudAuthEnabled()) {
    return registerUserCloud({ name, email, password });
  }
  return registerUserLocal({ name, email, password });
}

export async function loginUser({ email, password }) {
  if (isCloudAuthEnabled()) {
    return loginUserCloud({ email, password });
  }
  return loginUserLocal({ email, password });
}

export function logoutUser() {
  if (isCloudAuthEnabled()) {
    logoutCloud();
    return;
  }
  clearSession();
}

export async function requestPasswordReset(email, redirectTo = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (!isCloudAuthEnabled()) {
    throw new Error("Password reset is available only in Cloud auth mode.");
  }

  const body = {
    requestType: "PASSWORD_RESET",
    email: normalizedEmail,
  };
  if (String(redirectTo || "").trim()) {
    body.continueUrl = String(redirectTo).trim();
  }

  await firebaseAuthRequest("accounts:sendOobCode", {
    method: "POST",
    body,
  });
}

function buildUpgradeRequestRecordFromProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const status = normalizeUpgradeRequestStatus(profile?.upgradeRequestStatus);
  const hasPayload =
    status !== "none" ||
    Boolean(profile?.upgradeRequestedAt) ||
    Boolean(profile?.upgradePaymentReference) ||
    Boolean(profile?.upgradeAmountPaid) ||
    Boolean(profile?.upgradeRequestNote);
  if (!hasPayload) return null;

  return {
    id: String(profile?.upgradeRequestId || ""),
    email: normalizeEmail(profile?.email || ""),
    status,
    reference: String(profile?.upgradePaymentReference || ""),
    amount: String(profile?.upgradeAmountPaid || ""),
    note: String(profile?.upgradeRequestNote || ""),
    submittedAt: String(profile?.upgradeRequestedAt || ""),
    reviewedAt: String(profile?.upgradeReviewedAt || ""),
    reviewedBy: normalizeEmail(profile?.upgradeReviewedBy || ""),
    reviewNote: String(profile?.upgradeRequestReviewNote || ""),
    source: "cloud-profile",
  };
}

export async function submitUpgradeRequest({ reference = "", amount = "", note = "" } = {}) {
  if (!isCloudAuthEnabled()) {
    return {
      cloudSaved: false,
      warning: "Cloud auth is not enabled. Request is saved locally on this device only.",
    };
  }

  const user = getCurrentUser();
  if (!user?.email) {
    throw new Error("Login is required before submitting upgrade evidence.");
  }

  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase") {
    return {
      cloudSaved: false,
      warning: "Cloud session is unavailable. Request is saved locally on this device only.",
    };
  }

  try {
    const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) {
      throw new Error("Cloud session is unavailable.");
    }

    const withProfile = await ensureCloudProfileInSession(freshSession);
    const profileId = String(withProfile?.user?.id || freshSession?.user?.id || "").trim();
    if (!profileId) {
      throw new Error("Unable to resolve your cloud profile.");
    }

    const now = new Date().toISOString();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await patchCloudProfileFields(freshSession.accessToken, profileId, {
      upgradeRequestId: { stringValue: requestId },
      upgradeRequestStatus: { stringValue: "pending" },
      upgradePaymentReference: { stringValue: String(reference || "").trim() },
      upgradeAmountPaid: { stringValue: String(amount || "").trim() },
      upgradeRequestNote: { stringValue: String(note || "").trim() },
      upgradeRequestedAt: { stringValue: now },
      upgradeReviewedAt: { stringValue: "" },
      upgradeReviewedBy: { stringValue: "" },
      upgradeRequestReviewNote: { stringValue: "" },
    });

    let archiveWarning = "";
    try {
      await upsertCloudUpgradeRequestRecord(freshSession.accessToken, {
        requestId,
        userId: profileId,
        email: user.email,
        status: "pending",
        reference: String(reference || "").trim(),
        amount: String(amount || "").trim(),
        note: String(note || "").trim(),
        submittedAt: now,
        reviewedAt: "",
        reviewedBy: "",
        reviewNote: "",
      });
    } catch (archiveError) {
      archiveWarning = `Payment archive sync failed: ${
        archiveError?.message || "Unable to write upgradeRequests record."
      }`;
    }

    return { cloudSaved: true, warning: archiveWarning };
  } catch (error) {
    return {
      cloudSaved: false,
      warning:
        error?.message ||
        "Cloud request sync failed. Request is saved locally on this device only.",
    };
  }
}

export async function setUpgradeRequestStatus(email, status, reviewNote = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }

  const normalizedStatus = normalizeUpgradeRequestStatus(status);
  if (!["pending", "approved", "rejected"].includes(normalizedStatus)) {
    throw new Error("Invalid request status.");
  }

  if (!isCloudAuthEnabled()) {
    return { cloudUpdated: false, warning: "Cloud auth is not enabled." };
  }

  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase" || !isCurrentUserAdmin()) {
    return {
      cloudUpdated: false,
      warning: "Cloud update requires an authenticated admin cloud session.",
    };
  }

  try {
    const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) throw new Error("Cloud session is unavailable.");

    const rows = await findCloudProfilesByEmail(freshSession.accessToken, normalizedEmail, 1);
    if (!rows.length || !rows[0]?.id) {
      throw new Error("Cloud profile not found for this email.");
    }
    const targetProfile = rows[0];
    const requestId = String(targetProfile?.upgradeRequestId || "").trim();

    const now = new Date().toISOString();
    const fields = {
      upgradeRequestStatus: { stringValue: normalizedStatus },
      upgradeRequestReviewNote: { stringValue: String(reviewNote || "").trim() },
    };
    if (normalizedStatus === "pending") {
      fields.upgradeReviewedAt = { stringValue: "" };
      fields.upgradeReviewedBy = { stringValue: "" };
    } else {
      fields.upgradeReviewedAt = { stringValue: now };
      fields.upgradeReviewedBy = {
        stringValue: normalizeEmail(freshSession?.user?.email || ""),
      };
    }

    await patchCloudProfileFields(freshSession.accessToken, targetProfile.id, fields);

    let archiveWarning = "";
    if (requestId) {
      try {
        await upsertCloudUpgradeRequestRecord(freshSession.accessToken, {
          requestId,
          userId: targetProfile.id,
          email: normalizedEmail,
          status: normalizedStatus,
          reference: String(targetProfile?.upgradePaymentReference || "").trim(),
          amount: String(targetProfile?.upgradeAmountPaid || "").trim(),
          note: String(targetProfile?.upgradeRequestNote || "").trim(),
          submittedAt: String(targetProfile?.upgradeRequestedAt || "").trim() || now,
          reviewedAt: normalizedStatus === "pending" ? "" : now,
          reviewedBy:
            normalizedStatus === "pending"
              ? ""
              : normalizeEmail(freshSession?.user?.email || ""),
          reviewNote: String(reviewNote || "").trim(),
        });
      } catch (archiveError) {
        archiveWarning = `Payment archive sync failed: ${
          archiveError?.message || "Unable to update upgradeRequests record."
        }`;
      }
    } else {
      archiveWarning = "Payment archive sync skipped: missing upgrade request id in profile.";
    }

    return { cloudUpdated: true, warning: archiveWarning };
  } catch (error) {
    return {
      cloudUpdated: false,
      warning: error?.message || "Unable to update cloud upgrade request status.",
    };
  }
}

export async function getCurrentUserUpgradeRequest() {
  const user = getCurrentUser();
  if (!user?.email) return null;

  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase") {
    return null;
  }

  try {
    const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) return null;

    let profile = await getCloudProfileById(freshSession.accessToken, freshSession?.user?.id || "");
    if (!profile && user.email) {
      const byEmail = await findCloudProfilesByEmail(freshSession.accessToken, user.email, 1);
      profile = byEmail[0] || null;
    }

    return buildUpgradeRequestRecordFromProfile(profile);
  } catch (error) {
    return null;
  }
}

export function getCurrentUser() {
  const session = readSession();
  if (!session) return null;

  if (session.provider === "firebase") {
    startCloudPlanAutoSync();

    if (sessionIsExpired(session)) {
      if (session.refreshToken) {
        ensureCloudSessionActive(session, { clearOnFailure: true }).catch(() => {});
      } else {
        clearSession();
        return null;
      }
    }

    if (!session.user && session.accessToken) {
      refreshCloudUserInSession(session).catch(() => {});
      return null;
    }

    if (session.user && session.accessToken && !cloudPlanSyncInFlight) {
      const lastSyncMs = Date.parse(session.lastPlanSyncAt || "") || 0;
      const syncIsStale = Date.now() - lastSyncMs > PLAN_SYNC_INTERVAL_MS;
      const missingPlan = !session.user.plan;
      if (missingPlan || syncIsStale) {
        cloudPlanSyncInFlight = true;
        syncCloudPlanInSession(session)
          .catch(() => {})
          .finally(() => {
            cloudPlanSyncInFlight = false;
          });
      }
    }

    return applyPlanOverrideForEmail(session.user || null);
  }

  if (session.provider !== "local") {
    clearSession();
    return null;
  }

  const users = readUsers();
  const user = users.find((u) => u.id === session.userId);
  return applyPlanOverrideForEmail(sanitizeUserLocal(user));
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function getCurrentEntitlement() {
  const user = getCurrentUser();
  if (!user) return FREE_PLAN;
  if (isCurrentUserAdmin()) return PREMIUM_PLAN;
  return user.plan === "premium" ? PREMIUM_PLAN : FREE_PLAN;
}

export function getAccessibleTopics(topics) {
  const entitlement = getCurrentEntitlement();
  const source = Array.isArray(topics) ? topics : [];
  if (!entitlement.maxTopics) return source;
  return source.slice(0, entitlement.maxTopics);
}

export function getProgressStorageKeyForCurrentUser() {
  const user = getCurrentUser();
  return user ? `cbt_progress_summary_v1_${user.id}` : "cbt_progress_summary_v1_guest";
}

export function getAuthSummaryLabel() {
  const user = getCurrentUser();
  if (!user) return "Login";
  if (isCurrentUserAdmin()) return "Administrator";
  return user.plan === "premium" ? "Premium access" : "Free access";
}

export function getAuthProviderLabel() {
  return isCloudAuthEnabled() ? "Cloud" : "Local";
}

export function getLocalPlanOverrides() {
  return readPlanOverrides();
}

export function getPlanOverrideSyncMeta() {
  return readPlanOverrideMeta();
}

export function setLocalPlanOverride(email, plan) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }
  const overrides = readPlanOverrides();
  overrides[normalizedEmail] = normalizePlan(plan);
  writePlanOverrides(overrides);
}

export async function setPlanOverride(email, plan) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPlan = normalizePlan(plan);

  setLocalPlanOverride(normalizedEmail, normalizedPlan);

  if (!isCloudAuthEnabled()) {
    const result = { scope: "local", cloudUpdated: false, warning: "" };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  }

  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase" || !isCurrentUserAdmin()) {
    const result = {
      scope: "local",
      cloudUpdated: false,
      warning: "Saved locally only. Cloud sync requires an authenticated admin cloud session.",
    };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  }

  try {
    const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) throw new Error("Cloud session is unavailable.");

    const rows = await findCloudProfilesByEmail(freshSession.accessToken, normalizedEmail, 1);
    if (!rows.length || !rows[0]?.id) {
      const result = {
        scope: "local",
        cloudUpdated: false,
        warning:
          "Saved locally. Cloud profile not found for this email yet; user must login once to create profile.",
      };
      const meta = readPlanOverrideMeta();
      meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
      writePlanOverrideMeta(meta);
      return result;
    }

    await upsertCloudProfile(freshSession.accessToken, {
      ...rows[0],
      plan: normalizedPlan,
      lastSeenAt: new Date().toISOString(),
    });

    const current = readSession();
    if (current?.provider === "firebase" && normalizeEmail(current?.user?.email) === normalizedEmail) {
      const previousPlan = normalizePlan(current?.user?.plan || "free");
      const updatedSession = {
        ...current,
        user: {
          ...current.user,
          plan: normalizedPlan,
        },
        lastPlanSyncAt: new Date().toISOString(),
      };
      writeSession(updatedSession);
      emitPlanChange(previousPlan, normalizedPlan);
    }

    const result = { scope: "cloud+local", cloudUpdated: true, warning: "" };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  } catch (error) {
    const result = {
      scope: "local",
      cloudUpdated: false,
      warning: error?.message || "Saved locally, but cloud sync failed. Check Firestore rules/collection.",
    };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  }
}

export function clearLocalPlanOverride(email) {
  const normalizedEmail = normalizeEmail(email);
  const overrides = readPlanOverrides();
  if (normalizedEmail in overrides) {
    delete overrides[normalizedEmail];
    writePlanOverrides(overrides);
  }
  const meta = readPlanOverrideMeta();
  if (normalizedEmail in meta) {
    delete meta[normalizedEmail];
    writePlanOverrideMeta(meta);
  }
}

export function getConfiguredAdminEmails() {
  const configured = Array.isArray(window.PROMOTION_CBT_ADMIN_EMAILS)
    ? window.PROMOTION_CBT_ADMIN_EMAILS
    : [];
  const normalized = [...DEFAULT_ADMIN_EMAILS, ...configured]
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

export function isCurrentUserAdmin() {
  const user = getCurrentUser();
  if (!user?.email) return false;
  const adminEmails = getConfiguredAdminEmails();
  return adminEmails.includes(normalizeEmail(user.email));
}

function buildLocalUserDirectory() {
  const users = readUsers();
  const overrides = readPlanOverrides();
  const adminSet = new Set(getConfiguredAdminEmails());
  const current = getCurrentUser();
  const currentEmail = normalizeEmail(current?.email || "");
  const currentPlan = current?.plan || "free";
  const map = new Map();

  users.forEach((user) => {
    const email = normalizeEmail(user.email);
    if (!email) return;
    map.set(email, {
      id: user.id || email,
      email,
      plan: normalizePlan(overrides[email] || user.plan || "free"),
      status: "active",
      role: adminSet.has(email) ? "admin" : "user",
      createdAt: user.createdAt || "",
      lastSeenAt: "",
      source: "local",
    });
  });

  if (currentEmail && !map.has(currentEmail)) {
    map.set(currentEmail, {
      id: current?.id || currentEmail,
      email: currentEmail,
      plan: normalizePlan(overrides[currentEmail] || currentPlan),
      status: "active",
      role: adminSet.has(currentEmail) ? "admin" : "user",
      createdAt: current?.createdAt || "",
      lastSeenAt: "",
      source: "session",
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function mergeDirectoryRows(primaryRows, secondaryRows) {
  const overrides = readPlanOverrides();
  const merged = new Map();

  function addRow(row, defaultSource) {
    const email = normalizeEmail(row?.email || "");
    if (!email || merged.has(email)) return;
    merged.set(email, {
      id: row?.id || email,
      email,
      role: normalizeRole(row?.role),
      status: normalizeStatus(row?.status),
      plan: normalizePlan(overrides[email] || row?.plan),
      createdAt: row?.createdAt || row?.created_at || "",
      lastSeenAt: row?.lastSeenAt || row?.last_seen_at || "",
      source: row?.source || defaultSource,
    });
  }

  (Array.isArray(primaryRows) ? primaryRows : []).forEach((row) => addRow(row, "cloud"));
  (Array.isArray(secondaryRows) ? secondaryRows : []).forEach((row) => addRow(row, "local"));

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

function buildFallbackUserDirectory() {
  const cache = readAdminDirectoryCache();
  const localRows = buildLocalUserDirectory();
  const cachedRows = Array.isArray(cache.users) ? cache.users : [];
  if (!cachedRows.length) {
    return {
      users: localRows,
      hasCachedCloudSnapshot: false,
      cachedSyncedAt: "",
    };
  }
  return {
    users: mergeDirectoryRows(cachedRows, localRows),
    hasCachedCloudSnapshot: true,
    cachedSyncedAt: cache.syncedAt,
  };
}

function formatCacheTimestamp(value) {
  if (!value) return "an earlier sync";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "an earlier sync";
  return parsed.toLocaleString();
}

export async function getAdminUserDirectory() {
  if (!isCurrentUserAdmin()) {
    throw new Error("Admin access is required.");
  }

  const session = readSession();
  if (isCloudAuthEnabled() && session?.provider === "firebase" && session.accessToken) {
    try {
      const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
      if (!freshSession?.accessToken) throw new Error("Cloud session is unavailable.");

      const rows = await listCloudProfiles(freshSession.accessToken);
      const normalizedRows = rows.map(normalizeDirectoryRow);
      writeAdminDirectoryCache(normalizedRows);
      return {
        users: normalizedRows,
        source: "cloud",
        warning: "",
      };
    } catch (error) {
      const fallback = buildFallbackUserDirectory();
      return {
        users: fallback.users,
        source: "local",
        warning: fallback.hasCachedCloudSnapshot
          ? `Cloud user directory unavailable. Showing cached cloud snapshot from ${formatCacheTimestamp(
              fallback.cachedSyncedAt,
            )} plus local data.`
          : "Cloud user directory unavailable. Configure Firestore profiles collection and security rules.",
      };
    }
  }

  return {
    users: buildLocalUserDirectory(),
    source: "local",
    warning: "",
  };
}

async function ensureAdminCloudSession() {
  if (!isCurrentUserAdmin()) {
    throw new Error("Admin access is required.");
  }

  const session = readSession();
  if (!isCloudAuthEnabled() || session?.provider !== "firebase") {
    throw new Error("Cloud session is unavailable.");
  }

  const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  return freshSession;
}

export async function updateCloudUserStatusById(profileId, status) {
  const normalizedProfileId = String(profileId || "").trim();
  if (!normalizedProfileId) {
    throw new Error("Profile id is required.");
  }

  const nextStatus = normalizeStatus(status);
  const session = await ensureAdminCloudSession();
  await patchCloudProfileFields(session.accessToken, normalizedProfileId, {
    status: { stringValue: nextStatus },
    lastSeenAt: { timestampValue: toIsoTimestamp(new Date().toISOString()) },
  });
}

export async function deleteCloudUserById(profileId) {
  const normalizedProfileId = String(profileId || "").trim();
  if (!normalizedProfileId) {
    throw new Error("Profile id is required.");
  }

  const session = await ensureAdminCloudSession();
  await firestoreRequest(`documents/profiles/${encodeURIComponent(normalizedProfileId)}`, {
    method: "DELETE",
    idToken: session.accessToken,
  });

  try {
    await deleteFirebaseAuthUserById(normalizedProfileId, session.accessToken);
  } catch (error) {
    throw new Error(
      `Cloud profile removed but Firebase Authentication deletion failed: ${error.message || "unknown reason"}`,
    );
  }
}
