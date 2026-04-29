import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countQuestionsFromTopicData } from "../js/topicDataShape.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dataDir = path.join(repoRoot, "data");
const topicsPath = path.join(dataDir, "topics.json");

const rawTopics = JSON.parse(await readFile(topicsPath, "utf8"));
const topics = Array.isArray(rawTopics?.topics) ? rawTopics.topics : [];

for (const topic of topics) {
  const relativeFile = String(topic?.file || "").trim();
  if (!relativeFile) continue;
  const topicPath = path.join(repoRoot, relativeFile);
  const topicData = JSON.parse(await readFile(topicPath, "utf8"));
  topic.questionCount = countQuestionsFromTopicData(topicData);
}

await writeFile(topicsPath, `${JSON.stringify(rawTopics, null, 2)}\n`, "utf8");
console.log(`Updated question counts for ${topics.length} topics.`);
