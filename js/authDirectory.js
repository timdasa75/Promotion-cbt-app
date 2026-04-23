import { readAdminDirectoryCache, readPlanOverrides, readUsers } from "./authStorage.js";
import { normalizeEmail, normalizeEmailVerificationState, normalizePlan, normalizeRole, normalizeStatus, normalizeUpgradeRequestStatus } from "./authNormalization.js";

export function buildLocalUserDirectory(currentUser, adminEmails = []) {
  const users = readUsers();
  const overrides = readPlanOverrides();
  const adminSet = new Set((Array.isArray(adminEmails) ? adminEmails : []).map(normalizeEmail).filter(Boolean));
  const current = currentUser || null;
  const currentEmail = normalizeEmail(current?.email || "");
  const currentPlan = current?.plan || "free";
  const map = new Map();

  users.forEach((user) => {
    const email = normalizeEmail(user.email);
    if (!email) return;
    map.set(email, {
      id: user.id || email,
      email,
      plan: normalizePlan(overrides[email] || user.plan || "free"),
      billingCycle: String(user?.billingCycle || user?.subscriptionType || user?.planInterval || ""),
      status: "active",
      role: adminSet.has(email) ? "admin" : "user",
      createdAt: user.createdAt || "",
      lastSeenAt: "",
      planExpiresAt: String(user?.planExpiresAt || user?.subscriptionExpiresAt || user?.planExpiryAt || user?.expiresAt || user?.expirationDate || ""),
      emailVerified: normalizeEmailVerificationState(user.emailVerified),
      source: "local",
    });
  });

  if (currentEmail && !map.has(currentEmail)) {
    map.set(currentEmail, {
      id: current?.id || currentEmail,
      email: currentEmail,
      plan: normalizePlan(overrides[currentEmail] || currentPlan),
      billingCycle: String(current?.billingCycle || current?.subscriptionType || current?.planInterval || ""),
      status: "active",
      role: adminSet.has(currentEmail) ? "admin" : "user",
      createdAt: current?.createdAt || "",
      lastSeenAt: "",
      planExpiresAt: String(current?.planExpiresAt || current?.subscriptionExpiresAt || current?.planExpiryAt || current?.expiresAt || current?.expirationDate || ""),
      emailVerified: normalizeEmailVerificationState(current?.emailVerified),
      source: "session",
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

export function mergeDirectoryRows(primaryRows, secondaryRows) {
  const overrides = readPlanOverrides();
  const merged = new Map();

  function addRow(row, defaultSource) {
    const email = normalizeEmail(row?.email || "");
    if (!email || merged.has(email)) return;
    merged.set(email, {
      id: row?.id || email,
      email,
      role: normalizeRole(row?.role),
      status: normalizeStatus(row?.status),
      plan: normalizePlan(overrides[email] || row?.plan),
      createdAt: row?.createdAt || row?.created_at || "",
      lastSeenAt: row?.lastSeenAt || row?.last_seen_at || "",
      planExpiresAt: row?.planExpiresAt || row?.subscriptionExpiresAt || row?.planExpiryAt || row?.expiresAt || row?.expirationDate || "",
      emailVerified: normalizeEmailVerificationState(row?.emailVerified),
      source: row?.source || defaultSource,
    });
  }

  (Array.isArray(primaryRows) ? primaryRows : []).forEach((row) => addRow(row, "cloud"));
  (Array.isArray(secondaryRows) ? secondaryRows : []).forEach((row) => addRow(row, "local"));

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });
}

export function buildFallbackUserDirectory(currentUser, adminEmails = []) {
  const cache = readAdminDirectoryCache();
  const localRows = buildLocalUserDirectory(currentUser, adminEmails);
  const cachedRows = Array.isArray(cache.users) ? cache.users : [];
  if (!cachedRows.length) {
    return {
      users: localRows,
      hasCachedCloudSnapshot: false,
      cachedSyncedAt: "",
    };
  }
  return {
    users: mergeDirectoryRows(cachedRows, localRows),
    hasCachedCloudSnapshot: true,
    cachedSyncedAt: cache.syncedAt,
  };
}

export function buildAuthBackedDirectoryRows(authUsers, profileRows, adminEmails = []) {
  const safeAuthUsers = Array.isArray(authUsers) ? authUsers : [];
  const safeProfiles = Array.isArray(profileRows) ? profileRows : [];
  const overrides = readPlanOverrides();
  const adminSet = new Set((Array.isArray(adminEmails) ? adminEmails : []).map(normalizeEmail).filter(Boolean));

  const profileById = new Map();
  const profileByEmail = new Map();
  safeProfiles.forEach((profile) => {
    const profileId = String(profile?.id || "").trim();
    const profileEmail = normalizeEmail(profile?.email || "");
    if (profileId && !profileById.has(profileId)) {
      profileById.set(profileId, profile);
    }
    if (profileEmail && !profileByEmail.has(profileEmail)) {
      profileByEmail.set(profileEmail, profile);
    }
  });

  const rows = safeAuthUsers
    .map((authUser) => {
      const id = String(authUser?.id || "").trim();
      const email = normalizeEmail(authUser?.email || "");
      if (!id || !email) return null;

      const profile = profileById.get(id) || profileByEmail.get(email) || null;
      const role = normalizeRole(profile?.role || authUser?.role || (adminSet.has(email) ? "admin" : "user"));
      const status = normalizeStatus(profile?.status || authUser?.status || (authUser?.disabled ? "suspended" : "active"));
      const plan = normalizePlan(overrides[email] || profile?.plan || authUser?.plan || "free");

      return {
        id,
        email,
        role,
        status,
        plan,
        billingCycle: String(profile?.billingCycle || profile?.subscriptionType || profile?.planInterval || ""),
        createdAt: String(profile?.createdAt || authUser?.createdAt || ""),
        lastSeenAt: String(profile?.lastSeenAt || authUser?.lastSignInAt || ""),
        planExpiresAt: String(profile?.planExpiresAt || profile?.subscriptionExpiresAt || profile?.planExpiryAt || ""),
        emailVerified: normalizeEmailVerificationState(authUser?.emailVerified, profile?.emailVerified),
        upgradeRequestId: String(profile?.upgradeRequestId || ""),
        upgradeRequestStatus: normalizeUpgradeRequestStatus(profile?.upgradeRequestStatus),
        upgradePaymentReference: String(profile?.upgradePaymentReference || ""),
        upgradeAmountPaid: String(profile?.upgradeAmountPaid || ""),
        upgradeRequestNote: String(profile?.upgradeRequestNote || ""),
        upgradeRequestedAt: String(profile?.upgradeRequestedAt || ""),
        upgradeReviewedAt: String(profile?.upgradeReviewedAt || ""),
        upgradeReviewedBy: normalizeEmail(profile?.upgradeReviewedBy || ""),
        upgradeRequestReviewNote: String(profile?.upgradeRequestReviewNote || ""),
        source: String(authUser?.source || "cloud-auth"),
      };
    })
    .filter(Boolean);

  rows.sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return bTime - aTime;
  });

  return rows;
}

export function formatCacheTimestamp(value) {
  if (!value) return "an earlier sync";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "an earlier sync";
  return parsed.toLocaleString();
}

export function normalizeDirectoryRow(row, adminEmails = []) {
  const email = normalizeEmail(row?.email || "");
  const adminSet = new Set((Array.isArray(adminEmails) ? adminEmails : []).map(normalizeEmail).filter(Boolean));
  return {
    id: String(row?.id || email || ""),
    email,
    role: normalizeRole(row?.role || (adminSet.has(email) ? "admin" : "user")),
    status: normalizeStatus(row?.status || "active"),
    plan: normalizePlan(row?.plan || "free"),
    billingCycle: String(row?.billingCycle || row?.subscriptionType || row?.planInterval || ""),
    createdAt: String(row?.createdAt || row?.created_at || ""),
    lastSeenAt: String(row?.lastSeenAt || row?.last_seen_at || ""),
    planExpiresAt: String(row?.planExpiresAt || row?.subscriptionExpiresAt || row?.planExpiryAt || row?.expiresAt || row?.expirationDate || ""),
    emailVerified: normalizeEmailVerificationState(row?.emailVerified),
    upgradeRequestId: String(row?.upgradeRequestId || ""),
    upgradeRequestStatus: normalizeUpgradeRequestStatus(row?.upgradeRequestStatus),
    upgradePaymentReference: String(row?.upgradePaymentReference || ""),
    upgradeAmountPaid: String(row?.upgradeAmountPaid || ""),
    upgradeRequestNote: String(row?.upgradeRequestNote || ""),
    upgradeRequestedAt: String(row?.upgradeRequestedAt || ""),
    upgradeReviewedAt: String(row?.upgradeReviewedAt || ""),
    upgradeReviewedBy: normalizeEmail(row?.upgradeReviewedBy || ""),
    upgradeRequestReviewNote: String(row?.upgradeRequestReviewNote || ""),
    source: row?.source || "cloud",
  };
}
