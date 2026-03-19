import { mapFirebaseAuthError } from "./authErrors.js";
import { normalizeEmail } from "./authNormalization.js";
import { getFirebaseConfig } from "./authRuntime.js";

export async function firebaseAuthRequest(endpoint, { method = "POST", body = null } = {}) {
  const { firebaseApiKey } = getFirebaseConfig();
  if (!firebaseApiKey) {
    throw new Error("Firebase configuration is missing.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Authentication request failed.";
    throw new Error(mapFirebaseAuthError(message));
  }

  return payload;
}

export async function firebaseRefreshToken(refreshToken) {
  const { firebaseApiKey } = getFirebaseConfig();
  if (!firebaseApiKey) {
    throw new Error("Firebase configuration is missing.");
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseApiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(String(refreshToken || ""))}`,
    },
  );

  let payload = {};
  try {
    payload = await response.json();
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Token refresh failed.";
    throw new Error(mapFirebaseAuthError(message));
  }

  return payload;
}

export function getFirestoreBaseUrl() {
  const { firebaseProjectId } = getFirebaseConfig();
  if (!firebaseProjectId) {
    throw new Error("Firebase configuration is missing.");
  }
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    firebaseProjectId,
  )}/databases/(default)`;
}

export async function firestoreRequest(path, { method = "GET", body = null, idToken = "" } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${getFirestoreBaseUrl()}/${path}`, {
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
      payload?.error?.message ||
      payload?.error_description ||
      payload?.error ||
      "Data request failed.";
    const firestoreError = new Error(message);
    firestoreError.httpStatus = response.status;
    firestoreError.code = String(payload?.error?.status || "");
    throw firestoreError;
  }

  return payload;
}

export function buildCloudUserFromLookupUser(user, fallbackPlan = "free") {
  const email = normalizeEmail(user?.email || "");
  const name = String(user?.name || user?.displayName || "").trim();
  return {
    id: String(user?.localId || ""),
    name,
    email,
    plan: fallbackPlan === "premium" ? "premium" : "free",
    createdAt: new Date(Number(user?.createdAt || Date.now())).toISOString(),
    emailVerified: Boolean(user?.emailVerified),
  };
}

export function buildCloudUserFromAuthPayload(payload) {
  const email = normalizeEmail(payload?.email || "");
  return {
    id: String(payload?.localId || ""),
    name: String(payload?.displayName || email || "User"),
    email,
    plan: "free",
    createdAt: new Date().toISOString(),
    emailVerified: Boolean(payload?.emailVerified),
  };
}
