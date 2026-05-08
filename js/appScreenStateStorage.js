const SCREEN_STATE_STORAGE_KEY = "cbt_screen_state_v1";

function getDefaultStorage() {
  return globalThis.localStorage || null;
}

export function readScreenState(storage = getDefaultStorage()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SCREEN_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function writeScreenState(state, storage = getDefaultStorage()) {
  if (!storage) return;
  storage.setItem(SCREEN_STATE_STORAGE_KEY, JSON.stringify(state || {}));
}

export function clearScreenState(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.removeItem(SCREEN_STATE_STORAGE_KEY);
}
