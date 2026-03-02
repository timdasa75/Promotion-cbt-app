const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();
const DEFAULT_ADMIN_EMAILS = ["timdasa75@gmail.com"];

function getAllowedAdminEmails() {
  const configured = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...configured]);
}

async function authenticateAdminRequest(req) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }
  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new Error("Missing bearer token.");
  }
  const decoded = await admin.auth().verifyIdToken(idToken);
  const email = String(decoded?.email || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Authenticated user has no email.");
  }
  if (!getAllowedAdminEmails().has(email)) {
    throw new Error("Admin access denied.");
  }
  return decoded;
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

exports.adminDeleteUserById = functions.https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    await authenticateAdminRequest(req);
    const userId = String(req.body?.userId || "").trim();
    if (!userId) {
      res.status(400).json({ ok: false, error: "userId is required." });
      return;
    }

    let authDeleted = false;
    let profileDeleted = false;
    try {
      await admin.auth().deleteUser(userId);
      authDeleted = true;
    } catch (error) {
      if (error?.code !== "auth/user-not-found") {
        throw error;
      }
    }

    const profileRef = admin.firestore().doc(`profiles/${userId}`);
    const profileSnapshot = await profileRef.get();
    if (profileSnapshot.exists) {
      await profileRef.delete();
      profileDeleted = true;
    }

    res.status(200).json({
      ok: true,
      userId,
      authDeleted,
      profileDeleted,
    });
  } catch (error) {
    functions.logger.error("adminDeleteUserById failed:", error);
    res.status(403).json({
      ok: false,
      error: String(error?.message || "Unauthorized"),
    });
  }
});

/**
 * Removes the Firebase Authentication user whenever their Firestore profile is deleted.
 * This keeps Cloud Auth and the profiles collection in sync without exposing secrets in the client.
 */
exports.deleteAuthUserOnProfileDeletion = functions.firestore
  .document("profiles/{userId}")
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;
    if (!userId) {
      functions.logger.warn("Firestore delete trigger fired with no userId");
      return null;
    }
    try {
      await admin.auth().deleteUser(userId);
      functions.logger.info(`Deleted Firebase Auth user ${userId} after profile removal.`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        functions.logger.info(`User ${userId} already removed from Firebase Auth.`);
        return null;
      }
      functions.logger.error(`Failed to delete Firebase Auth user ${userId}:`, error);
      throw error;
    }
    return null;
  });
