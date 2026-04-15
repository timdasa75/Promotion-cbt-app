#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 32."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round32.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round32.md"

REWRITES = {
    "ca_general_009": {
        "question": "Which Nigerian state is popularly known as the 'Land of Equity'?",
        "options": ["Kano.", "Kwara.", "Ekiti.", "Kebbi."],
        "correct": 3,
        "explanation": "Kebbi State is popularly identified by the nickname 'Land of Equity'. The item tests recognition of state sobriquets used in Nigerian civic and general-affairs contexts.",
        "keywords": ["kebbi", "land_of_equity", "state_sobriquet", "nigerian_states"],
        "tags": ["current_affairs", "ca_general", "kebbi", "land_of_equity", "state_sobriquet"],
    },
    "ca_general_031": {
        "question": "Which Nigerian state is popularly called the 'Land of Beauty'?",
        "options": ["Taraba.", "Bauchi.", "Adamawa.", "Niger."],
        "correct": 0,
        "explanation": "Taraba State is widely associated with the nickname 'Land of Beauty', alongside the broader tourism branding that highlights its natural landscape. This question checks state-identity knowledge in current affairs.",
        "keywords": ["taraba", "land_of_beauty", "state_sobriquet", "tourism_identity"],
        "tags": ["current_affairs", "ca_general", "taraba", "land_of_beauty", "state_sobriquet"],
    },
    "ca_general_023": {
        "question": "Who was Nigeria's Vice President in 2025?",
        "options": ["Kashim Shettima.", "Yemi Osinbajo.", "Atiku Abubakar.", "Namadi Sambo."],
        "correct": 0,
        "explanation": "Kashim Shettima was Nigeria's Vice President in 2025. He assumed office on May 29, 2023, alongside President Bola Ahmed Tinubu, so he remained the incumbent throughout 2025.",
        "keywords": ["vice_president_2025", "kashim_shettima", "nigeria_executive", "office_holders"],
        "tags": ["current_affairs", "ca_general", "vice_president_2025", "kashim_shettima", "office_holders"],
    },
    "ca_general_033": {
        "question": "Who was Nigeria's Senate President in 2025?",
        "options": ["Bukola Saraki.", "David Mark.", "Godswill Akpabio.", "Ahmed Lawan."],
        "correct": 2,
        "explanation": "Godswill Akpabio was Nigeria's Senate President in 2025. He was elected to the office in June 2023, so he held that position during the 2025 period referenced in the question.",
        "keywords": ["senate_president_2025", "godswill_akpabio", "nigeria_legislature", "office_holders"],
        "tags": ["current_affairs", "ca_general", "senate_president_2025", "godswill_akpabio", "office_holders"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 32",
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
                    question["lastReviewed"] = "2026-04-04"
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
    payload = {"round": 32, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
