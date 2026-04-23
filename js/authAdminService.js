import { normalizeEmail, normalizeStatus } from "./authNormalization.js";
import {
  buildAuthBackedDirectoryRows,
  buildFallbackUserDirectory,
  buildLocalUserDirectory,
  formatCacheTimestamp,
  normalizeDirectoryRow,
} from "./authDirectory.js";
import { listCloudProfiles } from "./authCloudFirestore.js";
import {
  deleteUserViaCloudFunction,
  listAdminOperationsViaAdminApi,
  listUsersViaCloudFunction,
  logAdminOperationViaAdminApi,
  createCloudflareMigrationLinkViaAdminApi,
  setUserStatusViaAdminApi,
} from "./authAdminApi.js";

export async function getAdminUserDirectory(
  {
    currentUser,
    adminEmails = [],
    session,
    cloudAuthEnabled,
    ensureAdminSession,
    writeDirectoryCache = () => {},
  },
  {
    listProfiles = listCloudProfiles,
    listAuthUsers = listUsersViaCloudFunction,
    enrichVerificationStates,
    buildAuthRows = buildAuthBackedDirectoryRows,
    buildFallbackDirectory = buildFallbackUserDirectory,
    buildLocalDirectory = buildLocalUserDirectory,
    formatCacheTime = formatCacheTimestamp,
    normalizeRow = normalizeDirectoryRow,
  } = {},
) {
  if (cloudAuthEnabled && session?.accessToken) {
    try {
      const freshSession = await ensureAdminSession();
      if (!freshSession?.accessToken) {
        throw new Error("Cloud session is unavailable.");
      }

      let normalizedRows = [];
      const warnings = [];
      if (freshSession.provider === "firebase") {
        try {
          const rows = await listProfiles(freshSession.accessToken);
          normalizedRows = rows.map((row) => normalizeRow(row, adminEmails));
        } catch (profileError) {
          warnings.push(`Cloud profiles unavailable. ${profileError?.message || ""}`.trim());
        }
      }

      let users = normalizedRows;
      let source = normalizedRows.length ? "cloud" : freshSession.provider === "cloudflare" ? "cloud-auth" : "local";

      try {
        const authUsers = await listAuthUsers(freshSession.accessToken);
        if (authUsers.length) {
          const authUserIds = new Set(authUsers.map((entry) => String(entry?.id || "").trim()).filter(Boolean));
          const authEmails = new Set(
            authUsers.map((entry) => normalizeEmail(entry?.email || "")).filter(Boolean),
          );
          const staleProfiles = normalizedRows.filter((profile) => {
            const profileId = String(profile?.id || "").trim();
            const profileEmail = normalizeEmail(profile?.email || "");
            return !authUserIds.has(profileId) && !authEmails.has(profileEmail);
          });

          users = buildAuthRows(authUsers, normalizedRows, adminEmails);
          source = "cloud-auth";
          if (staleProfiles.length > 0) {
            warnings.push(
              `${staleProfiles.length} stale profile record(s) were excluded because they are not in Firebase Auth.`,
            );
          }
        } else if (normalizedRows.length > 0) {
          warnings.push("Firebase Auth list returned zero users. Showing profile-based fallback.");
          const enriched = await enrichVerificationStates(normalizedRows, freshSession.accessToken);
          users = enriched.users;
          if (enriched.warning) {
            warnings.push(enriched.warning);
          }
        } else {
          throw new Error("Admin API returned zero users and no cloud profiles are available.");
        }
      } catch (error) {
        const cloudFunctionWarning = `Admin API live list unavailable. ${error?.message || ""}`.trim();
        if (normalizedRows.length > 0) {
          warnings.push(cloudFunctionWarning);
          const enriched = await enrichVerificationStates(normalizedRows, freshSession.accessToken);
          users = enriched.users;
          if (enriched.warning) {
            warnings.push(enriched.warning);
          }
        } else {
          throw error;
        }
      }

      writeDirectoryCache(users);
      return {
        users,
        source,
        warning: warnings.join(" ").trim(),
      };
    } catch (error) {
      const fallback = buildFallbackDirectory(currentUser, adminEmails);
      return {
        users: fallback.users,
        source: "local",
        warning: fallback.hasCachedCloudSnapshot
          ? `Cloud user directory unavailable. Showing cached cloud snapshot from ${formatCacheTime(
              fallback.cachedSyncedAt,
            )} plus local data.`
          : `Cloud user directory unavailable. ${error?.message || "Configure Firestore profiles collection and security rules."}`,
      };
    }
  }

  return {
    users: buildLocalDirectory(currentUser, adminEmails),
    source: "local",
    warning: "",
  };
}

export async function getAdminOperationHistory(limit = 120, ensureAdminSession, listOperations = listAdminOperationsViaAdminApi) {
  const session = await ensureAdminSession();
  return listOperations(limit, session.accessToken);
}

export async function logAdminOperationToCloud(entry, ensureAdminSession, logOperation = logAdminOperationViaAdminApi) {
  const session = await ensureAdminSession();
  await logOperation(entry, session.accessToken);
  return { ok: true };
}

export async function updateCloudUserStatusById(profileId, status, ensureAdminSession, setStatus = setUserStatusViaAdminApi) {
  const normalizedProfileId = String(profileId || "").trim();
  if (!normalizedProfileId) {
    throw new Error("Profile id is required.");
  }

  const nextStatus = normalizeStatus(status);
  const session = await ensureAdminSession();
  const syncResult = await setStatus(normalizedProfileId, nextStatus, session.accessToken);
  return {
    warning: String(syncResult?.warning || "").trim(),
  };
}

export async function deleteCloudUserById(profileId, ensureAdminSession, deleteUser = deleteUserViaCloudFunction) {
  const normalizedProfileId = String(profileId || "").trim();
  if (!normalizedProfileId) {
    throw new Error("Profile id is required.");
  }

  const session = await ensureAdminSession();
  try {
    await deleteUser(normalizedProfileId, session.accessToken);
    return { authDeleted: true, warning: "" };
  } catch (cloudFunctionError) {
    throw new Error(
      `Unable to delete this account from Firebase Authentication: ${cloudFunctionError.message || "Cloud Function unavailable"}. ` +
        "Deploy functions/adminDeleteUserById and confirm admin access is configured.",
    );
  }
}


export async function createCloudflareMigrationLinkForUser(
  { email, role, plan, status, emailVerified, continueUrl },
  ensureAdminSession,
  createLink = createCloudflareMigrationLinkViaAdminApi,
) {
  const normalizedEmail = normalizeEmail(email || "");
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const session = await ensureAdminSession();
  const result = await createLink(
    {
      email: normalizedEmail,
      role,
      plan,
      status,
      emailVerified,
      continueUrl,
    },
    session.accessToken,
  );

  return {
    url: String(result?.url || '').trim(),
    expiresAt: String(result?.expiresAt || '').trim(),
    warning: String(result?.warning || '').trim(),
  };
}
