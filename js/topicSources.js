import { isFeatureEnabled } from "./features.js";

// topicSources.js - shared utilities for topic data sources

const jsonCache = new Map();
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

export function __resetTopicSourceCachesForTests() {
  jsonCache.clear();
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
  const { tolerateFailures = false, onProgress } = options;
  const files = getTopicFiles(topic);
  const payloads = [];
  const loadedFiles = [];
  const failedFiles = [];

  for (const file of files) {
    try {
      payloads.push(await fetchJsonFile(file));
      loadedFiles.push(file);
    } catch (error) {
      failedFiles.push(file);
      if (!tolerateFailures) throw error;
      console.warn(`Skipping unavailable source file for topic ${topic?.id}: ${file}`, error);
    } finally {
      if (typeof onProgress === 'function') {
        onProgress({
          loaded: loadedFiles.length,
          failed: failedFiles.length,
          total: files.length,
          currentFile: file,
        });
      }
    }
  }

  return {
    payloads,
    loadedFiles,
    failedFiles,
    totalFiles: files.length,
  };
}

export async function fetchTopicDataFiles(topic, options = {}) {
  const result = await fetchTopicDataFilesWithReport(topic, options);
  return result.payloads;
}

export function collectSubcategories(data) {
  if (data?.domains && Array.isArray(data.domains)) {
    const out = [];
    data.domains.forEach((domain) => {
      if (domain?.topics && Array.isArray(domain.topics)) {
        out.push(...domain.topics);
      }
    });
    return out;
  }

  if (data?.subcategories && Array.isArray(data.subcategories)) {
    return data.subcategories;
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.psr_categories) {
    return Object.keys(data.psr_categories).map((key) => ({
      id: key,
      name: data.psr_categories[key].name || key,
      description: data.psr_categories[key].description || 'No description available',
      questions: data.psr_categories[key].questions,
    }));
  }

  return [];
}

export function countQuestionsFromTopicData(data) {
  return collectSubcategories(data).reduce((sum, subcat) => {
    return sum + getQuestionsFromSubcategory(subcat).length;
  }, 0);
}

export function getQuestionsFromSubcategory(subcategory) {
  if (!subcategory?.questions || !Array.isArray(subcategory.questions)) return [];

  // Some data files (e.g. current affairs) nest actual question rows under a key.
  if (
    subcategory.id === "ca_general" &&
    subcategory.questions.length > 0 &&
    Array.isArray(subcategory.questions[0]?.ca_general)
  ) {
    return subcategory.questions[0].ca_general;
  }

  return subcategory.questions;
}

function decorateQuestionsForSubcategory(questions, subcategory) {
  const items = Array.isArray(questions) ? questions : [];
  const subcategoryId = String(subcategory?.id || "").trim();
  const subcategoryName = String(subcategory?.name || subcategoryId || "").trim();

  return items.map((question) => {
    if (!question || typeof question !== "object") return question;
    return {
      ...question,
      sourceSubcategoryId: String(question?.sourceSubcategoryId || subcategoryId || "").trim(),
      sourceSubcategoryName: String(question?.sourceSubcategoryName || subcategoryName || subcategoryId || "").trim(),
    };
  });
}

export function extractQuestionsByCategory(data, selectedCategory = "all", options = {}) {
  const { allowedCategoryIds = null, maxQuestionsPerSubcategory = null } = options;
  const subcategories = collectSubcategories(data);
  const allowedSet =
    Array.isArray(allowedCategoryIds) && allowedCategoryIds.length
      ? new Set(allowedCategoryIds)
      : null;

  if (selectedCategory === "all") {
    return subcategories.flatMap((subcategory) => {
      const questions = getQuestionsFromSubcategory(subcategory);
      if (!questions.length) return [];
      if (allowedSet && !allowedSet.has(subcategory.id)) return [];
      const limited = typeof maxQuestionsPerSubcategory === "number"
        ? questions.slice(0, maxQuestionsPerSubcategory)
        : questions;
      return decorateQuestionsForSubcategory(limited, subcategory);
    });
  }

  const selected = subcategories.find((subcategory) => subcategory?.id === selectedCategory);
  const questions = getQuestionsFromSubcategory(selected);
  if (!questions.length) return [];
  if (allowedSet && !allowedSet.has(selected.id)) return [];
  const limited = typeof maxQuestionsPerSubcategory === "number"
    ? questions.slice(0, maxQuestionsPerSubcategory)
    : questions;
  return decorateQuestionsForSubcategory(limited, selected);
}
