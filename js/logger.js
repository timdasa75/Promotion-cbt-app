// logger.js - environment-aware logging helpers

function readGlobalDebugFlag() {
  if (typeof window === 'undefined') return false;

  if (window.__APP_DEBUG__ === true) return true;

  const query = new URLSearchParams(window.location.search || '');
  if (query.get('debug') === '1') return true;

  try {
    return window.localStorage?.getItem('app_debug') === '1';
  } catch (error) {
    return false;
  }
}

export function isDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalhost || readGlobalDebugFlag();
}

export function debugLog(...args) {
  if (isDebugEnabled()) {
    console.log(...args);
  }
}
