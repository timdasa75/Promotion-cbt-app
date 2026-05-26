import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_STORAGE_PREFIX,
  recoverProgressSummaryForStorageKey,
} from "../../js/progressSummaryStorage.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    key: (index) => Array.from(values.keys())[index] || null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values.entries()),
  };
}

function normalizeProgressSummary(summary = {}) {
  const byId = new Map();
  const attempts = Array.isArray(summary?.attempts) ? summary.attempts : [];
  attempts.forEach((attempt) => {
    const topicId = String(attempt?.topicId || "").trim();
    if (!topicId) return;
    const attemptId = String(attempt?.attemptId || `${topicId}:${attempt?.createdAt || ""}`).trim();
    byId.set(attemptId, {
      attemptId,
      topicId,
      createdAt: String(attempt?.createdAt || "").trim(),
      scorePercentage: Number(attempt?.scorePercentage || 0),
    });
  });
  return {
    attempts: Array.from(byId.values()).sort((left, right) =>
      String(left.createdAt).localeCompare(String(right.createdAt)),
    ),
  };
}

function mergeProgressSummaries(left, right) {
  return normalizeProgressSummary({
    attempts: [
      ...(Array.isArray(left?.attempts) ? left.attempts : []),
      ...(Array.isArray(right?.attempts) ? right.attempts : []),
    ],
  });
}

test("progress summary recovery migrates only the unscoped legacy bucket", () => {
  const currentKey = `${PROGRESS_STORAGE_PREFIX}cloud-user`;
  const storage = createMemoryStorage({
    cbt_progress_summary_v1: JSON.stringify({
      attempts: [{ attemptId: "legacy", topicId: "psr", createdAt: "2026-05-01T10:00:00Z", scorePercentage: 70 }],
    }),
    [`${PROGRESS_STORAGE_PREFIX}other-user`]: JSON.stringify({
      attempts: [{ attemptId: "other", topicId: "ict", createdAt: "2026-05-02T10:00:00Z", scorePercentage: 80 }],
    }),
    unrelated_key: JSON.stringify({
      attempts: [{ attemptId: "ignored", topicId: "bad", createdAt: "2026-05-03T10:00:00Z" }],
    }),
  });

  const recovered = recoverProgressSummaryForStorageKey({
    storage,
    currentStorageKey: currentKey,
    normalizeProgressSummary,
    mergeProgressSummaries,
  });

  assert.deepEqual(recovered.migratedKeys, ["cbt_progress_summary_v1"]);
  assert.deepEqual(
    recovered.summary.attempts.map((attempt) => attempt.topicId),
    ["psr"],
  );
  assert.deepEqual(
    JSON.parse(storage.snapshot()[currentKey]).attempts.map((attempt) => attempt.topicId),
    ["psr"],
  );
  assert.equal(storage.snapshot().cbt_progress_summary_v1, undefined);
  assert.ok(storage.snapshot()[`${PROGRESS_STORAGE_PREFIX}other-user`]);
});

test("progress summary recovery never copies another scoped user's bucket", () => {
  const currentKey = `${PROGRESS_STORAGE_PREFIX}new-user`;
  const storage = createMemoryStorage({
    [`${PROGRESS_STORAGE_PREFIX}existing-user`]: JSON.stringify({
      attempts: [{ attemptId: "a1", topicId: "psr", createdAt: "2026-05-01T10:00:00Z", scorePercentage: 70 }],
    }),
  });

  const recovered = recoverProgressSummaryForStorageKey({
    storage,
    currentStorageKey: currentKey,
    normalizeProgressSummary,
    mergeProgressSummaries,
  });

  assert.equal(recovered, null);
  assert.equal(storage.snapshot()[currentKey], undefined);
  assert.ok(storage.snapshot()[`${PROGRESS_STORAGE_PREFIX}existing-user`]);
});

test("progress summary recovery returns null when no legacy attempts exist", () => {
  const recovered = recoverProgressSummaryForStorageKey({
    storage: createMemoryStorage({
      [`${PROGRESS_STORAGE_PREFIX}old-user`]: JSON.stringify({ attempts: [] }),
    }),
    currentStorageKey: `${PROGRESS_STORAGE_PREFIX}cloud-user`,
    normalizeProgressSummary,
    mergeProgressSummaries,
  });

  assert.equal(recovered, null);
});
