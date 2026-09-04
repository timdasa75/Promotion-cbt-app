import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomUUID } from "node:crypto";

import worker, { __resetTopicDataCachesForTests } from "../../workers/admin-bridge/worker.js";

const ALLOWED_ORIGINS = "https://app.example.test";
const WORKER_URL = "https://worker.example.test/content/topic-data";

// ---- Cache Storage mock (global.caches.default) ----
class MemoryCacheStorage {
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

  async delete(request) {
    return this.entries.delete(this.normalizeKey(request));
  }

  async has(request) {
    return this.entries.has(this.normalizeKey(request));
  }
}

function installCacheStorage() {
  const previous = global.caches;
  const storage = new MemoryCacheStorage();
  global.caches = { default: storage };
  return {
    storage,
    restore() {
      if (previous === undefined) {
        delete global.caches;
      } else {
        global.caches = previous;
      }
    },
  };
}

// ---- D1 mock (auth_sessions + auth_users) ----
function makeDatabase({ plan, email }) {
  const sessionId = randomUUID();
  const sessionSecret = `${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "")}`;
  const sessionSecretHash = createHash("sha256").update(sessionSecret).digest("base64url");
  const token = `${sessionId}.${sessionSecret}`;
  const user = {
    id: "user-1",
    email,
    password_hash: "unused",
    role: "user",
    plan,
    status: "active",
    email_verified: 1,
    legacy_provider: "",
    legacy_user_id: "",
    created_at: "",
    updated_at: "",
    last_login_at: "",
  };

  const database = {
    prepare(sql) {
      const text = String(sql);
      return {
        bind() {
          return {
            async first() {
              if (text.includes("FROM auth_sessions")) {
                return {
                  session_id: sessionId,
                  user_id: "user-1",
                  session_secret_hash: sessionSecretHash,
                  refresh_secret_hash: "",
                  created_at: "",
                  expires_at: new Date(Date.now() + 3600_000).toISOString(),
                  last_seen_at: "",
                };
              }
              if (text.includes("FROM auth_users")) {
                return { ...user };
              }
              return null;
            },
            async run() {
              return {};
            },
          };
        },
      };
    },
  };

  return { database, token };
}

// ---- Protected-content assets mock ----
function makeAssetBinding(dataByPath) {
  const calls = new Map();
  let failAll = false;
  const binding = {
    calls,
    failAll(value) {
      failAll = value;
    },
    async fetch(request) {
      const key = new URL(request.url).pathname.replace(/^\//, "");
      calls.set(key, (calls.get(key) || 0) + 1);
      if (failAll) {
        throw new Error("asset binding is unavailable (simulated)");
      }
      if (!(key in dataByPath)) {
        return new Response("not found", { status: 404 });
      }
      return new Response(JSON.stringify(dataByPath[key]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
  return binding;
}

function buildTopicBank(subcategoryCount, questionsPerSubcategory) {
  return {
    subcategories: Array.from({ length: subcategoryCount }, (_, i) => ({
      id: `cat-${i}`,
      name: `Category ${i}`,
      questions: Array.from({ length: questionsPerSubcategory }, (_, j) => ({
        id: `q-${i}-${j}`,
        question: `Question ${i}-${j}`,
      })),
    })),
  };
}

const CATALOG = {
  topics: [
    { id: "psr", file: "data/psr_rules.json" },
    { id: "ethics", file: "data/civil_service_ethics.json" },
  ],
};

function makeEnv({ plan = "free", email = "learner@example.com" }) {
  const { database, token } = makeDatabase({ plan, email });
  const binding = makeAssetBinding({
    "topics.json": CATALOG,
    "psr_rules.json": buildTopicBank(6, 25),
    "civil_service_ethics.json": buildTopicBank(6, 25),
  });
  return {
    env: {
      ALLOWED_ORIGINS,
      AUTH_DB: database,
      PROTECTED_CONTENT: binding,
    },
    token,
    binding,
  };
}

function topicDataRequest(token, body) {
  return new Request(WORKER_URL, {
    method: "POST",
    headers: {
      Origin: "https://app.example.test",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("topic-data edge cache serves repeat loads and carries private Cache-Control", async () => {
  __resetTopicDataCachesForTests();
  const cacheCtx = installCacheStorage();
  const { env, token, binding } = makeEnv({ plan: "free" });
  try {
    const first = await worker.fetch(topicDataRequest(token, { topicId: "psr" }), env, {});
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    assert.equal(firstBody.ok, true);
    assert.equal(firstBody.entitlement, "free");
    assert.equal(firstBody.payloads[0].subcategories.length, 5, "free tier slices to 5 subcategories");
    assert.equal(firstBody.payloads[0].subcategories[0].questions.length, 20, "free tier slices to 20 questions");
    assert.equal(binding.calls.get("psr_rules.json"), 1);

    const edgeKey = new Request(
      `https://topic-data-cache.local/topic-data%3Av1%3Afree%3Apsr`,
    );
    assert.equal(await cacheCtx.storage.has(edgeKey), true, "free response should be stored at the edge");

    // Second load must come from the edge cache even when the asset binding dies.
    binding.failAll(true);
    const second = await worker.fetch(topicDataRequest(token, { topicId: "psr" }), env, {});
    assert.equal(second.status, 200);
    assert.equal(second.headers.get("Cache-Control"), "private, max-age=1800");
    assert.deepEqual(await second.json(), firstBody);
    assert.equal(binding.calls.get("psr_rules.json"), 1, "no asset fetch on edge-cache hit");
  } finally {
    cacheCtx.restore();
  }
});

test("topic-data edge cache keys never mix free and premium content", async () => {
  __resetTopicDataCachesForTests();
  const cacheCtx = installCacheStorage();
  const free = makeEnv({ plan: "free", email: "free@example.com" });
  const premium = makeEnv({ plan: "premium", email: "premium@example.com" });
  try {
    const freeResponse = await worker.fetch(
      topicDataRequest(free.token, { topicId: "ethics" }),
      free.env,
      {},
    );
    const freeBody = await freeResponse.json();
    assert.equal(freeBody.entitlement, "free");
    assert.equal(freeBody.payloads[0].subcategories.length, 5);

    const premiumResponse = await worker.fetch(
      topicDataRequest(premium.token, { topicId: "ethics" }),
      premium.env,
      {},
    );
    const premiumBody = await premiumResponse.json();
    assert.equal(premiumBody.entitlement, "premium");
    assert.equal(premiumBody.payloads[0].subcategories.length, 6, "premium sees the full bank");
    assert.equal(premiumBody.payloads[0].subcategories[0].questions.length, 25);

    assert.equal(
      await cacheCtx.storage.has(new Request("https://topic-data-cache.local/topic-data%3Av1%3Afree%3Aethics")),
      true,
    );
    assert.equal(
      await cacheCtx.storage.has(new Request("https://topic-data-cache.local/topic-data%3Av1%3Apremium%3Aethics")),
      true,
    );

    // A repeat free request must keep receiving the sliced (free) copy.
    premium.binding.failAll(true);
    const freeAgain = await worker.fetch(
      topicDataRequest(free.token, { topicId: "ethics" }),
      free.env,
      {},
    );
    const freeAgainBody = await freeAgain.json();
    assert.equal(freeAgainBody.entitlement, "free");
    assert.equal(freeAgainBody.payloads[0].subcategories.length, 5);
  } finally {
    cacheCtx.restore();
  }
});

test("per-isolate parsed-asset cache survives edge-cache eviction", async () => {
  __resetTopicDataCachesForTests();
  const cacheCtx = installCacheStorage();
  const { env, token, binding } = makeEnv({ plan: "free" });
  try {
    const first = await worker.fetch(topicDataRequest(token, { topicId: "psr" }), env, {});
    assert.equal(first.status, 200);
    assert.equal(binding.calls.get("psr_rules.json"), 1);

    // Evict the edge entry, then make the asset binding unavailable: the
    // per-isolate parsed-asset cache must still serve the topic.
    await cacheCtx.storage.delete(
      new Request("https://topic-data-cache.local/topic-data%3Av1%3Afree%3Apsr"),
    );
    binding.failAll(true);
    const second = await worker.fetch(topicDataRequest(token, { topicId: "psr" }), env, {});
    assert.equal(second.status, 200);
    const secondBody = await second.json();
    assert.equal(secondBody.ok, true);
    assert.equal(secondBody.payloads[0].subcategories.length, 5);
    assert.equal(binding.calls.get("psr_rules.json"), 1, "asset fetch happened once total");
    assert.equal(binding.calls.get("topics.json"), 1);
  } finally {
    cacheCtx.restore();
  }
});

test("topic-data cache is skipped when no Cache Storage is available", async () => {
  __resetTopicDataCachesForTests();
  const { env, token, binding } = makeEnv({ plan: "free" });
  const response = await worker.fetch(topicDataRequest(token, { topicId: "psr" }), env, {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.entitlement, "free");
  assert.equal(binding.calls.get("psr_rules.json"), 1);
});