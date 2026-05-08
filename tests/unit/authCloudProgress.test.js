import test from "node:test";
import assert from "node:assert/strict";

import {
  ensureCloudProgressSession,
  readCloudProgressSummary,
  writeCloudProgressSummary,
} from "../../js/authCloudProgress.js";

test("cloud progress session requires enabled firebase session", async () => {
  await assert.rejects(
    ensureCloudProgressSession({
      cloudProgressEnabled: false,
      getSession: () => null,
      refreshSession: async () => null,
    }),
    /Cloud progress sync is not enabled/,
  );

  const session = await ensureCloudProgressSession({
    cloudProgressEnabled: true,
    getSession: () => ({ provider: "firebase", accessToken: "old", user: { id: "u1" } }),
    refreshSession: async () => ({ provider: "firebase", accessToken: "new", user: { id: "u1" } }),
  });
  assert.equal(session.accessToken, "new");
});

test("cloud progress reader normalizes empty and saved documents", async () => {
  const ensureSession = async () => ({ accessToken: "token-1", user: { id: "u1" } });

  const empty = await readCloudProgressSummary({
    ensureSession,
    getDocument: async () => null,
  });
  assert.equal(empty.exists, false);
  assert.deepEqual(empty.summary, { attempts: [] });

  const saved = await readCloudProgressSummary({
    ensureSession,
    getDocument: async () => ({
      fields: {
        schemaVersion: { integerValue: "1" },
        updatedAt: { timestampValue: "2026-03-18T10:00:00.000Z" },
        deviceId: { stringValue: "device-1" },
        progressSummaryJson: { stringValue: '{"attempts":[{"topicId":"t1","topicName":"Topic 1","createdAt":"2026-03-18T09:00:00Z"}]}' },
        retryQueueJson: { stringValue: '[{"id":"r1","updatedAt":"2026-03-18T08:00:00Z","question":{"id":"q1"}}]' },
        spacedQueueJson: { stringValue: '[{"questionId":"q1","dueAt":"2026-03-19T00:00:00Z"}]' },
      },
    }),
  });
  assert.equal(saved.exists, true);
  assert.equal(saved.deviceId, "device-1");
  assert.equal(saved.summary.attempts.length, 1);
  assert.equal(saved.retryQueue.length, 1);
  assert.equal(saved.spacedQueue.length, 1);
});

test("cloud progress writer persists normalized payloads", async () => {
  const calls = [];
  const result = await writeCloudProgressSummary(
    { attempts: [{ topicId: "t1", topicName: "Topic 1", createdAt: "2026-03-18T09:00:00Z" }] },
    {
      deviceId: " device-1 ",
      retryQueue: [{ id: "r1", updatedAt: "2026-03-18T08:00:00Z", question: { id: "q1" } }],
      spacedQueue: [{ questionId: "q1", dueAt: "2026-03-19T00:00:00Z" }],
    },
    {
      ensureSession: async () => ({ accessToken: "token-1", user: { id: "u1" } }),
      requester: async (path, options) => {
        calls.push({ path, options });
        return {};
      },
    },
  );

  assert.equal(result.saved, true);
  assert.equal(result.summary.attempts.length, 1);
  assert.equal(calls.length, 1);
  assert.match(calls[0].path, /^documents\/progress\/u1\?/);
  assert.equal(calls[0].options.idToken, "token-1");
  assert.equal(calls[0].options.body.fields.deviceId.stringValue, "device-1");
});

test("cloud progress reader and writer support Cloudflare sessions", async () => {
  const readPayload = await readCloudProgressSummary({
    ensureSession: async () => ({ provider: "cloudflare", accessToken: "cf-token", user: { id: "cf-1" } }),
    fetchCloudflare: async (token) => {
      assert.equal(token, "cf-token");
      return {
        progress: {
          updatedAt: "2026-05-08T10:00:00.000Z",
          deviceId: "device-1",
          summary: {
            attempts: [
              {
                topicId: "psr",
                topicName: "Public Service Rules",
                createdAt: "2026-05-08T09:00:00.000Z",
              },
            ],
          },
          retryQueue: [{ id: "r1", updatedAt: "2026-05-08T09:30:00.000Z", question: { id: "q1" } }],
          spacedQueue: [{ questionId: "q1", dueAt: "2026-05-09T00:00:00.000Z" }],
        },
      };
    },
  });

  assert.equal(readPayload.exists, true);
  assert.equal(readPayload.summary.attempts.length, 1);
  assert.equal(readPayload.retryQueue.length, 1);
  assert.equal(readPayload.spacedQueue.length, 1);

  const writePayload = await writeCloudProgressSummary(
    readPayload.summary,
    {
      deviceId: "device-2",
      retryQueue: readPayload.retryQueue,
      spacedQueue: readPayload.spacedQueue,
    },
    {
      ensureSession: async () => ({ provider: "cloudflare", accessToken: "cf-token", user: { id: "cf-1" } }),
      writeCloudflare: async (token, body) => {
        assert.equal(token, "cf-token");
        assert.equal(body.progress.deviceId, "device-2");
        assert.equal(body.progress.summary.attempts.length, 1);
      },
    },
  );

  assert.equal(writePayload.saved, true);
  assert.equal(writePayload.summary.attempts.length, 1);
});
