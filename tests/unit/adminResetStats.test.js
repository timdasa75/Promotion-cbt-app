import test from "node:test";
import assert from "node:assert/strict";

import {
  isResetRequestRow,
  isResetSendRow,
  summarizePasswordResetRequests,
} from "../../js/adminResetStats.js";

const request = (target, createdAt, extra = {}) => ({
  action: "Password recovery requested",
  target,
  createdAt,
  status: "success",
  ...extra,
});
const send = (target, createdAt, status = "success", extra = {}) => ({
  action: "Password reset email sent",
  target,
  createdAt,
  status,
  ...extra,
});

test("counts an unanswered request as one unresolved user", () => {
  const stats = summarizePasswordResetRequests([request("a@x.com", "2026-09-17T10:00:00Z")]);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.resolvedCount, 0);
  assert.equal(stats.totalRequests, 1);
  assert.equal(stats.unresolved[0].email, "a@x.com");
  assert.equal(stats.unresolved[0].requestCount, 1);
  assert.equal(stats.unresolved[0].lastSendFailed, false);
});

test("a successful send after the request resolves the user", () => {
  const stats = summarizePasswordResetRequests([
    request("a@x.com", "2026-09-17T10:00:00Z"),
    send("a@x.com", "2026-09-17T11:00:00Z", "success"),
  ]);
  assert.equal(stats.unresolved.length, 0);
  assert.equal(stats.resolvedCount, 1);
});

test("repeated requests from one user collapse into a single unresolved item", () => {
  const rows = [];
  for (let i = 0; i < 5; i += 1) {
    rows.push(request("a@x.com", `2026-09-17T1${i}:00:00Z`));
  }
  const stats = summarizePasswordResetRequests(rows);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.unresolved[0].requestCount, 5);
  assert.equal(stats.totalRequests, 5);
});

test("a failed send leaves the item unresolved and flags it for retry", () => {
  const stats = summarizePasswordResetRequests([
    request("a@x.com", "2026-09-17T10:00:00Z"),
    send("a@x.com", "2026-09-17T11:00:00Z", "failed"),
  ]);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.unresolved[0].lastSendFailed, true);
});

test("re-requesting after a resolved send reopens the item", () => {
  const stats = summarizePasswordResetRequests([
    request("a@x.com", "2026-09-17T10:00:00Z"),
    send("a@x.com", "2026-09-17T11:00:00Z", "success"),
    request("a@x.com", "2026-09-18T09:00:00Z"),
  ]);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.unresolved[0].requestCount, 2);
  assert.equal(stats.unresolved[0].lastSendFailed, false);
});

test("a stale failure from a previous cycle does not taint a fresh request", () => {
  const stats = summarizePasswordResetRequests([
    request("a@x.com", "2026-09-17T10:00:00Z"),
    send("a@x.com", "2026-09-17T11:00:00Z", "failed"),
    send("a@x.com", "2026-09-17T12:00:00Z", "success"),
    request("a@x.com", "2026-09-18T09:00:00Z"),
  ]);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.unresolved[0].lastSendFailed, false);
});

test("grouping is case-insensitive on action and email", () => {
  const stats = summarizePasswordResetRequests([
    request("User@X.com", "2026-09-17T10:00:00Z"),
    { action: "PASSWORD RECOVERY REQUESTED", target: "user@x.com", createdAt: "2026-09-17T11:00:00Z", status: "success" },
  ]);
  assert.equal(stats.unresolved.length, 1);
  assert.equal(stats.unresolved[0].requestCount, 2);
});

test("send-only rows for addresses that never requested are ignored", () => {
  const stats = summarizePasswordResetRequests([send("ghost@x.com", "2026-09-17T11:00:00Z", "success")]);
  assert.equal(stats.unresolved.length, 0);
  assert.equal(stats.resolvedCount, 0);
  assert.equal(stats.totalRequests, 0);
});

test("unresolved items are ordered most-recent-request first", () => {
  const stats = summarizePasswordResetRequests([
    request("old@x.com", "2026-09-15T10:00:00Z"),
    request("new@x.com", "2026-09-17T10:00:00Z"),
    request("mid@x.com", "2026-09-16T10:00:00Z"),
  ]);
  assert.deepEqual(
    stats.unresolved.map((item) => item.email),
    ["new@x.com", "mid@x.com", "old@x.com"]
  );
});

test("guards reject rows with the wrong action or a non-email target", () => {
  assert.equal(isResetRequestRow(request("a@x.com", "2026-09-17T10:00:00Z")), true);
  assert.equal(isResetRequestRow({ action: "Password reset email sent", target: "a@x.com" }), false);
  assert.equal(isResetRequestRow({ action: "Password recovery requested", target: "admin" }), false);
  assert.equal(isResetSendRow(send("a@x.com", "2026-09-17T11:00:00Z")), true);
  assert.equal(isResetSendRow(request("a@x.com", "2026-09-17T10:00:00Z")), false);
});

test("tolerates malformed or missing input", () => {
  const empty = summarizePasswordResetRequests(null);
  assert.deepEqual(empty, { unresolved: [], resolvedCount: 0, totalRequests: 0 });
  const noTimestamp = summarizePasswordResetRequests([{ action: "password recovery requested", target: "a@x.com" }]);
  assert.equal(noTimestamp.unresolved.length, 1);
  assert.equal(noTimestamp.unresolved[0].requestedAt, null);
});

// WhatsApp handoffs audit under their own action string; they must resolve
// the request exactly like an email send (success resolves, failed doesn't).
test("a successful WhatsApp send resolves the request; a failed one does not", () => {
  const rows = [
    { action: "Password recovery requested", target: "wa@example.com", createdAt: "2026-09-18T08:00:00Z" },
  ];
  let summary = summarizePasswordResetRequests(rows);
  assert.equal(summary.unresolved.length, 1);

  rows.push({ action: "Password reset link sent via WhatsApp", target: "wa@example.com", createdAt: "2026-09-18T08:05:00Z", status: "success" });
  summary = summarizePasswordResetRequests(rows);
  assert.equal(summary.unresolved.length, 0, "WhatsApp send resolves the request");
  assert.equal(summary.resolvedCount, 1);

  // A new request after the WhatsApp send reopens the item.
  rows.push({ action: "Password recovery requested", target: "wa@example.com", createdAt: "2026-09-18T09:00:00Z" });
  summary = summarizePasswordResetRequests(rows);
  assert.equal(summary.unresolved.length, 1);
  assert.equal(summary.unresolved[0].requestCount, 2);
});
