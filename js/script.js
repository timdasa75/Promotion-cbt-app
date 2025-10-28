import { showScreen, showError } from "./ui.js";
import { setCurrentTopic, setCurrentMode, loadQuestions as loadQuizQuestions } from "./quiz.js";

// Global variables
let topics = [];

// DOM Elements
const quizTitle = document.getElementById('modeQuizTitle');
const quizDescription = document.getElementById('modeQuizDescription');

// Load data from JSON files
async function loadData() {
    try {
        console.log('Attempting to load topics.json');
        const response = await fetch('data/topics.json');
        console.log('Fetch response:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Parsed data:', data);
        topics = data.topics || [];
        console.log('Loaded topics:', topics);

        if (topics.length === 0) {
            throw new Error('No topics found');
        }

        // Display topics
        displayTopics();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load quiz data. Please try again later.');
    }
}

// Display available topics
function displayTopics() {
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = '';

    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'mode-card';
        topicCard.innerHTML = `
            <div class="mode-icon">📚</div>
            <h3>${topic.name}</h3>
            <p>${topic.description}</p>
        `;
        topicCard.addEventListener('click', () => selectTopic(topic));
        topicList.appendChild(topicCard);
    });

    // Show topic selection screen
    showScreen('topicSelectionScreen');
}

// Select a topic and show mode selection
function selectTopic(topic) {
    setCurrentTopic(topic);
    quizTitle.textContent = topic.name;
    quizDescription.textContent = topic.description;
    showScreen('modeSelectionScreen');
}

// Start the quiz with selected mode
function startQuiz(mode) {
    setCurrentMode(mode);
    loadQuizQuestions();
}

// Make startQuiz globally accessible
window.startQuiz = startQuiz;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});
