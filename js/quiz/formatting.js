export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Markdown parser for basic formatting
 * @param {string} text - Text to convert to HTML
 * @returns {string} HTML formatted text
 */
export function parseMarkdown(text) {
  if (!text || typeof text !== "string") return text || "";

  // Escape HTML first so markdown formatting cannot inject markup.
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Inline markdown.
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^\*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  // New lines.
  html = html.replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

export function normalizeExplanationText(text) {
  if (!text || typeof text !== "string") return "No explanation available.";

  let normalized = text.trim();

  // Remove answer-judgment lead-ins so rationale stays neutral for all outcomes.
  normalized = normalized.replace(
    /^(this\s+is\s+correct\s+because|this\s+is\s+incorrect\s+because|correct\s+because|incorrect\s+because)\s*/i,
    "",
  );
  normalized = normalized.replace(/^(correct|incorrect)\s*[:.-]\s*/i, "");
  normalized = normalized.replace(/^(this\s+means|this\s+is\s+because)\s*/i, "");

  // Clean accidental duplicate punctuation and spacing artifacts from generated content.
  normalized = normalized.replace(/\s{2,}/g, " ");
  normalized = normalized.replace(/,\s*\./g, ".");
  normalized = normalized.replace(/\.\s*\./g, ".");

  normalized = normalized.trim();
  if (!normalized) return "No explanation available.";

  // Ensure sentence starts cleanly.
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return normalized;
}
