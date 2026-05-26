export const PROGRESS_STORAGE_PREFIX = "cbt_progress_summary_v1_";
export const LEGACY_STORAGE_KEY = "cbt_progress_summary_v1";

function getStorageLength(storage) {
  return Math.max(0, Number(storage?.length || 0));
}

export function recoverProgressSummaryForStorageKey({
  storage,
  currentStorageKey,
  normalizeProgressSummary,
  mergeProgressSummaries,
} = {}) {
  if (!storage || !currentStorageKey || typeof normalizeProgressSummary !== "function") {
    return null;
  }

  const merge =
    typeof mergeProgressSummaries === "function"
      ? mergeProgressSummaries
      : (left, right) =>
          normalizeProgressSummary({
            attempts: [
              ...(Array.isArray(left?.attempts) ? left.attempts : []),
              ...(Array.isArray(right?.attempts) ? right.attempts : []),
            ],
          });

  const legacyEntries = [];
  for (let index = 0; index < getStorageLength(storage); index += 1) {
    const key = storage.key(index);
    if (!key || key === currentStorageKey) continue;
    if (key === LEGACY_STORAGE_KEY) {
      try {
        const raw = storage.getItem(key);
        if (raw) {
          legacyEntries.push({ key, raw });
        }
      } catch (_) {}
    }
  }

  if (!legacyEntries.length) return null;

  let recoveredSummary = normalizeProgressSummary({ attempts: [] });
  const migratedKeys = [];

  try {
    legacyEntries.forEach(({ key, raw }) => {
      const parsed = JSON.parse(raw);
      const summary = normalizeProgressSummary(parsed);
      if (!summary?.attempts?.length) return;
      recoveredSummary = merge(recoveredSummary, summary);
      migratedKeys.push(key);
    });

    if (!recoveredSummary?.attempts?.length) return null;

    storage.setItem(currentStorageKey, JSON.stringify(recoveredSummary));
    migratedKeys.forEach((key) => {
      try {
        if (typeof storage.removeItem === "function") {
          storage.removeItem(key);
        }
      } catch (_) {}
    });

    return {
      summary: recoveredSummary,
      migratedKeys,
    };
  } catch (error) {
    return null;
  }
}
