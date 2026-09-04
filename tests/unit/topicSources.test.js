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

class MemoryCache {
  constructor() {
    this.entries = new Map();
  }

  normalizeKey(request) {
    return typeof request === "string" ? request : request.url;
  }

  async match(request) {
    const entry = this.entries.get(this.normalizeKey(request));
    return entry ? entry.clone() : undefined;
  }

  async put(request, response) {
    this.entries.set(this.normalizeKey(request), response.clone());
  }

  async keys() {
    // Return the raw keys (URL strings). The real API returns Request objects,
    // but the module code treats them opaquely, so strings are interchangeable.
    return [...this.entries.keys()];
  }

  async delete(request) {
    return this.entries.delete(this.normalizeKey(request));
  }

  async count() {
    return this.entries.size;
  }
}

class MemoryCacheStorage {
  constructor() {
    this.caches = new Map();
    this.deleted = [];
  }

  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new MemoryCache());
    return this.caches.get(name);
  }

  async delete(name) {
    this.deleted.push(name);
    return this.caches.delete(name);
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
    window,
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
    const cacheKey = "promotion-cbt:json-cache:v2:/data/cache-test.json";
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
    const cacheKey = "promotion-cbt:json-cache:v2:/data/stale-cache.json";
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
    const cacheKey = "promotion-cbt:json-cache:v2:/data/recover-cache.json";
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

test("fetchJsonFile uses fresh Cache Storage entry before network fetch", async () => {
  const ctx = installBrowserContext();
  const caches = new MemoryCacheStorage();
  ctx.window.caches = caches;
  try {
    const cache = await caches.open("promotion-cbt:topic-json:v1");
    await cache.put(
      "/data/cache-test.json",
      new Response(JSON.stringify({ source: "cache-storage", value: 1 }), {
        headers: { "X-Cached-At": String(Date.now()) },
      }),
    );

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      throw new Error("Network should not be called for fresh Cache Storage entry");
    };

    const result = await fetchJsonFile("data/cache-test.json");
    assert.deepEqual(result, { source: "cache-storage", value: 1 });
    assert.equal(fetchCalls, 0);
  } finally {
    ctx.restore();
  }
});

test("fetchJsonFile falls back to stale Cache Storage entry when fetch fails", async () => {
  const ctx = installBrowserContext();
  const caches = new MemoryCacheStorage();
  ctx.window.caches = caches;
  try {
    const cache = await caches.open("promotion-cbt:topic-json:v1");
    await cache.put(
      "/data/stale-cache.json",
      new Response(JSON.stringify({ source: "stale-cache", recovered: true }), {
        headers: { "X-Cached-At": String(Date.now() - (7 * 60 * 60 * 1000)) },
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

test("fetchJsonFile persists to Cache Storage and skips localStorage when available", async () => {
  const ctx = installBrowserContext();
  const caches = new MemoryCacheStorage();
  ctx.window.caches = caches;
  try {
    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      return {
        ok: true,
        text: async () => JSON.stringify({ source: "network", cached: true }),
      };
    };

    const result = await fetchJsonFile("data/cache-test.json");
    assert.deepEqual(result, { source: "network", cached: true });
    assert.equal(fetchCalls, 1);

    const cache = await caches.open("promotion-cbt:topic-json:v1");
    const match = await cache.match("/data/cache-test.json");
    assert.ok(match, "Cache Storage should hold the fetched payload");
    assert.deepEqual(JSON.parse(await match.text()), { source: "network", cached: true });
    assert.equal(
      ctx.localStorage.getItem("promotion-cbt:json-cache:v2:/data/cache-test.json"),
      null,
      "localStorage should not be written when Cache Storage is available",
    );
  } finally {
    ctx.restore();
  }
});

test("Cache Storage entries are pruned to the maximum count, oldest first", async () => {
  const ctx = installBrowserContext();
  const caches = new MemoryCacheStorage();
  ctx.window.caches = caches;
  try {
    global.fetch = async () => ({
      ok: true,
      text: async () => JSON.stringify({ source: "network", ok: true }),
    });

    const fileCount = 25;
    for (let index = 0; index < fileCount; index += 1) {
      await fetchJsonFile(`data/f${String(index).padStart(2, "0")}.json`);
    }

    const cache = await caches.open("promotion-cbt:topic-json:v1");
    assert.ok((await cache.count()) <= 24, "cache should stay at or below the entry cap");
    assert.equal(await cache.match("/data/f00.json"), undefined, "oldest entry should be evicted");
    assert.ok(await cache.match("/data/f24.json"), "newest entry should survive");
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

test("fetchTopicDataFilesWithReport falls back to public files without a cloud token", async () => {
  const ctx = installBrowserContext();
  try {
    const calls = [];
    global.fetch = async (url) => {
      calls.push(url);
      assert.notEqual(url, "https://worker.example.com/content/topic-data");
      return {
        ok: true,
        text: async () => JSON.stringify({ subcategories: [{ id: "public", questions: [] }] }),
      };
    };

    const result = await fetchTopicDataFilesWithReport(
      { id: "psr", file: "data/psr_rules.json" },
      { tolerateFailures: true },
    );

    assert.deepEqual(calls, ["/data/psr_rules.json"]);
    assert.deepEqual(result.payloads, [{ subcategories: [{ id: "public", questions: [] }] }]);
    assert.deepEqual(result.loadedFiles, ["data/psr_rules.json"]);
    assert.deepEqual(result.failedFiles, []);
    assert.equal(result.totalFiles, 1);
  } finally {
    ctx.restore();
  }
});

test("fetchJsonFile retries a relative fallback path when the primary base path misses", async () => {
  const ctx = installBrowserContext({ pathname: "/nested-preview/" });
  try {
    const calls = [];
    global.fetch = async (url) => {
      calls.push(url);
      if (url === "/data/topics.json") {
        return { ok: false, status: 404, text: async () => "not found" };
      }
      if (url === "data/topics.json") {
        return {
          ok: true,
          text: async () => JSON.stringify({ topics: [{ id: "psr" }] }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    };

    const result = await fetchJsonFile("data/topics.json");
    assert.deepEqual(result, { topics: [{ id: "psr" }] });
    assert.deepEqual(calls, ["/data/topics.json", "data/topics.json"]);
  } finally {
    ctx.restore();
  }
});
