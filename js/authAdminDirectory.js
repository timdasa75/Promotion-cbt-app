import { normalizeEmail, normalizeEmailVerificationState } from "./authNormalization.js";
import { normalizeDirectoryRow } from "./authDirectory.js";
import { lookupUsersViaAdminApi } from "./authAdminApi.js";

export function getConfiguredAdminEmails(defaultAdminEmails = [], configuredAdminEmails = []) {
  const normalized = [...(Array.isArray(defaultAdminEmails) ? defaultAdminEmails : []), ...(Array.isArray(configuredAdminEmails) ? configuredAdminEmails : [])]
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

export function isCurrentUserAdmin(currentUser, adminEmails = []) {
  const currentEmail = normalizeEmail(currentUser?.email || "");
  if (!currentEmail) return false;
  return getConfiguredAdminEmails([], adminEmails).includes(currentEmail);
}

export async function enrichDirectoryVerificationStates(rows, accessToken, lookupUsers = lookupUsersViaAdminApi) {
  const normalizedRows = (Array.isArray(rows) ? rows : []).map((row) => normalizeDirectoryRow(row));
  const emails = Array.from(new Set(normalizedRows.map((row) => normalizeEmail(row?.email || "")).filter(Boolean)));
  if (!emails.length) {
    return { users: normalizedRows, warning: "" };
  }

  try {
    const verificationByEmail = await lookupUsers(emails, accessToken);
    return {
      users: normalizedRows.map((row) => {
        const email = normalizeEmail(row?.email || "");
        if (!email || !verificationByEmail.has(email)) {
          return row;
        }
        return {
          ...row,
          emailVerified: normalizeEmailVerificationState(verificationByEmail.get(email), row?.emailVerified),
        };
      }),
      warning: "",
    };
  } catch (error) {
    return {
      users: normalizedRows,
      warning: `Admin API verification lookup unavailable. ${error?.message || ""}`.trim(),
    };
  }
}

export async function ensureAdminCloudSession({
  currentUser,
  adminEmails = [],
  session,
  cloudAuthEnabled,
  refreshSession,
}) {
  if (!isCurrentUserAdmin(currentUser, adminEmails)) {
    throw new Error("Admin access is required.");
  }
  if (!cloudAuthEnabled || !session?.provider || !session?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  if (session.provider === "cloudflare") {
    return session;
  }

  const freshSession = await refreshSession(session, { clearOnFailure: true });
  if (!freshSession?.accessToken) {
    throw new Error("Cloud session is unavailable.");
  }

  return freshSession;
}
