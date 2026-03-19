export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizePlan(value) {
  return String(value || "").toLowerCase() === "premium" ? "premium" : "free";
}

export function normalizeRole(value) {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "user";
}

export function normalizeStatus(value) {
  return String(value || "").toLowerCase() === "suspended" ? "suspended" : "active";
}

export function normalizeUpgradeRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return "none";
}

export function normalizeEmailVerificationState(value, fallback = null) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

export function toIsoTimestamp(value, fallback = new Date().toISOString()) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

export function toOptionalIsoTimestamp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

export function fromFirebaseMillisToIso(value, fallback = new Date().toISOString()) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Date(numeric).toISOString();
}

export function resolveRuntimeBoolean(value, fallback = false) {
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

export function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

export function resolveCooldownMs(configValue, fallbackMs) {
  const value = Number(configValue);
  if (!Number.isFinite(value) || value <= 0) return fallbackMs;
  return Math.max(60 * 1000, Math.min(value, 24 * 60 * 60 * 1000));
}
