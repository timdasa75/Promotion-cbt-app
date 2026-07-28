// Copy this file to config/runtime-auth.js and set your live values.
// IMPORTANT: config/runtime-auth.js is git-ignored to prevent key leaks.

window.PROMOTION_CBT_AUTH = {
  // Current production mode is "firebase".
  // Future migration modes:
  // - "hybrid": prefer Cloudflare auth when configured, but keep Firebase fallback during cutover.
  // - "cloudflare": Cloudflare-only auth after migration completes.
  authProvider: "firebase",
  firebaseApiKey: "REPLACE_WITH_NEW_FIREBASE_API_KEY",
  firebaseProjectId: "promotioncbt-app",
  firebaseAuthDomain: "promotioncbt-app.firebaseapp.com",
  // Google Identity Services OAuth client ID for "Continue with Google".
  googleClientId: "REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  // Optional explicit quota project for admin API calls (defaults to firebaseProjectId).
  firebaseQuotaProjectId: "promotioncbt-app",
  firebaseFunctionsRegion: "us-central1",
  // Feature flag (phase rollout): when true, client can sync quiz progress to cloud.
  enableCloudProgressSync: true,
  // Recommended: Cloudflare Worker admin bridge base URL.
  // Example: "https://promotion-cbt-admin.<your-subdomain>.workers.dev"
  // If omitted, app falls back to Firebase Cloud Functions URL.
  adminApiBaseUrl: "", // Required for GitHub Pages without Blaze (set to worker URL)
  // Phase-1 hybrid auth rails. These are ignored by the current Firebase-first flow until we wire the next slices.
  cloudflareAuthBaseUrl: "", // Example: "https://promotion-cbt-auth.<your-subdomain>.workers.dev"
  cloudflareTurnstileSiteKey: "", // Optional until Cloudflare auth endpoints are active
  allowFirebaseFallback: true,
  // Optional tuning for free-tier stability:
  // Admin directory live sync interval (minimum 15000, maximum 600000).
  adminDirectorySyncIntervalMs: 60000,
  // Verification resend cooldown per email (minimum 60000, maximum 86400000).
  verificationResendCooldownMs: 900000,
  // Password reset cooldown per email (minimum 60000, maximum 86400000).
  passwordResetCooldownMs: 600000,
  // Launch payment mode. Use "selar" for hosted checkout + admin approval.
  // Later, switch to "flutterwave" after business verification is complete.
  paymentProvider: "selar",
  selarCheckoutLinks: {
    default: "REPLACE_WITH_SELAR_MONTHLY_CHECKOUT_URL",
    monthly: "REPLACE_WITH_SELAR_MONTHLY_CHECKOUT_URL",
  },
  // Dormant Flutterwave card payments. Keep the secret key only in Worker secrets.
  flutterwavePublicKey: "REPLACE_WITH_FLUTTERWAVE_PUBLIC_KEY",
  flutterwaveWebhookUrl: "REPLACE_WITH_WORKER_PAYMENT_WEBHOOK_URL",
  // Admin emails: users who receive admin panel access. Set here only — never commit real emails to source.
  adminEmails: [], // e.g. ["admin@youragency.gov.ng"]
};
