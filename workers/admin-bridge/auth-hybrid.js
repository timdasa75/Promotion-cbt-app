const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_SALT_BYTES = 16;
const SESSION_SECRET_BYTES = 32;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function createHttpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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

function base64UrlDecodeToBytes(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function generateRandomBase64Url(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base64UrlEncodeBytes(bytes);
}

export function timingSafeEqual(left, right) {
  const leftBytes = typeof left === "string" ? new TextEncoder().encode(left) : left;
  const rightBytes = typeof right === "string" ? new TextEncoder().encode(right) : right;
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }
  return diff === 0;
}

export async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(value || "")),
  );
  return base64UrlEncodeBytes(digest);
}

async function derivePasswordHash(password, salt, iterations = PASSWORD_HASH_ITERATIONS) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password || "")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64UrlDecodeToBytes(salt),
      iterations,
    },
    passwordKey,
    256,
  );
  return base64UrlEncodeBytes(derivedBits);
}

export async function hashPassword(password) {
  const normalizedPassword = String(password || "");
  if (normalizedPassword.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters.");
  }
  const salt = generateRandomBase64Url(PASSWORD_SALT_BYTES);
  const derived = await derivePasswordHash(normalizedPassword, salt);
  return `${PASSWORD_HASH_ALGORITHM}$${PASSWORD_HASH_ITERATIONS}$${salt}$${derived}`;
}

export async function verifyPassword(password, storedHash) {
  const normalizedStored = String(storedHash || "").trim();
  if (!normalizedStored) {
    return false;
  }
  const [algorithm, iterationsRaw, salt, digest] = normalizedStored.split("$");
  if (algorithm !== PASSWORD_HASH_ALGORITHM || !iterationsRaw || !salt || !digest) {
    return false;
  }
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }
  const derived = await derivePasswordHash(String(password || ""), salt, iterations);
  return timingSafeEqual(derived, digest);
}

function requireAuthDatabase(env) {
  const database = env.AUTH_DB;
  if (!database || typeof database.prepare !== "function") {
    throw createHttpError(503, "Cloudflare auth database is not configured.");
  }
  return database;
}

async function readJsonBody(request) {
  const contentType = String(request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return {};
  }
  try {
    return (await request.json()) || {};
  } catch (error) {
    throw createHttpError(400, "Invalid JSON body.");
  }
}

export function buildPublicAuthUser(row) {
  return {
    id: String(row?.id || ""),
    email: normalizeEmail(row?.email || ""),
    role: String(row?.role || "user"),
    plan: String(row?.plan || "free"),
    status: String(row?.status || "active"),
    emailVerified: Boolean(Number(row?.email_verified || 0)),
    createdAt: String(row?.created_at || ""),
    lastLoginAt: String(row?.last_login_at || ""),
    legacyProvider: String(row?.legacy_provider || ""),
  };
}

export function parseBearerToken(request) {
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw createHttpError(401, "Authorization token is required.");
  }
  return authHeader.slice(7).trim();
}

function parseSessionToken(token) {
  const normalized = String(token || "").trim();
  const separatorIndex = normalized.indexOf(".");
  if (!normalized || separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    throw createHttpError(401, "Invalid session token.");
  }
  return {
    sessionId: normalized.slice(0, separatorIndex),
    sessionSecret: normalized.slice(separatorIndex + 1),
  };
}

function resolveSessionTtlSeconds(env) {
  const parsed = Number(env.AUTH_SESSION_TTL_SECONDS || DEFAULT_SESSION_TTL_SECONDS);
  if (!Number.isFinite(parsed) || parsed < 300) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }
  return Math.floor(parsed);
}

async function validateTurnstile(request, env, turnstileToken) {
  const secret = String(env.TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) {
    return { skipped: true };
  }
  if (!String(turnstileToken || "").trim()) {
    throw createHttpError(400, "Turnstile token is required.");
  }

  const form = new URLSearchParams({
    secret,
    response: String(turnstileToken || "").trim(),
  });
  const remoteIp = String(request.headers.get("CF-Connecting-IP") || "").trim();
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw createHttpError(400, "Turnstile verification failed.");
  }
  return payload;
}

async function getAuthUserByEmail(database, email) {
  return database
    .prepare(`
      SELECT id, email, password_hash, role, plan, status, email_verified, legacy_provider, legacy_user_id,
             created_at, updated_at, last_login_at
      FROM auth_users
      WHERE email = ?1
      LIMIT 1
    `)
    .bind(email)
    .first();
}

async function getAuthUserById(database, userId) {
  return database
    .prepare(`
      SELECT id, email, password_hash, role, plan, status, email_verified, legacy_provider, legacy_user_id,
             created_at, updated_at, last_login_at
      FROM auth_users
      WHERE id = ?1
      LIMIT 1
    `)
    .bind(userId)
    .first();
}

export async function issueSession(database, userId, request, env) {
  const sessionId = crypto.randomUUID();
  const sessionSecret = generateRandomBase64Url(SESSION_SECRET_BYTES);
  const refreshSecret = generateRandomBase64Url(SESSION_SECRET_BYTES);
  const sessionSecretHash = await sha256Base64Url(sessionSecret);
  const refreshSecretHash = await sha256Base64Url(refreshSecret);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + resolveSessionTtlSeconds(env) * 1000).toISOString();
  const userAgent = String(request.headers.get("user-agent") || "").slice(0, 500);
  const ipAddress = String(request.headers.get("CF-Connecting-IP") || "").slice(0, 100);

  await database
    .prepare(`
      INSERT INTO auth_sessions (
        session_id,
        user_id,
        session_secret_hash,
        refresh_secret_hash,
        created_at,
        expires_at,
        last_seen_at,
        user_agent,
        ip_address
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `)
    .bind(
      sessionId,
      userId,
      sessionSecretHash,
      refreshSecretHash,
      nowIso,
      expiresAt,
      nowIso,
      userAgent,
      ipAddress,
    )
    .run();

  return {
    token: `${sessionId}.${sessionSecret}`,
    expiresAt,
    createdAt: nowIso,
  };
}

async function readSessionRecord(database, token) {
  const { sessionId, sessionSecret } = parseSessionToken(token);
  const session = await database
    .prepare(`
      SELECT session_id, user_id, session_secret_hash, refresh_secret_hash, created_at, expires_at, last_seen_at
      FROM auth_sessions
      WHERE session_id = ?1
      LIMIT 1
    `)
    .bind(sessionId)
    .first();

  if (!session) {
    throw createHttpError(401, "Session not found.");
  }
  const expectedHash = await sha256Base64Url(sessionSecret);
  if (!timingSafeEqual(expectedHash, String(session.session_secret_hash || ""))) {
    throw createHttpError(401, "Session is invalid.");
  }
  if (Date.parse(String(session.expires_at || "")) <= Date.now()) {
    throw createHttpError(401, "Session expired.");
  }
  return session;
}

async function touchSession(database, sessionId) {
  await database
    .prepare("UPDATE auth_sessions SET last_seen_at = ?2 WHERE session_id = ?1")
    .bind(sessionId, new Date().toISOString())
    .run();
}

async function deleteSession(database, sessionId) {
  await database.prepare("DELETE FROM auth_sessions WHERE session_id = ?1").bind(sessionId).run();
}

async function issueEmailToken(database, userId, tokenType, env) {
  const tokenId = crypto.randomUUID();
  const tokenSecret = generateRandomBase64Url(SESSION_SECRET_BYTES);
  const tokenSecretHash = await sha256Base64Url(tokenSecret);
  const nowIso = new Date().toISOString();
  const ttlSeconds = Math.max(900, Number(env.AUTH_EMAIL_TOKEN_TTL_SECONDS || 60 * 60 * 24));
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await database
    .prepare(
      `DELETE FROM auth_email_tokens WHERE user_id = ?1 AND token_type = ?2 AND consumed_at = ''`
    )
    .bind(userId, tokenType)
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
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '')
    `)
    .bind(tokenId, userId, tokenType, tokenSecretHash, nowIso, expiresAt)
    .run();

  return {
    token: `${tokenId}.${tokenSecret}`,
    expiresAt,
    createdAt: nowIso,
  };
}

async function readEmailTokenRecord(database, token, tokenType = 'password_reset') {
  const { sessionId: tokenId, sessionSecret } = parseSessionToken(token);
  const record = await database
    .prepare(`
      SELECT t.token_id, t.user_id, t.token_type, t.token_secret_hash, t.created_at, t.expires_at, t.consumed_at,
             u.id, u.email, u.role, u.plan, u.status, u.email_verified, u.legacy_provider, u.created_at AS user_created_at,
             u.updated_at AS user_updated_at, u.last_login_at
      FROM auth_email_tokens t
      INNER JOIN auth_users u ON u.id = t.user_id
      WHERE t.token_id = ?1 AND t.token_type = ?2
      LIMIT 1
    `)
    .bind(tokenId, tokenType)
    .first();

  if (!record) {
    throw createHttpError(404, 'Migration link was not found.');
  }
  if (String(record.consumed_at || '').trim()) {
    throw createHttpError(410, 'This migration link has already been used.');
  }
  if (Date.parse(String(record.expires_at || '')) <= Date.now()) {
    throw createHttpError(410, 'This migration link has expired.');
  }

  const expectedHash = await sha256Base64Url(sessionSecret);
  if (!timingSafeEqual(expectedHash, String(record.token_secret_hash || ''))) {
    throw createHttpError(401, 'This migration link is invalid.');
  }

  return record;
}

async function consumeEmailToken(database, tokenId) {
  await database
    .prepare('UPDATE auth_email_tokens SET consumed_at = ?2 WHERE token_id = ?1')
    .bind(String(tokenId || ''), new Date().toISOString())
    .run();
}

export async function handleAuthMigrationResolve(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const token = String(body?.token || '').trim();
  if (!token) {
    throw createHttpError(400, 'Migration token is required.');
  }

  const record = await readEmailTokenRecord(database, token, 'password_reset');
  return {
    ok: true,
    mode: 'cloudflare-auth',
    migration: {
      email: normalizeEmail(record.email || ''),
      expiresAt: String(record.expires_at || ''),
      legacyProvider: String(record.legacy_provider || ''),
      role: String(record.role || 'user'),
      plan: String(record.plan || 'free'),
      status: String(record.status || 'active'),
    },
  };
}

export async function handleAuthMigrationComplete(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const token = String(body?.token || '').trim();
  const password = String(body?.password || '');
  if (!token) {
    throw createHttpError(400, 'Migration token is required.');
  }

  const record = await readEmailTokenRecord(database, token, 'password_reset');
  const passwordHash = await hashPassword(password);
  const nowIso = new Date().toISOString();

  await database
    .prepare('UPDATE auth_users SET password_hash = ?2, updated_at = ?3 WHERE id = ?1')
    .bind(String(record.user_id || record.id || ''), passwordHash, nowIso)
    .run();

  await consumeEmailToken(database, record.token_id);
  const session = await issueSession(database, String(record.user_id || record.id || ''), request, env);
  const user = await getAuthUserById(database, String(record.user_id || record.id || ''));

  return {
    ok: true,
    mode: 'cloudflare-auth',
    user: buildPublicAuthUser(user),
    session,
    warning: 'Password updated successfully. You are now signed in.',
  };
}

export async function handleAuthPasswordChange(request, env) {
  const database = requireAuthDatabase(env);
  const sessionToken = parseBearerToken(request);
  const body = await readJsonBody(request);
  const password = String(body?.password || '');
  const session = await readSessionRecord(database, sessionToken);
  const authUser = await getAuthUserById(database, String(session.user_id || ''));
  if (!authUser?.id) {
    throw createHttpError(401, 'Session user not found.');
  }

  const passwordHash = await hashPassword(password);
  const nowIso = new Date().toISOString();
  await database
    .prepare('UPDATE auth_users SET password_hash = ?2, updated_at = ?3 WHERE id = ?1')
    .bind(String(authUser.id), passwordHash, nowIso)
    .run();

  await deleteSession(database, String(session.session_id || ''));
  const rotatedSession = await issueSession(database, String(authUser.id), request, env);
  const refreshedUser = await getAuthUserById(database, String(authUser.id));

  return {
    ok: true,
    mode: 'cloudflare-auth',
    user: buildPublicAuthUser(refreshedUser),
    session: rotatedSession,
    warning: "Password updated successfully. You're still signed in.",
  };
}

export async function handleAuthRegister(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  await validateTurnstile(request, env, body?.turnstileToken);

  const email = normalizeEmail(body?.email || "");
  const password = String(body?.password || "");
  if (!email || !email.includes("@")) {
    throw createHttpError(400, "A valid email is required.");
  }

  const existing = await getAuthUserByEmail(database, email);
  if (existing) {
    throw createHttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

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
      ) VALUES (?1, ?2, ?3, 'user', 'free', 'active', 0, '', '', ?4, ?4, '')
    `)
    .bind(userId, email, passwordHash, nowIso)
    .run();

  const user = await getAuthUserById(database, userId);
  const session = await issueSession(database, userId, request, env);

  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser(user),
    session,
    warning: "Account created successfully. Email verification will be added in a later update.",
  };
}

export async function handleAuthLogin(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  await validateTurnstile(request, env, body?.turnstileToken);

  const email = normalizeEmail(body?.email || "");
  const password = String(body?.password || "");
  if (!email || !password) {
    throw createHttpError(400, "Email and password are required.");
  }

  const user = await getAuthUserByEmail(database, email);
  if (!user) {
    throw createHttpError(404, "Account not found in Cloudflare auth.");
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    throw createHttpError(401, "Invalid email or password.");
  }
  if (String(user.status || "active").toLowerCase() !== "active") {
    throw createHttpError(403, "This account is not active.");
  }

  const nowIso = new Date().toISOString();
  await database
    .prepare("UPDATE auth_users SET last_login_at = ?2, updated_at = ?2 WHERE id = ?1")
    .bind(user.id, nowIso)
    .run();

  const refreshedUser = await getAuthUserById(database, user.id);
  const session = await issueSession(database, user.id, request, env);
  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser(refreshedUser),
    session,
  };
}

export async function handleAuthSession(request, env) {
  const database = requireAuthDatabase(env);
  const sessionToken = parseBearerToken(request);
  const session = await readSessionRecord(database, sessionToken);
  await touchSession(database, session.session_id);
  const user = await getAuthUserById(database, session.user_id);
  if (!user) {
    throw createHttpError(401, "Session user not found.");
  }
  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser(user),
    session: {
      sessionId: String(session.session_id || ""),
      expiresAt: String(session.expires_at || ""),
      lastSeenAt: new Date().toISOString(),
    },
  };
}

export async function handleAuthLogout(request, env) {
  const database = requireAuthDatabase(env);
  const sessionToken = parseBearerToken(request);
  const session = await readSessionRecord(database, sessionToken);
  await deleteSession(database, session.session_id);
  return {
    ok: true,
    mode: "cloudflare-auth",
    loggedOut: true,
  };
}

export function resolveHybridAuthRouteHandler(path) {
  if (path.endsWith("/auth/register")) return handleAuthRegister;
  if (path.endsWith("/auth/login")) return handleAuthLogin;
  if (path.endsWith("/auth/session")) return handleAuthSession;
  if (path.endsWith("/auth/logout")) return handleAuthLogout;
  if (path.endsWith("/auth/password/change")) return handleAuthPasswordChange;
  if (path.endsWith("/auth/migration/resolve")) return handleAuthMigrationResolve;
  if (path.endsWith("/auth/migration/complete")) return handleAuthMigrationComplete;
  return null;
}

