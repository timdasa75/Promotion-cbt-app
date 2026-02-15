// auth.js - local auth/session + entitlement helpers (Phase 1 prototype)

const USERS_STORAGE_KEY = "cbt_users_v1";
const SESSION_STORAGE_KEY = "cbt_session_v1";

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

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.userId) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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

  // Fallback for unsupported environments.
  return btoa(unescape(encodeURIComponent(value)));
}

export async function registerUser({ name, email, password }) {
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
  writeSession({ userId: user.id, createdAt: new Date().toISOString() });
  return sanitizeUser(user);
}

export async function loginUser({ email, password }) {
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

  writeSession({ userId: user.id, createdAt: new Date().toISOString() });
  return sanitizeUser(user);
}

export function logoutUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || "free",
    createdAt: user.createdAt,
  };
}

export function getCurrentUser() {
  const session = readSession();
  if (!session) return null;
  const users = readUsers();
  const user = users.find((u) => u.id === session.userId);
  return sanitizeUser(user);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function getCurrentEntitlement() {
  const user = getCurrentUser();
  if (!user) return FREE_PLAN;
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
  return user.plan === "premium" ? `${user.name} (Premium)` : `${user.name} (Free)`;
}
