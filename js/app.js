// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showError, showWarning } from "./ui.js";
import {
  loadQuestions,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";
import { debugLog } from "./logger.js";

let currentTopic = null;
let cachedTopics = [];
let recommendedTopicId = null;
let lastSessionTopicId = null;

const PROGRESS_STORAGE_KEY = "cbt_progress_summary_v1";

async function init() {
  try {
    debugLog("Initializing app...");
    const topicsData = await loadData();
    cachedTopics = Array.isArray(topicsData) ? topicsData : [];
    debugLog("Loaded topics:", topicsData);
    if (!topicsData || topicsData.length === 0) {
      console.error("No topics loaded");
      showError("No topics available. Please check data files.");
      return;
    }
    await displayTopics(topicsData, handleTopicSelect);
    initializeDashboardActions();
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
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
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
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch (error) {
    return { attempts: [] };
  }
}

function getTopicNameById(topicId) {
  const topic = cachedTopics.find((entry) => entry.id === topicId);
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
  recommendedTopicId = getWeakestTopicId(attempts) || "psr";

  const totalAttemptsStat = document.getElementById("totalAttemptsStat");
  const averageScoreStat = document.getElementById("averageScoreStat");
  const streakStat = document.getElementById("streakStat");
  const streakStatusBadge = document.getElementById("streakStatusBadge");
  const continueTopicTitle = document.getElementById("continueTopicTitle");
  const continueTopicMeta = document.getElementById("continueTopicMeta");
  const recommendedTopicTitle = document.getElementById("recommendedTopicTitle");
  const recommendedTopicMeta = document.getElementById("recommendedTopicMeta");

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
  const resumeBtn = document.getElementById("resumeSessionBtn");
  const resumeCard = document.getElementById("resumeSessionCard");
  const recommendationBtn = document.getElementById("startRecommendationBtn");
  const recommendationCard = document.getElementById("recommendedTopicCard");
  const filterDocumentBtn = document.getElementById("filterDocumentBtn");
  const filterCompetencyBtn = document.getElementById("filterCompetencyBtn");
  const filterRecentBtn = document.getElementById("filterRecentBtn");

  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
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
      startRecommendation();
    });
  }
  if (recommendationCard) {
    recommendationCard.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
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

async function handleTopicSelect(topic) {
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
  if (!currentTopic) {
    showError("No topic selected.");
    return;
  }
  setCurrentMode(mode);
  loadQuestions();
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
