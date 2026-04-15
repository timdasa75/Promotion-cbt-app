import test from "node:test";
import assert from "node:assert/strict";

import {
  findCloudProfilesByEmail,
  getCloudProfileById,
  getCloudProgressDocument,
  listCloudFeedbackSubmissions,
  patchCloudFeedbackSubmissionFields,
  patchCloudProfileFields,
  upsertCloudFeedbackSubmission,
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

test("feedback firestore helpers query, create, and patch feedback submissions", async () => {
  const calls = [];
  const requester = async (path, options) => {
    calls.push({ path, options });
    if (path === "documents:runQuery") {
      return [
        {
          document: {
            name: "projects/x/databases/(default)/documents/feedbackSubmissions/fbk-1",
            fields: {
              feedbackId: { stringValue: "fbk-1" },
              email: { stringValue: "user@example.com" },
              category: { stringValue: "bug" },
              status: { stringValue: "new" },
              sourceScreen: { stringValue: "help" },
              message: { stringValue: "Needs work" },
              createdAt: { timestampValue: "2026-04-03T10:00:00Z" },
            },
          },
        },
      ];
    }
    return { ok: true };
  };

  const rows = await listCloudFeedbackSubmissions("token-1", 25, requester);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].feedbackId, "fbk-1");
  assert.equal(rows[0].email, "user@example.com");
  assert.equal(calls[0].path, "documents:runQuery");
  assert.equal(calls[0].options.body.structuredQuery.from[0].collectionId, "feedbackSubmissions");
  assert.equal(calls[0].options.body.structuredQuery.limit, 25);

  await upsertCloudFeedbackSubmission(
    "token-2",
    {
      feedbackId: "fbk-2",
      userId: "u1",
      email: "USER@example.com",
      category: "question_issue",
      status: "new",
      sourceScreen: "quiz",
      message: "Wrong answer key",
      createdAt: "2026-04-03T10:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z",
      topicId: "psr",
      topicName: "Public Service Rules",
      questionId: "psr-001",
      quizAttemptId: "attempt-1",
      sessionMode: "exam",
    },
    requester,
  );
  await patchCloudFeedbackSubmissionFields(
    "token-3",
    "fbk-2",
    {
      status: { stringValue: "resolved" },
      reviewedBy: { stringValue: "admin@example.com" },
    },
    requester,
  );

  assert.ok(calls.some((entry) => String(entry.path).startsWith("documents/feedbackSubmissions/fbk-2?updateMask.fieldPaths=feedbackId")));
  assert.ok(calls.some((entry) => String(entry.path).startsWith("documents/feedbackSubmissions/fbk-2?updateMask.fieldPaths=status")));
});