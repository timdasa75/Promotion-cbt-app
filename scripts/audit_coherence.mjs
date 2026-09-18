#!/usr/bin/env node
// Citation COHERENCE audit for all banks with PSR/FR citations.
//
// A citation can resolve and still be wrong. For each question that cites a PSR rule
// (6-digit) or FR regulation (3-4 digit), compare the cited provision's real text with
// the question's keyed answer + explanation. Overlap is measured as distinct meaningful
// words shared. PSR wins when both are cited (more specific provision text).
//
// Ground truth on disk (gitignored — this audit soft-skips without it):
//   .freebuff/psr_2021_full.txt  rules as "110208: - text"
//   .freebuff/fr_2009_full.txt   regulations as "209. text" (OCR-tolerant parser)
//
// Usage:
//   node scripts/audit_coherence.mjs                          # all banks
//   node scripts/audit_coherence.mjs psr_rules general_current_affairs
//   node scripts/audit_coherence.mjs --weak psr_rules         # list weak+moderate questions
//   node scripts/audit_coherence.mjs --strict                 # exit 1 on weak findings
import fs from "node:fs";

const args = process.argv.slice(2);
const weakOnly = args.includes("--weak");
const strict = args.includes("--strict");
const subs = args.filter((a) => !a.startsWith("--"));
const DEFAULT_BANKS = [
  "psr_rules", "financial_regulations", "public_procurement", "civil_service_ethics",
  "constitutional_foi", "core_competencies", "general_current_affairs", "ict_digital",
  "leadership_negotiation", "policy_analysis",
];
const BANKS = subs.length ? subs : DEFAULT_BANKS;

// Ground truth (graceful skip when absent)
for (const p of [".freebuff/psr_2021_full.txt", ".freebuff/fr_2009_full.txt"]) {
  if (!fs.existsSync(p)) {
    console.log("audit:coherence SKIP — ground truth unavailable (.freebuff/psr_2021_full.txt, .freebuff/fr_2009_full.txt).");
    console.log("This audit needs the private gazette OCR extracts; it runs for real where they exist.");
    process.exit(0);
  }
}

const STOP = new Set(("the a an and or of to in for on by with is are was were be been shall must may will would " +
  "that this these those it its as at from not no any all such his her their there which who whom whose what when " +
  "where how than then so if but under rule psr officer officers service public government federal section " +
  "regulation regulations following which of the according").split(" "));

const words = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w));
const demd = (s) => String(s || "").replace(/\*\*|__|`/g, "");

// ---------------- ground truth: PSR ----------------
const psrFlat = fs.readFileSync(".freebuff/psr_2021_full.txt", "utf8").replace(/\s+/g, " ");
const psrBody = new Map();
{
  let marks = [];
  for (const m of psrFlat.matchAll(/(\d{6})\s*[:.\-–—]/g)) marks.push({ rule: m[1], at: m.index });
  // Inline cross-references (e.g. "…Rule 040205 and 040206. In deciding…") match
  // the marker regex and truncate the enclosing provision's body. Drop marks
  // that sit mid-sentence right after a coordinating conjunction or the word
  // "Rule" — genuine headers never do.
  marks = marks.filter((m) => {
    const before = psrFlat.slice(Math.max(0, m.at - 12), m.at);
    return !/\b(?:and|or)\s+$/i.test(before) && !/\brules?\s+$/i.test(before);
  });
  for (let i = 0; i < marks.length; i++) {
    if (psrBody.has(marks[i].rule)) continue;
    // Full provision body: from the rule marker to the next marker (no arbitrary cap —
    // a 1200-char window hid deep clauses like FR 123(i)(p) and skewed scores).
    const end = i + 1 < marks.length ? marks[i + 1].at : psrFlat.length;
    psrBody.set(marks[i].rule, psrFlat.slice(marks[i].at, end));
  }
}

// ---------------- ground truth: FR (OCR-tolerant) ----------------
const frTxt = fs.readFileSync(".freebuff/fr_2009_full.txt", "utf8");
const frBody = new Map();
{
  const marks = [];
  for (const m of frTxt.matchAll(/(?:^|[\n\r])[ \t]*(?:[^\d\s]{1,4}[ \t]+)?((?:\d[ \t]*){3,5})[.·*][ \t]*/g))
    marks.push({ reg: m[1].replace(/\s+/g, ""), at: m.index + m[0].length });
  for (let i = 0; i < marks.length; i++) {
    if (frBody.has(marks[i].reg)) continue;
    const end = i + 1 < marks.length ? marks[i + 1].at : frTxt.length;
    frBody.set(marks[i].reg, frTxt.slice(marks[i].at, end).replace(/\s+/g, " "));
  }
}

// FR 104 lost its margin number to the OCR ("104." rendered as "KM.");
// proved by unique body text (same method as FR 1708/423 in audit_citations.mjs).
{
  const frFlat = frTxt.replace(/\s+/g, " ");
  const at = frFlat.indexOf("Certain financial matters of government are regulated by other laws");
  if (at !== -1) frBody.set("104", frFlat.slice(at, at + 600));
}

console.log(`ground truth: PSR rules=${psrBody.size}, FR regs=${frBody.size}\n`);

function coherence(q) {
  const stem = demd(q.question), expl = demd(q.explanation);
  const psrNums = new Set(), frNums = new Set();
  for (const t of [stem, expl]) {
    for (const m of t.matchAll(/\b(?:PSR|Rule|rules?)\s*(\d{6})\b/gi)) psrNums.add(m[1]);
    for (const m of t.matchAll(/\b(?:FR|Financial\s+Regulations?)\s*(\d{3,4})\b/gi)) frNums.add(m[1]);
  }
  const target = new Set(words((q.options || [])[q.correct] + " " + expl));
  const score = (text) => {
    if (!text) return null;
    const bw = new Set(words(text));
    let shared = 0;
    for (const w of bw) if (target.has(w)) shared++;
    return shared;
  };
  let best = null, bestCite = null;
  for (const n of psrNums) {
    const s = score(psrBody.get(n));
    if (s !== null && (best === null || s > best)) { best = s; bestCite = "PSR " + n; }
  }
  if (best === null) for (const n of frNums) {
    const s = score(frBody.get(n));
    if (s !== null && (best === null || s > best)) { best = s; bestCite = "FR " + n; }
  }
  return { psr: [...psrNums], fr: [...frNums], best, bestCite };
}

let weakTotal = 0;
for (const bankName of BANKS) {
  const path = `data/${bankName}.json`;
  if (!fs.existsSync(path)) { console.log(`${bankName}: no such bank (skipped)`); continue; }
  const bank = JSON.parse(fs.readFileSync(path, "utf8"));
  const rows = [];
  for (const sc of bank.subcategories || []) {
    if (!Array.isArray(sc.questions)) continue;
    for (const q of sc.questions) {
      if (!q || typeof q.question !== "string") continue;
      const c = coherence(q);
      if (c.best === null) continue; // cites nothing we can ground
      rows.push({ sub: sc.id, id: q.id, ...c });
    }
  }
  const weak = rows.filter((r) => r.best < 1);
  const moderate = rows.filter((r) => r.best >= 1 && r.best <= 2);
  const avg = rows.length ? (rows.reduce((a, r) => a + r.best, 0) / rows.length).toFixed(2) : "-";
  console.log(`===== ${bankName} =====`);
  console.log(`  grounded=${rows.length} weak(<1 shared word)=${weak.length} moderate(1-2)=${moderate.length} avg=${avg}`);
  weakTotal += weak.length;
  const list = weakOnly ? [...weak, ...moderate] : weak.slice(0, 10);
  for (const r of list)
    console.log(`   ${r.best < 1 ? "WEAK" : "MOD "} ${r.id} (${r.sub}) cites=${[...r.psr, ...r.fr].join(",")} best=${r.best} via ${r.bestCite}`);
  if (weakOnly && weak.length + moderate.length > 10 && weak.length > 10) console.log(`   … and ${weak.length - 10} more weak`);
  console.log();
}

if (strict) {
  console.log(weakTotal ? `FAIL: ${weakTotal} weak-coherence findings` : "PASS: 0 weak-coherence findings");
  if (weakTotal) process.exit(1);
}
