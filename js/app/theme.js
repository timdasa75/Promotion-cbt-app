import { setToolbarIcon } from "./toolbar.js";

function getThemeToolbarIconMarkup(isDarkMode) {
  if (isDarkMode) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="M4.93 4.93l1.41 1.41"></path>
        <path d="M17.66 17.66l1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="M4.93 19.07l1.41-1.41"></path>
        <path d="M17.66 6.34l1.41-1.41"></path>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"></path>
    </svg>
  `;
}

export function syncThemeTogglePresentation() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeToggleIcon");
  if (!themeToggle || !themeIcon) return;
  const isDarkMode = document.body.classList.contains("dark-mode");
  setToolbarIcon(themeIcon, getThemeToolbarIconMarkup(isDarkMode));
  const tooltip = isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", tooltip);
  themeToggle.setAttribute("title", tooltip);
  themeToggle.setAttribute("data-tooltip", tooltip);
}

export function initializeThemeShortcut() {
  const toggleLink = document.querySelector("[data-theme-action='toggle']");
  if (!toggleLink) return;
  toggleLink.addEventListener("click", () => {
    document.getElementById("themeToggle")?.click();
  });
}

export function initializeThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  const osThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const osDark = osThemeQuery.matches;

  if (savedTheme === "dark" || (!savedTheme && osDark)) {
    body.classList.add("dark-mode");
  } else {
    body.classList.remove("dark-mode");
  }
  syncThemeTogglePresentation();

  // Listen for OS theme changes
  osThemeQuery.addEventListener("change", (e) => {
    // Only auto-switch if user hasn't explicitly set a preference
    if (!localStorage.getItem("theme")) {
      if (e.matches) {
        body.classList.add("dark-mode");
      } else {
        body.classList.remove("dark-mode");
      }
      syncThemeTogglePresentation();
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode");

      if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
      syncThemeTogglePresentation();
    });
  }
}
