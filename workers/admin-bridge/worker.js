import { buildPublicAuthUser, getAuthUserById, hashPassword, issueSession, parseBearerToken, readSessionRecord, resolveHybridAuthRouteHandler, sha256Base64Url, timingSafeEqual, touchSession } from "./auth-hybrid.js";
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
  if (!emails.length) {
    throw new Error("ADMIN_EMAILS is not configured.");
  }
  return new Set(emails);
}

function resolveAllowedOrigin(request, env) {
  const configured = Array.from(parseCsvSet(env.ALLOWED_ORIGINS || "", []));
  if (!configured.length) {
    return "*";
  }
  if (configured.includes("*")) {
    return "*";
  }
  const origin = String(request.headers.get("origin") || "").trim();
  if (!origin) return "";
  return configured.includes(origin) ? origin : "";
}

function withCorsHeaders(response, origin) {
  response.headers.set("Access-Control-Allow-Origin", origin || "*");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, verif-hash");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function jsonResponse(body, status = 200, origin = "*") {
  return withCorsHeaders(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }),
    origin,
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
      SELECT id, email, role, plan, status, email_verified, created_at, last_login_at
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
    throw new Error("Cloudflare auth database is not configured.");
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

async function verifyAdminCaller(request, env) {
  const header = String(request.headers.get("authorization") || "");
  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token.");
  }

  const allowedAdmins = parseAdminEmails(env.ADMIN_EMAILS || "");

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
      throw new Error(cloudflareError?.message || firebaseError?.message || "Admin access denied.");
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
    throw new Error("Cloudflare auth database is not configured.");
  }

  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  const role = String(body?.role || "user").trim().toLowerCase() === "admin" ? "admin" : "user";
  const plan = String(body?.plan || "free").trim().toLowerCase() === "premium" ? "premium" : "free";
  const status = String(body?.status || "active").trim().toLowerCase() === "suspended" ? "suspended" : "active";
  const emailVerified = Boolean(body?.emailVerified);
  const continueUrl = String(body?.continueUrl || "").trim();
  if (!email || !email.includes("@")) {
    throw new Error("email is required.");
  }

  const nowIso = new Date().toISOString();
  let user = await database
    .prepare(`
      SELECT id, email, password_hash, role, plan, status, email_verified
      FROM auth_users
      WHERE email = ?1
      LIMIT 1
    `)
    .bind(email)
    .first();

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
    throw new Error('continueUrl is required to build the migration link.');
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
}

async function handleAuthMigrationBootstrap(request, env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw new Error("Cloud auth database is not configured.");
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
    throw new Error("Authenticated user could not be resolved.");
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

  const merged = new Map();
  firebaseUsers.forEach((entry) => {
    const email = normalizeEmail(entry?.email || "");
    if (!email) return;
    merged.set(email, entry);
  });

  const cloudflareUsers = await listCloudflareAuthUsers(env);
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
    throw new Error("email is required.");
  }

  const payload = {
    requestType: "VERIFY_EMAIL",
    email,
  };
  const continueUrl = String(body?.continueUrl || "").trim();
  if (continueUrl) {
    payload.continueUrl = continueUrl;
  }

  await identityAdminRequest(env, "accounts:sendOobCode", {
    body: payload,
  });

  return {
    ok: true,
    delivered: true,
    warning: "Verification email requested from Firebase Auth.",
  };
}

async function handleAuthPasswordRecoveryRequest(request, env) {
  const database = requireAuditDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  if (!email || !email.includes("@")) {
    throw new Error("email is required.");
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

  return {
    ok: true,
    accepted: true,
    warning: "If this email matches an account, recovery instructions will follow shortly.",
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
  };
}

async function verifyFlutterwaveTransaction(env, transactionId) {
  const secretKey = requireEnv(env, "FLW_SECRET_KEY");
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Flutterwave verification failed.");
  }
  return payload;
}

function assertVerifiedFlutterwavePayment(flwPayload, { planCycle, txRef = "", email = "" } = {}) {
  const data = flwPayload?.data || {};
  const status = String(data.status || "").trim().toLowerCase();
  const topStatus = String(flwPayload?.status || "").trim().toLowerCase();
  if (topStatus && topStatus !== "success") {
    throw new Error("Flutterwave verification did not succeed.");
  }
  if (status !== "successful") {
    throw new Error("Flutterwave transaction is not successful.");
  }
  const expectedAmount = PAYMENT_PLAN_PRICES[planCycle];
  const paidAmount = Number(data.amount || 0);
  if (!Number.isFinite(paidAmount) || Math.round(paidAmount) !== expectedAmount) {
    throw new Error("Flutterwave transaction amount does not match the selected plan.");
  }
  if (String(data.currency || "").trim().toUpperCase() !== "NGN") {
    throw new Error("Flutterwave transaction currency is invalid.");
  }
  const verifiedTxRef = String(data.tx_ref || "").trim();
  if (txRef && verifiedTxRef && verifiedTxRef !== txRef) {
    throw new Error("Flutterwave transaction reference mismatch.");
  }
  const customerEmail = readFlutterwaveCustomerEmail(data);
  if (email && customerEmail && customerEmail !== normalizeEmail(email)) {
    throw new Error("Flutterwave customer email does not match the signed-in account.");
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
}

async function patchCloudflareUserPaymentPlan(env, userId) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function" || !userId) return;
  await database
    .prepare("UPDATE auth_users SET plan = 'premium', updated_at = ?2 WHERE id = ?1")
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

async function handleSelarWebhook(request, env) {
  const body = await readJsonBody(request);

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
  const expiresAt = calculatePaymentExpiry(planCycle);
  const now = new Date().toISOString();
  const paymentId = `selar_${orderRef || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`;

  const receipt = {
    paymentId,
    userId,
    email,
    amount,
    currency,
    billingCycle: planCycle,
    plan: "premium",
    selarOrderRef: orderRef,
    selarProductName: productName,
    status: "successful",
    createdAt: now,
    expiresAt,
  };

  await patchSelarPaymentProfile(env, userId, receipt);
  await patchCloudflareUserPaymentPlan(env, userId).catch(() => {});

  try {
    await writePaymentRecord(env, receipt);
  } catch (_) {}

  return { ok: true, processed: true };
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
}

async function listPaymentRecords(env, filters = {}) {
  const pageSize = Math.max(1, Math.min(200, Number(filters.pageSize || 100) || 100));
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
  return rows
    .filter((row) => {
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
  if (!transactionId) throw createRouteError(400, "transactionId is required.");
  if (email !== normalizeEmail(user?.email || "")) {
    throw createRouteError(403, "Payment email must match the signed-in account.");
  }

  const flwPayload = await verifyFlutterwaveTransaction(env, transactionId);
  assertVerifiedFlutterwavePayment(flwPayload, { planCycle, txRef, email });
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

async function handlePaymentWebhook(request, env) {
  const expectedHash = requireEnv(env, "FLW_WEBHOOK_SECRET_HASH");
  const receivedHash = String(request.headers.get("verif-hash") || "").trim();
  if (!receivedHash || !timingSafeEqual(receivedHash, expectedHash)) {
    throw createRouteError(403, "Forbidden");
  }

  const event = await readJsonBody(request);
  const eventType = String(event?.event?.type || event?.event || "").trim().toLowerCase();
  const eventData = event?.data || {};
  const eventStatus = String(eventData?.status || "").trim().toLowerCase();
  if (eventType && eventType !== "charge.completed") {
    return { ok: true, ignored: true };
  }
  if (eventStatus !== "successful") {
    return { ok: true, ignored: true };
  }

  const transactionId = String(eventData.id || eventData.transaction_id || "").trim();
  if (!transactionId) return { ok: true, ignored: true };

  const meta = eventData.meta || {};
  const planCycle = normalizePaymentPlanCycle(meta.planCycle || meta.plan_cycle || "");
  if (!planCycle) return { ok: true, ignored: true };

  const flwPayload = await verifyFlutterwaveTransaction(env, transactionId);
  assertVerifiedFlutterwavePayment(flwPayload, { planCycle });
  const verifiedData = flwPayload?.data || {};
  const email = readFlutterwaveCustomerEmail(verifiedData);
  const cloudflareUser = await findCloudflareUserByEmail(env, email).catch(() => null);
  const userId = String(meta.userId || cloudflareUser?.id || "").trim();
  const expiresAt = calculatePaymentExpiry(planCycle);
  const receipt = buildPaymentReceipt({
    flwData: flwPayload,
    userId,
    email,
    planCycle,
    expiresAt,
  });

  if (userId) {
    await patchPaymentProfile(env, userId, receipt).catch(() => {});
    await patchCloudflareUserPaymentPlan(env, userId).catch(() => {});
  }
  await writePaymentRecord(env, receipt);
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

async function handleAdminSetUserStatus(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const userId = String(body?.userId || "").trim();
  const status = String(body?.status || "").trim().toLowerCase() === "suspended" ? "suspended" : "active";
  if (!userId) {
    throw new Error("userId is required.");
  }

  let authDisabledSynced = false;
  let warning = "";
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
      warning = `Could not sync Firebase Auth disabled flag: ${error?.message || "request failed."}`;
    }
  }

  await patchProfileStatus(env, userId, status);

  return {
    ok: true,
    userId,
    status,
    authDisabledSynced,
    warning,
  };
}

async function handleAdminSetUserPlan(request, env) {
  await verifyAdminCaller(request, env);
  const body = await readJsonBody(request);
  const userId = String(body?.userId || "").trim();
  const email = normalizeEmail(body?.email || "");
  const plan = normalizePlanValue(body?.plan || "free");
  if (!userId && !email) {
    throw new Error("userId or email is required.");
  }

  const nowIso = new Date().toISOString();
  let cloudflareUpdated = false;
  let resolvedUserId = userId;
  let resolvedEmail = email;
  const warnings = [];

  const database = env.AUTH_DB;
  if (database && typeof database.prepare === "function") {
    if (userId) {
      const result = await database
        .prepare("UPDATE auth_users SET plan = ?2, updated_at = ?3 WHERE id = ?1")
        .bind(userId, plan, nowIso)
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
          .prepare("UPDATE auth_users SET plan = ?2, updated_at = ?3 WHERE id = ?1")
          .bind(resolvedUserId, plan, nowIso)
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
    throw new Error("userId is required.");
  }

  let authDeleted = false;
  let profileDeleted = false;

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

  try {
    profileDeleted = await deleteProfileDocument(env, userId);
  } catch (error) {
    // Leave auth deletion result intact and surface profile cleanup failure as warning.
    return {
      ok: true,
      userId,
      authDeleted,
      profileDeleted: false,
      warning: `Auth updated, but profile cleanup failed: ${error?.message || "request failed."}`,
    };
  }

  return {
    ok: true,
    userId,
    authDeleted,
    profileDeleted,
  };
}

function resolveRouteHandler(path) {
  if (path.endsWith("/auth/password/request")) return handleAuthPasswordRecoveryRequest;
  if (path.endsWith("/progress")) return handleCloudflareProgress;
  if (path.endsWith("/content/topic-data")) return handleProtectedTopicData;
  if (path.endsWith("/payment/verify")) return handlePaymentVerify;
  if (path.endsWith("/payment/history")) return handlePaymentHistory;
  if (path.endsWith("/payment/webhook/flutterwave")) return handlePaymentWebhook;
  if (path.endsWith("/payment/webhook/selar")) return handleSelarWebhook;
  const authRouteHandler = resolveHybridAuthRouteHandler(path);
  if (authRouteHandler) return authRouteHandler;
  if (path.endsWith("/adminListUsers")) return handleAdminListUsers;
  if (path.endsWith("/adminLookupUsers")) return handleAdminLookupUsers;
  if (path.endsWith("/adminSendVerificationEmail")) return handleAdminSendVerificationEmail;
  if (path.endsWith("/adminCreateCloudflareMigrationLink")) return handleAdminCreateCloudflareMigrationLink;
  if (path.endsWith("/auth/migration/bootstrap")) return handleAuthMigrationBootstrap;
  if (path.endsWith("/adminLogOperation")) return handleAdminLogOperation;
  if (path.endsWith("/adminListOperations")) return handleAdminListOperations;
  if (path.endsWith("/adminListPayments")) return handleAdminListPayments;
  if (path.endsWith("/adminSetUserStatus")) return handleAdminSetUserStatus;
  if (path.endsWith("/adminSetUserPlan")) return handleAdminSetUserPlan;
  if (path.endsWith("/adminDeleteUserById")) return handleAdminDeleteUserById;
  return null;
}
export default {
  async fetch(request, env) {
    const origin = resolveAllowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (!origin && String(env.ALLOWED_ORIGINS || "").trim()) {
        return jsonResponse({ ok: false, error: "Origin not allowed." }, 403, "");
      }
      return withCorsHeaders(new Response("", { status: 204 }), origin || "*");
    }

    if (!["GET", "POST", "PATCH"].includes(request.method)) {
      return jsonResponse({ ok: false, error: "Method not allowed." }, 405, origin || "*");
    }

    const url = new URL(request.url);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    const isPaymentWebhook = normalizedPath.endsWith("/payment/webhook/flutterwave") || normalizedPath.endsWith("/payment/webhook/selar");

    if (!origin && String(env.ALLOWED_ORIGINS || "").trim() && !isPaymentWebhook) {
      return jsonResponse({ ok: false, error: "Origin not allowed." }, 403, "");
    }

    const routeHandler = resolveRouteHandler(normalizedPath);
    if (!routeHandler) {
      return jsonResponse({ ok: false, error: "Route not found." }, 404, origin || "*");
    }

    try {
      const payload = await routeHandler(request, env);
      return jsonResponse(payload, 200, origin || "*");
    } catch (error) {
      return jsonResponse(
        {
          ok: false,
          error: publicErrorMessage(error),
        },
        Number(error?.httpStatus || 403),
        origin || "*",
      );
    }
  },
};


