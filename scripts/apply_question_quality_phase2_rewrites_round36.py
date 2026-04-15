#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 36."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round36.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round36.md"

REWRITES = {
    "csh_principle_062": {
        "question": "Under Financial Regulation 2001, what is the chief objective of providing government vehicles?",
        "options": [
            "To support official duties of government.",
            "To provide personal transport for public officers.",
            "To serve recreational outings by staff.",
            "To operate as commercial transport for revenue generation.",
        ],
        "correct": 0,
        "explanation": "Financial Regulation 2001 states that government vehicles are provided for official duties of government. They are public assets meant to support government work, not personal, recreational, or commercial use.",
        "keywords": ["government_vehicles", "financial_regulation_2001", "official_duties", "public_assets"],
        "tags": ["civil_service_admin", "csh_principles_ethics", "government_vehicles", "financial_regulation_2001", "public_assets"],
    },
    "csh_pt_037": {
        "question": "Which PSR rules cover the definition and objectives of staff development?",
        "options": [
            "Rules 070101 and 070102.",
            "Rules 020810 and 020811.",
            "Rules 040102 and 040103.",
            "Rules 100401 and 100402.",
        ],
        "correct": 0,
        "explanation": "PSR Rule 070101 defines staff development, while Rule 070102 states its objectives. Together, they set out both what staff development means and why it is undertaken in the public service.",
        "keywords": ["staff_development", "psr_070101", "psr_070102", "training_policy"],
        "tags": ["civil_service_admin", "csh_performance_training", "staff_development", "psr_070101", "psr_070102"],
    },
    "csh_sdg_053": {
        "question": "What is forbidden when an officer who is not a Revenue Collector or Sub-Accounting Officer handles money received in the course of official duty?",
        "options": [
            "Lodging the money with a Sub-Accounting Officer.",
            "Issuing an official receipt where required.",
            "Delaying the lodgement of the money.",
            "Supporting the lodgement with a paying-in form.",
        ],
        "correct": 2,
        "explanation": "Delaying the lodgement of the money is forbidden. Financial Regulation 218 requires the money to be lodged without delay once it is received in the course of official duty.",
        "keywords": ["lodgement_without_delay", "financial_regulation_218", "official_money_handling", "service_integrity"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "lodgement_without_delay", "financial_regulation_218", "official_money_handling"],
    },
    "eth_general_gen_073": {
        "question": "What is the term for a set of official correspondence and documents kept together on one subject?",
        "options": [
            "A folder.",
            "A file.",
            "A memorandum.",
            "A note.",
        ],
        "correct": 1,
        "explanation": "A file is the set of official correspondence and related documents kept together on a particular subject. It is the standard records unit used to organize, retrieve, and preserve office documents.",
        "keywords": ["file_definition", "official_records", "subject_matter", "records_unit"],
        "tags": ["civil_service_admin", "eth_general", "file_definition", "official_records", "records_unit"],
    },
    "ethics_107": {
        "question": "What is the duty of Sub-Accounting Officers regarding receipt and licence books?",
        "options": [
            "To leave them unsecured until needed for use.",
            "To ensure their safe custody and proper use.",
            "To dispose of them immediately after one issue cycle.",
            "To print replacement books privately when stocks run low.",
        ],
        "correct": 1,
        "explanation": "Sub-Accounting Officers are responsible for the safe custody and proper use of receipt and licence books. Those controls protect official revenue documents from misuse, loss, or unauthorized handling.",
        "keywords": ["sub_accounting_officer", "receipt_books", "licence_books", "safe_custody"],
        "tags": ["civil_service_admin", "eth_values_integrity", "sub_accounting_officer", "receipt_books", "safe_custody"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 36",
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
                    question["lastReviewed"] = "2026-04-05"
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
    payload = {"round": 36, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
