// auth.js - auth/session + entitlement helpers

const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";
const PLAN_OVERRIDES_STORAGE_KEY = "cbt_plan_overrides_v1";
const PLAN_OVERRIDE_META_STORAGE_KEY = "cbt_plan_override_meta_v1";
const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];
const PLAN_SYNC_INTERVAL_MS = 30 * 1000;
const CLOUD_PLAN_POLL_MS = 5 * 1000;
const REALTIME_HEARTBEAT_MS = 25 * 1000;

let cloudPlanSyncInFlight = false;
let cloudPlanPollingHandle = null;
let cloudPlanVisibilityBound = false;
let realtimeSocket = null;
let realtimeHeartbeatHandle = null;
let realtimeReconnectHandle = null;
let realtimeRefCounter = 1;
let realtimeBoundUserKey = "";

function emitPlanChange(previousPlan, nextPlan) {
  if (!previousPlan || !nextPlan || previousPlan === nextPlan) return;
  document.dispatchEvent(
    new CustomEvent("authplanchange", {
      detail: { previousPlan, nextPlan },
    }),
  );
}

function nextRealtimeRef() {
  const ref = String(realtimeRefCounter);
  realtimeRefCounter += 1;
  return ref;
}

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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getSupabaseConfig() {
  const cfg = window.PROMOTION_CBT_AUTH || {};
  const supabaseUrl = String(cfg.supabaseUrl || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = String(cfg.supabaseAnonKey || "").trim();
  return { supabaseUrl, supabaseAnonKey };
}

function isCloudAuthEnabled() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
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

function writeUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function sessionIsExpired(session) {
  if (!session?.expiresAt) return false;
  return Date.now() >= Number(session.expiresAt);
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

async function supabaseRequest(path, { method = "GET", body = null, accessToken = "" } = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is missing.");
  }

  const headers = {
    apikey: supabaseAnonKey,
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.error_description ||
      payload?.error ||
      "Authentication request failed.";
    throw new Error(message);
  }

  return payload;
}

async function supabaseRestRequest(path, { method = "GET", body = null, accessToken = "" } = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is missing.");
  }

  const headers = {
    apikey: supabaseAnonKey,
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
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
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      "Data request failed.";
    throw new Error(message);
  }

  return payload;
}

function sanitizeCloudUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  const plan = meta.plan || appMeta.plan || "free";
  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email || "User",
    email: normalizeEmail(user.email),
    plan,
    createdAt: user.created_at || new Date().toISOString(),
  };
}

function applyPlanOverrideForEmail(user) {
  if (!user?.email) return user;
  const overrides = readPlanOverrides();
  const overridePlan = overrides[normalizeEmail(user.email)];
  if (!overridePlan) return user;
  return { ...user, plan: overridePlan };
}

function writeCloudSessionFromPayload(payload) {
  // Supabase can return either:
  // 1) { session: {...}, user: {...} } (e.g. signup)
  // 2) { access_token, refresh_token, expires_in, user, ... } (password login)
  const nestedSession = payload?.session || null;
  const flatSession =
    payload?.access_token
      ? {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token || "",
          expires_in: payload.expires_in || 0,
          expires_at: payload.expires_at || 0,
          user: payload.user || null,
        }
      : null;

  const session = nestedSession || flatSession;
  const user = payload?.user || session?.user || null;
  if (!session || !session.access_token || !user) {
    return null;
  }

  const nowMs = Date.now();
  const expiresAtMs =
    typeof session.expires_at === "number" && session.expires_at > 0
      ? session.expires_at * 1000
      : nowMs + Number(session.expires_in || 0) * 1000;

  const sessionRecord = {
    provider: "supabase",
    accessToken: session.access_token,
    refreshToken: session.refresh_token || "",
    expiresAt: expiresAtMs,
    user: sanitizeCloudUser(user),
    createdAt: new Date().toISOString(),
  };
  writeSession(sessionRecord);
  return sessionRecord;
}

async function resolveCloudPlan(session) {
  if (!session?.accessToken || !session?.user) return session?.user?.plan || "free";
  const defaultPlan = session.user.plan || "free";

  try {
    if (session.user.id) {
      const rows = await supabaseRestRequest(
        `profiles?id=eq.${encodeURIComponent(session.user.id)}&select=plan&limit=1`,
        {
          method: "GET",
          accessToken: session.accessToken,
        },
      );
      if (Array.isArray(rows) && rows.length > 0 && rows[0]?.plan) {
        return String(rows[0].plan).toLowerCase();
      }
    }

    // Fallback for deployments where profile rows are keyed by email.
    if (session.user.email) {
      const emailRows = await supabaseRestRequest(
        `profiles?email=eq.${encodeURIComponent(normalizeEmail(session.user.email))}&select=plan&limit=1`,
        {
          method: "GET",
          accessToken: session.accessToken,
        },
      );
      if (Array.isArray(emailRows) && emailRows.length > 0 && emailRows[0]?.plan) {
        return String(emailRows[0].plan).toLowerCase();
      }
    }
  } catch (error) {
    // Optional table; ignore when unavailable.
  }

  return defaultPlan;
}

async function syncCloudPlanInSession(session) {
  if (!session?.provider || session.provider !== "supabase" || !session.user) {
    return session;
  }
  const previousPlan = session.user.plan || "free";
  const plan = await resolveCloudPlan(session);
  const nowIso = new Date().toISOString();
  const updated = {
    ...session,
    lastPlanSyncAt: nowIso,
    user: {
      ...session.user,
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
    session.provider !== "supabase" ||
    sessionIsExpired(session) ||
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
    // Best-effort background sync; ignore transient errors.
  } finally {
    cloudPlanSyncInFlight = false;
  }
}

export async function forceCloudPlanSync() {
  const session = readSession();
  if (
    !session ||
    session.provider !== "supabase" ||
    sessionIsExpired(session) ||
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

function closeRealtimeSocket() {
  if (realtimeReconnectHandle) {
    clearTimeout(realtimeReconnectHandle);
    realtimeReconnectHandle = null;
  }
  if (realtimeHeartbeatHandle) {
    clearInterval(realtimeHeartbeatHandle);
    realtimeHeartbeatHandle = null;
  }
  if (realtimeSocket) {
    try {
      realtimeSocket.close();
    } catch (error) {
      // Ignore close errors.
    }
    realtimeSocket = null;
  }
  realtimeBoundUserKey = "";
}

function buildRealtimeWebSocketUrl() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) return "";
  const wsBase = supabaseUrl.replace(/^http/i, "ws");
  return `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(
    supabaseAnonKey,
  )}&vsn=1.0.0`;
}

function scheduleRealtimeReconnect() {
  if (realtimeReconnectHandle) return;
  realtimeReconnectHandle = setTimeout(() => {
    realtimeReconnectHandle = null;
    const session = readSession();
    if (!session || session.provider !== "supabase" || !session.accessToken || sessionIsExpired(session)) {
      return;
    }
    subscribeToCloudPlanRealtime(session);
  }, 3000);
}

function subscribeToCloudPlanRealtime(session) {
  if (!session?.accessToken || session.provider !== "supabase" || !session.user) {
    closeRealtimeSocket();
    return;
  }

  const userId = String(session.user.id || "");
  const userEmail = normalizeEmail(session.user.email || "");
  const userKey = `${userId}:${userEmail}`;

  if (
    realtimeSocket &&
    realtimeSocket.readyState === WebSocket.OPEN &&
    realtimeBoundUserKey === userKey
  ) {
    return;
  }

  closeRealtimeSocket();
  const wsUrl = buildRealtimeWebSocketUrl();
  if (!wsUrl) return;

  const socket = new WebSocket(wsUrl);
  realtimeSocket = socket;
  realtimeBoundUserKey = userKey;

  socket.addEventListener("open", () => {
    if (!realtimeSocket || realtimeSocket !== socket) return;

    const postgresChanges = [];
    if (userId) {
      postgresChanges.push({
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      });
    }
    if (userEmail) {
      postgresChanges.push({
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `email=eq.${userEmail}`,
      });
    }
    if (!postgresChanges.length) return;

    socket.send(
      JSON.stringify({
        topic: "realtime:public:profiles",
        event: "phx_join",
        payload: {
          config: {
            broadcast: { ack: false, self: false },
            presence: { key: "" },
            postgres_changes: postgresChanges,
            private: true,
          },
          access_token: session.accessToken,
        },
        ref: nextRealtimeRef(),
      }),
    );

    realtimeHeartbeatHandle = setInterval(() => {
      if (!realtimeSocket || realtimeSocket.readyState !== WebSocket.OPEN) return;
      realtimeSocket.send(
        JSON.stringify({
          topic: "phoenix",
          event: "heartbeat",
          payload: {},
          ref: nextRealtimeRef(),
        }),
      );
    }, REALTIME_HEARTBEAT_MS);
  });

  socket.addEventListener("message", (event) => {
    let parsed = null;
    try {
      parsed = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    if (!parsed) return;

    if (parsed.event === "postgres_changes") {
      syncCloudPlanNow();
      return;
    }

    if (parsed.event === "phx_reply" && parsed.payload?.status === "ok") {
      syncCloudPlanNow();
    }
  });

  socket.addEventListener("close", () => {
    if (realtimeSocket === socket) {
      if (realtimeHeartbeatHandle) {
        clearInterval(realtimeHeartbeatHandle);
        realtimeHeartbeatHandle = null;
      }
      realtimeSocket = null;
      scheduleRealtimeReconnect();
    }
  });

  socket.addEventListener("error", () => {
    if (realtimeSocket === socket) {
      scheduleRealtimeReconnect();
    }
  });
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

  const session = readSession();
  if (session?.provider === "supabase" && session.accessToken && !sessionIsExpired(session)) {
    subscribeToCloudPlanRealtime(session);
  }
}

async function ensureCloudProfileInSession(session) {
  if (!session?.provider || session.provider !== "supabase") return session;
  if (!session?.accessToken || !session?.user?.id || !session?.user?.email) {
    return session;
  }

  const email = normalizeEmail(session.user.email);
  const isAdmin = getConfiguredAdminEmails().includes(email);
  const payload = {
    id: session.user.id,
    email,
    plan: session.user.plan === "premium" ? "premium" : "free",
    role: isAdmin ? "admin" : "user",
    status: "active",
    last_seen_at: new Date().toISOString(),
  };

  try {
    await supabaseRestRequest("profiles?on_conflict=id", {
      method: "POST",
      accessToken: session.accessToken,
      body: [payload],
    });
  } catch (error) {
    // If profiles table/policies are not configured yet, continue without blocking auth.
  }

  return session;
}

async function refreshCloudUserInSession(session) {
  if (!session?.accessToken) return null;
  const payload = await supabaseRequest("user", {
    method: "GET",
    accessToken: session.accessToken,
  });
  const user = sanitizeCloudUser(payload);
  if (!user) return null;
  const sessionWithUser = { ...session, user };
  await ensureCloudProfileInSession(sessionWithUser);
  const updated = await syncCloudPlanInSession(sessionWithUser);
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
  if (normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const payload = await supabaseRequest("signup", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      data: {
        full_name: trimmedName,
        plan: "free",
      },
    },
  });

  const saved = writeCloudSessionFromPayload(payload);
  if (!saved) {
    throw new Error("Account created. Check your email to confirm before login.");
  }
  await ensureCloudProfileInSession(saved);
  const synced = await syncCloudPlanInSession(saved);
  return synced.user;
}

async function loginUserCloud({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Email and password are required.");
  }

  const payload = await supabaseRequest("token?grant_type=password", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
    },
  });

  const saved = writeCloudSessionFromPayload(payload);
  if (!saved) {
    throw new Error("Login failed.");
  }
  await ensureCloudProfileInSession(saved);
  const synced = await syncCloudPlanInSession(saved);
  return synced.user;
}

async function logoutCloud() {
  const session = readSession();
  if (session?.provider === "supabase" && session.accessToken) {
    try {
      await supabaseRequest("logout", {
        method: "POST",
        accessToken: session.accessToken,
      });
    } catch (error) {
      // Ignore remote logout errors and clear local session anyway.
    }
  }
  closeRealtimeSocket();
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

  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: await hashPassword(normalizedPassword),
    plan: "free",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  writeSession({ provider: "local", userId: user.id, createdAt: new Date().toISOString() });
  return sanitizeUserLocal(user);
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

  const hash = await hashPassword(normalizedPassword);
  if (hash !== user.passwordHash) {
    throw new Error("Invalid email or password.");
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
    // Fire and forget to keep existing sync function signatures.
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

  await supabaseRequest("recover", {
    method: "POST",
    body: {
      email: normalizedEmail,
      ...(redirectTo ? { redirect_to: redirectTo } : {}),
    },
  });
}

export function getCurrentUser() {
  const session = readSession();
  if (!session) return null;

  if (session.provider === "supabase") {
    startCloudPlanAutoSync();
    if (sessionIsExpired(session)) {
      closeRealtimeSocket();
      clearSession();
      return null;
    }
    if (session.accessToken && session.user) {
      subscribeToCloudPlanRealtime(session);
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
  if (isCurrentUserAdmin()) return `${user.name} (Admin)`;
  return user.plan === "premium" ? `${user.name} (Premium)` : `${user.name} (Free)`;
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
  const normalizedPlan = String(plan || "").toLowerCase();
  if (normalizedPlan !== "free" && normalizedPlan !== "premium") {
    throw new Error("Plan must be free or premium.");
  }
  const overrides = readPlanOverrides();
  overrides[normalizedEmail] = normalizedPlan;
  writePlanOverrides(overrides);
}

export async function setPlanOverride(email, plan) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPlan = String(plan || "").toLowerCase();

  setLocalPlanOverride(normalizedEmail, normalizedPlan);

  // If cloud auth is unavailable, local override is the source of truth.
  if (!isCloudAuthEnabled()) {
    const result = { scope: "local", cloudUpdated: false, warning: "" };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  }

  const session = readSession();
  if (
    !session?.accessToken ||
    session?.provider !== "supabase" ||
    !isCurrentUserAdmin()
  ) {
    const result = {
      scope: "local",
      cloudUpdated: false,
      warning:
        "Saved locally only. Cloud sync requires an authenticated admin cloud session.",
    };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  }

  try {
    const rows = await supabaseRestRequest(
      `profiles?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,email,plan&limit=1`,
      {
        method: "GET",
        accessToken: session.accessToken,
      },
    );

    if (!Array.isArray(rows) || !rows.length || !rows[0]?.id) {
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

    await supabaseRestRequest(`profiles?id=eq.${encodeURIComponent(rows[0].id)}`, {
      method: "PATCH",
      accessToken: session.accessToken,
      body: {
        plan: normalizedPlan,
        last_seen_at: new Date().toISOString(),
      },
    });

    const result = { scope: "cloud+local", cloudUpdated: true, warning: "" };
    const meta = readPlanOverrideMeta();
    meta[normalizedEmail] = { ...result, updatedAt: new Date().toISOString() };
    writePlanOverrideMeta(meta);
    return result;
  } catch (error) {
    const result = {
      scope: "local",
      cloudUpdated: false,
      warning:
        error?.message ||
        "Saved locally, but cloud sync failed. Check profiles table policy/columns.",
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
    const overridePlan = overrides[email];
    map.set(email, {
      id: user.id || email,
      email,
      plan: overridePlan || user.plan || "free",
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
      plan: overrides[currentEmail] || currentPlan,
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

function normalizeDirectoryRow(row) {
  const email = normalizeEmail(row?.email || "");
  const role = String(row?.role || "user").toLowerCase();
  const status = String(row?.status || "active").toLowerCase();
  const plan = String(row?.plan || "free").toLowerCase();
  return {
    id: row?.id || email || `user_${Math.random().toString(36).slice(2, 8)}`,
    email: email || "unknown@email",
    role: role === "admin" ? "admin" : "user",
    status: status === "suspended" ? "suspended" : "active",
    plan: plan === "premium" ? "premium" : "free",
    createdAt: row?.created_at || row?.createdAt || "",
    lastSeenAt: row?.last_seen_at || row?.lastSeenAt || "",
    source: "cloud",
  };
}

export async function getAdminUserDirectory() {
  if (!isCurrentUserAdmin()) {
    throw new Error("Admin access is required.");
  }

  const session = readSession();
  if (isCloudAuthEnabled() && session?.provider === "supabase" && session.accessToken) {
    try {
      const rows = await supabaseRestRequest(
        "profiles?select=id,email,plan,role,status,created_at,last_seen_at&order=created_at.desc.nullslast",
        {
          method: "GET",
          accessToken: session.accessToken,
        },
      );
      if (!Array.isArray(rows)) {
        throw new Error("Unexpected profiles response format.");
      }
      return {
        users: rows.map(normalizeDirectoryRow),
        source: "cloud",
        warning: "",
      };
    } catch (error) {
      return {
        users: buildLocalUserDirectory(),
        source: "local",
        warning:
          "Cloud user directory unavailable. Configure profiles table with email/role/status columns and admin read policy.",
      };
    }
  }

  return {
    users: buildLocalUserDirectory(),
    source: "local",
    warning: "",
  };
}
