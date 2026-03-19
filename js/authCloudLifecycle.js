import { getCloudProfileById } from "./authCloudFirestore.js";
import { normalizeEmail } from "./authNormalization.js";
import {
  buildCloudUserFromLookupUser,
  firebaseAuthRequest,
} from "./authFirebaseTransport.js";
import {
  ensureCloudSessionActive,
  lookupFirebaseUser,
  writeCloudSessionFromAuthPayload,
} from "./authCloudSession.js";
import { clearSession, writeSession } from "./authStorage.js";

export async function refreshCloudUserInSession(
  session,
  {
    refreshSession = ensureCloudSessionActive,
    lookupUserByToken = lookupFirebaseUser,
    buildUser = buildCloudUserFromLookupUser,
    writeSessionRecord = writeSession,
    ensureProfileInSession,
    syncPlanInSession,
  } = {},
) {
  const freshSession = await refreshSession(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) return null;

  const lookupUser = await lookupUserByToken(freshSession.accessToken);
  if (!lookupUser) return null;

  const user = buildUser(lookupUser, freshSession?.user?.plan || "free");
  const withUser = {
    ...freshSession,
    user: {
      ...freshSession.user,
      ...user,
    },
  };
  writeSessionRecord(withUser);

  const withProfile = await ensureProfileInSession(withUser);
  const updated = await syncPlanInSession(withProfile);
  writeSessionRecord(updated);
  return updated;
}

export async function registerUserCloud(
  { name, email, password },
  {
    authRequest = firebaseAuthRequest,
    writeCloudSession = writeCloudSessionFromAuthPayload,
    ensureProfileInSession,
    markVerificationResend,
    clearCurrentSession = clearSession,
    now = () => new Date().toISOString(),
  } = {},
) {
  const trimmedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (!trimmedName) throw new Error("Name is required.");
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  let payload = await authRequest("accounts:signUp", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      returnSecureToken: true,
    },
  });

  if (trimmedName && payload?.idToken) {
    try {
      const updatePayload = await authRequest("accounts:update", {
        method: "POST",
        body: {
          idToken: payload.idToken,
          displayName: trimmedName,
          returnSecureToken: true,
        },
      });
      payload = {
        ...payload,
        ...updatePayload,
      };
    } catch (error) {
    }
  }

  const saved = writeCloudSession(payload, {
    id: String(payload?.localId || ""),
    name: String(payload?.displayName || trimmedName || normalizedEmail || "User"),
    email: normalizeEmail(payload?.email || normalizedEmail),
    plan: "free",
    createdAt: now(),
    emailVerified: false,
  });
  if (!saved) {
    throw new Error("Registration failed.");
  }

  await ensureProfileInSession(saved);

  await authRequest("accounts:sendOobCode", {
    method: "POST",
    body: {
      requestType: "VERIFY_EMAIL",
      idToken: saved.accessToken,
    },
  });
  markVerificationResend(normalizedEmail);

  clearCurrentSession();
  return {
    user: null,
    requiresEmailVerification: true,
    message: "Account created. Check your email to confirm before login.",
  };
}

export async function loginUserCloud(
  { email, password },
  {
    authRequest = firebaseAuthRequest,
    writeCloudSession = writeCloudSessionFromAuthPayload,
    refreshCloudUser,
    clearCurrentSession = clearSession,
    getProfileById = getCloudProfileById,
  } = {},
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Email and password are required.");
  }

  const payload = await authRequest("accounts:signInWithPassword", {
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
      returnSecureToken: true,
    },
  });

  const saved = writeCloudSession(payload);
  if (!saved) {
    throw new Error("Login failed.");
  }

  const synced = await refreshCloudUser(saved);
  if (!synced?.user) {
    clearCurrentSession();
    throw new Error("Login failed.");
  }

  if (!synced.user.emailVerified) {
    clearCurrentSession();
    throw new Error(
      "Please verify your email before login. Use 'Resend verification' only when needed.",
    );
  }

  try {
    const profile = await getProfileById(synced.accessToken, synced.user.id);
    if (String(profile?.status || "").toLowerCase() === "suspended") {
      clearCurrentSession();
      throw new Error("Your account is suspended. Contact admin support.");
    }
  } catch (error) {
    if (String(error?.message || "").includes("suspended")) {
      throw error;
    }
  }

  return synced.user;
}

export function logoutCloud({ clearCurrentSession = clearSession } = {}) {
  clearCurrentSession();
}
