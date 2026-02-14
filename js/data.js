// data.js - Module for loading and managing quiz data

import { countQuestionsFromTopicData, getTopicFiles, fetchJsonFile, fetchTopicDataFiles, collectSubcategories } from "./topicSources.js";
import { debugLog } from "./logger.js";

// Global variables for data
let topics = [];

// Load data from JSON files
export async function loadData() {
  try {
    debugLog("Loading topics...");
    // Load topics with proper encoding
    const data = await fetchJsonFile("data/topics.json");
    debugLog("Raw data:", data);
    topics = data.topics || [];
    
    // Validate topics data
    if (topics.length === 0) {
      throw new Error("No topics found");
    }
    
    // Log loaded topics for debugging
    debugLog("Loaded topics:", topics);
    
    return topics;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

// Get topics
export function getTopics() {
  return topics;
}

// Get question counts for all topics
export async function getTopicQuestionCounts(topics) {
    const counts = {};
    debugLog('Getting question counts for topics:', topics);

    await Promise.all(
        topics.map(async (topic) => {
            try {
                const files = getTopicFiles(topic);
                let total = 0;
                for (const file of files) {
                  const data = await fetchJsonFile(file);
                  total += countQuestionsFromTopicData(data);
                }
                counts[topic.id] = total;
            } catch (e) {
                console.error(`Error loading questions for topic ${topic.id}:`, e);
                counts[topic.id] = 0;
            }
        })
    );
    debugLog('All counts:', counts);
    return counts;
}

// Get question count for a specific topic and subcategory
export async function getQuestionCountForSubcategory(topic, subcategoryId) {
  try {
    const dataFiles = await fetchTopicDataFiles(topic, { tolerateFailures: true });
    for (const data of dataFiles) {
      const subcategory = collectSubcategories(data).find((sub) => sub && sub.id === subcategoryId);
      if (subcategory && Array.isArray(subcategory.questions)) {
        return subcategory.questions.length;
      }
    }
    return 0;
  } catch (e) {
    console.error("Error getting question count for subcategory:", e);
    return 0;
  }
}

// Get total question count for a topic
export async function getTotalQuestionCountForTopic(topic) {
  try {
    const dataFiles = await fetchTopicDataFiles(topic, { tolerateFailures: true });
    return dataFiles.reduce((sum, data) => sum + countQuestionsFromTopicData(data), 0);
  } catch (e) {
    console.error("Error getting total question count for topic:", e);
    return 0;
  }
}

// Get question count for a specific subcategory
export async function getQuestionCountForSpecificSubcategory(topic, subcategory) {
  try {
    if (subcategory && subcategory.questions && Array.isArray(subcategory.questions)) {
      return subcategory.questions.length;
    }
    
    // If subcategory doesn't have questions directly, return 0
    return 0;
  } catch (e) {
    console.error("Error getting question count for subcategory:", e);
    return 0;
  }
}
