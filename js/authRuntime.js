import {
  normalizeBaseUrl,
  resolveCooldownMs,
  resolveRuntimeBoolean,
} from "./authNormalization.js";

const DEFAULT_VERIFICATION_RESEND_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_PASSWORD_RESET_COOLDOWN_MS = 10 * 60 * 1000;
const SUPPORTED_AUTH_PROVIDERS = new Set(["firebase", "hybrid", "cloudflare"]);

function normalizeAuthProvider(cfg) {
  const value = cfg.authProvider || cfg.authMode;
  const hasCloudflare = Boolean(cfg.cloudflareAuthBaseUrl || cfg.cloudflareApiBaseUrl);
  
  if (value) {
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "cloudflare-hybrid") return "hybrid";
    if (SUPPORTED_AUTH_PROVIDERS.has(normalized)) return normalized;
  }
  
  // Default logic: If Cloudflare is configured, use hybrid as the modern default.
  return hasCloudflare ? "hybrid" : "firebase";
}

/**
 * Read auth-related runtime settings from the browser and normalize legacy keys into one stable config object.
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
  
  const cloudflareAuthBaseUrl = normalizeBaseUrl(
    cfg.cloudflareAuthBaseUrl || cfg.cloudflareApiBaseUrl || "",
  );

  const authProvider = normalizeAuthProvider({ ...cfg, cloudflareAuthBaseUrl });

  const enableCloudProgressSync = resolveRuntimeBoolean(cfg.enableCloudProgressSync, false);
  const enableLocalDemoAuth = resolveRuntimeBoolean(
    cfg.enableLocalDemoAuth ?? cfg.enableLocalAuth,
    false,
  );
  const adminApiBaseUrl = normalizeBaseUrl(cfg.adminApiBaseUrl);
  const cloudflareTurnstileSiteKey = String(
    cfg.cloudflareTurnstileSiteKey || cfg.turnstileSiteKey || "",
  ).trim();
  const allowFirebaseFallback = resolveRuntimeBoolean(
    cfg.allowFirebaseFallback,
    authProvider === "hybrid",
  );
  const verificationResendCooldownMs = Number(cfg.verificationResendCooldownMs);
  const passwordResetCooldownMs = Number(cfg.passwordResetCooldownMs);

  return {
    authProvider,
    firebaseApiKey,
    firebaseProjectId,
    firebaseAuthDomain,
    firebaseFunctionsRegion,
    firebaseQuotaProjectId,
    enableCloudProgressSync,
    enableLocalDemoAuth,
    adminApiBaseUrl,
    cloudflareAuthBaseUrl,
    cloudflareTurnstileSiteKey,
    allowFirebaseFallback,
    verificationResendCooldownMs,
    passwordResetCooldownMs,
  };
}

export function getConfiguredAuthProvider() {
  return getFirebaseConfig().authProvider;
}

export function isHybridAuthEnabled() {
  return getConfiguredAuthProvider() === "hybrid";
}

export function isCloudflareAuthEnabled() {
  const { cloudflareAuthBaseUrl } = getFirebaseConfig();
  return Boolean(cloudflareAuthBaseUrl);
}

export function isFirebaseEnabled() {
  const { firebaseApiKey, firebaseProjectId } = getFirebaseConfig();
  return Boolean(firebaseApiKey && firebaseProjectId);
}

export function isCloudflareAuthPrimary() {
  const { authProvider, cloudflareAuthBaseUrl } = getFirebaseConfig();
  return Boolean(cloudflareAuthBaseUrl && (authProvider === "cloudflare" || authProvider === "hybrid"));
}

export function shouldAllowFirebaseAuthFallback() {
  const { authProvider, allowFirebaseFallback } = getFirebaseConfig();
  return authProvider === "hybrid" && allowFirebaseFallback && isFirebaseEnabled();
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
  return isFirebaseEnabled() || isCloudflareAuthEnabled();
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

export function isCloudAuthMisconfigured() {
  return isCloudAuthRequired() && !isCloudAuthEnabled();
}

/**
 * Decide whether device-local demo auth should be available.
 * The order matters: explicit window overrides win, then config flags, then the development fallback when cloud auth is unavailable.
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
