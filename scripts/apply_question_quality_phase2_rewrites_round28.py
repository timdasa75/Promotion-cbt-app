#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 28."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round28.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round28.md"

REWRITES = {
    "eth_misconduct_gen_002": {
        "question": "What is the best first controlled response when misconduct is suspected in a public office?",
        "options": [
            "Secure the facts, preserve the relevant records, and begin review under the approved process.",
            "Announce the officer's guilt before the available records have been checked.",
            "Delay all action until multiple unrelated complaints build up.",
            "Handle the matter informally without creating any review trail.",
        ],
        "explanation": "A suspected misconduct case should begin with fact security, record preservation, and review under the approved process. That protects fairness, evidence, and the integrity of any later disciplinary decision.",
        "keywords": ["suspected_misconduct", "record_preservation", "approved_review_process", "fairness"],
        "tags": ["civil_service_admin", "eth_misconduct", "suspected_misconduct", "record_preservation", "approved_review_process"],
    },
    "eth_misconduct_gen_037": {
        "question": "Which governance arrangement best strengthens oversight of misconduct cases in a public institution?",
        "options": [
            "Use a documented review process with case records, escalation points, and follow-up on disciplinary decisions.",
            "Allow each supervisor to manage misconduct cases privately without a common reporting standard.",
            "Treat concluded cases as closed without checking whether the imposed measures were actually implemented.",
            "Leave serious cases undocumented once senior officers have given informal direction.",
        ],
        "explanation": "Misconduct governance is strongest when cases move through a documented review process with clear escalation points and follow-up on decisions. Oversight depends on visible records and accountable implementation.",
        "keywords": ["misconduct_governance", "case_review_process", "escalation_points", "disciplinary_follow_up"],
        "tags": ["civil_service_admin", "eth_misconduct", "misconduct_governance", "case_review_process", "disciplinary_follow_up"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 28",
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
    payload = {"round": 28, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
