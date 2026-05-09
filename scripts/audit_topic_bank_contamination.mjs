import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS_FILE = path.join(ROOT_DIR, "data", "topics.json");

const args = new Set(process.argv.slice(2));
const shouldFail = args.has("--fail-on-findings");
const shouldPrintJson = args.has("--json");
const topicArgIndex = process.argv.indexOf("--topic");
const requestedTopicId = topicArgIndex >= 0 ? process.argv[topicArgIndex + 1] : "";

const TOPIC_RULES = {
  ict_management: [
    {
      reason: "PSR rule reference in ICT bank",
      pattern: /\b(?:psr\s*)?rule\s+\d{6}\b/i,
      allow: /\b(?:virtual meeting|virtual meetings|meeting etiquette|scheduled virtual meeting)\b/i,
    },
    { reason: "Public Service Rules reference in ICT bank", pattern: /\bpublic service rules?\b/i },
    { reason: "financial embarrassment question in ICT bank", pattern: /\bfinancial embarrassment\b/i },
    { reason: "Board of Survey question in ICT bank", pattern: /\bboard of survey\b/i },
    { reason: "audit stamp question in ICT bank", pattern: /\baudit stamps?\b/i },
    { reason: "receipt/licence book question in ICT bank", pattern: /\b(?:receipt|licen[cs]e) books?\b/i },
    { reason: "cash/stamps/security documents question in ICT bank", pattern: /\bcash,\s*stamps?.*security documents?\b/i },
    { reason: "strong-room or cash-safe question in ICT bank", pattern: /\b(?:strong-rooms?|cash safe|reserve cash safe)\b/i },
    { reason: "payment voucher question in ICT bank", pattern: /\bpayment vouchers?\b/i },
    { reason: "accounting officer question in ICT bank", pattern: /\b(?:self-accounting|sub-accounting officer|revenue collector)\b/i },
    { reason: "official-document classification question in ICT bank", pattern: /\b(?:top secret|restricted|official document|security classification)\b/i },
  ],
  psr: [
    { reason: "technical acronym question in PSR bank", pattern: /\b(?:sql|vpn|cdn)\b/i },
    { reason: "virtualization question in PSR bank", pattern: /\b(?:virtualization|hypervisor)\b/i },
  ],
  procurement_act: [
    { reason: "PSR rule reference in procurement bank", pattern: /\b(?:psr\s*)?rule\s+\d{6}\b/i },
    { reason: "financial embarrassment question in procurement bank", pattern: /\bfinancial embarrassment\b/i },
  ],
  constitutional_law: [
    { reason: "cash control question in constitutional/legal bank", pattern: /\b(?:audit stamps?|strong-rooms?|cash safe|reserve cash safe|receipt books?|licen[cs]e books?)\b/i },
    { reason: "Board of Survey question in constitutional/legal bank", pattern: /\bboard of survey\b/i },
  ],
  leadership_management: [
    {
      reason: "cash control question in leadership bank",
      pattern: /\b(?:audit stamps?|strong-rooms?|cash safe|reserve cash safe|receipt books?|licen[cs]e books?|payment vouchers?)\b/i,
      allow: /\bbig data analytics\b/i,
    },
  ],
  policy_analysis: [
    { reason: "cash control question in policy bank", pattern: /\b(?:audit stamps?|strong-rooms?|cash safe|reserve cash safe|receipt books?|licen[cs]e books?)\b/i },
    { reason: "Board of Survey question in policy bank", pattern: /\bboard of survey\b/i },
  ],
};

const SOURCE_TOPIC_ALIASES = new Map([
  ["psr_rules", "psr"],
  ["public_service_rules", "psr"],
  ["financial_regulation", "financial_regulations"],
  ["public_procurement", "procurement_act"],
  ["procurement", "procurement_act"],
  ["ict", "ict_management"],
  ["leadership", "leadership_management"],
  ["policy", "policy_analysis"],
  ["competency", "competency_framework"],
]);

function normalizeSourceTopicId(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  return SOURCE_TOPIC_ALIASES.get(normalized) || normalized;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectQuestions(value, trail = [], questions = []) {
  if (!value || typeof value !== "object") {
    return questions;
  }

  if (typeof value.question === "string" && Array.isArray(value.options)) {
    questions.push({ item: value, trail });
    return questions;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectQuestions(entry, [...trail, index], questions));
    return questions;
  }

  Object.entries(value).forEach(([key, entry]) => collectQuestions(entry, [...trail, key], questions));
  return questions;
}

function buildQuestionText(question) {
  return normalizeText([
    question.question,
    ...(Array.isArray(question.options) ? question.options : []),
    question.explanation,
  ].join(" "));
}

function findRuleMatches(topicId, text) {
  const rules = TOPIC_RULES[topicId];
  if (!rules) {
    return [];
  }

  return rules
    .filter((rule) => rule.pattern.test(text) && !(rule.allow && rule.allow.test(text)))
    .map((rule) => ({
      reason: rule.reason,
      match: rule.pattern.source,
    }));
}

function auditTopic(topic) {
  const topicFile = path.join(ROOT_DIR, topic.file);
  if (!fs.existsSync(topicFile)) {
    return {
      topic,
      missing: true,
      totalQuestions: 0,
      findings: [],
    };
  }

  const bank = readJson(topicFile);
  const questions = collectQuestions(bank);
  const findings = [];

  questions.forEach(({ item, trail }) => {
    const sourceTopicId = normalizeSourceTopicId(item.sourceTopicId);
    if (sourceTopicId && sourceTopicId !== topic.id) {
      findings.push({
        topicId: topic.id,
        topicName: topic.name,
        file: topic.file,
        questionId: item.id || "",
        reason: `sourceTopicId is ${sourceTopicId}`,
        match: item.sourceTopicId,
        question: normalizeText(item.question),
        trail,
      });
    }

    const text = buildQuestionText(item);
    findRuleMatches(topic.id, text).forEach((match) => {
      findings.push({
        topicId: topic.id,
        topicName: topic.name,
        file: topic.file,
        questionId: item.id || "",
        reason: match.reason,
        match: match.match,
        question: normalizeText(item.question),
        trail,
      });
    });
  });

  return {
    topic,
    missing: false,
    totalQuestions: questions.length,
    findings,
  };
}

function printTextReport(results) {
  const scanned = results.filter((result) => !result.missing);
  const missing = results.filter((result) => result.missing);
  const findings = results.flatMap((result) => result.findings);

  console.log(`Topic bank contamination audit`);
  console.log(`Scanned: ${scanned.length} topic banks, ${scanned.reduce((sum, result) => sum + result.totalQuestions, 0)} questions`);
  if (missing.length) {
    console.log(`Missing private banks: ${missing.map((result) => result.topic.file).join(", ")}`);
  }
  console.log(`Findings: ${findings.length}`);

  results
    .filter((result) => result.findings.length)
    .forEach((result) => {
      console.log(`\n${result.topic.name} (${result.findings.length})`);
      result.findings.slice(0, 20).forEach((finding) => {
        console.log(`- ${finding.questionId || "(no id)"}: ${finding.reason} — ${finding.question}`);
      });
      if (result.findings.length > 20) {
        console.log(`- ...${result.findings.length - 20} more`);
      }
    });
}

const topics = readJson(TOPICS_FILE).topics.filter((topic) => {
  return !requestedTopicId || topic.id === requestedTopicId;
});

if (requestedTopicId && !topics.length) {
  console.error(`Unknown topic id: ${requestedTopicId}`);
  process.exit(2);
}

const results = topics.map(auditTopic);
const findings = results.flatMap((result) => result.findings);

if (shouldPrintJson) {
  console.log(JSON.stringify({ results, findings }, null, 2));
} else {
  printTextReport(results);
}

if (shouldFail && findings.length) {
  process.exit(1);
}
