#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 38."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round38.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round38.md"

REWRITES = {
    "csh_principle_052": {
        "question": "Which of the following is prohibited under the Principle of Integrity?",
        "options": [
            "Exercising leadership responsibly.",
            "Being polite to members of the public.",
            "Nepotism, corruption, influence peddling, and illicit enrichment.",
            "Working diligently in the public interest.",
        ],
        "correct": 2,
        "explanation": "The Principle of Integrity prohibits the use of public office for personal gain, including nepotism, corruption, influence peddling, and illicit enrichment. Those acts undermine fairness, public trust, and ethical service.",
        "keywords": ["principle_of_integrity", "prohibited_conduct", "corruption", "illicit_enrichment"],
        "tags": ["civil_service_admin", "csh_principles_ethics", "principle_of_integrity", "prohibited_conduct", "corruption"],
    },
    "csh_pt_003": {
        "question": "Which PSR rule defines the standard incremental date for an officer appointed or promoted in the Federal Public Service?",
        "options": [
            "Rule 040101.",
            "Rule 040203.",
            "Rule 040206.",
            "Rule 040208.",
        ],
        "correct": 1,
        "explanation": "Rule 040203 defines the standard incremental date. It governs how the incremental date is fixed for an officer appointed or promoted in the Federal Public Service.",
        "keywords": ["incremental_date", "psr_040203", "appointment_promotion", "emoluments"],
        "tags": ["civil_service_admin", "csh_performance_training", "incremental_date", "psr_040203", "appointment_promotion"],
    },
    "csh_pt_005": {
        "question": "Under PSR 070105, which category of training is a long-term, fully sponsored postgraduate study considered crucial to the officer and the MDA's mandate?",
        "options": [
            "Category B.",
            "Category C.",
            "Category A.",
            "Category D.",
        ],
        "correct": 2,
        "explanation": "Category A under PSR 070105 is the long-term, fully sponsored postgraduate training considered crucial and beneficial both to the officer and to the MDA's mandate.",
        "keywords": ["category_a_training", "psr_070105", "postgraduate_study", "mda_mandate"],
        "tags": ["civil_service_admin", "csh_performance_training", "category_a_training", "psr_070105", "postgraduate_study"],
    },
    "csh_pt_062": {
        "question": "What is the consequence for a public officer found to be a member of a secret society?",
        "options": [
            "A written warning.",
            "Demotion.",
            "Serious misconduct that may lead to dismissal.",
            "Immediate suspension without further process.",
        ],
        "correct": 2,
        "explanation": "Membership of a secret society is treated as serious misconduct. Under the rule cited in the item, the consequence may include dismissal from the service.",
        "keywords": ["secret_society", "serious_misconduct", "dismissal", "public_officer_conduct"],
        "tags": ["civil_service_admin", "csh_performance_training", "secret_society", "serious_misconduct", "dismissal"],
    },
    "csh_pt_064": {
        "question": "If an officer negligently disregards Regulation 719 when accepting a cheque that is later dishonoured, what is the consequence?",
        "options": [
            "Suspension from duty.",
            "A formal warning.",
            "Surcharge for the full amount.",
            "Automatic referral to the Auditor-General.",
        ],
        "correct": 2,
        "explanation": "Where Regulation 719 is negligently disregarded and the cheque is later dishonoured, the officer is surcharged for the full amount. The rule fixes personal financial responsibility for the loss.",
        "keywords": ["dishonoured_cheque", "regulation_719", "surcharge", "financial_responsibility"],
        "tags": ["civil_service_admin", "csh_performance_training", "dishonoured_cheque", "regulation_719", "surcharge"],
    },
    "eth_code_conduct_gen_065": {
        "question": "Which of the following is prohibited under the Principle of Integrity?",
        "options": [
            "Nepotism, corruption, influence peddling, and illicit enrichment.",
            "Responsible leadership in public service.",
            "Working hard in the public interest.",
            "Courtesy to members of the public.",
        ],
        "correct": 0,
        "explanation": "The Principle of Integrity prohibits using public office for personal gain. That includes nepotism, corruption, influence peddling, and illicit enrichment.",
        "keywords": ["integrity_prohibition", "public_office_abuse", "nepotism", "corruption"],
        "tags": ["civil_service_admin", "eth_code_conduct", "integrity_prohibition", "public_office_abuse", "corruption"],
    },
    "eth_code_conduct_gen_068": {
        "question": "What is the main accountability of the Political Head of a Ministry regarding its activities?",
        "options": [
            "To supervise and control the activities of the ministry.",
            "To conduct all internal audits personally.",
            "To manage every day-to-day financial transaction directly.",
            "To approve every contract without delegation.",
        ],
        "correct": 0,
        "explanation": "The Political Head is accountable for supervising and controlling the activities of the ministry. That responsibility covers oversight and direction, not the personal handling of every operational transaction.",
        "keywords": ["political_head", "ministry_oversight", "supervise_and_control", "ministerial_accountability"],
        "tags": ["civil_service_admin", "eth_code_conduct", "political_head", "ministry_oversight", "ministerial_accountability"],
    },
    "ethics_088": {
        "question": "What percentage of recruitment is reserved for persons with disabilities under the rule cited in this item?",
        "options": [
            "15%.",
            "5%.",
            "2%.",
            "10%.",
        ],
        "correct": 1,
        "explanation": "The rule cited in the item reserves five percent of recruitment for persons with disabilities. The point being tested is the quota itself, so the question should ask directly for the percentage.",
        "keywords": ["disability_quota", "five_percent", "inclusive_recruitment", "public_service_rule"],
        "tags": ["civil_service_admin", "eth_values_integrity", "disability_quota", "five_percent", "inclusive_recruitment"],
    },
    "ethics_094": {
        "question": "What is the duty of Sub-Accounting Officers regarding receipt and licence books?",
        "options": [
            "To print replacement books privately when needed.",
            "To dispose of the books immediately after use.",
            "To leave the books unsecured until they are required.",
            "To ensure their safe custody and proper use.",
        ],
        "correct": 3,
        "explanation": "Sub-Accounting Officers are responsible for the safe custody and proper use of receipt and licence books. Those controls protect official revenue documents from misuse, loss, and unauthorized handling.",
        "keywords": ["sub_accounting_officers", "receipt_books", "licence_books", "safe_custody"],
        "tags": ["civil_service_admin", "eth_values_integrity", "sub_accounting_officers", "receipt_books", "safe_custody"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 38",
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
    payload = {"round": 38, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
