// auth.js - auth/session + entitlement helpers

import {
  LOCAL_PASSWORD_ALGO_V2,
  buildLocalPasswordRecord,
  verifyLocalPasswordRecord,
} from "./authPassword.js";

const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";
const PLAN_OVERRIDES_STORAGE_KEY = "cbt_plan_overrides_v1";
const PLAN_OVERRIDE_META_STORAGE_KEY = "cbt_plan_override_meta_v1";
const ADMIN_DIRECTORY_CACHE_STORAGE_KEY = "cbt_admin_directory_cache_v1";
const VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY = "cbt_verification_resend_cooldown_v1";
const PASSWORD_RESET_COOLDOWN_STORAGE_KEY = "cbt_password_reset_cooldown_v1";
const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];
const PLAN_SYNC_INTERVAL_MS = 30 * 1000;
const CLOUD_PLAN_POLL_MS = 5 * 1000;
const TOKEN_REFRESH_SKEW_MS = 30 * 1000;
const CLOUD_PROGRESS_COLLECTION = "progress";
const CLOUD_PROGRESS_SCHEMA_VERSION = 1;
const CLOUD_PROGRESS_MAX_ATTEMPTS = 50;
const CLOUD_PROGRESS_MAX_SUMMARY_BYTES = 300000;
const CLOUD_PROGRESS_MAX_RETRY_QUEUE_ITEMS = 300;
const CLOUD_PROGRESS_MAX_RETRY_QUEUE_BYTES = 650000;
const DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_PASSWORD_RESET_COOLDOWN_MS = 10 * 60 * 1000;

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

function normalizeEmailVerificationState(value, fallback = null) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function toIsoTimestamp(value, fallback = new Date().toISOString()) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function toOptionalIsoTimestamp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function fromFirebaseMillisToIso(value, fallback = new Date().toISOString()) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Date(numeric).toISOString();
}

function resolveRuntimeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
    return false;
  }
  return fallback;
}

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

function getFirebaseConfig() {
  const cfg = window.PROMOTION_CBT_AUTH || {};
  const firebaseApiKey = String(cfg.firebaseApiKey || cfg.apiKey || "").trim();
  const firebaseProjectId = String(cfg.firebaseProjectId || cfg.projectId || "").trim();
  const firebaseAuthDomain = String(cfg.firebaseAuthDomain || cfg.authDomain || "").trim();
  const firebaseAdminAccessToken = String(
    cfg.firebaseAdminAccessToken || cfg.identityToolkitAccessToken || "",
  ).trim();
  const firebaseFunctionsRegion = String(cfg.firebaseFunctionsRegion || "us-central1").trim();
  const firebaseQuotaProjectId = String(
    cfg.firebaseQuotaProjectId || cfg.quotaProjectId || firebaseProjectId || "",
  ).trim();
  const enableCloudProgressSync = resolveRuntimeBoolean(cfg.enableCloudProgressSync, false);
  const adminApiBaseUrl = normalizeBaseUrl(cfg.adminApiBaseUrl);
  const verificationResendCooldownMs = Number(cfg.verificationResendCooldownMs);
  const passwordResetCooldownMs = Number(cfg.passwordResetCooldownMs);
  return {
    firebaseApiKey,
    firebaseProjectId,
    firebaseAuthDomain,
    firebaseAdminAccessToken,
    firebaseFunctionsRegion,
    firebaseQuotaProjectId,
    enableCloudProgressSync,
    adminApiBaseUrl,
    verificationResendCooldownMs,
    passwordResetCooldownMs,
  };
}

function buildIdentityToolkitAdminHeaders(accessToken) {
  const { firebaseQuotaProjectId } = getFirebaseConfig();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (firebaseQuotaProjectId) {
    headers["x-goog-user-project"] = firebaseQuotaProjectId;
  }
  return headers;
}

function resolveCooldownMs(configValue, fallbackMs) {
  const value = Number(configValue);
  if (!Number.isFinite(value) || value <= 0) return fallbackMs;
  return Math.max(60 * 1000, Math.min(value, 24 * 60 * 60 * 1000));
}

function getVerificationResendCooldownMs() {
  const { verificationResendCooldownMs } = getFirebaseConfig();
  return resolveCooldownMs(verificationResendCooldownMs, DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS);
}

function getPasswordResetCooldownMs() {
  const { passwordResetCooldownMs } = getFirebaseConfig();
  return resolveCooldownMs(passwordResetCooldownMs, DEFAULT_PASSWORD_RESET_COOLDOWN_MS);
}

function getIdentityToolkitDeleteUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/accounts:delete`;
}

function getIdentityToolkitProjectSendOobUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/accounts:sendOobCode`;
}

function getIdentityToolkitProjectLookupUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/accounts:lookup`;
}

function getIdentityToolkitProjectBatchGetUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID is missing.");
  }
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId)}/accounts:batchGet`;
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
    headers: buildIdentityToolkitAdminHeaders(accessToken),
    body: JSON.stringify({ localId }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || "Firebase Authentication deletion failed.";
    throw new Error(message);
  }
}

async function sendProjectScopedOobCode({ requestType, email, accessToken, continueUrl = "" }) {
  if (!requestType) {
    throw new Error("Request type is required.");
  }
  if (!email) {
    throw new Error("Email is required.");
  }
  if (!accessToken) {
    throw new Error("Admin access token is missing.");
  }

  const body = {
    requestType: String(requestType || "").trim(),
    email: normalizeEmail(email),
  };
  const continueTarget = String(continueUrl || "").trim();
  if (continueTarget) {
    body.continueUrl = continueTarget;
  }

  const response = await fetch(getIdentityToolkitProjectSendOobUrl(), {
    method: "POST",
    credentials: "omit",
    headers: buildIdentityToolkitAdminHeaders(accessToken),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.error?.status || "Unable to send email action.";
    throw new Error(message);
  }
  return payload;
}

async function lookupProjectAccountsByEmails({ emails, accessToken }) {
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
  if (!accessToken) {
    throw new Error("Admin access token is missing.");
  }

  const chunks = [];
  const chunkSize = 100;
  for (let index = 0; index < normalizedEmails.length; index += chunkSize) {
    chunks.push(normalizedEmails.slice(index, index + chunkSize));
  }

  const verificationByEmail = new Map();

  for (const batch of chunks) {
    const response = await fetch(getIdentityToolkitProjectLookupUrl(), {
      method: "POST",
      credentials: "omit",
      headers: buildIdentityToolkitAdminHeaders(accessToken),
      body: JSON.stringify({ email: batch }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.error?.status || "Unable to lookup account status.";
      throw new Error(message);
    }
    const users = Array.isArray(payload?.users) ? payload.users : [];
    users.forEach((user) => {
      const email = normalizeEmail(user?.email || "");
      if (!email) return;
      verificationByEmail.set(email, Boolean(user?.emailVerified));
    });
  }

  return verificationByEmail;
}

async function listProjectAccountsByAccessToken(accessToken) {
  if (!accessToken) {
    throw new Error("Admin access token is missing.");
  }

  const rows = [];
  let pageToken = "";
  let loop = 0;

  do {
    const params = new URLSearchParams();
    params.set("maxResults", "1000");
    if (pageToken) {
      params.set("nextPageToken", pageToken);
    }

    const response = await fetch(`${getIdentityToolkitProjectBatchGetUrl()}?${params.toString()}`, {
      method: "GET",
      credentials: "omit",
      headers: buildIdentityToolkitAdminHeaders(accessToken),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error?.message || payload?.error?.status || "Unable to list Firebase Auth users.";
      throw new Error(message);
    }

    const users = Array.isArray(payload?.users) ? payload.users : [];
    users.forEach((entry) => {
      rows.push({
        id: String(entry?.localId || ""),
        email: normalizeEmail(entry?.email || ""),
        name: String(entry?.displayName || ""),
        emailVerified: normalizeEmailVerificationState(entry?.emailVerified, false),
        disabled: Boolean(entry?.disabled),
        createdAt: fromFirebaseMillisToIso(entry?.createdAt, ""),
        lastSignInAt: fromFirebaseMillisToIso(entry?.lastLoginAt, ""),
      });
    });

    pageToken = String(payload?.nextPageToken || "");
    loop += 1;
  } while (pageToken && loop < 50);

  return rows;
}

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

function getAdminDeleteFunctionUrl() {
  return buildAdminApiUrl("adminDeleteUserById");
}

function getAdminListUsersFunctionUrl() {
  return buildAdminApiUrl("adminListUsers");
}

async function deleteUserViaCloudFunction(userId, accessToken) {
  if (!userId) {
    throw new Error("User identifier is required.");
  }
  if (!accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const response = await fetch(getAdminDeleteFunctionUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || payload?.message || "Cloud Function user deletion failed.";
    throw new Error(message);
  }
  return payload;
}

async function listUsersViaCloudFunction(accessToken) {
  if (!accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const response = await fetch(getAdminListUsersFunctionUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || payload?.message || "Cloud Function user listing failed.";
    throw new Error(message);
  }

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

async function listUsersViaAdminToken() {
  const { firebaseAdminAccessToken } = getFirebaseConfig();
  return listProjectAccountsByAccessToken(firebaseAdminAccessToken);
}

function isLocalDevelopmentHost() {
  const host = String(window.location.hostname || "").trim().toLowerCase();
  return host === "" || host === "localhost" || host === "127.0.0.1";
}

function isCloudAuthEnabled() {
  const { firebaseApiKey, firebaseProjectId } = getFirebaseConfig();
  return Boolean(firebaseApiKey && firebaseProjectId);
}

export function isCloudProgressSyncEnabled() {
  const { enableCloudProgressSync } = getFirebaseConfig();
  return Boolean(enableCloudProgressSync && isCloudAuthEnabled());
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

function readVerificationResendCooldowns() {
  try {
    const raw = localStorage.getItem(VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeVerificationResendCooldowns(payload) {
  localStorage.setItem(
    VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY,
    JSON.stringify(payload && typeof payload === "object" ? payload : {}),
  );
}

function getVerificationResendCooldownRemainingMs(email, now = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return 0;
  const data = readVerificationResendCooldowns();
  const sentAt = Number(data[normalizedEmail] || 0);
  if (!Number.isFinite(sentAt) || sentAt <= 0) return 0;
  const cooldownMs = getVerificationResendCooldownMs();
  const elapsed = now - sentAt;
  if (elapsed >= cooldownMs) return 0;
  return cooldownMs - Math.max(0, elapsed);
}

function markVerificationResend(email, at = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  const data = readVerificationResendCooldowns();
  data[normalizedEmail] = Number(at) > 0 ? Number(at) : Date.now();
  writeVerificationResendCooldowns(data);
}

function assertVerificationResendAllowed(email) {
  const remainingMs = getVerificationResendCooldownRemainingMs(email);
  if (remainingMs <= 0) return;
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  throw new Error(
    `Verification email was sent recently. Try again in ${remainingMinutes} minute(s).`,
  );
}

function readPasswordResetCooldowns() {
  try {
    const raw = localStorage.getItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writePasswordResetCooldowns(payload) {
  localStorage.setItem(
    PASSWORD_RESET_COOLDOWN_STORAGE_KEY,
    JSON.stringify(payload && typeof payload === "object" ? payload : {}),
  );
}

function getPasswordResetCooldownRemainingMs(email, now = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return 0;
  const data = readPasswordResetCooldowns();
  const sentAt = Number(data[normalizedEmail] || 0);
  if (!Number.isFinite(sentAt) || sentAt <= 0) return 0;
  const cooldownMs = getPasswordResetCooldownMs();
  const elapsed = now - sentAt;
  if (elapsed >= cooldownMs) return 0;
  return cooldownMs - Math.max(0, elapsed);
}

function assertPasswordResetAllowed(email) {
  const remainingMs = getPasswordResetCooldownRemainingMs(email);
  if (remainingMs <= 0) return;
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  throw new Error(`Password reset was requested recently. Try again in ${remainingMinutes} minute(s).`);
}

function markPasswordResetRequest(email, at = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  const data = readPasswordResetCooldowns();
  data[normalizedEmail] = Number(at) > 0 ? Number(at) : Date.now();
  writePasswordResetCooldowns(data);
}

async function verifyLocalPassword(user, password) {
  return verifyLocalPasswordRecord(user, password);
}

function mapFirebaseAuthError(message) {
  const code = String(message || "").trim().toUpperCase();
  const compactCode = code.split(/[\s:,(]/)[0];
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
    QUOTA_EXCEEDED:
      "Quota exceeded. Firebase Auth is rate-limiting this operation. Try again later or check Firebase Auth usage/quota.",
  };
  if (mapped[code]) return mapped[code];
  if (mapped[compactCode]) return mapped[compactCode];
  if (code.includes("QUOTA_EXCEEDED")) return mapped.QUOTA_EXCEEDED;
  return message || "Authentication request failed.";
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
    emailVerified: Boolean(payload?.emailVerified),
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
    emailVerified: { booleanValue: Boolean(profile?.emailVerified) },
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
  const hasExplicitVerifiedField =
    Object.prototype.hasOwnProperty.call(fields, "emailVerified") &&
    Object.prototype.hasOwnProperty.call(fields?.emailVerified || {}, "booleanValue");
  return {
    id,
    email: normalizeEmail(fields?.email?.stringValue || ""),
    name: String(fields?.name?.stringValue || ""),
    plan: normalizePlan(fields?.plan?.stringValue || "free"),
    role: normalizeRole(fields?.role?.stringValue || "user"),
    status: normalizeStatus(fields?.status?.stringValue || "active"),
    createdAt: String(fields?.createdAt?.timestampValue || ""),
    lastSeenAt: String(fields?.lastSeenAt?.timestampValue || ""),
    emailVerified: hasExplicitVerifiedField ? Boolean(fields?.emailVerified?.booleanValue) : null,
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

function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function getProgressAttemptIdentity(attempt = {}) {
  const byId = String(attempt?.attemptId || "").trim();
  if (byId) return byId;
  const topicId = String(attempt?.topicId || "").trim().toLowerCase();
  const mode = String(attempt?.mode || "").trim().toLowerCase();
  const createdAt = toIsoTimestamp(attempt?.createdAt, "");
  const score = String(Math.round(clampNumber(attempt?.scorePercentage, { min: 0, max: 100, fallback: 0 })));
  const total = String(Math.floor(clampNumber(attempt?.totalQuestions, { min: 0, max: 1000, fallback: 0 })));
  return `legacy:${topicId}|${mode}|${createdAt}|${score}|${total}`;
}

function normalizeProgressAttempt(attempt = {}) {
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

function normalizeProgressSummary(summary) {
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

function parseProgressSummaryJson(raw) {
  if (!raw) return { attempts: [] };
  try {
    const parsed = JSON.parse(String(raw || ""));
    return normalizeProgressSummary(parsed);
  } catch (error) {
    return { attempts: [] };
  }
}

function serializeProgressSummary(summary) {
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

function normalizeRetryQueueEntry(entry = {}) {
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

function normalizeRetryQueue(queue) {
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

function parseRetryQueueJson(raw) {
  if (!raw) return [];
  try {
    return normalizeRetryQueue(JSON.parse(String(raw || "")));
  } catch (error) {
    return [];
  }
}

function serializeRetryQueue(queue) {
  let normalized = normalizeRetryQueue(queue);
  let serialized = JSON.stringify(normalized);
  while (serialized.length > CLOUD_PROGRESS_MAX_RETRY_QUEUE_BYTES && normalized.length > 0) {
    normalized = normalized.slice(0, normalized.length - 1);
    serialized = JSON.stringify(normalized);
  }
  return {
    normalized,
    serialized,
  };
}

function normalizeSpacedQueueEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry?.id || "").trim();
  const sourceTopicId = String(entry?.sourceTopicId || "").trim();
  const questionId = String(entry?.questionId || "").trim();
  const fingerprint = String(entry?.fingerprint || "").trim();
  if (!id || !sourceTopicId || (!questionId && !fingerprint)) return null;

  return {
    id,
    sourceTopicId,
    sourceTopicName: String(entry?.sourceTopicName || "").trim(),
    questionId,
    fingerprint,
    dueAt: toIsoTimestamp(entry?.dueAt, new Date().toISOString()),
    intervalDays: Math.max(1, Math.floor(clampNumber(entry?.intervalDays, { min: 1, max: 365, fallback: 1 }))),
    easeFactor: clampNumber(entry?.easeFactor, { min: 1.3, max: 3.2, fallback: 2.5 }),
    repetitions: Math.max(0, Math.floor(clampNumber(entry?.repetitions, { min: 0, max: 50, fallback: 0 }))),
    reviewCount: Math.max(0, Math.floor(clampNumber(entry?.reviewCount, { min: 0, max: 5000, fallback: 0 }))),
    lapses: Math.max(0, Math.floor(clampNumber(entry?.lapses, { min: 0, max: 5000, fallback: 0 }))),
    lastResult: String(entry?.lastResult || "").trim().toLowerCase() === "correct" ? "correct" : "incorrect",
    lastReviewedAt: toOptionalIsoTimestamp(entry?.lastReviewedAt),
  };
}

function normalizeSpacedQueue(queue) {
  const items = Array.isArray(queue) ? queue : [];
  const byId = new Map();
  items.forEach((entry) => {
    const normalized = normalizeSpacedQueueEntry(entry);
    if (!normalized) return;
    const previous = byId.get(normalized.id);
    if (!previous) {
      byId.set(normalized.id, normalized);
      return;
    }
    const previousMs = Date.parse(previous.lastReviewedAt || previous.dueAt || "") || 0;
    const nextMs = Date.parse(normalized.lastReviewedAt || normalized.dueAt || "") || 0;
    if (nextMs >= previousMs) {
      byId.set(normalized.id, normalized);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => {
      const aMs = Date.parse(a.dueAt || "") || 0;
      const bMs = Date.parse(b.dueAt || "") || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .slice(0, CLOUD_PROGRESS_MAX_SPACED_QUEUE_ITEMS);
}

function parseSpacedQueueJson(raw) {
  if (!raw) return [];
  try {
    return normalizeSpacedQueue(JSON.parse(String(raw || "")));
  } catch (error) {
    return [];
  }
}

function serializeSpacedQueue(queue) {
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

function parseCloudProgressDocument(document) {
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

async function getCloudProgressDocument(idToken, userId) {
  if (!idToken || !userId) return null;
  try {
    return await firestoreRequest(
      `documents/${CLOUD_PROGRESS_COLLECTION}/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        idToken,
      },
    );
  } catch (error) {
    if (error?.httpStatus === 404 || String(error?.code || "") === "NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

async function ensureCloudProgressSession() {
  if (!isCloudProgressSyncEnabled()) {
    throw new Error("Cloud progress sync is disabled.");
  }
  const session = readSession();
  if (!session || session?.provider !== "firebase" || !session.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }
  const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
  if (!freshSession?.accessToken || !freshSession?.user?.id) {
    throw new Error("Cloud session is unavailable.");
  }
  return freshSession;
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
    "emailVerified",
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
    emailVerified: normalizeEmailVerificationState(row?.emailVerified),
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
  const isEmailVerified =
    typeof user.emailVerified === "boolean"
      ? user.emailVerified
      : normalizeEmailVerificationState(existingProfile?.emailVerified, false);
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
    emailVerified: isEmailVerified,
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
  markVerificationResend(normalizedEmail);

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
    clearSession();
    throw new Error(
      "Please verify your email before login. Use 'Resend verification' only when needed.",
    );
  }

  try {
    const profile = await getCloudProfileById(synced.accessToken, synced.user.id);
    if (String(profile?.status || "").toLowerCase() === "suspended") {
      clearSession();
      throw new Error("Your account is suspended. Contact admin support.");
    }
  } catch (error) {
    if (String(error?.message || "").includes("suspended")) {
      throw error;
    }
    // Do not block login if profile read fails unexpectedly.
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
  assertPasswordResetAllowed(normalizedEmail);

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
  markPasswordResetRequest(normalizedEmail);
}

export async function resendVerificationEmailForUser(email, redirectTo = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (!isCloudAuthEnabled()) {
    throw new Error("Email verification is available only in Cloud auth mode.");
  }
  if (!isCurrentUserAdmin()) {
    throw new Error("Admin access is required.");
  }

  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase") {
    throw new Error("Cloud session is unavailable.");
  }

  const freshSession = await ensureCloudSessionActive(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  const continueTarget = String(redirectTo || "").trim();
  const currentEmail = normalizeEmail(freshSession?.user?.email || "");
  assertVerificationResendAllowed(normalizedEmail);
  if (currentEmail && currentEmail === normalizedEmail) {
    await firebaseAuthRequest("accounts:sendOobCode", {
      method: "POST",
      body: {
        requestType: "VERIFY_EMAIL",
        idToken: freshSession.accessToken,
        ...(continueTarget ? { continueUrl: continueTarget } : {}),
      },
    });
    markVerificationResend(normalizedEmail);
    return { delivered: true, warning: "" };
  }

  const { firebaseAdminAccessToken } = getFirebaseConfig();
  if (!firebaseAdminAccessToken) {
    throw new Error(
      "Resend verification for other users requires PROMOTION_CBT_AUTH.firebaseAdminAccessToken. " +
        "On Spark, ask the user to attempt login to trigger a new verification email.",
    );
  }

  await sendProjectScopedOobCode({
    requestType: "VERIFY_EMAIL",
    email: normalizedEmail,
    accessToken: firebaseAdminAccessToken,
    continueUrl: continueTarget,
  });
  markVerificationResend(normalizedEmail);

  return {
    delivered: true,
    warning: "Verification email sent via admin-token fallback.",
  };
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

export async function readCloudProgressSummary() {
  const session = await ensureCloudProgressSession();
  const document = await getCloudProgressDocument(session.accessToken, session.user.id);
  if (!document) {
    return {
      exists: false,
      updatedAt: "",
      deviceId: "",
      schemaVersion: CLOUD_PROGRESS_SCHEMA_VERSION,
      summary: { attempts: [] },
      retryQueue: [],
      spacedQueue: [],
    };
  }

  const parsed = parseCloudProgressDocument(document);
  return {
    exists: true,
    updatedAt: String(parsed.updatedAt || ""),
    deviceId: String(parsed.deviceId || ""),
    schemaVersion: Number(parsed.schemaVersion || CLOUD_PROGRESS_SCHEMA_VERSION),
    summary: normalizeProgressSummary(parsed.summary),
    retryQueue: normalizeRetryQueue(parsed.retryQueue),
    spacedQueue: normalizeSpacedQueue(parsed.spacedQueue),
  };
}

export async function writeCloudProgressSummary(summary, { deviceId = "", retryQueue = [], spacedQueue = [] } = {}) {
  const session = await ensureCloudProgressSession();
  const { normalized, serialized } = serializeProgressSummary(summary);
  const { normalized: normalizedRetryQueue, serialized: serializedRetryQueue } = serializeRetryQueue(
    retryQueue,
  );
  const { normalized: normalizedSpacedQueue, serialized: serializedSpacedQueue } = serializeSpacedQueue(
    spacedQueue,
  );
  const nowIso = new Date().toISOString();
  const updateMask = buildUpdateMask([
    "schemaVersion",
    "updatedAt",
    "deviceId",
    "progressSummaryJson",
    "retryQueueJson",
    "spacedQueueJson",
  ]);

  await firestoreRequest(
    `documents/${CLOUD_PROGRESS_COLLECTION}/${encodeURIComponent(session.user.id)}?${updateMask}`,
    {
      method: "PATCH",
      idToken: session.accessToken,
      body: {
        fields: {
          schemaVersion: { integerValue: String(CLOUD_PROGRESS_SCHEMA_VERSION) },
          updatedAt: { timestampValue: nowIso },
          deviceId: { stringValue: String(deviceId || "").trim() },
          progressSummaryJson: { stringValue: serialized },
          retryQueueJson: { stringValue: serializedRetryQueue },
          spacedQueueJson: { stringValue: serializedSpacedQueue },
        },
      },
    },
  );

  return {
    saved: true,
    updatedAt: nowIso,
    summary: normalized,
    retryQueue: normalizedRetryQueue,
    spacedQueue: normalizedSpacedQueue,
  };
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
      emailVerified: normalizeEmailVerificationState(user.emailVerified),
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
      emailVerified: normalizeEmailVerificationState(current?.emailVerified),
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
      emailVerified: normalizeEmailVerificationState(row?.emailVerified),
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

async function enrichDirectoryVerificationStates(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const unresolvedEmails = Array.from(
    new Set(
      safeRows
        .filter((row) => row?.emailVerified === null)
        .map((row) => normalizeEmail(row?.email || ""))
        .filter(Boolean),
    ),
  );

  if (!unresolvedEmails.length) {
    return { users: safeRows, warning: "" };
  }

  const { firebaseAdminAccessToken } = getFirebaseConfig();
  if (!firebaseAdminAccessToken) {
    return {
      users: safeRows,
      warning:
        "Some email verification statuses are unknown. Configure PROMOTION_CBT_AUTH.firebaseAdminAccessToken to resolve from Firebase Auth.",
    };
  }

  try {
    const verificationByEmail = await lookupProjectAccountsByEmails({
      emails: unresolvedEmails,
      accessToken: firebaseAdminAccessToken,
    });
    const enrichedRows = safeRows.map((row) => {
      if (row?.emailVerified !== null) return row;
      const email = normalizeEmail(row?.email || "");
      if (!email || !verificationByEmail.has(email)) return row;
      return {
        ...row,
        emailVerified: verificationByEmail.get(email),
      };
    });

    const stillUnknownCount = enrichedRows.filter((row) => row?.emailVerified === null).length;
    return {
      users: enrichedRows,
      warning:
        stillUnknownCount > 0
          ? `${stillUnknownCount} account(s) still have unknown verification status (no matching Firebase Auth record).`
          : "",
    };
  } catch (error) {
    return {
      users: safeRows,
      warning: `Could not resolve email verification from Firebase Auth: ${error?.message || "lookup failed."}`,
    };
  }
}

function buildAuthBackedDirectoryRows(authUsers, profileRows) {
  const safeAuthUsers = Array.isArray(authUsers) ? authUsers : [];
  const safeProfiles = Array.isArray(profileRows) ? profileRows : [];
  const overrides = readPlanOverrides();
  const adminSet = new Set(getConfiguredAdminEmails());

  const profileById = new Map();
  const profileByEmail = new Map();
  safeProfiles.forEach((profile) => {
    const profileId = String(profile?.id || "").trim();
    const profileEmail = normalizeEmail(profile?.email || "");
    if (profileId && !profileById.has(profileId)) {
      profileById.set(profileId, profile);
    }
    if (profileEmail && !profileByEmail.has(profileEmail)) {
      profileByEmail.set(profileEmail, profile);
    }
  });

  const rows = safeAuthUsers
    .map((authUser) => {
      const id = String(authUser?.id || "").trim();
      const email = normalizeEmail(authUser?.email || "");
      if (!id || !email) return null;

      const profile = profileById.get(id) || profileByEmail.get(email) || null;
      const role = normalizeRole(profile?.role || (adminSet.has(email) ? "admin" : "user"));
      const status = normalizeStatus(profile?.status || (authUser?.disabled ? "suspended" : "active"));
      const plan = normalizePlan(overrides[email] || profile?.plan || "free");

      return {
        id,
        email,
        role,
        status,
        plan,
        createdAt: String(profile?.createdAt || authUser?.createdAt || ""),
        lastSeenAt: String(profile?.lastSeenAt || authUser?.lastSignInAt || ""),
        emailVerified: normalizeEmailVerificationState(authUser?.emailVerified, profile?.emailVerified),
        upgradeRequestId: String(profile?.upgradeRequestId || ""),
        upgradeRequestStatus: normalizeUpgradeRequestStatus(profile?.upgradeRequestStatus),
        upgradePaymentReference: String(profile?.upgradePaymentReference || ""),
        upgradeAmountPaid: String(profile?.upgradeAmountPaid || ""),
        upgradeRequestNote: String(profile?.upgradeRequestNote || ""),
        upgradeRequestedAt: String(profile?.upgradeRequestedAt || ""),
        upgradeReviewedAt: String(profile?.upgradeReviewedAt || ""),
        upgradeReviewedBy: normalizeEmail(profile?.upgradeReviewedBy || ""),
        upgradeRequestReviewNote: String(profile?.upgradeRequestReviewNote || ""),
        source: "cloud-auth",
      };
    })
    .filter(Boolean);

  rows.sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });

  return rows;
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

      let normalizedRows = [];
      const warnings = [];
      try {
        const rows = await listCloudProfiles(freshSession.accessToken);
        normalizedRows = rows.map(normalizeDirectoryRow);
      } catch (profileError) {
        warnings.push(`Cloud profiles unavailable. ${profileError?.message || ""}`.trim());
      }

      let users = normalizedRows;
      let source = normalizedRows.length ? "cloud" : "local";

      try {
        const authUsers = await listUsersViaCloudFunction(freshSession.accessToken);
        if (authUsers.length) {
          const authUserIds = new Set(authUsers.map((entry) => String(entry?.id || "").trim()).filter(Boolean));
          const authEmails = new Set(
            authUsers.map((entry) => normalizeEmail(entry?.email || "")).filter(Boolean),
          );
          const staleProfiles = normalizedRows.filter((profile) => {
            const profileId = String(profile?.id || "").trim();
            const profileEmail = normalizeEmail(profile?.email || "");
            return !authUserIds.has(profileId) && !authEmails.has(profileEmail);
          });

          users = buildAuthBackedDirectoryRows(authUsers, normalizedRows);
          source = "cloud-auth";
          if (staleProfiles.length > 0) {
            warnings.push(
              `${staleProfiles.length} stale profile record(s) were excluded because they are not in Firebase Auth.`,
            );
          }
        } else if (normalizedRows.length > 0) {
          warnings.push("Firebase Auth list returned zero users. Showing profile-based fallback.");
        } else {
          throw new Error("Firebase Auth list returned zero users and no cloud profiles are available.");
        }
      } catch (error) {
        const cloudFunctionWarning = `Cloud Function live list unavailable. ${error?.message || ""}`.trim();
        try {
          const authUsers = await listUsersViaAdminToken();
          if (authUsers.length) {
            const authUserIds = new Set(
              authUsers.map((entry) => String(entry?.id || "").trim()).filter(Boolean),
            );
            const authEmails = new Set(
              authUsers.map((entry) => normalizeEmail(entry?.email || "")).filter(Boolean),
            );
            const staleProfiles = normalizedRows.filter((profile) => {
              const profileId = String(profile?.id || "").trim();
              const profileEmail = normalizeEmail(profile?.email || "");
              return !authUserIds.has(profileId) && !authEmails.has(profileEmail);
            });

            users = buildAuthBackedDirectoryRows(authUsers, normalizedRows);
            source = "cloud-auth";
            if (staleProfiles.length > 0) {
              warnings.push(
                `${staleProfiles.length} stale profile record(s) were excluded because they are not in Firebase Auth.`,
              );
            }
          } else if (normalizedRows.length > 0) {
            warnings.push(cloudFunctionWarning);
            warnings.push("Admin-token live list returned zero users. Showing profile-based fallback.");
            const enriched = await enrichDirectoryVerificationStates(normalizedRows);
            users = enriched.users;
            if (enriched.warning) {
              warnings.push(enriched.warning);
            }
          } else {
            throw new Error("Admin-token live list returned zero users and no cloud profiles are available.");
          }
        } catch (fallbackError) {
          if (normalizedRows.length > 0) {
            warnings.push(cloudFunctionWarning);
            warnings.push(
              `Admin-token live list unavailable. Showing profile-based data. ${fallbackError?.message || ""}`.trim(),
            );
            const enriched = await enrichDirectoryVerificationStates(normalizedRows);
            users = enriched.users;
            if (enriched.warning) {
              warnings.push(enriched.warning);
            }
          } else {
            throw fallbackError;
          }
        }
      }

      writeAdminDirectoryCache(users);
      return {
        users,
        source,
        warning: warnings.join(" ").trim(),
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
          : `Cloud user directory unavailable. ${error?.message || "Configure Firestore profiles collection and security rules."}`,
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
  try {
    await deleteUserViaCloudFunction(normalizedProfileId, session.accessToken);
    return { authDeleted: true, warning: "" };
  } catch (cloudFunctionError) {
    const { firebaseAdminAccessToken } = getFirebaseConfig();
    if (!firebaseAdminAccessToken) {
      throw new Error(
        `Unable to delete this account from Firebase Authentication: ${cloudFunctionError.message || "Cloud Function unavailable"}. ` +
          "Deploy functions/adminDeleteUserById or provide PROMOTION_CBT_AUTH.firebaseAdminAccessToken.",
      );
    }

    await deleteFirebaseAuthUserById(normalizedProfileId, firebaseAdminAccessToken);
    await firestoreRequest(`documents/profiles/${encodeURIComponent(normalizedProfileId)}`, {
      method: "DELETE",
      idToken: session.accessToken,
    });
    return {
      authDeleted: true,
      warning: "Deleted via runtime admin-token fallback.",
    };
  }
}