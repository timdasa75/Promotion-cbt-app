import { debugLog } from "../logger.js";
import { SCREEN_TRANSITION_DELAY_MS } from "../constants.js";

let currentScreenId = "splashScreen";

export function showScreen(screenId) {
  window.scrollTo(0, 0);
  debugLog(`Switching to screen: ${screenId}`);
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
    debugLog(`Made ${screenId} visible`);

    // Trigger animation frame for smooth transition
    requestAnimationFrame(() => {
      // Add active class after a brief delay to ensure transition triggers
      setTimeout(() => {
        targetScreen.classList.add("active");
        debugLog(`Activated ${screenId}`);

        // Update current screen tracking
        currentScreenId = screenId;
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
