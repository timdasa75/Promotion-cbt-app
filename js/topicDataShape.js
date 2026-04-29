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
      description: data.psr_categories[key].description || "No description available",
      questions: data.psr_categories[key].questions,
    }));
  }

  return [];
}

export function getQuestionsFromSubcategory(subcategory) {
  if (!subcategory?.questions || !Array.isArray(subcategory.questions)) return [];

  if (
    subcategory.id === "ca_general" &&
    subcategory.questions.length > 0 &&
    Array.isArray(subcategory.questions[0]?.ca_general)
  ) {
    return subcategory.questions[0].ca_general;
  }

  return subcategory.questions;
}

function decorateQuestionsForSubcategory(questions, subcategory) {
  const items = Array.isArray(questions) ? questions : [];
  const subcategoryId = String(subcategory?.id || "").trim();
  const subcategoryName = String(subcategory?.name || subcategoryId || "").trim();

  return items.map((question) => {
    if (!question || typeof question !== "object") return question;
    return {
      ...question,
      sourceSubcategoryId: String(question?.sourceSubcategoryId || subcategoryId || "").trim(),
      sourceSubcategoryName: String(question?.sourceSubcategoryName || subcategoryName || subcategoryId || "").trim(),
    };
  });
}

export function countQuestionsFromTopicData(data) {
  return collectSubcategories(data).reduce((sum, subcat) => {
    return sum + getQuestionsFromSubcategory(subcat).length;
  }, 0);
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
      const limited = typeof maxQuestionsPerSubcategory === "number"
        ? questions.slice(0, maxQuestionsPerSubcategory)
        : questions;
      return decorateQuestionsForSubcategory(limited, subcategory);
    });
  }

  const selected = subcategories.find((subcategory) => subcategory?.id === selectedCategory);
  const questions = getQuestionsFromSubcategory(selected);
  if (!questions.length) return [];
  if (allowedSet && !allowedSet.has(selected.id)) return [];
  const limited = typeof maxQuestionsPerSubcategory === "number"
    ? questions.slice(0, maxQuestionsPerSubcategory)
    : questions;
  return decorateQuestionsForSubcategory(limited, selected);
}
