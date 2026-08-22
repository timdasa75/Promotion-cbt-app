import { loginUserWithGoogleCloudflare } from "./authCloudflareClient.js";
import { googleOAuthSchema } from "./validation.js";
import { getFirebaseConfig } from "./authRuntime.js";
import { logger } from "./logger.js";

const GOOGLE_BUTTON_CONTAINERS = ["googleSignInLoginBtn", "googleSignInRegisterBtn"];
const GOOGLE_READY_TIMEOUT_MS = 10000;
let googleSignInInitialized = false;

function dispatchGoogleAuthEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function bindFallbackError(containers, message) {
  containers.forEach((container) => {
    const fallback = container.querySelector("[data-google-fallback]");
    if (!fallback || fallback.dataset.googleFallbackBound === "true") return;
    fallback.dataset.googleFallbackBound = "true";
    fallback.addEventListener("click", () => {
      dispatchGoogleAuthEvent("google-login-error", { message });
    });
  });
}

function getGoogleClientId() {
  const { googleClientId } = getFirebaseConfig();
  return String(googleClientId || "").trim();
}

function getGoogleApi() {
  return window.google?.accounts?.id || null;
}

function waitForGoogleApi({ timeoutMs = GOOGLE_READY_TIMEOUT_MS } = {}) {
  const existing = getGoogleApi();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const api = getGoogleApi();
      if (api) {
        window.clearInterval(timer);
        resolve(api);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Google sign-in is unavailable. Please check your connection and try again."));
      }
    }, 100);
  });
}

export async function handleGoogleSignInResponse(credentialResponse) {
  try {
    const { credential } = googleOAuthSchema.parse(credentialResponse || {});
    await loginUserWithGoogleCloudflare(credential);
    dispatchGoogleAuthEvent("google-login-success");
  } catch (error) {
    const message = error?.name === "ZodError"
      ? "Invalid Google sign-in response. Please try again."
      : error?.message || "Google sign-in failed.";
    logger.warn("Google sign-in failed", { message });
    dispatchGoogleAuthEvent("google-login-error", { message });
  }
}

function renderGoogleButton(api, container) {
  if (!container || container.dataset.googleRendered === "true") return;
  container.dataset.googleRendered = "true";
  container.replaceChildren();
  api.renderButton(container, {
    theme: "outline",
    size: "large",
    shape: "rectangular",
    text: "continue_with",
    width: Math.min(360, Math.max(220, container.clientWidth || 280)),
  });
}

async function initializeGoogleSignIn() {
  if (googleSignInInitialized || typeof window === "undefined") return;
  googleSignInInitialized = true;

  const clientId = getGoogleClientId();
  const containers = GOOGLE_BUTTON_CONTAINERS
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!containers.length) return;
  if (!clientId) {
    // Hide the Google sign-in containers and their "or" divider when not configured
    containers.forEach((container) => {
      container.style.display = "none";
      const divider = container.nextElementSibling;
      if (divider && divider.classList.contains("divider-text")) {
        divider.style.display = "none";
      }
    });
    return;
  }

  try {
    const api = await waitForGoogleApi();
    api.initialize({
      client_id: clientId,
      callback: handleGoogleSignInResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    containers.forEach((container) => renderGoogleButton(api, container));
  } catch (error) {
    googleSignInInitialized = false;
    logger.warn("Google sign-in initialization failed", { message: error?.message || "unavailable" });
    bindFallbackError(containers, "Google sign-in is unavailable. Please try again later.");
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGoogleSignIn, { once: true });
  } else {
    initializeGoogleSignIn();
  }
}
