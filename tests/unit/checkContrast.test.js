// Unit tests for the WCAG colour contrast audit (scripts/check-contrast.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  contrast,
  relativeLuminance,
  parseThemeTokens,
  resolveColor,
  auditPairs,
  runAudit,
} from "../../scripts/check-contrast.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CSS_PATH = path.join(ROOT, "css", "styles.css");

test("contrast math matches WCAG reference values", () => {
  // WCAG 1.4.3 worked examples: pure black vs pure white = 21:1.
  assert.equal(contrast("#ffffff", "#000000"), 21);
  assert.equal(contrast("#000000", "#ffffff"), 21);
  // Known pair: #767676 on #ffffff ≈ 4.54:1 (WCAG 3:1 / 4.5:1 boundary examples).
  const ratio = contrast("#767676", "#ffffff");
  assert.ok(ratio > 4.5 && ratio < 4.6, `expected ≈4.54:1, got ${ratio}`);
  // Relative luminance of white is 1 and black is 0.
  assert.equal(relativeLuminance("#ffffff"), 1);
  assert.equal(relativeLuminance("#000000"), 0);
});

test("token parsing separates light and dark themes with last-definition-wins", () => {
  const css = readFileSync(CSS_PATH, "utf8");
  const light = parseThemeTokens(css, ":root");
  const dark = parseThemeTokens(css, "body.dark-mode");

  assert.equal(light["--card"], "#FFFFFF");
  // The dark block redefines --card twice; the later value must win.
  assert.equal(dark["--card"], "#161b22");
  assert.notEqual(light["--surface"], dark["--surface"]);
});

test("resolveColor handles hex, var references, and falls back to null for alpha mixes", () => {
  const vars = {
    "--primary": "#064E3B",
    "--green-900": "var(--primary)",
    "--blend": "rgba(6, 78, 59, 0.12)",
  };
  assert.equal(resolveColor("#0F172A", vars), "#0f172a");
  assert.equal(resolveColor("var(--primary)", vars), "#064e3b");
  assert.equal(resolveColor("var(--green-900)", vars), "#064e3b");
  assert.equal(resolveColor("var(--green-900, #123456)", vars), "#064e3b");
  assert.equal(resolveColor("var(--missing, #abcdef)", vars), "#abcdef");
  assert.equal(resolveColor("rgb(6, 78, 59)", vars), "#064e3b");
  assert.equal(resolveColor(vars["--blend"], vars), null);
  assert.equal(resolveColor("color-mix(in srgb, red 50%, blue)", vars), null);
});

test("the current stylesheet passes the full required-pair audit (release gate)", () => {
  const css = readFileSync(CSS_PATH, "utf8");
  const results = auditPairs(css);
  const failures = results.filter((r) => r.pass === false);
  assert.deepEqual(
    failures.map((f) => `${f.name} (${f.theme}): ${f.ratio.toFixed(2)}:1`),
    [],
    "required colour pairs must meet WCAG AA in both themes",
  );
});

test("runAudit exits 0 on the current stylesheet", () => {
  assert.equal(runAudit(CSS_PATH), 0);
});