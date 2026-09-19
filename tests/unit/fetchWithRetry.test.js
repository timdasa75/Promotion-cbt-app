// Unit tests for the shared fetch hardening helper (js/fetchWithRetry.js).
//
// Coverage:
// 1. First-attempt success passes the response straight through.
// 2. Network-level failures (TypeError) are retried with backoff, then succeed.
// 3. Retries are bounded — exhausted retries rethrow the last network error.
// 4. Per-attempt timeout: a hung fetch is aborted and (if budget remains) retried.
// 5. HTTP responses are NOT retried by default (safe for non-idempotent POSTs).
// 6. shouldRetryResponse opts read-style callers into HTTP-status retries
//    (isTransientHttpStatus covers 408/425/429/5xx, not 4xx client errors).
// 7. Caller-provided signal in options is replaced by the internal controller.
// 8. fetchImpl injection works (postAdminApiJson passes its own fetch through).

import test from "node:test";
import assert from "node:assert/strict";
import { fetchWithRetry, isTransientHttpStatus } from "../../js/fetchWithRetry.js";

const ok = (body = { ok: true }) => new Response(JSON.stringify(body), { status: 200 });

function failingThenSucceedingFetch(failures, successResponse = ok()) {
  let calls = 0;
  return {
    fetchImpl: async () => {
      calls += 1;
      if (calls <= failures) {
        throw new TypeError("Failed to fetch");
      }
      return successResponse;
    },
    calls: () => calls,
  };
}

test("returns the first successful response without retries", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return ok({ ok: true, value: calls });
  };
  const response = await fetchWithRetry("https://example.test/x", {}, { fetchImpl });
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
});

test("retries network-level TypeErrors with backoff and then succeeds", async () => {
  const { fetchImpl, calls } = failingThenSucceedingFetch(2);
  const response = await fetchWithRetry("https://example.test/x", {}, {
    fetchImpl,
    sleep: async () => {}, // skip real backoff delays
  });
  assert.equal(response.status, 200);
  assert.equal(calls(), 3); // 2 failures + 1 success
});

test("rethrows the network error when retries are exhausted", async () => {
  const fetchImpl = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    fetchWithRetry("https://example.test/x", {}, { fetchImpl, sleep: async () => {}, retries: 1 }),
    TypeError,
  );
});

test("aborts a hung attempt after timeoutMs and retries", async () => {
  let calls = 0;
  // Attempt 1 hangs until aborted (verifies the timeout fires and aborts);
  // attempt 2 resolves immediately (verifies the retry lands).
  const fetchImpl = (url, options = {}) => {
    calls += 1;
    if (calls === 1) {
      return new Promise((resolve, reject) => {
        options.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });
    }
    return Promise.resolve(ok());
  };
  const response = await fetchWithRetry("https://example.test/x", {}, {
    fetchImpl,
    sleep: async () => {},
    timeoutMs: 20,
  });
  assert.equal(response.status, 200);
  assert.equal(calls, 2); // first attempt timed out, second succeeded
});

test("does not retry HTTP responses by default (non-idempotent POST safety)", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  };
  const response = await fetchWithRetry("https://example.test/x", {}, { fetchImpl, sleep: async () => {} });
  assert.equal(response.status, 500);
  assert.equal(calls, 1);
});

test("shouldRetryResponse opts into transient-status retries for reads", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ ok: false }), { status: 503 });
    }
    return ok();
  };
  const response = await fetchWithRetry("https://example.test/x", {}, {
    fetchImpl,
    sleep: async () => {},
    shouldRetryResponse: isTransientHttpStatus,
  });
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});

test("isTransientHttpStatus covers 408/425/429/5xx but not other 4xx", () => {
  assert.equal(isTransientHttpStatus(408), true);
  assert.equal(isTransientHttpStatus(425), true);
  assert.equal(isTransientHttpStatus(429), true);
  assert.equal(isTransientHttpStatus(500), true);
  assert.equal(isTransientHttpStatus(503), true);
  assert.equal(isTransientHttpStatus(400), false);
  assert.equal(isTransientHttpStatus(401), false);
  assert.equal(isTransientHttpStatus(403), false);
  assert.equal(isTransientHttpStatus(404), false);
});

test("options.signal is replaced by the internal timeout controller", async () => {
  const external = new AbortController();
  let seenSignal;
  const fetchImpl = async (url, options = {}) => {
    seenSignal = options.signal;
    return ok();
  };
  await fetchWithRetry("https://example.test/x", { signal: external.signal }, { fetchImpl });
  assert.notEqual(seenSignal, external.signal);
});

test("injectable fetchImpl is used (postAdminApiJson pass-through)", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return ok();
  };
  await fetchWithRetry("https://example.test/x", {}, { fetchImpl, sleep: async () => {} });
  assert.equal(calls, 1);
});

test("backoff delay grows exponentially with jitter", async () => {
  const delays = [];
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls <= 2) {
      throw new TypeError("Failed to fetch");
    }
    return ok();
  };
  await fetchWithRetry("https://example.test/x", {}, {
    fetchImpl,
    sleep: async (ms) => delays.push(ms),
    baseDelayMs: 100,
  });
  assert.equal(delays.length, 2);
  // attempt 0: 100..200, attempt 1: 200..400 (base * 2^n + jitter < base * 2^(n+1))
  assert.ok(delays[0] >= 100 && delays[0] < 200, `first delay ${delays[0]} in [100,200)`);
  assert.ok(delays[1] >= 200 && delays[1] < 400, `second delay ${delays[1]} in [200,400)`);
});
