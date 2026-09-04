import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUpgradeRequestRecordFromProfile,
  ensureCloudProfileInSession,
  getCurrentUserUpgradeRequest,
  setUpgradeRequestStatus,
  submitUpgradeRequest,
} from "../../js/authUpgradeService.js";

test("ensureCloudProfileInSession upserts profile and persists updated session", async () => {
  const writes = [];
  const result = await ensureCloudProfileInSession(
    {
      provider: "firebase",
      accessToken: "token-1",
      user: { id: "u1", email: "user@example.com" },
    },
    {
      adminEmails: ["admin@example.com"],
      getProfileById: async () => ({ id: "u1", email: "user@example.com", plan: "free" }),
      buildPayload: () => ({
        id: "u1",
        name: "User One",
        email: "user@example.com",
        plan: "premium",
        createdAt: "2026-03-18T10:00:00.000Z",
      }),
      upsertProfile: async () => {},
      writeSessionRecord: (session) => writes.push(session),
    },
  );

  assert.equal(result.user.plan, "premium");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].user.name, "User One");
});

test("buildUpgradeRequestRecordFromProfile normalizes cloud profile requests", () => {
  assert.equal(buildUpgradeRequestRecordFromProfile({}), null);
  const record = buildUpgradeRequestRecordFromProfile({
    email: " USER@Example.com ",
    upgradeRequestStatus: "APPROVED",
    upgradePaymentReference: "ref-1",
    upgradeAmountPaid: "5000",
    upgradeBillingCycle: "monthly",
    upgradeRequestNote: "paid",
    upgradeRequestedAt: "2026-03-18T10:00:00Z",
    upgradeReviewedAt: "2026-03-18T11:00:00Z",
    upgradeReviewedBy: " ADMIN@Example.com ",
    upgradeRequestReviewNote: "ok",
  });
  assert.equal(record.email, "user@example.com");
  assert.equal(record.status, "approved");
  assert.equal(record.reviewedBy, "admin@example.com");
});

test("submitUpgradeRequest patches profile and archives request", async () => {
  const patches = [];
  const archives = [];
  const result = await submitUpgradeRequest(
    { reference: "ref-1", amount: "5000", note: "paid", billingCycle: "monthly" },
    {
      cloudAuthEnabled: true,
      currentUser: { email: "user@example.com" },
      session: { provider: "firebase", accessToken: "token-1" },
      refreshSession: async () => ({ accessToken: "token-2", user: { id: "u1" } }),
      ensureProfileInSession: async (session) => ({ ...session, user: { id: "u1" } }),
    },
    {
      patchProfile: async (token, profileId, fields) => patches.push({ token, profileId, fields }),
      upsertUpgradeRequest: async (token, entry) => archives.push({ token, entry }),
      now: () => "2026-03-18T10:00:00.000Z",
      requestIdFactory: () => "req-fixed",
    },
  );

  assert.deepEqual(result, { cloudSaved: true, warning: "" });
  assert.equal(patches[0].profileId, "u1");
  assert.equal(patches[0].fields.upgradeRequestId.stringValue, "req-fixed");
  assert.equal(archives[0].entry.requestId, "req-fixed");
});

test("setUpgradeRequestStatus updates cloud request and local billing cycle", async () => {
  const localBilling = [];
  const patches = [];
  const archives = [];
  const result = await setUpgradeRequestStatus(
    "user@example.com",
    "approved",
    "looks good",
    "yearly",
    {
      cloudAuthEnabled: true,
      session: { provider: "firebase", accessToken: "token-1" },
      currentUserIsAdmin: true,
      refreshSession: async () => ({ accessToken: "token-2", user: { email: "admin@example.com" } }),
      setLocalBillingCycle: (email, cycle) => localBilling.push({ email, cycle }),
    },
    {
      findProfilesByEmail: async () => [{
        id: "u1",
        upgradeRequestId: "req-1",
        upgradeBillingCycle: "monthly",
        upgradePaymentReference: "ref-1",
        upgradeAmountPaid: "5000",
        upgradeRequestNote: "paid",
        upgradeRequestedAt: "2026-03-18T09:00:00.000Z",
      }],
      patchProfile: async (token, profileId, fields) => patches.push({ token, profileId, fields }),
      upsertUpgradeRequest: async (token, entry) => archives.push({ token, entry }),
      now: () => "2026-03-18T10:00:00.000Z",
    },
  );

  assert.deepEqual(result, { cloudUpdated: true, warning: "" });
  assert.equal(patches[0].fields.billingCycle.stringValue, "yearly");
  assert.deepEqual(localBilling, [{ email: "user@example.com", cycle: "yearly" }]);
  assert.equal(archives[0].entry.reviewedBy, "admin@example.com");
});

test("getCurrentUserUpgradeRequest falls back to email lookup", async () => {
  const result = await getCurrentUserUpgradeRequest(
    {
      currentUser: { email: "user@example.com" },
      session: { provider: "firebase", accessToken: "token-1" },
      refreshSession: async () => ({ accessToken: "token-2", user: { id: "u1" } }),
    },
    {
      getProfileById: async () => null,
      findProfilesByEmail: async () => [{
        email: "user@example.com",
        upgradeRequestStatus: "pending",
        upgradeRequestId: "req-1",
      }],
    },
  );

  assert.equal(result.id, "req-1");
  assert.equal(result.status, "pending");
});
