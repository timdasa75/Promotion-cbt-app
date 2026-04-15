#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 27."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round27.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round27.md"

REWRITES = {
    "eth_general_gen_002": {
        "question": "Which daily work habit best helps a public officer keep routine decisions ethically sound?",
        "options": [
            "Apply the approved rules consistently and record the reason for sensitive decisions.",
            "Rely on personal instinct even when the relevant rule or procedure is available.",
            "Adjust ethical standards case by case to suit operational pressure.",
            "Treat undocumented exceptions as acceptable if the outcome appears beneficial.",
        ],
        "explanation": "Routine decisions remain ethically sound when officers apply the approved rules consistently and record the reason for sensitive decisions. That reduces hidden bias and makes the decision easier to review.",
        "keywords": ["ethical_decision_habit", "decision_reasons", "consistent_rules", "reviewability"],
        "tags": ["civil_service_admin", "eth_general", "ethical_decision_habit", "decision_reasons", "reviewability"],
    },
    "eth_general_gen_037": {
        "question": "Which governance practice most strengthens ethical standards across a public institution?",
        "options": [
            "Use clear reporting channels, periodic ethics reviews, and documented follow-up on breaches.",
            "Assume that staff awareness alone is enough once an ethics code has been circulated.",
            "Leave each department to define its own ethical controls without central oversight.",
            "Treat minor ethical lapses as too small to record or review institutionally.",
        ],
        "explanation": "Institutional ethics governance is strongest when reporting channels are clear, reviews happen periodically, and breaches are followed up in documented ways. Ethical standards need visible oversight, not only written principles.",
        "keywords": ["ethics_governance", "reporting_channels", "ethics_reviews", "breach_follow_up"],
        "tags": ["civil_service_admin", "eth_general", "ethics_governance", "reporting_channels", "breach_follow_up"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 27",
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
    payload = {"round": 27, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
