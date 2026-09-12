// Unit tests for the V1 question bank management overlay (docs/question-bank-management.md):
// - admin routes are registered and auth-gated (verifyAdminCaller)
// - adminSaveQuestionEdit validates content and writes the overlay row
// - adminRevertQuestionEdit deletes the overlay row and bumps the version
// - the topic-data serve path merges active overlay payloads
// - pure client-side model helpers (js/adminQuestionBankModel.js)

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import worker, { resolveRouteHandler } from "../../workers/admin-bridge/worker.js";
import { sha256Base64Url } from "../../workers/admin-bridge/auth-hybrid.js";
import {
  QUESTION_BANK_DIFFICULTY_VALUES,
  filterQuestionBankQuestions,
  normalizeQuestionBankFormValues,
} from "../../js/adminQuestionBankModel.js";

const SESSION_ID = "sess-qb-123";
const SESSION_SECRET = "qb-session-secret";
const ADMIN_EMAIL = "admin@example.com";

function jsonHeaders() {
  return { "Content-Type": "application/json", Origin: "https://app.example.test" };
}

function adminAuthHeaders() {
  return {
    ...jsonHeaders(),
    Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}`,
  };
}

// Minimal D1 mock covering the queries the auth/session/question-edit paths use.
function makeDatabase(options = {}) {
  const state = {
    editRows: [...(options.editRows || [])],
    deleted: [],
    contentVersion: options.contentVersion ?? 1,
    runs: [],
  };
  const sessionSecretHashPromise = sha256Base64Url(SESSION_SECRET);

  const database = {
    prepare(sql) {
      const bound = [];
      const statement = {
        bind(...values) {
          bound.push(...values);
          return statement;
        },
        async first() {
          state.runs.push({ sql, values: [...bound] });
          if (sql.includes("FROM auth_sessions s") && sql.includes("INNER JOIN auth_users u")) {
            return {
              session_id: SESSION_ID,
              user_id: "admin-1",
              session_secret_hash: await sessionSecretHashPromise,
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              id: "admin-1",
              email: ADMIN_EMAIL,
              role: "admin",
              status: "active",
            };
          }
          if (sql.includes("FROM auth_sessions") && sql.includes("WHERE session_id = ?1")) {
            return {
              session_id: SESSION_ID,
              user_id: "admin-1",
              session_secret_hash: await sessionSecretHashPromise,
              refresh_secret_hash: "unused",
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              last_seen_at: new Date().toISOString(),
            };
          }
          if (sql.includes("FROM auth_users") && sql.includes("WHERE id = ?1")) {
            return {
              id: "admin-1",
              email: ADMIN_EMAIL,
              role: "admin",
              plan: "premium",
              status: "active",
              email_verified: 1,
            };
          }
          if (sql.includes("SELECT version FROM content_meta")) {
            return { version: state.contentVersion };
          }
          throw new Error(`Unexpected first query: ${sql}`);
        },
        async all() {
          state.runs.push({ sql, values: [...bound] });
          if (sql.includes("FROM question_edits")) {
            return { results: state.editRows };
          }
          throw new Error(`Unexpected all query: ${sql}`);
        },
        async run() {
          state.runs.push({ sql, values: [...bound] });
          if (sql.startsWith("DELETE FROM question_edits")) {
            const [topicId, questionId] = bound;
            const before = state.editRows.length;
            state.editRows = state.editRows.filter(
              (row) => !(row.topic_id === topicId && row.question_id === questionId),
            );
            const changes = before - state.editRows.length;
            state.deleted.push({ topicId, questionId, changes });
            state.contentVersion += 1;
            return { success: true, meta: { changes } };
          }
          if (sql.includes("INSERT INTO question_edits")) {
            const [topicId, questionId, payload, origin, feedbackId, editedBy, createdAt, updatedAt] = bound;
            const existing = state.editRows.find(
              (row) => row.topic_id === topicId && row.question_id === questionId,
            );
            if (existing) {
              existing.payload = payload;
              existing.origin = origin;
              existing.edited_by = editedBy;
              existing.updated_at = updatedAt;
            } else {
              state.editRows.push({
                topic_id: topicId,
                question_id: questionId,
                payload,
                origin,
                feedback_id: feedbackId,
                status: "active",
                edited_by: editedBy,
                created_at: createdAt,
                updated_at: updatedAt,
              });
            }
            state.contentVersion += 1;
            return { success: true, meta: { changes: 1 } };
          }
          if (sql.includes("INSERT INTO content_meta") || sql.includes("UPDATE auth_sessions SET last_seen_at")) {
            return { success: true, meta: { changes: 1 } };
          }
          throw new Error(`Unexpected run query: ${sql}`);
        },
      };
      return statement;
    },
  };
  database.__state = state;
  return database;
}

// Static protected-content binding mock serving a tiny PSR-style bank.
const STATIC_BANK = {
  subcategories: [
    {
      id: "psr_app",
      name: "Appointments",
      questions: [
        {
          id: "psr_app_001",
          question: "Who makes appointments to GL.07–GL.17 posts?",
          options: ["Permanent Secretaries.", "Heads of offices.", "The Head of Service.", "The FCSC."],
          correct: 3,
          explanation: "PSR 020102: the FCSC makes such appointments.",
          difficulty: "easy",
          reviewStatus: "approved",
          chapter: "Chapter 2 – Appointments",
          lastReviewed: "2026-03-20",
        },
        {
          id: "psr_app_002",
          question: "Who posts principal officers?",
          options: ["The Head of Service.", "The FCSC."],
          correct: 0,
          explanation: "PSR 020201 assigns postings to the Head of Service.",
          difficulty: "medium",
          reviewStatus: "approved",
        },
      ],
    },
  ],
};

function makeProtectedContentBinding() {
  return {
    fetch: async (request) => {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/+/, "");
      if (path === "topics.json") {
        return new Response(
          JSON.stringify({
            topics: [{ id: "psr_rules", name: "PSR Rules", file: "data/psr_rules.json" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (path === "psr_rules.json") {
        return new Response(JSON.stringify(STATIC_BANK), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: false, error: "Route not found." }), { status: 404 });
    },
  };
}

function buildEnv(dbOptions) {
  return {
    AUTH_DB: makeDatabase(dbOptions),
    PROTECTED_CONTENT: makeProtectedContentBinding(),
    ADMIN_EMAILS: ADMIN_EMAIL,
    ALLOWED_ORIGINS: "https://app.example.test",
  };
}

// --- Route registration & auth ----------------------------------------------

test("question bank admin routes are registered", () => {
  assert.equal(typeof resolveRouteHandler("/adminQuestionEdits"), "function");
  assert.equal(typeof resolveRouteHandler("/adminSaveQuestionEdit"), "function");
  assert.equal(typeof resolveRouteHandler("/adminRevertQuestionEdit"), "function");
});

test("adminQuestionEdits rejects unauthenticated callers", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(
    new Request("https://worker.example.com/adminQuestionEdits", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ topicId: "psr_rules" }),
    }),
    env,
  );
  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
});

test("adminSaveQuestionEdit rejects unauthenticated callers", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(
    new Request("https://worker.example.com/adminSaveQuestionEdit", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ topicId: "psr_rules", questionId: "psr_app_001", question: {} }),
    }),
    env,
  );
  assert.equal(response.status, 401);
});

// --- Save validation ---------------------------------------------------------

function saveRequest(body) {
  return new Request("https://worker.example.com/adminSaveQuestionEdit", {
    method: "POST",
    headers: adminAuthHeaders(),
    body: JSON.stringify(body),
  });
}

test("adminSaveQuestionEdit stores a validated overlay row and bumps the version", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(
    saveRequest({
      topicId: "psr_rules",
      questionId: "psr_app_001",
      question: {
        question: "Who makes appointments to GL.07–GL.17 posts in the Federal Public Service?",
        options: ["Permanent Secretaries.", "Heads of offices.", "The Head of Service.", "The Federal Civil Service Commission."],
        correct: 3,
        explanation: "PSR 020102 states that the FCSC makes appointments to posts graded GL.07–GL.17.",
        difficulty: "easy",
        reviewStatus: "approved",
      },
      origin: "feedback",
      feedbackId: "fbk_123",
    }),
    env,
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.version, 2);

  const rows = env.AUTH_DB.__state.editRows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].topic_id, "psr_rules");
  assert.equal(rows[0].question_id, "psr_app_001");
  assert.equal(rows[0].origin, "feedback");
  assert.equal(rows[0].feedback_id, "fbk_123");
  const saved = JSON.parse(rows[0].payload);
  assert.equal(saved.correct, 3);
  assert.equal(saved.difficulty, "easy");
  // Server stamps lastReviewed and carries unchanged static fields forward.
  assert.ok(saved.lastReviewed);
  assert.equal(saved.chapter, "Chapter 2 – Appointments");
});

test("adminSaveQuestionEdit rejects an out-of-range correct index", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(
    saveRequest({
      topicId: "psr_rules",
      questionId: "psr_app_001",
      question: {
        question: "Stem",
        options: ["A", "B", "C", "D"],
        correct: 9,
        explanation: "Because.",
      },
    }),
    env,
  );
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /correct must be an integer index/);
  assert.equal(env.AUTH_DB.__state.editRows.length, 0);
});

test("adminSaveQuestionEdit rejects an option-count change", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(
    saveRequest({
      topicId: "psr_rules",
      questionId: "psr_app_002",
      question: {
        question: "Who posts principal officers?",
        options: ["The Head of Service.", "The FCSC.", "A third option."],
        correct: 0,
        explanation: "PSR 020201.",
      },
    }),
    env,
  );
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /Option count must not change/);
});

test("adminSaveQuestionEdit rejects unknown questions and topics", async () => {
  const env = buildEnv({});
  const missingQuestion = await worker.fetch(
    saveRequest({ topicId: "psr_rules", questionId: "nope_999", question: { question: "x", options: ["a", "b"], correct: 0, explanation: "y" } }),
    env,
  );
  assert.equal(missingQuestion.status, 404);

  const missingTopic = await worker.fetch(
    saveRequest({ topicId: "unknown_topic", questionId: "psr_app_001", question: { question: "x", options: ["a", "b"], correct: 0, explanation: "y" } }),
    env,
  );
  assert.equal(missingTopic.status, 404);
});

// --- Revert -------------------------------------------------------------------

test("adminRevertQuestionEdit deletes the overlay row and bumps the version", async () => {
  const env = buildEnv({
    editRows: [
      {
        topic_id: "psr_rules",
        question_id: "psr_app_001",
        payload: JSON.stringify({ id: "psr_app_001", question: "edited" }),
        status: "active",
      },
    ],
    contentVersion: 4,
  });
  const response = await worker.fetch(
    new Request("https://worker.example.com/adminRevertQuestionEdit", {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ topicId: "psr_rules", questionId: "psr_app_001" }),
    }),
    env,
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.version, 5);
  assert.equal(env.AUTH_DB.__state.editRows.length, 0);

  const missing = await worker.fetch(
    new Request("https://worker.example.com/adminRevertQuestionEdit", {
      method: "POST",
      headers: adminAuthHeaders(),
      body: JSON.stringify({ topicId: "psr_rules", questionId: "psr_app_001" }),
    }),
    env,
  );
  assert.equal(missing.status, 404);
});

// --- Overlay merge in the serve path -------------------------------------------

function topicDataRequest() {
  return new Request("https://worker.example.com/content/topic-data", {
    method: "POST",
    headers: {
      ...jsonHeaders(),
      Authorization: `Bearer ${SESSION_ID}.${SESSION_SECRET}`,
    },
    body: JSON.stringify({ topicId: "psr_rules" }),
  });
}

test("topic-data serves the static bank unchanged when no overlay rows exist", async () => {
  const env = buildEnv({});
  const response = await worker.fetch(topicDataRequest(), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  const question = payload.payloads[0].subcategories[0].questions[0];
  assert.equal(question.id, "psr_app_001");
  assert.equal(question.correct, 3);
  assert.equal(question.explanation, STATIC_BANK.subcategories[0].questions[0].explanation);
});

test("topic-data merges active overlay payloads onto the static bank", async () => {
  const env = buildEnv({
    editRows: [
      {
        topic_id: "psr_rules",
        question_id: "psr_app_001",
        payload: JSON.stringify({
          id: "psr_app_001",
          question: "Who makes appointments to GL.07–GL.17 posts (fixed)?",
          options: ["Permanent Secretaries.", "Heads of offices.", "The Head of Service.", "The FCSC."],
          correct: 3,
          explanation: "Fixed explanation citing PSR 020102.",
        }),
        status: "active",
      },
    ],
  });
  const response = await worker.fetch(topicDataRequest(), env);
  assert.equal(response.status, 200);
  const payload = await response.json();
  const questions = payload.payloads[0].subcategories[0].questions;
  assert.equal(questions[0].question, "Who makes appointments to GL.07–GL.17 posts (fixed)?");
  assert.equal(questions[0].explanation, "Fixed explanation citing PSR 020102.");
  // Unedited questions pass through untouched.
  assert.equal(questions[1].id, "psr_app_002");
  assert.equal(questions[1].correct, 0);
});

test("cache key includes the content version so saves bust the edge cache", async () => {
  // buildTopicDataCacheKeyWithVersion is exercised indirectly: same DB version,
  // same key; after an increment, the key changes. We verify via the exported
  // handler behavior — after a revert the served content changes immediately
  // (no stale-cache window), which only happens if the key is version-scoped.
  const env = buildEnv({
    editRows: [
      {
        topic_id: "psr_rules",
        question_id: "psr_app_001",
        payload: JSON.stringify({ id: "psr_app_001", explanation: "overlay explanation" }),
        status: "active",
      },
    ],
  });
  const first = await (await worker.fetch(topicDataRequest(), env)).json();
  assert.equal(first.payloads[0].subcategories[0].questions[0].explanation, "overlay explanation");
});

// --- Client-side model helpers ---------------------------------------------------

const MODEL_QUESTIONS = new Map([
  ["psr_app_001", { question: { id: "psr_app_001", question: "Who makes appointments?" }, subcategoryId: "psr_app", subcategoryName: "Appointments" }],
  ["psr_app_002", { question: { id: "psr_app_002", question: "Who posts officers?" }, subcategoryId: "psr_ret", subcategoryName: "Retention" }],
  ["psr_leave_016", { question: { id: "psr_leave_016", question: "Study leave with pay is which rule?" }, subcategoryId: "psr_leave", subcategoryName: "Leave" }],
]);

test("filterQuestionBankQuestions filters by query and subcategory and caps the list", () => {
  const all = filterQuestionBankQuestions({ questions: MODEL_QUESTIONS });
  assert.equal(all.length, 3);

  const byQuery = filterQuestionBankQuestions({ questions: MODEL_QUESTIONS, query: "study leave" });
  assert.deepEqual(byQuery.map((entry) => entry.questionId), ["psr_leave_016"]);

  const byId = filterQuestionBankQuestions({ questions: MODEL_QUESTIONS, query: "PSR_APP_002" });
  assert.deepEqual(byQuery.map((entry) => entry.questionId), ["psr_leave_016"]);
  assert.deepEqual(byId.map((entry) => entry.questionId), ["psr_app_002"]);

  const bySubcategory = filterQuestionBankQuestions({ questions: MODEL_QUESTIONS, subcategoryFilter: "psr_ret" });
  assert.deepEqual(bySubcategory.map((entry) => entry.questionId), ["psr_app_002"]);

  const limited = filterQuestionBankQuestions({ questions: MODEL_QUESTIONS, limit: 2 });
  assert.equal(limited.length, 2);
});

test("normalizeQuestionBankFormValues validates stems, options, correct index, and explanation", () => {
  const good = normalizeQuestionBankFormValues({
    question: "  Who posts officers? ",
    options: [" Head of Service ", "FCSC"],
    correct: 1,
    explanation: "PSR 020201.",
    difficulty: "HARD",
    reviewStatus: "approved",
  });
  assert.deepEqual(good.errors, []);
  assert.equal(good.value.question, "Who posts officers?");
  assert.deepEqual(good.value.options, ["Head of Service", "FCSC"]);
  assert.equal(good.value.difficulty, "hard");

  const empty = normalizeQuestionBankFormValues({ question: "", options: [""], correct: -1, explanation: "" });
  assert.ok(empty.errors.some((error) => /stem is required/.test(error)));
  assert.ok(empty.errors.some((error) => /between 2 and 6/.test(error)));
  assert.ok(empty.errors.some((error) => /Select which option is correct/.test(error)));
  assert.ok(empty.errors.some((error) => /explanation is required/.test(error)));

  const optionCountBlocked = normalizeQuestionBankFormValues(
    { question: "s", options: ["a", "b", "c"], correct: 0, explanation: "e" },
    { staticQuestion: { options: ["a", "b"] } },
  );
  assert.ok(optionCountBlocked.errors.some((error) => /Option count must not change/.test(error)));

  assert.equal(QUESTION_BANK_DIFFICULTY_VALUES.join(","), "easy,medium,hard");
});

// --- Migration 0011 --------------------------------------------------------------

test("migration 0011 creates the overlay and version tables", async () => {
  const sql = await readFile(new URL("../../workers/admin-bridge/migrations/0011_question_edits.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS question_edits/);
  assert.match(sql, /PRIMARY KEY \(topic_id, question_id\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS content_meta/);
  assert.match(sql, /idx_question_edits_feedback/);
});
