import test from "node:test";
import assert from "node:assert/strict";

import {
  FEEDBACK_SUBMIT_COOLDOWN_MS,
  getAdminFeedbackSubmissions,
  getFeedbackAccessState,
  getFeedbackCooldownState,
  getFeedbackCooldownStorageKey,
  submitFeedbackSubmission,
  updateFeedbackSubmissionStatus,
} from "../../js/authFeedbackService.js";

function createStorage() {
  const state = new Map();
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
  };
}

test("feedback access state explains cloud-only requirement", () => {
  assert.equal(getFeedbackAccessState().reason, "login-required");
  assert.equal(
    getFeedbackAccessState({ currentUser: { email: "user@example.com" }, cloudAuthEnabled: false }).reason,
    "cloud-disabled",
  );
  assert.equal(
    getFeedbackAccessState({
      currentUser: { email: "user@example.com" },
      cloudAuthEnabled: true,
      session: { provider: "local", accessToken: "token-1" },
    }).reason,
    "cloud-sign-in-required",
  );
  assert.equal(
    getFeedbackAccessState({
      currentUser: { email: "user@example.com" },
      cloudAuthEnabled: true,
      session: { provider: "firebase", accessToken: "token-1" },
    }).allowed,
    true,
  );
});

test("feedback cooldown state reads remaining time from storage", () => {
  const storage = createStorage();
  storage.setItem(getFeedbackCooldownStorageKey("u1"), "2026-04-03T10:00:00.000Z");
  const state = getFeedbackCooldownState("u1", {
    storage,
    cooldownMs: FEEDBACK_SUBMIT_COOLDOWN_MS,
    nowMs: Date.parse("2026-04-03T10:00:30.000Z"),
  });
  assert.equal(state.lastSubmittedAt, "2026-04-03T10:00:00.000Z");
  assert.equal(state.remainingMs, 30000);
});

test("submitFeedbackSubmission normalizes payload and stores cooldown", async () => {
  const storage = createStorage();
  const writes = [];

  const result = await submitFeedbackSubmission(
    {
      sourceScreen: "quiz",
      message: "  Wrong answer key  ",
      topicId: "psr",
      topicName: "Public Service Rules",
      questionId: "psr-001",
      quizAttemptId: "attempt-1",
      sessionMode: "EXAM",
    },
    {
      cloudAuthEnabled: true,
      currentUser: { id: "u1", email: "USER@example.com" },
      session: { provider: "firebase", accessToken: "token-stale" },
      refreshSession: async (session, options) => {
        assert.equal(session.accessToken, "token-stale");
        assert.equal(options.clearOnFailure, true);
        return { accessToken: "token-fresh", user: { id: "u1", email: "user@example.com" } };
      },
    },
    {
      upsertFeedback: async (token, feedback) => writes.push({ token, feedback }),
      idFactory: () => "fbk-fixed",
      now: () => "2026-04-03T10:00:00Z",
      storage,
      cooldownMs: FEEDBACK_SUBMIT_COOLDOWN_MS,
    },
  );

  assert.deepEqual(result, {
    feedbackId: "fbk-fixed",
    createdAt: "2026-04-03T10:00:00.000Z",
    status: "new",
  });
  assert.equal(writes[0].token, "token-fresh");
  assert.equal(writes[0].feedback.email, "user@example.com");
  assert.equal(writes[0].feedback.category, "question_issue");
  assert.equal(writes[0].feedback.sessionMode, "exam");
  assert.equal(storage.getItem(getFeedbackCooldownStorageKey("u1")), "2026-04-03T10:00:00.000Z");
});

test("submitFeedbackSubmission blocks duplicate sends during cooldown", async () => {
  const storage = createStorage();
  storage.setItem(getFeedbackCooldownStorageKey("u1"), "2026-04-03T10:00:00.000Z");
  const originalNow = Date.now;
  Date.now = () => Date.parse("2026-04-03T10:00:30.000Z");
  try {
    await assert.rejects(
      submitFeedbackSubmission(
        { sourceScreen: "help", category: "suggestion", message: "Need a bigger font" },
        {
          cloudAuthEnabled: true,
          currentUser: { id: "u1", email: "user@example.com" },
          session: { provider: "firebase", accessToken: "token-1" },
          refreshSession: async () => ({ accessToken: "token-2" }),
        },
        {
          storage,
          cooldownMs: FEEDBACK_SUBMIT_COOLDOWN_MS,
        },
      ),
      /Please wait 30 seconds/,
    );
  } finally {
    Date.now = originalNow;
  }
});

test("admin feedback service lists submissions and patches review status", async () => {
  const listResult = await getAdminFeedbackSubmissions(
    {
      cloudAuthEnabled: true,
      currentUserIsAdmin: true,
      session: { provider: "firebase", accessToken: "token-1" },
      refreshSession: async (session, options) => {
        assert.equal(session.accessToken, "token-1");
        assert.equal(options.clearOnFailure, true);
        return { accessToken: "token-admin", user: { email: "admin@example.com" } };
      },
    },
    {
      listFeedback: async (token, limit) => {
        assert.equal(token, "token-admin");
        assert.equal(limit, 200);
        return [{ feedbackId: "fbk-1" }];
      },
    },
  );
  assert.deepEqual(listResult, [{ feedbackId: "fbk-1" }]);

  const patches = [];
  const statusResult = await updateFeedbackSubmissionStatus(
    "fbk-1",
    "RESOLVED",
    {
      cloudAuthEnabled: true,
      currentUserIsAdmin: true,
      session: { provider: "firebase", accessToken: "token-1" },
      refreshSession: async () => ({ accessToken: "token-admin", user: { email: "ADMIN@example.com" } }),
    },
    {
      patchFeedback: async (token, feedbackId, fields) => patches.push({ token, feedbackId, fields }),
      now: () => "2026-04-03T12:00:00Z",
    },
  );

  assert.equal(statusResult.status, "resolved");
  assert.equal(statusResult.reviewedAt, "2026-04-03T12:00:00.000Z");
  assert.equal(patches[0].token, "token-admin");
  assert.equal(patches[0].feedbackId, "fbk-1");
  assert.equal(patches[0].fields.status.stringValue, "resolved");
  assert.equal(patches[0].fields.reviewedBy.stringValue, "admin@example.com");
});