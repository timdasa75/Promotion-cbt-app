#!/usr/bin/env node
/**
 * Question bank audit — categorization consistency + grammar/construction.
 *
 * Scans every question in data/*.json and reports:
 *
 *   Categorization (deterministic, high-precision):
 *     - sourceTopicId present but not the canonical topic id for the file
 *     - sourceSubcategoryId present but not the subcategory it actually lives in
 *     - sourceSubcategoryName present but not the subcategory name
 *     - duplicate question ids within a bank
 *     - subcategory placement vs topics.json (structural taxonomy)
 *
 *   Grammar / construction:
 *     - truncated stems (e.g. a bare "Which of the following?")
 *     - missing terminal punctuation, lowercase stem starts
 *     - whitespace issues (double spaces, leading/trailing)
 *     - repeated function words ("the the", "of of")
 *     - option problems (count, empty, duplicates, embedded A./1. prefixes,
 *       question marks inside options, inconsistent terminal punctuation)
 *     - mojibake / control characters / markdown markers in text fields
 *     - invalid correct index, missing options/correct/explanation
 *
 * Usage:
 *   node scripts/audit_questions.mjs                  # summary + samples
 *   node scripts/audit_questions.mjs --json           # also write docs/question_audit_report.json
 *   node scripts/audit_questions.mjs --bank psr       # one bank only (file base name)
 *   node scripts/audit_questions.mjs --fail-on-findings  # exit 1 on any error-severity finding
 *   node scripts/audit_questions.mjs --limit 5        # cap samples per check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const TOPICS_FILE = path.join(DATA_DIR, "topics.json");
const OUT_JSON = path.join(ROOT_DIR, "docs", "question_audit_report.json");

const args = new Set(process.argv.slice(2));
const writeJson = args.has("--json");
const failOnFindings = args.has("--fail-on-findings");
const bankArgIndex = process.argv.indexOf("--bank");
const requestedBank = bankArgIndex >= 0 ? process.argv[bankArgIndex + 1] : "";
const limitArgIndex = process.argv.indexOf("--limit");
const sampleLimit = limitArgIndex >= 0 ? parseInt(process.argv[limitArgIndex + 1], 10) || 5 : 8;

const MOJIBAKE_MARKERS = /[ÃÂðŸ�]/;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const DOUBLE_SPACE = /[^\S\n]{2,}/;
const MARKDOWN_MARKERS = /(\*\*|\*[^*\n]+\*|__[^_\n]+__)/; // emphasis only; ___ fill-in blanks are not markdown
const TERMINAL_PUNCT = new Set(["?", ".", "!", ":", "”", '"', "…", "…", "'"]);

// Function words where an accidental repeat ("the the") is almost certainly a typo.
const REPEAT_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
  "is", "it", "its", "may", "must", "no", "not", "of", "on", "or", "shall",
  "should", "that", "the", "their", "this", "to", "was", "were", "what",
  "which", "who", "will", "with", "would", "than", "into", "can", "do",
  "does", "did", "has", "have", "had", "his", "her", "per", "per", "one",
]);

const BANK_FILES = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !["topics.json", "exam_templates.json", "gl_band_weights.json"].includes(f))
  .sort();

// ---- load canonical taxonomy ----
const topicsPayload = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
const topics = topicsPayload.topics || topicsPayload;
const FILE_TO_TOPIC = new Map();
const FILE_SUBCATEGORIES = new Map(); // file -> Map(subId -> name)
for (const topic of topics) {
  const file = String(topic.file || "").replace(/^data[\\/]/, "").replace(".json", "");
  if (!file) continue;
  FILE_TO_TOPIC.set(file, String(topic.id || ""));
  FILE_SUBCATEGORIES.set(
    file,
    new Map((topic.subcategories || []).map((s) => [String(s.id), String(s.name || "")]))
  );
}

// ---- helpers ----
function loadBank(file) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw);
}

function getSubcategories(payload) {
  if (payload && typeof payload === "object" && Array.isArray(payload.subcategories)) {
    return payload.subcategories;
  }
  if (payload && typeof payload === "object" && payload.subcategories && typeof payload.subcategories === "object") {
    return Object.values(payload.subcategories);
  }
  if (payload && typeof payload === "object" && payload.domains && Array.isArray(payload.domains)) {
    return payload.domains.flatMap((d) => (d && Array.isArray(d.topics) ? d.topics : []));
  }
  return [];
}

// Mirrors js/topicDataShape.js getQuestionsFromSubcategory: unwraps the legacy
// ca_general wrapper `questions: [{ ca_general: [...] }]`.
function getQuestions(sub) {
  if (!sub || !Array.isArray(sub.questions)) return [];
  if (
    sub.id === "ca_general" &&
    sub.questions.length > 0 &&
    Array.isArray(sub.questions[0] && sub.questions[0].ca_general)
  ) {
    return sub.questions[0].ca_general;
  }
  // generic fallback: any subcategory whose questions[0] is a bare wrapper dict
  const first = sub.questions[0];
  if (
    first &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    first.id === undefined &&
    Object.values(first).some(Array.isArray)
  ) {
    return Object.values(first).flatMap((v) => (Array.isArray(v) ? v : []));
  }
  return sub.questions;
}

function norm(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function textFields(q) {
  return [q.question, ...(Array.isArray(q.options) ? q.options : []), q.explanation].filter(
    (v) => typeof v === "string"
  );
}

function stripLeadingNoise(s) {
  return String(s || "").replace(/^[\s*_\-–—()\[\]"'.,:;]+/, "");
}

function stripTrailingNoise(s) {
  return String(s || "").replace(/[\s*_\-–—()\[\]"'.,:;]+$/, "");
}

// ---- audit ----
const findings = []; // { bank, subcategory, id, check, severity, detail, question }
const counts = new Map();

function addFinding(bank, sub, q, check, severity, detail) {
  counts.set(check, (counts.get(check) || 0) + 1);
  findings.push({
    bank,
    subcategory: sub,
    id: q && q.id,
    check,
    severity,
    detail,
    question: q && typeof q.question === "string" ? q.question.slice(0, 160) : "",
  });
}

const LETTERS = ["a", "b", "c", "d"];

function auditBank(file) {
  const payload = loadBank(file);
  const bankName = file.replace(".json", "");
  const canonicalTopicId = FILE_TO_TOPIC.get(bankName) || "";
  const canonicalSubs = FILE_SUBCATEGORIES.get(bankName) || new Map();
  const subs = getSubcategories(payload);

  // per-bank answer-order stats (positions, runs, distractor length tell)
  const posCounts = { a: 0, b: 0, c: 0, d: 0 };
  let validCount = 0;
  let correctLongest = 0;
  const seq = [];

  // structural: subcategory placement vs topics.json
  for (const s of subs) {
    const sId = String(s.id || "");
    if (sId && canonicalSubs.size && !canonicalSubs.has(sId)) {
      addFinding(bankName, s.name || sId, null, "orphan_subcategory", "error",
        `subcategory '${sId}' not defined in topics.json for ${bankName}`);
    }
  }

  const seenIds = new Set();
  for (const s of subs) {
    const subName = s.name || String(s.id || "");
    const subId = String(s.id || "");
    const questions = getQuestions(s);
    for (const q of questions) {
      if (!q || typeof q !== "object") continue;

      // ---- categorization ----
      if (q.id !== undefined && q.id !== null && String(q.id)) {
        const idKey = String(q.id);
        if (seenIds.has(idKey)) {
          addFinding(bankName, subName, q, "duplicate_question_id", "error",
            `duplicate id '${idKey}' within ${bankName}`);
        }
        seenIds.add(idKey);
      }

      if (q.sourceTopicId !== undefined && q.sourceTopicId !== null && String(q.sourceTopicId).trim() !== "") {
        const v = norm(q.sourceTopicId);
        if (canonicalTopicId && v !== canonicalTopicId) {
          addFinding(bankName, subName, q, "source_topic_id_mismatch", "error",
            `sourceTopicId='${q.sourceTopicId}' but bank ${bankName} is canonical topic '${canonicalTopicId}'`);
        }
      }

      if (q.sourceSubcategoryId !== undefined && q.sourceSubcategoryId !== null && String(q.sourceSubcategoryId).trim() !== "") {
        const v = norm(q.sourceSubcategoryId);
        if (subId && v !== norm(subId)) {
          addFinding(bankName, subName, q, "source_subcategory_id_mismatch", "error",
            `sourceSubcategoryId='${q.sourceSubcategoryId}' but question lives in subcategory '${subId}'`);
        }
      }

      if (q.sourceSubcategoryName !== undefined && q.sourceSubcategoryName !== null && String(q.sourceSubcategoryName).trim() !== "") {
        const v = norm(q.sourceSubcategoryName);
        if (subName && v !== norm(subName)) {
          addFinding(bankName, subName, q, "source_subcategory_name_mismatch", "error",
            `sourceSubcategoryName='${q.sourceSubcategoryName}' but question lives in '${subName}'`);
        }
      }

      // ---- grammar / construction ----
      const stem = typeof q.question === "string" ? q.question : "";
      if (!stem) {
        addFinding(bankName, subName, q, "missing_question_text", "error", "question field is empty/missing");
        continue;
      }
      const trimmed = stem.trim();

      // truncated stems — a bare fragment like "Which of the following?"
      if (/^which of the following\??$/i.test(trimmed) || (trimmed.length < 18 && !trimmed.endsWith("?"))) {
        addFinding(bankName, subName, q, "truncated_or_short_stem", "error",
          `stem is only ${trimmed.length} chars: "${trimmed}"`);
      }

      const lastChar = trimmed[trimmed.length - 1];
      if (!TERMINAL_PUNCT.has(lastChar)) {
        addFinding(bankName, subName, q, "missing_terminal_punct", "warn",
          `stem does not end with terminal punctuation: "...${trimmed.slice(-40)}"`);
      }

      const firstReal = stripLeadingNoise(trimmed)[0];
      if (firstReal && /[a-z]/.test(firstReal)) {
        addFinding(bankName, subName, q, "lowercase_stem_start", "warn",
          `stem starts lowercase: "${trimmed.slice(0, 60)}"`);
      }

      if (trimmed !== trimmed.trim()) {
        addFinding(bankName, subName, q, "leading_trailing_whitespace", "warn", "stem has leading/trailing whitespace");
      }
      if (DOUBLE_SPACE.test(stem)) {
        addFinding(bankName, subName, q, "double_space", "warn", `double space in stem: "${stem.slice(0, 80)}"`);
      }

      const words = trimmed.split(/\s+/);
      for (let i = 1; i < words.length; i++) {
        if (REPEAT_WORDS.has(words[i].toLowerCase()) && words[i].toLowerCase() === words[i - 1].toLowerCase()) {
          addFinding(bankName, subName, q, "repeated_word", "warn",
            `repeated word "${words[i]}" in stem: "${trimmed.slice(0, 90)}"`);
          break;
        }
      }

      // ---- options ----
      const opts = Array.isArray(q.options) ? q.options : [];
      if (!opts.length) {
        addFinding(bankName, subName, q, "missing_options", "error", "no options array");
      } else {
        if (opts.length < 2 || opts.length > 6) {
          addFinding(bankName, subName, q, "option_count", "warn", `unusual option count: ${opts.length}`);
        }
        const seenOpts = new Set();
        for (let i = 0; i < opts.length; i++) {
          const o = opts[i];
          if (typeof o !== "string" || o.trim() === "") {
            addFinding(bankName, subName, q, "empty_option", "error", `option ${i + 1} is empty`);
            continue;
          }
          const ot = o.trim();
          if (/^(?:\(?[a-zA-Z]\)|\(?[a-zA-Z]\.|\d+[.)])\s+/.test(ot)) {
            addFinding(bankName, subName, q, "option_embedded_prefix", "warn",
              `option ${i + 1} embeds its own letter/number prefix: "${ot.slice(0, 50)}"`);
          }
          if (ot.includes("?")) {
            addFinding(bankName, subName, q, "option_question_mark", "warn",
              `option ${i + 1} contains '?': "${ot.slice(0, 60)}"`);
          }
          if (ot !== o) {
            addFinding(bankName, subName, q, "option_whitespace", "warn", `option ${i + 1} has leading/trailing whitespace`);
          }
          const nk = norm(ot);
          if (seenOpts.has(nk)) {
            addFinding(bankName, subName, q, "duplicate_option", "error", `options ${i + 1} duplicates an earlier option`);
          }
          seenOpts.add(nk);
        }
        // inconsistent terminal punctuation across options
        if (opts.length >= 4) {
          const endsWithDot = opts.filter((o) => typeof o === "string" && /\.$/.test(o.trim())).length;
          const bare = opts.filter((o) => typeof o === "string" && o.trim() && !/[.?!:]$/.test(o.trim())).length;
          if (endsWithDot >= 2 && bare >= 2) {
            addFinding(bankName, subName, q, "option_punct_mixed", "info",
              `options mix '.'-terminated (${endsWithDot}) and bare (${bare}) endings`);
          }
        }
      }

      // correct index
      if (!opts.length || q.correct === undefined || q.correct === null ||
          typeof q.correct !== "number" || q.correct < 0 || q.correct >= opts.length) {
        addFinding(bankName, subName, q, "invalid_correct", "error",
          `correct=${q.correct} with ${opts.length} options`);
      }

      // ---- answer-order quality (positions, runs, length tell) ----
      if (opts.length >= 3 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < opts.length) {
        validCount++;
        const letter = LETTERS[q.correct] || "?";
        if (posCounts[letter] !== undefined) posCounts[letter]++;
        seq.push(letter);
        const lens = opts.map((o) => (typeof o === "string" ? o.length : 0));
        if (lens[q.correct] === Math.max(...lens)) correctLongest++;
        for (let i = 0; i < opts.length; i++) {
          if (i !== q.correct && typeof opts[i] === "string" && opts[i].length <= 8 && lens[q.correct] >= 25) {
            addFinding(bankName, subName, q, "short_distractor", "warn",
              `option ${i + 1} is only ${opts[i].length} chars ("${opts[i]}") vs ${lens[q.correct]}-char correct answer`);
            break;
          }
        }
      }

      // explanations
      if (q.explanation === undefined || q.explanation === null || String(q.explanation).trim() === "") {
        addFinding(bankName, subName, q, "missing_explanation", "info", "no explanation");
      }

      // encoding / control chars / markdown across all text fields
      for (const field of ["question", "options", "explanation"]) {
        const vals = field === "options" ? opts : [q[field]];
        for (const v of vals) {
          if (typeof v !== "string") continue;
          if (MOJIBAKE_MARKERS.test(v)) {
            addFinding(bankName, subName, q, "mojibake", "error", `${field} contains mojibake: "${v.slice(0, 60)}"`);
            break;
          }
          if (CONTROL_CHARS.test(v)) {
            addFinding(bankName, subName, q, "control_chars", "error", `${field} contains control characters`);
            break;
          }
        }
      }
      if (MARKDOWN_MARKERS.test(trimmed) || opts.some((o) => typeof o === "string" && MARKDOWN_MARKERS.test(o))) {
        addFinding(bankName, subName, q, "markdown_markers", "info",
          `markdown markers (**/__/*) in question or options: "${trimmed.slice(0, 70)}"`);
      }
    }
  }

  // ---- per-bank answer-order summary ----
  if (validCount >= 20) {
    // Position distribution: flag only when a position deviates from 25% by
    // more than ~3.5 sigma for this bank's size (a random shuffle is expected
    // to land within a few points; the old data sat 10-25 points off).
    const sigmaPct = Math.sqrt((0.25 * 0.75) / validCount) * 100;
    for (const letter of LETTERS) {
      const pct = (posCounts[letter] / validCount) * 100;
      if (Math.abs(pct - 25) > 3.5 * sigmaPct) {
        addFinding(bankName, "summary", null, "answer_position_bias", "warn",
          `answer '${letter}' appears ${posCounts[letter]}/${validCount} (${pct.toFixed(1)}%) — ${(Math.abs(pct - 25) / sigmaPct).toFixed(1)} sigma from 25%`);
      }
    }
    // Runs: a random 4-way sequence of this length has longest runs of ~6-8;
    // only flag pathological runs (the old data had 23-50 in a row).
    let runStart = 0;
    for (let i = 1; i <= seq.length; i++) {
      if (i === seq.length || seq[i] !== seq[runStart]) {
        if (i - runStart >= 10) {
          addFinding(bankName, "summary", null, "answer_run", "warn",
            `run of ${i - runStart} consecutive '${seq[runStart]}' answers in file order (starting at question ${runStart + 1})`);
        }
        runStart = i;
      }
    }
    const longestPct = (correctLongest / validCount) * 100;
    addFinding(bankName, "summary", null, "correct_longest_ratio", "info",
      `correct option is the longest in ${correctLongest}/${validCount} (${longestPct.toFixed(1)}%)`);
  }
}

// ---- run ----
for (const file of BANK_FILES) {
  const bankName = file.replace(".json", "");
  if (requestedBank && bankName !== requestedBank) continue;
  auditBank(file);
}

// ---- scan count uses the same unwrapping as the audit itself ----
function countBankQuestions(file) {
  const payload = loadBank(file);
  let n = 0;
  for (const s of getSubcategories(payload)) n += getQuestions(s).length;
  return n;
}

// ---- report ----
const byCheck = new Map();
for (const f of findings) {
  if (!byCheck.has(f.check)) byCheck.set(f.check, []);
  byCheck.get(f.check).push(f);
}

const severityOrder = { error: 0, warn: 1, info: 2 };
const sortedChecks = [...byCheck.entries()].sort(
  (a, b) => severityOrder[a[1][0].severity] - severityOrder[b[1][0].severity] || b[1].length - a[1].length
);

console.log("Question bank audit — categorization & grammar/construction\n");
let scanned = 0;
for (const file of BANK_FILES) {
  if (requestedBank && file.replace(".json", "") !== requestedBank) continue;
  scanned += countBankQuestions(file);
}
console.log(`Scanned: ${scanned} questions across ${requestedBank ? 1 : BANK_FILES.length} bank(s)`);

const errTotal = findings.filter((f) => f.severity === "error").length;
const warnTotal = findings.filter((f) => f.severity === "warn").length;
const infoTotal = findings.filter((f) => f.severity === "info").length;
console.log(`Findings: ${findings.length} total (${errTotal} error, ${warnTotal} warn, ${infoTotal} info)\n`);

for (const [check, items] of sortedChecks) {
  console.log(`[${items[0].severity.toUpperCase()}] ${check} — ${items.length}`);
  for (const it of items.slice(0, sampleLimit)) {
    const where = `${it.bank}/${it.id || it.subcategory}`;
    console.log(`    ${where}: ${(it.detail || "").slice(0, 110)}`);
  }
  if (items.length > sampleLimit) console.log(`    … and ${items.length - sampleLimit} more`);
  console.log("");
}

if (writeJson) {
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    scannedQuestions: scanned,
    totals: { findings: findings.length, error: errTotal, warn: warnTotal, info: infoTotal },
    byCheck: Object.fromEntries(
      [...byCheck.entries()].map(([k, v]) => [k, { count: v.length, severity: v[0].severity }])
    ),
    findings,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");
  console.log(`JSON report: ${OUT_JSON}`);
}

if (failOnFindings && errTotal > 0) {
  console.error(`\n${errTotal} error-severity finding(s) — failing (--fail-on-findings)`);
  process.exit(1);
}
