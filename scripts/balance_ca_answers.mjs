import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const CA_FILE = path.join(DATA_DIR, "general_current_affairs.json");

console.log("=== BALANCING ANSWER POSITIONS FOR 100 NEW QUESTIONS ===\n");

const caPayload = JSON.parse(fs.readFileSync(CA_FILE, "utf8"));
const subcategories = caPayload.subcategories;

// Target options shuffle for new questions gca_2026_001 .. gca_2026_100
let newQCount = 0;
let targetPos = 0;

for (const sub of subcategories) {
  if (!Array.isArray(sub.questions)) continue;
  for (const q of sub.questions) {
    if (q && typeof q.id === "string" && q.id.startsWith("gca_2026_")) {
      newQCount++;
      const currentCorrectOpt = q.options[q.correct];
      const desiredPos = targetPos % 4; // Cycles 0 (A), 1 (B), 2 (C), 3 (D)
      targetPos++;

      if (q.correct !== desiredPos) {
        // Swap option at q.correct with option at desiredPos
        const temp = q.options[desiredPos];
        q.options[desiredPos] = currentCorrectOpt;
        q.options[q.correct] = temp;
        q.correct = desiredPos;
      }
    }
  }
}

fs.writeFileSync(CA_FILE, JSON.stringify(caPayload, null, 2) + "\n", "utf8");
console.log(`Balanced ${newQCount} new questions across options A, B, C, D (25% each cycle).`);
console.log("Done!");
