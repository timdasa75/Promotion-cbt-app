import { normalizeEmail } from "./authNormalization.js";
import { getFirebaseConfig } from "./authRuntime.js";
import { writeSession } from "./authStorage.js";

function getCloudflareAuthBaseUrl() {
  const { cloudflareAuthBaseUrl } = getFirebaseConfig();
  if (!cloudflareAuthBaseUrl) {
    throw new Error("Cloudflare auth API is not configured.");
  }
  return cloudflareAuthBaseUrl;
}

function buildCloudflareAuthUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  if (!cleanPath) {
    throw new Error("Cloudflare auth path is required.");
  }
  return `${getCloudflareAuthBaseUrl()}/${cleanPath}`;
}

function buildCloudflareUser(user) {
  return {
    id: String(user?.id || "").trim(),
    name: String(user?.name || "").trim(),
    email: normalizeEmail(user?.email || ""),
    plan: String(user?.plan || "free").trim() || "free",
    createdAt: String(user?.createdAt || user?.created_at || "").trim(),
    lastSeenAt: String(user?.lastSeenAt || user?.last_seen_at || user?.lastLoginAt || "").trim(),
    emailVerified: Boolean(user?.emailVerified),
    role: String(user?.role || "").trim(),
    status: String(user?.status || "active").trim(),
    legacyProvider: String(user?.legacyProvider || user?.legacy_provider || "").trim(),
  };
}

export async function requestCloudflareAuth(path, {
  method = "POST",
  body = {},
  accessToken = "",
  fetchImpl = fetch,
} = {}) {
  const response = await fetchImpl(buildCloudflareAuthUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || payload?.message || "Cloudflare auth request failed.";
    const error = new Error(message);
    error.httpStatus = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function writeCloudflareSessionFromAuthPayload(payload, {
  writeSessionRecord = writeSession,
} = {}) {
  const token = String(payload?.session?.token || payload?.accessToken || "").trim();
  const expiresAt = Date.parse(String(payload?.session?.expiresAt || payload?.expiresAt || "").trim()) || 0;
  const user = buildCloudflareUser(payload?.user || {});
  if (!token || !user.id) {
    return null;
  }

  const sessionRecord = {
    provider: "cloudflare",
    accessToken: token,
    refreshToken: "",
    expiresAt,
    createdAt: String(payload?.session?.createdAt || new Date().toISOString()).trim(),
    user,
  };
  writeSessionRecord(sessionRecord);
  return sessionRecord;
}

export async function fetchCloudflareSession(accessToken, fetchImpl = fetch) {
  return requestCloudflareAuth("auth/session", {
    method: "POST",
    accessToken,
    fetchImpl,
  });
}

export async function logoutCloudflareSession(accessToken, fetchImpl = fetch) {
  return requestCloudflareAuth("auth/logout", {
    method: "POST",
    accessToken,
    fetchImpl,
  });
}


export async function resolveCloudflareMigrationToken(token, fetchImpl = fetch) {
  return requestCloudflareAuth("auth/migration/resolve", {
    method: "POST",
    body: { token: String(token || "").trim() },
    fetchImpl,
  });
}

export async function bootstrapCloudflareMigrationFromFirebase(accessToken, password, fetchImpl = fetch) {
  const payload = await requestCloudflareAuth("auth/migration/bootstrap", {
    method: "POST",
    accessToken,
    body: {
      password: String(password || ""),
    },
    fetchImpl,
  });
  const session = writeCloudflareSessionFromAuthPayload(payload);
  return {
    payload,
    session,
  };
}

export async function completeCloudflareMigrationToken(token, password, fetchImpl = fetch) {
  const payload = await requestCloudflareAuth("auth/migration/complete", {
    method: "POST",
    body: {
      token: String(token || "").trim(),
      password: String(password || ""),
    },
    fetchImpl,
  });
  const session = writeCloudflareSessionFromAuthPayload(payload);
  return {
    payload,
    session,
  };
}
