#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 35."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round35.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round35.md"

REWRITES = {
    "csh_ap_071": {
        "question": "Which arm of government is responsible for the day-to-day management of government?",
        "options": [
            "The Executive arm.",
            "The Legislature.",
            "The Judiciary.",
            "Local government councils.",
        ],
        "correct": 0,
        "explanation": "The Executive arm is responsible for the day-to-day management of government. It conceives, formulates, executes, and monitors public policy, unlike the Legislature, which makes laws, or the Judiciary, which interprets them.",
        "keywords": ["executive_arm", "day_to_day_management", "arms_of_government", "public_policy_execution"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "executive_arm", "arms_of_government", "public_policy_execution"],
    },
    "csh_ap_081": {
        "question": "What is the term for a collection of official correspondence and documents on a particular subject?",
        "options": [
            "A note.",
            "A memorandum.",
            "A file.",
            "A folder.",
        ],
        "correct": 2,
        "explanation": "A file is the collection of official correspondence and related documents kept together on a particular subject. It is the standard unit for organizing and retrieving official records in office procedure.",
        "keywords": ["file_definition", "official_correspondence", "records_management", "subject_file"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "file_definition", "records_management", "subject_file"],
    },
    "csh_disc_010": {
        "question": "What does insubordination mean in the civil service?",
        "options": [
            "Working overtime without approval.",
            "Refusing to obey lawful instructions from a superior officer.",
            "Reporting late for duty on one occasion.",
            "Applying for promotion through the proper channel.",
        ],
        "correct": 1,
        "explanation": "Insubordination means refusing to obey a lawful instruction from a superior officer. It is treated as a misconduct issue because it undermines lawful authority and disciplined service conduct.",
        "keywords": ["insubordination", "lawful_instruction", "superior_officer", "misconduct"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "insubordination", "lawful_instruction", "misconduct"],
    },
    "csh_disc_063": {
        "question": "Which document is used for formal communication with other Ministries, parastatals, and the public?",
        "options": [
            "A confidential report.",
            "A memorandum.",
            "An official letter.",
            "A personal conversation note.",
        ],
        "correct": 2,
        "explanation": "An official letter is used for formal communication with other Ministries, parastatals, and the public. A memorandum is for internal communication within the same ministry or department.",
        "keywords": ["official_letter", "formal_communication", "external_correspondence", "memorandum_difference"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "official_letter", "external_correspondence", "memorandum_difference"],
    },
    "csh_disc_069": {
        "question": "What is the main purpose of an official letter in the Civil Service?",
        "options": [
            "To communicate formally with other Ministries, parastatals, and the public.",
            "To serve as a confidential report to be kept off the record.",
            "To record a private conversation between officers.",
            "To replace internal memoranda used within one department.",
        ],
        "correct": 0,
        "explanation": "The main purpose of an official letter is formal external communication. It is used when a ministry or department communicates with other Ministries, parastatals, agencies, or members of the public.",
        "keywords": ["official_letter_purpose", "formal_external_communication", "civil_service_correspondence", "ministries_public"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "official_letter_purpose", "formal_external_communication", "civil_service_correspondence"],
    },
    "csh_duty_054": {
        "question": "When an officer who is not a Revenue Collector or Sub-Accounting Officer receives money in the course of duty, what is specifically forbidden?",
        "options": [
            "Supporting the lodgement with a paying-in form.",
            "Delaying the lodgement of the money.",
            "Lodging the money with a Sub-Accounting Officer.",
            "Ensuring that an official receipt is issued.",
        ],
        "correct": 1,
        "explanation": "Delaying the lodgement of the money is specifically forbidden. Financial Regulation 218 requires such money to be lodged without delay once it is received in the course of official duty.",
        "keywords": ["financial_regulation_218", "lodgement_without_delay", "official_money_handling", "sub_accounting_officer"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "financial_regulation_218", "lodgement_without_delay", "official_money_handling"],
    },
    "csh_principle_055": {
        "question": "What is the principal accountability of the Executive arm of government?",
        "options": [
            "The day-to-day management of government.",
            "Making laws for the federation.",
            "Adjudicating legal disputes.",
            "Confirming diplomatic appointments.",
        ],
        "correct": 0,
        "explanation": "The Executive arm is principally accountable for the day-to-day management of government. That includes policy formulation, implementation, and oversight of public administration.",
        "keywords": ["executive_accountability", "day_to_day_management", "policy_implementation", "public_administration"],
        "tags": ["civil_service_admin", "csh_principles_ethics", "executive_accountability", "policy_implementation", "public_administration"],
    },
    "csh_it_063": {
        "question": "Under Financial Regulation 2001, what is the primary purpose of government vehicles?",
        "options": [
            "To carry out official duties of government.",
            "To provide personal convenience for public officers.",
            "To support recreational movement by staff.",
            "To operate as commercial transport services.",
        ],
        "correct": 0,
        "explanation": "Financial Regulation 2001 provides that government vehicles are for official duties of government. They are not provided for personal convenience, recreation, or commercial use.",
        "keywords": ["government_vehicles", "financial_regulation_2001", "official_duties", "public_assets"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "government_vehicles", "financial_regulation_2001", "official_duties"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 35",
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
    payload = {"round": 35, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
