import { isFeatureEnabled } from "./features.js";
import { requestCloudflareAuth } from "./authCloudflareClient.js";
import { readSession } from "./authStorage.js";
import {
  collectSubcategories,
  countQuestionsFromTopicData,
  extractQuestionsByCategory,
  getQuestionsFromSubcategory,
} from "./topicDataShape.js";

// topicSources.js - shared utilities for topic data sources

const jsonCache = new Map();
const protectedTopicCache = new Map();
const PERSISTENT_CACHE_PREFIX = "promotion-cbt:json-cache:v1:";
const PERSISTENT_CACHE_INDEX_KEY = `${PERSISTENT_CACHE_PREFIX}index`;
const PERSISTENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PERSISTENT_CACHE_MAX_TOTAL_BYTES = 3_500_000;
const PERSISTENT_CACHE_MAX_ENTRY_BYTES = 1_500_000;

function getPersistentCacheStorage() {
  if (typeof window === "undefined") return null;
  if (!isFeatureEnabled("enablePersistentJsonCache")) return null;

  try {
    return window.localStorage || null;
  } catch (_error) {
    return null;
  }
}

function getPersistentCacheKey(filePath) {
  return `${PERSISTENT_CACHE_PREFIX}${filePath}`;
}

function estimateSerializedSize(text) {
  return String(text || "").length * 2;
}

function readPersistentCacheIndex(storage) {
  if (!storage) return {};

  try {
    const raw = storage.getItem(PERSISTENT_CACHE_INDEX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function writePersistentCacheIndex(storage, index) {
  if (!storage) return;

  try {
    storage.setItem(PERSISTENT_CACHE_INDEX_KEY, JSON.stringify(index || {}));
  } catch (_error) {
    // Ignore index write failures so cache lookup never blocks the quiz flow.
  }
}

function removePersistentCacheEntry(storage, index, cacheKey) {
  if (!storage || !cacheKey) return;
  try {
    storage.removeItem(cacheKey);
  } catch (_error) {
    // Ignore removal failures.
  }
  if (index && typeof index === "object") {
    delete index[cacheKey];
  }
}

function prunePersistentCacheEntries(storage, index, incomingSize = 0, excludeKey = "") {
  if (!storage || !index || typeof index !== "object") return index || {};

  const normalizedIndex = { ...index };
  const entries = Object.entries(normalizedIndex)
    .filter(([cacheKey]) => cacheKey !== excludeKey)
    .filter(([cacheKey]) => {
      const hasBackingValue = storage.getItem(cacheKey) !== null;
      if (!hasBackingValue) {
        delete normalizedIndex[cacheKey];
      }
      return hasBackingValue;
    })
    .sort((left, right) => (left[1]?.cachedAt || 0) - (right[1]?.cachedAt || 0));

  let currentBytes = entries.reduce((sum, [, entry]) => sum + Math.max(0, Number(entry?.size || 0)), 0);
  const allowedBytes = Math.max(0, PERSISTENT_CACHE_MAX_TOTAL_BYTES - Math.max(0, Number(incomingSize || 0)));

  for (const [cacheKey, entry] of entries) {
    if (currentBytes <= allowedBytes) break;
    currentBytes -= Math.max(0, Number(entry?.size || 0));
    removePersistentCacheEntry(storage, normalizedIndex, cacheKey);
  }

  return normalizedIndex;
}

function persistJsonText(filePath, text) {
  const storage = getPersistentCacheStorage();
  if (!storage) return;

  const trimmedText = String(text || "");
  if (!trimmedText || trimmedText.trim().startsWith("<")) return;

  const cacheKey = getPersistentCacheKey(filePath);
  const cachedAt = Date.now();
  const payload = JSON.stringify({ cachedAt, text: trimmedText });
  const entrySize = estimateSerializedSize(payload);
  if (entrySize > PERSISTENT_CACHE_MAX_ENTRY_BYTES) return;

  let index = readPersistentCacheIndex(storage);
  removePersistentCacheEntry(storage, index, cacheKey);
  index = prunePersistentCacheEntries(storage, index, entrySize, cacheKey);

  const writeEntry = () => {
    storage.setItem(cacheKey, payload);
    index[cacheKey] = {
      filePath,
      size: entrySize,
      cachedAt,
    };
    writePersistentCacheIndex(storage, index);
  };

  try {
    writeEntry();
  } catch (_error) {
    index = prunePersistentCacheEntries(storage, index, entrySize, cacheKey);
    try {
      writeEntry();
    } catch (_retryError) {
      removePersistentCacheEntry(storage, index, cacheKey);
      writePersistentCacheIndex(storage, index);
    }
  }
}

function readPersistentJsonText(filePath) {
  const storage = getPersistentCacheStorage();
  if (!storage) return null;

  const cacheKey = getPersistentCacheKey(filePath);
  try {
    const raw = storage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const text = String(parsed?.text || "");
    const cachedAt = Math.max(0, Number(parsed?.cachedAt || 0));
    if (!text || !cachedAt) {
      const index = readPersistentCacheIndex(storage);
      removePersistentCacheEntry(storage, index, cacheKey);
      writePersistentCacheIndex(storage, index);
      return null;
    }

    return {
      text,
      cachedAt,
      isFresh: Date.now() - cachedAt <= PERSISTENT_CACHE_TTL_MS,
    };
  } catch (_error) {
    const index = readPersistentCacheIndex(storage);
    removePersistentCacheEntry(storage, index, cacheKey);
    writePersistentCacheIndex(storage, index);
    return null;
  }
}

function parseJsonText(text, file) {
  const normalizedText = String(text || "");
  if (normalizedText.trim().startsWith("<")) {
    throw new Error(`Server returned HTML instead of JSON for ${file}`);
  }
  return JSON.parse(normalizedText);
}

function getProtectedTopicCacheKey(topic, session) {
  const provider = String(session?.provider || "guest").trim();
  const userId = String(session?.user?.id || session?.user?.email || "anon").trim();
  const plan = String(session?.user?.plan || "free").trim();
  const topicId = String(topic?.id || topic?.file || "unknown").trim();
  return `${provider}:${userId}:${plan}:${topicId}`;
}

async function fetchProtectedTopicDataFilesWithReport(topic, options = {}) {
  const { onProgress } = options;
  const session = readSession();
  if (!session?.accessToken) {
    throw new Error("Please sign in to load protected topic content.");
  }

  const cacheKey = getProtectedTopicCacheKey(topic, session);
  if (protectedTopicCache.has(cacheKey)) {
    const cached = protectedTopicCache.get(cacheKey);
    if (typeof onProgress === "function") {
      (cached.loadedFiles || []).forEach((file) => {
        onProgress({
          loaded: cached.loadedFiles.length,
          failed: 0,
          total: cached.totalFiles,
          currentFile: file,
        });
      });
    }
    return cached;
  }

  const payload = await requestCloudflareAuth("content/topic-data", {
    method: "POST",
    accessToken: session.accessToken,
    body: {
      topicId: String(topic?.id || "").trim(),
      tolerateFailures: Boolean(options?.tolerateFailures),
    },
  });

  const result = {
    payloads: Array.isArray(payload?.payloads) ? payload.payloads : [],
    loadedFiles: Array.isArray(payload?.loadedFiles) ? payload.loadedFiles : [],
    failedFiles: Array.isArray(payload?.failedFiles) ? payload.failedFiles : [],
    totalFiles: Number(payload?.totalFiles || 0),
  };

  protectedTopicCache.set(cacheKey, result);

  if (typeof onProgress === "function") {
    const files = result.loadedFiles.length ? result.loadedFiles : [String(topic?.file || "")].filter(Boolean);
    files.forEach((file, index) => {
      onProgress({
        loaded: Math.min(index + 1, result.loadedFiles.length || files.length),
        failed: result.failedFiles.length,
        total: result.totalFiles || files.length,
        currentFile: file,
      });
    });
  }

  return result;
}

export function __resetTopicSourceCachesForTests() {
  jsonCache.clear();
  protectedTopicCache.clear();
}

export function getBaseUrl() {
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'Promotion-cbt-app') {
    return '/Promotion-cbt-app';
  }
  return '';
}

export function getTopicFiles(topic) {
  return [topic?.file].filter(Boolean);
}

export async function fetchJsonFile(file) {
  const BASE_URL = getBaseUrl();
  const filePath = `${BASE_URL}/${file}`;

  if (jsonCache.has(filePath)) {
    return jsonCache.get(filePath);
  }

  const cachedEntry = readPersistentJsonText(filePath);
  if (cachedEntry?.isFresh) {
    const cachedData = parseJsonText(cachedEntry.text, file);
    jsonCache.set(filePath, cachedData);
    return cachedData;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${file}: ${response.status}`);
    }

    const text = await response.text();
    const data = parseJsonText(text, file);
    jsonCache.set(filePath, data);
    persistJsonText(filePath, text);
    return data;
  } catch (error) {
    if (cachedEntry?.text) {
      console.warn(`Using cached JSON fallback for ${filePath}`, error);
      const cachedData = parseJsonText(cachedEntry.text, file);
      jsonCache.set(filePath, cachedData);
      return cachedData;
    }
    throw error;
  }
}

export async function fetchTopicDataFilesWithReport(topic, options = {}) {
  return fetchProtectedTopicDataFilesWithReport(topic, options);
}

export async function fetchTopicDataFiles(topic, options = {}) {
  const result = await fetchTopicDataFilesWithReport(topic, options);
  return result.payloads;
}

export {
  collectSubcategories,
  countQuestionsFromTopicData,
  extractQuestionsByCategory,
  getQuestionsFromSubcategory,
};
