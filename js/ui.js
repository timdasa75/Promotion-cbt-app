// ui.js - Module for UI management

// Track current screen
let currentScreenId = "topicSelectionScreen";

// Show a specific screen with animation
export function showScreen(screenId) {
  console.log(`Switching to screen: ${screenId}`);
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
      console.log(`Already on screen: ${screenId}`);
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
    console.log(`Made ${screenId} visible`);

    // Trigger animation frame for smooth transition
    requestAnimationFrame(() => {
      // Add active class after a brief delay to ensure transition triggers
      setTimeout(() => {
        targetScreen.classList.add("active");
        console.log(`Activated ${screenId}`);

        // Update current screen tracking
        currentScreenId = screenId;

        // Show/hide quiz header
        const quizHeader = document.getElementById("quizHeader");
        if (quizHeader) {
          quizHeader.classList.toggle("hidden", screenId !== "quizScreen");
        }

        resolve();
      });
    }, 300); // Match this with your CSS transition duration
  });
}

// Show error message
export function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  // Use .app-container for error placement
  const container = document.querySelector(".app-container");
  if (container) {
    container.insertBefore(errorDiv, container.firstChild);
  } else {
    // fallback: append to body
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }

  // Remove error after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Display categories for a topic
export async function displayCategories(topic, onSelect) {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) {
    console.error("Category list container not found");
    return;
  }

  // Show loading indicator
  categoryList.innerHTML = '<div class="loading">Loading categories...</div>';

  try {
    // Load topic data to get categories with proper path construction
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split("/");
      if (pathParts[1] === "Promotion-cbt-app") {
        return "/Promotion-cbt-app";
      }
      return "";
    };
    const BASE_URL = getBaseUrl();
    const filePath = `${BASE_URL}/${topic.file}`;
    const response = await fetch(filePath);
    const topicData = await response.json();

    categoryList.innerHTML = "";

    let subcategoriesToDisplay = [];

    if (topicData.subcategories && Array.isArray(topicData.subcategories)) {
      subcategoriesToDisplay = topicData.subcategories;
    } else if (Array.isArray(topicData)) {
      // Handle direct array of subcategories (e.g., psr.json)
      subcategoriesToDisplay = topicData;
    } else if (topicData.domains && Array.isArray(topicData.domains)) {
      // Handle structure with domains and nested topics (e.g., financial.json)
      topicData.domains.forEach((domain) => {
        if (domain.topics && Array.isArray(domain.topics)) {
          subcategoriesToDisplay = subcategoriesToDisplay.concat(domain.topics);
        }
      });
    } else if (topicData.psr_categories) {
      // Handle legacy structure with psr_categories
      subcategoriesToDisplay = Object.keys(topicData.psr_categories).map(
        (key) => ({
          id: key,
          name: topicData.psr_categories[key].name || key,
          description:
            topicData.psr_categories[key].description ||
            "No description available",
          questions: topicData.psr_categories[key].questions,
        }),
      );
    }

    if (subcategoriesToDisplay.length > 0) {
      // Use Promise.all to handle all async operations first
      const categoryCards = await Promise.all(
        subcategoriesToDisplay.map(async (subcategory, index) => {
          // Calculate the count based on the questions in the subcategory
          const count = subcategory.questions
            ? subcategory.questions.length
            : 0;

          const categoryCard = document.createElement("div");
          categoryCard.className = "topic-card ripple scale-on-hover";
          categoryCard.style.setProperty("--animation-order", index);
          const name = subcategory.name
            .replace(/^[A-Z]\.\s/, "")
            .replace(/ \(\d+ Questions\)/, "");
          categoryCard.innerHTML = `
              <div class="card-content">
                  <div class="topic-icon">${subcategory.icon || "📁"}</div>
                  <h3 class="topic-title">${name}</h3>
                  <p class="topic-description">${subcategory.description || "No description available"}</p>
              </div>
              <div class="card-footer">
                  <div class="question-count">
                      <strong>${count}</strong> Questions
                  </div>
              </div>
          `;
          categoryCard.addEventListener("click", () => {
            document
              .querySelectorAll(".topic-card")
              .forEach((card) => card.classList.remove("active"));
            categoryCard.classList.add("active");
            if (onSelect) onSelect(subcategory);
          });

          return categoryCard;
        }),
      );

      // Append all cards to the category list
      categoryCards.forEach((card) => categoryList.appendChild(card));

      // Add "All Categories" option
      const allCategoryCard = document.createElement("div");
      allCategoryCard.className = "topic-card ripple scale-on-hover";
      allCategoryCard.style.setProperty(
        "--animation-order",
        subcategoriesToDisplay.length,
      );
      allCategoryCard.innerHTML = `
                <div class="topic-icon">📚</div>
                <h3 class="topic-title">All Categories</h3>
                <p class="topic-description">Practice with questions from all categories</p>
                <div class="topic-count">All available questions</div>

            `;
      allCategoryCard.addEventListener("click", () => {
        document
          .querySelectorAll(".topic-card")
          .forEach((card) => card.classList.remove("active"));
        allCategoryCard.classList.add("active");
        if (onSelect) onSelect({ id: "all", name: "All Categories" });
      });
      categoryList.appendChild(allCategoryCard);
    } else {
      // If no subcategories, just load all questions (this case might be rare now)
      if (onSelect) onSelect({ id: "all", name: "All Questions" });
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    categoryList.innerHTML =
      '<div class="error-message">Failed to load categories. Please try again later.</div>';
  }

  // Add event listeners for back buttons
  const backToTopicBtn = document.getElementById("backToTopicBtn");
  if (backToTopicBtn) {
    backToTopicBtn.addEventListener("click", () => {
      showScreen("topicSelectionScreen");
    });
  }

  const selectAllCategoryBtn = document.getElementById("selectAllCategoryBtn");
  if (selectAllCategoryBtn) {
    selectAllCategoryBtn.addEventListener("click", () => {
      if (onSelect) onSelect({ id: "all", name: "All Categories" });
    });
  }

  showScreen("categorySelectionScreen");
}

// Display available topics
export async function displayTopics(topics, onSelect) {
  console.log("Displaying topics:", topics);
  const topicList = document.getElementById("topicList");
  if (!topicList) {
    console.error("Topic list container not found");
    return;
  }
  // Show loading spinner
  topicList.innerHTML = '<div class="loading">Loading topics...</div>';
  await new Promise((resolve) => setTimeout(resolve, 500));
  topicList.innerHTML = "";
  if (!topics || topics.length === 0) {
    topicList.innerHTML =
      '<div class="error-message">No topics available</div>';
    return;
  }

  // Get question counts for topics
  let counts = {};
  try {
    const dataModule = await import("./data.js");
    counts = await dataModule.getTopicQuestionCounts(topics);
    console.log("Question counts:", counts);
  } catch (e) {
    console.error("Error getting question counts:", e);
    // fallback: all zero
    topics.forEach((t) => (counts[t.id] = 0));
  }

  console.log("Creating topic cards for", topics.length, "topics");
  topics.forEach((topic, index) => {
    const topicCard = document.createElement("div");
    topicCard.className = "topic-card ripple scale-on-hover";
    topicCard.style.setProperty("--animation-order", index);
    const name = topic.name
      .replace(/^[A-Z]\.\s/, "")
      .replace(/ \(\d+ Questions\)/, "");
    topicCard.innerHTML = `
        <div class="card-content">
            <div class="topic-icon">${topic.icon || "📚"}</div>
            <h3 class="topic-title">${name}</h3>
            <p class="topic-description">${topic.description || "No description available"}</p>
        </div>
        <div class="card-footer">
            <div class="question-count">
                <strong>${counts[topic.id] || 0}</strong> Questions
            </div>
        </div>
    `;
    topicCard.addEventListener("click", () => {
      document
        .querySelectorAll(".topic-card")
        .forEach((card) => card.classList.remove("active"));
      topicCard.classList.add("active");
      if (onSelect) onSelect(topic);
    });
    topicList.appendChild(topicCard);
    console.log("Added topic card:", topic.name);
  });
  console.log("Showing topic selection screen");
  // Make sure the screen is visible
  const topicSelectionScreen = document.getElementById("topicSelectionScreen");
  if (topicSelectionScreen) {
    topicSelectionScreen.classList.remove("hidden");
    topicSelectionScreen.classList.add("active");
  }
  showScreen("topicSelectionScreen");
}

// Get total question count for a topic
export async function getTotalQuestionCount(topic) {
  try {
    const dataModule = await import("./data.js");
    return await dataModule.getTotalQuestionCountForTopic(topic);
  } catch (e) {
    console.error("Error getting total question count:", e);
    return 0;
  }
}

// Select a topic and show category selection (then mode selection)
export async function selectTopic(topic) {
  try {
    const getBaseUrl = () => {
      const pathParts = window.location.pathname.split("/");
      if (pathParts[1] === "Promotion-cbt-app") {
        return "/Promotion-cbt-app";
      }
      return "";
    };
    const BASE_URL = getBaseUrl();
    const filePath = `${BASE_URL}/${topic.file}`;
    const response = await fetch(filePath);
    const topicData = await response.json();

    let hasSubcategories = false;
    if (Array.isArray(topicData) && topicData.length > 0) {
      hasSubcategories = true; // psr.json is a direct array of subcategories
    } else if (
      topicData.domains &&
      Array.isArray(topicData.domains) &&
      topicData.domains.some(
        (domain) => domain.topics && domain.topics.length > 0,
      )
    ) {
      hasSubcategories = true; // financial.json has domains with topics
    } else if (
      topicData.hasSubcategories &&
      topicData.subcategories &&
      Array.isArray(topicData.subcategories) &&
      topicData.subcategories.length > 0
    ) {
      hasSubcategories = true; // Other topics with hasSubcategories
    } else if (
      topicData.psr_categories &&
      Object.keys(topicData.psr_categories).length > 0
    ) {
      hasSubcategories = true; // Legacy psr_categories
    }

    // Check if the topic has subcategories
    if (hasSubcategories) {
      // Topic has subcategories, show category selection screen
      const categoryQuizTitle = document.getElementById("categoryQuizTitle");
      const categoryQuizDescription = document.getElementById(
        "categoryQuizDescription",
      );
      const selectedTopicForCategory = document.getElementById(
        "selectedTopicForCategory",
      );

      if (categoryQuizTitle) categoryQuizTitle.textContent = topic.name;
      if (categoryQuizDescription)
        categoryQuizDescription.textContent = topic.description;
      if (selectedTopicForCategory)
        selectedTopicForCategory.textContent = topic.name;

      // Load and display categories for the selected topic
      await displayCategories(topic, (selectedCategory) => {
        // Store the selected category in the topic object
        topic.selectedCategory = selectedCategory.id || "all";
        showScreen("modeSelectionScreen");
      });
    } else {
      // No subcategories, proceed directly to mode selection
      const quizTitle = document.getElementById("modeQuizTitle");
      const quizDescription = document.getElementById("modeQuizDescription");
      const selectedTopicName = document.getElementById("selectedTopicName");

      if (quizTitle) quizTitle.textContent = topic.name;
      if (quizDescription) quizDescription.textContent = topic.description;
      if (selectedTopicName) selectedTopicName.textContent = topic.name;

      // Set selected category to 'all' since there are no specific categories
      topic.selectedCategory = "all";
      showScreen("modeSelectionScreen");
    }

    // Add event listener for back button in mode selection screen
    const backToCategoryBtn = document.getElementById("backToCategoryBtn");
    if (backToCategoryBtn) {
      backToCategoryBtn.addEventListener("click", () => {
        showScreen("categorySelectionScreen");
      });
    }
  } catch (error) {
    console.error("Error checking topic subcategories:", error);
    // If there's an error, proceed to mode selection anyway
    const quizTitle = document.getElementById("modeQuizTitle");
    const quizDescription = document.getElementById("modeQuizDescription");
    const selectedTopicName = document.getElementById("selectedTopicName");

    if (quizTitle) quizTitle.textContent = topic.name;
    if (quizDescription) quizDescription.textContent = topic.description;
    if (selectedTopicName) selectedTopicName.textContent = topic.name;

    topic.selectedCategory = "all";
    showScreen("modeSelectionScreen");
  }
}

// Make functions available globally for HTML onclick handlers
window.showScreen = showScreen;
