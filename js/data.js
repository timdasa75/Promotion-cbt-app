// data.js - Module for loading and managing quiz data

import {
  countQuestionsFromTopicData,
  getTopicFiles,
  fetchJsonFile,
  fetchTopicDataFiles,
  collectSubcategories,
} from "./topicSources.js";
import { debugLog } from "./logger.js";
import { isFeatureEnabled } from "./features.js";

let topics = [];
let examTemplates = [];
let glBandWeights = {};

async function loadOptionalJson(file, fallbackValue) {
  try {
    return await fetchJsonFile(file);
  } catch (error) {
    console.warn(`Optional config could not be loaded: ${file}`, error);
    return fallbackValue;
  }
}

export async function loadData() {
  try {
    debugLog("Loading topics...");
    const topicPromise = fetchJsonFile("data/topics.json");
    const templatePromise = isFeatureEnabled("enableTemplateLoading")
      ? loadOptionalJson("data/exam_templates.json", { templates: [] })
      : Promise.resolve({ templates: [] });
    const glBandPromise = isFeatureEnabled("enableGlBandWeights")
      ? loadOptionalJson("data/gl_band_weights.json", { bands: {} })
      : Promise.resolve({ bands: {} });

    const [topicData, templateData, glBandData] = await Promise.all([
      topicPromise,
      templatePromise,
      glBandPromise,
    ]);

    topics = Array.isArray(topicData?.topics) ? topicData.topics : [];
    examTemplates = Array.isArray(templateData?.templates)
      ? templateData.templates.filter((template) => template && typeof template === "object")
      : [];
    glBandWeights = glBandData?.bands && typeof glBandData.bands === "object"
      ? glBandData.bands
      : {};

    if (topics.length === 0) {
      throw new Error("No topics found");
    }

    debugLog("Loaded topics:", topics);
    debugLog("Loaded exam templates:", examTemplates);
    debugLog("Loaded GL band weights:", glBandWeights);

    return topics;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

export function getTopics() {
  return topics;
}

export function getExamTemplates() {
  return examTemplates;
}

export function getVisibleExamTemplates() {
  return examTemplates.filter((template) => template?.visible !== false);
}

export function getExamTemplateById(templateId) {
  const id = String(templateId || "").trim();
  if (!id) return null;
  return examTemplates.find((template) => String(template?.id || "").trim() === id) || null;
}

export function getGLBandWeights() {
  return glBandWeights;
}

export async function getTopicQuestionCounts(topics) {
  const counts = {};
  debugLog("Getting question counts for topics:", topics);

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
      } catch (error) {
        console.error(`Error loading questions for topic ${topic.id}:`, error);
        counts[topic.id] = 0;
      }
    }),
  );
  debugLog("All counts:", counts);
  return counts;
}

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
  } catch (error) {
    console.error("Error getting question count for subcategory:", error);
    return 0;
  }
}

export async function getTotalQuestionCountForTopic(topic) {
  try {
    const dataFiles = await fetchTopicDataFiles(topic, { tolerateFailures: true });
    return dataFiles.reduce((sum, data) => sum + countQuestionsFromTopicData(data), 0);
  } catch (error) {
    console.error("Error getting total question count for topic:", error);
    return 0;
  }
}

export async function getQuestionCountForSpecificSubcategory(topic, subcategory) {
  try {
    if (subcategory && subcategory.questions && Array.isArray(subcategory.questions)) {
      return subcategory.questions.length;
    }

    return 0;
  } catch (error) {
    console.error("Error getting question count for subcategory:", error);
    return 0;
  }
}
