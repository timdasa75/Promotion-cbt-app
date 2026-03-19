import test from "node:test";
import assert from "node:assert/strict";

import {
  findCloudProfilesByEmail,
  getCloudProfileById,
  getCloudProgressDocument,
  patchCloudProfileFields,
  upsertCloudProfile,
  upsertCloudUpgradeRequestRecord,
} from "../../js/authCloudFirestore.js";

test("cloud firestore helpers build expected request shapes", async () => {
  const calls = [];
  const requester = async (path, options) => {
    calls.push({ path, options });
    if (path.includes("NOT_FOUND")) {
      const error = new Error("missing");
      error.httpStatus = 404;
      throw error;
    }
    if (path === "documents:runQuery") {
      return [{ document: { name: "projects/x/databases/(default)/documents/profiles/user-1", fields: {} } }];
    }
    if (String(path).startsWith("documents/profiles/")) {
      const profileId = String(path).split("/").pop().split("?")[0];
      return { name: `projects/x/databases/(default)/documents/profiles/${profileId}`, fields: {} };
    }
    return { fields: {}, documents: [], nextPageToken: "" };
  };

  assert.deepEqual(await getCloudProgressDocument("token", "user-1", requester), { fields: {}, documents: [], nextPageToken: "" });
  assert.equal(await getCloudProgressDocument("token", "NOT_FOUND", requester), null);
  assert.equal((await getCloudProfileById("token", "user-1", requester)).id, "user-1");
  assert.deepEqual(await findCloudProfilesByEmail("token", "USER@EXAMPLE.COM", 1, requester), [{ id: "user-1", email: "", name: "", plan: "free", billingCycle: "", role: "user", status: "active", createdAt: "", lastSeenAt: "", planExpiresAt: "", emailVerified: null, upgradeRequestId: "", upgradeRequestStatus: "none", upgradePaymentReference: "", upgradeAmountPaid: "", upgradeBillingCycle: "", upgradeRequestNote: "", upgradeRequestedAt: "", upgradeReviewedAt: "", upgradeReviewedBy: "", upgradeRequestReviewNote: "" }]);

  await upsertCloudProfile("token", { id: "p1", email: "user@example.com" }, requester);
  await patchCloudProfileFields("token", "p1", { status: { stringValue: "active" } }, requester);
  await upsertCloudUpgradeRequestRecord("token", { requestId: "r1", email: "user@example.com" }, requester);

  assert.equal(calls[0].path, "documents/progress/user-1");
  assert.equal(calls[2].path, "documents/profiles/user-1");
  assert.ok(calls.some((entry) => String(entry.path).startsWith("documents/profiles/p1?updateMask.fieldPaths=")));
  assert.ok(calls.some((entry) => String(entry.path).startsWith("documents/upgradeRequests/r1?updateMask.fieldPaths=")));
});
