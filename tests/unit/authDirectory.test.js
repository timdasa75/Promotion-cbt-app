import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAuthBackedDirectoryRows,
  buildFallbackUserDirectory,
  buildLocalUserDirectory,
  formatCacheTimestamp,
  mergeDirectoryRows,
} from "../../js/authDirectory.js";

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
  };
}

test("directory builders derive local and merged rows", () => {
  global.window = {
    PROMOTION_CBT_ADMIN_EMAILS: ["admin@example.com"],
  };
  global.localStorage = createStorage({
    cbt_users_v1: JSON.stringify([{ id: "u1", email: "user@example.com", plan: "free", createdAt: "2026-03-18T10:00:00Z" }]),
    cbt_plan_overrides_v1: JSON.stringify({ "user@example.com": "premium" }),
    cbt_admin_directory_cache_v1: JSON.stringify({
      users: [{ id: "c1", email: "cached@example.com", plan: "free", createdAt: "2026-03-17T10:00:00Z" }],
      syncedAt: "2026-03-17T11:00:00Z",
    }),
  });

  const localRows = buildLocalUserDirectory({ email: "admin@example.com", plan: "free", createdAt: "2026-03-19T10:00:00Z" }, ["admin@example.com"]);
  assert.equal(localRows[0].role, "admin");

  const mergedRows = mergeDirectoryRows([{ email: "cloud@example.com", status: "active", plan: "free", createdAt: "2026-03-20T10:00:00Z" }], localRows);
  assert.equal(mergedRows[0].email, "cloud@example.com");

  const fallback = buildFallbackUserDirectory({ email: "admin@example.com", plan: "free", createdAt: "2026-03-19T10:00:00Z" }, ["admin@example.com"]);
  assert.equal(fallback.hasCachedCloudSnapshot, true);
  assert.equal(fallback.users.length > 0, true);

  const authRows = buildAuthBackedDirectoryRows(
    [{ id: "auth1", email: "auth@example.com", createdAt: "2026-03-20T09:00:00Z", emailVerified: true }],
    [{ id: "auth1", email: "auth@example.com", role: "user", plan: "premium" }],
    ["admin@example.com"],
  );
  assert.equal(authRows[0].plan, "premium");

  assert.equal(formatCacheTimestamp("2026-03-17T11:00:00Z").includes("2026"), true);
});
