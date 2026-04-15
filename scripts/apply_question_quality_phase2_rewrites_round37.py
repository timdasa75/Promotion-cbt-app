#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 37."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round37.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round37.md"

REWRITES = {
    "csh_disc_073": {
        "question": "What is the main purpose of an official letter in the Civil Service?",
        "options": [
            "To record a personal conversation between officers.",
            "To communicate with other Ministries, parastatals, and the public.",
            "To serve as a confidential report for internal circulation only.",
            "To replace an internal memorandum within one department.",
        ],
        "correct": 1,
        "explanation": "An official letter is used for formal communication with other Ministries, parastatals, agencies, and the public. It is different from a memorandum, which is used for communication within the same department or ministry.",
        "keywords": ["official_letter_purpose", "formal_correspondence", "external_communication", "civil_service_letters"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "official_letter_purpose", "formal_correspondence", "civil_service_letters"],
    },
    "csh_ap_043": {
        "question": "Under PSR 020415, what does an internship help to enhance?",
        "options": [
            "Political campaigning skills.",
            "Academic, career, professional, and personal development.",
            "Personal financial assets.",
            "Ability to bypass formal service procedures.",
        ],
        "correct": 1,
        "explanation": "PSR 020415 presents internship as structured experience that helps to enhance academic, career, professional, and personal development while also building practical skills relevant to service work.",
        "keywords": ["internship", "psr_020415", "professional_development", "structured_experience"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "internship", "psr_020415", "professional_development"],
    },
    "csh_ap_062": {
        "question": "What core element of proper financial management must an Accounting Officer secure in a self-accounting unit?",
        "options": [
            "Transparency and accountability in financial operations.",
            "Minimal document-keeping so transactions can be processed faster.",
            "Secret accounts that avoid external review.",
            "Freedom from audit oversight once cashbooks are balanced.",
        ],
        "correct": 0,
        "explanation": "An Accounting Officer must secure transparency and accountability in financial operations. Proper financial management in a self-accounting unit depends on clear records, observance of rules, and reviewable reporting.",
        "keywords": ["accounting_officer", "self_accounting_unit", "financial_transparency", "financial_accountability"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "accounting_officer", "financial_transparency", "financial_accountability"],
    },
    "csh_ap_068": {
        "question": "Which of the following is NOT a characteristic of good governance?",
        "options": [
            "Transparency.",
            "Autocracy.",
            "Rule of law.",
            "Accountability.",
        ],
        "correct": 1,
        "explanation": "Autocracy is not a characteristic of good governance. Good governance is associated with transparency, accountability, rule of law, participation, responsiveness, and related principles that restrain arbitrary power.",
        "keywords": ["good_governance", "autocracy", "rule_of_law", "accountability"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "good_governance", "autocracy", "rule_of_law"],
    },
    "csh_ap_102": {
        "question": "What is a dispatch book in registry practice?",
        "options": [
            "A record of outgoing official correspondence.",
            "A personal diary kept by registry staff.",
            "A voucher used for processing payments.",
            "A list of approved procurement items.",
        ],
        "correct": 0,
        "explanation": "A dispatch book is the record used to track outgoing official correspondence. It supports registry accountability by showing what was sent, when it was sent, and through which channel.",
        "keywords": ["dispatch_book", "registry_practice", "outgoing_correspondence", "records_tracking"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "dispatch_book", "registry_practice", "records_tracking"],
    },
    "csh_duty_060": {
        "question": "What percentage of recruitment is reserved for persons with disabilities under the rule cited in this item?",
        "options": [
            "2%.",
            "15%.",
            "10%.",
            "5%.",
        ],
        "correct": 3,
        "explanation": "The rule cited in the item reserves five percent of recruitment for persons with disabilities. The question tests the specific quota, so the stem should ask directly for the percentage rather than for a definition.",
        "keywords": ["disability_recruitment_quota", "five_percent", "inclusive_recruitment", "public_service_rule"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "disability_recruitment_quota", "five_percent", "inclusive_recruitment"],
    },
    "csh_it_056": {
        "question": "What is the duty of every officer regarding the Public Service Rules and other extant regulations and circulars?",
        "options": [
            "To ignore them when they seem inconvenient.",
            "To challenge them whenever the officer personally disagrees with them.",
            "To acquaint himself or herself with them.",
            "To leave responsibility for them entirely to subordinates.",
        ],
        "correct": 2,
        "explanation": "Every officer has a duty to acquaint himself or herself with the Public Service Rules and other extant regulations and circulars. That obligation ensures officers understand the rules governing their conduct and responsibilities.",
        "keywords": ["public_service_rules", "officer_duty", "regulations_and_circulars", "rule_awareness"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "public_service_rules", "officer_duty", "rule_awareness"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 37",
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
    payload = {"round": 37, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
