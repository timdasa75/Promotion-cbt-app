import {
  normalizeBaseUrl,
  resolveCooldownMs,
  resolveRuntimeBoolean,
} from "./authNormalization.js";

const DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_PASSWORD_RESET_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Read runtime auth configuration and return a normalized Firebase-related settings object.
 *
 * Resolves values from window.PROMOTION_CBT_AUTH when available (falling back to sensible defaults),
 * normalizes string fields (trimmed), coerces numeric cooldowns, applies default regions/IDs, and
 * resolves boolean runtime flags via resolveRuntimeBoolean.
 *
 * @returns {{firebaseApiKey: string, firebaseProjectId: string, firebaseAuthDomain: string, firebaseFunctionsRegion: string, firebaseQuotaProjectId: string, enableCloudProgressSync: boolean, enableLocalDemoAuth: boolean, adminApiBaseUrl: string|null, verificationResendCooldownMs: number, passwordResetCooldownMs: number}} An object containing resolved Firebase configuration:
 * - `firebaseApiKey`: API key for Firebase.
 * - `firebaseProjectId`: Firebase project ID.
 * - `firebaseAuthDomain`: Firebase auth domain.
 * - `firebaseFunctionsRegion`: Cloud Functions region (default "us-central1").
 * - `firebaseQuotaProjectId`: Quota project ID used for billing, falling back to `firebaseProjectId` when unset.
 * - `enableCloudProgressSync`: whether cloud progress sync is enabled.
 * - `enableLocalDemoAuth`: whether local demo auth is enabled (resolved from runtime config).
 * - `adminApiBaseUrl`: normalized admin API base URL or `null` when not provided.
 * - `verificationResendCooldownMs`: numeric cooldown for verification resends (may be NaN if unset).
 * - `passwordResetCooldownMs`: numeric cooldown for password reset requests (may be NaN if unset).
 */
export function getFirebaseConfig() {
  const cfg = (typeof window !== "undefined" && window.PROMOTION_CBT_AUTH) || {};
  const firebaseApiKey = String(cfg.firebaseApiKey || cfg.apiKey || "").trim();
  const firebaseProjectId = String(cfg.firebaseProjectId || cfg.projectId || "").trim();
  const firebaseAuthDomain = String(cfg.firebaseAuthDomain || cfg.authDomain || "").trim();
  const firebaseFunctionsRegion = String(cfg.firebaseFunctionsRegion || "us-central1").trim();
  const firebaseQuotaProjectId = String(
    cfg.firebaseQuotaProjectId || cfg.quotaProjectId || firebaseProjectId || "",
  ).trim();
  const enableCloudProgressSync = resolveRuntimeBoolean(cfg.enableCloudProgressSync, false);
  const enableLocalDemoAuth = resolveRuntimeBoolean(
    cfg.enableLocalDemoAuth ?? cfg.enableLocalAuth,
    false,
  );
  const adminApiBaseUrl = normalizeBaseUrl(cfg.adminApiBaseUrl);
  const verificationResendCooldownMs = Number(cfg.verificationResendCooldownMs);
  const passwordResetCooldownMs = Number(cfg.passwordResetCooldownMs);

  return {
    firebaseApiKey,
    firebaseProjectId,
    firebaseAuthDomain,
    firebaseFunctionsRegion,
    firebaseQuotaProjectId,
    enableCloudProgressSync,
    enableLocalDemoAuth,
    adminApiBaseUrl,
    verificationResendCooldownMs,
    passwordResetCooldownMs,
  };
}

export function buildIdentityToolkitAdminHeaders(accessToken) {
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

export function getVerificationResendCooldownMs() {
  const { verificationResendCooldownMs } = getFirebaseConfig();
  return resolveCooldownMs(verificationResendCooldownMs, DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS);
}

export function getPasswordResetCooldownMs() {
  const { passwordResetCooldownMs } = getFirebaseConfig();
  return resolveCooldownMs(passwordResetCooldownMs, DEFAULT_PASSWORD_RESET_COOLDOWN_MS);
}

export function isLocalDevelopmentHost() {
  const host = String((typeof window !== "undefined" && window.location?.hostname) || "").trim().toLowerCase();
  return host === "" || host === "localhost" || host === "127.0.0.1";
}

export function isCloudAuthEnabled() {
  const { firebaseApiKey, firebaseProjectId } = getFirebaseConfig();
  return Boolean(firebaseApiKey && firebaseProjectId);
}

export function isCloudProgressSyncEnabled() {
  const { enableCloudProgressSync } = getFirebaseConfig();
  return Boolean(enableCloudProgressSync && isCloudAuthEnabled());
}

export function isCloudAuthRequired() {
  if (typeof window !== "undefined" && typeof window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH === "boolean") {
    return window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH;
  }
  return !isLocalDevelopmentHost();
}

/**
 * Determine whether cloud authentication is required but not configured.
 * @returns {boolean} `true` if cloud authentication is required and not enabled, `false` otherwise.
 */
export function isCloudAuthMisconfigured() {
  return isCloudAuthRequired() && !isCloudAuthEnabled();
}

/**
 * Determine whether local demo authentication is enabled.
 *
 * Priority: if `window.PROMOTION_CBT_ALLOW_LOCAL_AUTH` is present and a boolean, that value is used.
 * Otherwise `enableLocalDemoAuth` from runtime config enables it when truthy; if neither is set,
 * local demo auth is enabled only when cloud auth is not enabled and cloud auth is not required.
 * @returns {boolean} `true` if local demo authentication is allowed, `false` otherwise.
 */
export function isLocalDemoAuthEnabled() {
  if (typeof window !== "undefined" && typeof window.PROMOTION_CBT_ALLOW_LOCAL_AUTH === "boolean") {
    return window.PROMOTION_CBT_ALLOW_LOCAL_AUTH;
  }

  const { enableLocalDemoAuth } = getFirebaseConfig();
  if (enableLocalDemoAuth) {
    return true;
  }

  return !isCloudAuthEnabled() && !isCloudAuthRequired();
}
