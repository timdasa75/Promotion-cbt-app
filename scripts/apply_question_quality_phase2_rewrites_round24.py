#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 24."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round24.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round24.md"

REWRITES = {
    "csh_discipline_conduct_gen_003": {
        "question": "Which step best helps a supervisor detect discipline risks before they become formal misconduct cases?",
        "options": [
            "Review attendance, reporting, and compliance patterns early and escalate serious warning signs promptly.",
            "Wait until a major breach occurs before checking whether warning signs existed.",
            "Treat repeated minor lapses as normal unless a written complaint is submitted.",
            "Avoid documenting concerns so the unit can resolve issues informally later.",
        ],
        "explanation": "Discipline risks are best managed when warning signs in attendance, reporting, and compliance are reviewed early and serious patterns are escalated promptly. Early intervention reduces the chance of avoidable misconduct cases.",
        "keywords": ["discipline_risk_detection", "warning_signs", "early_escalation", "supervisory_review"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "discipline_risk_detection", "warning_signs", "early_escalation"],
    },
    "csh_discipline_conduct_gen_010": {
        "question": "Which practice best strengthens compliance assurance when handling a suspected breach of conduct?",
        "options": [
            "Apply the approved rules consistently and escalate exceptions that need higher review.",
            "Make ad hoc exceptions whenever the officer involved has a good prior record.",
            "Delay action until several unrelated complaints have accumulated.",
            "Close the matter once an informal explanation sounds plausible.",
        ],
        "explanation": "Compliance assurance depends on applying the approved rules consistently and escalating exceptions that require higher review. That keeps conduct handling fair, reviewable, and aligned with the service rules.",
        "keywords": ["conduct_breach", "compliance_assurance", "consistent_rules", "exception_escalation"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "conduct_breach", "compliance_assurance", "exception_escalation"],
    },
    "csh_discipline_conduct_gen_013": {
        "question": "When a conduct complaint is received, which control best reduces the risk of a flawed disciplinary process?",
        "options": [
            "Verify the facts, secure the relevant records, and document the initial review before action is taken.",
            "Suspend the officer immediately before confirming what evidence is available.",
            "Rely on verbal summaries instead of checking the source documents.",
            "Let whichever officer first receives the complaint decide the outcome alone.",
        ],
        "explanation": "The risk of a flawed disciplinary process is reduced when facts are verified, relevant records are secured, and the initial review is documented before action is taken. That creates a sound basis for any later decision.",
        "keywords": ["disciplinary_process_control", "fact_verification", "record_security", "initial_review"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "disciplinary_process_control", "fact_verification", "record_security"],
    },
    "csh_discipline_conduct_gen_015": {
        "question": "Which routine best sustains operational discipline in a unit that handles sensitive official work?",
        "options": [
            "Require officers to follow the approved workflow and verify each stage before the case is closed.",
            "Allow officers to skip control stages when the workload becomes heavy.",
            "Let each team member decide which steps matter in urgent situations.",
            "Treat review checks as optional if the final result appears reasonable.",
        ],
        "explanation": "Operational discipline is sustained when officers follow the approved workflow and each stage is verified before closure. That keeps sensitive work consistent even when pressure increases.",
        "keywords": ["operational_discipline", "approved_workflow", "stage_verification", "sensitive_work"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "operational_discipline", "approved_workflow", "stage_verification"],
    },
    "csh_discipline_conduct_gen_018": {
        "question": "Which approach best supports performance standards in a discipline-sensitive public-service unit?",
        "options": [
            "Set measurable expectations, monitor progress, and correct deviations before they become habitual.",
            "Assume standards will be understood without defining them in practical terms.",
            "Ignore repeated slippage so long as the unit meets a final deadline.",
            "Use different standards for similar officers based on convenience.",
        ],
        "explanation": "Performance standards are strongest when expectations are measurable, progress is monitored, and deviations are corrected early. That prevents weak practice from hardening into a discipline problem.",
        "keywords": ["performance_standards", "measurable_expectations", "progress_monitoring", "early_correction"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "performance_standards", "progress_monitoring", "early_correction"],
    },
    "csh_discipline_conduct_gen_020": {
        "question": "Which practice best preserves transparency when disciplinary decisions are taken?",
        "options": [
            "Use lawful criteria and document each decision step and its justification clearly.",
            "Rely on informal instructions so the process can move faster.",
            "Treat undocumented exceptions as acceptable when the outcome seems fair.",
            "Close the matter without recording how the decision was reached.",
        ],
        "explanation": "Transparency is preserved when disciplinary decisions are based on lawful criteria and each step is documented with a clear justification. That makes the process easier to review and defend.",
        "keywords": ["disciplinary_transparency", "lawful_criteria", "decision_justification", "reviewability"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "disciplinary_transparency", "lawful_criteria", "decision_justification"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 24",
        "",
        f"- Applied rewrites: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(f"- `{item['question_id']}` [{item['source_file']}]")
        lines.append(f"  - Old: {item['old_question']}")
        lines.append(f"  - New: {item['new_question']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def find_topic_files(root: Path):
    topics = load_json(TOPICS_FILE)
    mapping = {}
    for topic in topics.get("topics", []):
        topic_file = root / str(topic.get("file") or "")
        mapping[str(topic.get("id") or "").strip()] = topic_file
    return mapping


def apply_rewrites(root: Path):
    topic_files = find_topic_files(root)
    docs = {topic: load_json(path) for topic, path in topic_files.items() if path.exists()}
    applied = []

    for question_id, patch in REWRITES.items():
        found = False
        for topic_id, doc in docs.items():
            for subcategory in doc.get("subcategories", []):
                for question in safe_get_questions(subcategory):
                    if question.get("id") != question_id:
                        continue
                    old_question = question.get("question", "")
                    question.update(patch)
                    question["lastReviewed"] = "2026-04-03"
                    applied.append(
                        {
                            "question_id": question_id,
                            "source_topic": topic_id,
                            "source_subcategory": subcategory.get("id"),
                            "source_file": str(topic_files[topic_id].relative_to(root)).replace("\\", "/"),
                            "old_question": old_question,
                            "new_question": question.get("question", ""),
                        }
                    )
                    found = True
                    break
                if found:
                    break
            if found:
                break
        if not found:
            raise SystemExit(f"Question {question_id} not found")

    for topic_id, doc in docs.items():
        save_json(topic_files[topic_id], doc)

    return applied


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--log-json", type=Path, default=DEFAULT_LOG_JSON)
    parser.add_argument("--log-md", type=Path, default=DEFAULT_LOG_MD)
    return parser.parse_args()


def main():
    args = parse_args()
    applied = apply_rewrites(ROOT)
    payload = {"round": 24, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
