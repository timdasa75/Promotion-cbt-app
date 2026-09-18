#!/usr/bin/env node
// Half-fixed question sweep.
//
// Signature of a half-applied text-replacement fix: the stem cites provision X
// while the explanation cites only provision Y (X != Y) — one half of the
// question was re-grounded and the other skipped on an exact-match miss.
//
// Also reports explanation-only citations (elaboration — usually fine, listed
// for eyes) and low lexical overlap between stem+options and explanation.
//
// Usage:
//   node scripts/audit_half_fixed.mjs                # all banks
//   node scripts/audit_half_fixed.mjs psr_rules      # single bank
//   node scripts/audit_half_fixed.mjs --strict       # exit 1 on unexpected disjoint citations
import fs from "node:fs";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const subs = args.filter((a) => !a.startsWith("--"));
const DEFAULT_BANKS = [
  "psr_rules", "financial_regulations", "public_procurement", "civil_service_ethics",
  "constitutional_foi", "core_competencies", "general_current_affairs", "ict_digital",
  "leadership_negotiation", "policy_analysis",
];
const BANKS = subs.length ? subs : DEFAULT_BANKS;

const STOP = new Set(
  ("a an and are as at be been being but by can cannot could did do does for from had has have how if in into is it its may might must of on or shall should so than that the their them then there these they this those to under was were what when where which who whom whose will with within without would you your not no nor non per via etc".split(
    " "
  ))
);

const demd = (s) => String(s || "").replace(/\*\*/g, "").replace(/__/g, "");
const words = (s) =>
  demd(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

// Citations: PSR 6-digit, FR 3-4 digit, PPA/FR section refs, CFN sections.
function citations(text) {
  const t = demd(text);
  const out = new Set();
  for (const m of t.matchAll(/\b(?:PSR|Rule)\s*(\d{6})/gi)) out.add(`PSR ${m[1]}`);
  for (const m of t.matchAll(/\bFR\s*(\d{3,4})\b/gi)) out.add(`FR ${m[1]}`);
  for (const m of t.matchAll(/\b(?:Section|S\.?)\s*(\d{1,3})\s*\(?[a-z0-9()]*\)?\s*(?:of\s+the\s+)?(?:PPA|Act|Constitution)?/gi)) {
    if (/PPA|Act|Constitution/i.test(t)) out.add(`SEC ${m[1]}`);
  }
  return out;
}

// Disjoint findings that were individually verified against the Gazette and are
// correct as written: the stem cites the prohibition rule, the explanation the
// sanction rule (PSR 020211 secret societies → 020212 contravention = serious misconduct).
const DISJOINT_EXCEPTIONS = new Set(["csh_disc_017"]);

const report = {};
let unexpectedDisjoint = 0;

for (const bankName of BANKS) {
  const file = `data/${bankName}.json`;
  if (!fs.existsSync(file)) { console.log(`${bankName}: no such bank (skipped)`); continue; }
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const findings = [];

  for (const sub of parsed.subcategories || []) {
    for (const q of sub.questions || []) {
      if (!q || typeof q !== "object" || !q.question) continue;
      const stemCites = citations(q.question);
      const explCites = citations(q.explanation);
      if (!stemCites.size && !explCites.size) continue;

      // Disjoint citations: stem cites X, explanation cites Y, X∩Y=∅.
      if (stemCites.size && explCites.size) {
        const disjoint = [...stemCites].every((c) => !explCites.has(c));
        if (disjoint) {
          findings.push({
            id: q.id,
            sub: sub.id,
            kind: "disjoint_citation",
            stem: [...stemCites].join(", "),
            expl: [...explCites].join(", "),
            stemText: demd(q.question).slice(0, 90),
          });
          if (!DISJOINT_EXCEPTIONS.has(q.id)) unexpectedDisjoint++;
          continue;
        }
      }
      // Explanation-only citations (elaboration — usually fine, list for eyes).
      if (!stemCites.size && explCites.size) {
        findings.push({
          id: q.id,
          sub: sub.id,
          kind: "expl_only_citation",
          expl: [...explCites].join(", "),
          stemText: demd(q.question).slice(0, 90),
        });
        continue;
      }
      // Low lexical overlap between stem+options and explanation.
      const stemWords = new Set([...words(q.question), ...(q.options || []).flatMap(words)]);
      const explWords = words(q.explanation);
      if (stemWords.size && explWords.length) {
        const overlap = explWords.filter((w) => stemWords.has(w)).length;
        const ratio = overlap / explWords.length;
        if (ratio < 0.12) {
          findings.push({
            id: q.id,
            sub: sub.id,
            kind: "low_overlap",
            ratio: ratio.toFixed(2),
            stemText: demd(q.question).slice(0, 90),
          });
        }
      }
    }
  }
  if (findings.length) report[bankName] = findings;
}

for (const [bank, findings] of Object.entries(report)) {
  const byKind = {};
  for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
  console.log(`\n=== ${bank}: ${findings.length} findings (${JSON.stringify(byKind)}) ===`);
  for (const f of findings) {
    if (f.kind === "disjoint_citation") {
      console.log(`  [DISJOINT] ${f.id} (${f.sub}) stem→${f.stem} | expl→${f.expl}`);
      console.log(`      stem: ${f.stemText}`);
    } else if (f.kind === "low_overlap") {
      console.log(`  [LOW-OVR ${f.ratio}] ${f.id} (${f.sub}) ${f.stemText}`);
    } else {
      console.log(`  [expl-only ${f.expl}] ${f.id} (${f.sub}) ${f.stemText}`);
    }
  }
}
const total = Object.values(report).reduce((s, f) => s + f.length, 0);
console.log(`\nTOTAL findings: ${total} (unexpected disjoint citations: ${unexpectedDisjoint})`);
if (strict && unexpectedDisjoint > 0) process.exit(1);
