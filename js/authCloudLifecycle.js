import { getCloudProfileById } from "./authCloudFirestore.js";
import { normalizeEmail } from "./authNormalization.js";
import { isEmailVerificationRequired } from "./authRuntime.js";
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
  // Must match the Cloudflare auth worker's minimum (hashPassword rejects
  // passwords shorter than 8). Keeping them aligned avoids a Firebase user
  // with a 6-char password being unable to migrate to Cloudflare auth.
  if (normalizedPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
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

  // Best-effort verification email: a delivery failure must never abort the
  // registration itself — the account row already exists, so a thrown error
  // would leave the user stuck between "account created" and "email exists".
  let verificationSent = true;
  try {
    await authRequest("accounts:sendOobCode", {
      method: "POST",
      body: {
        requestType: "VERIFY_EMAIL",
        idToken: saved.accessToken,
      },
    });
    markVerificationResend(normalizedEmail);
  } catch (error) {
    verificationSent = false;
  }

  // Soft verification (default): sign the user straight in so a lost or
  // undelivered verification email never locks them out. Set
  // REQUIRE_EMAIL_VERIFICATION = true to restore the hard gate.
  if (!isEmailVerificationRequired()) {
    return {
      user: saved.user,
      requiresEmailVerification: false,
      message: verificationSent
        ? "Account created and you're signed in. We also sent a verification link — verifying keeps your account recoverable."
        : "Account created and you're signed in. The verification email could not be sent just now; you can resend it later from your profile.",
    };
  }

  clearCurrentSession();
  return {
    user: null,
    requiresEmailVerification: true,
    message: verificationSent
      ? "Account created. Check your email to confirm before login."
      : "Account created, but the verification email could not be sent. Use 'Resend verification' on the login screen in a minute.",
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

  // Soft verification (default): an unverified email must not block login —
  // that gate permanently locked out anyone whose verification email went
  // missing. Sign in anyway, surface a warning, and re-send the verification
  // email best-effort so the user has a fresh link waiting.
  if (!synced.user.emailVerified) {
    if (isEmailVerificationRequired()) {
      clearCurrentSession();
      throw new Error(
        "Please verify your email before login. Use 'Resend verification' only when needed.",
      );
    }
    try {
      await authRequest("accounts:sendOobCode", {
        method: "POST",
        body: {
          requestType: "VERIFY_EMAIL",
          idToken: synced.accessToken,
        },
      });
    } catch (error) {
      // The nudge is advisory; never fail the login because of it.
    }
    return {
      ...synced.user,
      emailVerificationWarning:
        "Signed in, but your email is not verified yet. We've sent a fresh verification link — check your inbox or Spam folder.",
    };
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
