#!/usr/bin/env node
// Print full question detail from any bank, for adjudicating the flagged items
// against the primary source. Usage: node scripts/question_sample.mjs <id> [id...]
import fs from "node:fs";
import path from "node:path";

const SKIP = new Set(["topics.json", "exam_templates.json", "gl_band_weights.json"]);
const L = "ABCDEFGH";
const want = new Set(process.argv.slice(2));
const found = new Map();

for (const f of fs.readdirSync("data").filter((f) => f.endsWith(".json") && !SKIP.has(f)).sort()) {
  const bank = JSON.parse(fs.readFileSync(path.join("data", f), "utf8"));
  for (const sc of bank.subcategories || [])
    for (const q of sc.questions || [])
      if (want.has(q.id)) found.set(q.id, { bank: f.replace(/\.json$/, ""), sc: sc.name || sc.id, q });
}

for (const id of want) {
  const rec = found.get(id);
  if (!rec) { console.log(`\n${id}: NOT FOUND`); continue; }
  const { q } = rec;
  console.log(`\n=========== ${id}  [${rec.bank} / ${rec.sc}] ===========`);
  console.log(`Q: ${q.question}`);
  (q.options || []).forEach((o, i) => console.log(`   ${L[i]}${i === q.correct ? " *" : "  "} ${o}`));
  console.log(`EXP: ${q.explanation}`);
}
