import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const ICT_FILE = path.join(DATA_DIR, "ict_digital.json");
const TOPICS_FILE = path.join(DATA_DIR, "topics.json");
const SCRATCH_FILE = "C:\\Users\\Tim\\.gemini\\antigravity\\brain\\f852b068-f1af-4257-b880-a94a5f63798d\\scratch\\new_200_ict_questions.json";

console.log("=== INTEGRATING 200 NEW MODERN ICT & AI QUESTIONS ===\n");

const newQuestions = JSON.parse(fs.readFileSync(SCRATCH_FILE, "utf8"));
const ictPayload = JSON.parse(fs.readFileSync(ICT_FILE, "utf8"));
const subcategories = ictPayload.subcategories;

const subMap = new Map();
for (const sub of subcategories) {
  subMap.set(sub.id, sub);
}

let addedCount = 0;
let targetPos = 0;

for (const q of newQuestions) {
  const targetSubId = q.sourceSubcategoryId;
  const targetSub = subMap.get(targetSubId);
  if (!targetSub) {
    console.error(`Subcategory ${targetSubId} not found!`);
    continue;
  }
  if (!Array.isArray(targetSub.questions)) {
    targetSub.questions = [];
  }

  // Balance options (A, B, C, D)
  const currentCorrectOpt = q.options[q.correct];
  const desiredPos = targetPos % 4;
  targetPos++;

  if (q.correct !== desiredPos) {
    const temp = q.options[desiredPos];
    q.options[desiredPos] = currentCorrectOpt;
    q.options[q.correct] = temp;
    q.correct = desiredPos;
  }

  targetSub.questions.push(q);
  addedCount++;
}

fs.writeFileSync(ICT_FILE, JSON.stringify(ictPayload, null, 2) + "\n", "utf8");
console.log(`Successfully added ${addedCount} new questions to data/ict_digital.json`);

let totalIctQuestions = 0;
for (const sub of subcategories) {
  if (Array.isArray(sub.questions)) {
    totalIctQuestions += sub.questions.length;
  }
}
console.log(`New total questions in ict_digital.json: ${totalIctQuestions}`);

const topicsPayload = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
const topicsList = topicsPayload.topics || topicsPayload;
for (const t of topicsList) {
  if (t.id === "ict_management") {
    t.questionCount = totalIctQuestions;
    console.log(`Updated topics.json questionCount for ict_management to ${totalIctQuestions}`);
  }
}
fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsPayload, null, 2) + "\n", "utf8");

console.log("\nDone!");
