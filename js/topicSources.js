// topicSources.js - shared utilities for topic data sources

const jsonCache = new Map();

export function getBaseUrl() {
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'Promotion-cbt-app') {
    return '/Promotion-cbt-app';
  }
  return '';
}

export function getTopicFiles(topic) {
  return [topic?.file].filter(Boolean);
}

export async function fetchJsonFile(file) {
  const BASE_URL = getBaseUrl();
  const filePath = `${BASE_URL}/${file}`;

  if (jsonCache.has(filePath)) {
    return jsonCache.get(filePath);
  }

  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${file}: ${response.status}`);
  }

  const text = await response.text();
  if (text.trim().startsWith('<')) {
    throw new Error(`Server returned HTML instead of JSON for ${file}`);
  }

  const data = JSON.parse(text);
  jsonCache.set(filePath, data);
  return data;
}

export async function fetchTopicDataFilesWithReport(topic, options = {}) {
  const { tolerateFailures = false, onProgress } = options;
  const files = getTopicFiles(topic);
  const payloads = [];
  const loadedFiles = [];
  const failedFiles = [];

  for (const file of files) {
    try {
      payloads.push(await fetchJsonFile(file));
      loadedFiles.push(file);
    } catch (error) {
      failedFiles.push(file);
      if (!tolerateFailures) throw error;
      console.warn(`Skipping unavailable source file for topic ${topic?.id}: ${file}`, error);
    } finally {
      if (typeof onProgress === 'function') {
        onProgress({
          loaded: loadedFiles.length,
          failed: failedFiles.length,
          total: files.length,
          currentFile: file,
        });
      }
    }
  }

  return {
    payloads,
    loadedFiles,
    failedFiles,
    totalFiles: files.length,
  };
}

export async function fetchTopicDataFiles(topic, options = {}) {
  const result = await fetchTopicDataFilesWithReport(topic, options);
  return result.payloads;
}

export function collectSubcategories(data) {
  if (data?.domains && Array.isArray(data.domains)) {
    const out = [];
    data.domains.forEach((domain) => {
      if (domain?.topics && Array.isArray(domain.topics)) {
        out.push(...domain.topics);
      }
    });
    return out;
  }

  if (data?.subcategories && Array.isArray(data.subcategories)) {
    return data.subcategories;
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.psr_categories) {
    return Object.keys(data.psr_categories).map((key) => ({
      id: key,
      name: data.psr_categories[key].name || key,
      description: data.psr_categories[key].description || 'No description available',
      questions: data.psr_categories[key].questions,
    }));
  }

  return [];
}

export function countQuestionsFromTopicData(data) {
  return collectSubcategories(data).reduce((sum, subcat) => {
    return sum + getQuestionsFromSubcategory(subcat).length;
  }, 0);
}

export function getQuestionsFromSubcategory(subcategory) {
  if (!subcategory?.questions || !Array.isArray(subcategory.questions)) return [];

  // Some data files (e.g. current affairs) nest actual question rows under a key.
  if (
    subcategory.id === "ca_general" &&
    subcategory.questions.length > 0 &&
    Array.isArray(subcategory.questions[0]?.ca_general)
  ) {
    return subcategory.questions[0].ca_general;
  }

  return subcategory.questions;
}

export function extractQuestionsByCategory(data, selectedCategory = "all", options = {}) {
  const { allowedCategoryIds = null, maxQuestionsPerSubcategory = null } = options;
  const subcategories = collectSubcategories(data);
  const allowedSet =
    Array.isArray(allowedCategoryIds) && allowedCategoryIds.length
      ? new Set(allowedCategoryIds)
      : null;

  if (selectedCategory === "all") {
    return subcategories.flatMap((subcategory) => {
      const questions = getQuestionsFromSubcategory(subcategory);
      if (!questions.length) return [];
      if (allowedSet && !allowedSet.has(subcategory.id)) return [];
      return typeof maxQuestionsPerSubcategory === "number"
        ? questions.slice(0, maxQuestionsPerSubcategory)
        : questions;
    });
  }

  const selected = subcategories.find((subcategory) => subcategory?.id === selectedCategory);
  const questions = getQuestionsFromSubcategory(selected);
  if (!questions.length) return [];
  if (allowedSet && !allowedSet.has(selected.id)) return [];
  return typeof maxQuestionsPerSubcategory === "number"
    ? questions.slice(0, maxQuestionsPerSubcategory)
    : questions;
}
