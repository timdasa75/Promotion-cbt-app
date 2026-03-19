import { findCloudProfilesByEmail, getCloudProfileById } from "./authCloudFirestore.js";
import { normalizeEmail, normalizeEmailVerificationState, normalizePlan, normalizeRole, normalizeStatus, toIsoTimestamp } from "./authNormalization.js";

export async function resolveCloudPlan(session, { getProfileById = getCloudProfileById, findProfilesByEmail = findCloudProfilesByEmail } = {}) {
  if (!session?.accessToken || !session?.user) {
    return normalizePlan(session?.user?.plan || "free");
  }
  const defaultPlan = normalizePlan(session.user.plan || "free");

  try {
    if (session.user.id) {
      const byId = await getProfileById(session.accessToken, session.user.id);
      if (byId?.plan) return normalizePlan(byId.plan);
    }
    if (session.user.email) {
      const byEmail = await findProfilesByEmail(session.accessToken, session.user.email, 1);
      if (byEmail.length && byEmail[0]?.plan) return normalizePlan(byEmail[0].plan);
    }
  } catch (error) {
    // Optional profile sync path; fallback to current plan.
  }

  return defaultPlan;
}

export function buildProfilePayloadFromSession(session, existingProfile = null, adminEmails = []) {
  const user = session?.user || {};
  const email = normalizeEmail(user.email || existingProfile?.email || "");
  const isEmailVerified =
    typeof user.emailVerified === "boolean"
      ? user.emailVerified
      : normalizeEmailVerificationState(existingProfile?.emailVerified, false);
  const isAdmin = Array.isArray(adminEmails) ? adminEmails.map(normalizeEmail).includes(email) : false;
  return {
    id: String(user.id || existingProfile?.id || ""),
    email,
    name: String(user.name || existingProfile?.name || email || "User"),
    plan: normalizePlan(existingProfile?.plan || user.plan || "free"),
    role: normalizeRole(existingProfile?.role || (isAdmin ? "admin" : "user")),
    status: normalizeStatus(existingProfile?.status || "active"),
    createdAt: toIsoTimestamp(existingProfile?.createdAt || user.createdAt || new Date().toISOString()),
    lastSeenAt: new Date().toISOString(),
    emailVerified: isEmailVerified,
  };
}
