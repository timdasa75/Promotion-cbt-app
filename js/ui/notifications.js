import {
  NOTIFICATION_ERROR_MS,
  NOTIFICATION_SUCCESS_MS,
  NOTIFICATION_WARNING_MS,
} from "../constants.js";

function showNotification(message, { type = "error", timeoutMs } = {}) {
  const config = {
    error: { className: "error-message", timeoutMs: NOTIFICATION_ERROR_MS },
    warning: { className: "warning-message", timeoutMs: NOTIFICATION_WARNING_MS },
    success: { className: "success-message", timeoutMs: NOTIFICATION_SUCCESS_MS },
  };
  const entry = config[type] || config.error;

  const noticeDiv = document.createElement("div");
  noticeDiv.className = entry.className;
  noticeDiv.textContent = message;

  // Use .app-container for notice placement
  const container = document.querySelector(".app-container");
  if (container) {
    container.insertBefore(noticeDiv, container.firstChild);
  } else {
    // fallback: append to body
    document.body.insertBefore(noticeDiv, document.body.firstChild);
  }

  const resolvedTimeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : entry.timeoutMs;
  setTimeout(() => {
    noticeDiv.remove();
  }, resolvedTimeoutMs);
}

export function showError(message) {
  showNotification(message, { type: "error" });
}

export function showWarning(message) {
  showNotification(message, { type: "warning" });
}

export function showSuccess(message) {
  showNotification(message, { type: "success" });
}
