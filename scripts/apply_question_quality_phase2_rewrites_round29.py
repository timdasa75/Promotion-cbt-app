#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 29."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round29.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round29.md"

REWRITES = {
    "csh_ap_005": {
        "question": "In official registry practice, who owns official documents created or received in government service?",
        "options": [
            "The officer who drafted or received them.",
            "The Head of Department personally.",
            "The Government.",
            "The public once the documents exist in office records.",
        ],
        "correct": 2,
        "explanation": "Official documents created or received in government service belong to the Government, not to individual officers. That is why they must be handled, stored, and released only under official rules.",
        "keywords": ["official_documents", "government_ownership", "registry_practice", "records_control"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "official_documents", "government_ownership", "records_control"],
    },
    "csh_duty_012": {
        "question": "What is an officer's primary duty regarding official documents in their custody?",
        "options": [
            "To treat them as personal working papers once assigned.",
            "To safeguard them as government property and use them only for official purposes.",
            "To share them freely with any interested colleague.",
            "To remove them from office whenever home review seems convenient.",
        ],
        "correct": 1,
        "explanation": "An officer must safeguard official documents as government property and use them only for official purposes. Custody creates responsibility, not personal ownership or unrestricted use.",
        "keywords": ["document_custody", "officer_duty", "government_property", "official_use"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "document_custody", "officer_duty", "official_use"],
    },
    "csh_disc_068": {
        "question": "What should a civil servant do if an assigned file has remained on the desk too long without action?",
        "options": [
            "Report the delay to a superior officer and return the file for proper registry control.",
            "Keep the file until someone asks about it.",
            "Pass it quietly to a colleague without recording the transfer.",
            "Dispose of it so the backlog is reduced.",
        ],
        "correct": 0,
        "explanation": "A file that has stayed too long without action should be reported to a superior and returned for proper registry control. Delay without escalation weakens accountability and increases the risk of lost or neglected official business.",
        "keywords": ["delayed_file", "registry_control", "escalation", "official_backlog"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "delayed_file", "registry_control", "escalation"],
    },
    "csh_pt_053": {
        "question": "What should an officer do when papers or documents are delivered to the wrong desk by mistake?",
        "options": [
            "Keep them until the intended recipient comes looking for them.",
            "Send them on without checking where they should go.",
            "Identify the correct destination and seek direction from a superior or registry to reroute them properly.",
            "Discard them if they do not relate to the officer's immediate work.",
        ],
        "correct": 2,
        "explanation": "Misdirected papers should be identified and rerouted properly with direction from a superior or the registry where necessary. Correct routing preserves document control and reduces the risk of loss or unauthorized access.",
        "keywords": ["misdirected_documents", "rerouting", "registry_direction", "document_control"],
        "tags": ["civil_service_admin", "csh_performance_training", "misdirected_documents", "rerouting", "document_control"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 29",
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
    payload = {"round": 29, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
