// auth.js - auth/session + entitlement helpers

import { mapFirebaseAuthError } from "./authErrors.js";
import {
  fromFirebaseMillisToIso,
  normalizeEmail,
  normalizeEmailVerificationState,
  normalizePlan,
  normalizeRole,
  normalizeStatus,
  toIsoTimestamp,
  toOptionalIsoTimestamp,
} from "./authNormalization.js";
import { clearSession, readJsonStorage, readPlanOverrideMeta, readPlanOverrides, readSession, readUsers, writeAdminDirectoryCache, writePlanOverrideMeta, writePlanOverrides, writeSession } from "./authStorage.js";
import { readPasswordResetCooldowns, readVerificationResendCooldowns, writePasswordResetCooldowns, writeVerificationResendCooldowns } from "./authCooldownStorage.js";
import { firebaseAuthRequest } from "./authFirebaseTransport.js";
import { resolveCloudPlan } from "./authCloudProfile.js";
import { ensureCloudSessionActive } from "./authCloudSession.js";
import { readCloudProgressSummary as readCloudProgressSummaryCloud, writeCloudProgressSummary as writeCloudProgressSummaryCloud } from "./authCloudProgress.js";
import { findCloudProfilesByEmail, patchCloudProfileFields, upsertCloudProfile, upsertCloudUpgradeRequestRecord } from "./authCloudFirestore.js";
import { sendVerificationViaAdminApi } from "./authAdminApi.js";
import { bootstrapCloudflareMigrationFromFirebase as bootstrapCloudflareMigrationFromFirebaseClient, changeCloudflarePassword as changeCloudflarePasswordClient, completeCloudflareMigrationToken as completeCloudflareMigrationTokenClient, requestCloudflarePasswordRecovery as requestCloudflarePasswordRecoveryClient, resolveCloudflareMigrationToken as resolveCloudflareMigrationTokenClient } from "./authCloudflareClient.js";
import { enrichDirectoryVerificationStates, ensureAdminCloudSession as ensureAdminCloudSessionHelper, getConfiguredAdminEmails as getConfiguredAdminEmailsHelper, isCurrentUserAdmin as isCurrentUserAdminHelper } from "./authAdminDirectory.js";
import { deleteCloudUserById as deleteCloudUserByIdService, getAdminOperationHistory as getAdminOperationHistoryService, getAdminUserDirectory as getAdminUserDirectoryService, logAdminOperationToCloud as logAdminOperationToCloudService, createCloudflareMigrationLinkForUser as createCloudflareMigrationLinkForUserService, updateCloudUserStatusById as updateCloudUserStatusByIdService } from "./authAdminService.js";
import { buildUpgradeRequestRecordFromProfile as buildUpgradeRequestRecordFromProfileService, ensureCloudProfileInSession as ensureCloudProfileInSessionService, getCurrentUserUpgradeRequest as getCurrentUserUpgradeRequestService, setUpgradeRequestStatus as setUpgradeRequestStatusService, submitUpgradeRequest as submitUpgradeRequestService } from "./authUpgradeService.js";
import { FEEDBACK_MESSAGE_MAX_LENGTH, getAdminFeedbackSubmissions as getAdminFeedbackSubmissionsService, getFeedbackAccessState as getFeedbackAccessStateService, submitFeedbackSubmission as submitFeedbackSubmissionService, updateFeedbackSubmissionStatus as updateFeedbackSubmissionStatusService } from "./authFeedbackService.js";
import { loginUserCloud as loginUserCloudService, logoutCloud as logoutCloudService, refreshCloudUserInSession as refreshCloudUserInSessionService, registerUserCloud as registerUserCloudService } from "./authCloudLifecycle.js";
import { loginUserHybrid as loginUserHybridService, logoutHybrid as logoutHybridService, refreshCloudflareUserInSession as refreshCloudflareUserInSessionService, registerUserHybrid as registerUserHybridService } from "./authHybridLifecycle.js";
import { buildIdentityToolkitAdminHeaders, getFirebaseConfig, getPasswordResetCooldownMs, getVerificationResendCooldownMs, isCloudAuthEnabled, isCloudAuthMisconfigured, isCloudAuthRequired, isCloudProgressSyncEnabled, isCloudflareAuthPrimary, isLocalDemoAuthEnabled, shouldAllowFirebaseAuthFallback } from "./authRuntime.js";

const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];
const PLAN_SYNC_INTERVAL_MS = 30 * 1000;
const CLOUD_PLAN_POLL_MS = 5 * 1000;
const TOKEN_REFRESH_SKEW_MS = 30 * 1000;
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
  maxTopics: 3,
  maxSubcategories: 5,
  maxQuestionsPerSubcategory: 20,
};

const PREMIUM_PLAN = {
  id: "premium",
  maxTopics: null,
  maxSubcategories: null,
  maxQuestionsPerSubcategory: null,
};

const FREE_MOCK_EXAM_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_MOCK_EXAM_STORAGE_PREFIX = "cbt_free_mock_exam_v1_";

function getFreeMockExamStorageKey(userId) {
  return `${FREE_MOCK_EXAM_STORAGE_PREFIX}${userId || "guest"}`;
}

function readFreeMockExamUsage(userId) {
  try {
    const raw = window.localStorage.getItem(getFreeMockExamStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      lastUsedAt: String(parsed.lastUsedAt || "").trim(),
    };
  } catch (error) {
    return null;
  }
}

function writeFreeMockExamUsage(userId, lastUsedAt) {
  try {
    window.localStorage.setItem(
      getFreeMockExamStorageKey(userId),
      JSON.stringify({ lastUsedAt }),
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

export function getFreeMockExamEligibility() {
  const user = getCurrentUser();
  if (!user) {
    return { allowed: false, reason: "login-required", nextEligibleAt: "" };
  }

  const entitlement = getCurrentEntitlement();
  if (entitlement.id === "premium") {
    return { allowed: true, reason: "premium", nextEligibleAt: "" };
  }

  const usage = readFreeMockExamUsage(user.id);
  const lastUsedAt = String(usage?.lastUsedAt || "").trim();
  if (!lastUsedAt) {
    return { allowed: true, reason: "first-use", nextEligibleAt: "" };
  }

  const lastMs = Date.parse(lastUsedAt);
  if (!Number.isFinite(lastMs) || lastMs <= 0) {
    return { allowed: true, reason: "invalid-date", nextEligibleAt: "" };
  }

  const nowMs = Date.now();
  let anchorMs = Date.parse(String(user?.createdAt || "").trim());
  if (!Number.isFinite(anchorMs) || anchorMs <= 0) {
    anchorMs = lastMs;
  }
  if (!Number.isFinite(anchorMs) || anchorMs <= 0) {
    anchorMs = nowMs;
  }
  if (anchorMs > nowMs) {
    anchorMs = nowMs;
  }

  const elapsed = Math.max(0, nowMs - anchorMs);
  const periodIndex = Math.floor(elapsed / FREE_MOCK_EXAM_INTERVAL_MS);
  const currentPeriodStart = anchorMs + periodIndex * FREE_MOCK_EXAM_INTERVAL_MS;
  const nextPeriodStart = currentPeriodStart + FREE_MOCK_EXAM_INTERVAL_MS;

  if (lastMs >= currentPeriodStart) {
    return {
      allowed: false,
      reason: "weekly-limit",
      nextEligibleAt: new Date(nextPeriodStart).toISOString(),
      lastUsedAt,
    };
  }

  return {
    allowed: true,
    reason: "new-week",
    nextEligibleAt: "",
    lastUsedAt,
  };
}

export function recordFreeMockExamUsage() {
  const user = getCurrentUser();
  if (!user) return null;

  const entitlement = getCurrentEntitlement();
  if (entitlement.id === "premium") return null;

  const nowIso = new Date().toISOString();
  writeFreeMockExamUsage(user.id, nowIso);
  return nowIso;
}


function emitPlanChange(previousPlan, nextPlan) {
  if (!previousPlan || !nextPlan || previousPlan === nextPlan) return;
  document.dispatchEvent(
    new CustomEvent("authplanchange", {
      detail: { previousPlan, nextPlan },
    }),
  );
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


export { isCloudAuthMisconfigured, isCloudAuthRequired, isCloudProgressSyncEnabled };

function sessionIsExpired(session) {
  if (!session?.expiresAt) return false;
  return Date.now() >= Number(session.expiresAt);
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

async function ensureCloudProfileInSession(session) {
  return ensureCloudProfileInSessionService(session, {
    adminEmails: getConfiguredAdminEmails(),
  });
}

async function refreshCloudUserInSession(session) {
  return refreshCloudUserInSessionService(session, {
    ensureProfileInSession: ensureCloudProfileInSession,
    syncPlanInSession: syncCloudPlanInSession,
  });
}

async function registerUserCloud(input) {
  return registerUserCloudService(input, {
    markVerificationResend,
    ensureProfileInSession: ensureCloudProfileInSession,
  });
}

async function loginUserCloud(input) {
  return loginUserCloudService(input, {
    refreshCloudUser: refreshCloudUserInSession,
  });
}

function logoutCloud() {
  return logoutCloudService();
}

async function registerUserHybrid(input) {
  return registerUserHybridService(input, {
    registerFirebase: registerUserCloud,
  });
}

async function loginUserHybrid(input) {
  return loginUserHybridService(input, {
    loginFirebase: loginUserCloud,
  });
}

async function refreshCloudflareUserInSession(session) {
  return refreshCloudflareUserInSessionService(session);
}

async function logoutHybrid(session) {
  return logoutHybridService(session, {
    logoutFirebase: logoutCloud,
  });
}

function assertLocalDemoAuthEnabled(actionLabel = "Authentication") {
  if (isLocalDemoAuthEnabled()) return;
  if (isCloudAuthRequired()) {
    throw new Error("Cloud authentication is required on this deployment.");
  }
  throw new Error(`${actionLabel} is unavailable because local demo access is disabled.`);
}

function deriveDemoDisplayName(email) {
  const localPart = String(email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  const words = localPart
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!words.length) return "Demo User";
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildLocalDemoSessionUser({
  name,
  email,
  createdAt = new Date().toISOString(),
  plan = "free",
  billingCycle = "",
} = {}) {
  const normalizedEmail = normalizeEmail(email);
  return {
    id: `local_demo_${normalizedEmail || Date.now()}`,
    name: String(name || "").trim() || deriveDemoDisplayName(normalizedEmail),
    email: normalizedEmail,
    plan: normalizePlan(plan || "free"),
    billingCycle: String(billingCycle || "").trim(),
    createdAt,
  };
}

async function registerUserLocal({ name, email, password }) {
  assertLocalDemoAuthEnabled("Registration");

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

  const createdAt = new Date().toISOString();
  const user = buildLocalDemoSessionUser({
    name: trimmedName,
    email: normalizedEmail,
    createdAt,
  });

  writeSession({ provider: "local", user, createdAt });
  return {
    user: sanitizeUserLocal(user),
    requiresEmailVerification: false,
    message: "Demo access started on this device only. Passwords are not stored.",
  };
}

async function loginUserLocal({ email, password }) {
  assertLocalDemoAuthEnabled("Login");

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Email and password are required.");
  }

  const currentSession = readSession();
  const currentSessionUser =
    currentSession?.provider === "local" ? sanitizeUserLocal(currentSession?.user || null) : null;
  const createdAt = currentSessionUser?.createdAt || new Date().toISOString();
  const user =
    currentSessionUser && normalizeEmail(currentSessionUser.email) === normalizedEmail
      ? {
          ...currentSessionUser,
          createdAt,
        }
      : buildLocalDemoSessionUser({
          email: normalizedEmail,
          createdAt,
        });

  writeSession({ provider: "local", user, createdAt: new Date().toISOString() });
  return {
    user: sanitizeUserLocal(user),
    authMessage: "Demo access started on this device only.",
  };
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

function applyPlanOverrideForEmail(user) {
  if (!user) return null;

  const normalizedEmail = normalizeEmail(user?.email || "");
  if (!normalizedEmail) {
    return user;
  }

  const overrides = readPlanOverrides();
  const overridePlan = normalizePlan(overrides[normalizedEmail] || user?.plan || "free");

  if (overridePlan === normalizePlan(user?.plan || "free")) {
    return user;
  }

  return {
    ...user,
    email: normalizedEmail,
    plan: overridePlan,
  };
}

export async function registerUser({ name, email, password }) {
  if (isCloudflareAuthPrimary()) {
    return registerUserHybrid({ name, email, password });
  }
  if (isCloudAuthEnabled()) {
    return registerUserCloud({ name, email, password });
  }
  assertLocalDemoAuthEnabled("Registration");
  return registerUserLocal({ name, email, password });
}

export async function loginUser({ email, password }) {
  if (isCloudflareAuthPrimary()) {
    return loginUserHybrid({ email, password });
  }
  if (isCloudAuthEnabled()) {
    return loginUserCloud({ email, password });
  }
  assertLocalDemoAuthEnabled("Login");
  return loginUserLocal({ email, password });
}

export function logoutUser() {
  const session = readSession();
  if (session?.provider === "cloudflare") {
    logoutHybrid(session).catch(() => {
      clearSession();
    });
    return;
  }
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

  const continueUrl = String(redirectTo || "").trim();
  const genericMessage = "If this email matches an account, recovery instructions will follow shortly.";

  if (isCloudflareAuthPrimary()) {
    let cloudflareAccepted = false;
    let cloudflareMessage = genericMessage;
    try {
      const cloudflareRecovery = await requestCloudflarePasswordRecoveryClient(normalizedEmail, continueUrl);
      cloudflareAccepted = cloudflareRecovery?.accepted !== false;
      cloudflareMessage = String(cloudflareRecovery?.warning || cloudflareRecovery?.message || genericMessage).trim() || genericMessage;
    } catch (cloudflareError) {
      if (!shouldAllowFirebaseAuthFallback()) {
        throw cloudflareError;
      }
    }

    if (shouldAllowFirebaseAuthFallback()) {
      try {
        await firebaseAuthRequest("accounts:sendOobCode", {
          method: "POST",
          body: {
            requestType: "PASSWORD_RESET",
            email: normalizedEmail,
            ...(continueUrl ? { continueUrl } : {}),
          },
        });
        markPasswordResetRequest(normalizedEmail);
        return {
          delivered: true,
          mode: "firebase-reset",
          message: genericMessage,
        };
      } catch (firebaseError) {
        const failureCode = String(firebaseError?.message || "").toUpperCase();
        const canSuppressFirebaseFailure = cloudflareAccepted || failureCode.includes("EMAIL_NOT_FOUND") || failureCode.includes("USER_NOT_FOUND");
        if (!canSuppressFirebaseFailure) {
          throw firebaseError;
        }
      }
    }

    markPasswordResetRequest(normalizedEmail);
    return {
      delivered: true,
      mode: cloudflareAccepted ? "cloudflare-recovery-request" : "generic",
      message: cloudflareMessage,
    };
  }

  await firebaseAuthRequest("accounts:sendOobCode", {
    method: "POST",
    body: {
      requestType: "PASSWORD_RESET",
      email: normalizedEmail,
      ...(continueUrl ? { continueUrl } : {}),
    },
  });
  markPasswordResetRequest(normalizedEmail);
  return {
    delivered: true,
    mode: "firebase-reset",
    message: genericMessage,
  };
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

  try {
    const bridgeResult = await sendVerificationViaAdminApi(
      normalizedEmail,
      continueTarget,
      freshSession.accessToken,
    );
    const warning = String(bridgeResult?.warning || "").trim();
    if (bridgeResult?.delivered !== false) {
      markVerificationResend(normalizedEmail);
    }
    return {
      delivered: bridgeResult?.delivered !== false,
      warning,
    };
  } catch (bridgeError) {
    throw new Error(
      `Resend verification via admin API failed: ${bridgeError?.message || "request failed."}`,
    );
  }
}
export async function submitUpgradeRequest(input = {}) {
  return submitUpgradeRequestService(
    input,
    {
      cloudAuthEnabled: isCloudAuthEnabled(),
      currentUser: getCurrentUser(),
      session: readSession(),
      refreshSession: ensureCloudSessionActive,
      ensureProfileInSession: ensureCloudProfileInSession,
    },
  );
}

export async function setUpgradeRequestStatus(email, status, reviewNote = "", billingCycle = "") {
  return setUpgradeRequestStatusService(
    email,
    status,
    reviewNote,
    billingCycle,
    {
      cloudAuthEnabled: isCloudAuthEnabled(),
      session: readSession(),
      currentUserIsAdmin: isCurrentUserAdmin(),
      refreshSession: ensureCloudSessionActive,
      setLocalBillingCycle,
    },
  );
}

export async function getCurrentUserUpgradeRequest() {
  return getCurrentUserUpgradeRequestService(
    {
      currentUser: getCurrentUser(),
      session: readSession(),
      refreshSession: ensureCloudSessionActive,
    },
  );
}

export { FEEDBACK_MESSAGE_MAX_LENGTH };

export function getFeedbackAccessState() {
  return getFeedbackAccessStateService({
    currentUser: getCurrentUser(),
    session: readSession(),
    cloudAuthEnabled: isCloudAuthEnabled(),
  });
}

export async function submitFeedbackSubmission(input = {}) {
  return submitFeedbackSubmissionService(
    input,
    {
      cloudAuthEnabled: isCloudAuthEnabled(),
      currentUser: getCurrentUser(),
      session: readSession(),
      refreshSession: ensureCloudSessionActive,
    },
  );
}

export async function getAdminFeedbackSubmissions(limit = 200) {
  return getAdminFeedbackSubmissionsService(
    {
      cloudAuthEnabled: isCloudAuthEnabled(),
      currentUserIsAdmin: isCurrentUserAdmin(),
      session: readSession(),
      refreshSession: () => ensureAdminCloudSession(),
    },
    {
      limit,
    },
  );
}

export async function updateFeedbackSubmissionStatus(feedbackId, status) {
  return updateFeedbackSubmissionStatusService(
    feedbackId,
    status,
    {
      cloudAuthEnabled: isCloudAuthEnabled(),
      currentUserIsAdmin: isCurrentUserAdmin(),
      session: readSession(),
      refreshSession: () => ensureAdminCloudSession(),
    },
  );
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

  if (session.provider === "cloudflare") {
    if (sessionIsExpired(session)) {
      clearSession();
      return null;
    }

    if (!session.user && session.accessToken) {
      refreshCloudflareUserInSession(session).catch(() => {});
      return null;
    }

    return applyPlanOverrideForEmail(session.user || null);
  }

  if (session.provider !== "local") {
    clearSession();
    return null;
  }

  const sessionUser = sanitizeUserLocal(session.user || null);
  if (sessionUser?.email) {
    return applyPlanOverrideForEmail(sessionUser);
  }

  const users = readUsers();
  const legacyUser = users.find((u) => u.id === session.userId);
  if (legacyUser) {
    return applyPlanOverrideForEmail(sanitizeUserLocal(legacyUser));
  }

  clearSession();
  return null;
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
  return readCloudProgressSummaryCloud();
}

export async function writeCloudProgressSummary(summary, options = {}) {
  return writeCloudProgressSummaryCloud(summary, options);
}

export function getAuthSummaryLabel() {
  const user = getCurrentUser();
  if (!user) return "Login";
  const name = String(user?.name || user?.displayName || "").trim();
  const email = String(user?.email || "").trim();
  const planLabel = isCurrentUserAdmin()
    ? "Admin"
    : user.plan === "premium"
      ? "Premium"
      : "Free";
  if (name && email) return `${name}
${email} (${planLabel})`;
  if (name) return `${name}
(${planLabel})`;
  if (email) return `${email}
(${planLabel})`;
  return planLabel;
}

export function getAuthProviderLabel(mode = "active") {
  const normalizedMode = String(mode || "active").trim().toLowerCase();
  if (normalizedMode === "configured") {
    if (isCloudflareAuthPrimary()) {
      return shouldAllowFirebaseAuthFallback() ? "Hybrid" : "Cloudflare";
    }
    if (isCloudAuthEnabled()) return "Cloud";
    if (isLocalDemoAuthEnabled()) return "Demo";
    return "Unavailable";
  }

  const session = readSession();
  if (session?.provider === "firebase") return "Cloud";
  if (session?.provider === "cloudflare") {
    return shouldAllowFirebaseAuthFallback() ? "Hybrid" : "Cloudflare";
  }
  if (session?.provider === "local") return "Demo";

  return getAuthProviderLabel("configured");
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

export function setLocalBillingCycle(email, billingCycle) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCycle = String(billingCycle || "").trim();
  if (!normalizedEmail || !normalizedCycle) {
    return false;
  }

  const session = readSession();
  if (session?.provider !== "local" || !session?.user) {
    return false;
  }

  const sessionUser = sanitizeUserLocal(session.user);
  if (!sessionUser || normalizeEmail(sessionUser.email) !== normalizedEmail) {
    return false;
  }

  writeSession({
    ...session,
    user: {
      ...session.user,
      billingCycle: normalizedCycle,
    },
  });
  return true;
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
  return getConfiguredAdminEmailsHelper(DEFAULT_ADMIN_EMAILS, configured);
}

export function isCurrentUserAdmin() {
  return isCurrentUserAdminHelper(getCurrentUser(), getConfiguredAdminEmails());
}

export async function getAdminUserDirectory() {
  return getAdminUserDirectoryService(
    {
      currentUser: getCurrentUser(),
      adminEmails: getConfiguredAdminEmails(),
      session: readSession(),
      cloudAuthEnabled: isCloudAuthEnabled(),
      ensureAdminSession: ensureAdminCloudSession,
      writeDirectoryCache: writeAdminDirectoryCache,
    },
    {
      enrichVerificationStates: enrichDirectoryVerificationStates,
    },
  );
}
export async function getAdminOperationHistory(limit = 120) {
  return getAdminOperationHistoryService(limit, ensureAdminCloudSession);
}

export async function logAdminOperationToCloud(entry) {
  return logAdminOperationToCloudService(entry, ensureAdminCloudSession);
}
async function ensureAdminCloudSession() {
  return ensureAdminCloudSessionHelper({
    currentUser: getCurrentUser(),
    adminEmails: getConfiguredAdminEmails(),
    session: readSession(),
    cloudAuthEnabled: isCloudAuthEnabled(),
    refreshSession: ensureCloudSessionActive,
  });
}

export async function updateCloudUserStatusById(profileId, status) {
  return updateCloudUserStatusByIdService(profileId, status, ensureAdminCloudSession);
}
export async function createCloudflareMigrationLinkForUser(input) {
  return createCloudflareMigrationLinkForUserService(input, ensureAdminCloudSession);
}

export async function resolveCloudflareMigrationToken(token) {
  return resolveCloudflareMigrationTokenClient(token);
}

export async function completeCloudflareMigrationToken(token, password) {
  return completeCloudflareMigrationTokenClient(token, password);
}

export async function bootstrapCloudflareMigrationFromFirebase(password) {
  const session = readSession();
  if (!session?.accessToken || session?.provider !== "firebase") {
    throw new Error("A signed-in legacy account is required.");
  }
  return bootstrapCloudflareMigrationFromFirebaseClient(session.accessToken, password);
}

export async function changeCloudflarePasswordForCurrentUser(password) {
  const session = readSession();
  if (!session?.accessToken || session?.provider !== "cloudflare") {
    throw new Error("A signed-in cloud account is required.");
  }
  return changeCloudflarePasswordClient(session.accessToken, password);
}

export async function deleteCloudUserById(profileId) {
  return deleteCloudUserByIdService(profileId, ensureAdminCloudSession);
}

