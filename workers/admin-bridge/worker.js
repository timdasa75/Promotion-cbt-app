import { buildPublicAuthUser, hashPassword, issueSession, parseBearerToken, resolveHybridAuthRouteHandler, sha256Base64Url, timingSafeEqual } from "./auth-hybrid.js";
const IDENTITY_TOOLKIT_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
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
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
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
  const authRouteHandler = resolveHybridAuthRouteHandler(path);
  if (authRouteHandler) return authRouteHandler;
  if (path.endsWith("/adminListUsers")) return handleAdminListUsers;
  if (path.endsWith("/adminLookupUsers")) return handleAdminLookupUsers;
  if (path.endsWith("/adminSendVerificationEmail")) return handleAdminSendVerificationEmail;
  if (path.endsWith("/adminCreateCloudflareMigrationLink")) return handleAdminCreateCloudflareMigrationLink;
  if (path.endsWith("/auth/migration/bootstrap")) return handleAuthMigrationBootstrap;
  if (path.endsWith("/adminLogOperation")) return handleAdminLogOperation;
  if (path.endsWith("/adminListOperations")) return handleAdminListOperations;
  if (path.endsWith("/adminSetUserStatus")) return handleAdminSetUserStatus;
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

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed." }, 405, origin || "*");
    }

    if (!origin && String(env.ALLOWED_ORIGINS || "").trim()) {
      return jsonResponse({ ok: false, error: "Origin not allowed." }, 403, "");
    }

    const url = new URL(request.url);
    const routeHandler = resolveRouteHandler(url.pathname.replace(/\/+$/, ""));
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
          error: String(error?.message || "Unauthorized"),
        },
        Number(error?.httpStatus || 403),
        origin || "*",
      );
    }
  },
};


