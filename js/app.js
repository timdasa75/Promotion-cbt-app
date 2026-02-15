// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showError } from "./ui.js";
import {
  loadQuestions,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";
import { debugLog } from "./logger.js";

let currentTopic = null;

async function init() {
  try {
    debugLog("Initializing app...");
    const topicsData = await loadData();
    debugLog("Loaded topics:", topicsData);
    if (!topicsData || topicsData.length === 0) {
      console.error("No topics loaded");
      showError("No topics available. Please check data files.");
      return;
    }
    await displayTopics(topicsData, handleTopicSelect);
    debugLog("Displayed topics");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to load quiz data. Please try again later.");
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
  const reviewAnswersBtn = document.getElementById("reviewAnswersBtn");

  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener("click", () => {
      if (currentTopic) {
        if (!retakeFullQuiz()) {
          startQuiz(getCurrentMode());
        }
      }
    });
  }

  if (reviewAnswersBtn) {
    reviewAnswersBtn.addEventListener("click", () => {
      if (currentTopic) {
        startQuiz("review");
      }
    });
  }
}

window.startQuiz = startQuiz;

document.addEventListener("DOMContentLoaded", function () {
  init();
  initializeResultButtons();

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
