// app.js - Main application module

import { loadData } from "./data.js";
import { displayTopics, selectTopic, showScreen, showError } from "./ui.js";
import {
  loadQuestions,
  setCurrentTopic,
  setCurrentMode,
  getCurrentMode,
  retakeFullQuiz,
} from "./quiz.js";

// Global variables
let currentTopic = null;

// Initialize the app
async function init() {
  try {
    console.log("Initializing app...");
    const topicsData = await loadData(); // Renamed to avoid conflict with imported topics
    console.log("Loaded topics:", topicsData);
    if (!topicsData || topicsData.length === 0) {
      console.error("No topics loaded");
      showError("No topics available. Please check data files.");
      return;
    }
    await displayTopics(topicsData, handleTopicSelect);
    console.log("Displayed topics");
  } catch (error) {
    console.error("Error initializing app:", error);
    showError("Failed to load quiz data. Please try again later.");
  }
}

// Handle topic selection from UI
async function handleTopicSelect(topic) {
  currentTopic = topic;
  setCurrentTopic(topic); // Update currentTopic in quiz.js module

  // Call the ui.js selectTopic function which handles categories properly
  await selectTopic(topic);

  // Attach event listeners for mode cards after modeSelectionScreen is likely shown
  // This needs to be done dynamically because the elements might not exist on initial DOMContentLoaded
  document.getElementById("practiceModeCard").onclick = () =>
    startQuiz("practice");
  document.getElementById("examModeCard").onclick = () => startQuiz("exam");
  document.getElementById("reviewModeCard").onclick = () => startQuiz("review");

  // Ensure quiz title and description are updated for mode selection screen
  const quizTitle = document.getElementById("modeQuizTitle");
  const quizDescription = document.getElementById("modeQuizDescription");
  const selectedTopicName = document.getElementById("selectedTopicName");
  if (quizTitle) quizTitle.textContent = topic.name;
  if (quizDescription) quizDescription.textContent = topic.description;
  if (selectedTopicName) selectedTopicName.textContent = topic.name;
}

// Start the quiz with selected mode
function startQuiz(mode) {
  if (!currentTopic) {
    showError("No topic selected.");
    return;
  }
  setCurrentMode(mode);
  loadQuestions(); // loadQuestions in quiz.js will use its internal currentTopic and currentMode
}

// Initialize result screen buttons
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

// Make startQuiz globally accessible (for onclick attributes if any are still used, but prefer event listeners)
window.startQuiz = startQuiz;

  // Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  init();
  initializeResultButtons();

  // Dark Mode Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.querySelector('.theme-icon');
  const body = document.body;

  // Check for saved theme preference or respect OS preference
  const savedTheme = localStorage.getItem('theme');
  const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && osDark)) {
      body.classList.add('dark-mode');
      themeIcon.textContent = '🌙';
  } else {
      // Ensure light mode is set by default
      body.classList.remove('dark-mode');
      themeIcon.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-mode');

      if (body.classList.contains('dark-mode')) {
          themeIcon.textContent = '🌙';
          localStorage.setItem('theme', 'dark');
      } else {
          themeIcon.textContent = '☀️';
          localStorage.setItem('theme', 'light');
      }
  });
});
