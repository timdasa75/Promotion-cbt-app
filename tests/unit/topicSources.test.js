import test from "node:test";
import assert from "node:assert/strict";

import {
  __resetTopicSourceCachesForTests,
  fetchJsonFile,
  fetchTopicDataFilesWithReport,
} from "../../js/topicSources.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

function installBrowserContext({
  pathname = "/",
  flags = { enablePersistentJsonCache: true },
  auth = {},
  session = null,
} = {}) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  const previousWarn = console.warn;
  const previousLocalStorage = global.localStorage;

  global.window = {
    location: { pathname },
    localStorage,
    sessionStorage,
    PROMOTION_CBT_FEATURES: flags,
    PROMOTION_CBT_AUTH: auth,
  };
  global.localStorage = localStorage;

  if (session) {
    sessionStorage.setItem("cbt_session_v1", JSON.stringify(session));
  }

  console.warn = () => {};
  __resetTopicSourceCachesForTests();

  return {
    localStorage,
    sessionStorage,
    restore() {
      __resetTopicSourceCachesForTests();
      global.window = previousWindow;
      global.fetch = previousFetch;
      global.localStorage = previousLocalStorage;
      console.warn = previousWarn;
    },
  };
}

test("fetchJsonFile uses fresh persistent cache before network fetch", async () => {
  const ctx = installBrowserContext();
  try {
    const cacheKey = "promotion-cbt:json-cache:v1:/data/cache-test.json";
    ctx.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        text: JSON.stringify({ source: "cache", value: 1 }),
      }),
    );

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      throw new Error("Network should not be called for fresh cache");
    };

    const result = await fetchJsonFile("data/cache-test.json");
    assert.deepEqual(result, { source: "cache", value: 1 });
    assert.equal(fetchCalls, 0);
  } finally {
    ctx.restore();
  }
});

test("fetchJsonFile falls back to stale persistent cache when fetch fails", async () => {
  const ctx = installBrowserContext();
  try {
    const cacheKey = "promotion-cbt:json-cache:v1:/data/stale-cache.json";
    ctx.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now() - (7 * 60 * 60 * 1000),
        text: JSON.stringify({ source: "stale-cache", recovered: true }),
      }),
    );

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      throw new Error("offline");
    };

    const result = await fetchJsonFile("data/stale-cache.json");
    assert.deepEqual(result, { source: "stale-cache", recovered: true });
    assert.equal(fetchCalls, 1);
  } finally {
    ctx.restore();
  }
});

test("fetchJsonFile discards malformed cache payloads and refreshes from network", async () => {
  const ctx = installBrowserContext();
  try {
    const cacheKey = "promotion-cbt:json-cache:v1:/data/recover-cache.json";
    ctx.localStorage.setItem(cacheKey, "{not-json");

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      return {
        ok: true,
        text: async () => JSON.stringify({ source: "network", refreshed: true }),
      };
    };

    const result = await fetchJsonFile("data/recover-cache.json");
    assert.deepEqual(result, { source: "network", refreshed: true });
    assert.equal(fetchCalls, 1);

    const refreshedEntry = JSON.parse(ctx.localStorage.getItem(cacheKey));
    assert.deepEqual(JSON.parse(refreshedEntry.text), { source: "network", refreshed: true });
  } finally {
    ctx.restore();
  }
});

test("fetchTopicDataFilesWithReport requests protected topic content from the worker", async () => {
  const ctx = installBrowserContext({
    auth: {
      cloudflareAuthBaseUrl: "https://worker.example.com",
    },
    session: {
      provider: "cloudflare",
      accessToken: "cf-session-token",
      refreshToken: "",
      expiresAt: Date.now() + 60_000,
      createdAt: "2026-04-29T10:00:00Z",
      lastPlanSyncAt: "",
      user: {
        id: "user-1",
        email: "user@example.com",
        plan: "free",
      },
    },
  });

  try {
    let fetchCalls = 0;
    global.fetch = async (url, options = {}) => {
      fetchCalls += 1;
      assert.equal(url, "https://worker.example.com/content/topic-data");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer cf-session-token");
      assert.deepEqual(JSON.parse(options.body), {
        topicId: "psr",
        tolerateFailures: true,
      });
      return {
        ok: true,
        json: async () => ({
          ok: true,
          payloads: [{ subcategories: [{ id: "a", questions: [{ id: "q1" }] }] }],
          loadedFiles: ["data/psr_rules.json"],
          failedFiles: [],
          totalFiles: 1,
        }),
      };
    };

    const result = await fetchTopicDataFilesWithReport(
      { id: "psr", file: "data/psr_rules.json" },
      { tolerateFailures: true },
    );
    assert.equal(fetchCalls, 1);
    assert.deepEqual(result.payloads, [{ subcategories: [{ id: "a", questions: [{ id: "q1" }] }] }]);

    const cached = await fetchTopicDataFilesWithReport(
      { id: "psr", file: "data/psr_rules.json" },
      { tolerateFailures: true },
    );
    assert.equal(fetchCalls, 1);
    assert.deepEqual(cached.loadedFiles, ["data/psr_rules.json"]);
  } finally {
    ctx.restore();
  }
});
