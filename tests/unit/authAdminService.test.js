import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteCloudUserById,
  getAdminOperationHistory,
  getAdminUserDirectory,
  logAdminOperationToCloud,
  updateCloudUserStatusById,
} from "../../js/authAdminService.js";

test("admin service builds auth-backed directory rows and caches them", async () => {
  const cached = [];
  const users = [{ id: "auth-1", email: "auth@example.com", role: "user", status: "active", plan: "free" }];

  const result = await getAdminUserDirectory(
    {
      currentUser: { email: "admin@example.com" },
      adminEmails: ["admin@example.com"],
      session: { provider: "firebase", accessToken: "token-1" },
      cloudAuthEnabled: true,
      ensureAdminSession: async () => ({ accessToken: "token-1" }),
      writeDirectoryCache: (rows) => cached.push(rows),
    },
    {
      listProfiles: async () => [
        { id: "auth-1", email: "auth@example.com", role: "user", status: "active", plan: "free" },
        { id: "stale-1", email: "stale@example.com", role: "user", status: "active", plan: "free" },
      ],
      listAuthUsers: async () => [{ id: "auth-1", email: "auth@example.com" }],
      enrichVerificationStates: async () => ({ users: [], warning: "" }),
      buildAuthRows: () => users,
      normalizeRow: (row) => row,
    },
  );

  assert.equal(result.source, "cloud-auth");
  assert.deepEqual(result.users, users);
  assert.match(result.warning, /stale profile record/);
  assert.deepEqual(cached, [users]);
});

test("admin service falls back to enriched profile rows when live auth list fails", async () => {
  const result = await getAdminUserDirectory(
    {
      currentUser: { email: "admin@example.com" },
      adminEmails: ["admin@example.com"],
      session: { provider: "firebase", accessToken: "token-1" },
      cloudAuthEnabled: true,
      ensureAdminSession: async () => ({ accessToken: "token-1" }),
      writeDirectoryCache: () => {},
    },
    {
      listProfiles: async () => [{ id: "profile-1", email: "user@example.com", role: "user", status: "active", plan: "free" }],
      listAuthUsers: async () => {
        throw new Error("live down");
      },
      enrichVerificationStates: async (rows) => ({
        users: rows.map((row) => ({ ...row, emailVerified: true })),
        warning: "lookup lag",
      }),
      normalizeRow: (row) => row,
    },
  );

  assert.equal(result.source, "cloud");
  assert.equal(result.users[0].emailVerified, true);
  assert.match(result.warning, /live down/);
  assert.match(result.warning, /lookup lag/);
});

test("admin service wrappers pass tokens and normalize status", async () => {
  const ensureAdminSession = async () => ({ accessToken: "token-2" });

  const operations = await getAdminOperationHistory(5, ensureAdminSession, async (limit, token) => {
    assert.equal(limit, 5);
    assert.equal(token, "token-2");
    return [{ id: "op-1" }];
  });
  assert.deepEqual(operations, [{ id: "op-1" }]);

  const logged = await logAdminOperationToCloud({ action: "refresh" }, ensureAdminSession, async (entry, token) => {
    assert.deepEqual(entry, { action: "refresh" });
    assert.equal(token, "token-2");
  });
  assert.deepEqual(logged, { ok: true });

  const updated = await updateCloudUserStatusById("user-1", "SUSPENDED", ensureAdminSession, async (id, status, token) => {
    assert.equal(id, "user-1");
    assert.equal(status, "suspended");
    assert.equal(token, "token-2");
    return { warning: "sync lag" };
  });
  assert.deepEqual(updated, { warning: "sync lag" });

  const deleted = await deleteCloudUserById("user-1", ensureAdminSession, async (id, token) => {
    assert.equal(id, "user-1");
    assert.equal(token, "token-2");
  });
  assert.deepEqual(deleted, { authDeleted: true, warning: "" });

  await assert.rejects(
    deleteCloudUserById("user-1", ensureAdminSession, async () => {
      throw new Error("bridge unavailable");
    }),
    /Unable to delete this account from Firebase Authentication: bridge unavailable/,
  );
});
