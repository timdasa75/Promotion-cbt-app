#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 26."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round26.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round26.md"

REWRITES = {
    "eth_conflict_interest_gen_002": {
        "question": "Which control best helps an officer manage a conflict of interest before it compromises a public decision?",
        "options": [
            "Disclose the interest promptly, step back from the decision, and ensure the recusal is recorded.",
            "Keep the interest private if the officer believes the final decision will still be fair.",
            "Participate fully in the decision and explain the relationship only if someone later asks.",
            "Rely on personal integrity alone without using the formal disclosure process.",
        ],
        "explanation": "A conflict of interest is best controlled when the interest is disclosed promptly, the officer steps back from the decision, and the recusal is recorded. That protects the decision from hidden influence and preserves trust.",
        "keywords": ["conflict_disclosure", "recusal", "decision_integrity", "formal_record"],
        "tags": ["civil_service_admin", "eth_conflict_interest", "conflict_disclosure", "recusal", "decision_integrity"],
    },
    "eth_conflict_interest_gen_037": {
        "question": "Which governance practice most strengthens oversight of conflict-of-interest compliance in a public office?",
        "options": [
            "Maintain a reviewable disclosure register and require periodic checks on declared interests and recusals.",
            "Leave each officer to decide privately when a declared interest still needs monitoring.",
            "Treat disclosure as a one-time formality with no need for later review or follow-up.",
            "Allow senior officials to waive disclosure rules informally when operations seem urgent.",
        ],
        "explanation": "Conflict-of-interest governance is strongest when the office keeps a reviewable disclosure register and checks declared interests and recusals periodically. Oversight depends on visible monitoring, not one-time declarations alone.",
        "keywords": ["conflict_register", "recusal_monitoring", "oversight_review", "periodic_checks"],
        "tags": ["civil_service_admin", "eth_conflict_interest", "conflict_register", "recusal_monitoring", "oversight_review"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 26",
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
    payload = {"round": 26, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
