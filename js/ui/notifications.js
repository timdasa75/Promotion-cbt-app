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
  noticeDiv.className = `${entry.className} notification-toast`;
  noticeDiv.setAttribute("role", type === "error" ? "alert" : "status");
  noticeDiv.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

  const text = document.createElement("span");
  text.className = "notification-toast-text";
  text.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.className = "notification-toast-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss message");
  closeButton.textContent = "\u00d7";
  closeButton.addEventListener("click", () => noticeDiv.remove());

  noticeDiv.appendChild(text);
  noticeDiv.appendChild(closeButton);

  let container = document.querySelector(".notification-stack");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-stack";
    container.setAttribute("aria-label", "App messages");
    document.body.appendChild(container);
  }
  container.appendChild(noticeDiv);

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
