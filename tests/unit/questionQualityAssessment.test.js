import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(".");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "build_question_quality_assessment.py");

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function buildFixtureBank(rootDir) {
  const dataDir = path.join(rootDir, "data");
  writeJson(path.join(dataDir, "topics.json"), {
    topics: [
      { id: "ict_management", name: "ICT Management", file: "data/ict_digital.json" },
      { id: "civil_service_admin", name: "Civil Service Administration", file: "data/civil_service_ethics.json" },
      { id: "constitutional_law", name: "Constitutional Law & FOI", file: "data/constitutional_foi.json" },
    ],
  });

  writeJson(path.join(dataDir, "ict_digital.json"), {
    subcategories: [
      {
        id: "ict_e_governance",
        name: "E-Governance & Digital Services",
        questions: [
          {
            id: "ict_bad_move_001",
            question: "In official practice, select the statement that correctly defines the main system of filing in Government offices?",
            options: [
              "The color-coded system.",
              "The digital system.",
              "The alphabetical system.",
              "The Book File system.",
            ],
            correct: 3,
            explanation: "Correct option: D (The Book File system.).",
            keywords: ["official", "practice", "select", "option"],
            tags: ["within", "best"],
            chapter: "E-Governance Systems",
            sourceDocument: "National ICT and Digital Governance Framework",
          },
          {
            id: "ict_bvas_001",
            question: "Within government administration, select the option that best answers: Which agency utilizes the BVAS system for voter accreditation?",
            options: ["NITDA.", "OHCSF.", "CBN.", "INEC."],
            correct: 3,
            explanation: "Correct option: D (INEC.).",
            keywords: ["within", "select", "option", "best"],
            tags: ["within", "select", "option", "best"],
            chapter: "E-Governance Systems",
            sourceDocument: "National ICT and Digital Governance Framework",
          },
          {
            id: "ict_enclosure_001",
            question: "According to established rules, select the option that best answers: If a letter has more than one enclosure, what should be indicated?",
            options: [
              "The type of enclosures.",
              "The number of pages.",
              "The number of enclosures.",
              "The weight of the enclosures.a.",
            ],
            correct: 2,
            explanation: "Correct option: C (The number of enclosures.). If the letter has more than one enclosure, the number should be shown in brackets, e.g. Enc. (2).",
            keywords: ["according", "established", "rules", "select"],
            tags: ["option", "best"],
            chapter: "E-Governance Systems",
            sourceDocument: "National ICT and Digital Governance Framework",
          },
          {
            id: "ict_delete_001",
            question: "Within government administration, select the statement that correctly defines the official colour used for legacy workflow compliance?",
            options: [
              "Blue.a.",
              "The digital system.",
              "An approval workflow is required.",
              "Legacy compliance.",
            ],
            correct: 0,
            explanation: "Correct option: A (Blue.a.).",
            keywords: ["within", "select", "option", "best"],
            tags: ["official", "practice"],
            chapter: "E-Governance Systems",
            sourceDocument: "National ICT and Digital Governance Framework",
          },
          {
            id: "ict_keep_001",
            question: "Which public-sector platform is used to manage digital personnel records in many civil service modernization programmes?",
            options: ["HRMIS.", "Ledger Book.", "Dispatch Register.", "Treasury Warrant."],
            correct: 0,
            explanation: "HRMIS is a digital human resource information platform used to manage personnel records and workflow data in modernization programmes.",
            keywords: ["hrmis", "digital", "personnel"],
            tags: ["digital_records", "platform"],
            chapter: "Digital Records",
            sourceDocument: "National ICT and Digital Governance Framework",
          },
        ],
      },
    ],
  });

  writeJson(path.join(dataDir, "civil_service_ethics.json"), {
    subcategories: [
      {
        id: "csh_registry_admin",
        name: "Registry & Office Procedure",
        questions: [
          {
            id: "csh_registry_001",
            question: "If an official letter contains more than one enclosure, what should be indicated?",
            options: [
              "The type of enclosures.",
              "The number of pages.",
              "The number of enclosures.",
              "The weight of the enclosures.",
            ],
            correct: 2,
            explanation: "Official correspondence practice requires the number of enclosures to be indicated, usually as Enc. (2).",
            keywords: ["letter", "enclosure", "registry"],
            tags: ["registry", "procedure"],
            chapter: "Official Correspondence",
            sourceDocument: "Civil Service Handbook",
          },
          {
            id: "csh_exec_001",
            question: "In the public service context, which option best describes the duty and duty of the Executive Council of the Federation?",
            options: [
              "To manage the daily affairs of the Judiciary. ???",
              "To elect Local Government Chairrren_",
              "To determine Government policies on various matters.",
              "To confirm appointments of Ministers and Ambassadors.",
            ],
            correct: 2,
            explanation: "Correct option: C (To determine Government policies on various matters.). The Executive Council of the Federation has the duty and duty of determining Government policies on various matters.",
            keywords: ["duty", "context", "option", "best"],
            tags: ["public_service", "executive_council"],
            chapter: "Civil Service Principles & Ethics - Expansion Set",
            sourceDocument: "Civil Service Handbook",
          },
        ],
      },
    ],
  });
  writeJson(path.join(dataDir, "constitutional_foi.json"), {
    subcategories: [
      {
        id: "foi_access_obligations",
        name: "FOI Access Obligations",
        questions: [
          {
            id: "foi_records_001",
            question: "In official practice, which section of the FOI Act requires public institutions to maintain proper records for easy access?",
            options: ["Section 2.", "Section 3.", "Section 5.", "Section 9."],
            correct: 0,
            explanation: "Correct option: A (Section 2.). Section 2 of the FOI Act requires public institutions to maintain proper records for easy access.",
            keywords: ["official", "practice", "foi", "records"],
            tags: ["section", "act", "institution"],
            chapter: "Freedom of Information Obligations",
            sourceDocument: "Freedom of Information Act",
          },
        ],
      },
    ],
  });
}

test("question quality assessment classifies weak stems into rewrite, move, and delete actions", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "promotion-cbt-quality-"));
  buildFixtureBank(fixtureRoot);

  const jsonOut = path.join(fixtureRoot, "docs", "question_quality_assessment.json");
  const mdOut = path.join(fixtureRoot, "docs", "question_quality_assessment.md");
  const topicsFile = path.join(fixtureRoot, "data", "topics.json");

  const result = spawnSync(
    "python",
    [
      SCRIPT_PATH,
      "--root",
      fixtureRoot,
      "--topics-file",
      topicsFile,
      "--json-out",
      jsonOut,
      "--md-out",
      mdOut,
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(jsonOut), true);
  assert.equal(fs.existsSync(mdOut), true);

  const report = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
  const byId = new Map(report.items.map((item) => [item.question_id, item]));

  assert.equal(byId.has("ict_keep_001"), false, "clean ICT control question should not be flagged");

  const filing = byId.get("ict_bad_move_001");
  assert.equal(filing.recommended_action, "move");
  assert.equal(filing.suggested_target_topic, "civil_service_admin");
  assert.equal(filing.suggested_target_subcategory, "csh_administrative_procedures");
  assert.equal(filing.suggested_target_prefix, "csh_ap_");
  assert.equal(filing.issue_types.includes("filler_stem_prefix"), true);
  assert.equal(filing.issue_types.includes("definition_option_mismatch"), true);
  assert.equal(filing.issue_types.includes("move_candidate"), true);

  const bvas = byId.get("ict_bvas_001");
  assert.equal(bvas.recommended_action, "rewrite");
  assert.equal(bvas.issue_types.includes("filler_stem_prefix"), true);
  assert.equal(bvas.issue_types.includes("thin_explanation"), true);
  assert.equal(bvas.issue_types.includes("metadata_pollution_from_stem"), true);
  assert.equal(bvas.issue_types.includes("borderline_current_affairs_in_ict"), true);

  const enclosure = byId.get("ict_enclosure_001");
  assert.equal(enclosure.recommended_action, "move");
  assert.equal(enclosure.suggested_target_subcategory, "csh_administrative_procedures");
  assert.equal(enclosure.suggested_target_prefix, "csh_ap_");
  assert.equal(enclosure.issue_types.includes("administrative_procedure_in_wrong_topic"), true);
  assert.equal(enclosure.issue_types.includes("option_formatting_noise"), true);

  const deleteCandidate = byId.get("ict_delete_001");
  assert.equal(deleteCandidate.recommended_action, "delete");
  assert.equal(deleteCandidate.issue_types.includes("delete_candidate"), true);
  assert.equal(deleteCandidate.issue_types.includes("option_formatting_noise"), true);
  assert.equal(deleteCandidate.issue_types.includes("non_parallel_options"), true);

  const executiveCouncil = byId.get("csh_exec_001");
  assert.equal(executiveCouncil.recommended_action, "rewrite");
  assert.equal(executiveCouncil.issue_types.includes("filler_stem_prefix"), true);
  assert.equal(executiveCouncil.issue_types.includes("text_corruption_noise"), true);
  assert.equal(executiveCouncil.issue_types.includes("thin_explanation"), true);

  const foiRecords = byId.get("foi_records_001");
  assert.equal(foiRecords.recommended_action, "rewrite");
  assert.equal(foiRecords.issue_types.includes("move_candidate"), false);
  assert.equal(foiRecords.issue_types.includes("administrative_procedure_in_wrong_topic"), false);
  assert.equal(foiRecords.issue_types.includes("filler_stem_prefix"), true);
});

