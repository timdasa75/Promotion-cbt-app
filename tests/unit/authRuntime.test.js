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
  isLocalDevelopmentHost,
  shouldAllowFirebaseAuthFallback,
} from "../../js/authRuntime.js";

test("auth runtime helpers normalize config, auth flags, and hybrid rails", () => {
  const originalWindow = global.window;
  global.window = {
    location: { hostname: "example.com" },
    PROMOTION_CBT_AUTH: {
      authMode: "cloudflare-hybrid",
      apiKey: "key-1",
      projectId: "project-1",
      authDomain: "project-1.firebaseapp.com",
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
      enableCloudProgressSync: true,
      enableLocalDemoAuth: false,
      adminApiBaseUrl: "https://admin.example.com",
      cloudflareAuthBaseUrl: "https://auth.example.com",
      cloudflareTurnstileSiteKey: "turnstile-1",
      allowFirebaseFallback: true,
      verificationResendCooldownMs: 500,
      passwordResetCooldownMs: 3600001,
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
