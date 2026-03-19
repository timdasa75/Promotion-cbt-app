import test from "node:test";
import assert from "node:assert/strict";

import {
  enrichDirectoryVerificationStates,
  ensureAdminCloudSession,
  getConfiguredAdminEmails,
  isCurrentUserAdmin,
} from "../../js/authAdminDirectory.js";

test("admin directory helpers normalize admin identities", () => {
  const adminEmails = getConfiguredAdminEmails(["root@example.com"], [" ADMIN@example.com ", "root@example.com"]);
  assert.deepEqual(adminEmails, ["root@example.com", "admin@example.com"]);
  assert.equal(isCurrentUserAdmin({ email: "ADMIN@example.com" }, adminEmails), true);
  assert.equal(isCurrentUserAdmin({ email: "user@example.com" }, adminEmails), false);
});

test("admin directory helpers enrich verification states and preserve fallback warning", async () => {
  const lookupUsers = async () => new Map([["user@example.com", true]]);
  const enriched = await enrichDirectoryVerificationStates(
    [{ email: "user@example.com", emailVerified: null, plan: "free", role: "user", status: "active" }],
    "token-1",
    lookupUsers,
  );
  assert.equal(enriched.warning, "");
  assert.equal(enriched.users[0].emailVerified, true);

  const failed = await enrichDirectoryVerificationStates(
    [{ email: "user@example.com", emailVerified: null, plan: "free", role: "user", status: "active" }],
    "token-1",
    async () => {
      throw new Error("lookup failed");
    },
  );
  assert.match(failed.warning, /lookup failed/);
  assert.equal(failed.users[0].emailVerified, null);
});

test("admin directory helpers validate and refresh admin sessions", async () => {
  const refreshed = await ensureAdminCloudSession({
    currentUser: { email: "admin@example.com" },
    adminEmails: ["admin@example.com"],
    session: { provider: "firebase", accessToken: "old-token" },
    cloudAuthEnabled: true,
    refreshSession: async () => ({ provider: "firebase", accessToken: "new-token" }),
  });
  assert.equal(refreshed.accessToken, "new-token");

  await assert.rejects(
    ensureAdminCloudSession({
      currentUser: { email: "user@example.com" },
      adminEmails: ["admin@example.com"],
      session: { provider: "firebase", accessToken: "token" },
      cloudAuthEnabled: true,
      refreshSession: async () => ({ provider: "firebase", accessToken: "token" }),
    }),
    /Admin access is required/,
  );

  await assert.rejects(
    ensureAdminCloudSession({
      currentUser: { email: "admin@example.com" },
      adminEmails: ["admin@example.com"],
      session: { provider: "local", accessToken: "token" },
      cloudAuthEnabled: true,
      refreshSession: async () => ({ provider: "firebase", accessToken: "token" }),
    }),
    /Cloud session is unavailable/,
  );
});
