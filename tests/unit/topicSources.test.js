import test from "node:test";
import assert from "node:assert/strict";

import {
  __resetTopicSourceCachesForTests,
  fetchJsonFile,
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

function installBrowserContext({ pathname = "/", flags = { enablePersistentJsonCache: true } } = {}) {
  const storage = new MemoryStorage();
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  const previousWarn = console.warn;

  global.window = {
    location: { pathname },
    localStorage: storage,
    PROMOTION_CBT_FEATURES: flags,
  };

  console.warn = () => {};
  __resetTopicSourceCachesForTests();

  return {
    storage,
    restore() {
      __resetTopicSourceCachesForTests();
      global.window = previousWindow;
      global.fetch = previousFetch;
      console.warn = previousWarn;
    },
  };
}

test("fetchJsonFile uses fresh persistent cache before network fetch", async () => {
  const ctx = installBrowserContext();
  try {
    const cacheKey = "promotion-cbt:json-cache:v1:/data/cache-test.json";
    ctx.storage.setItem(
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
    ctx.storage.setItem(
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
    ctx.storage.setItem(cacheKey, "{not-json");

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

    const refreshedEntry = JSON.parse(ctx.storage.getItem(cacheKey));
    assert.deepEqual(JSON.parse(refreshedEntry.text), { source: "network", refreshed: true });
  } finally {
    ctx.restore();
  }
});
