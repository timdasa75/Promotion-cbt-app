const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";
const PLAN_OVERRIDES_STORAGE_KEY = "cbt_plan_overrides_v1";
const PLAN_OVERRIDE_META_STORAGE_KEY = "cbt_plan_override_meta_v1";
const ADMIN_DIRECTORY_CACHE_STORAGE_KEY = "cbt_admin_directory_cache_v1";

function normalizeStorageObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function sanitizeStoredUser(user) {
  const source = normalizeStorageObject(user);
  if (!source) return null;
  return {
    id: String(source.id || "").trim(),
    name: String(source.name || "").trim(),
    email: String(source.email || "").trim(),
    plan: String(source.plan || "free").trim() || "free",
    createdAt: String(source.createdAt || "").trim(),
    lastSeenAt: String(source.lastSeenAt || "").trim(),
    emailVerified:
      typeof source.emailVerified === "boolean"
        ? source.emailVerified
        : source.emailVerified === null
          ? null
          : "",
    role: String(source.role || "").trim(),
    status: String(source.status || "").trim(),
  };
}

function sanitizeStoredUsers(users) {
  return (Array.isArray(users) ? users : [])
    .map((entry) => sanitizeStoredUser(entry))
    .filter(Boolean);
}

function sanitizeStoredSession(session) {
  const source = normalizeStorageObject(session);
  if (!source) return null;

  const sanitized = {
    provider: String(source.provider || "").trim(),
    accessToken: String(source.accessToken || "").trim(),
    refreshToken: String(source.refreshToken || "").trim(),
    expiresAt: Number.isFinite(Number(source.expiresAt)) ? Number(source.expiresAt) : 0,
    createdAt: String(source.createdAt || "").trim(),
    lastPlanSyncAt: String(source.lastPlanSyncAt || "").trim(),
    user: sanitizeStoredUser(source.user),
  };

  if (!sanitized.provider) return null;
  if (sanitized.provider === "firebase" && (!sanitized.accessToken || !sanitized.refreshToken || !sanitized.user)) {
    return null;
  }
  if (sanitized.provider === "cloudflare" && (!sanitized.accessToken || !sanitized.user)) {
    return null;
  }
  if (sanitized.provider === "local" && !sanitized.user) {
    return null;
  }

  return sanitized;
}

function rewriteStorageIfChanged(storage, key, sanitizedValue, originalRaw) {
  if (!storage) return;
  const nextRaw = sanitizedValue === null ? "" : JSON.stringify(sanitizedValue);
  if (sanitizedValue === null) {
    if (originalRaw) {
      storage.removeItem(key);
    }
    return;
  }
  if (nextRaw !== originalRaw) {
    storage.setItem(key, nextRaw);
  }
}

export function readJsonStorage(storage, key) {
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

export function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeStoredUsers(parsed);
    rewriteStorageIfChanged(localStorage, USERS_STORAGE_KEY, sanitized, raw);
    return sanitized;
  } catch (error) {
    return [];
  }
}

export function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitizeStoredUsers(users)));
}

export function readSession() {
  const sessionRaw = window.sessionStorage?.getItem?.(SESSION_STORAGE_KEY) || "";
  const sessionScoped = sanitizeStoredSession(readJsonStorage(window.sessionStorage, SESSION_STORAGE_KEY));
  if (sessionScoped) {
    rewriteStorageIfChanged(window.sessionStorage, SESSION_STORAGE_KEY, sessionScoped, sessionRaw);
    return sessionScoped;
  }

  const legacyRaw = window.localStorage?.getItem?.(SESSION_STORAGE_KEY) || "";
  const legacyPersistent = sanitizeStoredSession(readJsonStorage(window.localStorage, SESSION_STORAGE_KEY));
  if (legacyPersistent) {
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(legacyPersistent));
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage migration issues.
    }
    return legacyPersistent;
  }

  if (legacyRaw) {
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore cleanup failures.
    }
  }

  return null;
}

export function writeSession(session) {
  const sanitized = sanitizeStoredSession(session);
  if (!sanitized) {
    clearSession();
    return;
  }
  const payload = JSON.stringify(sanitized);
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
  } catch (error) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, payload);
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore cleanup failures.
  }
}

export function clearSession() {
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

export function readPlanOverrides() {
  try {
    const raw = localStorage.getItem(PLAN_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writePlanOverrides(overrides) {
  localStorage.setItem(PLAN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides || {}));
}

export function readPlanOverrideMeta() {
  try {
    const raw = localStorage.getItem(PLAN_OVERRIDE_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writePlanOverrideMeta(meta) {
  localStorage.setItem(PLAN_OVERRIDE_META_STORAGE_KEY, JSON.stringify(meta || {}));
}

export function readAdminDirectoryCache() {
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

export function writeAdminDirectoryCache(users, syncedAt = new Date().toISOString()) {
  localStorage.setItem(
    ADMIN_DIRECTORY_CACHE_STORAGE_KEY,
    JSON.stringify({
      users: Array.isArray(users) ? users : [],
      syncedAt: String(syncedAt || ""),
    }),
  );
}
