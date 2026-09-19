// Unit tests for the feedback response protocol.
//
// Protocol invariants under test:
// 1. Resolving requires a user-visible message (service throws without one;
//    the Worker mirrors it into admin_reply so it reaches the My Feedback card).
// 2. Resolving stamps resolution + admin_reply + replied_at/replied_by, so the
//    user-side unseen-reply badge machinery lights up.
// 3. Replying to a closed item (resolved/dismissed) never demotes its status;
//    replying to a new item promotes it to in_review.
// 4. Non-resolve status changes never write resolution or admin_reply.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { updateFeedbackSubmissionStatus } from "../../js/authFeedbackService.js";
import worker, { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";

const SESSION_ID = "sess-admin-123";
const SESSION_SECRET = "admin-session-secret";
const ADMIN_EMAIL = "admin@example.com";

const serviceOptions = {
  cloudAuthEnabled: true,
  currentUserIsAdmin: true,
  session: { provider: "cloudflare", accessToken: "token-1" },
  refreshSession: async () => ({ accessToken: "fresh-token", user: { email: ADMIN_EMAIL } }),
};

test("resolve without a resolution message is rejected by the service", async () => {
  await assert.rejects(
    updateFeedbackSubmissionStatus("fbk_1", "resolved", serviceOptions),
    /resolution message is required/i,
  );
});

test("resolve trims and carries the resolution; non-resolve statuses never carry one", async () => {
  const resolved = await updateFeedbackSubmissionStatus("fbk_1", "resolved", { ...serviceOptions, resolution: "  Re-keyed per PSR 030102  " });
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.resolution, "Re-keyed per PSR 030102");

  const inReview = await updateFeedbackSubmissionStatus("fbk_1", "in_review", { ...serviceOptions, resolution: "should be ignored" });
  assert.equal(inReview.status, "in_review");
  assert.equal(inReview.resolution, "");

  const dismissed = await updateFeedbackSubmissionStatus("fbk_1", "dismissed", { ...serviceOptions, resolution: "also ignored" });
  assert.equal(dismissed.status, "dismissed");
  assert.equal(dismissed.resolution, "");
});

test("firebase patch path mirrors the resolution into admin_reply and stamps resolvedAt", async () => {
  const patches = [];
  await updateFeedbackSubmissionStatus(
    "fbk_1",
    "resolved",
    { ...serviceOptions, resolution: "Fixed the answer key" },
    { patchFeedback: async (_token, id, patch) => patches.push({ id, patch }) },
  );
  assert.equal(patches.length, 1);
  const { id, patch } = patches[0];
  assert.equal(id, "fbk_1");
  assert.equal(patch.status.stringValue, "resolved");
  assert.equal(patch.resolution.stringValue, "Fixed the answer key");
  // The user-visible channel: My Feedback renders adminReply only.
  assert.equal(patch.adminReply.stringValue, "Fixed the answer key");
  assert.ok(patch.resolvedAt.timestampValue);
});

test("feedback status route is registered and rejects unauthenticated callers", async () => {
  assert.equal(typeof resolveRouteHandler("/feedback/status"), "function");
  const env = buildWorkerEnv();
  const response = await worker.fetch(
    new Request("https://worker.example.com/feedback/status", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ feedbackId: "fbk_1", status: "resolved", resolution: "x" }),
    }),
    env,
  );
  assert.equal(response.status, 401);
});

test("worker resolve mirrors the resolution into admin_reply (one write reaches the user)", async () => {
  const writes = [];
  const env = buildWorkerEnv({ onRun: (sql, values) => writes.push({ sql, values }) });
  const response = await worker.fetch(statusRequest({ feedbackId: "fbk_1", status: "resolved", reviewer: ADMIN_EMAIL, resolution: "Re-keyed to OHCSF per PSR 030102" }), env);
  assert.equal(response.status, 200);
  const update = writes.find((w) => w.sql.includes("UPDATE feedback_submissions") && w.sql.includes("resolved_at"));
  assert.ok(update, "expected the resolve UPDATE to run");
  assert.ok(update.sql.includes("admin_reply = ?5"), "resolution must be mirrored into admin_reply");
  assert.ok(update.sql.includes("replied_at = ?3"), "replied_at must be stamped so the unseen badge lights up");
  assert.equal(update.values[4], "Re-keyed to OHCSF per PSR 030102");
});

test("worker reply keeps a closed item closed (no demotion)", async () => {
  const writes = [];
  const env = buildWorkerEnv({
    onRun: (sql, values) => writes.push({ sql, values }),
    currentStatus: "resolved",
  });
  const response = await worker.fetch(
    new Request("https://worker.example.com/feedback/reply", {
      method: "POST",
      headers: { ...jsonHeaders(), Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}` },
      body: JSON.stringify({ feedbackId: "fbk_1", reply: "Following up — the fix is live." }),
    }),
    env,
  );
  assert.equal(response.status, 200);
  const update = writes.find((w) => w.sql.includes("UPDATE feedback_submissions"));
  assert.ok(update, "expected the reply UPDATE to run");
  assert.match(update.sql, /CASE WHEN status IN \('resolved', 'dismissed'\) THEN status ELSE \?5 END/, "status must be conditional on the current closed state");
  assert.equal(update.values[4], "in_review");
});

test("worker in_review status change never writes resolution fields", async () => {
  const writes = [];
  const env = buildWorkerEnv({ onRun: (sql, values) => writes.push({ sql, values }) });
  const response = await worker.fetch(statusRequest({ feedbackId: "fbk_1", status: "in_review", reviewer: ADMIN_EMAIL }), env);
  assert.equal(response.status, 200);
  const update = writes.find((w) => w.sql.includes("UPDATE feedback_submissions"));
  assert.ok(update);
  assert.ok(!update.sql.includes("resolution"), "in_review must not touch resolution");
  assert.ok(!update.sql.includes("admin_reply"), "in_review must not touch admin_reply");
});

// --- Worker harness --------------------------------------------------------

function jsonHeaders() {
  return { "Content-Type": "application/json", Origin: "https://app.example.test" };
}

function statusRequest(body) {
  return new Request("https://worker.example.com/feedback/status", {
    method: "POST",
    headers: { ...jsonHeaders(), Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}` },
    body: JSON.stringify(body),
  });
}

// Minimal D1 stub: the session lookup authenticates the admin caller; the
// feedback UPDATE is captured; reads return a configurable current status.
function buildWorkerEnv({ onRun = () => {}, currentStatus = "new" } = {}) {
  const database = {
    prepare(sql) {
      const statement = {
        bind(...values) {
          statement.values = values;
          return statement;
        },
        async first() {
          if (sql.includes("session_id")) {
            return {
              session_id: SESSION_ID,
              user_id: "admin-1",
              session_secret_hash: await sha256Base64Url(SESSION_SECRET),
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              id: "admin-1",
              email: ADMIN_EMAIL,
              role: "admin",
              status: "active",
            };
          }
          if (sql.includes("FROM feedback_submissions")) {
            return { email: "learner@example.com", status: currentStatus, resolution: "" };
          }
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          onRun(sql, statement.values || []);
          return { success: true, meta: { changes: 1 } };
        },
      };
      return statement;
    },
  };
  return {
    AUTH_DB: database,
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  };
}

// Guard: the worker source must keep the demotion guard and the mirror in
// place even if the SQL strings drift past the stubs above.
test("worker source keeps the protocol clauses", async () => {
  const source = await readFile(new URL("../../workers/admin-bridge/worker.js", import.meta.url), "utf8");
  assert.match(source, /CASE WHEN status IN \('resolved', 'dismissed'\) THEN status/, "reply must not demote closed items");
  assert.match(source, /admin_reply = \?5, replied_at = \?3/, "resolve must mirror the note into admin_reply");
});
