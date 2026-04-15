#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 25."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round25.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round25.md"

REWRITES = {
    "eth_anti_corruption_gen_002": {
        "question": "Which control most effectively prevents routine procurement decisions from sliding into corrupt practice?",
        "options": [
            "Use clear approval thresholds, document each step, and separate key duties among officers.",
            "Let one trusted officer handle the process from request to payment without oversight.",
            "Skip documentation when the transaction appears too small to attract attention.",
            "Treat personal familiarity with vendors as a sufficient safeguard against abuse.",
        ],
        "explanation": "Corrupt practice is best prevented when approval thresholds are clear, each step is documented, and key duties are separated among officers. Those controls reduce opportunity, concealment, and unchecked discretion.",
        "keywords": ["anti_corruption_controls", "segregation_of_duties", "approval_thresholds", "procurement_integrity"],
        "tags": ["civil_service_admin", "eth_anti_corruption", "anti_corruption_controls", "segregation_of_duties", "approval_thresholds"],
    },
    "eth_anti_corruption_gen_037": {
        "question": "Which governance measure best strengthens oversight of anti-corruption compliance in a public office?",
        "options": [
            "Require periodic reporting, independent review, and follow-up on identified control weaknesses.",
            "Leave compliance oversight to informal assurances from unit heads.",
            "Treat unresolved audit observations as low priority once operations continue normally.",
            "Allow each unit to define its own anti-corruption reporting standard without coordination.",
        ],
        "explanation": "Oversight is stronger when anti-corruption compliance is supported by periodic reporting, independent review, and follow-up on control weaknesses. Governance depends on visible review, not informal assurances alone.",
        "keywords": ["anti_corruption_governance", "periodic_reporting", "independent_review", "control_weakness_follow_up"],
        "tags": ["civil_service_admin", "eth_anti_corruption", "anti_corruption_governance", "periodic_reporting", "independent_review"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 25",
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
    payload = {"round": 25, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
