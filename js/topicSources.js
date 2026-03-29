import { isFeatureEnabled } from "./features.js";

// topicSources.js - shared utilities for topic data sources

const jsonCache = new Map();
const PERSISTENT_CACHE_PREFIX = "promotion-cbt:json-cache:v1:";
const PERSISTENT_CACHE_INDEX_KEY = `${PERSISTENT_CACHE_PREFIX}index`;
const PERSISTENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PERSISTENT_CACHE_MAX_TOTAL_BYTES = 3_500_000;
const PERSISTENT_CACHE_MAX_ENTRY_BYTES = 1_500_000;

/**
 * Return the browser localStorage object when running in a browser and the persistent JSON cache feature is enabled.
 * @returns {Storage|null} The `window.localStorage` object if accessible and the feature flag `enablePersistentJsonCache` is enabled; `null` otherwise.
 */
function getPersistentCacheStorage() {
  if (typeof window === "undefined") return null;
  if (!isFeatureEnabled("enablePersistentJsonCache")) return null;

  try {
    return window.localStorage || null;
  } catch (_error) {
    return null;
  }
}

/**
 * Builds the persistent storage key for a given JSON file path.
 * @param {string} filePath - The file path to be used as the cache key suffix.
 * @returns {string} The persistent cache key composed of the configured prefix and the provided file path.
 */
function getPersistentCacheKey(filePath) {
  return `${PERSISTENT_CACHE_PREFIX}${filePath}`;
}

/**
 * Estimates the byte size required to serialize a given value as a string.
 * @param {*} text - Value to estimate; will be converted to a string.
 * @returns {number} Estimated number of bytes (assumes 2 bytes per character).
 */
function estimateSerializedSize(text) {
  return String(text || "").length * 2;
}

/**
 * Read and parse the persistent cache index from storage, returning a safe index object.
 * @param {Storage|null|undefined} storage - The Storage instance (typically window.localStorage); may be null/undefined when unavailable.
 * @returns {Object} An object mapping cache keys to index entries (e.g. `{ filePath, size, cachedAt }`), or an empty object if the index is missing, malformed, or storage is unavailable.
 */
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

/**
 * Persist the persistent-cache index object into the provided storage under the configured index key.
 *
 * Writes `JSON.stringify(index || {})` to storage at `PERSISTENT_CACHE_INDEX_KEY`. If `storage` is falsy this function is a no-op. Any storage errors are caught and ignored so index write failures do not interfere with normal execution.
 * @param {Storage|null} storage - The storage object (typically `window.localStorage`) or `null` when unavailable or feature-disabled.
 * @param {Object|null|undefined} index - The index object to persist; `null`/`undefined` will be persisted as an empty object.
 */
function writePersistentCacheIndex(storage, index) {
  if (!storage) return;

  try {
    storage.setItem(PERSISTENT_CACHE_INDEX_KEY, JSON.stringify(index || {}));
  } catch (_error) {
    // Ignore index write failures so cache lookup never blocks the quiz flow.
  }
}

/**
 * Remove a persistent cache entry from the provided Storage and from the in-memory index.
 *
 * Attempts to remove the key `cacheKey` from `storage` (if provided) and deletes the same key
 * from the `index` object when `index` is an object; the function ignores storage removal failures
 * and mutates `index` in place. No action is taken when `storage` or `cacheKey` is falsy.
 *
 * @param {Storage|null|undefined} storage - The Web Storage object (typically window.localStorage); may be null/undefined.
 * @param {Object<string, any>|null|undefined} index - The persistent cache index object to update; mutated in place.
 * @param {string} cacheKey - The storage key to remove.
 */
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

/**
 * Prunes a persistent-cache index so stored entries fit within the allowed total byte budget.
 *
 * Normalizes and returns a copy of `index` with entries removed for which no backing value exists
 * in `storage`, excludes `excludeKey` from consideration, and evicts oldest entries (by `cachedAt`)
 * until the summed `entry.size` values are less than or equal to the allowed budget computed as
 * PERSISTENT_CACHE_MAX_TOTAL_BYTES minus `incomingSize`.
 *
 * @param {Storage|null} storage - The storage backing (typically window.localStorage); if falsy the original index or {} is returned.
 * @param {Object|null} index - The persistent cache index mapping cache keys to metadata objects; if not an object returns {} or the original index.
 * @param {number} [incomingSize=0] - Size in bytes of an incoming entry to account for when computing allowed budget.
 * @param {string} [excludeKey=""] - A cache key to ignore (do not consider or remove) during pruning.
 * @returns {Object} A normalized index object with stale/missing entries removed and additional entries evicted as needed.
 */
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

/**
 * Persists raw JSON text for a given file path into the persistent cache when available.
 *
 * Attempts to store the provided text in browser localStorage (behind the persistent cache feature flag)
 * unless storage is unavailable, the text is empty, looks like HTML, or the serialized payload exceeds
 * the configured per-entry size limit. When storing, the persistent index is updated and existing entries
 * are pruned as needed to make room; a single retry is attempted on write failure and failures are
 * handled quietly so cache operations do not throw.
 *
 * @param {string} filePath - The normalized file path used as the cache key suffix.
 * @param {string|unknown} text - The raw JSON text to persist; non-string values will be coerced to string.
 */
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

/**
 * Read and validate persisted JSON text and its metadata for a file path from the persistent cache.
 * @param {string} filePath - The file path used to derive the persistent cache key.
 * @returns {{text: string, cachedAt: number, isFresh: boolean} | null} An object containing the cached JSON `text`, the `cachedAt` timestamp in milliseconds, and `isFresh` (true when the entry is within the TTL); returns `null` if no valid cached entry exists or on error.
 */
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

/**
 * Parse a JSON string after ensuring the response is not HTML.
 * @param {any} text - Raw response content or JSON text to parse.
 * @param {string} file - File path or identifier used in the error message.
 * @returns {any} The value produced by parsing the JSON text.
 * @throws {Error} If the text appears to be HTML (message: `Server returned HTML instead of JSON for ${file}`).
 * @throws {SyntaxError} If the text is not valid JSON.
 */
function parseJsonText(text, file) {
  const normalizedText = String(text || "");
  if (normalizedText.trim().startsWith("<")) {
    throw new Error(`Server returned HTML instead of JSON for ${file}`);
  }
  return JSON.parse(normalizedText);
}

/**
 * Clear the in-memory topic JSON cache to reset state between tests.
 *
 * Only clears the in-memory cache (`jsonCache`); it does not modify persistent browser storage.
 */
export function __resetTopicSourceCachesForTests() {
  jsonCache.clear();
}

/**
 * Determine the base URL prefix for topic assets based on the current window pathname.
 *
 * @returns {string} '/Promotion-cbt-app' if the second path segment is 'Promotion-cbt-app', otherwise ''.
 */
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

/**
 * Fetches and returns parsed JSON for a given topic file, preferring the in-memory cache, then a persistent cached copy, and falling back to a network fetch; on successful network fetch the raw text is persisted for future use.
 *
 * @param {string} file - The topic file path (relative to the app base) to load.
 * @returns {any} The parsed JSON object from the file.
 * @throws {Error} When network fetch or JSON parsing fails and no cached text is available as a fallback.
 */
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

/**
 * Fetches a topic's JSON files sequentially, collecting parsed payloads and reporting progress.
 * @param {Object} topic - Topic descriptor used to derive file paths (see getTopicFiles).
 * @param {Object} [options] - Optional behavior control.
 * @param {boolean} [options.tolerateFailures=false] - When `true`, continue on individual file errors; when `false`, the first error is rethrown.
 * @param {function({loaded:number,failed:number,total:number,currentFile:string}):void} [options.onProgress] - Called after each file attempt with counts and the current file path.
 * @returns {{payloads:Array<Object>, loadedFiles:Array<string>, failedFiles:Array<string>, totalFiles:number}} An object containing parsed payloads, lists of successfully loaded and failed file paths, and the total number of files attempted.
 * @throws {Error} Rethrows the first fetch/parse error encountered when `options.tolerateFailures` is `false`.
 */
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

/**
 * Retrieve the question array for a subcategory, handling a special nested shape used by some data files.
 * @param {Object} subcategory - Subcategory object which may contain a `questions` property and an `id`.
 * @param {Array|undefined} subcategory.questions - Expected to be an array of question entries or, for certain feeds, an array whose first element contains a `ca_general` array.
 * @param {string|undefined} subcategory.id - Subcategory identifier; when equal to `"ca_general"` the function will look for nested `ca_general` questions.
 * @returns {Array} The array of questions for the subcategory, or an empty array if none are present or the shape is invalid.
 */
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

/**
 * Attach `sourceSubcategoryId` and `sourceSubcategoryName` to each question using the provided subcategory as defaults.
 *
 * For each element of `questions` that is an object, returns a shallow-cloned question with `sourceSubcategoryId` and
 * `sourceSubcategoryName` added (or preserved if already present). Non-object items are returned unchanged.
 *
 * @param {Array|any} questions - The questions to decorate; non-array inputs are treated as an empty list.
 * @param {Object} subcategory - The subcategory used to derive default values.
 * @param {string|number} [subcategory.id] - Default `sourceSubcategoryId` when a question does not provide one.
 * @param {string} [subcategory.name] - Default `sourceSubcategoryName` when a question does not provide one.
 * @returns {Array} An array of questions where object entries include `sourceSubcategoryId` and `sourceSubcategoryName` as trimmed strings.
 */
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

/**
 * Extracts and returns questions from the provided topic data filtered by category and options.
 *
 * @param {any} data - Topic data in one of the supported shapes (domains, subcategories, array, or psr_categories).
 * @param {string} [selectedCategory="all"] - Category id to extract; use `"all"` to include every subcategory.
 * @param {Object} [options] - Extraction options.
 * @param {string[]|null} [options.allowedCategoryIds=null] - If provided, only subcategories whose ids are in this list are included.
 * @param {number|null} [options.maxQuestionsPerSubcategory=null] - If provided, limits the number of questions returned per subcategory.
 * @returns {Array} An array of question objects (possibly augmented with `sourceSubcategoryId` and `sourceSubcategoryName`) that match the selection and options.
 */
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
