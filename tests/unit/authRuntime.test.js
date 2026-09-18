import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIdentityToolkitAdminHeaders,
  getConfiguredAuthProvider,
  getFirebaseConfig,
  getPasswordResetCooldownMs,
  getVerificationResendCooldownMs,
  isCloudAuthEnabled,
  isCloudAuthMisconfigured,
  isCloudAuthRequired,
  isCloudProgressSyncEnabled,
  isCloudflareAuthEnabled,
  isCloudflareAuthPrimary,
  isHybridAuthEnabled,
  isLocalDemoAuthEnabled,
  isLocalDemoAuthOptIn,
  isLocalDevelopmentHost,
  shouldAllowFirebaseAuthFallback,
} from "../../js/authRuntime.js";
import { getAuthProviderLabel } from "../../js/auth.js";

function setupGlobals(config = {}) {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  global.window = {
    sessionStorage,
    localStorage,
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: config,
  };
  global.localStorage = localStorage;
  return { sessionStorage, localStorage };
}

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

test("auth runtime helpers normalize config, auth flags, and hybrid rails", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: {
      authMode: "cloudflare-hybrid",
      apiKey: "key-1",
      projectId: "project-1",
      authDomain: "project-1.firebaseapp.com",
      googleClientId: "google-client-1.apps.googleusercontent.com",
      quotaProjectId: "quota-1",
      firebaseFunctionsRegion: "europe-west1",
      enableCloudProgressSync: "true",
      adminApiBaseUrl: "https://admin.example.com///",
      cloudflareApiBaseUrl: "https://auth.example.com///",
      turnstileSiteKey: "turnstile-1",
      verificationResendCooldownMs: 500,
      passwordResetCooldownMs: 3600001,
    },
  };

  try {
    assert.deepEqual(getFirebaseConfig(), {
      authProvider: "hybrid",
      firebaseApiKey: "key-1",
      firebaseProjectId: "project-1",
      firebaseAuthDomain: "project-1.firebaseapp.com",
      firebaseFunctionsRegion: "europe-west1",
      firebaseQuotaProjectId: "quota-1",
      googleClientId: "google-client-1.apps.googleusercontent.com",
      enableCloudProgressSync: true,
      enableLocalDemoAuth: false,
      adminApiBaseUrl: "https://admin.example.com",
      cloudflareAuthBaseUrl: "https://auth.example.com",
      cloudflareTurnstileSiteKey: "turnstile-1",
      allowFirebaseFallback: true,
      verificationResendCooldownMs: 500,
      passwordResetCooldownMs: 3600001,
      paymentProvider: "flutterwave",
      flutterwavePublicKey: "",
      flutterwaveWebhookUrl: "",
      whatsappBusinessNumber: "",
      requireEmailVerification: false,
      adminEmails: [],
    });
    assert.equal(getConfiguredAuthProvider(), "hybrid");
    assert.equal(isHybridAuthEnabled(), true);
    assert.equal(isCloudflareAuthEnabled(), true);
    assert.equal(isCloudflareAuthPrimary(), true);
    assert.equal(shouldAllowFirebaseAuthFallback(), true);
    assert.deepEqual(buildIdentityToolkitAdminHeaders("token-1"), {
      Authorization: "Bearer token-1",
      "Content-Type": "application/json",
      "x-goog-user-project": "quota-1",
    });
    assert.equal(getVerificationResendCooldownMs(), 60000);
    assert.equal(getPasswordResetCooldownMs(), 3600001);
    assert.equal(isLocalDevelopmentHost(), false);
    assert.equal(isCloudAuthEnabled(), true);
    assert.equal(isCloudProgressSyncEnabled(), true);
    assert.equal(isLocalDemoAuthEnabled(), false);
    assert.equal(isLocalDemoAuthOptIn(), false);
    assert.equal(isCloudAuthRequired(), true);
    assert.equal(isCloudAuthMisconfigured(), false);
  } finally {
    global.window = originalWindow;
  }
});

test("auth runtime helpers honor local override and misconfiguration", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "localhost" },
    PROMOTION_CBT_AUTH: {},
    PROMOTION_CBT_REQUIRE_CLOUD_AUTH: true,
  };

  try {
    assert.equal(isLocalDevelopmentHost(), true);
    assert.equal(isCloudAuthEnabled(), false);
    assert.equal(isCloudflareAuthEnabled(), false);
    assert.equal(isCloudflareAuthPrimary(), false);
    assert.equal(isLocalDemoAuthEnabled(), false);
    assert.equal(isLocalDemoAuthOptIn(), false);
    assert.equal(isCloudAuthRequired(), true);
    assert.equal(isCloudAuthMisconfigured(), true);
  } finally {
    global.window = originalWindow;
  }
});


test("auth runtime helpers allow local demo mode on local hosts without cloud auth", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "localhost" },
    PROMOTION_CBT_AUTH: {},
  };

  try {
    assert.equal(isCloudAuthEnabled(), false);
    assert.equal(isCloudAuthRequired(), false);
    assert.equal(isLocalDemoAuthEnabled(), true);

    // Explicit opt-in is only relevant when cloud auth would otherwise be
    // available. With no cloud config at all, isLocalDemoAuthOptIn stays
    // false — the implicit fallback already enabled local demo.
    assert.equal(isLocalDemoAuthOptIn(), false);
  } finally {
    global.window = originalWindow;
  }
});

test("auth runtime helpers honor local demo opt-in as a localhost-only login override", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "localhost" },
    PROMOTION_CBT_AUTH: {
      cloudflareAuthBaseUrl: "https://auth.example.com",
      enableLocalDemoAuth: true,
      firebaseApiKey: "key-1",
      firebaseProjectId: "project-1",
      firebaseAuthDomain: "project-1.firebaseapp.com",
      googleClientId: "google-client-1.apps.googleusercontent.com",
    },
  };

  try {
    // The cloud stack stays fully configured and primary: the opt-in is a
    // runtime routing override, not a provider rewrite, so a production-style
    // config keeps its cloud wiring intact.
    assert.equal(isCloudAuthEnabled(), true);
    assert.equal(isCloudflareAuthEnabled(), true);
    assert.equal(isCloudflareAuthPrimary(), true);
    assert.equal(getConfiguredAuthProvider(), "hybrid");

    assert.equal(isLocalDemoAuthOptIn(), true);
    assert.equal(isLocalDemoAuthEnabled(), true);
    assert.equal(getAuthProviderLabel("configured"), "Demo");
  } finally {
    global.window = originalWindow;
  }
});

test("auth runtime helpers ignore the local demo opt-in on production hosts", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "timdasa.github.io" },
    PROMOTION_CBT_AUTH: {
      cloudflareAuthBaseUrl: "https://auth.example.com",
      enableLocalDemoAuth: true,
    },
  };

  try {
    // The hostname guard keeps the opt-in off outside localhost, so a stray
    // flag in a deployed config can never divert logins away from the Worker.
    assert.equal(isLocalDevelopmentHost(), false);
    assert.equal(isLocalDemoAuthOptIn(), false);
    assert.equal(getAuthProviderLabel("configured"), "Cloudflare");
  } finally {
    global.window = originalWindow;
  }
});

test("getAuthProviderLabel reports Demo when cloud auth is configured but local demo is opted in", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "localhost" },
    PROMOTION_CBT_AUTH: {
      authProvider: "firebase",
      cloudflareAuthBaseUrl: "https://auth.example.com",
      enableLocalDemoAuth: true,
      firebaseApiKey: "key-1",
      firebaseProjectId: "project-1",
      firebaseAuthDomain: "project-1.firebaseapp.com",
      googleClientId: "google-client-1.apps.googleusercontent.com",
    },
  };

  try {
    assert.equal(getAuthProviderLabel("configured"), "Demo");
  } finally {
    global.window = originalWindow;
  }
});

test("auth runtime helpers let hybrid deployments disable firebase fallback explicitly", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: {
      authProvider: "hybrid",
      cloudflareAuthBaseUrl: "https://auth.example.com",
      allowFirebaseFallback: false,
    },
  };

  try {
    assert.equal(getConfiguredAuthProvider(), "hybrid");
    assert.equal(isCloudflareAuthEnabled(), true);
    assert.equal(isCloudflareAuthPrimary(), true);
    assert.equal(shouldAllowFirebaseAuthFallback(), false);
  } finally {
    global.window = originalWindow;
  }
});
