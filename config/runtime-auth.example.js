// Copy this file to config/runtime-auth.js and set your live values.
// IMPORTANT: config/runtime-auth.js is git-ignored to prevent key leaks.

window.PROMOTION_CBT_AUTH = {
  firebaseApiKey: "REPLACE_WITH_NEW_FIREBASE_API_KEY",
  firebaseProjectId: "promotioncbt-app",
  firebaseAuthDomain: "promotioncbt-app.firebaseapp.com",
  // Optional explicit quota project for admin API calls (defaults to firebaseProjectId).
  firebaseQuotaProjectId: "promotioncbt-app",
  firebaseFunctionsRegion: "us-central1",
  // Feature flag (phase rollout): when true, client can sync quiz progress to cloud.
  enableCloudProgressSync: true,
  // Recommended: Cloudflare Worker admin bridge base URL.
  // Example: "https://promotion-cbt-admin.<your-subdomain>.workers.dev"
  // If omitted, app falls back to Firebase Cloud Functions URL.
  adminApiBaseUrl: "", // Required for GitHub Pages without Blaze (set to worker URL)
  // Optional tuning for free-tier stability:
  // Admin directory live sync interval (minimum 15000, maximum 600000).
  adminDirectorySyncIntervalMs: 60000,
  // Verification resend cooldown per email (minimum 60000, maximum 86400000).
  verificationResendCooldownMs: 900000,
  // Password reset cooldown per email (minimum 60000, maximum 86400000).
  passwordResetCooldownMs: 600000,
};




