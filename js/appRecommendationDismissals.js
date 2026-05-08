const DASHBOARD_RECOMMENDATION_DISMISSAL_STORAGE_PREFIX =
  "cbt_dashboard_recommendation_dismissed_v1_";

function getDefaultStorage() {
  return globalThis.localStorage || null;
}

export function getDashboardRecommendationDismissalKey(user) {
  const userId = String(user?.id || "").trim();
  return userId ? `${DASHBOARD_RECOMMENDATION_DISMISSAL_STORAGE_PREFIX}${userId}` : "";
}

export function readDismissedDashboardRecommendationSignature(user, storage = getDefaultStorage()) {
  const storageKey = getDashboardRecommendationDismissalKey(user);
  if (!storageKey || !storage) return "";
  try {
    return String(storage.getItem(storageKey) || "").trim();
  } catch (error) {
    return "";
  }
}

export function writeDismissedDashboardRecommendationSignature(
  user,
  signature,
  storage = getDefaultStorage(),
) {
  const storageKey = getDashboardRecommendationDismissalKey(user);
  if (!storageKey || !storage) return;
  try {
    if (!signature) {
      storage.removeItem(storageKey);
      return;
    }
    storage.setItem(storageKey, String(signature));
  } catch (error) {
    console.warn("Unable to persist dismissed dashboard recommendation", error);
  }
}
