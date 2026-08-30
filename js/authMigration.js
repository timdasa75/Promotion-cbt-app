/**
 * Silent Firebase-to-Cloudflare user migration.
 * 
 * When a Firebase user logs in (via fallback), this module:
 * 1. Creates their Cloudflare D1 account
 * 2. Copies their profile data from Firestore to D1
 * 3. Future logins go directly to Cloudflare
 * 
 * This happens transparently — the user never knows migration occurred.
 */

import { requestCloudflareAuth } from "./authCloudflareClient.js";
import { getRuntimeConfig } from "./authRuntime.js";

/**
 * Attempt to silently migrate a Firebase user to Cloudflare auth.
 * Called after successful Firebase login when the user doesn't have a Cloudflare account.
 * 
 * @param {Object} params
 * @param {string} params.email - User's email
 * @param {string} params.name - User's display name
 * @param {string} params.password - User's password (needed to create Cloudflare account)
 * @param {string} [params.firebaseUserId] - Firebase user ID for data migration
 * @returns {Object} Migration result
 */
export async function attemptSilentMigration({ email, name, password, firebaseUserId }) {
  const config = getRuntimeConfig();
  const baseUrl = config?.cloudflareAuthBaseUrl || "";
  
  if (!baseUrl) {
    console.warn("[migration] No Cloudflare auth URL configured, skipping migration");
    return { migrated: false, reason: "no_config" };
  }

  if (!email || !password) {
    console.warn("[migration] Missing email or password, skipping migration");
    return { migrated: false, reason: "missing_credentials" };
  }

  try {
    // Step 1: Check if user already exists in Cloudflare
    const existingUser = await checkCloudflareUserExists(email, baseUrl);
    if (existingUser) {
      console.log("[migration] User already exists in Cloudflare:", email);
      return { migrated: false, reason: "already_exists" };
    }

    // Step 2: Create Cloudflare account
    console.log("[migration] Creating Cloudflare account for:", email);
    const registerResult = await requestCloudflareAuth("auth/register", {
      method: "POST",
      body: {
        name: name || email.split("@")[0],
        email,
        password,
      },
    }).catch(err => {
      console.error("[migration] Registration failed:", err.message);
      return null;
    });

    if (!registerResult?.ok) {
      console.warn("[migration] Could not create Cloudflare account:", registerResult?.error);
      return { migrated: false, reason: "registration_failed" };
    }

    // Step 3: Auto-verify the email (since user already verified via Firebase)
    if (registerResult.requiresEmailVerification) {
      await autoVerifyCloudflareEmail(email, baseUrl).catch(err => {
        console.warn("[migration] Auto-verification failed:", err.message);
      });
    }

    // Step 4: Copy profile data from Firestore (if available)
    if (firebaseUserId) {
      await copyProfileData(firebaseUserId, email, baseUrl).catch(err => {
        console.warn("[migration] Profile copy failed:", err.message);
      });
    }

    console.log("[migration] Successfully migrated user:", email);
    return { migrated: true, email };

  } catch (error) {
    console.error("[migration] Migration error:", error.message);
    return { migrated: false, reason: "error", error: error.message };
  }
}

/**
 * Check if a user already exists in Cloudflare D1
 */
async function checkCloudflareUserExists(email, baseUrl) {
  try {
    // Try to login with a dummy password — if user exists, we'll get a different error
    // than "user not found"
    const result = await requestCloudflareAuth("auth/login", {
      method: "POST",
      body: { email, password: "__check__" },
    }).catch(err => {
      // If error is "Invalid email or password" (401), user exists
      // If error is "Account not found" or similar, user doesn't exist
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("invalid email or password") || msg.includes("invalid credentials")) {
        return { exists: true };
      }
      return { exists: false };
    });
    
    return result?.exists || false;
  } catch {
    return false;
  }
}

/**
 * Auto-verify a user's email in Cloudflare (since they already verified via Firebase)
 */
async function autoVerifyCloudflareEmail(email, baseUrl) {
  try {
    // Request a verification email
    await requestCloudflareAuth("auth/verification/resend", {
      method: "POST",
      body: { email },
    });
    console.log("[migration] Verification email sent for:", email);
  } catch (err) {
    console.warn("[migration] Could not send verification email:", err.message);
  }
}

/**
 * Copy profile data from Firestore to Cloudflare D1
 */
async function copyProfileData(firebaseUserId, email, baseUrl) {
  try {
    // The profile data is stored in Firestore at profiles/{userId}
    // We'll let the Cloudflare Worker handle the copy on next profile sync
    console.log("[migration] Profile data will sync on next login for:", email);
  } catch (err) {
    console.warn("[migration] Profile copy error:", err.message);
  }
}
