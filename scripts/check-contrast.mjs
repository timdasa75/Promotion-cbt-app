// WCAG contrast audit for the Promotion CBT colour system.
//
// Two layers of checks against css/styles.css, for the light (:root) and dark
// (body.dark-mode) themes:
//
//  1. Token pairs  — required foreground/background token combinations
//     (hero surface, action buttons, ink tiers, status surfaces, focus ring).
//  2. Component pairs — real components (topic cards, quiz options, admin
//     badges, chips, search inputs): the audit resolves the actual `color`
//     declaration of the text element and the actual `background` of its
//     surface selector from the stylesheet, including alpha blends (rgba over
//     a known surface) and `color-mix()` interpolation.
//
// Thresholds: WCAG AA normal text 4.5:1, large text / UI boundaries 3:1.
// Pairs that cannot be resolved statically (gradients, images) are reported as
// "manual review" and do not fail the gate.
//
// Run with:  npm run test:colour   (or)   node scripts/check-contrast.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "css",
  "styles.css",
);

// ---------------------------------------------------------------------------
// WCAG relative-luminance / contrast math (WCAG 2.2, 1.4.3)
// ---------------------------------------------------------------------------

function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrast(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Colour / token resolution
// ---------------------------------------------------------------------------

const NAMED = {
  white: "#ffffff",
  black: "#000000",
};

export function parseHex(value) {
  let hex = value.trim().toLowerCase();
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/.test(hex)) {
    throw new Error(`Unsupported hex colour: "${value}"`);
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function hexToRgb(hex) {
  const { r, g, b } = parseHex(hex);
  return [r, g, b];
}

function rgbToHex([r, g, b]) {
  const clamp = (n) => Math.min(255, Math.max(0, Math.round(n)));
  return "#" + [clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function blendHex(rgb, overHex, a) {
  const bg = hexToRgb(overHex);
  return rgbToHex([
    rgb[0] * a + bg[0] * (1 - a),
    rgb[1] * a + bg[1] * (1 - a),
    rgb[2] * a + bg[2] * (1 - a),
  ]);
}

/** Parse `color-mix(in srgb, <c1> [<p1>%], <c2> [<p2>%])` into colours and
 *  percentages. Splits on top-level commas so `var()` and `rgba()` stops with
 *  nested parentheses are supported. Missing percentages follow the CSS spec:
 *  one given → the other is the remainder; none given → 50/50. */
function parseColorMix(value) {
  const m = value.match(/^color-mix\(\s*in\s+srgb\s*,(.*)\)\s*$/i);
  if (!m) return null;
  const parts = splitTopLevel(m[1]);
  if (parts.length < 2 || parts.length > 3) return null;
  const parsePart = (part) => {
    const pm = part.match(/^(.*?)\s+([\d.]+)%\s*$/);
    return pm ? { color: pm[1].trim(), pct: Number(pm[2]) } : { color: part.trim(), pct: null };
  };
  const a = parsePart(parts[0]);
  const b = parsePart(parts[1]);
  if (!a.color || !b.color) return null;
  if (a.pct == null && b.pct == null) return { c1: a.color, p1: 50, c2: b.color, p2: 50 };
  if (a.pct == null) return { c1: a.color, p1: 100 - b.pct, c2: b.color, p2: b.pct };
  if (b.pct == null) return { c1: a.color, p1: a.pct, c2: b.color, p2: 100 - a.pct };
  return { c1: a.color, p1: a.pct, c2: b.color, p2: b.pct };
}

/**
 * Resolve a CSS colour expression to a #rrggbb string, or null when it cannot
 * be resolved statically.
 *
 * @param {string|null} expr  raw CSS colour expression
 * @param {Record<string,string>} vars custom-property map for the theme
 * @param {string|null} [over] opaque hex the component blends onto (for
 *   rgba()/transparent surfaces), e.g. a card surface token
 * @param {Set<string>} [seen] guards against circular var() references
 */
export function resolveColor(expr, vars, over = null, seen = new Set()) {
  if (expr == null) return null;
  const value = String(expr).trim();

  const hexMatch = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = value.length === 4 ? "#" + value.slice(1).split("").map((c) => c + c).join("") : value;
    return hex.toLowerCase();
  }

  const named = NAMED[value.toLowerCase()];
  if (named) return named;

  const rgbMatch = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgbMatch) {
    const [r, g, b] = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((n) =>
      Math.min(255, Math.max(0, Number(n))),
    );
    return rgbToHex([r, g, b]);
  }

  // rgba(r, g, b, a) — blend over the component surface when known.
  const rgbaMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+%?)\s*\)$/,
  );
  if (rgbaMatch) {
    const [r, g, b] = [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]].map((n) =>
      Math.min(255, Math.max(0, Number(n))),
    );
    let a = Number(rgbaMatch[4].replace("%", ""));
    a = rgbaMatch[4].endsWith("%") ? a / 100 : a;
    if (a >= 1) return rgbToHex([r, g, b]);
    const overHex = typeof over === "string" ? resolveColor(over, vars, null, seen) : null;
    if (!overHex) return null;
    return blendHex([r, g, b], overHex, a);
  }

  // color-mix(in srgb, c1 p1%, c2 [p2%]) — linear interpolation.
  const mix = parseColorMix(value);
  if (mix) {
    const c1 = resolveColor(mix.c1, vars, over, seen);
    const c2 = resolveColor(mix.c2, vars, over, seen);
    if (!c1 || !c2) return null;
    const p1 = mix.p1 / 100;
    const p2 = mix.p2 == null ? 1 - p1 : mix.p2 / 100;
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    return rgbToHex([
      r1 * p1 + r2 * p2,
      g1 * p1 + g2 * p2,
      b1 * p1 + b2 * p2,
    ]);
  }

  const varMatch = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (varMatch) {
    const name = varMatch[1];
    if (seen.has(name)) return null; // circular reference
    const next = new Set(seen).add(name);
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      return resolveColor(vars[name], vars, over, next);
    }
    return varMatch[2] ? resolveColor(varMatch[2], vars, over, seen) : null;
  }

  // Gradients, images, relative colours, currentColor, etc. — render review.
  return null;
}

/** Split a string on commas that are not nested inside parentheses. */
function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function stripPosition(token) {
  // Remove a trailing length/percentage position ("0%", "100px", "50%") from
  // a gradient stop, leaving the colour expression.
  return token.replace(/\s+(?:\d+(?:\.\d+)?(?:%|px|rem|em|vw|vh)|(?:top|bottom|left|right|center))\s*$/, "").trim();
}

/** Resolve a surface expression to the list of opaque colours it renders as.
 *  A plain colour yields one entry; a `linear-gradient` yields one per colour
 *  stop (the audit checks text against the worst stop); alpha values are
 *  blended over `over`. Returns [] when nothing can be resolved statically. */
export function resolveSurfaceColors(expr, vars, over) {
  if (expr == null) return [];
  const value = String(expr).trim();

  const gradMatch = value.match(/^linear-gradient\s*\(\s*(?:to\s+[a-z\s]+|\d+deg)\s*,(.*)\)\s*$/i);
  if (gradMatch) {
    const stops = splitTopLevel(gradMatch[1]);
    const colors = [];
    for (const stop of stops) {
      const colorExpr = stripPosition(stop);
      const hex = resolveColor(colorExpr, vars, over);
      if (hex) colors.push(hex);
    }
    return colors;
  }

  const hex = resolveColor(value, vars, over);
  return hex ? [hex] : [];
}

/** Extract the token block(s) for a theme selector and return a map of the
 *  last-defined value per custom property. */
export function parseThemeTokens(css, selector) {
  const tokens = {};
  let index = 0;
  while (index < css.length) {
    const open = css.indexOf("{", index);
    if (open === -1) break;
    const prelude = css.slice(index, open).trim();
    let depth = 1;
    let close = open + 1;
    while (depth > 0 && close < css.length) {
      if (css[close] === "{") depth += 1;
      else if (css[close] === "}") depth -= 1;
      close += 1;
    }
    const body = css.slice(open + 1, close - 1);
    if (prelude === selector) {
      // Comments share a split segment with the token that follows them, so
      // strip them before splitting on ";".
      const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");
      for (const line of clean.split(";")) {
        const m = line.trim().match(/^(--[\w-]+)\s*:\s*(.+)$/);
        if (m) tokens[m[1]] = m[2].trim();
      }
    }
    index = close;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Selector-driven component resolution
// ---------------------------------------------------------------------------

/** Recursively walk style blocks, yielding style rules with their at-rule
 *  context (a space-joined description such as `@media (max-width:699px)`). */
function walkRules(css, start, end, context, emit) {
  let i = start;
  while (i < end) {
    const open = css.indexOf("{", i);
    if (open === -1 || open >= end) break;
    const prelude = css.slice(i, open).trim().replace(/\s+/g, " ");
    let depth = 1;
    let close = open + 1;
    while (depth > 0 && close < end) {
      if (css[close] === "{") depth += 1;
      else if (css[close] === "}") depth -= 1;
      close += 1;
    }
    const innerEnd = close - 1;
    if (prelude.startsWith("@")) {
      walkRules(css, open + 1, innerEnd, `${context} ${prelude}`.trim(), emit);
    } else {
      emit({ prelude, body: css.slice(open + 1, innerEnd), context });
    }
    i = close;
  }
}

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Returns the rule selector that best matches `target` (exact, or a
 *  descendant-suffix such as `.option-btn` inside `#quizScreen .option-btn`;
 *  never `.option-btn` matching `.option-btn.selected`), or null. */
function matchSelector(target, ruleSelectors) {
  const t = norm(target);
  let best = null;
  for (const sel of ruleSelectors) {
    const s = norm(sel);
    if (s === t) return s;
    if (s.endsWith(` ${t}`)) {
      if (best === null || s.length > best.length) best = s;
    }
  }
  return best;
}

/** Approximate CSS specificity of a (simple) selector: [ids, classes, types].
 *  Class-level counts `.`, `[attr]`, `:pseudo-class`; element-level counts
 *  standalone type names. Good enough to order competing component rules,
 *  which differ mostly in id/class depth. */
function specificity(sel) {
  const s = norm(sel);
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const classes =
    (s.match(/\.(?:[\w-]+|\\[0-9a-f ]+)/g) || []).length +
    (s.match(/\[[^\]]*\]/g) || []).length +
    (s.match(/:(?!:)[\w-]+/g) || []).length;
  const types = (s.match(/(?:^|[>+~\s])([a-zA-Z][\w-]*)(?![\w-])/g) || []).length;
  return [ids, classes, types];
}

function specGreaterThan(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function parseDeclarations(body) {
  const decls = {};
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const part of clean.split(";")) {
    const m = part.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
    if (m) decls[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return decls;
}

/** Find the effective declaration of `property` for `selector` under `theme`
 *  using a specificity-aware cascade over top-level rules (rules inside
 *  @media are skipped — their activation is not known statically). Returns
 *  the raw declared value or null when no rule declares it. */
export function findEffectiveValue(css, selector, property, theme) {
  const want = property.toLowerCase();
  let bestValue = null;
  let bestSpec = [-1, -1, -1];
  let bestIndex = -1;
  let index = 0;
  walkRules(css, 0, css.length, "", ({ prelude, body, context }) => {
    index += 1;
    if (context.includes("@media")) return; // activation unknown statically
    if (/^@/.test(prelude)) return;
    const selectors = prelude.split(",").map((s) => s.trim()).filter(Boolean);
    if (theme === "light" && selectors.some((s) => s.startsWith("body.dark-mode"))) return;
    const matched = matchSelector(selector, selectors);
    if (!matched) return;
    const decls = parseDeclarations(body);
    const value =
      decls[want] ?? (want === "background" ? decls["background-color"] : undefined);
    if (value == null) return;
    const spec = specificity(matched);
    const better =
      bestIndex === -1 ||
      specGreaterThan(spec, bestSpec) ||
      (!specGreaterThan(bestSpec, spec) && index > bestIndex);
    if (better) {
      bestSpec = spec;
      bestValue = value;
      bestIndex = index;
    }
  });
  return bestValue;
}

// ---------------------------------------------------------------------------
// Required pairs
// ---------------------------------------------------------------------------

const PAIRS = [
  { name: "Hero surface — heading", fg: "--on-hero", bg: "--surface-hero", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Hero surface — muted helper text", fg: "--on-hero-muted", bg: "--surface-hero", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Primary action — label", fg: "--action-primary-fg", bg: "--action-primary-bg", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Secondary action — label", fg: "--action-secondary-fg", bg: "--action-secondary-bg", threshold: 4.5, themes: ["light"] },
  { name: "Danger action — label", fg: "--action-danger-fg", bg: "--action-danger-bg", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Body text — on card", fg: "--ink-700", bg: "--card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Secondary text — on card", fg: "--ink-600", bg: "--card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Muted text — on card", fg: "--ink-500", bg: "--card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Ghost action — label on card", fg: "--green-900", bg: "--card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Success state — text on surface", fg: "--text-success", bg: "--surface-success", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Warning state — text on surface", fg: "--text-warning", bg: "--surface-warning", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Danger state — text on surface", fg: "--text-danger", bg: "--surface-danger", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Focus ring — vs page surface (UI boundary)", fg: "--focus-ring", bg: "--surface", threshold: 3, themes: ["light", "dark"] },
];

/** Component pairs resolved from the real component rules.
 *  - fgSel: selector whose `color` declaration is read (fallback: fgFallback)
 *  - bgSel: selector whose `background` is read (fallback: bgFallback)
 *  - over: opaque surface the component sits on, for alpha-blended and
 *    transparent backgrounds (defaults to --card)
 *  `manual` is reported when neither the declaration nor the fallback resolves. */
const COMPONENT_PAIRS = [
  // Topic cards
  { name: "Topic card — title", fgSel: ".topic-card .topic-title", bgSel: ".topic-card", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Topic card — description", fgSel: ".topic-description", bgSel: ".topic-card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Topic card — question count", fgSel: ".topic-count", bgSel: ".topic-card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Topic card — count emphasis", fgSel: ".topic-count strong", bgSel: ".topic-card", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Topic card — locked badge", fgSel: ".lock-badge", bgSel: ".topic-card", threshold: 4.5, themes: ["light", "dark"] },
  // Quiz
  { name: "Quiz question card — text", fgSel: ".question-card", bgSel: ".question-card", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz question — number", fgSel: ".question-number", bgSel: ".question-card", fgFallback: "--green-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz option — text", fgSel: ".option-btn", bgSel: ".option-btn", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz option — selected", fgSel: ".option-btn.selected", bgSel: ".option-btn.selected", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz option — correct", fgSel: ".option-btn.correct", bgSel: ".option-btn.correct", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz option — incorrect", fgSel: ".option-btn.incorrect", bgSel: ".option-btn.incorrect", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz feedback label — correct", fgSel: ".option-feedback-label.correct", bgSel: ".option-feedback-label.correct", fgFallback: "--text-success", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Quiz feedback label — incorrect", fgSel: ".option-feedback-label.incorrect", bgSel: ".option-feedback-label.incorrect", fgFallback: "--text-danger", threshold: 4.5, themes: ["light", "dark"] },
  // Admin badges
  { name: "Admin badge — approved", fgSel: ".admin-badge.approved", bgSel: ".admin-badge.approved", fgFallback: "--text-success", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Admin badge — pending", fgSel: ".admin-badge.pending", bgSel: ".admin-badge.pending", fgFallback: "--text-warning", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Admin badge — rejected", fgSel: ".admin-badge.rejected", bgSel: ".admin-badge.rejected", fgFallback: "--text-danger", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Admin badge — neutral", fgSel: ".admin-badge.neutral", bgSel: ".admin-badge.neutral", fgFallback: "--ink-700", threshold: 4.5, themes: ["light", "dark"] },
  // Chips and search
  { name: "Filter chip — active", fgSel: ".topic-filter-row .chip.active", bgSel: ".topic-filter-row .chip.active", fgFallback: "--green-900", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Search input — text", fgSel: ".topic-search-wrap input", bgSel: ".topic-search-wrap input", fgFallback: "--ink-900", threshold: 4.5, themes: ["light", "dark"] },
  // Analytics
  { name: "Analytics tile — value (green)", fgSel: ".analytic-item.traffic-green .analytic-value", bgSel: ".analytic-item.traffic-green", fgFallback: "--text-success", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Analytics tile — value (amber)", fgSel: ".analytic-item.traffic-amber .analytic-value", bgSel: ".analytic-item.traffic-amber", fgFallback: "--text-warning", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Analytics tile — value (red)", fgSel: ".analytic-item.traffic-red .analytic-value", bgSel: ".analytic-item.traffic-red", fgFallback: "--text-danger", threshold: 4.5, themes: ["light", "dark"] },
  { name: "Analytics tile — label", fgSel: ".analytic-label", bgSel: ".analytic-item", threshold: 4.5, themes: ["light", "dark"] },
];

const tokenValue = (vars, token, over) => {
  if (!token) return null;
  return token.startsWith("#") || /^(var|rgb|color)/.test(token)
    ? resolveColor(token, vars, over)
    : resolveColor(vars[token], vars, over);
};

export function auditComponentPairs(css, pairs = COMPONENT_PAIRS) {
  const lightVars = parseThemeTokens(css, ":root");
  const darkVars = parseThemeTokens(css, "body.dark-mode");
  const results = [];

  for (const theme of ["light", "dark"]) {
    const vars = theme === "light" ? lightVars : darkVars;
    const over = tokenValue(vars, "--card", null) ?? "#ffffff";
    for (const pair of pairs) {
      if (!pair.themes.includes(theme)) continue;

      const fgDecl = findEffectiveValue(css, pair.fgSel, "color", theme);
      let fg =
        (fgDecl != null && resolveColor(fgDecl, vars, over)) ||
        tokenValue(vars, pair.fgFallback, over);

      const bgDecl =
        findEffectiveValue(css, pair.bgSel, "background", theme) ??
        findEffectiveValue(css, pair.bgSel, "background-color", theme);
      const bgColors =
        bgDecl != null ? resolveSurfaceColors(bgDecl, vars, over) : [];
      const fallbackBg = tokenValue(vars, pair.bgFallback, over);
      if (bgColors.length === 0 && fallbackBg) bgColors.push(fallbackBg);

      results.push({
        kind: "component",
        name: pair.name,
        theme,
        threshold: pair.threshold,
        fg,
        bg: bgColors[0] ?? null,
        bgColors,
        pair,
      });
    }
  }

  return results.map((r) => {
    if (r.fg && r.bgColors.length > 0) {
      // Text must pass against the worst (lowest-contrast) gradient stop.
      const ratios = r.bgColors.map((bg) => contrast(r.fg, bg));
      const ratio = Math.min(...ratios);
      return { ...r, ratio, pass: ratio >= r.threshold };
    }
    return { ...r, ratio: null, pass: null, manual: true };
  });
}

export function auditPairs(css, pairs = PAIRS) {
  const lightVars = parseThemeTokens(css, ":root");
  const darkVars = parseThemeTokens(css, "body.dark-mode");
  const results = [];

  for (const theme of ["light", "dark"]) {
    const vars = theme === "light" ? lightVars : darkVars;
    for (const pair of pairs) {
      if (!pair.themes.includes(theme)) continue;
      const fg = resolveColor(pair.fg.startsWith("#") ? pair.fg : vars[pair.fg], vars);
      const bg = resolveColor(pair.bg.startsWith("#") ? pair.bg : vars[pair.bg], vars);
      results.push({ kind: "token", name: pair.name, theme, threshold: pair.threshold, fg, bg, pair });
    }
  }

  return results.map((r) => {
    if (r.fg && r.bg) {
      const ratio = contrast(r.fg, r.bg);
      return { ...r, ratio, pass: ratio >= r.threshold };
    }
    return { ...r, ratio: null, pass: null, manual: true };
  });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function formatResults(results) {
  const lines = [];
  for (const r of results) {
    const theme = r.theme.padEnd(5);
    if (r.manual) {
      lines.push(`  MANUAL  ${theme}  ${r.name.padEnd(38)} fg=${r.fg ?? "unresolved"} bg=${r.bg ?? "unresolved"} (render review)`);
    } else {
      const status = r.pass ? "OK  " : "FAIL";
      lines.push(`  ${status}  ${theme}  ${r.name.padEnd(38)} ${r.ratio.toFixed(2)}:1  (need ${r.threshold}:1)`);
    }
  }
  return lines.join("\n");
}

export function runAudit(cssPath = CSS_PATH) {
  const css = readFileSync(cssPath, "utf8");
  const tokenResults = auditPairs(css);
  const componentResults = auditComponentPairs(css);
  const all = [...tokenResults, ...componentResults];

  console.log("Colour contrast audit — WCAG pairs (css/styles.css)\n");
  console.log("── token pairs ────────────────────────────────────────");
  console.log(formatResults(tokenResults));
  console.log("\n── component pairs (resolved surfaces) ─────────────────");
  console.log(formatResults(componentResults));

  const failures = all.filter((r) => r.pass === false);
  const manual = all.filter((r) => r.manual);
  const resolved = all.length - manual.length;
  console.log(
    `\n${resolved} resolved pairs · ${failures.length} failure(s) · ${manual.length} manual-review pair(s)`,
  );
  if (failures.length > 0) {
    console.error("\nFAIL: the following required colour pairs do not meet WCAG AA:");
    for (const f of failures) {
      console.error(`  - [${f.kind}] ${f.name} (${f.theme}): ${f.ratio.toFixed(2)}:1 < ${f.threshold}:1`);
    }
    return 1;
  }
  console.log("PASS: all resolvable required colour pairs meet WCAG AA.");
  return 0;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  process.exit(runAudit());
}