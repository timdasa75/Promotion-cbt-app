// Shared fetch hardening for admin dashboard calls.
//
// The admin bridge Worker runs on the free tier: the first request after an
// idle period can stall (cold isolate) or the TLS/connection setup can fail
// outright (observed live: 1-in-3 POSTs to the Worker returned no response).
// A single unadorned fetch turns that into a failed dashboard load; this
// wrapper absorbs it with two primitives:
//
//   1. Per-attempt timeout — a hung request aborts after timeoutMs instead of
//      pinning the dashboard until the browser gives up (which can be ~300s).
//   2. Bounded retry with exponential backoff + jitter — transient network
//      errors (fetch TypeError, connection reset) and transient HTTP statuses
//      (408/425/429/5xx) are retried; permanent failures (4xx) are not, and
//      write-style callers can disable HTTP-status retries entirely so a
//      non-idempotent POST is never sent twice after the server saw it.
//
// Timeouts are implemented with AbortController, so any AbortError observed
// here is our own timer — genuine caller aborts never pass through this
// helper's signal.

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_BASE_DELAY_MS = 400;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.name === "TimeoutError";
}

function isNetworkTypeError(error) {
  // fetch() rejects with TypeError ("Failed to fetch") on connection reset,
  // DNS failure, CORS-origin mismatch, and offline. CORS mismatches are
  // permanent, but they are indistinguishable from resets client-side, and a
  // retry costs one backoff interval — acceptable.
  return error instanceof TypeError;
}

export function isTransientHttpStatus(status) {
  // 408 request timeout, 425 too early, 429 rate limited (server-side cache
  // helpers already back off, but a retry still helps), 5xx server errors.
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function computeBackoffDelay(attempt, baseDelayMs) {
  // attempt is 0-based for the FIRST retry: 400, 800, 1600… plus jitter.
  return baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs;
}

/**
 * fetch() with a per-attempt timeout and bounded retries.
 *
 * @param {string} url
 * @param {RequestInit} options Passed straight to fetch (signal is managed here).
 * @param {object} [opts]
 * @param {number} [opts.retries] Extra attempts after the first (default 2).
 * @param {number} [opts.timeoutMs] Per-attempt timeout (default 12000).
 * @param {number} [opts.baseDelayMs] Backoff base (default 400).
 * @param {Function} [opts.fetchImpl] Injectable fetch for tests.
 * @param {Function} [opts.sleep] Injectable delay for tests.
 * @param {(status: number) => boolean} [opts.shouldRetryResponse]
 *   Given the HTTP status, return true to retry (e.g. 5xx). Default: never
 *   retry a response — only network-level failures are retried, which is the
 *   safe default for non-idempotent POSTs. Read-style callers pass
 *   `shouldRetryResponse: isTransientHttpStatus`.
 * @returns {Promise<Response>} The final (or first successful) response.
 */
export async function fetchWithRetry(url, options = {}, {
  retries = DEFAULT_MAX_ATTEMPTS - 1,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  fetchImpl = fetch,
  sleep = defaultSleep,
  shouldRetryResponse = () => false,
} = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      await sleep(computeBackoffDelay(attempt - 1, baseDelayMs));
    }

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const response = await fetchImpl(url, { ...options, signal: controller?.signal });
      if (attempt < retries && shouldRetryResponse(response.status)) {
        lastError = new Error(`Transient HTTP ${response.status} from ${url}`);
        lastError.httpStatus = response.status;
        continue;
      }
      return response;
    } catch (error) {
      // AbortError can only be our own timeout (we own the controller);
      // TypeError is a network-level failure. Both are transient.
      const transient = isAbortError(error) || isNetworkTypeError(error);
      lastError = error;
      if (!transient || attempt >= retries) {
        throw error;
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw lastError || new Error(`Request to ${url} failed after ${retries + 1} attempts.`);
}
