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

test("progress summary recovery merges multiple legacy local buckets into current user", () => {
  const currentKey = `${PROGRESS_STORAGE_PREFIX}cloud-user`;
  const storage = createMemoryStorage({
    [`${PROGRESS_STORAGE_PREFIX}firebase-user`]: JSON.stringify({
      attempts: [{ attemptId: "a1", topicId: "psr", createdAt: "2026-05-01T10:00:00Z", scorePercentage: 70 }],
    }),
    [`${PROGRESS_STORAGE_PREFIX}guest`]: JSON.stringify({
      attempts: [{ attemptId: "a2", topicId: "ict", createdAt: "2026-05-02T10:00:00Z", scorePercentage: 80 }],
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

  assert.deepEqual(recovered.migratedKeys.sort(), [
    `${PROGRESS_STORAGE_PREFIX}firebase-user`,
    `${PROGRESS_STORAGE_PREFIX}guest`,
  ].sort());
  assert.deepEqual(
    recovered.summary.attempts.map((attempt) => attempt.topicId),
    ["psr", "ict"],
  );
  assert.deepEqual(
    JSON.parse(storage.snapshot()[currentKey]).attempts.map((attempt) => attempt.topicId),
    ["psr", "ict"],
  );
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
