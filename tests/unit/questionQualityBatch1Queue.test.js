import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(".");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "build_question_quality_batch1_queue.py");

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

test("batch1 queue extracts move, delete, and text-corruption rewrite items", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "promotion-cbt-batch1-"));
  const assessmentPath = path.join(fixtureRoot, "docs", "question_quality_assessment.json");
  const jsonOut = path.join(fixtureRoot, "docs", "question_quality_batch1_queue.json");
  const mdOut = path.join(fixtureRoot, "docs", "question_quality_batch1_queue.md");

  writeJson(assessmentPath, {
    summary: { flagged_questions: 5 },
    items: [
      {
        question_id: "move_001",
        source_topic: "ict_management",
        source_subcategory: "ict_e_governance",
        source_file: "data/ict_digital.json",
        question: "Registry-style filing question in ICT?",
        recommended_action: "move",
        suggested_target_topic: "civil_service_admin",
        suggested_target_subcategory: "csh_administrative_procedures",
        suggested_target_prefix: "csh_ap_",
        confidence: 0.84,
        issue_types: ["administrative_procedure_in_wrong_topic", "move_candidate"],
        rationale: ["Question looks like registry practice in the wrong topic."],
        rewrite_note: "Move before rewriting.",
      },
      {
        question_id: "delete_001",
        source_topic: "constitutional_law",
        source_subcategory: "foi_exemptions_public_interest",
        source_file: "data/constitutional_foi.json",
        question: "Broken absent file cards item",
        recommended_action: "delete",
        suggested_target_topic: null,
        confidence: 0.93,
        issue_types: ["option_formatting_noise", "delete_candidate"],
        rationale: ["Question is too malformed to salvage confidently."],
        rewrite_note: null,
      },
      {
        question_id: "rewrite_001",
        source_topic: "civil_service_admin",
        source_subcategory: "csh_principles_ethics",
        source_file: "data/civil_service_ethics.json",
        question: "Duty and duty question",
        recommended_action: "rewrite",
        suggested_target_topic: null,
        confidence: 0.55,
        issue_types: ["text_corruption_noise", "thin_explanation", "rewrite_candidate"],
        rationale: ["Question text is visibly corrupted."],
        rewrite_note: "Repair corrupted wording.",
      },
      {
        question_id: "rewrite_002",
        source_topic: "ict_management",
        source_subcategory: "ict_e_governance",
        source_file: "data/ict_digital.json",
        question: "Plain weak ICT question",
        recommended_action: "rewrite",
        suggested_target_topic: null,
        confidence: 0.49,
        issue_types: ["thin_explanation", "rewrite_candidate"],
        rationale: ["Explanation is thin."],
        rewrite_note: "Add explanation.",
      },
    ],
  });

  const result = spawnSync(
    "python",
    [
      SCRIPT_PATH,
      "--assessment",
      assessmentPath,
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

  const queue = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
  assert.deepEqual(queue.summary.batch1_counts, {
    move: 1,
    delete: 1,
    rewrite_text_corruption: 1,
    total_batch1: 3,
  });

  assert.equal(queue.groups.move.items[0].question_id, "move_001");
  assert.equal(queue.groups.move.items[0].suggested_target_subcategory, "csh_administrative_procedures");
  assert.equal(queue.groups.move.items[0].suggested_target_prefix, "csh_ap_");
  assert.equal(queue.groups.delete.items[0].question_id, "delete_001");
  assert.equal(queue.groups.rewrite_text_corruption.items[0].question_id, "rewrite_001");
  assert.equal(queue.groups.rewrite_text_corruption.top_issues.text_corruption_noise, 1);
  assert.equal(queue.groups.rewrite_text_corruption.items.some((item) => item.question_id === "rewrite_002"), false);
});
