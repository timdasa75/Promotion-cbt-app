import { debugLog } from "../logger.js";
import { SCREEN_TRANSITION_DELAY_MS } from "../constants.js";

let currentScreenId = "splashScreen";
let screenTransitionId = 0;
let screenRoutingInitialized = false;

const SCREEN_ROUTE_PATHS = Object.freeze({
  splashScreen: "/",
  topicSelectionScreen: "/dashboard",
  helpScreen: "/help",
  categorySelectionScreen: "/topics/category",
  modeSelectionScreen: "/session/setup",
  quizScreen: "/quiz",
  resultsScreen: "/results",
  reviewMistakesScreen: "/review",
  analyticsScreen: "/analytics",
  quizHistoryScreen: "/history",
  profileScreen: "/profile",
  statesScreen: "/support",
  adminScreen: "/admin",
  resetPasswordScreen: "/reset-password",
});

const ROUTE_SCREEN_IDS = new Map(
  Object.entries(SCREEN_ROUTE_PATHS).map(([screenId, path]) => [path, screenId]),
);

function setScreenAccessibilityState(activeScreenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    const isActive = screen.id === activeScreenId;
    screen.toggleAttribute("inert", !isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  });
}

function focusActiveScreen(screen) {
  const focusTarget = screen?.querySelector("[data-screen-focus], h1, h2, h3");
  if (!focusTarget) return;

  if (!focusTarget.hasAttribute("tabindex")) {
    focusTarget.setAttribute("tabindex", "-1");
  }
  focusTarget.focus({ preventScroll: true });
}

/**
 * Synchronize the initial HTML screen state with the accessibility tree.
 *
 * The SPA keeps screens mounted for fast transitions, so visual hiding alone
 * is insufficient: inactive controls must also be unavailable to keyboard and
 * assistive-technology users.
 */
export function initializeScreenAccessibility() {
  const activeScreen = document.querySelector(".screen.active:not(.hidden)")
    || document.getElementById(currentScreenId)
    || document.querySelector(".screen");
  if (!activeScreen?.id) return;

  currentScreenId = activeScreen.id;
  setScreenAccessibilityState(currentScreenId);
}

function getScreenIdFromHash() {
  const routePath = String(window.location.hash || "")
    .replace(/^#/, "")
    .replace(/\/+$/, "") || "/";
  return ROUTE_SCREEN_IDS.get(routePath) || null;
}

function updateScreenRoute(screenId, routeHistory) {
  if (routeHistory === "none") return;
  const routePath = SCREEN_ROUTE_PATHS[screenId];
  if (!routePath) return;

  const nextUrl = `${window.location.pathname}${window.location.search}#${routePath}`;
  if (window.location.hash === `#${routePath}`) return;

  if (routeHistory === "replace") {
    window.history.replaceState({ screenId }, "", nextUrl);
  } else {
    window.history.pushState({ screenId }, "", nextUrl);
  }
}

/**
 * Enable hash routes for the static GitHub Pages deployment.
 *
 * Hashes provide deep links and browser history without asking the static host
 * to rewrite paths such as /quiz or /analytics back to index.html.
 */
export function initializeScreenRouting() {
  if (screenRoutingInitialized) return;
  screenRoutingInitialized = true;

  window.addEventListener("hashchange", () => {
    const routedScreenId = getScreenIdFromHash();
    if (!routedScreenId || routedScreenId === currentScreenId) return;
    showScreen(routedScreenId, { routeHistory: "none" }).catch((error) => {
      console.error("Unable to restore screen from browser history:", error);
    });
  });

  const routedScreenId = getScreenIdFromHash();
  if (routedScreenId && routedScreenId !== currentScreenId) {
    showScreen(routedScreenId, { routeHistory: "none" }).catch((error) => {
      console.error("Unable to open linked screen:", error);
    });
  }
}

export function showScreen(screenId, { focus = true, routeHistory = "push" } = {}) {
  window.scrollTo(0, 0);
  debugLog(`Switching to screen: ${screenId}`);
  const transitionId = ++screenTransitionId;
  return new Promise((resolve, reject) => {
    // Validate input
    if (!screenId) {
      reject(new Error("Screen ID is required"));
      return;
    }

    // Get screens
    const currentScreen = document.getElementById(currentScreenId);
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
      console.error(`Screen with id "${screenId}" not found`);
      reject(new Error(`Screen with id "${screenId}" not found`));
      return;
    }

    // Prevent showing the same screen
    if (currentScreenId === screenId) {
      debugLog(`Already on screen: ${screenId}`);
      updateScreenRoute(screenId, routeHistory);
      resolve();
      return;
    }

    // Remove active class and add hidden class to all screens
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
      screen.classList.add("hidden");
    });

    // Show new screen immediately to start transition
    targetScreen.classList.remove("hidden");
    setScreenAccessibilityState(screenId);
    debugLog(`Made ${screenId} visible`);

    // Trigger animation frame for smooth transition
    requestAnimationFrame(() => {
      // Add active class after a brief delay to ensure transition triggers
      setTimeout(() => {
        if (transitionId !== screenTransitionId) {
          resolve();
          return;
        }
        targetScreen.classList.add("active");
        debugLog(`Activated ${screenId}`);

        // Update current screen tracking
        currentScreenId = screenId;
        updateScreenRoute(screenId, routeHistory);
        if (focus) focusActiveScreen(targetScreen);
        document.dispatchEvent(
          new CustomEvent("screenchange", { detail: { screenId } }),
        );

        // Show/hide quiz header
        const quizHeader = document.getElementById("quizHeader");
        if (quizHeader) {
          quizHeader.classList.toggle("hidden", screenId !== "quizScreen");
        }

        resolve();
      });
    }, SCREEN_TRANSITION_DELAY_MS); // Match this with your CSS transition duration
  });
}
