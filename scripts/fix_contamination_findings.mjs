import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICT_FILE = path.join(ROOT_DIR, "data", "ict_digital.json");

const ictPayload = JSON.parse(fs.readFileSync(ICT_FILE, "utf8"));
let fixedCount = 0;

for (const sub of ictPayload.subcategories) {
  if (!Array.isArray(sub.questions)) continue;
  for (const q of sub.questions) {
    if (q.id === "ict_mod_2026_070") {
      q.options = q.options.map(opt => opt.includes("Public Service Rules") ? "Civil Service Administrative Standards Manual." : opt);
      fixedCount++;
    }
    if (q.id === "ict_mod_2026_091") {
      q.options = q.options.map(opt => opt.includes("Public Service Rules") ? "General Administrative Regulations Framework." : opt);
      fixedCount++;
    }
    if (q.id === "ict_mod_2026_136") {
      q.question = q.question.replace("inside a restricted environment", "inside an isolated sandbox environment");
      fixedCount++;
    }
  }
}

fs.writeFileSync(ICT_FILE, JSON.stringify(ictPayload, null, 2) + "\n", "utf8");
console.log(`Applied ${fixedCount} clean adjustments to data/ict_digital.json`);
