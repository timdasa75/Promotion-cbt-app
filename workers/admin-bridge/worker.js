const IDENTITY_TOOLKIT_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const FIRESTORE_BASE_URL = "https://firestore.googleapis.com/v1";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];

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
  return new Set(Array.from(parseCsvSet(value, DEFAULT_ADMIN_EMAILS)).map((entry) => normalizeEmail(entry)).filter(Boolean));
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

function fromFirebaseMillisToIso(value, fallback = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return new Date(numeric).toISOString();
}

async function verifyAdminCaller(request, env) {
  const header = String(request.headers.get("authorization") || "");
  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new Error("Missing bearer token.");
  }

  const payload = await identityAdminRequest(env, "accounts:lookup", {
    body: { idToken },
  });

  const user = Array.isArray(payload?.users) ? payload.users[0] : null;
  const email = normalizeEmail(user?.email || "");
  if (!email) {
    throw new Error("Authenticated user has no email.");
  }

  const allowedAdmins = parseAdminEmails(env.ADMIN_EMAILS || "");
  if (!allowedAdmins.has(email)) {
    throw new Error("Admin access denied.");
  }

  return {
    email,
    id: String(user?.localId || ""),
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

async function handleAdminListUsers(request, env) {
  await verifyAdminCaller(request, env);

  const users = [];
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
      users.push({
        id: String(entry?.localId || ""),
        email: normalizeEmail(entry?.email || ""),
        name: String(entry?.displayName || ""),
        emailVerified: Boolean(entry?.emailVerified),
        disabled: Boolean(entry?.disabled),
        createdAt: fromFirebaseMillisToIso(entry?.createdAt, ""),
        lastSignInAt: fromFirebaseMillisToIso(entry?.lastLoginAt, ""),
      });
    });

    pageToken = String(payload?.nextPageToken || "");
    loop += 1;
  } while (pageToken && loop < 50);

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
    returnOobLink: true,
  };
  const continueUrl = String(body?.continueUrl || "").trim();
  if (continueUrl) {
    payload.continueUrl = continueUrl;
  }

  const response = await identityAdminRequest(env, "accounts:sendOobCode", {
    body: payload,
  });

  const link = String(response?.oobLink || response?.link || response?.emailLink || "").trim();
  return {
    ok: true,
    delivered: true,
    ...(link ? { link, warning: `Verification link generated. Send it to the user: ${link}` } : {}),
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
  if (path.endsWith("/adminListUsers")) return handleAdminListUsers;
  if (path.endsWith("/adminLookupUsers")) return handleAdminLookupUsers;
  if (path.endsWith("/adminSendVerificationEmail")) return handleAdminSendVerificationEmail;
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
        403,
        origin || "*",
      );
    }
  },
};

