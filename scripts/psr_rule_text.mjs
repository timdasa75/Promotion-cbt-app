#!/usr/bin/env node
// Extract the text of a set of PSR 2021 rules, for grounding rewritten questions.
// Usage: node scripts/psr_rule_text.mjs 010105 110101 130401 ...
import fs from "node:fs";

const flat = fs.readFileSync(".freebuff/psr_2021_full.txt", "utf8").replace(/\s+/g, " ");
const marks = [];
// The OCR renders the marker variously: "110208: -", "010106. -", "110102 - Every Officer".
for (const m of flat.matchAll(/(\d{6})\s*[:.\-–—]/g)) marks.push({ rule: m[1], at: m.index });

for (const want of process.argv.slice(2)) {
  const i = marks.findIndex((x) => x.rule === want);
  if (i === -1) { console.log(`\n##### ${want} : NOT FOUND`); continue; }
  const start = marks[i].at;
  const end = i + 1 < marks.length ? marks[i + 1].at : Math.min(flat.length, start + 900);
  console.log(`\n##### ${want} #####`);
  console.log(flat.slice(start, Math.min(end, start + 1000)));
}
