import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const CA_FILE = path.join(DATA_DIR, "general_current_affairs.json");
const TOPICS_FILE = path.join(DATA_DIR, "topics.json");

const SCRATCH_FILE = "C:\\Users\\Tim\\.gemini\\antigravity\\brain\\f852b068-f1af-4257-b880-a94a5f63798d\\scratch\\new_100_ca_questions.json";

console.log("=== INTEGRATING 100 NEW CONTEMPORARY CURRENT AFFAIRS QUESTIONS ===\n");

const newQuestions = JSON.parse(fs.readFileSync(SCRATCH_FILE, "utf8"));
const caPayload = JSON.parse(fs.readFileSync(CA_FILE, "utf8"));
const subcategories = caPayload.subcategories;

const subMap = new Map();
for (const sub of subcategories) {
  subMap.set(sub.id, sub);
}

let addedCount = 0;
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
  targetSub.questions.push(q);
  addedCount++;
}

fs.writeFileSync(CA_FILE, JSON.stringify(caPayload, null, 2) + "\n", "utf8");
console.log(`Successfully added ${addedCount} new questions to data/general_current_affairs.json`);

let totalCaQuestions = 0;
for (const sub of subcategories) {
  if (Array.isArray(sub.questions)) {
    if (sub.id === "ca_general" && sub.questions.length > 0 && Array.isArray(sub.questions[0]?.ca_general)) {
      totalCaQuestions += sub.questions[0].ca_general.length;
    } else {
      totalCaQuestions += sub.questions.length;
    }
  }
}
console.log(`New total questions in general_current_affairs.json: ${totalCaQuestions}`);

const topicsPayload = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
const topicsList = topicsPayload.topics || topicsPayload;
for (const t of topicsList) {
  if (t.id === "general_current_affairs") {
    t.questionCount = totalCaQuestions;
    console.log(`Updated topics.json questionCount for general_current_affairs to ${totalCaQuestions}`);
  }
}
fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsPayload, null, 2) + "\n", "utf8");

console.log("\nDone!");
