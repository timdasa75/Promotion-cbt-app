#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 23."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round23.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round23.md"

REWRITES = {
    "neg_dispute_law_gen_007": {
        "question": "A labour-dispute unit is introducing a revised grievance procedure. Which step best supports orderly transition?",
        "options": [
            "Brief officers on the new procedure, assign responsibilities, and monitor early implementation.",
            "Apply the new procedure immediately without guidance because the rule has already been approved.",
            "Let each case officer decide when to adopt the revised process.",
            "Suspend reporting requirements until the transition period is over.",
        ],
        "explanation": "A revised grievance procedure is implemented most effectively when officers are briefed, responsibilities are assigned, and early implementation is monitored. That keeps the transition consistent and reduces avoidable disputes.",
        "keywords": ["grievance_procedure", "implementation_transition", "role_assignment", "early_monitoring"],
        "tags": ["leadership_management", "neg_dispute_law", "grievance_procedure", "implementation_transition", "early_monitoring"],
    },
    "neg_dispute_law_gen_017": {
        "question": "Which recordkeeping practice best protects the integrity of a labour-dispute case file?",
        "options": [
            "Keep all submissions, hearing notes, and correspondence linked in one traceable case record.",
            "Store supporting documents separately without cross-referencing them to the main case file.",
            "Rely on verbal updates once the main complaint has been recorded.",
            "Remove superseded documents without retaining an audit trail of the change.",
        ],
        "explanation": "Case-file integrity is strongest when submissions, hearing notes, and correspondence remain linked in one traceable record. That preserves the evidentiary trail needed for review and appeal.",
        "keywords": ["case_file_integrity", "hearing_notes", "traceable_record", "evidentiary_trail"],
        "tags": ["leadership_management", "neg_dispute_law", "case_file_integrity", "traceable_record", "evidentiary_trail"],
    },
    "neg_dispute_law_gen_025": {
        "question": "After a labour dispute has been resolved, which practice best sustains implementation of the agreement?",
        "options": [
            "Assign follow-up owners, document milestones, and review compliance against the agreed terms.",
            "Assume implementation will happen automatically once the parties sign the agreement.",
            "Delay follow-up until one side complains that the settlement is not working.",
            "Treat verbal reassurances as enough evidence that the agreement is being implemented.",
        ],
        "explanation": "Agreement implementation is sustained when follow-up owners are assigned, milestones are documented, and compliance is reviewed against the agreed terms. That keeps the settlement active beyond signature.",
        "keywords": ["settlement_follow_up", "implementation_milestones", "compliance_review", "agreement_terms"],
        "tags": ["leadership_management", "neg_dispute_law", "settlement_follow_up", "implementation_milestones", "compliance_review"],
    },
    "neg_dispute_law_gen_035": {
        "question": "Which routine best preserves continuity in the records of an ongoing dispute hearing?",
        "options": [
            "Update the hearing record after each sitting and note the next action required from each party.",
            "Wait until the dispute is fully concluded before organizing the hearing record.",
            "Record only final decisions because interim exchanges are unlikely to matter later.",
            "Let each representative keep separate notes without maintaining a shared official record.",
        ],
        "explanation": "Continuity is preserved when the hearing record is updated after each sitting and the next required action is noted for each party. That keeps the dispute trail clear throughout the process.",
        "keywords": ["hearing_record_continuity", "ongoing_dispute", "next_actions", "dispute_trail"],
        "tags": ["leadership_management", "neg_dispute_law", "hearing_record_continuity", "ongoing_dispute", "dispute_trail"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 23",
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
    payload = {"round": 23, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
