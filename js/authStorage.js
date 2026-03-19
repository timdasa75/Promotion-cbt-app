const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";
const PLAN_OVERRIDES_STORAGE_KEY = "cbt_plan_overrides_v1";
const PLAN_OVERRIDE_META_STORAGE_KEY = "cbt_plan_override_meta_v1";
const ADMIN_DIRECTORY_CACHE_STORAGE_KEY = "cbt_admin_directory_cache_v1";

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
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function readSession() {
  const sessionScoped = readJsonStorage(window.sessionStorage, SESSION_STORAGE_KEY);
  if (sessionScoped) return sessionScoped;

  const legacyPersistent = readJsonStorage(window.localStorage, SESSION_STORAGE_KEY);
  if (legacyPersistent) {
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(legacyPersistent));
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage migration issues.
    }
    return legacyPersistent;
  }

  return null;
}

export function writeSession(session) {
  const payload = JSON.stringify(session);
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
