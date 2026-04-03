import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFirestoreFeedbackFields,
  buildFirestoreProfileFields,
  buildFirestoreUpgradeRequestFields,
  buildUpdateMask,
  parseCloudProgressDocument,
  parseFirestoreFeedbackDocument,
  parseFirestoreProfileDocument,
  normalizeProgressSummary,
} from "../../js/authFirestoreModels.js";

test("firestore model helpers normalize profile and request fields", () => {
  assert.deepEqual(
    buildFirestoreProfileFields({
      email: "USER@EXAMPLE.COM",
      name: "Test User",
      plan: "premium",
      role: "admin",
      status: "suspended",
      createdAt: "2026-03-18T10:00:00Z",
      lastSeenAt: "2026-03-18T12:00:00Z",
      emailVerified: true,
    }),
    {
      email: { stringValue: "user@example.com" },
      name: { stringValue: "Test User" },
      plan: { stringValue: "premium" },
      role: { stringValue: "admin" },
      status: { stringValue: "suspended" },
      createdAt: { timestampValue: "2026-03-18T10:00:00.000Z" },
      lastSeenAt: { timestampValue: "2026-03-18T12:00:00.000Z" },
      emailVerified: { booleanValue: true },
    },
  );

  assert.equal(buildUpdateMask(["schemaVersion", "updatedAt"]), "updateMask.fieldPaths=schemaVersion&updateMask.fieldPaths=updatedAt");

  assert.deepEqual(
    buildFirestoreUpgradeRequestFields({
      requestId: " r1 ",
      userId: " u1 ",
      email: "USER@EXAMPLE.COM",
      status: "approved",
      reference: "pay-1",
      amount: "100",
      billingCycle: "monthly",
      note: "ok",
      submittedAt: "2026-03-18T10:00:00Z",
      reviewedAt: "2026-03-18T11:00:00Z",
      reviewedBy: "ADMIN@EXAMPLE.COM",
      reviewNote: "done",
    }).status,
    { stringValue: "approved" },
  );
});

test("firestore model helpers build and parse feedback documents", () => {
  const fields = buildFirestoreFeedbackFields({
    feedbackId: "fbk-1",
    userId: "u1",
    email: "USER@EXAMPLE.COM",
    category: "QUESTION_ISSUE",
    status: "IN_REVIEW",
    sourceScreen: "QUIZ",
    message: "Answer key looks wrong",
    createdAt: "2026-04-03T10:00:00Z",
    updatedAt: "2026-04-03T11:00:00Z",
    reviewedAt: "2026-04-03T12:00:00Z",
    reviewedBy: "ADMIN@EXAMPLE.COM",
    topicId: "psr",
    topicName: "Public Service Rules",
    questionId: "psr-001",
    quizAttemptId: "attempt-1",
    sessionMode: "EXAM",
  });

  assert.equal(fields.email.stringValue, "user@example.com");
  assert.equal(fields.category.stringValue, "question_issue");
  assert.equal(fields.status.stringValue, "in_review");
  assert.equal(fields.sourceScreen.stringValue, "quiz");
  assert.equal(fields.reviewedBy.stringValue, "admin@example.com");

  const parsed = parseFirestoreFeedbackDocument({
    name: "projects/x/databases/(default)/documents/feedbackSubmissions/fbk-1",
    fields,
  });
  assert.equal(parsed.feedbackId, "fbk-1");
  assert.equal(parsed.email, "user@example.com");
  assert.equal(parsed.status, "in_review");
  assert.equal(parsed.sourceScreen, "quiz");
  assert.equal(parsed.reviewedBy, "admin@example.com");
  assert.equal(parsed.sessionMode, "exam");
});

test("firestore model helpers parse profile and progress documents", () => {
  assert.deepEqual(
    parseFirestoreProfileDocument({
      name: "projects/x/databases/(default)/documents/profiles/user-1",
      fields: {
        email: { stringValue: "USER@EXAMPLE.COM" },
        name: { stringValue: "User One" },
        plan: { stringValue: "premium" },
        role: { stringValue: "admin" },
        status: { stringValue: "active" },
        createdAt: { timestampValue: "2026-03-18T10:00:00Z" },
        emailVerified: { booleanValue: true },
      },
    }).email,
    "user@example.com",
  );

  const summary = normalizeProgressSummary({
    attempts: [
      { attemptId: "a1", topicId: "t1", scorePercentage: 40, totalQuestions: 10, createdAt: "2026-03-18T10:00:00Z" },
      { attemptId: "a1", topicId: "t1", scorePercentage: 60, totalQuestions: 10, createdAt: "2026-03-18T11:00:00Z" },
    ],
  });
  assert.equal(summary.attempts.length, 1);
  assert.equal(summary.attempts[0].scorePercentage, 60);

  const parsed = parseCloudProgressDocument({
    fields: {
      progressSummaryJson: { stringValue: JSON.stringify({ attempts: [] }) },
      retryQueueJson: { stringValue: "[]" },
      spacedQueueJson: { stringValue: "[]" },
      updatedAt: { timestampValue: "2026-03-18T12:00:00Z" },
      deviceId: { stringValue: "device-1" },
      schemaVersion: { integerValue: "1" },
    },
  });
  assert.equal(parsed.deviceId, "device-1");
  assert.equal(parsed.schemaVersion, 1);
});