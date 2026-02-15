// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showError, showScreen, showWarning } from "./ui.js";
import {
  loadQuestions,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";
import { debugLog } from "./logger.js";
import {
  getAccessibleTopics,
  getAuthSummaryLabel,
  getAuthProviderLabel,
  getCurrentUser,
  getProgressStorageKeyForCurrentUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  registerUser,
} from "./auth.js";

let currentTopic = null;
let cachedTopics = [];
let allTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;

async function init() {
  try {
    debugLog("Initializing app...");
    const topicsData = await loadData();
    allTopics = Array.isArray(topicsData) ? topicsData : [];
    cachedTopics = allTopics;
    debugLog("Loaded topics:", topicsData);
    if (!topicsData || topicsData.length === 0) {
      console.error("No topics loaded");
      showError("No topics available. Please check data files.");
      return;
    }
    await displayTopics(cachedTopics, handleTopicSelect);
    refreshDashboardInsights();
    debugLog("Displayed topics");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to load quiz data. Please try again later.");
  }
}

function classifyTopic(topic) {
  const id = topic?.id || "";
  const documentIds = new Set([
    "psr",
    "financial_regulations",
    "procurement_act",
    "constitutional_law",
  ]);
  const recentIds = new Set(["general_current_affairs"]);
  if (recentIds.has(id)) return "recent";
  if (id === "competency_framework") return "competency";
  if (documentIds.has(id)) return "document";
  return "competency";
}

function applyTopicFilter(filter) {
  const topicCards = Array.from(document.querySelectorAll("#topicList .topic-card"));
  if (!topicCards.length) return;

  const chipMap = {
    document: document.getElementById("filterDocumentBtn"),
    competency: document.getElementById("filterCompetencyBtn"),
    recent: document.getElementById("filterRecentBtn"),
  };

  Object.entries(chipMap).forEach(([key, chip]) => {
    if (!chip) return;
    chip.classList.toggle("active", key === filter);
  });

  topicCards.forEach((card, index) => {
    const topic = cachedTopics[index];
    const topicType = classifyTopic(topic);
    card.classList.toggle("hidden", topicType !== filter);
  });
}

function getLatestAttemptTopic() {
  try {
    const raw = localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts) || !parsed.attempts.length) {
      return null;
    }
    const latestAttempt = parsed.attempts[parsed.attempts.length - 1];
    return latestAttempt?.topicId || null;
  } catch (error) {
    return null;
  }
}

function readProgressSummary() {
  try {
    const raw = localStorage.getItem(getProgressStorageKeyForCurrentUser());
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch (error) {
    return { attempts: [] };
  }
}

function getTopicNameById(topicId) {
  const topic = allTopics.find((entry) => entry.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

function calculateStreakDays(attempts) {
  if (!attempts.length) return 0;
  const uniqueDays = new Set(
    attempts
      .map((attempt) => (attempt.createdAt || "").slice(0, 10))
      .filter(Boolean),
  );

  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayKey = day.toISOString().slice(0, 10);
    if (uniqueDays.has(dayKey)) {
      streak += 1;
    } else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

function getWeakestTopicId(attempts) {
  if (!attempts.length) return null;
  const scoreByTopic = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.topicId) return;
    const existing = scoreByTopic.get(attempt.topicId) || [];
    existing.push(Number(attempt.scorePercentage || 0));
    scoreByTopic.set(attempt.topicId, existing);
  });
  if (!scoreByTopic.size) return null;

  let weakest = null;
  scoreByTopic.forEach((scores, topicId) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (!weakest || avg < weakest.avg) {
      weakest = { topicId, avg };
    }
  });
  return weakest?.topicId || null;
}

function refreshDashboardInsights() {
  const currentUser = getCurrentUser();
  const summary = readProgressSummary();
  const attempts = summary.attempts || [];

  const totalAttempts = attempts.length;
  const average =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + Number(attempt.scorePercentage || 0),
            0,
          ) / totalAttempts,
        )
      : null;
  const streakDays = calculateStreakDays(attempts);
  const latestAttempt = totalAttempts ? attempts[totalAttempts - 1] : null;

  lastSessionTopicId = latestAttempt?.topicId || null;
  recommendedTopicId = getWeakestTopicId(attempts) || cachedTopics[0]?.id || "psr";

  const totalAttemptsStat = document.getElementById("totalAttemptsStat");
  const averageScoreStat = document.getElementById("averageScoreStat");
  const streakStat = document.getElementById("streakStat");
  const streakStatusBadge = document.getElementById("streakStatusBadge");
  const continueTopicTitle = document.getElementById("continueTopicTitle");
  const continueTopicMeta = document.getElementById("continueTopicMeta");
  const recommendedTopicTitle = document.getElementById("recommendedTopicTitle");
  const recommendedTopicMeta = document.getElementById("recommendedTopicMeta");
  const splashResumeBtn = document.getElementById("splashResumeBtn");

  if (totalAttemptsStat) totalAttemptsStat.textContent = String(totalAttempts);
  if (averageScoreStat) {
    averageScoreStat.textContent = average === null ? "-" : `${average}%`;
  }
  if (streakStat) {
    streakStat.textContent = `${streakDays} day${streakDays === 1 ? "" : "s"}`;
  }
  if (streakStatusBadge) {
    streakStatusBadge.textContent =
      streakDays >= 5 ? "On Track" : streakDays > 0 ? "Building momentum" : "Start today";
  }

  if (continueTopicTitle && continueTopicMeta) {
    if (latestAttempt?.topicId) {
      continueTopicTitle.textContent = getTopicNameById(latestAttempt.topicId);
      const modeLabel = latestAttempt.mode
        ? `${latestAttempt.mode.charAt(0).toUpperCase()}${latestAttempt.mode.slice(1)}`
        : "Session";
      continueTopicMeta.textContent = `${modeLabel} mode, last score: ${Math.round(
        Number(latestAttempt.scorePercentage || 0),
      )}%`;
    } else {
      continueTopicTitle.textContent = "No session yet";
      continueTopicMeta.textContent = "Start a topic to track session continuity.";
    }
  }

  if (recommendedTopicTitle && recommendedTopicMeta) {
    recommendedTopicTitle.textContent = getTopicNameById(recommendedTopicId);
    recommendedTopicMeta.textContent =
      totalAttempts > 0
        ? "Based on your weakest average score area."
        : "Recommendation will adapt after your first attempts.";
  }

  if (splashResumeBtn) {
    const canResume = Boolean(currentUser && latestAttempt?.topicId);
    splashResumeBtn.classList.toggle("hidden", !canResume);
  }
}

async function resumeLastSession() {
  if (!cachedTopics.length) {
    showError("Topics are still loading. Please try again.");
    return;
  }

  const lastTopicId = lastSessionTopicId || getLatestAttemptTopic();
  const topic = cachedTopics.find((t) => t.id === lastTopicId) || cachedTopics[0];

  if (!lastTopicId) {
    showWarning("No previous session found yet. Starting with your first topic.");
  }

  await handleTopicSelect(topic);
}

async function startRecommendation() {
  if (!cachedTopics.length) {
    showError("Topics are still loading. Please try again.");
    return;
  }

  const preferredIds = [recommendedTopicId, "financial_regulations", "psr", "procurement_act"];
  const topic = cachedTopics.find((t) => preferredIds.includes(t.id)) || cachedTopics[0];

  await handleTopicSelect(topic);
}

function initializeDashboardActions() {
  const startLearningBtn = document.getElementById("startLearningBtn");
  const splashResumeBtn = document.getElementById("splashResumeBtn");
  const resumeBtn = document.getElementById("resumeSessionBtn");
  const resumeCard = document.getElementById("resumeSessionCard");
  const recommendationBtn = document.getElementById("startRecommendationBtn");
  const recommendationCard = document.getElementById("recommendedTopicCard");
  const filterDocumentBtn = document.getElementById("filterDocumentBtn");
  const filterCompetencyBtn = document.getElementById("filterCompetencyBtn");
  const filterRecentBtn = document.getElementById("filterRecentBtn");

  if (startLearningBtn) {
    startLearningBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      showScreen("topicSelectionScreen");
    });
  }

  if (splashResumeBtn) {
    splashResumeBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      resumeLastSession();
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      resumeLastSession();
    });
  }
  if (resumeCard) {
    resumeCard.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      resumeLastSession();
    });
  }

  if (recommendationBtn) {
    recommendationBtn.addEventListener("click", () => {
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      startRecommendation();
    });
  }
  if (recommendationCard) {
    recommendationCard.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (!getCurrentUser()) {
        openAuthModal("login");
        return;
      }
      startRecommendation();
    });
  }

  if (filterDocumentBtn) {
    filterDocumentBtn.addEventListener("click", () => {
      applyTopicFilter("document");
    });
  }

  if (filterCompetencyBtn) {
    filterCompetencyBtn.addEventListener("click", () => {
      applyTopicFilter("competency");
    });
  }

  if (filterRecentBtn) {
    filterRecentBtn.addEventListener("click", () => {
      applyTopicFilter("recent");
    });
  }
}

function isTopicUnlocked(topic) {
  const unlocked = getAccessibleTopics(allTopics);
  return unlocked.some((entry) => entry.id === topic?.id);
}

async function handleTopicSelect(topic) {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }
  if (!isTopicUnlocked(topic)) {
    showWarning("This topic is locked on Free plan. Upgrade to access all topics.");
    return;
  }
  currentTopic = topic;
  setCurrentTopic(topic);
  await selectTopic(topic);

  const practiceModeCard = document.getElementById("practiceModeCard");
  const examModeCard = document.getElementById("examModeCard");
  const reviewModeCard = document.getElementById("reviewModeCard");

  if (practiceModeCard) practiceModeCard.onclick = () => startQuiz("practice");
  if (examModeCard) examModeCard.onclick = () => startQuiz("exam");
  if (reviewModeCard) reviewModeCard.onclick = () => startQuiz("review");

  const quizTitle = document.getElementById("modeQuizTitle");
  const quizDescription = document.getElementById("modeQuizDescription");
  const selectedTopicName = document.getElementById("selectedTopicName");
  if (quizTitle) quizTitle.textContent = topic.name;
  if (quizDescription) quizDescription.textContent = topic.description;
  if (selectedTopicName) selectedTopicName.textContent = topic.name;
}

function startQuiz(mode) {
  if (!getCurrentUser()) {
    openAuthModal("login");
    return;
  }
  if (!currentTopic) {
    showError("No topic selected.");
    return;
  }
  setCurrentMode(mode);
  loadQuestions();
}

function setAuthMessage(message, type = "error") {
  const authMessage = document.getElementById("authMessage");
  if (!authMessage) return;
  if (!message) {
    authMessage.textContent = "";
    authMessage.className = "auth-message hidden";
    return;
  }
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
}

function setActiveAuthTab(mode) {
  const isRegister = mode === "register";
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");

  if (loginForm) loginForm.classList.toggle("hidden", isRegister);
  if (registerForm) registerForm.classList.toggle("hidden", !isRegister);
  if (loginTab) loginTab.classList.toggle("active", !isRegister);
  if (registerTab) registerTab.classList.toggle("active", isRegister);
  setAuthMessage("");
}

function openAuthModal(mode = "login") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  setActiveAuthTab(mode);
  modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("hidden");
  setAuthMessage("");
}

async function refreshAccessibleTopics() {
  cachedTopics = allTopics;
  await displayTopics(cachedTopics, handleTopicSelect);
}

function updateAuthUI() {
  const user = getCurrentUser();
  const authActionLabel = document.getElementById("authActionLabel");
  const authModeHint = document.getElementById("authModeHint");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileSubtitle = document.getElementById("profileSubtitle");
  const profileAvatar = document.getElementById("profileAvatar");
  if (authActionLabel) {
    authActionLabel.textContent = user ? getAuthSummaryLabel() : "Login";
  }
  if (authModeHint) {
    const provider = getAuthProviderLabel();
    authModeHint.textContent =
      provider === "Cloud"
        ? "Auth mode: Cloud (multi-device)"
        : "Auth mode: Local (single-device)";
  }
  if (profileDisplayName) {
    profileDisplayName.textContent = user?.name || "Guest User";
  }
  if (profileSubtitle) {
    profileSubtitle.textContent = user?.email || "Login to manage your profile";
  }
  if (profileAvatar) {
    const seed = user?.name || user?.email || "GU";
    const initials = seed
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
    profileAvatar.textContent = initials || "GU";
  }
}

function closeAccountMenu() {
  const accountMenu = document.getElementById("accountMenu");
  if (accountMenu) accountMenu.classList.add("hidden");
}

function toggleAccountMenu() {
  const accountMenu = document.getElementById("accountMenu");
  if (!accountMenu) return;
  accountMenu.classList.toggle("hidden");
}

async function performLogout() {
  logoutUser();
  closeAccountMenu();
  currentTopic = null;
  updateAuthUI();
  refreshDashboardInsights();
  await refreshAccessibleTopics();
  showScreen("splashScreen");
}

function initializeAuthUI() {
  const authActionBtn = document.getElementById("authActionBtn");
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authModal = document.getElementById("authModal");
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const accountMenu = document.getElementById("accountMenu");
  const accountMenuProfileBtn = document.getElementById("accountMenuProfileBtn");
  const accountMenuLogoutBtn = document.getElementById("accountMenuLogoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");

  if (authActionBtn) {
    authActionBtn.addEventListener("click", async () => {
      if (getCurrentUser()) {
        toggleAccountMenu();
      } else {
        openAuthModal("login");
      }
    });
  }

  if (accountMenu) {
    document.addEventListener("click", (event) => {
      if (
        !accountMenu.classList.contains("hidden") &&
        !accountMenu.contains(event.target) &&
        !authActionBtn?.contains(event.target)
      ) {
        closeAccountMenu();
      }
    });
  }

  if (accountMenuProfileBtn) {
    accountMenuProfileBtn.addEventListener("click", () => {
      closeAccountMenu();
      showScreen("profileScreen");
    });
  }

  if (accountMenuLogoutBtn) {
    accountMenuLogoutBtn.addEventListener("click", async () => {
      await performLogout();
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", closeAuthModal);
  }

  if (authModal) {
    authModal.addEventListener("click", (event) => {
      if (event.target === authModal) closeAuthModal();
    });
  }

  if (loginTab) loginTab.addEventListener("click", () => setActiveAuthTab("login"));
  if (registerTab) registerTab.addEventListener("click", () => setActiveAuthTab("register"));

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      try {
        await loginUser({ email, password });
        updateAuthUI();
        closeAccountMenu();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        closeAuthModal();
        showScreen("topicSelectionScreen");
      } catch (error) {
        setAuthMessage(error.message || "Login failed.");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("registerName")?.value || "";
      const email = document.getElementById("registerEmail")?.value || "";
      const password = document.getElementById("registerPassword")?.value || "";
      const confirmPassword =
        document.getElementById("registerConfirmPassword")?.value || "";
      if (password !== confirmPassword) {
        setAuthMessage("Passwords do not match.");
        return;
      }
      try {
        await registerUser({ name, email, password });
        updateAuthUI();
        closeAccountMenu();
        refreshDashboardInsights();
        await refreshAccessibleTopics();
        setAuthMessage("Account created successfully.", "success");
        setTimeout(() => {
          closeAuthModal();
          showScreen("topicSelectionScreen");
        }, 450);
      } catch (error) {
        setAuthMessage(error.message || "Registration failed.");
      }
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail")?.value || "";
      if (!email) {
        setAuthMessage("Enter your email first, then click Forgot password.");
        return;
      }
      try {
        await requestPasswordReset(email, window.location.href);
        setAuthMessage("Password reset link sent. Check your email inbox.", "success");
      } catch (error) {
        setAuthMessage(error.message || "Unable to send password reset link.");
      }
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const user = getCurrentUser();
      const email = user?.email || "";
      if (!email) {
        showWarning("Login is required to change password.");
        return;
      }
      try {
        await requestPasswordReset(email, window.location.href);
        showWarning("Password reset link sent to your registered email.");
      } catch (error) {
        showError(error.message || "Unable to send password reset link.");
      }
    });
  }

  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", async () => {
      await performLogout();
    });
  }
}

function initializeResultButtons() {
  const retakeQuizBtn = document.getElementById("retakeQuizBtn");

  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener("click", () => {
      if (currentTopic) {
        if (!retakeFullQuiz()) {
          startQuiz(getCurrentMode());
        }
      }
    });
  }
}

window.startQuiz = startQuiz;

document.addEventListener("DOMContentLoaded", function () {
  initializeDashboardActions();
  initializeAuthUI();
  updateAuthUI();
  init();
  initializeResultButtons();
  refreshDashboardInsights();

  document.addEventListener("screenchange", (event) => {
    if (event?.detail?.screenId === "topicSelectionScreen") {
      refreshDashboardInsights();
    }
  });

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  const osDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && osDark)) {
    body.classList.add("dark-mode");
    if (themeIcon) themeIcon.textContent = "Dark";
  } else {
    body.classList.remove("dark-mode");
    if (themeIcon) themeIcon.textContent = "Light";
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode");

      if (body.classList.contains("dark-mode")) {
        if (themeIcon) themeIcon.textContent = "Dark";
        localStorage.setItem("theme", "dark");
      } else {
        if (themeIcon) themeIcon.textContent = "Light";
        localStorage.setItem("theme", "light");
      }
    });
  }
});
