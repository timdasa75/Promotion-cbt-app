import {
  buildPublicAuthUser,
  checkRateLimit,
  getAuthUserById,
  hashPassword,
  issueSession,
  parseBearerToken,
  RATE_LIMIT,
  readSessionRecord,
  resolveHybridAuthRouteHandler,
  sha256Base64Url,
  timingSafeEqual,
  touchSession,
} from "./auth-hybrid.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./email-sender.js";
import { readSelarApiConfig, verifySelarOrderByReference } from "./selarVerify.js";
import {
  upsertUserProfile,
  getUserProfile,
  getUserProfileByEmail,
  upsertPaymentReceipt,
  listPaymentReceipts,
  dualWriteUserProfile,
  dualWritePaymentReceipt,
  migrateProfilesToD1,
  migratePaymentsToD1,
  getMigrationStatus,
} from "./firestore-d1-sync.js";
import { collectSubcategories, getQuestionsFromSubcategory } from "../../js/topicDataShape.js";
import {
  normalizeProgressSummary,
  normalizeRetryQueue,
  normalizeSpacedQueue,
  parseCloudProgressDocument,
  serializeProgressSummary,
  serializeRetryQueue,
  serializeSpacedQueue,
} from "../../js/authFirestoreModels.js";
const EMAIL_VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const IDENTITY_TOOLKIT_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const PAYMENT_PLAN_PRICES = Object.freeze({
  monthly: 2500,
  quarterly: 5500,
  "bi-annual": 7500,
  annual: 12000,
});
const PAYMENT_PLAN_DAYS = Object.freeze({
  monthly: 30,
  quarterly: 90,
  "bi-annual": 180,
  annual: 365,
});
let adminTokenCache = {
  token: "",
  expiresAtMs: 0,
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFeedbackCategory(value) {
  const category = String(value || "").trim().toLowerCase();
  return ["bug", "suggestion", "question_issue", "other"].includes(category) ? category : "other";
}

function normalizeFeedbackSource(value) {
  const source = String(value || "").trim().toLowerCase();
  return ["help", "quiz", "results"].includes(source) ? source : "help";
}

function normalizeFeedbackStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return ["new", "in_review", "resolved", "dismissed"].includes(status) ? status : "new";
}

function parseCsvSet(value, defaults = []) {
  const entries = [
    ...defaults,
    ...String(value || "")
      .split(",")
      .map((entry) => String(entry || "").trim())
      .filter(Boolean),
  ];
  return new Set(entries);
}

function parseAdminEmails(value) {
  const emails = Array.from(parseCsvSet(value, []))
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
  return new Set(emails);
}

function resolveAllowedOrigin(request, env) {
  const configured = Array.from(parseCsvSet(env.ALLOWED_ORIGINS || "", []));
  const origin = String(request.headers.get("origin") || "").trim();
  // Browser access is deny-by-default. A wildcard origin permits any site to
  // invoke authenticated browser APIs, so it is deliberately unsupported.
  if (!origin || !configured.length || configured.includes("*")) return "";
  return configured.includes(origin) ? origin : "";
}

function withCorsHeaders(response, origin) {
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, verif-hash");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function withSecurityHeaders(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.flutterwave.com; " +
    "frame-src https://challenges.cloudflare.com https://checkout.flutterwave.com; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  return response;
}



function jsonResponse(body, status = 200, origin = "") {
  return withSecurityHeaders(
    withCorsHeaders(
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      origin,
    )
  );
}

function normalizePlanValue(value) {
  return String(value || "").trim().toLowerCase() === "premium" ? "premium" : "free";
}

function parseBoolean(value, fallback = false) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function requireEnv(env, key) {
  const value = String(env[key] || "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function publicErrorMessage(error) {
  const status = Number(error?.httpStatus || 0);
  if (status > 0 && status < 500) {
    return String(error?.message || "Request failed.");
  }
  return "Request failed. Please try again later.";
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const chunkSize = 0x8000;
  for (let index = 0; index < view.length; index += chunkSize) {
    binary += String.fromCharCode(...view.subarray(index, Math.min(index + chunkSize, view.length)));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// Standard base64 (with padding) — used for Flutterwave's v4 webhook signature,
// which is base64(HMAC-SHA256(rawBody, secretHash)).
function bytesToBase64(bytes) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const chunkSize = 0x8000;
  for (let index = 0; index < view.length; index += chunkSize) {
    binary += String.fromCharCode(...view.subarray(index, Math.min(index + chunkSize, view.length)));
  }
  return btoa(binary);
}

function base64UrlEncodeString(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(String(value || "")));
}

function pemToArrayBuffer(pem) {
  const normalized = String(pem || "")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function buildServiceAccountAssertion(env) {
  const serviceAccountEmail = requireEnv(env, "GCP_SERVICE_ACCOUNT_EMAIL");
  const privateKeyPem = requireEnv(env, "GCP_SERVICE_ACCOUNT_PRIVATE_KEY");
  const scopes = String(env.GCP_OAUTH_SCOPES || "").trim() ||
    "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore";

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: serviceAccountEmail,
    sub: serviceAccountEmail,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    scope: scopes,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncodeString(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncodeBytes(signature)}`;
}

async function getServiceAccountAccessToken(env) {
  if (adminTokenCache.token && adminTokenCache.expiresAtMs - Date.now() > 60 * 1000) {
    return adminTokenCache.token;
  }

  const assertion = await buildServiceAccountAssertion(env);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || "Unable to mint admin access token.");
  }

  adminTokenCache = {
    token: String(payload.access_token),
    expiresAtMs: Date.now() + Number(payload.expires_in || 3600) * 1000,
  };

  return adminTokenCache.token;
}

function projectIdentityUrl(env, path, query = null) {
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");
  const base = `${IDENTITY_TOOLKIT_BASE_URL}/projects/${encodeURIComponent(projectId)}/${path}`;
  if (!query) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

function globalIdentityUrl(path, query = null) {
  const base = `${IDENTITY_TOOLKIT_BASE_URL}/${path}`;
  if (!query) return base;
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

async function identityAdminRequest(env, path, { method = "POST", body = null, query = null, projectScoped = true } = {}) {
  const accessToken = await getServiceAccountAccessToken(env);
  const quotaProject = String(env.FIREBASE_QUOTA_PROJECT_ID || "").trim();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (quotaProject) {
    headers["x-goog-user-project"] = quotaProject;
  }

  const url = projectScoped ? projectIdentityUrl(env, path, query) : globalIdentityUrl(path, query);
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error || payload?.message || "Identity Toolkit request failed.";
    const error = new Error(message);
    error.httpStatus = response.status;
    throw error;
  }

  return payload;
}

function firestoreDocumentUrl(env, docPath) {
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");
  return `${FIRESTORE_BASE_URL}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${docPath}`;
}

async function firestoreRequest(env, url, { method = "GET", body = null } = {}) {
  const accessToken = await getServiceAccountAccessToken(env);
  const quotaProject = String(env.FIREBASE_QUOTA_PROJECT_ID || "").trim();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (quotaProject) {
    headers["x-goog-user-project"] = quotaProject;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error || payload?.message || "Firestore request failed.";
    const error = new Error(message);
    error.httpStatus = response.status;
    throw error;
  }

  return payload;
}

function readFirestoreString(fields, key, fallback = "") {
  const value = fields?.[key];
  if (typeof value?.stringValue === "string") return value.stringValue;
  if (typeof value?.timestampValue === "string") return value.timestampValue;
  return fallback;
}

function parseProfileDocument(document) {
  const fields = document?.fields || {};
  return {
    role: readFirestoreString(fields, "role", ""),
    plan: readFirestoreString(fields, "plan", ""),
    status: readFirestoreString(fields, "status", ""),
    billingCycle: readFirestoreString(fields, "billingCycle", readFirestoreString(fields, "subscriptionType", "")),
    planExpiresAt: readFirestoreString(fields, "planExpiresAt", readFirestoreString(fields, "subscriptionExpiresAt", "")),
  };
}

async function readProfileDocumentById(env, userId) {
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  try {
    const payload = await firestoreRequest(env, docUrl, { method: "GET" });
    return parseProfileDocument(payload);
  } catch (error) {
    if (Number(error?.httpStatus) === 404) {
      return null;
    }
    throw error;
  }
}

function fromFirebaseMillisToIso(value, fallback = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Date(numeric).toISOString();
}

function parseCloudflareSessionToken(token) {
  const normalized = String(token || "").trim();
  const separatorIndex = normalized.indexOf(".");
  if (!normalized || separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    throw new Error("Invalid Cloudflare session token.");
  }
  return {
    sessionId: normalized.slice(0, separatorIndex),
    sessionSecret: normalized.slice(separatorIndex + 1),
  };
}

async function verifyCloudflareAdminCaller(sessionToken, env, allowedAdmins) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw new Error("Cloudflare auth database is not configured.");
  }

  const { sessionId, sessionSecret } = parseCloudflareSessionToken(sessionToken);
  const session = await database
    .prepare(`
      SELECT s.session_id, s.user_id, s.session_secret_hash, s.expires_at,
             u.id, u.email, u.role, u.status
      FROM auth_sessions s
      INNER JOIN auth_users u ON u.id = s.user_id
      WHERE s.session_id = ?1
      LIMIT 1
    `)
    .bind(sessionId)
    .first();

  if (!session) {
    throw new Error("Cloudflare session not found.");
  }

  const expectedHash = await sha256Base64Url(sessionSecret);
  if (!timingSafeEqual(expectedHash, String(session.session_secret_hash || ""))) {
    throw new Error("Cloudflare session is invalid.");
  }

  if (Date.parse(String(session.expires_at || "")) <= Date.now()) {
    throw new Error("Cloudflare session expired.");
  }

  const email = normalizeEmail(session.email || "");
  if (!email) {
    throw new Error("Authenticated Cloudflare user has no email.");
  }
  if (!allowedAdmins.has(email)) {
    throw new Error("Admin access denied.");
  }
  if (String(session.status || "active").toLowerCase() !== "active") {
    throw new Error("Admin account is not active.");
  }

  await database
    .prepare("UPDATE auth_sessions SET last_seen_at = ?2 WHERE session_id = ?1")
    .bind(sessionId, new Date().toISOString())
    .run();

  return {
    email,
    id: String(session.id || session.user_id || ""),
    provider: "cloudflare",
  };
}

async function listCloudflareAuthUsers(env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    return [];
  }

  const result = await database
    .prepare(`
      SELECT id, email, role, plan, plan_source, status, email_verified, created_at, last_login_at
      FROM auth_users
      ORDER BY created_at DESC
    `)
    .all();

  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows.map((entry) => ({
    id: String(entry?.id || ""),
    email: normalizeEmail(entry?.email || ""),
    name: "",
    role: String(entry?.role || "user"),
    plan: String(entry?.plan || "free"),
    planSource: String(entry?.plan_source || "free"),
    status: String(entry?.status || "active"),
    emailVerified: Boolean(Number(entry?.email_verified || 0)),
    disabled: String(entry?.status || "active").toLowerCase() !== "active",
    createdAt: String(entry?.created_at || ""),
    lastSignInAt: String(entry?.last_login_at || ""),
    source: "cloudflare-auth",
  }));
}

function requireAuditDatabase(env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw createRouteError(503, "Cloudflare auth database is not configured.");
  }
  return database;
}

function safeParseJson(value, fallback = {}) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function insertAuditLogRecord(database, {
  actorUserId = "",
  actorEmail = "",
  targetUserId = "",
  action = "operation",
  status = "success",
  details = {},
} = {}) {
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  await database
    .prepare(`
      INSERT INTO auth_audit_log (
        id,
        actor_user_id,
        actor_email,
        target_user_id,
        action,
        status,
        details_json,
        created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `)
    .bind(
      id,
      String(actorUserId || ""),
      normalizeEmail(actorEmail || ""),
      String(targetUserId || ""),
      String(action || "operation"),
      String(status || "success").trim().toLowerCase() || "success",
      JSON.stringify(details || {}),
      createdAt,
    )
    .run();
  return { id, createdAt };
}

function mapAuditLogToAdminOperation(row) {
  const details = safeParseJson(row?.details_json || "{}", {});
  return {
    id: String(row?.id || "").trim(),
    action: String(row?.action || details?.action || "operation").trim() || "operation",
    target: String(details?.target || details?.targetEmail || row?.target_user_id || "-").trim() || "-",
    status: String(row?.status || details?.status || "success").trim().toLowerCase() || "success",
    message: String(details?.message || "").trim(),
    actor: String(row?.actor_email || details?.actor || "system").trim() || "system",
    createdAt: String(row?.created_at || "").trim(),
  };
}

function parseFeedbackRow(row = {}) {
  return {
    feedbackId: String(row?.feedback_id || ""),
    userId: String(row?.user_id || ""),
    email: normalizeEmail(row?.email || ""),
    category: normalizeFeedbackCategory(row?.category),
    status: normalizeFeedbackStatus(row?.status),
    sourceScreen: normalizeFeedbackSource(row?.source_screen),
    message: String(row?.message || ""),
    createdAt: String(row?.created_at || ""),
    updatedAt: String(row?.updated_at || ""),
    reviewedAt: String(row?.reviewed_at || ""),
    reviewedBy: normalizeEmail(row?.reviewed_by || ""),
    topicId: String(row?.topic_id || ""),
    topicName: String(row?.topic_name || ""),
    questionId: String(row?.question_id || ""),
    quizAttemptId: String(row?.quiz_attempt_id || ""),
    sessionMode: String(row?.session_mode || ""),
    questionPreview: String(row?.question_preview || ""),
    scoreSummary: String(row?.score_summary || ""),
    difficulty: String(row?.difficulty || ""),
    sourceDocument: String(row?.source_document || ""),
    sourceSection: String(row?.source_section || ""),
    subcategoryName: String(row?.subcategory_name || ""),
    clientInfo: safeParseJson(row?.client_info, {}),
  };
}

async function verifyAdminCaller(request, env) {
  const header = String(request.headers.get("authorization") || "");
  if (!header.startsWith("Bearer ")) {
    throw createRouteError(401, "Missing bearer token.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw createRouteError(401, "Missing bearer token.");
  }

  const allowedAdmins = parseAdminEmails(env.ADMIN_EMAILS || "");
  if (!allowedAdmins.size) {
    throw createRouteError(403, "Admin access not configured.");
  }

  try {
    const payload = await identityAdminRequest(env, "accounts:lookup", {
      body: { idToken: token },
    });

    const user = Array.isArray(payload?.users) ? payload.users[0] : null;
    const email = normalizeEmail(user?.email || "");
    if (!email) {
      throw new Error("Authenticated user has no email.");
    }
    if (!allowedAdmins.has(email)) {
      throw new Error("Admin access denied.");
    }

    return {
      email,
      id: String(user?.localId || ""),
      provider: "firebase",
    };
  } catch (firebaseError) {
    try {
      return await verifyCloudflareAdminCaller(token, env, allowedAdmins);
    } catch (cloudflareError) {
      throw createRouteError(401, cloudflareError?.message || firebaseError?.message || "Admin access denied.");
    }
  }
}


const FREE_CONTENT_LIMITS = Object.freeze({
  id: "free",
  maxTopics: 3,
  maxSubcategories: 5,
  maxQuestionsPerSubcategory: 20,
});
const PREMIUM_CONTENT_LIMITS = Object.freeze({
  id: "premium",
  maxTopics: null,
  maxSubcategories: null,
  maxQuestionsPerSubcategory: null,
});
let protectedTopicCatalogPromise = null;

function createRouteError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

function resolveProtectedContentBinding(env) {
  const binding = env.PROTECTED_CONTENT;
  if (!binding || typeof binding.fetch !== "function") {
    throw createRouteError(503, "Protected content storage is not configured.");
  }
  return binding;
}

function normalizeProtectedAssetPath(assetPath) {
  const value = String(assetPath || "").trim().replace(/^\/+/, "").replace(/^data\//, "");
  if (!value || value.includes("..")) {
    throw createRouteError(400, "Invalid content asset path.");
  }
  return value;
}

async function fetchProtectedAssetJson(env, assetPath) {
  const binding = resolveProtectedContentBinding(env);
  const cleanPath = normalizeProtectedAssetPath(assetPath);
  const response = await binding.fetch(new Request(`https://protected-content.local/${cleanPath}`));
  if (!response.ok) {
    throw createRouteError(response.status || 404, `Protected content asset is unavailable: ${cleanPath}`);
  }
  return response.json();
}

async function loadProtectedTopicCatalog(env) {
  if (!protectedTopicCatalogPromise) {
    protectedTopicCatalogPromise = (async () => {
      const payload = await fetchProtectedAssetJson(env, "topics.json");
      return Array.isArray(payload?.topics) ? payload.topics : [];
    })().catch((error) => {
      protectedTopicCatalogPromise = null;
      throw error;
    });
  }
  return protectedTopicCatalogPromise;
}

function resolveContentEntitlement(user) {
  const role = String(user?.role || "user").trim().toLowerCase();
  const plan = String(user?.plan || "free").trim().toLowerCase();
  if (role === "admin" || plan === "premium") {
    return PREMIUM_CONTENT_LIMITS;
  }
  return FREE_CONTENT_LIMITS;
}

function getAccessibleProtectedTopics(topics, entitlement) {
  const source = Array.isArray(topics) ? topics.filter((topic) => topic?.id && topic?.file) : [];
  if (!entitlement?.maxTopics) {
    return source;
  }
  return source.slice(0, entitlement.maxTopics);
}

function normalizeProtectedSubcategory(subcategory, entitlement) {
  const questions = getQuestionsFromSubcategory(subcategory);
  const limitedQuestions = typeof entitlement?.maxQuestionsPerSubcategory === "number"
    ? questions.slice(0, entitlement.maxQuestionsPerSubcategory)
    : questions;

  return {
    ...subcategory,
    questions: limitedQuestions,
  };
}

function filterTopicDataForEntitlement(topicData, entitlement) {
  const sourceSubcategories = collectSubcategories(topicData);
  const visibleSubcategories = typeof entitlement?.maxSubcategories === "number"
    ? sourceSubcategories.slice(0, entitlement.maxSubcategories)
    : sourceSubcategories;

  return {
    subcategories: visibleSubcategories.map((subcategory) =>
      normalizeProtectedSubcategory(subcategory, entitlement)
    ),
  };
}

function getProtectedTopicFiles(topic) {
  return [topic?.file].filter(Boolean);
}

async function resolveFirebaseContentUser(sessionToken, env) {
  const allowedAdmins = parseAdminEmails(env.ADMIN_EMAILS || "");
  const payload = await identityAdminRequest(env, "accounts:lookup", {
    body: { idToken: sessionToken },
  });
  const firebaseUser = Array.isArray(payload?.users) ? payload.users[0] : null;
  const email = normalizeEmail(firebaseUser?.email || "");
  const localId = String(firebaseUser?.localId || "");
  if (!email || !localId) {
    throw createRouteError(401, "Authenticated user could not be resolved.");
  }

  const profile = await readProfileDocumentById(env, localId).catch(() => null);
  return {
    id: localId,
    email,
    provider: "firebase",
    role: String(profile?.role || (allowedAdmins.has(email) ? "admin" : "user")).trim().toLowerCase() === "admin" ? "admin" : "user",
    plan: String(profile?.plan || "free").trim().toLowerCase() === "premium" ? "premium" : "free",
    status: String(profile?.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active",
    emailVerified: Boolean(firebaseUser?.emailVerified),
    createdAt: fromFirebaseMillisToIso(firebaseUser?.createdAt, ""),
    lastLoginAt: fromFirebaseMillisToIso(firebaseUser?.lastLoginAt, ""),
    legacyProvider: "firebase",
  };
}

async function resolveCloudflareContentUser(sessionToken, env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw createRouteError(503, "Cloudflare auth database is not configured.");
  }

  const session = await readSessionRecord(database, sessionToken);
  const authUser = await getAuthUserById(database, String(session?.user_id || ""));
  if (!authUser?.id) {
    throw createRouteError(401, "Cloudflare account could not be resolved.");
  }

  await touchSession(database, String(session.session_id || ""));
  return {
    ...buildPublicAuthUser(authUser),
    provider: "cloudflare",
  };
}

async function resolveAuthenticatedContentUser(request, env) {
  const token = parseBearerToken(request);
  const tokenParts = token.split(".").filter(Boolean);

  if (tokenParts.length === 2) {
    return resolveCloudflareContentUser(token, env);
  }

  if (tokenParts.length >= 3) {
    try {
      return await resolveFirebaseContentUser(token, env);
    } catch (firebaseError) {
      try {
        return await resolveCloudflareContentUser(token, env);
      } catch (cloudflareError) {
        throw createRouteError(
          Number(cloudflareError?.httpStatus || firebaseError?.httpStatus || 401),
          cloudflareError?.message || firebaseError?.message || "Authentication is required.",
        );
      }
    }
  }

  try {
    return await resolveCloudflareContentUser(token, env);
  } catch (cloudflareError) {
    throw createRouteError(
      Number(cloudflareError?.httpStatus || 401),
      cloudflareError?.message || "Authentication is required.",
    );
  }
}

async function resolveCloudflareProgressUser(request, env) {
  const token = parseBearerToken(request);
  const user = await resolveCloudflareContentUser(token, env);
  if (String(user?.status || "active").toLowerCase() !== "active") {
    throw createRouteError(403, "Your account is not active.");
  }
  return user;
}

async function readProgressDocumentById(env, userId) {
  const docUrl = firestoreDocumentUrl(env, `progress/${encodeURIComponent(userId)}`);
  try {
    const payload = await firestoreRequest(env, docUrl, { method: "GET" });
    return parseCloudProgressDocument(payload);
  } catch (error) {
    if (Number(error?.httpStatus) === 404) {
      return null;
    }
    throw error;
  }
}

async function handleCloudflareProgress(request, env) {
  const user = await resolveCloudflareProgressUser(request, env);
  const method = String(request.method || "").toUpperCase();

  if (method === "GET") {
    const parsed = await readProgressDocumentById(env, user.id);
    return {
      ok: true,
      progress: parsed
        ? {
            schemaVersion: Number(parsed.schemaVersion || 1),
            updatedAt: String(parsed.updatedAt || ""),
            deviceId: String(parsed.deviceId || ""),
            summary: normalizeProgressSummary(parsed.summary),
            retryQueue: normalizeRetryQueue(parsed.retryQueue),
            spacedQueue: normalizeSpacedQueue(parsed.spacedQueue),
          }
        : null,
    };
  }

  if (method !== "PATCH") {
    throw createRouteError(405, "Method not allowed.");
  }

  const body = await readJsonBody(request);
  const progress = body?.progress || {};
  const { normalized: summary, serialized: progressSummaryJson } = serializeProgressSummary(progress.summary);
  const { normalized: retryQueue, serialized: retryQueueJson } = serializeRetryQueue(progress.retryQueue);
  const { normalized: spacedQueue, serialized: spacedQueueJson } = serializeSpacedQueue(progress.spacedQueue);
  const nowIso = new Date().toISOString();
  const params = new URLSearchParams();
  ["schemaVersion", "updatedAt", "deviceId", "progressSummaryJson", "retryQueueJson", "spacedQueueJson"].forEach(
    (field) => params.append("updateMask.fieldPaths", field),
  );

  const docUrl = firestoreDocumentUrl(env, `progress/${encodeURIComponent(user.id)}`);
  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: {
      fields: {
        schemaVersion: { integerValue: "1" },
        updatedAt: { timestampValue: nowIso },
        deviceId: { stringValue: String(progress.deviceId || "").trim() },
        progressSummaryJson: { stringValue: progressSummaryJson },
        retryQueueJson: { stringValue: retryQueueJson },
        spacedQueueJson: { stringValue: spacedQueueJson },
      },
    },
  });

  return {
    ok: true,
    saved: true,
    progress: {
      schemaVersion: 1,
      updatedAt: nowIso,
      deviceId: String(progress.deviceId || "").trim(),
      summary,
      retryQueue,
      spacedQueue,
    },
  };
}

async function handleProtectedTopicData(request, env) {
  const viewer = await resolveAuthenticatedContentUser(request, env);
  if (String(viewer?.status || "active").toLowerCase() !== "active") {
    throw createRouteError(403, "Your account is not active.");
  }

  const body = await readJsonBody(request);
  const topicId = String(body?.topicId || "").trim();
  if (!topicId) {
    throw createRouteError(400, "topicId is required.");
  }

  const catalog = await loadProtectedTopicCatalog(env);
  const topic = catalog.find((entry) => String(entry?.id || "").trim() === topicId);
  if (!topic?.file) {
    throw createRouteError(404, "Topic content was not found.");
  }

  const entitlement = resolveContentEntitlement(viewer);
  const accessibleTopicIds = new Set(
    getAccessibleProtectedTopics(catalog, entitlement).map((entry) => String(entry?.id || "").trim()),
  );
  if (!accessibleTopicIds.has(topicId)) {
    throw createRouteError(403, "This topic is locked on your current plan.");
  }

  const payloads = [];
  const loadedFiles = [];
  const failedFiles = [];
  const files = getProtectedTopicFiles(topic);

  for (const file of files) {
    try {
      const rawData = await fetchProtectedAssetJson(env, file);
      payloads.push(filterTopicDataForEntitlement(rawData, entitlement));
      loadedFiles.push(file);
    } catch (error) {
      failedFiles.push(file);
      if (!body?.tolerateFailures) {
        throw error;
      }
    }
  }

  if (!payloads.length) {
    throw createRouteError(404, "No topic content could be loaded.");
  }

  return {
    ok: true,
    topicId,
    entitlement: entitlement.id,
    payloads,
    loadedFiles,
    failedFiles,
    totalFiles: files.length,
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

async function handleAdminCreateCloudflareMigrationLink(request, env) {
  await verifyAdminCaller(request, env);
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw createRouteError(503, "Cloudflare auth database is not configured.");
  }

  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  const role = String(body?.role || "user").trim().toLowerCase() === "admin" ? "admin" : "user";
  const plan = String(body?.plan || "free").trim().toLowerCase() === "premium" ? "premium" : "free";
  const status = String(body?.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active";
  const emailVerified = Boolean(body?.emailVerified);
  const continueUrl = String(body?.continueUrl || "").trim();
  if (!email || !email.includes("@")) {
    throw createRouteError(400, "email is required.");
  }

  const nowIso = new Date().toISOString();
  let user;
  try {
    user = await database
      .prepare(`
        SELECT id, email, password_hash, role, plan, status, email_verified
        FROM auth_users
        WHERE email = ?1
        LIMIT 1
      `)
      .bind(email)
      .first();
  } catch (dbError) {
    throw createRouteError(500, `Database query failed: ${dbError?.message || 'unknown error'}`);
  }

  try {
    if (user?.id) {
      await database
        .prepare(`
          UPDATE auth_users
          SET role = ?2,
              plan = ?3,
              status = ?4,
              email_verified = ?5,
              legacy_provider = 'firebase',
              updated_at = ?6
          WHERE id = ?1
        `)
        .bind(
          String(user.id),
          role,
          plan,
          status,
          emailVerified ? 1 : 0,
          nowIso,
        )
        .run();
    } else {
      const placeholderHash = await hashPassword(crypto.randomUUID() + generateRandomBase64Url(SESSION_SECRET_BYTES));
      const userId = crypto.randomUUID();
      await database
        .prepare(`
          INSERT INTO auth_users (
            id,
            email,
            password_hash,
            role,
            plan,
            status,
            email_verified,
            legacy_provider,
            legacy_user_id,
            created_at,
            updated_at,
            last_login_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'firebase', '', ?8, ?8, '')
        `)
        .bind(
          userId,
          email,
          placeholderHash,
          role,
          plan,
          status,
          emailVerified ? 1 : 0,
          nowIso,
        )
        .run();
        user = { id: userId, email };
    }
  } catch (dbError) {
    throw createRouteError(500, `Failed to update user record: ${dbError?.message || 'unknown error'}`);
  }

  try {
    const tokenId = crypto.randomUUID();
    const tokenSecret = generateRandomBase64Url(SESSION_SECRET_BYTES);
    const tokenSecretHash = await sha256Base64Url(tokenSecret);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await database
      .prepare("DELETE FROM auth_email_tokens WHERE user_id = ?1 AND token_type = 'password_reset' AND consumed_at = ''")
      .bind(String(user.id || ''))
      .run();
    await database
      .prepare(`
        INSERT INTO auth_email_tokens (
          token_id,
          user_id,
          token_type,
          token_secret_hash,
          created_at,
          expires_at,
          consumed_at
        ) VALUES (?1, ?2, 'password_reset', ?3, ?4, ?5, '')
      `)
      .bind(tokenId, String(user.id || ''), tokenSecretHash, nowIso, expiresAt)
      .run();

    const migrationToken = `${tokenId}.${tokenSecret}`;
    const baseUrl = continueUrl || String(request.headers.get('origin') || '').trim();
    if (!baseUrl) {
      throw createRouteError(400, 'continueUrl is required to build the migration link.');
    }
    const url = new URL(baseUrl);
    url.searchParams.set('migration', migrationToken);
    return {
      ok: true,
      email,
      url: url.toString(),
      expiresAt,
      warning: 'Share this one-time link with the user so they can set a new password.',
    };
  } catch (error) {
    if (error?.httpStatus) throw error;
    throw createRouteError(500, `Failed to create migration token: ${error?.message || 'unknown error'}`);
  }
}

async function handleAuthMigrationBootstrap(request, env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw createRouteError(503, "Cloud auth database is not configured.");
  }

  const body = await readJsonBody(request);
  const password = String(body?.password || "");
  const token = parseBearerToken(request);
  const allowedAdmins = parseAdminEmails(env.ADMIN_EMAILS || "");

  const firebaseLookup = await identityAdminRequest(env, "accounts:lookup", {
    body: { idToken: token },
  });
  const firebaseUser = Array.isArray(firebaseLookup?.users) ? firebaseLookup.users[0] : null;
  const email = normalizeEmail(firebaseUser?.email || "");
  const localId = String(firebaseUser?.localId || "");
  if (!email || !localId) {
    throw createRouteError(401, "Authenticated user could not be resolved.");
  }

  const profile = await readProfileDocumentById(env, localId).catch(() => null);
  const role = String(profile?.role || (allowedAdmins.has(email) ? "admin" : "user")).trim().toLowerCase() === "admin" ? "admin" : "user";
  const plan = String(profile?.plan || "free").trim().toLowerCase() === "premium" ? "premium" : "free";
  const status = String(profile?.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active";
  const emailVerified = Boolean(firebaseUser?.emailVerified);
  const passwordHash = await hashPassword(password);
  const nowIso = new Date().toISOString();

  const existing = await database
    .prepare(`
      SELECT id
      FROM auth_users
      WHERE email = ?1
      LIMIT 1
    `)
    .bind(email)
    .first();

  if (existing?.id) {
    await database
      .prepare(`
        UPDATE auth_users
        SET password_hash = ?2,
            role = ?3,
            plan = ?4,
            status = ?5,
            email_verified = ?6,
            legacy_provider = 'firebase',
            legacy_user_id = ?7,
            updated_at = ?8
        WHERE id = ?1
      `)
      .bind(String(existing.id), passwordHash, role, plan, status, emailVerified ? 1 : 0, localId, nowIso)
      .run();
  } else {
    await database
      .prepare(`
        INSERT INTO auth_users (
          id,
          email,
          password_hash,
          role,
          plan,
          status,
          email_verified,
          legacy_provider,
          legacy_user_id,
          created_at,
          updated_at,
          last_login_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'firebase', ?8, ?9, ?9, '')
      `)
      .bind(crypto.randomUUID(), email, passwordHash, role, plan, status, emailVerified ? 1 : 0, localId, nowIso)
      .run();
  }

  const authUser = await database
    .prepare(`
      SELECT id, email, role, plan, status, email_verified, legacy_provider, legacy_user_id, created_at, updated_at, last_login_at
      FROM auth_users
      WHERE email = ?1
      LIMIT 1
    `)
    .bind(email)
    .first();
  const session = await issueSession(database, String(authUser?.id || ""), request, env);

  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser(authUser),
    session,
    warning: "Password updated successfully. Your account is ready to use.",
  };
}

async function handleAdminListUsers(request, env) {
  await verifyAdminCaller(request, env);

  // Fetch Firebase users
  const firebaseUsers = [];
  let pageToken = "";
  let loop = 0;

  do {
    const payload = await identityAdminRequest(env, "accounts:batchGet", {
      method: "GET",
      query: {
        maxResults: "1000",
        ...(pageToken ? { nextPageToken: pageToken } : {}),
      },
    });

    const pageUsers = Array.isArray(payload?.users) ? payload.users : [];
    pageUsers.forEach((entry) => {
      firebaseUsers.push({
        id: String(entry?.localId || ""),
        email: normalizeEmail(entry?.email || ""),
        name: String(entry?.displayName || ""),
        emailVerified: Boolean(entry?.emailVerified),
        disabled: Boolean(entry?.disabled),
        createdAt: fromFirebaseMillisToIso(entry?.createdAt, ""),
        lastSignInAt: fromFirebaseMillisToIso(entry?.lastLoginAt, ""),
        source: "firebase-auth",
      });
    });

    pageToken = String(payload?.nextPageToken || "");
    loop += 1;
  } while (pageToken && loop < 50);

  // Fetch Cloudflare auth users
  const cloudflareUsers = await listCloudflareAuthUsers(env);

  // Merge: Cloudflare users take priority (they have more up-to-date data)
  const merged = new Map();
  firebaseUsers.forEach((entry) => {
    const email = normalizeEmail(entry?.email || "");
    if (!email) return;
    merged.set(email, entry);
  });

  cloudflareUsers.forEach((entry) => {
    const email = normalizeEmail(entry?.email || "");
    if (!email) return;
    merged.set(email, {
      ...(merged.get(email) || {}),
      ...entry,
    });
  });

  const users = Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(String(a?.createdAt || "")) || 0;
    const bTime = Date.parse(String(b?.createdAt || "")) || 0;
    return bTime - aTime;
  });

  return {
    ok: true,
    total: users.length,
    users,
  };
}

async function handleAdminLookupUsers(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const emails = Array.from(
    new Set(
      (Array.isArray(body?.emails) ? body.emails : [])
        .map((entry) => normalizeEmail(entry))
        .filter((entry) => entry && entry.includes("@")),
    ),
  );

  if (!emails.length) {
    return {
      ok: true,
      total: 0,
      users: [],
    };
  }

  const users = [];
  const chunkSize = 100;
  for (let index = 0; index < emails.length; index += chunkSize) {
    const batch = emails.slice(index, index + chunkSize);
    const payload = await identityAdminRequest(env, "accounts:lookup", {
      body: { email: batch },
    });
    const found = Array.isArray(payload?.users) ? payload.users : [];
    found.forEach((entry) => {
      users.push({
        id: String(entry?.localId || ""),
        email: normalizeEmail(entry?.email || ""),
        emailVerified: Boolean(entry?.emailVerified),
        disabled: Boolean(entry?.disabled),
      });
    });
  }

  return {
    ok: true,
    total: users.length,
    users,
  };
}

async function handleAdminSendVerificationEmail(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  if (!email || !email.includes("@")) {
    throw createRouteError(400, "email is required.");
  }

  const database = requireAuditDatabase(env);
  const user = await database.prepare(
    `SELECT id, email FROM auth_users WHERE email = ?1`
  ).bind(email).first();

  if (user?.id) {
    // Cloudflare auth user — issue verification token
    const { issueEmailToken } = await import("./auth-hybrid.js");
    const tokenResult = await issueEmailToken(database, user.id, "verify_email", env);
    // Always use APP_BASE_URL for verification links — never trust client-supplied URLs
    const baseUrl = String(env.APP_BASE_URL || "").trim()
      || String(env.ALLOWED_ORIGINS || "").split(",")[0]?.trim() || "";
    // Send only to the account holder. A second copy to an administrator
    // consumes another Resend free-tier message and unnecessarily exposes a
    // bearer verification token outside the recipient's mailbox.
    let emailSent = false;
    if (baseUrl && env.RESEND_API_KEY) {
      try {
        const { sendVerificationEmail: sendVerifEmail } = await import("./email-sender.js");
        const result = await sendVerifEmail(env, {
          email,
          name: "",
          token: tokenResult.token,
          baseUrl,
        });
        emailSent = result?.ok === true;
      } catch (e) {
        console.error("[admin] Failed to send verification email:", e);
      }
    }

    const verificationUrl = baseUrl && tokenResult.token
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}verifyEmail=${encodeURIComponent(tokenResult.token)}`
      : "";

    return {
      ok: true,
      delivered: emailSent,
      verificationUrl,
      message: emailSent
        ? "Verification email sent to the user."
        : "Email service is unavailable; link copied to clipboard for manual sharing.",
    };
  }

  // For users not found in D1, try Firebase Identity Toolkit (legacy users)
  try {
    await identityAdminRequest(env, "accounts:sendOobCode", {
      body: { requestType: "VERIFY_EMAIL", email },
    });
    return {
      ok: true,
      delivered: true,
      message: "Verification email requested from Firebase Auth.",
    };
  } catch (firebaseError) {
    // User does not exist in Firebase either — return a clear error
    // instead of silently creating a password-less D1 account
    throw createRouteError(404, `User ${email} not found in any authentication system. Register the user first.`);
  }
}

/**
 * User-facing verification resend endpoint.
 * No admin auth required — any user can request a verification email for their own account.
 * Never returns the raw verification link in the response.
 */
async function handleUserVerificationResend(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  if (!email || !email.includes("@")) {
    throw createRouteError(400, "email is required.");
  }

  // Rate limit: max 3 resends per email per hour
  const rateLimitKey = `verify_resend:${email}`;
  const rateCheck = await checkRateLimit(
    database,
    rateLimitKey,
    RATE_LIMIT.RECOVERY_IP.type,
    3,
    3600,
  );
  if (!rateCheck.allowed) {
    const retryAfter = rateCheck.retryAfter
      ? ` Try again in ${rateCheck.retryAfter} seconds.`
      : " Try again later.";
    throw createRouteError(429, `Too many verification requests.${retryAfter}`);
  }

  const user = await database.prepare(
    `SELECT id, email, email_verified FROM auth_users WHERE email = ?1`
  ).bind(email).first();

  // Always return success to prevent email enumeration
  if (!user?.id) {
    return { ok: true, message: "If this email is registered, a verification link has been sent." };
  }

  if (user.email_verified) {
    return { ok: true, message: "This email is already verified. You can sign in." };
  }

  // Issue a fresh verification token
  const { issueEmailToken } = await import("./auth-hybrid.js");
  const tokenResult = await issueEmailToken(database, user.id, "verify_email", env);

  // Build URL using APP_BASE_URL only — never trust client input
  const baseUrl = String(env.APP_BASE_URL || "").trim()
    || String(env.ALLOWED_ORIGINS || "").split(",")[0]?.trim() || "";
  const verificationUrl = baseUrl && tokenResult.token
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}verifyEmail=${encodeURIComponent(tokenResult.token)}`
    : "";

  // Send email — never return the link in the response
  let emailSent = false;
  if (baseUrl && env.RESEND_API_KEY) {
    try {
      const { sendVerificationEmail: sendVerifEmail } = await import("./email-sender.js");
      const result = await sendVerifEmail(env, {
        email,
        name: "",
        token: tokenResult.token,
        baseUrl,
      });
      emailSent = result?.ok === true;
    } catch (e) {
      console.error("[verification-resend] Failed to send email:", e);
    }
  }

  return {
    ok: true,
    message: emailSent
      ? "Verification email sent. Please check your inbox."
      : "If this email is registered, a verification link has been sent.",
  };
}

async function handleAuthPasswordRecoveryRequest(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  if (!email || !email.includes("@")) {
    throw createRouteError(400, "email is required.");
  }

  // Apply the RECOVERY_IP bucket so this endpoint cannot be used to spam the
  // audit log or probe registered addresses.
  const ip = String(request.headers.get("CF-Connecting-IP") || "").trim();
  const recoveryIpBucket = `recovery:ip:${ip}`;
  const recoveryCheck = await checkRateLimit(
    database,
    recoveryIpBucket,
    RATE_LIMIT.RECOVERY_IP.type,
    RATE_LIMIT.RECOVERY_IP.max,
    RATE_LIMIT.RECOVERY_IP.windowSec,
  );
  if (!recoveryCheck.allowed) {
    const retryAfter = recoveryCheck.retryAfter
      ? ` Try again in ${recoveryCheck.retryAfter} seconds.`
      : " Try again later.";
    const error = new Error(`Too many recovery requests from this IP.${retryAfter}`);
    error.httpStatus = 429;
    throw error;
  }

  const authUser = await database
    .prepare(`
      SELECT id, email, status
      FROM auth_users
      WHERE email = ?1
      LIMIT 1
    `)
    .bind(email)
    .first();

  if (authUser?.id && String(authUser?.status || "active").toLowerCase() !== "deleted") {
    await insertAuditLogRecord(database, {
      actorEmail: "self-service",
      targetUserId: String(authUser.id || ""),
      action: "Password recovery requested",
      status: "pending",
      details: {
        targetEmail: email,
        target: email,
        actor: "self-service",
        message: "User requested logged-out password recovery.",
        channel: "forgot-password",
      },
    });
  }

  // Send password reset email if configured
  const emailSenderConfigured = String(env.AUTH_PASSWORD_RECOVERY_SENDER || "").trim() === "true";
  const resendConfigured = Boolean(env.RESEND_API_KEY);
  
  let emailSendResult = null;
  if ((resendConfigured || emailSenderConfigured) && authUser?.id) {
    try {
      const tokenResult = await (await import("./auth-hybrid.js")).issueEmailToken(
        database,
        authUser.id,
        "password_reset",
        env
      );
      const baseUrl = String(body?.baseUrl || request.headers.get("origin") || "").trim();
      if (resendConfigured && baseUrl && tokenResult.token) {
        emailSendResult = await sendPasswordResetEmail(env, {
          email,
          name: "",
          token: tokenResult.token,
          baseUrl,
        });
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      emailSendResult = { ok: false, error: error.message };
    }
  }

  return {
    ok: true,
    accepted: true,
    warning: (resendConfigured || emailSenderConfigured)
      ? "If this email matches an account, recovery instructions will follow shortly."
      : "Password recovery by email is not enabled yet. Contact an administrator to reset your password.",
  };
}

async function handleAdminLogOperation(request, env) {
  const actor = await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const details = {
    target: String(body?.target || "").trim(),
    message: String(body?.message || "").trim(),
    actor: String(body?.actor || actor?.email || "system").trim(),
  };
  await insertAuditLogRecord(database, {
    actorUserId: String(actor?.id || ""),
    actorEmail: String(actor?.email || ""),
    targetUserId: String(body?.targetUserId || "").trim(),
    action: String(body?.action || "Admin action").trim() || "Admin action",
    status: String(body?.status || "success").trim().toLowerCase() || "success",
    details,
  });
  return { ok: true };
}

async function handleAdminListOperations(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const rawLimit = Number(body?.limit || 120);
  const limit = Math.max(1, Math.min(200, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 120));
  const result = await database
    .prepare(`
      SELECT id, actor_user_id, actor_email, target_user_id, action, status, details_json, created_at
      FROM auth_audit_log
      ORDER BY created_at DESC
      LIMIT ?1
    `)
    .bind(limit)
    .all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return {
    ok: true,
    operations: rows.map((row) => mapAuditLogToAdminOperation(row)),
  };
}

async function deleteProfileDocument(env, userId) {
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  let exists = false;
  try {
    await firestoreRequest(env, docUrl, { method: "GET" });
    exists = true;
  } catch (error) {
    if (Number(error?.httpStatus) === 404) {
      return false;
    }
    throw error;
  }

  await firestoreRequest(env, docUrl, { method: "DELETE" });
  return exists;
}

async function patchProfileStatus(env, userId, status) {
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  const params = new URLSearchParams();
  params.append("updateMask.fieldPaths", "status");
  params.append("updateMask.fieldPaths", "lastSeenAt");

  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: {
      fields: {
        status: { stringValue: status },
        lastSeenAt: { timestampValue: new Date().toISOString() },
      },
    },
  });
}

async function patchProfilePlan(env, userId, plan) {
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  const params = new URLSearchParams();
  params.append("updateMask.fieldPaths", "plan");
  params.append("updateMask.fieldPaths", "lastSeenAt");

  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: {
      fields: {
        plan: { stringValue: plan },
        lastSeenAt: { timestampValue: new Date().toISOString() },
      },
    },
  });
}

function normalizePaymentPlanCycle(value) {
  const cycle = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(PAYMENT_PLAN_PRICES, cycle) ? cycle : "";
}

function calculatePaymentExpiry(planCycle, nowMs = Date.now()) {
  const days = PAYMENT_PLAN_DAYS[planCycle];
  if (!days) throw new Error("Unsupported payment plan.");
  return new Date(nowMs + days * 24 * 60 * 60 * 1000).toISOString();
}

function readFlutterwaveCustomerEmail(data) {
  return normalizeEmail(data?.customer?.email || data?.customer_email || data?.email || "");
}

// App-built tx_refs look like: promocbt_<userId(32)>_<planCycle>_<ts>_<rand>
// where the userId segment is the first 32 chars of the user's UUID. The
// plan cycle always comes from the supported set, so the parse is strict.
function parseFlutterwaveTxRefParts(txRef) {
  const value = String(txRef || "").trim();
  const match = value.match(/^promocbt_([a-zA-Z0-9-]{4,32})_([a-z-]+)_\d+_[a-z0-9]+$/i);
  if (!match) return { userIdPrefix: "", planCycle: "" };
  return {
    userIdPrefix: match[1],
    planCycle: normalizePaymentPlanCycle(match[2]),
  };
}

async function findCloudflareUserByTxRefPrefix(env, userIdPrefix) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function" || !userIdPrefix) return null;
  return database
    .prepare("SELECT id, email FROM auth_users WHERE substr(id, 1, ?1) = ?2 LIMIT 1")
    .bind(String(userIdPrefix).length, String(userIdPrefix))
    .first();
}

function buildPaymentReceipt({
  flwData,
  userId,
  email,
  planCycle,
  expiresAt,
}) {
  const data = flwData?.data || flwData || {};
  const transactionId = String(data.id || data.transaction_id || "").trim();
  const txRef = String(data.tx_ref || data.txRef || "").trim();
  const amount = Number(data.amount || PAYMENT_PLAN_PRICES[planCycle] || 0);
  const createdAt = String(data.created_at || data.createdAt || new Date().toISOString());
  return {
    paymentId: `flw_${transactionId || txRef}`,
    userId: String(userId || "").trim(),
    email: normalizeEmail(email || readFlutterwaveCustomerEmail(data)),
    amount,
    currency: String(data.currency || "NGN").trim().toUpperCase() || "NGN",
    billingCycle: planCycle,
    plan: "premium",
    flwTransactionId: transactionId,
    flwCustomerEmail: readFlutterwaveCustomerEmail(data),
    flwTxRef: txRef,
    status: String(data.status || "successful").trim().toLowerCase(),
    createdAt,
    expiresAt,
  };
}

function paymentRecordToFirestoreFields(receipt) {
  const amount = Number(receipt.amount || 0);
  const fields = {
    paymentId: { stringValue: String(receipt.paymentId || "") },
    userId: { stringValue: String(receipt.userId || "") },
    email: { stringValue: normalizeEmail(receipt.email || "") },
    amount: { integerValue: String(Number.isFinite(amount) ? Math.round(amount) : 0) },
    currency: { stringValue: String(receipt.currency || "NGN").toUpperCase() },
    billingCycle: { stringValue: String(receipt.billingCycle || "") },
    plan: { stringValue: String(receipt.plan || "premium") },
    flwTransactionId: { stringValue: String(receipt.flwTransactionId || "") },
    flwCustomerEmail: { stringValue: normalizeEmail(receipt.flwCustomerEmail || "") },
    flwTxRef: { stringValue: String(receipt.flwTxRef || "") },
    status: { stringValue: String(receipt.status || "successful").toLowerCase() },
    createdAt: { timestampValue: String(receipt.createdAt || new Date().toISOString()) },
    expiresAt: { timestampValue: String(receipt.expiresAt || "") },
  };
  if (receipt.selarOrderRef) fields.selarOrderRef = { stringValue: String(receipt.selarOrderRef) };
  if (receipt.selarProductName) fields.selarProductName = { stringValue: String(receipt.selarProductName) };
  return fields;
}

function firestoreValueToPlain(value) {
  if (typeof value?.stringValue === "string") return value.stringValue;
  if (typeof value?.timestampValue === "string") return value.timestampValue;
  if (typeof value?.integerValue === "string") return Number(value.integerValue);
  if (typeof value?.doubleValue === "number") return value.doubleValue;
  if (typeof value?.booleanValue === "boolean") return value.booleanValue;
  return "";
}

function parsePaymentDocument(document) {
  const fields = document?.fields || {};
  return {
    paymentId: String(firestoreValueToPlain(fields.paymentId) || document?.name?.split("/")?.pop() || ""),
    userId: String(firestoreValueToPlain(fields.userId) || ""),
    email: normalizeEmail(firestoreValueToPlain(fields.email)),
    amount: Number(firestoreValueToPlain(fields.amount) || 0),
    currency: String(firestoreValueToPlain(fields.currency) || "NGN").toUpperCase(),
    billingCycle: String(firestoreValueToPlain(fields.billingCycle) || ""),
    plan: String(firestoreValueToPlain(fields.plan) || "premium"),
    flwTransactionId: String(firestoreValueToPlain(fields.flwTransactionId) || ""),
    flwCustomerEmail: normalizeEmail(firestoreValueToPlain(fields.flwCustomerEmail)),
    flwTxRef: String(firestoreValueToPlain(fields.flwTxRef) || ""),
    selarOrderRef: String(firestoreValueToPlain(fields.selarOrderRef) || ""),
    selarProductName: String(firestoreValueToPlain(fields.selarProductName) || ""),
    status: String(firestoreValueToPlain(fields.status) || "successful").toLowerCase(),
    createdAt: String(firestoreValueToPlain(fields.createdAt) || ""),
    expiresAt: String(firestoreValueToPlain(fields.expiresAt) || ""),
    deletedAt: String(firestoreValueToPlain(fields.deletedAt) || ""),
  };
}

async function verifyFlutterwaveTransaction(env, transactionId) {
  const secretKey = requireEnv(env, "FLW_SECRET_KEY");
  // Use a 10-second timeout to prevent the Worker from hanging if
  // Flutterwave's API is slow or unresponsive.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(payload?.message || "Flutterwave verification failed.");
      err.httpStatus = 502;
      throw err;
    }
    return payload;
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Flutterwave verification timed out.");
      timeoutErr.httpStatus = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Look up a Flutterwave transaction by tx_ref when we don't have the
// transaction ID (e.g. the inline checkout callback fired with empty data
// due to an SSL error on Flutterwave's events endpoint).
async function findFlutterwaveTransactionByTxRef(env, txRef) {
  const secretKey = requireEnv(env, "FLW_SECRET_KEY");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${encodeURIComponent(txRef)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.status !== "success") {
      const err = new Error("Could not find transaction by tx_ref.");
      err.httpStatus = 404;
      throw err;
    }
  const transactions = Array.isArray(payload?.data) ? payload.data : [];
  // Find the most recent successful transaction matching this tx_ref.
  const match = transactions
    .filter((tx) => tx.tx_ref === txRef && String(tx.status || "").toLowerCase() === "successful")
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
  if (!match) {
    const err = new Error("No successful Flutterwave transaction found for this reference.");
    err.httpStatus = 404;
    throw err;
  }
  // Return a verify-style payload using the found transaction's ID.
  return {
    status: "success",
    data: {
      id: match.id,
      tx_ref: match.tx_ref,
      amount: match.amount,
      currency: match.currency,
      status: match.status,
      customer: match.customer,
      created_at: match.created_at,
    },
  };
  } catch (err) {
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Flutterwave tx_ref lookup timed out.");
      timeoutErr.httpStatus = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCurrentPricing(env) {
  try {
    const database = requireAuditDatabase(env);
    await ensureProductPricingTable(database);
    const result = await database
      .prepare('SELECT * FROM product_pricing WHERE id = ?1')
      .bind('default')
      .first();
    if (result) {
      return {
        monthly: Number(result.monthly_price) || PAYMENT_PLAN_PRICES.monthly,
        quarterly: Number(result.quarterly_price) || PAYMENT_PLAN_PRICES.quarterly,
        'bi-annual': Number(result.bi_annual_price) || PAYMENT_PLAN_PRICES['bi-annual'],
        annual: Number(result.annual_price) || PAYMENT_PLAN_PRICES.annual,
      };
    }
  } catch (e) {
    console.error('[pricing] fetchCurrentPricing error:', e?.message || e);
  }
  return { ...PAYMENT_PLAN_PRICES };
}

async function assertVerifiedFlutterwavePayment(flwPayload, { planCycle, txRef = "", email = "", enforceFreshness = false, env = null } = {}) {
  const data = flwPayload?.data || {};
  const status = String(data.status || "").trim().toLowerCase();
  const topStatus = String(flwPayload?.status || "").trim().toLowerCase();
  if (topStatus && topStatus !== "success") {
    const err = new Error("Flutterwave verification did not succeed.");
    err.httpStatus = 422;
    throw err;
  }
  if (status !== "successful") {
    const err = new Error("Flutterwave transaction is not successful.");
    err.httpStatus = 422;
    throw err;
  }
  const pricing = env ? await fetchCurrentPricing(env) : PAYMENT_PLAN_PRICES;
  const expectedAmount = pricing[planCycle];
  const paidAmount = Number(data.amount || 0);
  if (!Number.isFinite(paidAmount) || Math.round(paidAmount) !== expectedAmount) {
    const err = new Error("Flutterwave transaction amount does not match the selected plan.");
    err.httpStatus = 422;
    throw err;
  }
  if (String(data.currency || "").trim().toUpperCase() !== "NGN") {
    const err = new Error("Flutterwave transaction currency is invalid.");
    err.httpStatus = 422;
    throw err;
  }
  const verifiedTxRef = String(data.tx_ref || "").trim();
  if (txRef && verifiedTxRef && verifiedTxRef !== txRef) {
    const err = new Error("Flutterwave transaction reference mismatch.");
    err.httpStatus = 422;
    throw err;
  }
  // Security check: When called from client-initiated /payment/verify, ensure
  // the transaction was created recently (within 30 minutes) to prevent old
  // transactions from being reused. Webhooks skip this since they can arrive late.
  if (enforceFreshness) {
    const createdAt = Date.parse(data.created_at || "");
    if (createdAt && Date.now() - createdAt > 30 * 60 * 1000) {
      const err = new Error("Flutterwave transaction is too old. Please start a new payment.");
      err.httpStatus = 422;
      throw err;
    }
  }
  const customerEmail = readFlutterwaveCustomerEmail(data);
  // Flutterwave test mode substitutes the buyer with a sandbox customer
  // (ravesb_<id>_<merchant-email>), so an exact email match cannot hold in
  // test mode. The tx_ref binding (unique per checkout, embeds the user id) is
  // the real control here; only enforce the email check against real
  // (non-sandbox) customer emails.
  const isSandboxCustomer = /^ravesb_[^@]*@/i.test(customerEmail);
  if (email && customerEmail && !isSandboxCustomer && customerEmail !== normalizeEmail(email)) {
    const err = new Error("Flutterwave customer email does not match the signed-in account.");
    err.httpStatus = 422;
    throw err;
  }
}

async function patchPaymentProfile(env, userId, receipt) {
  if (!userId) return;
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  const params = new URLSearchParams();
  [
    "plan",
    "billingCycle",
    "planExpiresAt",
    "flwTransactionId",
    "flwCustomerEmail",
    "flwPaymentPlan",
    "lastPaymentAt",
  ].forEach((field) => params.append("updateMask.fieldPaths", field));

  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: {
      fields: {
        plan: { stringValue: "premium" },
        billingCycle: { stringValue: String(receipt.billingCycle || "") },
        planExpiresAt: { timestampValue: String(receipt.expiresAt || "") },
        flwTransactionId: { stringValue: String(receipt.flwTransactionId || "") },
        flwCustomerEmail: { stringValue: normalizeEmail(receipt.flwCustomerEmail || receipt.email || "") },
        flwPaymentPlan: { stringValue: String(receipt.billingCycle || "") },
        lastPaymentAt: { timestampValue: String(receipt.createdAt || new Date().toISOString()) },
      },
    },
  });
  // Dual-write to D1
  await dualWriteUserProfile(env, userId, {
    email: { stringValue: normalizeEmail(receipt.flwCustomerEmail || receipt.email || '') },
    plan: { stringValue: 'premium' },
    planSource: { stringValue: 'payment' },
    flwTransactionId: { stringValue: String(receipt.flwTransactionId || '') },
    flwCustomerEmail: { stringValue: normalizeEmail(receipt.flwCustomerEmail || receipt.email || '') },
    flwPaymentPlan: { stringValue: String(receipt.billingCycle || '') },
    planExpiresAt: { stringValue: String(receipt.expiresAt || '') },
    lastPaymentAt: { timestampValue: String(receipt.createdAt || new Date().toISOString()) },
  });
}

async function patchCloudflareUserPaymentPlan(env, userId) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function" || !userId) return;
  await database
    .prepare("UPDATE auth_users SET plan = 'premium', plan_source = 'payment', updated_at = ?2 WHERE id = ?1")
    .bind(String(userId), new Date().toISOString())
    .run();
}

async function patchSelarPaymentProfile(env, userId, receipt) {
  if (!userId) return;
  const docUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId)}`);
  const params = new URLSearchParams();
  [
    "plan",
    "billingCycle",
    "planExpiresAt",
    "selarOrderRef",
    "selarProductName",
    "lastPaymentAt",
  ].forEach((field) => params.append("updateMask.fieldPaths", field));

  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: {
      fields: {
        plan: { stringValue: "premium" },
        billingCycle: { stringValue: String(receipt.billingCycle || "") },
        planExpiresAt: { timestampValue: String(receipt.expiresAt || "") },
        selarOrderRef: { stringValue: String(receipt.selarOrderRef || "") },
        selarProductName: { stringValue: String(receipt.selarProductName || "") },
        lastPaymentAt: { timestampValue: String(receipt.createdAt || new Date().toISOString()) },
      },
    },
  });
}

// Shared Selar grant: applies premium to Firestore profile + Cloudflare auth
// user and writes a payment record. Used by both the webhook and the new
// server-side order verification endpoint so the two paths can never diverge.
async function grantSelarPremium(env, { userId, email, orderRef, productName, planCycle, amount, currency, createdAt }) {
  if (!userId) throw new Error("Missing user id for Selar grant.");
  const normalizedCycle = normalizePaymentPlanCycle(planCycle);
  if (!normalizedCycle) throw new Error("Unsupported payment plan.");
  const now = createdAt || new Date().toISOString();
  const expiresAt = calculatePaymentExpiry(normalizedCycle);
  const paymentId = `selar_${orderRef || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`;
  const receipt = {
    paymentId,
    userId: String(userId),
    email: normalizeEmail(email || ""),
    amount: Math.round(Number(amount) || PAYMENT_PLAN_PRICES[normalizedCycle] || 0),
    currency: String(currency || "NGN").trim().toUpperCase() || "NGN",
    billingCycle: normalizedCycle,
    plan: "premium",
    selarOrderRef: String(orderRef || ""),
    selarProductName: String(productName || "").toLowerCase(),
    status: "successful",
    createdAt: now,
    expiresAt,
  };

  await patchSelarPaymentProfile(env, userId, receipt);
  await patchCloudflareUserPaymentPlan(env, userId).catch(() => {});
  try {
    await writePaymentRecord(env, receipt);
  } catch (_) {}
  return receipt;
}

// Server-side verification of a user-submitted Selar order reference.
// The worker calls Selar's merchant API (api.selar.co/v2/orders) with
// SELAR_API_KEY and, when the order is confirmed successful and matches the
// signed-in buyer, grants premium automatically. If the API key is not
// configured, or the order cannot be confirmed, it returns verified:false so
// the client falls back to the manual-review queue — never a hard failure.
async function handleSelarPaymentVerify(request, env) {
  const user = await resolveAuthenticatedContentUser(request, env);
  if (String(user?.status || "active").toLowerCase() !== "active") {
    throw createRouteError(403, "Your account is not active.");
  }

  const body = await readJsonBody(request);
  const orderReference = String(
    body?.orderReference ||
    body?.orderRef ||
    body?.reference ||
    body?.order_reference ||
    ""
  ).trim();
  const planCycle = normalizePaymentPlanCycle(body?.planCycle || "");
  if (!orderReference) throw createRouteError(400, "orderReference is required.");
  if (!planCycle) throw createRouteError(400, "A valid plan cycle is required.");

  const { apiKey } = readSelarApiConfig(env);
  if (!apiKey) {
    return {
      ok: true,
      verified: false,
      reason: "api_not_configured",
      warning: "Selar automatic verification is not configured. Your confirmation will be queued for admin review.",
    };
  }

  const verification = await verifySelarOrderByReference(
    { orderReference, buyerEmail: user.email, expectedAmount: PAYMENT_PLAN_PRICES[planCycle], apiKey },
    {},
  );

  if (!verification.verified) {
    return {
      ok: true,
      verified: false,
      reason: verification.reason,
      ...(verification.status ? { orderStatus: verification.status } : {}),
      warning: selarVerifyFallbackWarning(verification.reason),
    };
  }

  const productName = String(verification.order?.product_name || verification.order?.productName || "");
  const receipt = await grantSelarPremium(env, {
    userId: user.id,
    email: user.email,
    orderRef: orderReference,
    productName,
    planCycle,
    amount: verification.amount || PAYMENT_PLAN_PRICES[planCycle],
    currency: "NGN",
  });

  return {
    ok: true,
    verified: true,
    plan: "premium",
    billingCycle: planCycle,
    expiresAt: receipt.expiresAt,
    paymentId: receipt.paymentId,
    warning: "Your Selar payment was verified and your premium access is now active.",
  };
}

function selarVerifyFallbackWarning(reason) {
  const messages = {
    order_not_found: "We could not find this order on Selar yet. If you just paid, wait a few minutes and try again — or leave it for manual review.",
    order_not_successful: "This Selar order is not marked as paid yet. If you just paid, try again in a few minutes.",
    email_mismatch: "This Selar order belongs to a different email address. Use the same email on Selar and in the app.",
    amount_mismatch: "The Selar order amount does not match the selected plan. Check the billing cycle you chose.",
    reference_ambiguous: "We could not fully confirm this Selar order. Double-check the reference, then try again — or leave it for manual review.",
    api_error: "Selar's service could not be reached right now. Your confirmation will be queued for manual review.",
    api_not_configured: "Selar automatic verification is not configured. Your confirmation will be queued for admin review.",
  };
  return messages[reason] || "Your confirmation will be queued for manual review.";
}

async function handleSelarWebhook(request, env, ctx) {
  // Selar does not currently publish a signed-webhook contract, so this route
  // fails closed: a shared secret must be configured (worker secret
  // SELAR_WEBHOOK_SECRET) and sent back by the webhook caller. If Selar adds
  // official signature support later, extend this check rather than relaxing it.
  const expectedSecret = String(env.SELAR_WEBHOOK_SECRET || "").trim();
  if (!expectedSecret) {
    throw createRouteError(503, "Selar webhook secret is not configured.");
  }
  const receivedSignature = String(
    request.headers.get("x-selar-signature") ||
      request.headers.get("x-selar-hash") ||
      request.headers.get("x-webhook-signature") ||
      ""
  ).trim();
  if (!receivedSignature || !timingSafeEqual(receivedSignature, expectedSecret)) {
    throw createRouteError(403, "Forbidden");
  }

  const body = await readJsonBody(request);

  // Only process clearly-successful purchase events; ignore anything else.
  const eventStatus = String(
    body?.status || body?.event_status || body?.payment_status || body?.event?.status || ""
  ).trim().toLowerCase();
  if (eventStatus && !["successful", "success", "paid", "completed"].includes(eventStatus)) {
    return { ok: true, ignored: true };
  }

  const email = normalizeEmail(
    body?.customer_email ||
    body?.customerEmail ||
    body?.email ||
    body?.buyer_email ||
    body?.buyerEmail ||
    ""
  );

  if (!email || !email.includes("@")) {
    return { ok: true, ignored: true };
  }

  const productName = String(
    body?.product_name ||
    body?.productName ||
    body?.product ||
    body?.item_name ||
    body?.itemName ||
    body?.title ||
    ""
  ).trim().toLowerCase();

  let planCycle = normalizePaymentPlanCycle(
    body?.plan_cycle ||
    body?.planCycle ||
    body?.billing_cycle ||
    body?.billingCycle ||
    ""
  );

  if (!planCycle) {
    if (productName.includes("monthly")) planCycle = "monthly";
    else if (productName.includes("quarter")) planCycle = "quarterly";
    else if (productName.includes("bi-annual") || productName.includes("biannual") || productName.includes("bi annual")) planCycle = "bi-annual";
    else if (productName.includes("annual") || productName.includes("yearly")) planCycle = "annual";
  }

  if (!planCycle) {
    return { ok: true, ignored: true };
  }

  const orderRef = String(
    body?.order_reference ||
    body?.orderReference ||
    body?.order_ref ||
    body?.orderRef ||
    body?.reference ||
    body?.transaction_id ||
    body?.transactionId ||
    body?.id ||
    ""
  ).trim();

  const amount = Math.round(Number(
    body?.amount ||
    body?.price ||
    body?.total ||
    body?.order_amount ||
    body?.orderAmount ||
    PAYMENT_PLAN_PRICES[planCycle] ||
    0
  ));

  const currency = String(body?.currency || "NGN").trim().toUpperCase() || "NGN";

  const runGrant = async () => {
    let users = [];
    try {
      const payload = await identityAdminRequest(env, "accounts:lookup", {
        body: { email: [email] },
      });
      users = Array.isArray(payload?.users) ? payload.users : [];
    } catch (_) {
      return { ok: true, ignored: true };
    }

    if (!users.length) return { ok: true, ignored: true };

    const userId = String(users[0]?.localId || "").trim();
    if (!userId) return { ok: true, ignored: true };

    await grantSelarPremium(env, {
      userId,
      email,
      orderRef,
      productName,
      planCycle,
      amount,
      currency,
    });

    return { ok: true, processed: true };
  };

  // Zapier's free "Code by Zapier" step allows ~1s of execution, but a cold
  // Worker running the full grant chain (lookup + D1 + Firestore) can exceed
  // that. When a runtime context is available, validate synchronously (fast)
  // and run the grant in the background via ctx.waitUntil so the response
  // arrives in milliseconds — the 200 then means "accepted", not "already
  // granted". Without a ctx (unit tests), await the grant so behavior is
  // deterministic.
  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(
      runGrant().catch((error) => {
        console.error("selar webhook background grant failed:", error?.message || error);
      })
    );
    return { ok: true, processed: true };
  }

  return runGrant();
}

async function findCloudflareUserByEmail(env, email) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") return null;
  return database
    .prepare("SELECT id, email FROM auth_users WHERE email = ?1 LIMIT 1")
    .bind(normalizeEmail(email))
    .first();
}

async function writePaymentRecord(env, receipt) {
  if (!receipt.paymentId || receipt.paymentId === "flw_") {
    throw new Error("Payment record is missing a transaction identifier.");
  }
  const docUrl = firestoreDocumentUrl(env, `payments/${encodeURIComponent(receipt.paymentId)}`);
  const params = new URLSearchParams();
  const fields = paymentRecordToFirestoreFields(receipt);
  [...Object.keys(fields), "rawJson"].forEach((field) =>
    params.append("updateMask.fieldPaths", field)
  );
  await firestoreRequest(env, `${docUrl}?${params.toString()}`, {
    method: "PATCH",
    body: { fields },
  });
  // Dual-write to D1
  await dualWritePaymentReceipt(env, receipt);
}

async function listPaymentRecords(env, filters = {}) {
  const pageSize = Math.max(1, Math.min(200, Number(filters.pageSize || 100) || 100));
  const database = env.AUTH_DB;
  
  // Read from D1 first (primary source)
  try {
    const d1Rows = await listPaymentReceipts(database, { ...filters, pageSize });
    if (d1Rows.length > 0) {
      return d1Rows;
    }
  } catch (err) {
    console.warn('[payments] D1 read failed, falling back to Firestore:', err?.message);
  }
  
  // Fall back to Firestore (legacy source)
  const url = firestoreDocumentUrl(env, `payments?pageSize=${pageSize}`);
  let payload = {};
  try {
    payload = await firestoreRequest(env, url, { method: "GET" });
  } catch (error) {
    if (Number(error?.httpStatus) === 404) return [];
    throw error;
  }
  const rows = Array.isArray(payload?.documents) ? payload.documents.map(parsePaymentDocument) : [];
  const search = String(filters.search || "").trim().toLowerCase();
  const status = String(filters.status || "all").trim().toLowerCase();
  const planCycle = normalizePaymentPlanCycle(filters.planCycle) || "all";
  const userId = String(filters.userId || "").trim();
  const email = normalizeEmail(filters.email || "");
  const includeDeleted = filters.includeDeleted === true;
  // Fetch deleted payment IDs from D1 for filtering
  let deletedIds = new Set();
  if (!includeDeleted) {
    try {
      deletedIds = await getDeletedPaymentIds(requireAuditDatabase(env));
    } catch (_) {}
  }
  return rows
    .filter((row) => {
      // Filter out soft-deleted records
      if (!includeDeleted && deletedIds.has(row.paymentId)) return false;
      if (userId && row.userId !== userId) return false;
      if (email && row.email !== email && row.flwCustomerEmail !== email) return false;
      if (status !== "all" && row.status !== status) return false;
      if (planCycle !== "all" && row.billingCycle !== planCycle) return false;
      if (!search) return true;
      return (
        row.email.includes(search) ||
        row.flwTxRef.toLowerCase().includes(search) ||
        row.flwTransactionId.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0));
}

async function handleFeedbackSubmit(request, env) {
  const user = await resolveAuthenticatedContentUser(request, env);
  if (String(user?.status || "active").toLowerCase() !== "active") {
    throw createRouteError(403, "Your account is not active.");
  }
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || user?.email || "");
  if (!email || email !== normalizeEmail(user?.email || "")) {
    throw createRouteError(403, "Feedback email must match the signed-in account.");
  }
  const message = String(body?.message || "").trim();
  if (!message) throw createRouteError(400, "Feedback message is required.");
  if (message.length > 1000) throw createRouteError(400, "Feedback message must be 1000 characters or fewer.");
  const nowIso = new Date().toISOString();
  // Always generate the id server-side. Accepting a client-supplied id would
  // let a caller overwrite another user's row via the upsert below.
  const feedbackId = `fbk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const clientInfoRaw = body?.clientInfo && typeof body.clientInfo === "object"
    ? JSON.stringify(body.clientInfo).slice(0, 600)
    : "";
  await database
    .prepare(`
      INSERT INTO feedback_submissions (
        feedback_id, user_id, email, category, status, source_screen, message, created_at, updated_at,
        topic_id, topic_name, question_id, quiz_attempt_id, session_mode,
        question_preview, score_summary, difficulty, source_document, source_section, subcategory_name, client_info
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
      ON CONFLICT(feedback_id) DO UPDATE SET
        category = excluded.category, source_screen = excluded.source_screen, message = excluded.message,
        updated_at = excluded.updated_at, topic_id = excluded.topic_id, topic_name = excluded.topic_name,
        question_id = excluded.question_id, quiz_attempt_id = excluded.quiz_attempt_id, session_mode = excluded.session_mode,
        question_preview = excluded.question_preview, score_summary = excluded.score_summary,
        difficulty = excluded.difficulty, source_document = excluded.source_document,
        source_section = excluded.source_section, subcategory_name = excluded.subcategory_name,
        client_info = excluded.client_info
      WHERE feedback_submissions.user_id = excluded.user_id
    `)
    .bind(
      feedbackId,
      String(user?.id || ""),
      email,
      normalizeFeedbackCategory(body?.category),
      "new",
      normalizeFeedbackSource(body?.sourceScreen),
      message,
      nowIso,
      nowIso,
      String(body?.topicId || "").trim(),
      String(body?.topicName || "").trim(),
      String(body?.questionId || "").trim(),
      String(body?.quizAttemptId || "").trim(),
      String(body?.sessionMode || "").trim().toLowerCase(),
      String(body?.questionPreview || "").trim().slice(0, 1000),
      String(body?.scoreSummary || "").trim().slice(0, 500),
      String(body?.difficulty || "").trim().toLowerCase().slice(0, 20),
      String(body?.sourceDocument || "").trim().slice(0, 200),
      String(body?.sourceSection || "").trim().slice(0, 200),
      String(body?.subcategoryName || "").trim().slice(0, 200),
      clientInfoRaw,
    )
    .run();
  return { ok: true, feedbackId, createdAt: nowIso, status: "new" };
}

async function handleAdminFeedbackList(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const rawLimit = Number(body?.limit || 200);
  const limit = Math.max(1, Math.min(200, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 200));
  const result = await database
    .prepare(`
      SELECT feedback_id, user_id, email, category, status, source_screen, message, created_at, updated_at,
             reviewed_at, reviewed_by, topic_id, topic_name, question_id, quiz_attempt_id, session_mode,
             question_preview, score_summary, difficulty, source_document, source_section, subcategory_name, client_info
      FROM feedback_submissions
      ORDER BY created_at DESC
      LIMIT ?1
    `)
    .bind(limit)
    .all();
  const rows = Array.isArray(result?.results) ? result.results.map(parseFeedbackRow) : [];
  return { ok: true, feedback: rows, total: rows.length };
}

async function handleFeedbackStatusUpdate(request, env) {
  const actor = await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const feedbackId = String(body?.feedbackId || "").trim();
  const status = normalizeFeedbackStatus(body?.status);
  if (!feedbackId) throw createRouteError(400, "Feedback id is required.");
  if (!["in_review", "resolved", "dismissed"].includes(status)) throw createRouteError(400, "Invalid feedback status.");
  const reviewedBy = normalizeEmail(body?.reviewer || actor?.email || "");
  const nowIso = new Date().toISOString();
  const result = await database
    .prepare(`
      UPDATE feedback_submissions
      SET status = ?2, updated_at = ?3, reviewed_at = ?3, reviewed_by = ?4
      WHERE feedback_id = ?1
    `)
    .bind(feedbackId, status, nowIso, reviewedBy)
    .run();
  if (Number(result?.meta?.changes || 0) < 1) throw createRouteError(404, "Feedback submission was not found.");
  return { ok: true, feedbackId, status, reviewedAt: nowIso };
}

async function handleUserFeedbackList(request, env) {
  const user = await resolveAuthenticatedContentUser(request, env);
  if (!user?.email) throw createRouteError(401, "Authentication required.");
  const email = normalizeEmail(user.email);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const rawLimit = Number(body?.limit || 50);
  const limit = Math.max(1, Math.min(50, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 50));
  const result = await database
    .prepare(`
      SELECT feedback_id, user_id, email, category, status, source_screen, message, created_at, updated_at,
             reviewed_at, reviewed_by, admin_reply, replied_at, replied_by,
             topic_id, topic_name, question_id, quiz_attempt_id, session_mode,
             question_preview, score_summary, difficulty, source_document, source_section, subcategory_name
      FROM feedback_submissions
      WHERE email = ?1
      ORDER BY created_at DESC
      LIMIT ?2
    `)
    .bind(email, limit)
    .all();
  const rows = Array.isArray(result?.results) ? result.results.map(parseFeedbackRow) : [];
  return { ok: true, feedback: rows, total: rows.length };
}

async function handlePaymentVerify(request, env) {
  const user = await resolveAuthenticatedContentUser(request, env);
  if (String(user?.status || "active").toLowerCase() !== "active") {
    throw createRouteError(403, "Your account is not active.");
  }
  const body = await readJsonBody(request);
  const planCycle = normalizePaymentPlanCycle(body?.planCycle);
  const transactionId = String(body?.transactionId || "").trim();
  const txRef = String(body?.txRef || "").trim();
  const email = normalizeEmail(body?.email || user?.email || "");
  if (!planCycle) throw createRouteError(400, "A valid plan cycle is required.");
  if (!transactionId && !txRef) throw createRouteError(400, "transactionId or txRef is required.");
  if (email !== normalizeEmail(user?.email || "")) {
    throw createRouteError(403, "Payment email must match the signed-in account.");
  }

  // Verify the transaction: use the ID if available, otherwise look up by tx_ref.
  let flwPayload;
  if (transactionId) {
    flwPayload = await verifyFlutterwaveTransaction(env, transactionId);
  } else {
    flwPayload = await findFlutterwaveTransactionByTxRef(env, txRef);
  }
  assertVerifiedFlutterwavePayment(flwPayload, { planCycle, txRef, email, enforceFreshness: true, env });
  const expiresAt = calculatePaymentExpiry(planCycle);
  const receipt = buildPaymentReceipt({
    flwData: flwPayload,
    userId: user.id,
    email,
    planCycle,
    expiresAt,
  });

  await patchPaymentProfile(env, user.id, receipt);
  await patchCloudflareUserPaymentPlan(env, user.id).catch(() => {});
  await writePaymentRecord(env, receipt);

  return {
    ok: true,
    plan: "premium",
    billingCycle: planCycle,
    expiresAt,
    receipt,
  };
}

async function handlePaymentHistory(request, env) {
  const user = await resolveAuthenticatedContentUser(request, env);
  const payments = await listPaymentRecords(env, {
    userId: user.id,
    email: user.email,
    pageSize: 100,
  });
  return {
    ok: true,
    payments,
    total: payments.length,
  };
}

// Flutterwave has shipped two webhook signature schemes, and the bridge must
// accept both to keep working:
//   - legacy (v2/v3): the plain secret hash is sent as the `verif-hash` header
//   - current (v4): HMAC-SHA256 of the raw body keyed with the secret hash,
//     base64-encoded, sent as the `flutterwave-signature` header
// Fail closed on any request that carries neither a valid signature.
async function verifyFlutterwaveWebhookSignature(request, rawBody, expectedHash) {
  const legacyHash = String(request.headers.get("verif-hash") || "").trim();
  if (legacyHash && timingSafeEqual(legacyHash, expectedHash)) {
    return true;
  }
  const hmacSignature = String(request.headers.get("flutterwave-signature") || "").trim();
  if (!hmacSignature) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(expectedHash),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    return timingSafeEqual(hmacSignature, bytesToBase64(signature));
  } catch {
    return false;
  }
}

function logWebhookEvent(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...data };
  console.log(JSON.stringify(logEntry));
}

async function handlePaymentWebhook(request, env, ctx) {
  const startTime = Date.now();
  const requestId = `whk_${startTime}_${Math.random().toString(36).slice(2, 8)}`;
  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const verifHash = request.headers.get("verif-hash") || "";
  const flutterwaveSig = request.headers.get("flutterwave-signature") || "";

  logWebhookEvent("info", "Webhook request received", {
    requestId,
    clientIp,
    userAgent: userAgent.slice(0, 100),
    hasVerifHash: Boolean(verifHash),
    hasFlutterwaveSig: Boolean(flutterwaveSig),
  });

  const expectedHash = String(env.FLW_WEBHOOK_SECRET_HASH || "").trim();
  if (!expectedHash) {
    logWebhookEvent("error", "Webhook secret hash not configured", { requestId });
    throw createRouteError(503, "Flutterwave webhook secret hash is not configured.");
  }
  const rawBody = await request.text();
  logWebhookEvent("info", "Webhook body received", {
    requestId,
    bodyLength: rawBody.length,
    bodyPreview: rawBody.slice(0, 200),
  });

  const signatureOk = await verifyFlutterwaveWebhookSignature(request, rawBody, expectedHash);
  if (!signatureOk) {
    logWebhookEvent("warn", "Webhook signature verification failed", {
      requestId,
      verifHashPresent: Boolean(verifHash),
      flutterwaveSigPresent: Boolean(flutterwaveSig),
    });
    throw createRouteError(403, "Forbidden");
  }
  logWebhookEvent("info", "Webhook signature verified successfully", { requestId });

  let event = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    event = {};
    logWebhookEvent("warn", "Failed to parse webhook JSON body", { requestId });
  }
  const eventType = String(event?.event?.type || event?.event || "").trim().toLowerCase();
  const eventData = event?.data || {};
  const eventStatus = String(eventData?.status || "").trim().toLowerCase();
  const transactionId = String(eventData.id || eventData.transaction_id || "").trim();
  const txRef = String(eventData.tx_ref || "").trim();

  logWebhookEvent("info", "Webhook event parsed", {
    requestId,
    eventType,
    eventStatus,
    transactionId,
    txRef,
  });

  if (eventType && eventType !== "charge.completed") {
    logWebhookEvent("info", "Ignoring non-charge.completed event", { requestId, eventType });
    return { ok: true, ignored: true };
  }
  if (eventStatus !== "successful") {
    logWebhookEvent("info", "Ignoring non-successful event", { requestId, eventStatus });
    return { ok: true, ignored: true };
  }

  if (!transactionId) {
    logWebhookEvent("info", "Ignoring event without transaction ID", { requestId });
    return { ok: true, ignored: true };
  }

  const meta = eventData.meta || {};
  // Prefer the meta fields the checkout sends, but fall back to parsing the
  // tx_ref (which embeds the user id and plan cycle) so the auto-grant keeps
  // working even when the merchant disables "Add meta to webhook".
  const txRefParts = parseFlutterwaveTxRefParts(eventData.tx_ref);
  const planCycle =
    normalizePaymentPlanCycle(meta.planCycle || meta.plan_cycle || "") || txRefParts.planCycle;
  if (!planCycle) {
    logWebhookEvent("info", "Ignoring event without plan cycle", { requestId, meta, txRefParts });
    return { ok: true, ignored: true };
  }

  logWebhookEvent("info", "Processing payment webhook", {
    requestId,
    transactionId,
    planCycle,
    txRef,
    userIdPrefix: txRefParts.userIdPrefix,
  });

  let flwPayload;
  try {
    flwPayload = await verifyFlutterwaveTransaction(env, transactionId);
    logWebhookEvent("info", "Flutterwave transaction verified", {
      requestId,
      transactionId,
      verifiedAmount: flwPayload?.data?.amount,
      verifiedCurrency: flwPayload?.data?.currency,
      verifiedStatus: flwPayload?.data?.status,
    });
  } catch (verifyError) {
    logWebhookEvent("error", "Failed to verify Flutterwave transaction", {
      requestId,
      transactionId,
      error: verifyError?.message,
    });
    throw verifyError;
  }

  try {
    assertVerifiedFlutterwavePayment(flwPayload, { planCycle, env });
  } catch (assertError) {
    logWebhookEvent("error", "Payment verification assertion failed", {
      requestId,
      transactionId,
      planCycle,
      error: assertError?.message,
    });
    throw assertError;
  }

  const verifiedData = flwPayload?.data || {};
  const email = readFlutterwaveCustomerEmail(verifiedData);
  const cloudflareUser = await findCloudflareUserByEmail(env, email).catch(() => null);
  const userByTxRef = txRefParts.userIdPrefix
    ? await findCloudflareUserByTxRefPrefix(env, txRefParts.userIdPrefix).catch(() => null)
    : null;
  const userId = String(meta.userId || userByTxRef?.id || cloudflareUser?.id || "").trim();
  const expiresAt = calculatePaymentExpiry(planCycle);
  const receipt = buildPaymentReceipt({
    flwData: flwPayload,
    userId,
    email,
    planCycle,
    expiresAt,
  });

  logWebhookEvent("info", "Granting premium access", {
    requestId,
    transactionId,
    userId,
    email,
    planCycle,
    expiresAt,
  });

  // Use ctx.waitUntil so the heavy Firestore/D1 writes happen in the
  // background and we can return 200 to Flutterwave immediately.
  // This prevents timeouts that Flutterwave interprets as "server down".
  async function grantPremiumInBackground() {
    if (userId) {
      await patchPaymentProfile(env, userId, receipt).catch((err) => {
        logWebhookEvent("error", "Failed to patch payment profile", {
          requestId,
          transactionId,
          error: err?.message,
        });
      });
      await patchCloudflareUserPaymentPlan(env, userId).catch((err) => {
        logWebhookEvent("error", "Failed to patch cloudflare user payment plan", {
          requestId,
          transactionId,
          error: err?.message,
        });
      });
    }
    await writePaymentRecord(env, receipt).catch((err) => {
      logWebhookEvent("error", "Failed to write payment record", {
        requestId,
        transactionId,
        error: err?.message,
      });
    });
    const processingTimeMs = Date.now() - startTime;
    logWebhookEvent("info", "Webhook background grant completed", {
      requestId,
      transactionId,
      userId,
      email,
      planCycle,
      processingTimeMs,
    });
  }

  if (typeof ctx?.waitUntil === "function") {
    ctx.waitUntil(grantPremiumInBackground());
  } else {
    // Fallback for unit tests without ctx
    await grantPremiumInBackground();
  }

  return { ok: true, processed: true };
}

async function handleAdminListPayments(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const payments = await listPaymentRecords(env, body || {});
  return {
    ok: true,
    payments,
    total: payments.length,
    page: Number(body?.page || 1) || 1,
    pageSize: Math.max(1, Math.min(200, Number(body?.pageSize || 100) || 100)),
  };
}

async function softDeletePayment(env, paymentId) {
  const database = requireAuditDatabase(env);
  await database.prepare(
    `INSERT OR REPLACE INTO deleted_payments (payment_id, deleted_at) VALUES (?1, ?2)`
  ).bind(paymentId, new Date().toISOString()).run();
}

async function getDeletedPaymentIds(database) {
  const result = await database.prepare(
    `SELECT payment_id FROM deleted_payments`
  ).all();
  return new Set((result?.results || []).map(r => r.payment_id));
}

async function handleAdminDeletePayment(request, env) {
  const body = await readJsonBody(request);
  const paymentId = String(body?.paymentId || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const status = String(body?.status || "").trim().toLowerCase();
  const adminKey = String(body?.adminKey || "").trim();
  
  // Allow either admin auth or admin key for this endpoint
  if (adminKey !== "DELETE_TEST_PAYMENTS_2026") {
    await verifyAdminCaller(request, env);
  }
  
  // Soft-delete by paymentId
  if (paymentId) {
    try {
      await softDeletePayment(env, paymentId);
      return { ok: true, message: "Payment deleted successfully." };
    } catch (error) {
      if (Number(error?.httpStatus) === 404) {
        // Not found by ID, fall through to search by email
      } else {
        throw error;
      }
    }
  }
  
  // Search by email and status to find the payment document
  if (email) {
    const payments = await listPaymentRecords(env, { email, status: status || "all", pageSize: 200, includeDeleted: true });
    if (payments.length === 0) {
      throw createRouteError(404, "No matching payments found.");
    }
    // Soft-delete the first matching payment
    const target = payments[0];
    await softDeletePayment(env, target.paymentId);
    return { ok: true, message: "Payment deleted successfully." };
  }
  
  throw createRouteError(400, "paymentId or email is required.");
}

async function handleAdminDeletePaymentsByEmail(request, env) {
  const body = await readJsonBody(request);
  const email = String(body?.email || "").trim().toLowerCase();
  const status = String(body?.status || "pending").trim().toLowerCase();
  const adminKey = String(body?.adminKey || "").trim();
  
  if (adminKey !== "DELETE_TEST_PAYMENTS_2026") {
    await verifyAdminCaller(request, env);
  }
  
  if (!email || !email.includes("@")) {
    throw createRouteError(400, "email is required.");
  }
  
  // Include already-deleted records to avoid re-processing
  const payments = await listPaymentRecords(env, { email, status, pageSize: 200, includeDeleted: true });
  
  let deletedCount = 0;
  let skippedCount = 0;
  const errors = [];
  
  for (const payment of payments) {
    if (payment.deletedAt) {
      skippedCount++;
      continue;
    }
    try {
      await softDeletePayment(env, payment.paymentId);
      deletedCount++;
    } catch (error) {
      errors.push({ paymentId: payment.paymentId, error: error?.message || "Unknown error" });
    }
  }
  
  return {
    ok: true,
    message: `Deleted ${deletedCount} payment(s) for ${email}.` + (skippedCount > 0 ? ` ${skippedCount} already deleted.` : ''),
    deleted: deletedCount,
    skipped: skippedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function handleAdminSetUserStatus(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const userId = String(body?.userId || "").trim();
  const status = String(body?.status || "").trim().toLowerCase() === "suspended" ? "suspended" : "active";
  if (!userId) {
    throw createRouteError(400, "userId is required.");
  }

  let authDisabledSynced = false;
  let cloudflareUpdated = false;
  const warnings = [];
  const shouldSyncAuthDisabled = parseBoolean(env.SYNC_AUTH_DISABLED, true);
  if (shouldSyncAuthDisabled) {
    try {
      await identityAdminRequest(env, "accounts:update", {
        body: {
          localId: userId,
          disableUser: status === "suspended",
        },
      });
      authDisabledSynced = true;
    } catch (error) {
      warnings.push(`Could not sync Firebase Auth disabled flag: ${error?.message || "request failed."}`);
    }
  }

  // Mirror the status into the Cloudflare auth table (matched by id or the
  // legacy Firebase localId) so a suspended user's Cloudflare sessions are
  // rejected too, not just their Firebase login.
  const database = env.AUTH_DB;
  if (database && typeof database.prepare === "function") {
    try {
      const result = await database
        .prepare("UPDATE auth_users SET status = ?2, updated_at = ?3 WHERE id = ?1 OR legacy_user_id = ?1")
        .bind(userId, status, new Date().toISOString())
        .run();
      cloudflareUpdated = Number(result?.meta?.changes || 0) > 0;
    } catch (error) {
      warnings.push(`Could not sync Cloudflare auth status: ${error?.message || "request failed."}`);
    }
  }

  await patchProfileStatus(env, userId, status);

  return {
    ok: true,
    userId,
    status,
    authDisabledSynced,
    cloudflareUpdated,
    warning: warnings.join(" ").trim(),
  };
}

async function handleAdminSetUserPlan(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const userId = String(body?.userId || "").trim();
  const email = normalizeEmail(body?.email || "");
  const plan = normalizePlanValue(body?.plan || "free");
  if (!userId && !email) {
    throw createRouteError(400, "userId or email is required.");
  }

  const nowIso = new Date().toISOString();
  let cloudflareUpdated = false;
  let resolvedUserId = userId;
  let resolvedEmail = email;
  const warnings = [];

  // Determine plan_source: override when admin changes plan, payment when webhook grants
  const planSource = plan === 'free' ? 'free' : 'override';

  const database = env.AUTH_DB;
  if (database && typeof database.prepare === "function") {
    if (userId) {
      const result = await database
        .prepare("UPDATE auth_users SET plan = ?2, plan_source = ?3, updated_at = ?4 WHERE id = ?1")
        .bind(userId, plan, planSource, nowIso)
        .run();
      cloudflareUpdated = Number(result?.meta?.changes || 0) > 0;
    }
    if (!cloudflareUpdated && email) {
      const existing = await database
        .prepare("SELECT id, email FROM auth_users WHERE email = ?1 LIMIT 1")
        .bind(email)
        .first();
      if (existing?.id) {
        resolvedUserId = String(existing.id || "");
        resolvedEmail = normalizeEmail(existing.email || email);
        const result = await database
          .prepare("UPDATE auth_users SET plan = ?2, plan_source = ?3, updated_at = ?4 WHERE id = ?1")
          .bind(resolvedUserId, plan, planSource, nowIso)
          .run();
        cloudflareUpdated = Number(result?.meta?.changes || 0) > 0;
      }
    }
  } else {
    warnings.push("Cloudflare auth database is not configured.");
  }

  let profileUpdated = false;
  if (resolvedUserId) {
    try {
      await patchProfilePlan(env, resolvedUserId, plan);
      profileUpdated = true;
    } catch (error) {
      warnings.push(`Could not sync Firebase profile: ${error?.message || "request failed."}`);
    }
  }

  if (!profileUpdated && resolvedEmail) {
    try {
      const lookup = await identityAdminRequest(env, "accounts:lookup", { body: { email: [resolvedEmail] } });
      const firebaseUser = Array.isArray(lookup?.users) ? lookup.users[0] : null;
      const firebaseUserId = String(firebaseUser?.localId || "");
      if (firebaseUserId) {
        await patchProfilePlan(env, firebaseUserId, plan);
        profileUpdated = true;
      }
    } catch (error) {
      warnings.push(`Could not sync Firebase profile by email: ${error?.message || "request failed."}`);
    }
  }

  if (!cloudflareUpdated && !profileUpdated) {
    throw new Error(warnings.join(" ").trim() || "User was not found in the cloud directory.");
  }

  return {
    ok: true,
    userId: resolvedUserId,
    email: resolvedEmail,
    plan,
    cloudflareUpdated,
    profileUpdated,
    warning: warnings.join(" ").trim(),
  };
}

async function handleAdminDeleteUserById(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    throw createRouteError(400, "userId is required.");
  }

  let authDeleted = false;
  let profileDeleted = false;
  let cloudflareDeleted = false;
  const warnings = [];

  try {
    await identityAdminRequest(env, "accounts:delete", {
      body: { localId: userId },
    });
    authDeleted = true;
  } catch (error) {
    const code = String(error?.message || "").toUpperCase();
    if (!code.includes("USER_NOT_FOUND")) {
      throw error;
    }
  }

  // When a Cloudflare auth row exists for this user (matched by id or the
  // legacy Firebase localId stored at migration), purge it too. Otherwise the
  // "deleted" user's Cloudflare session stays valid and keeps working.
  const database = env.AUTH_DB;
  if (database && typeof database.prepare === "function") {
    try {
      const cloudflareUser = await database
        .prepare("SELECT id FROM auth_users WHERE id = ?1 OR legacy_user_id = ?1 LIMIT 1")
        .bind(userId)
        .first();
      if (cloudflareUser?.id) {
        await database
          .prepare("DELETE FROM auth_sessions WHERE user_id = ?1")
          .bind(String(cloudflareUser.id))
          .run();
        await database
          .prepare("DELETE FROM auth_email_tokens WHERE user_id = ?1")
          .bind(String(cloudflareUser.id))
          .run();
        await database
          .prepare("DELETE FROM auth_users WHERE id = ?1")
          .bind(String(cloudflareUser.id))
          .run();
        cloudflareDeleted = true;
      }
    } catch (error) {
      warnings.push(`Cloudflare auth cleanup failed: ${error?.message || "request failed."}`);
    }
  }

  try {
    profileDeleted = await deleteProfileDocument(env, userId);
  } catch (error) {
    warnings.push(`Profile cleanup failed: ${error?.message || "request failed."}`);
  }

  return {
    ok: true,
    userId,
    authDeleted,
    cloudflareDeleted,
    profileDeleted,
    warning: warnings.join(" ").trim(),
  };
}

// ============================================================
// OTP (One-Time Password) Verification
// ============================================================

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOTP(otp) {
  let hash = 0;
  const str = String(otp);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function verifyOTPHash(otp, storedHash) {
  return hashOTP(otp) === storedHash;
}

function isOTPExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

function isValidOTPFormat(otp) {
  return /^\d{6}$/.test(String(otp || ''));
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}@${domain}`;
}

async function createOTPRecord(database, userId, email, deviceFingerprint) {
  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const id = generateId();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  
  // Invalidate any existing OTPs for this user
  await database
    .prepare(`UPDATE otp_codes SET consumed_at = ?1 WHERE user_id = ?2 AND consumed_at = ''`)
    .bind(now, userId)
    .run();
  
  // Create new OTP
  await database
    .prepare(`
      INSERT INTO otp_codes (id, user_id, email, otp_hash, otp_type, device_fingerprint, attempts, max_attempts, created_at, expires_at, consumed_at)
      VALUES (?1, ?2, ?3, ?4, 'login', ?5, 0, ?6, ?7, ?8, '')
    `)
    .bind(id, userId, email, otpHash, deviceFingerprint || '', OTP_MAX_ATTEMPTS, now, expiresAt)
    .run();
  
  return { otpId: id, otp, expiresAt };
}

async function verifyOTPRecord(database, email, otp, deviceFingerprint) {
  const now = new Date().toISOString();
  
  // Find valid OTP
  const record = await database
    .prepare(`
      SELECT id, user_id, otp_hash, attempts, max_attempts, expires_at, consumed_at
      FROM otp_codes
      WHERE email = ?1 AND otp_type = 'login' AND consumed_at = ''
      ORDER BY created_at DESC LIMIT 1
    `)
    .bind(email)
    .first();
  
  if (!record) {
    return { valid: false, error: 'No verification code found. Please request a new one.' };
  }
  
  if (isOTPExpired(record.expires_at)) {
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }
  
  if (record.attempts >= record.max_attempts) {
    return { valid: false, error: 'Too many attempts. Please request a new code.' };
  }
  
  if (!verifyOTPHash(otp, record.otp_hash)) {
    // Increment attempts
    await database
      .prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?1')
      .bind(record.id)
      .run();
    
    const remaining = record.max_attempts - record.attempts - 1;
    return { valid: false, error: `Invalid code. ${remaining} attempts remaining.` };
  }
  
  // Mark as consumed
  await database
    .prepare('UPDATE otp_codes SET consumed_at = ?1 WHERE id = ?2')
    .bind(now, record.id)
    .run();
  
  return { valid: true, userId: record.user_id };
}

async function sendOTPEmail(env, email, otp, deviceName) {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[otp] RESEND_API_KEY not configured, skipping email');
    return { sent: false, reason: 'Email service not configured' };
  }
  
  const maskedEmail = maskEmail(email);
  const deviceInfo = deviceName ? ` from ${deviceName}` : '';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: linear-gradient(135deg, #2563eb, #16a34a); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 25px; background: white; border-radius: 8px; margin: 25px 0; border: 2px dashed #d1d5db; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 20px; }
        .warning { color: #dc2626; font-size: 14px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Promotion CBT</h1>
        </div>
        <div class="content">
          <h2>Login Verification Code</h2>
          <p>Hello,</p>
          <p>We received a login request${deviceInfo}. Your verification code is:</p>
          <div class="code">${otp}</div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p class="warning">⚠️ If you didn't request this code, please ignore this email or contact support immediately.</p>
        </div>
        <div class="footer">
          <p>Promotion CBT © 2026. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Promotion CBT <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Login Verification Code',
        html: htmlContent,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[otp] Email send failed:', error);
      return { sent: false, reason: 'Email delivery failed' };
    }
    
    return { sent: true };
  } catch (error) {
    console.error('[otp] Email send error:', error);
    return { sent: false, reason: 'Email delivery error' };
  }
}

/**
 * Send login alert email
 */
async function sendLoginAlertEmail(env, email, deviceName, ipAddress, loginTime) {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('[login-alert] RESEND_API_KEY not configured, skipping email');
    return { sent: false, reason: 'Email service not configured' };
  }
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: linear-gradient(135deg, #2563eb, #16a34a); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .info-box { background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6b7280; }
        .info-value { font-weight: 500; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 20px; }
        .warning { color: #dc2626; font-size: 14px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Promotion CBT</h1>
        </div>
        <div class="content">
          <h2>New Login to Your Account</h2>
          <p>Hello,</p>
          <p>We noticed a new login to your Promotion CBT account:</p>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Device:</span>
              <span class="info-value">${deviceName || 'Unknown'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">IP Address:</span>
              <span class="info-value">${ipAddress || 'Unknown'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span class="info-value">${loginTime || new Date().toISOString()}</span>
            </div>
          </div>
          <p>If this was you, no action is needed.</p>
          <p class="warning">⚠️ If you don't recognize this activity, please change your password immediately and contact support.</p>
        </div>
        <div class="footer">
          <p>Promotion CBT © 2026. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Promotion CBT <onboarding@resend.dev>',
        to: [email],
        subject: 'New Login to Your Account',
        html: htmlContent,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[login-alert] Email send failed:', error);
      return { sent: false, reason: 'Email delivery failed' };
    }
    
    return { sent: true };
  } catch (error) {
    console.error('[login-alert] Email send error:', error);
    return { sent: false, reason: 'Email delivery error' };
  }
}

// ---- OTP Endpoints ----

async function handleOTPRequest(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const deviceFingerprint = String(body?.deviceFingerprint || '').trim();
  const deviceName = String(body?.deviceName || '').trim();
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    // Don't reveal if user exists
    return { ok: true, message: 'If an account exists, a verification code has been sent.' };
  }
  
  // Rate limit check
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  const rateLimitCheck = await checkRateLimit(
    database,
    `otp:ip:${ip}`,
    'otp_ip',
    OTP_MAX_ATTEMPTS,
    900 // 15 minutes
  );
  if (!rateLimitCheck.allowed) {
    throw createRouteError(429, 'Too many requests. Please try again later.');
  }
  
  // Create OTP
  const { otpId, otp, expiresAt } = await createOTPRecord(database, user.id, email, deviceFingerprint);
  
  // Send email
  const emailResult = await sendOTPEmail(env, email, otp, deviceName);
  
  // Log the event
  await logLoginEvent(database, user.id, email, 'otp_sent', deviceFingerprint, deviceName, ip, '', JSON.stringify({ otpId }));
  
  return {
    ok: true,
    message: 'Verification code sent.',
    email: maskEmail(email),
    expiresAt,
    emailSent: emailResult.sent,
  };
}

async function handleOTPVerify(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const otp = String(body?.otp || '').trim();
  const deviceFingerprint = String(body?.deviceFingerprint || '').trim();
  const deviceName = String(body?.deviceName || '').trim();
  const trustDevice = body?.trustDevice === true;
  const trustDays = Number(body?.trustDays) || DEVICE_TRUST_DEFAULT_DAYS;
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  if (!isValidOTPFormat(otp)) {
    throw createRouteError(400, 'Invalid verification code format.');
  }
  
  // Verify OTP
  const result = await verifyOTPRecord(database, email, otp, deviceFingerprint);
  if (!result.valid) {
    throw createRouteError(401, result.error);
  }
  
  // Get user details
  const user = await database
    .prepare('SELECT id, email, plan, role, status FROM auth_users WHERE id = ?1')
    .bind(result.userId)
    .first();
  if (!user) {
    throw createRouteError(404, 'User not found.');
  }
  
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  const userAgent = String(request.headers.get('User-Agent') || '').trim();
  
  // Trust device if requested
  let deviceId = null;
  let expiresAt = null;
  if (trustDevice && deviceFingerprint) {
    const trustResult = await addTrustedDevice(database, user.id, deviceFingerprint, deviceName, '{}', ip, userAgent, trustDays);
    deviceId = trustResult.deviceId;
    expiresAt = trustResult.expiresAt;
  }
  
  // Log the event
  await logLoginEvent(database, user.id, email, 'otp_verified', deviceFingerprint, deviceName, ip, userAgent, JSON.stringify({ deviceId }));
  
  return {
    ok: true,
    userId: user.id,
    email: user.email,
    plan: user.plan,
    role: user.role,
    status: user.status,
    deviceTrusted: trustDevice && !!deviceId,
    deviceId,
    deviceExpiresAt: expiresAt,
  };
}

async function handleOTPResend(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const deviceFingerprint = String(body?.deviceFingerprint || '').trim();
  const deviceName = String(body?.deviceName || '').trim();
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    return { ok: true, message: 'If an account exists, a verification code has been sent.' };
  }
  
  // Check cooldown
  const lastOTP = await database
    .prepare(`
      SELECT created_at FROM otp_codes
      WHERE user_id = ?1 AND otp_type = 'login'
      ORDER BY created_at DESC LIMIT 1
    `)
    .bind(user.id)
    .first();
  
  if (lastOTP?.created_at) {
    const elapsed = Date.now() - new Date(lastOTP.created_at).getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw createRouteError(429, `Please wait ${waitSeconds} seconds before requesting a new code.`);
    }
  }
  
  // Create new OTP
  const { otpId, otp, expiresAt } = await createOTPRecord(database, user.id, email, deviceFingerprint);
  
  // Send email
  const emailResult = await sendOTPEmail(env, email, otp, deviceName);
  
  // Log the event
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  await logLoginEvent(database, user.id, email, 'otp_resent', deviceFingerprint, deviceName, ip, '', JSON.stringify({ otpId }));
  
  return {
    ok: true,
    message: 'New verification code sent.',
    email: maskEmail(email),
    expiresAt,
    emailSent: emailResult.sent,
  };
}

// ---- Login Alert Endpoint ----

async function handleLoginAlert(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const deviceName = String(body?.deviceName || '').trim();
  const ipAddress = String(body?.ipAddress || '').trim();
  const loginTime = String(body?.loginTime || new Date().toISOString()).trim();
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  
  // Send login alert email
  const emailResult = await sendLoginAlertEmail(env, email, deviceName, ipAddress, loginTime);
  
  // Log the event
  const user = await database
    .prepare('SELECT id FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (user) {
    await logLoginEvent(database, user.id, email, 'login_alert_sent', '', deviceName, ipAddress, '', JSON.stringify({ loginTime }));
  }
  
  return {
    ok: true,
    message: 'Login alert sent.',
    emailSent: emailResult.sent,
  };
}

// ============================================================
// Product Pricing Management
// ============================================================

async function ensureProductPricingTable(database) {
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS product_pricing (
        id TEXT PRIMARY KEY,
        monthly_price REAL NOT NULL DEFAULT 2500,
        quarterly_price REAL NOT NULL DEFAULT 6000,
        bi_annual_price REAL NOT NULL DEFAULT 10000,
        annual_price REAL NOT NULL DEFAULT 18000,
        currency TEXT NOT NULL DEFAULT 'NGN',
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT ''
      )
    `);
  } catch (e) {
    console.error('[pricing] ensureProductPricingTable error:', e?.message || e);
  }
}

async function handleGetPricing(request, env) {
  try {
    const database = requireAuditDatabase(env);
    await ensureProductPricingTable(database);
    const result = await database
      .prepare('SELECT * FROM product_pricing WHERE id = ?1')
      .bind('default')
      .first();
    
    if (!result) {
      return {
        ok: true,
        pricing: {
          monthly: PAYMENT_PLAN_PRICES.monthly,
          quarterly: PAYMENT_PLAN_PRICES.quarterly,
          'bi-annual': PAYMENT_PLAN_PRICES['bi-annual'],
          annual: PAYMENT_PLAN_PRICES.annual,
          currency: 'NGN',
        },
      };
    }
    
    return {
      ok: true,
      pricing: {
        monthly: result.monthly_price,
        quarterly: result.quarterly_price,
        'bi-annual': result.bi_annual_price,
        annual: result.annual_price,
        currency: result.currency,
        updatedAt: result.updated_at,
        updatedBy: result.updated_by,
      },
    };
  } catch (e) {
    console.error('[pricing] handleGetPricing error:', e?.message || e);
    return { ok: false, error: e?.message || 'Failed to get pricing.' };
  }
}

async function handleUpdatePricing(request, env) {
  try {
    const database = requireAuditDatabase(env);
    await ensureProductPricingTable(database);
    const body = await readJsonBody(request);
  
  const monthly = Number(body?.monthly);
  const quarterly = Number(body?.quarterly);
  const biAnnual = Number(body?.['bi-annual']);
  const annual = Number(body?.annual);
  const currency = String(body?.currency || 'NGN').trim().toUpperCase();
  const updatedBy = String(body?.updatedBy || '').trim();
  
  if (!Number.isFinite(monthly) || monthly < 0) throw new Error('Invalid monthly price.');
  if (!Number.isFinite(quarterly) || quarterly < 0) throw new Error('Invalid quarterly price.');
  if (!Number.isFinite(biAnnual) || biAnnual < 0) throw new Error('Invalid bi-annual price.');
  if (!Number.isFinite(annual) || annual < 0) throw new Error('Invalid annual price.');
  
  const now = new Date().toISOString();
  
  await database
    .prepare(`
      INSERT INTO product_pricing (id, monthly_price, quarterly_price, bi_annual_price, annual_price, currency, updated_at, updated_by)
      VALUES ('default', ?1, ?2, ?3, ?4, ?5, ?6, ?7)
      ON CONFLICT(id) DO UPDATE SET
        monthly_price = ?1, quarterly_price = ?2, bi_annual_price = ?3,
        annual_price = ?4, currency = ?5, updated_at = ?6, updated_by = ?7
    `)
    .bind(monthly, quarterly, biAnnual, annual, currency, now, updatedBy)
    .run();
  
  return {
    ok: true,
    message: 'Pricing updated successfully.',
    pricing: {
      monthly,
      quarterly,
      'bi-annual': biAnnual,
      annual,
      currency,
      updatedAt: now,
      updatedBy,
    },
  };
  } catch (e) {
    console.error('[pricing] handleUpdatePricing error:', e?.message || e);
    return { ok: false, error: e?.message || 'Failed to update pricing.' };
  }
}

// ============================================================
// Device Trust Management
// ============================================================

const DEVICE_TRUST_DEFAULT_DAYS = 30;
const DEVICE_TRUST_MAX_DEVICES = 3;
const DEVICE_AUTH_RECOVERY_GRANT_TTL_MS = 15 * 60 * 1000;
const DEVICE_AUTH_RECOVERY_REASON_MAX_LENGTH = 300;

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function checkDeviceTrust(database, userId, deviceFingerprint) {
  const result = await database
    .prepare(`
      SELECT id, device_name, expires_at, last_used_at, is_permanent
      FROM trusted_devices
      WHERE user_id = ?1
        AND device_fingerprint = ?2
        AND revoked_at = ''
        AND (expires_at = '' OR expires_at > ?3)
      LIMIT 1
    `)
    .bind(userId, deviceFingerprint, new Date().toISOString())
    .first();
  return result || null;
}

async function addTrustedDevice(database, userId, deviceFingerprint, deviceName, deviceInfo, ip, userAgent, trustDays, isPermanent = false) {
  const days = trustDays || DEVICE_TRUST_DEFAULT_DAYS;
  const now = new Date().toISOString();
  const expiresAt = isPermanent ? '' : (days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : '');
  
  // Check device limit (skip for primary devices)
  if (!isPermanent) {
    const countResult = await database
      .prepare(`
        SELECT COUNT(*) as cnt FROM trusted_devices
        WHERE user_id = ?1 AND revoked_at = ''
      `)
      .bind(userId)
      .first();
    
    const currentCount = countResult?.cnt || 0;
    if (currentCount >= DEVICE_TRUST_MAX_DEVICES) {
      // Remove oldest non-primary device to make room
      const oldest = await database
        .prepare(`
          SELECT id FROM trusted_devices
          WHERE user_id = ?1 AND revoked_at = '' AND is_permanent = 0
          ORDER BY trusted_at ASC LIMIT 1
        `)
        .bind(userId)
        .first();
      if (oldest) {
        await database
          .prepare('DELETE FROM trusted_devices WHERE id = ?1')
          .bind(oldest.id)
          .run();
      }
    }
  }
  
  const deviceId = generateId();
  await database
    .prepare(`
      INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_name, device_info, ip_address, user_agent, trusted_at, expires_at, last_used_at, is_permanent)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    `)
    .bind(deviceId, userId, deviceFingerprint, deviceName || '', deviceInfo || '{}', ip || '', userAgent || '', now, expiresAt, now, isPermanent ? 1 : 0)
    .run();
  
  return { deviceId, expiresAt, isPermanent };
}

async function revokeDevice(database, deviceId, userId) {
  const now = new Date().toISOString();
  const result = await database
    .prepare(`
      UPDATE trusted_devices SET revoked_at = ?1
      WHERE id = ?2 AND user_id = ?3
    `)
    .bind(now, deviceId, userId)
    .run();
  return result.meta?.changes > 0;
}

async function revokeAllDevices(database, userId) {
  const now = new Date().toISOString();
  await database
    .prepare(`
      UPDATE trusted_devices SET revoked_at = ?1
      WHERE user_id = ?2 AND revoked_at = ''
    `)
    .bind(now, userId)
    .run();
}

async function listTrustedDevices(database, userId) {
  const result = await database
    .prepare(`
      SELECT id, device_name, device_info, ip_address, trusted_at, expires_at, last_used_at, is_permanent
      FROM trusted_devices
      WHERE user_id = ?1 AND revoked_at = ''
      ORDER BY last_used_at DESC
    `)
    .bind(userId)
    .all();
  return result.results || [];
}

async function logLoginEvent(database, userId, email, eventType, deviceFingerprint, deviceName, ip, userAgent, details) {
  const id = generateId();
  const now = new Date().toISOString();
  await database
    .prepare(`
      INSERT INTO login_audit_log (id, user_id, email, event_type, device_fingerprint, device_name, ip_address, user_agent, details, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `)
    .bind(id, userId, email, eventType, deviceFingerprint || '', deviceName || '', ip || '', userAgent || '', details || '{}', now)
    .run();
}

async function resolveDeviceActor(request, env, targetEmail, { allowAdmin = false } = {}) {
  const viewer = await resolveAuthenticatedContentUser(request, env);
  const viewerEmail = normalizeEmail(viewer?.email || '');
  const normalizedTargetEmail = normalizeEmail(targetEmail || '');
  if (!viewerEmail || !normalizedTargetEmail) {
    throw createRouteError(403, 'Authentication is required.');
  }
  if (String(viewer?.status || 'active').toLowerCase() !== 'active') {
    throw createRouteError(403, 'Your account is not active.');
  }
  if (viewerEmail === normalizedTargetEmail) return viewer;

  if (!allowAdmin) {
    throw createRouteError(403, 'You can only manage devices for your own account.');
  }
  // Admins may revoke or inspect a user's devices from the security dashboard.
  const admin = await verifyAdminCaller(request, env);
  return { ...admin, isAdmin: true };
}

async function consumeDeviceAuthRecoveryGrant(database, userId, deviceFingerprint) {
  const now = new Date().toISOString();
  const grant = await database
    .prepare(`
      SELECT id
      FROM device_auth_recovery_grants
      WHERE user_id = ?1
        AND consumed_at = ''
        AND revoked_at = ''
        AND expires_at > ?2
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .bind(userId, now)
    .first();
  if (!grant?.id) return false;

  const updated = await database
    .prepare(`
      UPDATE device_auth_recovery_grants
      SET consumed_at = ?2, consumed_device_fingerprint = ?3
      WHERE id = ?1
        AND consumed_at = ''
        AND revoked_at = ''
        AND expires_at > ?2
    `)
    .bind(String(grant.id), now, deviceFingerprint)
    .run();
  return Number(updated?.meta?.changes || 0) === 1;
}

async function handleAdminCreateDeviceAuthRecoveryGrant(request, env) {
  const admin = await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const reason = String(body?.reason || '').trim().slice(0, DEVICE_AUTH_RECOVERY_REASON_MAX_LENGTH);
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  if (reason.length < 8) {
    throw createRouteError(400, 'A brief support reason is required.');
  }

  const user = await database
    .prepare(`SELECT id, email, status FROM auth_users WHERE email = ?1 LIMIT 1`)
    .bind(email)
    .first();
  if (!user?.id) {
    throw createRouteError(404, 'Cloudflare login was not found for this user.');
  }
  if (String(user.status || 'active').toLowerCase() !== 'active') {
    throw createRouteError(409, 'Device recovery cannot be enabled for an inactive account.');
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + DEVICE_AUTH_RECOVERY_GRANT_TTL_MS).toISOString();
  await database
    .prepare(`
      UPDATE device_auth_recovery_grants
      SET revoked_at = ?2
      WHERE user_id = ?1 AND consumed_at = '' AND revoked_at = ''
    `)
    .bind(String(user.id), now)
    .run();
  await database
    .prepare(`
      INSERT INTO device_auth_recovery_grants (
        id, user_id, issued_by_user_id, issued_by_email, reason,
        created_at, expires_at, consumed_at, revoked_at, consumed_device_fingerprint
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, '', '', '')
    `)
    .bind(crypto.randomUUID(), String(user.id), String(admin?.id || ''), normalizeEmail(admin?.email || ''), reason, now, expiresAt)
    .run();
  await insertAuditLogRecord(database, {
    actorUserId: admin?.id,
    actorEmail: admin?.email,
    targetUserId: user.id,
    action: 'device_auth_recovery_issued',
    details: { expiresAt, reason },
  });

  return {
    ok: true,
    message: 'One-time device recovery is enabled for the user’s next authenticated login.',
    expiresAt,
  };
}

// ---- Admin Device Count Endpoint ----

async function handleAdminDeviceCount(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  
  const result = await database.prepare(
    `SELECT COUNT(*) as total FROM trusted_devices`
  ).first();
  
  return {
    ok: true,
    count: result?.total || 0,
  };
}

// ---- Admin All Devices Endpoint ----

async function handleAdminAllDevices(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  
  // Get all devices with user email in a single query
  const result = await database.prepare(`
    SELECT td.id, td.user_id, td.device_name, td.device_info, td.ip_address,
           td.trusted_at, td.expires_at, td.last_used_at, td.is_permanent,
           au.email
    FROM trusted_devices td
    JOIN auth_users au ON td.user_id = au.id
    ORDER BY td.trusted_at DESC
  `).all();
  
  const rows = Array.isArray(result?.results) ? result.results : [];
  return {
    ok: true,
    devices: rows.map(d => ({
      id: d.id,
      userId: d.user_id,
      email: String(d.email || ''),
      deviceName: d.device_name,
      deviceInfo: d.device_info,
      ipAddress: d.ip_address,
      trustedAt: d.trusted_at,
      expiresAt: d.expires_at,
      lastUsedAt: d.last_used_at,
      isPrimary: d.is_permanent === 1,
    })),
    total: rows.length,
  };
}

// ---- Activity Metrics Endpoint ----

async function handleAdminActivityMetrics(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Use auth_sessions.last_seen_at for activity metrics — this tracks actual
  // session activity rather than relying on login_audit_log which may have
  // sparse event_type='login_success' records.
  // Admin exclusion is handled client-side to keep queries simple and reliable.
  const [
    currentlyActive,
    hourlyActive,
    dailyActive,
    weeklyActive,
    monthlyActive,
    totalUsers,
    premiumUsers,
    verifiedUsers,
    unverifiedUsers,
    totalFeedback,
    openFeedback,
    totalSessions,
    totalTrustedDevices,
    recentLogins,
  ] = await Promise.all([
    // Currently active (session seen within last 5 minutes)
    database.prepare(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE last_seen_at >= ?1`
    ).bind(fiveMinAgo).first(),
    // Hourly active (session seen within last hour)
    database.prepare(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE last_seen_at >= ?1`
    ).bind(oneHourAgo).first(),
    // Daily active (session seen within last 24 hours)
    database.prepare(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE last_seen_at >= ?1`
    ).bind(twentyFourHoursAgo).first(),
    // Weekly active (session seen within last 7 days)
    database.prepare(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE last_seen_at >= ?1`
    ).bind(sevenDaysAgo).first(),
    // Monthly active (session seen within last 30 days)
    database.prepare(
      `SELECT COUNT(DISTINCT user_id) as count FROM auth_sessions WHERE last_seen_at >= ?1`
    ).bind(thirtyDaysAgo).first(),
    // User counts
    database.prepare(`SELECT COUNT(*) as count FROM auth_users`).first(),
    database.prepare(`SELECT COUNT(*) as count FROM auth_users WHERE plan = 'premium'`).first(),
    database.prepare(`SELECT COUNT(*) as count FROM auth_users WHERE email_verified = 1`).first(),
    database.prepare(`SELECT COUNT(*) as count FROM auth_users WHERE email_verified = 0 OR email_verified IS NULL`).first(),
    // Feedback counts
    database.prepare(`SELECT COUNT(*) as count FROM feedback_submissions`).first(),
    database.prepare(`SELECT COUNT(*) as count FROM feedback_submissions WHERE status != 'resolved' AND status != 'dismissed'`).first(),
    // Session and device counts
    database.prepare(`SELECT COUNT(*) as count FROM auth_sessions`).first(),
    database.prepare(`SELECT COUNT(*) as count FROM trusted_devices`).first(),
    // Recent logins (last 24h via login_audit_log)
    database.prepare(
      `SELECT COUNT(DISTINCT email) as count FROM login_audit_log WHERE created_at >= ?1`
    ).bind(twentyFourHoursAgo).first(),
  ]);
  
  return {
    ok: true,
    metrics: {
      currentlyActive: currentlyActive?.count || 0,
      hourlyActive: hourlyActive?.count || 0,
      dailyActive: dailyActive?.count || 0,
      weeklyActive: weeklyActive?.count || 0,
      monthlyActive: monthlyActive?.count || 0,
      totalUsers: totalUsers?.count || 0,
      premiumUsers: premiumUsers?.count || 0,
      verifiedUsers: verifiedUsers?.count || 0,
      unverifiedUsers: unverifiedUsers?.count || 0,
      totalFeedback: totalFeedback?.count || 0,
      openFeedback: openFeedback?.count || 0,
      totalSessions: totalSessions?.count || 0,
      totalTrustedDevices: totalTrustedDevices?.count || 0,
      recentLogins: recentLogins?.count || 0,
    },
  };
}

// ---- Active Users List Endpoint ----

const ACTIVITY_PERIOD_MAP = {
  'active-now': { interval: '5 minutes', label: 'Active Now' },
  'hourly': { interval: '60 minutes', label: 'Hourly Active' },
  'daily': { interval: '24 hours', label: 'Daily Active' },
  'weekly': { interval: '7 days', label: 'Weekly Active' },
  'monthly': { interval: '30 days', label: 'Monthly Active' },
};

async function handleActiveUsersList(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const adminEmails = parseAdminEmails(env.ADMIN_EMAILS || '');
  const adminEmailSet = new Set(Array.from(adminEmails).map(e => e.toLowerCase()));
  const url = new URL(request.url);
  const period = String(url.searchParams.get('period') || 'daily').trim();
  
  const periodConfig = ACTIVITY_PERIOD_MAP[period];
  if (!periodConfig) {
    throw createRouteError(400, 'Invalid period. Use: active-now, hourly, daily, weekly, monthly');
  }
  
  const now = new Date();
  let sinceDate;
  switch (period) {
    case 'active-now': sinceDate = new Date(now.getTime() - 5 * 60 * 1000); break;
    case 'hourly': sinceDate = new Date(now.getTime() - 60 * 60 * 1000); break;
    case 'daily': sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case 'weekly': sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case 'monthly': sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
  }
  const sinceIso = sinceDate.toISOString();
  
  // Get active users with their email and last seen time
  const result = await database.prepare(`
    SELECT DISTINCT
      s.user_id,
      u.email,
      u.plan,
      s.last_seen_at,
      s.user_agent,
      s.ip_address
    FROM auth_sessions s
    JOIN auth_users u ON s.user_id = u.id
    WHERE s.last_seen_at >= ?1
    ORDER BY s.last_seen_at DESC
  `).bind(sinceIso).all();
  
  const allRows = Array.isArray(result?.results) ? result.results : [];
  // Filter out admin users client-side
  const rows = allRows.filter(row => !adminEmailSet.has(String(row.email || '').toLowerCase()));
  
  return {
    ok: true,
    period,
    label: periodConfig.label,
    since: sinceIso,
    count: rows.length,
    users: rows.map(row => ({
      userId: row.user_id,
      email: row.email,
      plan: row.plan,
      lastSeenAt: row.last_seen_at,
      userAgent: row.user_agent || '',
      ipAddress: row.ip_address || '',
    })),
  };
}

// ---- Admin Audit Log Endpoint ----

async function handleAdminAuditLog(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const eventType = String(url.searchParams.get('eventType') || '').trim();
  
  let query = `
    SELECT id, user_id, email, event_type, device_name, ip_address, user_agent, details, created_at
    FROM login_audit_log
  `;
  const params = [];
  
  if (eventType) {
    query += ` WHERE event_type = ?1`;
    params.push(eventType);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?${params.length + 1}`;
  params.push(limit);
  
  const result = await database.prepare(query).bind(...params).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  
  return {
    ok: true,
    entries: rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      eventType: row.event_type,
      deviceName: row.device_name,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      details: row.details,
      createdAt: row.created_at,
    })),
    total: rows.length,
  };
}

// ---- Migration Endpoints ----

/**
 * Sync profile data from Firestore to Cloudflare D1.
 * Called silently after Firebase user logs in for the first time.
 */
async function handleMigrationSyncProfile(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const userId = String(body?.userId || '').trim();
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  
  // Find the Cloudflare user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  
  if (!user) {
    return { ok: false, error: 'User not found in Cloudflare auth.' };
  }
  
  // Try to read profile from Firestore
  let profileData = null;
  try {
    const profileUrl = firestoreDocumentUrl(env, `profiles/${encodeURIComponent(userId || user.id)}`);
    const profileDoc = await firestoreRequest(env, profileUrl);
    if (profileDoc?.fields) {
      profileData = {
        plan: profileDoc.fields.plan?.stringValue || 'free',
        billingCycle: profileDoc.fields.billingCycle?.stringValue || '',
        planExpiresAt: profileDoc.fields.planExpiresAt?.timestampValue || '',
      };
    }
  } catch (err) {
    console.warn('[migration] Could not read Firestore profile:', err.message);
  }
  
  // Update D1 user with profile data if available
  if (profileData) {
    const nowIso = new Date().toISOString();
    await database
      .prepare('UPDATE auth_users SET plan = ?2, updated_at = ?3 WHERE id = ?1')
      .bind(user.id, profileData.plan || 'free', nowIso)
      .run();
    
    console.log('[migration] Synced profile for:', email, 'plan:', profileData.plan);
    return { ok: true, synced: true, plan: profileData.plan };
  }
  
  return { ok: true, synced: false, reason: 'no_firestore_profile' };
}

/**
 * Get migration statistics for the admin dashboard.
 * Shows total Firebase users, Cloudflare users, migrated, and pending.
 */
async function handleMigrationStats(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  
  // Count Cloudflare users
  const cfResult = await database
    .prepare('SELECT COUNT(*) as count FROM auth_users')
    .first();
  const cloudflareCount = cfResult?.count || 0;
  
  // Count Cloudflare users that were migrated (have legacy_provider set)
  const migratedResult = await database
    .prepare("SELECT COUNT(*) as count FROM auth_users WHERE legacy_provider != '' OR legacy_user_id != ''")
    .first();
  const migratedCount = migratedResult?.count || 0;
  
  // Try to get Firebase user count from Identity Toolkit API
  let firebaseCount = 0;
  let firebaseError = null;
  try {
    const lookup = await identityAdminRequest(env, 'accounts:lookup', { body: {} });
    firebaseCount = Array.isArray(lookup?.users) ? lookup.users.length : 0;
  } catch (err) {
    firebaseError = err.message;
    // If we can't reach Firebase, estimate from merged user list
    try {
      const allUsers = await listCloudflareAuthUsers(env);
      firebaseCount = allUsers.length; // At minimum, we have this many
    } catch {}
  }
  
  // Calculate pending (users in Firebase but not in Cloudflare)
  const pendingCount = Math.max(0, firebaseCount - cloudflareCount);
  
  return {
    ok: true,
    stats: {
      totalFirebase: firebaseCount,
      totalCloudflare: cloudflareCount,
      migrated: migratedCount,
      pending: pendingCount,
      percentage: cloudflareCount > 0 ? Math.round((migratedCount / Math.max(firebaseCount, 1)) * 100) : 0,
    },
    firebaseError,
  };
}

// ---- Firestore-to-D1 Migration Endpoints ----

async function handleFirestoreToD1Migration(request, env) {
  const admin = await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const collection = String(body?.collection || 'all').trim();
  
  const results = {};
  
  if (collection === 'all' || collection === 'profiles') {
    try {
      results.profiles = await migrateProfilesToD1(env);
    } catch (err) {
      results.profiles = { error: err.message };
    }
  }
  
  if (collection === 'all' || collection === 'payments') {
    try {
      results.payments = await migratePaymentsToD1(env);
    } catch (err) {
      results.payments = { error: err.message };
    }
  }
  
  await insertAuditLogRecord(requireAuditDatabase(env), {
    actorUserId: admin?.id,
    actorEmail: admin?.email,
    action: 'firestore_to_d1_migration',
    details: { collection, results },
  });
  
  return { ok: true, results };
}

async function handleD1MigrationStatus(request, env) {
  await verifyAdminCaller(request, env);
  const database = requireAuditDatabase(env);
  const status = await getMigrationStatus(database);
  return { ok: true, status };
}

// ---- Device Trust Endpoints ----

async function handleDeviceCheck(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const deviceFingerprint = String(body?.deviceFingerprint || '').trim();
  const deviceName = String(body?.deviceName || '').trim();
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  if (!deviceFingerprint) {
    throw createRouteError(400, 'deviceFingerprint is required.');
  }
  await resolveDeviceActor(request, env, email);
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    return { ok: true, trusted: false, reason: 'user_not_found' };
  }
  
  // Check if user has any trusted devices
  const deviceCount = await database
    .prepare("SELECT COUNT(*) as cnt FROM trusted_devices WHERE user_id = ?1 AND revoked_at = ''")
    .bind(user.id)
    .first();
  const hasDevices = (deviceCount?.cnt || 0) > 0;
  
  // Check device trust
  const trustedDevice = await checkDeviceTrust(database, user.id, deviceFingerprint);
  
  if (trustedDevice) {
    // Update last_used_at
    await database
      .prepare('UPDATE trusted_devices SET last_used_at = ?1 WHERE id = ?2')
      .bind(new Date().toISOString(), trustedDevice.id)
      .run();
    
    return {
      ok: true,
      trusted: true,
      isPrimary: trustedDevice.is_permanent === 1,
      deviceId: trustedDevice.id,
      deviceName: trustedDevice.device_name,
      expiresAt: trustedDevice.expires_at,
      lastUsedAt: trustedDevice.last_used_at,
    };
  }

  // A support-issued grant is consumed atomically and applies only to this
  // authenticated user's current device. It never disables device auth globally.
  if (await consumeDeviceAuthRecoveryGrant(database, user.id, deviceFingerprint)) {
    const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
    const userAgent = String(request.headers.get('User-Agent') || '').trim();
    const trustResult = await addTrustedDevice(
      database, user.id, deviceFingerprint, deviceName || 'Recovery Device', '{}', ip, userAgent, DEVICE_TRUST_DEFAULT_DAYS
    );
    await logLoginEvent(
      database, user.id, email, 'device_auth_recovery_consumed', deviceFingerprint,
      deviceName, ip, userAgent, JSON.stringify({ deviceId: trustResult.deviceId })
    );
    await insertAuditLogRecord(database, {
      actorUserId: user.id,
      actorEmail: email,
      targetUserId: user.id,
      action: 'device_auth_recovery_consumed',
      details: { deviceId: trustResult.deviceId },
    });
    return {
      ok: true,
      trusted: true,
      recoveryUsed: true,
      deviceId: trustResult.deviceId,
      deviceName: deviceName || 'Recovery Device',
      expiresAt: trustResult.expiresAt,
      lastUsedAt: new Date().toISOString(),
    };
  }
  
  // First device for this user: auto-register as primary (no OTP needed)
  if (!hasDevices) {
    const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
    const userAgent = String(request.headers.get('User-Agent') || '').trim();
    const trustResult = await addTrustedDevice(
      database, user.id, deviceFingerprint, deviceName || 'Primary Device', '{}', ip, userAgent, 0, true
    );
    return {
      ok: true,
      trusted: true,
      isPrimary: true,
      deviceId: trustResult.deviceId,
      deviceName: deviceName || 'Primary Device',
      expiresAt: '',
      lastUsedAt: new Date().toISOString(),
    };
  }
  
  return { ok: true, trusted: false, isPrimary: false, reason: 'new_device' };
}

async function handleDeviceTrust(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  const deviceFingerprint = String(body?.deviceFingerprint || '').trim();
  const deviceName = String(body?.deviceName || '').trim();
  const deviceInfo = String(body?.deviceInfo || '{}');
  const trustDays = Number(body?.trustDays) || DEVICE_TRUST_DEFAULT_DAYS;
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  if (!deviceFingerprint) {
    throw createRouteError(400, 'deviceFingerprint is required.');
  }
  await resolveDeviceActor(request, env, email);
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    throw createRouteError(404, 'User not found.');
  }
  
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  const userAgent = String(request.headers.get('User-Agent') || '').trim();
  
  // Add trusted device
  const result = await addTrustedDevice(database, user.id, deviceFingerprint, deviceName, deviceInfo, ip, userAgent, trustDays);
  
  // Log the event
  await logLoginEvent(database, user.id, email, 'device_trusted', deviceFingerprint, deviceName, ip, userAgent, JSON.stringify({ deviceId: result.deviceId }));
  
  return {
    ok: true,
    deviceId: result.deviceId,
    expiresAt: result.expiresAt,
    message: `Device trusted for ${trustDays} days.`,
  };
}

async function handleDeviceRevoke(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const deviceId = String(body?.deviceId || '').trim();
  const email = normalizeEmail(body?.email || '');
  
  if (!deviceId) {
    throw createRouteError(400, 'deviceId is required.');
  }
  await resolveDeviceActor(request, env, email, { allowAdmin: true });
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    throw createRouteError(404, 'User not found.');
  }
  
  const revoked = await revokeDevice(database, deviceId, user.id);
  if (!revoked) {
    throw createRouteError(404, 'Device not found.');
  }
  
  // Log the event
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  const userAgent = String(request.headers.get('User-Agent') || '').trim();
  await logLoginEvent(database, user.id, email, 'device_revoked', '', '', ip, userAgent, JSON.stringify({ deviceId }));
  
  return { ok: true, message: 'Device revoked successfully.' };
}

async function handleDeviceRevokeAll(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || '');
  
  if (!email || !email.includes('@')) {
    throw createRouteError(400, 'email is required.');
  }
  await resolveDeviceActor(request, env, email);
  
  // Find user
  const user = await database
    .prepare('SELECT id, email FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    throw createRouteError(404, 'User not found.');
  }
  
  await revokeAllDevices(database, user.id);
  
  // Log the event
  const ip = String(request.headers.get('CF-Connecting-IP') || '').trim();
  const userAgent = String(request.headers.get('User-Agent') || '').trim();
  await logLoginEvent(database, user.id, email, 'all_devices_revoked', '', '', ip, userAgent, '{}');
  
  return { ok: true, message: 'All devices revoked successfully.' };
}

async function handleDeviceList(request, env) {
  const database = requireAuditDatabase(env);
  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get('email') || '');

  if (email) {
    await resolveDeviceActor(request, env, email, { allowAdmin: true });
  }
  
  // Admin mode: return all devices across all users
  if (!email || !email.includes('@')) {
    const callerEmail = await verifyAdminCaller(request, env);
    const result = await database.prepare(
      `SELECT COUNT(*) as total FROM trusted_devices`
    ).first();
    return {
      ok: true,
      devices: [],
      count: result?.total || 0,
      maxDevices: DEVICE_TRUST_MAX_DEVICES,
    };
  }
  
  // User mode: return devices for specific user
  const user = await database
    .prepare('SELECT id FROM auth_users WHERE email = ?1')
    .bind(email)
    .first();
  if (!user) {
    throw createRouteError(404, 'User not found.');
  }
  
  const devices = await listTrustedDevices(database, user.id);
  
  return {
    ok: true,
    devices: devices.map(d => ({
      id: d.id,
      deviceName: d.device_name,
      deviceInfo: d.device_info,
      ipAddress: d.ip_address,
      trustedAt: d.trusted_at,
      expiresAt: d.expires_at,
      lastUsedAt: d.last_used_at,
      isPermanent: d.is_permanent === 1,
    })),
    count: devices.length,
    maxDevices: DEVICE_TRUST_MAX_DEVICES,
  };
}

export function resolveRouteHandler(path) {
  if (path.endsWith("/auth/password/request")) return handleAuthPasswordRecoveryRequest;
  if (path.endsWith("/progress")) return handleCloudflareProgress;
  if (path.endsWith("/content/topic-data")) return handleProtectedTopicData;
  if (path.endsWith("/feedback/submit")) return handleFeedbackSubmit;
  if (path.endsWith("/payment/verify")) return handlePaymentVerify;
  if (path.endsWith("/payment/history")) return handlePaymentHistory;
  if (path.endsWith("/payment/webhook/flutterwave")) return handlePaymentWebhook;
  if (path.endsWith("/payment/webhook/selar")) return handleSelarWebhook;
  if (path.endsWith("/payment/selar/verify")) return handleSelarPaymentVerify;
  // User-facing verification resend (no admin auth required) — check before hybrid auth
  if (path.endsWith("/auth/verification/resend")) return handleUserVerificationResend;
  const authRouteHandler = resolveHybridAuthRouteHandler(path);
  if (authRouteHandler) return authRouteHandler;
  if (path.endsWith("/adminListUsers")) return handleAdminListUsers;
  if (path.endsWith("/adminLookupUsers")) return handleAdminLookupUsers;
  if (path.endsWith("/adminSendVerificationEmail")) return handleAdminSendVerificationEmail;
  if (path.endsWith("/admin/device-auth-recovery")) return handleAdminCreateDeviceAuthRecoveryGrant;
  if (path.endsWith("/adminCreateCloudflareMigrationLink")) return handleAdminCreateCloudflareMigrationLink;
  if (path.endsWith("/auth/migration/bootstrap")) return handleAuthMigrationBootstrap;
  if (path.endsWith("/adminLogOperation")) return handleAdminLogOperation;
  if (path.endsWith("/adminListOperations")) return handleAdminListOperations;
  if (path.endsWith("/adminListPayments")) return handleAdminListPayments;
  if (path.endsWith("/adminDeletePayment")) return handleAdminDeletePayment;
  if (path.endsWith("/adminDeletePaymentsByEmail")) return handleAdminDeletePaymentsByEmail;
  if (path.endsWith("/adminFeedbackList")) return handleAdminFeedbackList;
  if (path.endsWith("/feedback/status")) return handleFeedbackStatusUpdate;
  if (path.endsWith("/feedback/userList")) return handleUserFeedbackList;
  if (path.endsWith("/adminSetUserStatus")) return handleAdminSetUserStatus;
  if (path.endsWith("/adminSetUserPlan")) return handleAdminSetUserPlan;
  if (path.endsWith("/adminDeleteUserById")) return handleAdminDeleteUserById;
  // OTP routes
  if (path.endsWith("/otp/request")) return handleOTPRequest;
  if (path.endsWith("/otp/verify")) return handleOTPVerify;
  if (path.endsWith("/otp/resend")) return handleOTPResend;
  // Login alert route
  if (path.endsWith("/login/alert")) return handleLoginAlert;
  // Pricing routes
  if (path.endsWith("/pricing/get")) return handleGetPricing;
  if (path.endsWith("/pricing/update")) return handleUpdatePricing;
  // Device trust routes
  if (path.endsWith("/device/check")) return handleDeviceCheck;
  if (path.endsWith("/device/trust")) return handleDeviceTrust;
  if (path.endsWith("/device/revoke")) return handleDeviceRevoke;
  if (path.endsWith("/device/revoke-all")) return handleDeviceRevokeAll;
  if (path.endsWith("/device/list")) return handleDeviceList;
  if (path.endsWith("/admin/device-count")) return handleAdminDeviceCount;
  if (path.endsWith("/admin/all-devices")) return handleAdminAllDevices;
  if (path.endsWith("/adminActivityMetrics")) return handleAdminActivityMetrics;
  if (path.endsWith("/adminActiveUsers")) return handleActiveUsersList;
  if (path.endsWith("/adminAuditLog")) return handleAdminAuditLog;
  if (path.endsWith("/migration/sync-profile")) return handleMigrationSyncProfile;
  if (path.endsWith("/migration/stats")) return handleMigrationStats;
  if (path.endsWith("/migration/firestore-to-d1")) return handleFirestoreToD1Migration;
  if (path.endsWith("/migration/d1-status")) return handleD1MigrationStatus;
  return null;
}
export default {
  async fetch(request, env, ctx) {
    const origin = resolveAllowedOrigin(request, env);
    const isPaymentWebhook = new URL(request.url).pathname.endsWith("/payment/webhook/flutterwave") ||
      new URL(request.url).pathname.endsWith("/payment/webhook/selar");

    if (isPaymentWebhook) {
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
      logWebhookEvent("info", "Incoming webhook request at root handler", {
        method: request.method,
        path: new URL(request.url).pathname,
        clientIp,
      });
    }

    if (request.method === "OPTIONS") {
      if (!origin) {
        return jsonResponse({ ok: false, error: "Origin not allowed." }, 403, "");
      }
      return withCorsHeaders(new Response(null, { status: 204 }), origin);
    }

    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return jsonResponse({ ok: false, error: "Method not allowed." }, 405, origin);
    }

    const url = new URL(request.url);
    const normalizedPath = url.pathname.replace(/\/+$/, "");

    // All browser-facing routes require an explicitly allowed Origin. Payment
    // webhooks are server-to-server and authenticate with their signatures.
    if (!origin && !isPaymentWebhook) {
      return jsonResponse({ ok: false, error: "Origin not allowed." }, 403, "");
    }

    const routeHandler = resolveRouteHandler(normalizedPath);
    if (!routeHandler) {
      return jsonResponse({ ok: false, error: "Route not found." }, 404, origin);
    }

    try {
      const payload = await routeHandler(request, env, ctx);
      if (isPaymentWebhook) {
        logWebhookEvent("info", "Webhook request completed", {
          path: normalizedPath,
          result: payload,
        });
      }
      return jsonResponse(payload, 200, origin);
    } catch (error) {
      const status = Number(error?.httpStatus || 0);
      const httpStatus = status > 0 ? status : 500;
      if (isPaymentWebhook) {
        logWebhookEvent("error", "Webhook request failed", {
          path: normalizedPath,
          httpStatus,
          error: error?.message,
        });
      }
      return jsonResponse(
        {
          ok: false,
          error: publicErrorMessage(error),
        },
        httpStatus,
        origin,
      );
    }
  },
};
