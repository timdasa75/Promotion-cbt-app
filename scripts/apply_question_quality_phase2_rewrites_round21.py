#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 21."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round21.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round21.md"

REWRITES = {
    "neg_principles_outcomes_gen_002": {
        "question": "Which negotiation practice best preserves compliance with agreed rules and standards?",
        "options": [
            "Use lawful criteria and document each decision step transparently.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without recorded justification.",
            "Close cases without validating facts or required records.",
        ],
        "explanation": "Compliance in negotiation is best preserved when lawful criteria are applied consistently and each decision step is documented transparently. That makes the process easier to justify and review.",
        "keywords": ["negotiation_compliance", "lawful_criteria", "decision_documentation", "reviewability"],
        "tags": ["leadership_management", "neg_principles_outcomes", "negotiation_compliance", "lawful_criteria", "decision_documentation"],
    },
    "neg_principles_outcomes_gen_007": {
        "question": "During a negotiated reform process, which step best supports effective change management?",
        "options": [
            "Sequence reforms with communication, training, and monitoring.",
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
        ],
        "explanation": "Effective change management in a negotiated reform process requires sequencing reforms with communication, training, and monitoring so that implementation stays orderly and people understand what is changing.",
        "keywords": ["change_management", "negotiated_reform", "communication", "monitoring"],
        "tags": ["leadership_management", "neg_principles_outcomes", "change_management", "negotiated_reform", "monitoring"],
    },
    "neg_principles_outcomes_gen_017": {
        "question": "What is the most reliable way to maintain record management during negotiation follow-up?",
        "options": [
            "Maintain accurate files and update status at each control point.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Prioritize convenience over policy and legal requirements.",
        ],
        "explanation": "Record management during negotiation follow-up is strongest when files are kept accurate and their status is updated at each control point. That preserves traceability across the process.",
        "keywords": ["record_management", "negotiation_follow_up", "status_updates", "traceability"],
        "tags": ["leadership_management", "neg_principles_outcomes", "record_management", "negotiation_follow_up", "traceability"],
    },
    "neg_principles_outcomes_gen_025": {
        "question": "Which leadership habit helps sustain change management after a negotiation outcome has been agreed?",
        "options": [
            "Sequence reforms with communication, training, and monitoring.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Prioritize convenience over policy and legal requirements.",
        ],
        "explanation": "Sustaining change after a negotiated outcome requires sequencing the reforms, communicating expectations clearly, training the people involved, and monitoring implementation over time.",
        "keywords": ["post_agreement_change", "leadership_habit", "training", "implementation_monitoring"],
        "tags": ["leadership_management", "neg_principles_outcomes", "post_agreement_change", "training", "implementation_monitoring"],
    },
    "neg_principles_outcomes_gen_035": {
        "question": "Which routine best sustains record management across negotiation processes?",
        "options": [
            "Maintain accurate files and update status at each control point.",
            "Bypass review and approval controls to save time.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
        ],
        "explanation": "Record management is sustained by keeping files accurate and updating their status at each control point, so negotiation records remain complete and current throughout the process.",
        "keywords": ["record_management_routine", "control_points", "file_accuracy", "negotiation_records"],
        "tags": ["leadership_management", "neg_principles_outcomes", "record_management_routine", "control_points", "negotiation_records"],
    },
    "neg_principles_outcomes_gen_037": {
        "question": "Which approach best strengthens governance in negotiation processes?",
        "options": [
            "Apply approved negotiation procedures and maintain complete records.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference.",
        ],
        "explanation": "Governance in negotiation processes is strongest when approved procedures are followed and complete records are maintained, because that supports oversight, consistency, and accountability.",
        "keywords": ["negotiation_governance", "approved_procedures", "complete_records", "oversight"],
        "tags": ["leadership_management", "neg_principles_outcomes", "negotiation_governance", "approved_procedures", "oversight"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 21",
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
    payload = {"round": 21, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
