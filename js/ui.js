// ui.js - Module for UI management

import {
  countQuestionsFromTopicData,
  collectSubcategories,
  fetchTopicDataFilesWithReport,
  getQuestionsFromSubcategory,
} from "./topicSources.js";
import {
  getAccessibleTopics,
  getCurrentEntitlement,
  isAuthenticated,
} from "./auth.js";
import { debugLog } from "./logger.js";

// Track current screen
let currentScreenId = "splashScreen";

// Show a specific screen with animation
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



export function showWarning(message) {
  const warningDiv = document.createElement("div");
  warningDiv.className = "warning-message";
  warningDiv.textContent = message;

  const container = document.querySelector(".app-container");
  if (container) {
    container.insertBefore(warningDiv, container.firstChild);
  } else {
    document.body.insertBefore(warningDiv, document.body.firstChild);
  }

  setTimeout(() => {
    warningDiv.remove();
  }, 6000);
}

// Display categories for a topic
export async function displayCategories(topic, onSelect) {
  const categoryList = document.getElementById("categoryList");
  let unlockedSubcategories = [];
  if (!categoryList) {
    console.error("Category list container not found");
    return;
  }

  categoryList.innerHTML = '<div class="loading">Loading categories...</div>';

  try {
    const sourceLoadResult = await fetchTopicDataFilesWithReport(topic, {
      tolerateFailures: true,
    });

    const { payloads: topicDataFiles, failedFiles, totalFiles } = sourceLoadResult;

    if (failedFiles.length > 0) {
      showWarning(`Some topic sources could not be loaded (${totalFiles - failedFiles.length}/${totalFiles} available).`);
    }

    if (!topicDataFiles.length) {
      throw new Error("No topic data sources could be loaded.");
    }

    categoryList.innerHTML = "";

    if (failedFiles.length > 0) {
      const warning = document.createElement("div");
      warning.className = "warning-message inline-warning";
      warning.textContent = `Some content sources are unavailable for now (${totalFiles - failedFiles.length}/${totalFiles} loaded).`;
      categoryList.appendChild(warning);
    }

    let subcategoriesToDisplay = [];

    topicDataFiles.forEach((topicData) => {
      subcategoriesToDisplay = subcategoriesToDisplay.concat(collectSubcategories(topicData));
    });

    const entitlement = getCurrentEntitlement();
    const categoryLimit = entitlement.maxSubcategories;
    const countSubcategoryQuestions = (subcategory) =>
      getQuestionsFromSubcategory(subcategory).length;

    unlockedSubcategories =
      typeof categoryLimit === "number"
        ? subcategoriesToDisplay.slice(0, categoryLimit)
        : [...subcategoriesToDisplay];
    const unlockedCategoryIds = new Set(
      unlockedSubcategories.map((subcategory) => subcategory.id),
    );

    if (subcategoriesToDisplay.length > 0) {
      const categoryCards = await Promise.all(
        subcategoriesToDisplay.map(async (subcategory, index) => {
          const isUnlocked = unlockedCategoryIds.has(subcategory.id);
          const count = countSubcategoryQuestions(subcategory);

          const categoryCard = document.createElement("div");
          categoryCard.className = "topic-card ripple scale-on-hover";
          if (!isUnlocked) {
            categoryCard.classList.add("locked");
          }
          categoryCard.style.setProperty("--animation-order", index);
          const name = subcategory.name
            .replace(/^[A-Z]\.\s/, "")
            .replace(/ \(\d+ Questions\)/, "");
          categoryCard.innerHTML = `
              <div class="card-content">
                  <div class="topic-icon">${subcategory.icon || "&#128193;"}</div>
                  <h3 class="topic-title">${name}</h3>
                  <p class="topic-description">${subcategory.description || "No description available"}</p>
                  ${!isUnlocked ? '<span class="lock-badge">Locked on Free</span>' : ""}
              </div>
              <div class="card-footer">
                  <div class="question-count">
                      <strong>${count}</strong> Questions
                  </div>
              </div>
          `;
          categoryCard.addEventListener("click", () => {
            if (!isUnlocked) {
              showWarning(
                "This subtopic is locked on Free plan. Upgrade to access all subtopics.",
              );
              return;
            }
            document
              .querySelectorAll(".topic-card")
              .forEach((card) => card.classList.remove("active"));
            categoryCard.classList.add("active");
            if (onSelect) onSelect(subcategory, unlockedSubcategories);
          });

          return categoryCard;
        }),
      );

      categoryCards.forEach((card) => categoryList.appendChild(card));

      const allCategoryCard = document.createElement("div");
      allCategoryCard.className = "topic-card ripple scale-on-hover";
      allCategoryCard.style.setProperty(
        "--animation-order",
        subcategoriesToDisplay.length,
      );
      const totalQuestionsInTopic = subcategoriesToDisplay.reduce(
        (sum, entry) => sum + countSubcategoryQuestions(entry),
        0,
      );
      allCategoryCard.innerHTML = `
                <div class="topic-icon">&#128218;</div>
                <h3 class="topic-title">All Categories</h3>
                <p class="topic-description">Practice with questions from all categories</p>
                <div class="topic-count"><strong>${totalQuestionsInTopic}</strong> total questions in this topic</div>

            `;
      allCategoryCard.addEventListener("click", () => {
        document
          .querySelectorAll(".topic-card")
          .forEach((card) => card.classList.remove("active"));
        allCategoryCard.classList.add("active");
        if (onSelect) onSelect({ id: "all", name: "All Categories" }, unlockedSubcategories);
      });
      categoryList.appendChild(allCategoryCard);
    } else {
      if (onSelect) onSelect({ id: "all", name: "All Questions" }, []);
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    categoryList.innerHTML =
      '<div class="error-message">Failed to load categories. Please try again later.</div>';
  }

  const backToTopicBtn = document.getElementById("backToTopicBtn");
  if (backToTopicBtn) {
    backToTopicBtn.addEventListener("click", () => {
      showScreen("topicSelectionScreen");
    });
  }

  const selectAllCategoryBtn = document.getElementById("selectAllCategoryBtn");
  if (selectAllCategoryBtn) {
    selectAllCategoryBtn.addEventListener("click", () => {
      if (onSelect) onSelect({ id: "all", name: "All Categories" }, unlockedSubcategories);
    });
  }

  showScreen("categorySelectionScreen");
}

// Display available topics
export async function displayTopics(topics, onSelect) {
  debugLog("Displaying topics:", topics);
  const topicList = document.getElementById("topicList");
  if (!topicList) {
    console.error("Topic list container not found");
    return;
  }
  topicList.innerHTML = '<div class="loading">Loading topics...</div>';
  await new Promise((resolve) => setTimeout(resolve, 500));
  topicList.innerHTML = "";
  if (!topics || topics.length === 0) {
    topicList.innerHTML =
      '<div class="error-message">No topics available</div>';
    return;
  }

  let counts = {};
  try {
    const dataModule = await import("./data.js");
    counts = await dataModule.getTopicQuestionCounts(topics);
    debugLog("Question counts:", counts);
  } catch (e) {
    console.error("Error getting question counts:", e);
    topics.forEach((t) => (counts[t.id] = 0));
  }

  debugLog("Creating topic cards for", topics.length, "topics");
  const entitlement = getCurrentEntitlement();
  const topicLimit = entitlement.maxTopics;
  const unlockedTopics = getAccessibleTopics(topics);
  const unlockedTopicIds = new Set(unlockedTopics.map((topic) => topic.id));

  topics.forEach((topic, index) => {
    const isUnlocked = unlockedTopicIds.has(topic.id);
    const topicCard = document.createElement("div");
    topicCard.className = "topic-card ripple scale-on-hover";
    if (!isUnlocked) {
      topicCard.classList.add("locked");
    }
    topicCard.style.setProperty("--animation-order", index);
    const name = topic.name
      .replace(/^[A-Z]\.\s/, "")
      .replace(/ \(\d+ Questions\)/, "");
    topicCard.innerHTML = `
        <div class="card-content">
            <div class="topic-icon">${topic.icon || "&#128218;"}</div>
            <h3 class="topic-title">${name}</h3>
            <p class="topic-description">${topic.description || "No description available"}</p>
            ${!isUnlocked ? '<span class="lock-badge">Locked on Free</span>' : ""}
        </div>
        <div class="card-footer">
            <div class="question-count">
                <strong>${counts[topic.id] || 0}</strong> Questions
            </div>
        </div>
    `;
    topicCard.addEventListener("click", () => {
      if (!isUnlocked) {
        showWarning("This topic is locked on Free plan. Upgrade to access all topics.");
        return;
      }
      document
        .querySelectorAll(".topic-card")
        .forEach((card) => card.classList.remove("active"));
      topicCard.classList.add("active");
      if (onSelect) onSelect(topic);
    });
    topicList.appendChild(topicCard);
    debugLog("Added topic card:", topic.name);
  });
  debugLog("Topic list populated");

  const topicSelectionScreen = document.getElementById("topicSelectionScreen");
  const freePlanNotice = document.getElementById("freePlanNotice");
  if (topicSelectionScreen && freePlanNotice) {
    if (!isAuthenticated()) {
      freePlanNotice.classList.add("hidden");
    } else if (typeof topicLimit === "number") {
      freePlanNotice.classList.remove("hidden");
      freePlanNotice.textContent =
        `Free plan active: all topics visible, ${topicLimit} topic unlocked, ${entitlement.maxSubcategories} subtopics unlocked, ${entitlement.maxQuestionsPerSubcategory} questions per unlocked subtopic.`;
    } else {
      freePlanNotice.classList.add("hidden");
    }
  }
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
    const sourceLoadResult = await fetchTopicDataFilesWithReport(topic, {
      tolerateFailures: true,
    });

    const { payloads: topicDataFiles } = sourceLoadResult;

    if (!topicDataFiles.length) {
      throw new Error("No topic data sources could be loaded.");
    }

    const topicTotalQuestions = topicDataFiles.reduce(
      (sum, topicData) => sum + countQuestionsFromTopicData(topicData),
      0,
    );
    const categoryTotalQuestions = document.getElementById("categoryTotalQuestions");
    const categoryConfidenceScore = document.getElementById("categoryConfidenceScore");
    if (categoryTotalQuestions) categoryTotalQuestions.textContent = String(topicTotalQuestions);
    if (categoryConfidenceScore) categoryConfidenceScore.textContent = "--";

    let hasSubcategories = false;
    for (const topicData of topicDataFiles) {
      if (collectSubcategories(topicData).length > 0) {
        hasSubcategories = true;
        break;
      }
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
      await displayCategories(topic, (selectedCategory, visibleSubcategories = []) => {
        // Store the selected category in the topic object
        topic.selectedCategory = selectedCategory.id || "all";
        if (Array.isArray(visibleSubcategories) && visibleSubcategories.length) {
          topic.allowedCategoryIds = visibleSubcategories
            .map((entry) => (entry && typeof entry === "object" ? entry.id : null))
            .filter(Boolean);
        } else {
          topic.allowedCategoryIds = null;
        }
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
      topic.allowedCategoryIds = null;
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
    topic.allowedCategoryIds = null;
    showScreen("modeSelectionScreen");
  }
}

// Make functions available globally for HTML onclick handlers
window.showScreen = showScreen;

