// Cloud-capable provider labels emitted by getAuthProviderLabel(): "Cloud"
// for Firebase sessions, "Cloudflare"/"Hybrid" for the Cloudflare-first
// paths. "Online" is kept for backward compatibility with older callers/tests
// that used that label historically.
const CLOUD_PROVIDER_LABELS = new Set(["Cloud", "Cloudflare", "Hybrid", "Online"]);

export function getHeaderSyncSummary(
  user,
  {
    providerLabel = "",
    syncEnabled = false,
    syncStatus = null,
    formatRelativeTime = () => "",
    formatDateTime = () => "",
  } = {},
) {
  if (!user) {
    return {
      label: "Signed out",
      tone: "muted",
      title: "Login to enable saved progress and sync guidance.",
    };
  }

  if (!CLOUD_PROVIDER_LABELS.has(providerLabel) || !syncEnabled) {
    return {
      label: "Device only",
      tone: "muted",
      title: "Progress stays on this device until you sign in and enable sync.",
    };
  }

  if (syncStatus?.inFlight) {
    return {
      label: "Syncing",
      tone: "medium",
      title: "Progress sync is running now.",
    };
  }

  if (syncStatus?.synced && syncStatus?.lastSuccessAt) {
    const when = formatRelativeTime(syncStatus.lastSuccessAt) || formatDateTime(syncStatus.lastSuccessAt);
    return {
      label: "Synced",
      tone: "high",
      title: `Last synced ${when}.`,
    };
  }

  if (syncStatus?.lastReason && syncStatus.lastReason !== "success") {
    return {
      label: "Retry sync",
      tone: "low",
      title: String(syncStatus.lastError || "Sync needs another try.").trim(),
    };
  }

  return {
    label: "Ready",
    tone: "medium",
    title: "Your profile is ready to sync progress.",
  };
}

export function buildHeaderSummaryModel({
  user = null,
  planLabel = "Guest",
  providerLabel = "",
  syncSummary = null,
} = {}) {
  // Only the plan pill is surfaced. Auth provider (Cloud/Cloudflare/Hybrid)
  // and sync state are intentionally omitted from the header. The extra
  // params are accepted for call-site compatibility but ignored here.
  const displayName = String(user?.name || user?.email || "Signed in").trim();
  return {
    displayName,
    pills: [
      { text: String(planLabel || "Guest").trim() || "Guest", className: "summary-pill summary-pill-plan" },
    ],
    syncTitle: "",
  };
}

export function buildSupportStateCardsModel({ attempts = [], retryCount = 0, spacedDueCount = 0, syncSummary = null, hasUser = false } = {}) {
  const attemptsCount = Array.isArray(attempts) ? attempts.length : 0;
  return {
    attemptsMeta: attemptsCount > 0
      ? `You have ${attemptsCount} scored session${attemptsCount === 1 ? "" : "s"} saved. Open Analytics to review your trend.`
      : "Start your first scored session to unlock progress analytics.",
    reviewQueueMeta:
      retryCount > 0 && spacedDueCount > 0
        ? `${retryCount} retry question${retryCount === 1 ? "" : "s"} and ${spacedDueCount} spaced-review item${spacedDueCount === 1 ? "" : "s"} are ready right now.`
        : retryCount > 0
          ? `${retryCount} retry question${retryCount === 1 ? "" : "s"} are ready from recent mistakes.`
          : spacedDueCount > 0
            ? `${spacedDueCount} spaced-review item${spacedDueCount === 1 ? "" : "s"} are due for reinforcement.`
            : "No missed questions are queued yet. Finish a session to build your retry path.",
    syncMeta: hasUser ? String(syncSummary?.title || "").trim() : "Sign in to enable multi-device sync and cross-device recovery.",
  };
}

export function buildUtilityActionButtonModel({ label = "", count = 0, emptyTitle = "" } = {}) {
  const normalizedCount = Number(count || 0);
  const hasCount = normalizedCount > 0;
  return {
    hasCount,
    countText: String(normalizedCount),
    text: hasCount ? `${label} (${normalizedCount})` : label,
    disabled: normalizedCount === 0,
    ariaLabel: hasCount ? `${label}, ${normalizedCount} ready` : `${label}, unavailable until you complete more sessions`,
    title: hasCount ? `${label}: ${normalizedCount} ready` : emptyTitle,
  };
}

