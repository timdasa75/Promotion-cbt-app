#!/usr/bin/env node
/**
 * Data Cleanup & Fix Script
 *
 * Performs curated fixes on option punctuation, OCR artifacts, and duplicate options,
 * and synchronizes data/topics.json question counts.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const TOPICS_FILE = path.join(DATA_DIR, "topics.json");

console.log("=== EXECUTING CURATED DATA CLEANUP & TOPICS SYNCHRONIZATION ===\n");

// Curated option overrides for the 18 flagged questions + policy_psr_057
const CURATED_OPTION_FIXES = {
  FOI_EX_073: [
    "Passenger names and destinations",
    "Fuel purchases only",
    "Departure/arrival times, mileage, and objective of journey",
    "Date and driver's name only"
  ],
  psr_docx_120: [
    "Federal Civil Service Commission",
    "Ministries",
    "The Office of the Head of the Civil Service of the Federation (OHCSF)",
    "Public Service Institute"
  ],
  psr_docx_128: [
    "Auto-confirmed.",
    "Entitled to promotion.",
    "Imposition of a disciplinary sanction.",
    "It ceases to have effect."
  ],
  psr_disc_057: [
    "Only financial management systems",
    "Only disciplinary procedures",
    "International diplomatic protocols",
    "Performance Management System, Talent Sourcing, Volunteerism, Virtual Meetings/Engagements"
  ],
  psr_docx_163: [
    "National Assembly",
    "The Nigerian Bar Association (NBA)",
    "Public Service Institute of Nigeria (PSIN)",
    "The Central Bank of Nigeria (CBN)"
  ],
  psr_docx_057: [
    "Form FC (FCSC record)",
    "Staff Record Form (Gen 60)",
    "Form Gen. 67",
    "Form Gen 69C"
  ],
  psr_docx_059: [
    "Two months",
    "Within one month of the appointment",
    "Three months",
    "Within one week of the appointment"
  ],
  psr_docx_011: [
    "A temporary position.",
    "A post in any of the Public Service of the Federal Republic of Nigeria.",
    "A post provided for under the Personnel Emoluments sub-head of the Estimates.",
    "A newly created position."
  ],
  psr_docx_041: [
    "Administrative Staff College of Nigeria (ASCON)",
    "The OHCSF",
    "The Federal Civil Service Commission (FCSC)",
    "Each Ministry/Extra-Ministerial Office"
  ],
  psr_docx_052: [
    "1st January of every year",
    "1st July of the year of appointment",
    "1st April",
    "31st December"
  ],
  psr_docx_092: [
    "Form FC",
    "Form 67",
    "Form No. Gen. 60",
    "Form 1"
  ],
  psr_docx_134: [
    "Permanent Secretary",
    "The Minister of the ministry",
    "The Federal Civil Service Commission",
    "Head of Department"
  ],
  psr_docx_157: [
    "Adjudicate and impose sanctions",
    "Legal advice",
    "Organise training programmes",
    "Recommend officers for promotion"
  ],
  psr_docx_191: [
    "Every four years, and upon assumption of duty",
    "Only upon retirement from service",
    "Once every year",
    "Every two years"
  ],
  psr_docx_194: [
    "Economic and Financial Crimes Commission (EFCC)",
    "The Independent Corrupt Practices and Other Related Offences Commission (ICPC)",
    "The Code of Conduct Bureau (CCB)",
    "Auditor-General"
  ],
  psr_docx_205: [
    "Clerical staff only",
    "Consultants",
    "Officers on training",
    "Leadership (Directorate and above)"
  ],
  psr_docx_211: [
    "Delay implementation of strategies.",
    "Ignore progress.",
    "Track progress, assess impact, and ensure accountability.",
    "Increase the cost of implementation."
  ],
  psr_docx_233: [
    "The Minister of the ministry",
    "Permanent Secretary",
    "FCSC or Permanent Secretary/Head of Extra-Ministerial Office as the case may be",
    "Head of Department"
  ],
  policy_psr_057: [
    "Form Gen. 60",
    "Form Gen. 58A",
    "Form Gen. 58",
    "Form Gen. 67"
  ]
};

function getSubcategories(payload) {
  if (Array.isArray(payload.subcategories)) return payload.subcategories;
  if (payload.subcategories && typeof payload.subcategories === "object") return Object.values(payload.subcategories);
  if (Array.isArray(payload.domains)) return payload.domains.flatMap((d) => (d && Array.isArray(d.topics) ? d.topics : []));
  return [];
}

function getQuestions(sub) {
  if (!sub || !Array.isArray(sub.questions)) return [];
  if (sub.id === "ca_general" && sub.questions.length > 0 && Array.isArray(sub.questions[0]?.ca_general)) {
    return sub.questions[0].ca_general;
  }
  if (sub.questions.length > 0 && sub.questions[0] && typeof sub.questions[0] === "object" && !sub.questions[0].id) {
    return Object.values(sub.questions[0]).flatMap((v) => (Array.isArray(v) ? v : []));
  }
  return sub.questions;
}

const BANK_FILES = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !["topics.json", "exam_templates.json", "gl_band_weights.json"].includes(f))
  .sort();

let fixedCount = 0;

for (const file of BANK_FILES) {
  const filePath = path.join(DATA_DIR, file);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const subs = getSubcategories(payload);
  let fileModified = false;

  for (const s of subs) {
    const questions = getQuestions(s);
    for (const q of questions) {
      if (q && q.id && CURATED_OPTION_FIXES[q.id]) {
        q.options = CURATED_OPTION_FIXES[q.id];
        fixedCount++;
        fileModified = true;
      }
    }
  }

  if (fileModified) {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`Updated ${file}`);
  }
}

// Synchronize topics.json
const topicsPayload = JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
const topicsList = topicsPayload.topics || topicsPayload;
let topicsModified = false;

for (const t of topicsList) {
  const fileBasename = path.basename(t.file);
  const filePath = path.join(DATA_DIR, fileBasename);
  if (!fs.existsSync(filePath)) continue;

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let actualCount = 0;
  for (const s of getSubcategories(payload)) {
    actualCount += getQuestions(s).length;
  }

  if (t.questionCount !== actualCount) {
    console.log(`Syncing topics.json [${t.id}]: ${t.questionCount} -> ${actualCount}`);
    t.questionCount = actualCount;
    topicsModified = true;
  }
}

if (topicsModified) {
  fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsPayload, null, 2) + "\n", "utf8");
  console.log("Updated data/topics.json");
}

console.log(`\nCurated fixes applied to ${fixedCount} questions.`);
console.log("Done!");
