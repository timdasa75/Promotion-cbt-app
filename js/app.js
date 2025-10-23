// app.js - Main application module

import { loadData } from './data.js';
import { displayTopics, selectTopic, showScreen, showError } from './ui.js';
import { loadQuestions, currentMode } from './quiz.js';

// Global variables
let currentTopic = null;

// Initialize the app
async function init() {
    try {
        console.log('Initializing app...');
        const topics = await loadData();
        console.log('Loaded topics:', topics);
        if (!topics || topics.length === 0) {
            console.error('No topics loaded');
            showError('No topics available. Please check data files.');
            return;
        }
        await displayTopics(topics, handleTopicSelect);
        console.log('Displayed topics');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load quiz data. Please try again later.');
    }
}


// Start the quiz with selected mode
function startQuiz(mode) {
    if (!currentTopic) {
        showError('No topic selected.');
        return;
    }
    loadQuestions(currentTopic, mode);
}


// Event listeners for mode selection
document.getElementById('practiceModeCard').addEventListener('click', () => startQuiz('practice'));
document.getElementById('examModeCard').addEventListener('click', () => startQuiz('exam'));
const reviewModeCard = document.getElementById('reviewModeCard');
if (reviewModeCard) {
    reviewModeCard.addEventListener('click', () => startQuiz('review'));
}

// Event listeners for navigation - now handled in quiz.js module
// Previous button is handled in quiz.js
// Submit and Next buttons are handled in quiz.js

// Event listener for back button in mode selection screen
const backToCategoryBtn = document.getElementById('backToCategoryBtn');
if (backToCategoryBtn) {
    backToCategoryBtn.addEventListener('click', () => {
        if (currentTopic) {
            // Go back to category selection screen
            showScreen('categorySelectionScreen');
        }
    });
}

// Handle topic selection from UI
function handleTopicSelect(topic) {
    currentTopic = topic;
    // Call the ui.js selectTopic function which handles categories properly
    selectTopic(topic);
}

// Initialize result screen buttons
function initializeResultButtons() {
    const retakeQuizBtn = document.getElementById('retakeQuizBtn');
    const reviewAnswersBtn = document.getElementById('reviewAnswersBtn');

    if (retakeQuizBtn) {
        retakeQuizBtn.addEventListener('click', () => {
            if (currentTopic) {
                startQuiz(currentMode);
            }
        });
    }

    if (reviewAnswersBtn) {
        reviewAnswersBtn.addEventListener('click', () => {
            if (currentTopic) {
                startQuiz('review');
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
    initializeResultButtons();
});