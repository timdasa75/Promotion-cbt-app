const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();
function getAllowedAdminEmails() {
  const configured = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean);
  if (!configured.length) {
    throw new Error("ADMIN_EMAILS is not configured.");
  }
  return new Set(configured);
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

function parseCsvSet(value) {
  return String(value || "")
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function resolveAllowedOrigin(req) {
  const configured = parseCsvSet(process.env.ALLOWED_ORIGINS || "");
  if (!configured.length) return "*";
  if (configured.includes("*")) return "*";
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return "";
  return configured.includes(origin) ? origin : "";
}

function setCors(res, origin = "*") {
  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function handleCors(req, res) {
  const configured = parseCsvSet(process.env.ALLOWED_ORIGINS || "");
  const origin = resolveAllowedOrigin(req);

  if (req.method === "OPTIONS") {
    if (configured.length && !origin) {
      setCors(res, "");
      res.status(403).json({ ok: false, error: "Origin not allowed." });
      return false;
    }
    setCors(res, origin || "*");
    res.status(204).send("");
    return false;
  }

  if (configured.length && !origin) {
    setCors(res, "");
    res.status(403).json({ ok: false, error: "Origin not allowed." });
    return false;
  }

  setCors(res, origin || "*");
  return true;
}

exports.adminDeleteUserById = functions.https.onRequest(async (req, res) => {
  if (!handleCors(req, res)) {
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

exports.adminListUsers = functions.https.onRequest(async (req, res) => {
  if (!handleCors(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    await authenticateAdminRequest(req);
    const users = [];
    let pageToken;
    let loop = 0;

    do {
      const result = await admin.auth().listUsers(1000, pageToken);
      result.users.forEach((userRecord) => {
        users.push({
          id: String(userRecord.uid || ""),
          email: String(userRecord.email || "").toLowerCase(),
          name: String(userRecord.displayName || ""),
          emailVerified: Boolean(userRecord.emailVerified),
          disabled: Boolean(userRecord.disabled),
          createdAt: String(userRecord.metadata?.creationTime || ""),
          lastSignInAt: String(userRecord.metadata?.lastSignInTime || ""),
        });
      });
      pageToken = result.pageToken;
      loop += 1;
    } while (pageToken && loop < 50);

    res.status(200).json({
      ok: true,
      total: users.length,
      users,
    });
  } catch (error) {
    functions.logger.error("adminListUsers failed:", error);
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

/**
 * Removes the Firestore profile when the corresponding Firebase Auth user is deleted.
 * This prevents stale/orphan profile records from accumulating over time.
 */
exports.deleteProfileOnAuthDeletion = functions.auth.user().onDelete(async (user) => {
  const userId = String(user?.uid || "").trim();
  if (!userId) {
    functions.logger.warn("Auth delete trigger fired with no uid");
    return null;
  }
  try {
    const profileRef = admin.firestore().doc(`profiles/${userId}`);
    const profileSnapshot = await profileRef.get();
    if (!profileSnapshot.exists) {
      functions.logger.info(`No profile to delete for auth user ${userId}.`);
      return null;
    }
    await profileRef.delete();
    functions.logger.info(`Deleted profile ${userId} after Firebase Auth user removal.`);
  } catch (error) {
    functions.logger.error(`Failed deleting profile ${userId} after auth deletion:`, error);
    throw error;
  }
  return null;
});

exports.adminLookupUsers = functions.https.onRequest(async (req, res) => {
  if (!handleCors(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    await authenticateAdminRequest(req);
    const rawEmails = Array.isArray(req.body?.emails) ? req.body.emails : [];
    const normalizedEmails = Array.from(
      new Set(
        rawEmails
          .map((entry) => String(entry || "").trim().toLowerCase())
          .filter((entry) => entry && entry.includes("@")),
      ),
    );

    if (!normalizedEmails.length) {
      res.status(200).json({ ok: true, users: [] });
      return;
    }

    const users = [];
    for (let index = 0; index < normalizedEmails.length; index += 100) {
      const batch = normalizedEmails.slice(index, index + 100);
      const result = await admin.auth().getUsers(batch.map((email) => ({ email })));
      result.users.forEach((userRecord) => {
        const email = String(userRecord.email || "").toLowerCase();
        if (!email) return;
        users.push({
          email,
          emailVerified: Boolean(userRecord.emailVerified),
        });
      });
    }

    res.status(200).json({ ok: true, users });
  } catch (error) {
    functions.logger.error("adminLookupUsers failed:", error);
    res.status(403).json({
      ok: false,
      error: String(error?.message || "Unauthorized"),
    });
  }
});

exports.adminSetUserStatus = functions.https.onRequest(async (req, res) => {
  if (!handleCors(req, res)) {
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

    const statusRaw = String(req.body?.status || "").trim().toLowerCase();
    const nextStatus = statusRaw === "suspended" ? "suspended" : "active";
    const disabled = nextStatus === "suspended";

    await admin.auth().updateUser(userId, { disabled });
    await admin
      .firestore()
      .doc(`profiles/${userId}`)
      .set(
        {
          status: nextStatus,
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    res.status(200).json({
      ok: true,
      userId,
      status: nextStatus,
      authDisabledSynced: disabled,
    });
  } catch (error) {
    functions.logger.error("adminSetUserStatus failed:", error);
    res.status(403).json({
      ok: false,
      error: String(error?.message || "Unauthorized"),
    });
  }
});

exports.adminSendVerificationEmail = functions.https.onRequest(async (req, res) => {
  if (!handleCors(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    await authenticateAdminRequest(req);
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ ok: false, error: "email is required." });
      return;
    }

    res.status(200).json({
      ok: true,
      email,
      delivered: false,
      warning:
        "Cloud Functions fallback no longer returns verification links. Use the Cloudflare admin bridge or add server-side email delivery for secure resend support.",
    });
  } catch (error) {
    functions.logger.error("adminSendVerificationEmail failed:", error);
    res.status(403).json({
      ok: false,
      error: String(error?.message || "Unauthorized"),
    });
  }
});
