import { buildProfilePayloadFromSession } from "./authCloudProfile.js";
import {
  findCloudProfilesByEmail,
  getCloudProfileById,
  patchCloudProfileFields,
  upsertCloudProfile,
  upsertCloudUpgradeRequestRecord,
} from "./authCloudFirestore.js";
import {
  normalizeEmail,
  normalizeUpgradeRequestStatus,
} from "./authNormalization.js";
import { writeSession } from "./authStorage.js";

export async function ensureCloudProfileInSession(
  session,
  {
    adminEmails = [],
    getProfileById = getCloudProfileById,
    upsertProfile = upsertCloudProfile,
    buildPayload = buildProfilePayloadFromSession,
    writeSessionRecord = writeSession,
  } = {},
) {
  if (!session?.provider || session.provider !== "firebase") return session;
  if (!session?.accessToken || !session?.user?.id || !session?.user?.email) {
    return session;
  }

  const existing = await getProfileById(session.accessToken, session.user.id);
  const payload = buildPayload(session, existing, adminEmails);
  await upsertProfile(session.accessToken, payload);

  const updated = {
    ...session,
    user: {
      ...session.user,
      name: payload.name,
      email: payload.email,
      plan: payload.plan,
      createdAt: payload.createdAt,
    },
  };
  writeSessionRecord(updated);
  return updated;
}

export function buildUpgradeRequestRecordFromProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const status = normalizeUpgradeRequestStatus(profile?.upgradeRequestStatus);
  const hasPayload =
    status !== "none" ||
    Boolean(profile?.upgradeRequestedAt) ||
    Boolean(profile?.upgradePaymentReference) ||
    Boolean(profile?.upgradeAmountPaid) ||
    Boolean(profile?.upgradeRequestNote);
  if (!hasPayload) return null;

  return {
    id: String(profile?.upgradeRequestId || ""),
    email: normalizeEmail(profile?.email || ""),
    status,
    reference: String(profile?.upgradePaymentReference || ""),
    amount: String(profile?.upgradeAmountPaid || ""),
    billingCycle: String(profile?.upgradeBillingCycle || ""),
    note: String(profile?.upgradeRequestNote || ""),
    submittedAt: String(profile?.upgradeRequestedAt || ""),
    reviewedAt: String(profile?.upgradeReviewedAt || ""),
    reviewedBy: normalizeEmail(profile?.upgradeReviewedBy || ""),
    reviewNote: String(profile?.upgradeRequestReviewNote || ""),
    source: "cloud-profile",
  };
}

export async function submitUpgradeRequest(
  { reference = "", amount = "", note = "", billingCycle = "" } = {},
  {
    cloudAuthEnabled,
    currentUser,
    session,
    refreshSession,
    ensureProfileInSession,
  },
  {
    patchProfile = patchCloudProfileFields,
    upsertUpgradeRequest = upsertCloudUpgradeRequestRecord,
    now = () => new Date().toISOString(),
    requestIdFactory = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  } = {},
) {
  if (!cloudAuthEnabled) {
    return {
      cloudSaved: false,
      warning: "Cloud auth is not enabled. Request is saved locally on this device only.",
    };
  }

  const user = currentUser || null;
  if (!user?.email) {
    throw new Error("Login is required before submitting upgrade evidence.");
  }
  const normalizedCycle = String(billingCycle || "").trim();
  if (!normalizedCycle) {
    throw new Error("Billing cycle is required for upgrade submissions.");
  }
  if (!session?.accessToken || session?.provider !== "firebase") {
    return {
      cloudSaved: false,
      warning: "Cloud session is unavailable. Request is saved locally on this device only.",
    };
  }

  try {
    const freshSession = await refreshSession(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) {
      throw new Error("Cloud session is unavailable.");
    }

    const withProfile = await ensureProfileInSession(freshSession);
    const profileId = String(withProfile?.user?.id || freshSession?.user?.id || "").trim();
    if (!profileId) {
      throw new Error("Unable to resolve your cloud profile.");
    }

    const nowIso = now();
    const requestId = requestIdFactory();
    await patchProfile(freshSession.accessToken, profileId, {
      upgradeRequestId: { stringValue: requestId },
      upgradeRequestStatus: { stringValue: "pending" },
      upgradePaymentReference: { stringValue: String(reference || "").trim() },
      upgradeAmountPaid: { stringValue: String(amount || "").trim() },
      upgradeBillingCycle: { stringValue: normalizedCycle },
      upgradeRequestNote: { stringValue: String(note || "").trim() },
      upgradeRequestedAt: { stringValue: nowIso },
      upgradeReviewedAt: { stringValue: "" },
      upgradeReviewedBy: { stringValue: "" },
      upgradeRequestReviewNote: { stringValue: "" },
    });

    let archiveWarning = "";
    try {
      await upsertUpgradeRequest(freshSession.accessToken, {
        requestId,
        userId: profileId,
        email: user.email,
        status: "pending",
        reference: String(reference || "").trim(),
        amount: String(amount || "").trim(),
        billingCycle: normalizedCycle,
        note: String(note || "").trim(),
        submittedAt: nowIso,
        reviewedAt: "",
        reviewedBy: "",
        reviewNote: "",
      });
    } catch (archiveError) {
      archiveWarning = `Payment archive sync failed: ${
        archiveError?.message || "Unable to write upgradeRequests record."
      }`;
    }

    return { cloudSaved: true, warning: archiveWarning };
  } catch (error) {
    return {
      cloudSaved: false,
      warning:
        error?.message ||
        "Cloud request sync failed. Request is saved locally on this device only.",
    };
  }
}

export async function setUpgradeRequestStatus(
  email,
  status,
  reviewNote = "",
  billingCycle = "",
  {
    cloudAuthEnabled,
    session,
    currentUserIsAdmin,
    refreshSession,
    setLocalBillingCycle,
  },
  {
    findProfilesByEmail = findCloudProfilesByEmail,
    patchProfile = patchCloudProfileFields,
    upsertUpgradeRequest = upsertCloudUpgradeRequestRecord,
    now = () => new Date().toISOString(),
  } = {},
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Valid email is required.");
  }

  const normalizedStatus = normalizeUpgradeRequestStatus(status);
  const normalizedCycle = String(billingCycle || "").trim();
  if (!["pending", "approved", "rejected"].includes(normalizedStatus)) {
    throw new Error("Invalid request status.");
  }

  if (!cloudAuthEnabled) {
    if (normalizedStatus === "approved" && normalizedCycle) {
      setLocalBillingCycle(normalizedEmail, normalizedCycle);
    }
    return { cloudUpdated: false, warning: "Cloud auth is not enabled." };
  }
  if (!session?.accessToken || session?.provider !== "firebase" || !currentUserIsAdmin) {
    return {
      cloudUpdated: false,
      warning: "Cloud update requires an authenticated admin cloud session.",
    };
  }

  try {
    const freshSession = await refreshSession(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) throw new Error("Cloud session is unavailable.");

    const rows = await findProfilesByEmail(freshSession.accessToken, normalizedEmail, 1);
    if (!rows.length || !rows[0]?.id) {
      throw new Error("Cloud profile not found for this email.");
    }
    const targetProfile = rows[0];
    const requestId = String(targetProfile?.upgradeRequestId || "").trim();
    const cycleFromProfile = String(targetProfile?.upgradeBillingCycle || "").trim();
    const effectiveCycle = normalizedCycle || cycleFromProfile;

    const nowIso = now();
    const fields = {
      upgradeRequestStatus: { stringValue: normalizedStatus },
      upgradeRequestReviewNote: { stringValue: String(reviewNote || "").trim() },
    };
    if (normalizedStatus === "pending") {
      fields.upgradeReviewedAt = { stringValue: "" };
      fields.upgradeReviewedBy = { stringValue: "" };
    } else {
      fields.upgradeReviewedAt = { stringValue: nowIso };
      fields.upgradeReviewedBy = {
        stringValue: normalizeEmail(freshSession?.user?.email || ""),
      };
    }

    if (normalizedStatus === "approved" && effectiveCycle) {
      fields.billingCycle = { stringValue: effectiveCycle };
      fields.upgradeBillingCycle = { stringValue: effectiveCycle };
    }

    await patchProfile(freshSession.accessToken, targetProfile.id, fields);

    if (normalizedStatus === "approved" && effectiveCycle) {
      setLocalBillingCycle(normalizedEmail, effectiveCycle);
    }

    let archiveWarning = "";
    if (requestId) {
      try {
        await upsertUpgradeRequest(freshSession.accessToken, {
          requestId,
          userId: targetProfile.id,
          email: normalizedEmail,
          status: normalizedStatus,
          reference: String(targetProfile?.upgradePaymentReference || "").trim(),
          amount: String(targetProfile?.upgradeAmountPaid || "").trim(),
          billingCycle: effectiveCycle,
          note: String(targetProfile?.upgradeRequestNote || "").trim(),
          submittedAt: String(targetProfile?.upgradeRequestedAt || "").trim() || nowIso,
          reviewedAt: normalizedStatus === "pending" ? "" : nowIso,
          reviewedBy:
            normalizedStatus === "pending"
              ? ""
              : normalizeEmail(freshSession?.user?.email || ""),
          reviewNote: String(reviewNote || "").trim(),
        });
      } catch (archiveError) {
        archiveWarning = `Payment archive sync failed: ${
          archiveError?.message || "Unable to update upgradeRequests record."
        }`;
      }
    } else {
      archiveWarning = "Payment archive sync skipped: missing upgrade request id in profile.";
    }

    return { cloudUpdated: true, warning: archiveWarning };
  } catch (error) {
    return {
      cloudUpdated: false,
      warning: error?.message || "Unable to update cloud upgrade request status.",
    };
  }
}

export async function getCurrentUserUpgradeRequest(
  { currentUser, session, refreshSession },
  {
    getProfileById = getCloudProfileById,
    findProfilesByEmail = findCloudProfilesByEmail,
  } = {},
) {
  const user = currentUser || null;
  if (!user?.email) return null;
  if (!session?.accessToken || session?.provider !== "firebase") {
    return null;
  }

  try {
    const freshSession = await refreshSession(session, { clearOnFailure: true });
    if (!freshSession?.accessToken) return null;

    let profile = await getProfileById(freshSession.accessToken, freshSession?.user?.id || "");
    if (!profile && user.email) {
      const byEmail = await findProfilesByEmail(freshSession.accessToken, user.email, 1);
      profile = byEmail[0] || null;
    }

    return buildUpgradeRequestRecordFromProfile(profile);
  } catch (error) {
    return null;
  }
}
