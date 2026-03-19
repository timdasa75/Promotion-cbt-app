import { clearSession, readSession, writeSession } from "./authStorage.js";
import { buildCloudUserFromAuthPayload, firebaseAuthRequest, firebaseRefreshToken } from "./authFirebaseTransport.js";
import { normalizeEmail } from "./authNormalization.js";

const TOKEN_REFRESH_SKEW_MS = 30 * 1000;

function getRuntimeFirebaseConfig() {
  const cfg = window.PROMOTION_CBT_AUTH || {};
  return {
    firebaseApiKey: String(cfg.firebaseApiKey || cfg.apiKey || "").trim(),
  };
}

export async function ensureCloudSessionActive(session = readSession(), { clearOnFailure = false } = {}) {
  if (!session || session.provider !== "firebase") return session;

  const expiresAt = Number(session.expiresAt || 0);
  if (expiresAt && expiresAt - Date.now() > TOKEN_REFRESH_SKEW_MS) {
    return session;
  }

  if (!session.refreshToken) {
    if (clearOnFailure) clearSession();
    return null;
  }

  try {
    const payload = await firebaseRefreshToken(session.refreshToken);
    const updated = {
      ...session,
      accessToken: String(payload.id_token || ""),
      refreshToken: String(payload.refresh_token || session.refreshToken || ""),
      expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
      user: {
        ...(session.user || {}),
        id: String(payload.user_id || session?.user?.id || ""),
        email: normalizeEmail(payload.user_email || session?.user?.email || ""),
      },
    };
    writeSession(updated);
    return updated;
  } catch (error) {
    if (clearOnFailure) clearSession();
    throw error;
  }
}

export async function lookupFirebaseUser(idToken) {
  const payload = await firebaseAuthRequest("accounts:lookup", {
    method: "POST",
    body: { idToken },
  });
  if (!Array.isArray(payload?.users) || !payload.users.length) {
    return null;
  }
  return payload.users[0];
}


export function writeCloudSessionFromAuthPayload(payload, userOverride = null) {
  const accessToken = String(payload?.idToken || "");
  const refreshToken = String(payload?.refreshToken || "");
  const expiresIn = Number(payload?.expiresIn || 0);
  const user = userOverride || buildCloudUserFromAuthPayload(payload);

  if (!accessToken || !refreshToken || !user?.id) {
    return null;
  }

  const sessionRecord = {
    provider: "firebase",
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
    createdAt: new Date().toISOString(),
  };
  writeSession(sessionRecord);
  return sessionRecord;
}
