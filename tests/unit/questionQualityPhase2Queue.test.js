import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = path.resolve(".");
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts", "build_question_quality_phase2_queue.py");

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

test("phase2 queue partitions rewrite backlog into editorial batches", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "promotion-cbt-phase2-"));
  const assessmentPath = path.join(fixtureRoot, "docs", "question_quality_assessment.json");
  const jsonOut = path.join(fixtureRoot, "docs", "question_quality_phase2_queue.json");
  const mdOut = path.join(fixtureRoot, "docs", "question_quality_phase2_queue.md");

  writeJson(assessmentPath, {
    summary: { flagged_questions: 7 },
    items: [
      {
        question_id: "dup_001",
        source_topic: "policy_analysis",
        source_subcategory: "pol_analysis_methods",
        source_file: "data/policy_analysis.json",
        question: "Scenario item A",
        recommended_action: "rewrite",
        confidence: 0.66,
        issue_types: ["same_subcategory_near_duplicate", "thin_explanation", "rewrite_candidate"],
        rationale: ["Too similar to nearby items."],
        rewrite_note: "Differentiate the scenario family.",
      },
      {
        question_id: "def_001",
        source_topic: "civil_service_admin",
        source_subcategory: "csh_discipline_conduct",
        source_file: "data/civil_service_ethics.json",
        question: "Official letter is defined as:",
        recommended_action: "rewrite",
        confidence: 0.58,
        issue_types: ["definition_option_mismatch", "thin_explanation", "rewrite_candidate"],
        rationale: ["Stem asks for a definition but options are not aligned."],
        rewrite_note: "Make options definition-shaped.",
      },
      {
        question_id: "frame_001",
        source_topic: "psr",
        source_subcategory: "psr_general_admin",
        source_file: "data/psr_rules.json",
        question: "In official practice, select the option that best answers...",
        recommended_action: "rewrite",
        confidence: 0.55,
        issue_types: ["filler_stem_prefix", "vague_authority_reference", "metadata_pollution_from_stem", "thin_explanation", "rewrite_candidate"],
        rationale: ["Wrapper-heavy stem with a thin explanation."],
        rewrite_note: "Rewrite as a direct prompt.",
      },
      {
        question_id: "parallel_001",
        source_topic: "ict_management",
        source_subcategory: "ict_e_governance",
        source_file: "data/ict_digital.json",
        question: "Which option best supports service quality?",
        recommended_action: "rewrite",
        confidence: 0.5,
        issue_types: ["non_parallel_options", "rewrite_candidate"],
        rationale: ["Options are not grammatically parallel."],
        rewrite_note: "Rebuild distractors.",
      },
      {
        question_id: "thin_001",
        source_topic: "general_current_affairs",
        source_subcategory: "ca_general",
        source_file: "data/general_current_affairs.json",
        question: "Who supervises the Civil Service?",
        recommended_action: "rewrite",
        confidence: 0.45,
        issue_types: ["thin_explanation", "rewrite_candidate"],
        rationale: ["Explanation is too thin."],
        rewrite_note: "Add a better explanation.",
      },
      {
        question_id: "move_ignored",
        source_topic: "procurement_act",
        source_subcategory: "proc_transparency_ethics",
        source_file: "data/public_procurement.json",
        question: "Registry question",
        recommended_action: "move",
        confidence: 0.8,
        issue_types: ["administrative_procedure_in_wrong_topic", "move_candidate"],
        rationale: ["Wrong topic."],
        rewrite_note: "Move first.",
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
  const queue = JSON.parse(fs.readFileSync(jsonOut, "utf8"));

  assert.deepEqual(queue.summary.phase2_counts, {
    near_duplicate_families: 1,
    definition_alignment_rewrites: 1,
    weak_framing_rewrites: 1,
    non_parallel_option_rebuilds: 1,
    thin_explanation_enrichment: 1,
    total_phase2: 5,
  });

  assert.equal(queue.groups.near_duplicate_families.items[0].question_id, "dup_001");
  assert.equal(queue.groups.definition_alignment_rewrites.items[0].question_id, "def_001");
  assert.equal(queue.groups.weak_framing_rewrites.items[0].question_id, "frame_001");
  assert.equal(queue.groups.non_parallel_option_rebuilds.items[0].question_id, "parallel_001");
  assert.equal(queue.groups.thin_explanation_enrichment.items[0].question_id, "thin_001");
});
