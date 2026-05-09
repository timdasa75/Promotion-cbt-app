export const PROGRESS_STORAGE_PREFIX = "cbt_progress_summary_v1_";

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

  const candidates = [];
  for (let index = 0; index < getStorageLength(storage); index += 1) {
    const key = storage.key(index);
    if (!key || key === currentStorageKey || !key.startsWith(PROGRESS_STORAGE_PREFIX)) {
      continue;
    }

    try {
      const parsed = JSON.parse(storage.getItem(key) || "");
      const summary = normalizeProgressSummary(parsed);
      if (summary?.attempts?.length) {
        candidates.push({ key, summary });
      }
    } catch (error) {
      // Ignore malformed legacy buckets; they should not block signed-in recovery.
    }
  }

  if (!candidates.length) return null;

  const recovered = candidates.reduce(
    (summary, candidate) => merge(summary, candidate.summary),
    normalizeProgressSummary({ attempts: [] }),
  );
  if (!recovered?.attempts?.length) return null;

  try {
    storage.setItem(currentStorageKey, JSON.stringify(recovered));
  } catch (error) {
    console.warn("Unable to migrate legacy progress summary", error);
  }

  return {
    summary: recovered,
    migratedKeys: candidates.map((candidate) => candidate.key),
  };
}
