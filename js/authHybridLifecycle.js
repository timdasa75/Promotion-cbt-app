import { clearSession } from "./authStorage.js";
import {
  fetchCloudflareSession,
  logoutCloudflareSession,
  requestCloudflareAuth,
  writeCloudflareSessionFromAuthPayload,
} from "./authCloudflareClient.js";
import { shouldAllowFirebaseAuthFallback } from "./authRuntime.js";
import { loginUserCloud, registerUserCloud } from "./authCloudLifecycle.js";

function shouldFallbackToFirebase(error, { allowFallback = false, forRegister = false } = {}) {
  if (!allowFallback) return false;
  const status = Number(error?.httpStatus || 0);
  const message = String(error?.message || "").toLowerCase();
  if ([404, 429, 500, 501, 502, 503, 504].includes(status)) {
    return true;
  }
  if (forRegister && status === 409) {
    return false;
  }
  return [
    "cloudflare auth api is not configured",
    "route not found",
    "cloudflare auth database is not configured",
    "failed to fetch",
    "networkerror",
    "account not found in cloudflare auth",
  ].some((fragment) => message.includes(fragment));
}

export async function registerUserHybrid(
  { name, email, password },
  {
    registerCloudflare = async (input) => {
      const payload = await requestCloudflareAuth("auth/register", {
        method: "POST",
        body: input,
      });
      const session = writeCloudflareSessionFromAuthPayload(payload);
      return {
        user: session?.user || payload?.user || null,
        message:
          payload?.warning
          || "Account created successfully. Email verification will be added in a later update.",
        authMessage: payload?.warning || "Login successful.",
        requiresEmailVerification: false,
      };
    },
    registerFirebase = registerUserCloud,
    allowFirebaseFallback = shouldAllowFirebaseAuthFallback(),
  } = {},
) {
  try {
    return await registerCloudflare({ name, email, password });
  } catch (error) {
    if (!shouldFallbackToFirebase(error, { allowFallback: allowFirebaseFallback, forRegister: true })) {
      throw error;
    }
    return registerFirebase({ name, email, password });
  }
}

export async function loginUserHybrid(
  { email, password },
  {
    loginCloudflare = async (input) => {
      const payload = await requestCloudflareAuth("auth/login", {
        method: "POST",
        body: input,
      });
      const session = writeCloudflareSessionFromAuthPayload(payload);
      const sessionPayload = await fetchCloudflareSession(session?.accessToken || payload?.session?.token || "");
      if (sessionPayload?.user) {
        writeCloudflareSessionFromAuthPayload({
          ...payload,
          user: sessionPayload.user,
          session: {
            ...(payload?.session || {}),
            ...(sessionPayload?.session || {}),
            token: payload?.session?.token || session?.accessToken || "",
            createdAt: payload?.session?.createdAt || session?.createdAt || new Date().toISOString(),
            expiresAt: payload?.session?.expiresAt || sessionPayload?.session?.expiresAt || "",
          },
        });
      }
      return {
        ...(sessionPayload?.user || session?.user || payload?.user || {}),
        authMessage: payload?.warning || "Login successful.",
      };
    },
    loginFirebase = loginUserCloud,
    allowFirebaseFallback = shouldAllowFirebaseAuthFallback(),
  } = {},
) {
  try {
    return await loginCloudflare({ email, password });
  } catch (error) {
    if (!shouldFallbackToFirebase(error, { allowFallback: allowFirebaseFallback })) {
      throw error;
    }
    const firebaseUser = await loginFirebase({ email, password });
    return {
      ...firebaseUser,
      authProvider: "firebase",
      shouldPromptPasswordUpgrade: true,
      authMessage: firebaseUser?.authMessage || "Login successful.",
    };
  }
}

export async function refreshCloudflareUserInSession(
  session,
  {
    fetchSession = fetchCloudflareSession,
    writeCloudflareSession = writeCloudflareSessionFromAuthPayload,
    clearCurrentSession = clearSession,
  } = {},
) {
  if (!session || session.provider !== "cloudflare") {
    return session;
  }
  if (!session.accessToken) {
    clearCurrentSession();
    return null;
  }

  try {
    const payload = await fetchSession(session.accessToken);
    return writeCloudflareSession(
      {
        ...payload,
        session: {
          token: session.accessToken,
          expiresAt: payload?.session?.expiresAt || new Date(session.expiresAt || 0).toISOString(),
          createdAt: session.createdAt,
        },
      },
      {},
    );
  } catch (error) {
    clearCurrentSession();
    throw error;
  }
}

export async function logoutHybrid(session, {
  logoutCloudflare = logoutCloudflareSession,
  clearCurrentSession = clearSession,
  logoutFirebase,
} = {}) {
  if (!session || session.provider === "local") {
    clearCurrentSession();
    return;
  }

  if (session.provider === "cloudflare") {
    try {
      if (session.accessToken) {
        await logoutCloudflare(session.accessToken);
      }
    } finally {
      clearCurrentSession();
    }
    return;
  }

  if (typeof logoutFirebase === "function") {
    logoutFirebase();
    return;
  }

  clearCurrentSession();
}


