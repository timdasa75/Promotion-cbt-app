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

/**
 * Attempt to load JSON from the given file and fall back to a provided value if loading fails.
 * @param {string} file - Path or URL of the JSON file to load.
 * @param {*} fallbackValue - Value to return when the file cannot be loaded or parsed.
 * @returns {*} The parsed JSON content from the file, or `fallbackValue` if loading fails.
 */
async function loadOptionalJson(file, fallbackValue) {
  try {
    return await fetchJsonFile(file);
  } catch (error) {
    console.warn(`Optional config could not be loaded: ${file}`, error);
    return fallbackValue;
  }
}

/**
 * Load topics and optional exam templates and GL band weights into module state.
 * Conditionally loads templates and GL band weights based on feature flags and validates the loaded data before setting module-level variables.
 * @returns {Array} The loaded topics array.
 * @throws {Error} If no topics are found or if any required load operation fails.
 */
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

/**
 * Get the current list of topics maintained by the module.
 * @returns {Array<Object>} The module's topics array.
 */
export function getTopics() {
  return topics;
}

/**
 * Retrieve the currently loaded exam templates.
 *
 * @returns {Array<Object>} The array of loaded exam template objects; empty if none are available.
 */
export function getExamTemplates() {
  return examTemplates;
}

/**
 * Get the exam templates that should be shown to users.
 * @returns {Array<Object>} An array of exam template objects whose `visible` property is not `false`.
 */
export function getVisibleExamTemplates() {
  return examTemplates.filter((template) => template?.visible !== false);
}

/**
 * Return the exam template matching the given id.
 * @param {any} templateId - Identifier to match; converted to a trimmed string before comparison.
 * @returns {object|null} The matching template object, or `null` if `templateId` is empty or no template matches.
 */
export function getExamTemplateById(templateId) {
  const id = String(templateId || "").trim();
  if (!id) return null;
  return examTemplates.find((template) => String(template?.id || "").trim() === id) || null;
}

/**
 * Retrieve the current GL band weights.
 * @returns {Object} The GL band weights mapping keyed by band identifier.
 */
export function getGLBandWeights() {
  return glBandWeights;
}

/**
 * Compute total question counts for each topic.
 *
 * Processes all provided topics concurrently, loading each topic's data files and summing their questions.
 * If loading or counting for a topic fails, that topic's count is set to 0.
 *
 * @param {Array<Object>} topics - Array of topic objects; each topic must have an `id` property used as the result key.
 * @returns {Object} An object mapping each `topic.id` to its total question count (number). Failed topic loads map to `0`.
 */
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

/**
 * Get the number of questions in a specific subcategory of a topic.
 * @param {Object} topic - Topic descriptor used to locate and load the topic's data files.
 * @param {(string|number)} subcategoryId - Identifier of the subcategory to count questions for.
 * @returns {number} The number of questions in the matching subcategory, or 0 if the subcategory is not found or an error occurs.
 */
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

/**
 * Compute the total number of questions across all data files for a topic.
 * @param {Object} topic - Topic descriptor used to locate its data files (passed to fetchTopicDataFiles).
 * @returns {number} Total number of questions across the topic's data files; `0` if an error occurs or no questions are found.
 */
export async function getTotalQuestionCountForTopic(topic) {
  try {
    const dataFiles = await fetchTopicDataFiles(topic, { tolerateFailures: true });
    return dataFiles.reduce((sum, data) => sum + countQuestionsFromTopicData(data), 0);
  } catch (error) {
    console.error("Error getting total question count for topic:", error);
    return 0;
  }
}

/**
 * Get the number of questions in a specific subcategory.
 * @param {Object} topic - Topic containing the subcategory (unused by this function; kept for API consistency).
 * @param {Object} subcategory - Subcategory object that may include a `questions` array.
 * @returns {number} The length of `subcategory.questions` if it is an array, otherwise 0.
 */
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
