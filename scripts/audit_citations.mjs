#!/usr/bin/env node
// Citation resolution audit for all question banks (PSR / FR / PPA references).
//
// A question's citation must point at a provision that actually exists. For each
// bank, extract the numeric references its questions/explanations make and report
// any that do not resolve to a real provision in the relevant ground-truth source.
//
// Ground truth on disk (gitignored — this audit soft-skips without it):
//   .freebuff/psr_2021_full.txt  PSR 2021 (rules as "110208: - text")
//   .freebuff/ppa_act_2007.txt   Public Procurement Act 2007 (sections as "N. text")
//   .freebuff/fr_2009_full.txt   Financial Regulations 2009 (regulations as "209. text")
//
// Usage:
//   node scripts/audit_citations.mjs                 # all banks, report only
//   node scripts/audit_citations.mjs --strict        # exit 1 on unresolved citations
//   node scripts/audit_citations.mjs --bank psr_rules
import fs from "node:fs";
import path from "node:path";

const SKIP = new Set(["topics.json", "exam_templates.json", "gl_band_weights.json"]);
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const only = args.includes("--bank") ? args[args.indexOf("--bank") + 1] : null;

// ---------------- ground truth (graceful skip when absent) ----------------
const GT = [".freebuff/psr_2021_full.txt", ".freebuff/ppa_act_2007.txt", ".freebuff/fr_2009_full.txt"];
const missing = GT.filter((p) => !fs.existsSync(p));
if (missing.length) {
  console.log(`audit:citations SKIP — ground truth unavailable (${missing.join(", ")}).`);
  console.log("This audit needs the private gazette OCR extracts; it runs for real where they exist.");
  process.exit(0);
}

const psrTxt = fs.readFileSync(".freebuff/psr_2021_full.txt", "utf8");
const ppaTxt = fs.readFileSync(".freebuff/ppa_act_2007.txt", "utf8");
const frTxt = fs.readFileSync(".freebuff/fr_2009_full.txt", "utf8");

// PSR 2021 rule numbers: any 6-digit token at the head of a rule line ("110208: -")
const psrRules = new Set();
for (const m of psrTxt.matchAll(/^[ \t]*(\d{6})\s*[:\-]/gm)) psrRules.add(m[1]);
// also every 6-digit token anywhere (body/section headers the OCR split across lines)
const psrAny = new Set(psrTxt.match(/\b\d{6}\b/g) || []);

// PPA sections: "N. Title" lines, plus the arrangement-of-sections list
const ppaSections = new Set();
for (const m of ppaTxt.matchAll(/^[ \t]*(\d{1,2})\.\s+\S/gm)) ppaSections.add(m[1]);
for (const m of ppaTxt.matchAll(/\b(\d{1,2})\.\s+[A-Z][a-z]/g)) ppaSections.add(m[1]);

// FR regulations: OCR-tolerant. The terminator is usually "." or "·" but the OCR
// sometimes renders it as "*", which hid e.g. FR 1419 ("1419* The lack of any advice...").
const frRegs = new Set();
for (const m of frTxt.matchAll(/^[ \t]*(?:[^\d\s]{1,4}[ \t]+)?((?:\d[ \t]*){3,5})[.·*][ \t]*\S/gm)) frRegs.add(m[1].replace(/\s+/g, ""));
// Provisions whose margin numbers were eaten by the OCR, proved by unique body text:
if (frTxt.replace(/\s+/g, " ").includes("xhe Head of Internal Audit shall draw up detailed internal audit")) frRegs.add("1708");
if (frTxt.replace(/\s+/g, " ").includes("Certain financial matters of government are regulated by other laws")) frRegs.add("104");
if (frTxt.replace(/\s+/g, " ").includes("must be entered into the Vote Book as liabilities")) frRegs.add("423");

console.log(`ground truth: PSR rules=${psrRules.size} (any 6-digit=${psrAny.size}), PPA sections=${ppaSections.size}, FR regs=${frRegs.size}`);

// ---------------- scan banks ----------------
const banks = fs.readdirSync("data").filter((f) => f.endsWith(".json") && !SKIP.has(f)).map((f) => f.replace(/\.json$/, "")).sort();
let unresolvedTotal = 0;

for (const base of banks) {
  if (only && base !== only) continue;

  const bank = JSON.parse(fs.readFileSync(path.join("data", base + ".json"), "utf8"));
  if (!bank.subcategories) continue;
  const qs = [];
  for (const sc of bank.subcategories || []) for (const q of sc.questions || []) qs.push(q);

  const psrCites = new Map(), frCites = new Map(), ppaCites = new Map();

  // Strip markdown emphasis first: many stems write "**PSR** 130104", and a naive
  // /\b(?:PSR|Rule)\s*(\d{6})/ cannot see through the closing asterisks, which hides
  // whole subcategories of unresolvable citations from the audit.
  const demd = (s) => s.replace(/\*\*|__|`/g, "");

  for (const q of qs) {
    const texts = [demd(q.question || ""), demd(q.explanation || "")];
    for (const t of texts) {
      for (const m of t.matchAll(/\b(?:PSR|Rule|rules?)\s*(\d{6})\b/gi))
        push(psrCites, m[1], q.id);
      for (const m of t.matchAll(/\b(?:FR|Financial\s+Regulations?)\s*(\d{3,4})\b/gi))
        push(frCites, m[1], q.id);
      for (const m of t.matchAll(/\b(?:Section|Sec\.?|S)\s*(\d{1,2})\b/g))
        push(ppaCites, m[1], q.id);
    }
  }

  console.log(`\n===== ${base} =====`);
  unresolvedTotal += report("PSR rule", psrCites, (n) => psrRules.has(n) || psrAny.has(n));
  unresolvedTotal += report("FR reg", frCites, (n) => frRegs.has(n));
  if (base === "public_procurement") unresolvedTotal += report("PPA section", ppaCites, (n) => ppaSections.has(n));
}

function push(map, key, id) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(id);
}
function report(label, map, isReal) {
  const nums = [...map.keys()].sort((a, b) => Number(a) - Number(b));
  const dead = nums.filter((n) => !isReal(n));
  console.log(`  ${label}: ${nums.length} unique cited, ${dead.length} unresolved`);
  for (const n of dead) {
    const ids = [...new Set(map.get(n))];
    console.log(`     ${n} -> ${ids.length} ref(s): ${ids.slice(0, 5).join(", ")}`);
  }
  return dead.length;
}

console.log(`\nTOTAL unresolved citations: ${unresolvedTotal}`);
if (strict && unresolvedTotal > 0) process.exit(1);
