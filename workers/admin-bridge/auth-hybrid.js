import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email-sender.js";

const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_SALT_BYTES = 16;
const SESSION_SECRET_BYTES = 32;
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function isManualVerificationLinkAllowed(env) {
  return String(env.AUTH_ALLOW_MANUAL_VERIFICATION_LINKS || "").toLowerCase() === "true";
}

function buildEmailVerificationUrl(request, token, body = {}) {
  const baseUrl = String(body?.baseUrl || body?.continueUrl || request.headers.get("origin") || "").trim();
  if (!baseUrl) return "";
  const url = new URL(baseUrl);
  url.searchParams.set("verifyEmail", token);
  return url.toString();
}

async function createVerificationChallenge(database, userId, request, env, body = {}) {
  const tokenResult = await issueEmailToken(database, String(userId || ""), "verify_email", env);
  const allowManualLink = isManualVerificationLinkAllowed(env);
  const verificationUrl = allowManualLink ? buildEmailVerificationUrl(request, tokenResult.token, body) : "";
  
  // Send verification email if email sending is configured
  if (env.RESEND_API_KEY && body?.email) {
    try {
      const baseUrl = String(body?.baseUrl || body?.continueUrl || request.headers.get("origin") || "").trim();
      if (baseUrl && tokenResult.token) {
        await sendVerificationEmail(env, {
          email: body.email,
          name: body.name || "",
          token: tokenResult.token,
          baseUrl,
        });
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  }
  
  return {
    expiresAt: tokenResult.expiresAt,
    verificationUrl,
  };
}

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

export async function getAuthUserByEmail(database, email) {
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

export async function getAuthUserById(database, userId) {
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

export async function readSessionRecord(database, token) {
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

export async function touchSession(database, sessionId) {
  await database
    .prepare("UPDATE auth_sessions SET last_seen_at = ?2 WHERE session_id = ?1")
    .bind(sessionId, new Date().toISOString())
    .run();
}

async function deleteSession(database, sessionId) {
  await database.prepare("DELETE FROM auth_sessions WHERE session_id = ?1").bind(sessionId).run();
}

export async function issueEmailToken(database, userId, tokenType, env) {
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
    throw createHttpError(404, 'Link was not found.');
  }
  if (String(record.consumed_at || '').trim()) {
    throw createHttpError(410, 'This link has already been used.');
  }
  if (Date.parse(String(record.expires_at || '')) <= Date.now()) {
    throw createHttpError(410, 'This link has expired.');
  }

  const expectedHash = await sha256Base64Url(sessionSecret);
  if (!timingSafeEqual(expectedHash, String(record.token_secret_hash || ''))) {
    throw createHttpError(401, 'This link is invalid.');
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

export async function handleAuthVerificationComplete(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const token = String(body?.token || '').trim();
  if (!token) {
    throw createHttpError(400, 'Verification token is required.');
  }

  const record = await readEmailTokenRecord(database, token, 'verify_email');
  const nowIso = new Date().toISOString();
  await database
    .prepare('UPDATE auth_users SET email_verified = 1, updated_at = ?2 WHERE id = ?1')
    .bind(String(record.user_id || record.id || ''), nowIso)
    .run();

  await consumeEmailToken(database, record.token_id);
  return {
    ok: true,
    mode: 'cloudflare-auth',
    verified: true,
    email: normalizeEmail(record.email || ''),
    message: 'Email verified. You can now sign in.',
  };
}

export async function handleAuthPasswordResetComplete(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const token = String(body?.token || '').trim();
  const password = String(body?.password || '');
  if (!token) {
    throw createHttpError(400, 'Reset token is required.');
  }
  if (!password || password.length < 8) {
    throw createHttpError(400, 'Password must be at least 8 characters.');
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
    warning: 'Password reset successfully. You are now signed in.',
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

export const RATE_LIMIT = {
  LOGIN_EMAIL: { type: "login_email", max: 5, windowSec: 300 },
  LOGIN_IP: { type: "login_ip", max: 20, windowSec: 300 },
  REGISTER_IP: { type: "register_ip", max: 5, windowSec: 3600 },
  RECOVERY_IP: { type: "recovery_ip", max: 3, windowSec: 900 },
};

export async function checkRateLimit(database, bucketKey, bucketType, maxAttempts, windowSec) {
  const now = Date.now();
  const row = await database
    .prepare("SELECT window_started_at, count FROM auth_rate_limits WHERE bucket_key = ?1")
    .bind(bucketKey)
    .first();
  if (!row) {
    await database
      .prepare("INSERT INTO auth_rate_limits (bucket_key, bucket_type, window_started_at, count) VALUES (?1, ?2, ?3, 1)")
      .bind(bucketKey, bucketType, new Date(now).toISOString())
      .run();
    return { allowed: true };
  }
  const windowStart = Date.parse(String(row.window_started_at || ""));
  if (!Number.isFinite(windowStart) || (now - windowStart) >= windowSec * 1000) {
    await database
      .prepare("UPDATE auth_rate_limits SET window_started_at = ?2, count = 1 WHERE bucket_key = ?1")
      .bind(bucketKey, new Date(now).toISOString())
      .run();
    return { allowed: true };
  }
  if (Number(row.count) >= maxAttempts) {
    const retryAfter = Math.ceil((windowStart + windowSec * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  await database
    .prepare("UPDATE auth_rate_limits SET count = count + 1 WHERE bucket_key = ?1")
    .bind(bucketKey)
    .run();
  return { allowed: true };
}

async function resetRateLimit(database, bucketKey) {
  await database
    .prepare("DELETE FROM auth_rate_limits WHERE bucket_key = ?1")
    .bind(bucketKey)
    .run();
}

export async function handleAuthRegister(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  await validateTurnstile(request, env, body?.turnstileToken);

  const ip = String(request.headers.get("CF-Connecting-IP") || "").trim();
  const regIpBucket = `register:ip:${ip}`;
  const regCheck = await checkRateLimit(
    database,
    regIpBucket,
    RATE_LIMIT.REGISTER_IP.type,
    RATE_LIMIT.REGISTER_IP.max,
    RATE_LIMIT.REGISTER_IP.windowSec,
  );
  if (!regCheck.allowed) {
    const retryAfter = regCheck.retryAfter ? ` Try again in ${regCheck.retryAfter} seconds.` : " Try again later.";
    throw createHttpError(429, `Too many registration attempts from this IP.${retryAfter}`);
  }

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
  const verification = await createVerificationChallenge(database, userId, request, env, body);

  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser({ ...user, email_verified: 0 }),
    requiresEmailVerification: true,
    verificationUrl: verification.verificationUrl,
    verificationExpiresAt: verification.expiresAt,
    message: verification.verificationUrl
      ? "Account created. Open the verification link below, then sign in."
      : "Account created, but no email sender is configured for Cloudflare auth. Ask an admin to send a verification link.",
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

  const ip = String(request.headers.get("CF-Connecting-IP") || "").trim();
  const emailBucket = `login:email:${email}`;
  const ipBucket = `login:ip:${ip}`;

  async function readLimit(bucketKey, cfg) {
    const row = await database
      .prepare("SELECT window_started_at, count FROM auth_rate_limits WHERE bucket_key = ?1")
      .bind(bucketKey)
      .first();
    if (!row) return { allowed: true };
    const windowStart = Date.parse(String(row.window_started_at || ""));
    const expired = !Number.isFinite(windowStart) || (Date.now() - windowStart) >= cfg.windowSec * 1000;
    if (expired) return { allowed: true, expired };
    if (Number(row.count) >= cfg.max) {
      const retryAfter = Math.ceil((windowStart + cfg.windowSec * 1000 - Date.now()) / 1000);
      return { allowed: false, retryAfter };
    }
    return { allowed: true };
  }
  async function incLimit(bucketKey) {
    const row = await database
      .prepare("SELECT window_started_at, count FROM auth_rate_limits WHERE bucket_key = ?1")
      .bind(bucketKey)
      .first();
    const now = new Date().toISOString();
    if (!row || !Number.isFinite(Date.parse(String(row.window_started_at || ""))) || (Date.now() - Date.parse(String(row.window_started_at || ""))) >= 300 * 1000) {
      await database
        .prepare("INSERT OR REPLACE INTO auth_rate_limits (bucket_key, bucket_type, window_started_at, count) VALUES (?1, ?2, ?3, 1)")
        .bind(bucketKey, "", now)
        .run();
    } else {
      await database
        .prepare("UPDATE auth_rate_limits SET count = count + 1 WHERE bucket_key = ?1")
        .bind(bucketKey)
        .run();
    }
  }

  const emailCheck = await readLimit(emailBucket, RATE_LIMIT.LOGIN_EMAIL);
  if (!emailCheck.allowed) {
    throw createHttpError(429, `Too many login attempts. Try again in ${emailCheck.retryAfter} seconds.`);
  }
  const ipCheck = await readLimit(ipBucket, RATE_LIMIT.LOGIN_IP);
  if (!ipCheck.allowed) {
    throw createHttpError(429, `Too many requests from this IP. Try again later.`);
  }

  const user = await getAuthUserByEmail(database, email);
  if (!user) {
    await incLimit(emailBucket);
    await incLimit(ipBucket);
    throw createHttpError(401, "Invalid email or password.");
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    await incLimit(emailBucket);
    await incLimit(ipBucket);
    throw createHttpError(401, "Invalid email or password.");
  }
  await resetRateLimit(database, emailBucket);
  if (String(user.status || "active").toLowerCase() !== "active") {
    throw createHttpError(403, "This account is not active.");
  }
  if (!Number(user.email_verified || 0)) {
    throw createHttpError(403, "Please verify your email before login. Check your inbox for the verification email.");
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

export async function handleAuthVerificationResend(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email || "");
  if (!email || !email.includes("@")) {
    throw createHttpError(400, "A valid email is required.");
  }

  const user = await getAuthUserByEmail(database, email);
  if (!user) {
    throw createHttpError(404, "No account found for this email.");
  }
  if (Number(user.email_verified || 0)) {
    throw createHttpError(409, "This email is already verified.");
  }

  const bucketKey = `verify:email:${email}`;
  const cooldownSec = 60;
  const row = await database
    .prepare("SELECT window_started_at, count FROM auth_rate_limits WHERE bucket_key = ?1")
    .bind(bucketKey)
    .first();
  if (row) {
    const ws = Date.parse(String(row.window_started_at || ""));
    const expired = !Number.isFinite(ws) || (Date.now() - ws) >= cooldownSec * 1000;
    if (!expired) {
      const retryAfter = Math.ceil((ws + cooldownSec * 1000 - Date.now()) / 1000);
      throw createHttpError(429, `Please wait ${retryAfter} seconds before requesting another verification email.`);
    }
  }
  const now = new Date().toISOString();
  await database
    .prepare("INSERT OR REPLACE INTO auth_rate_limits (bucket_key, bucket_type, window_started_at, count) VALUES (?1, ?2, ?3, 1)")
    .bind(bucketKey, "verify_email", now)
    .run();

  const verification = await createVerificationChallenge(database, String(user.id || ""), request, env, body);
  return {
    ok: true,
    delivered: false,
    verificationUrl: verification.verificationUrl,
    verificationExpiresAt: verification.expiresAt,
    message: verification.verificationUrl
      ? "Verification link created. Open it to verify your email, then sign in."
      : "Verification link created, but no email sender is configured for Cloudflare auth. Ask an admin to send it.",
  };
}

async function verifyGoogleToken(token, expectedClientId) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw createHttpError(400, "Malformed ID token.");
  }
  const [headerB64, payloadB64, sigB64] = parts;

  let header, payload;
  try {
    const decoder = new TextDecoder();
    header = JSON.parse(decoder.decode(base64UrlDecodeToBytes(headerB64)));
    payload = JSON.parse(decoder.decode(base64UrlDecodeToBytes(payloadB64)));
  } catch (err) {
    throw createHttpError(400, "Failed to decode ID token.");
  }

  const kid = header?.kid;
  if (!kid) {
    throw createHttpError(400, "Missing kid in token header.");
  }

  // Fetch JWKS
  const jwksRes = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!jwksRes.ok) {
    throw createHttpError(500, "Failed to retrieve Google certificate authority keys.");
  }
  const jwks = await jwksRes.json();
  const jwk = jwks?.keys?.find(k => k.kid === kid);
  if (!jwk) {
    throw createHttpError(400, "Google public key not found for kid.");
  }

  // Import JWK
  let key;
  try {
    key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
  } catch (err) {
    throw createHttpError(500, "Failed to import Google public key.");
  }

  // Verify signature
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = base64UrlDecodeToBytes(sigB64);
  const sigValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
  if (!sigValid) {
    throw createHttpError(401, "Google token signature verification failed.");
  }

  // Verify claims
  if (!["https://accounts.google.com", "accounts.google.com"].includes(payload?.iss)) {
    throw createHttpError(401, "Invalid issuer in Google token.");
  }
  if (payload?.aud !== expectedClientId) {
    throw createHttpError(401, "Google token audience mismatch.");
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload?.exp <= now) {
    throw createHttpError(401, "Google token expired.");
  }

  return {
    email: normalizeEmail(payload.email),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || "",
    sub: payload.sub,
  };
}

export async function handleAuthGoogle(request, env) {
  const database = requireAuthDatabase(env);
  const body = await readJsonBody(request);
  const credential = String(body?.credential || "").trim();
  if (!credential) {
    throw createHttpError(400, "Google credential token is required.");
  }

  const clientId = String(env.GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) {
    throw createHttpError(503, "Google sign-in is not configured.");
  }
  const decoded = await verifyGoogleToken(credential, clientId);

  const email = normalizeEmail(decoded.email);
  if (!email || !email.includes("@")) {
    throw createHttpError(400, "Google account does not have a valid email.");
  }
  const googleVerified = Boolean(decoded.emailVerified);

  let user = await getAuthUserByEmail(database, email);
  const nowIso = new Date().toISOString();

  if (user) {
    if (String(user.status || "active").toLowerCase() !== "active") {
      throw createHttpError(403, "This account is not active.");
    }
    if (!Number(user.email_verified || 0) && googleVerified) {
      // Only mark the email verified when Google confirms it (email_verified
      // claim true). Never assume verification from an unverified Google email.
      await database
        .prepare("UPDATE auth_users SET email_verified = 1, last_login_at = ?2, updated_at = ?2 WHERE id = ?1")
        .bind(user.id, nowIso)
        .run();
    } else {
      await database
        .prepare("UPDATE auth_users SET last_login_at = ?2, updated_at = ?2 WHERE id = ?1")
        .bind(user.id, nowIso)
        .run();
    }
  } else {
    // Register new user
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
        ) VALUES (?1, ?2, '', 'user', 'free', 'active', ?5, 'google', ?3, ?4, ?4, ?4)
      `)
      .bind(userId, email, decoded.sub, nowIso, googleVerified ? 1 : 0)
      .run();
    user = await getAuthUserById(database, userId);
  }

  const refreshedUser = await getAuthUserById(database, user.id);
  const session = await issueSession(database, user.id, request, env);

  return {
    ok: true,
    mode: "cloudflare-auth",
    user: buildPublicAuthUser(refreshedUser),
    session,
  };
}

export function resolveHybridAuthRouteHandler(path) {
  if (path.endsWith("/auth/register")) return handleAuthRegister;
  if (path.endsWith("/auth/login")) return handleAuthLogin;
  if (path.endsWith("/auth/google")) return handleAuthGoogle;
  if (path.endsWith("/auth/session")) return handleAuthSession;
  if (path.endsWith("/auth/logout")) return handleAuthLogout;
  if (path.endsWith("/auth/password/change")) return handleAuthPasswordChange;
  if (path.endsWith("/auth/password/complete")) return handleAuthPasswordResetComplete;
  if (path.endsWith("/auth/migration/resolve")) return handleAuthMigrationResolve;
  if (path.endsWith("/auth/migration/complete")) return handleAuthMigrationComplete;
  if (path.endsWith("/auth/verification/resend")) return handleAuthVerificationResend;
  if (path.endsWith("/auth/verification/complete")) return handleAuthVerificationComplete;
  return null;
}
