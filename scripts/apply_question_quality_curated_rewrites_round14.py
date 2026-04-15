#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 14."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round14.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round14.md"

REWRITES = {
    "csh_it_065": {
        "question": "What should adjustments to the way services are organized and operated aim to achieve?",
        "options": [
            "More bureaucracy.",
            "Higher costs without reform.",
            "Better service delivery.",
            "Fewer services for the public.",
        ],
        "explanation": "Adjustments to the way services are organized and operated should result in better service delivery, supported by sound practice and effective use of information and communication technologies.",
        "keywords": ["service_delivery", "service_reform", "organization", "operations"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "service_delivery", "service_reform"],
    },
    "csh_it_072": {
        "question": "What is the objective of the National Council on Establishments (NCE)?",
        "options": [
            "To promote experience sharing and harmonize human resource issues between the Federal and State Governments.",
            "To manage the careers of all Civil Servants directly.",
            "To recruit every new employee into the Civil Service.",
            "To handle all disciplinary cases for federal staff.",
        ],
        "explanation": "The National Council on Establishments exists to promote experience sharing, alignment, and harmonization of human resource issues between the Federal and State Governments.",
        "keywords": ["national_council_on_establishments", "nce", "human_resource_harmonization", "federal_state_relations"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "national_council_on_establishments", "human_resource_harmonization"],
    },
    "csh_pt_067": {
        "question": "From what are the duties of Administrative and Professional Officers derived?",
        "options": [
            "The needs of the public alone.",
            "The system of Government.",
            "The Financial Regulations only.",
            "Directives of the Permanent Secretary alone.",
        ],
        "explanation": "The duties of Administrative and Professional Officers derive from the system of Government because their roles are shaped by how public administration is organized and conducted.",
        "keywords": ["administrative_officers", "professional_officers", "duties", "system_of_government"],
        "tags": ["civil_service_admin", "csh_performance_training", "officer_roles", "system_of_government"],
    },
    "eth_general_gen_079": {
        "question": "What should official letters always contain?",
        "options": [
            "A humorous opening.",
            "A personal salutation only.",
            "A heading briefly describing the subject matter, together with a reference number and date.",
            "A list of all previous correspondence.",
        ],
        "explanation": "Official letters should always carry a heading that briefly describes the subject matter, along with a reference number and date for proper identification and record-keeping.",
        "keywords": ["official_letters", "heading", "reference_number", "date"],
        "tags": ["civil_service_admin", "eth_general", "official_correspondence", "letter_format"],
    },
    "competency_num_066": {
        "question": "What role may the Permanent Secretary perform in relation to other government bodies?",
        "options": [
            "Clear a memorandum for funds with the Ministry of Finance before it goes to the Executive Council of the Federation.",
            "Approve all capital projects personally.",
            "Hire all new staff directly.",
            "Control the National Planning Commission directly.",
        ],
        "explanation": "A Permanent Secretary may need to clear a memorandum involving funds with the Ministry of Finance before it is submitted to the Executive Council of the Federation.",
        "keywords": ["permanent_secretary", "ministry_of_finance", "memorandum", "executive_council"],
        "tags": ["competency_framework", "comp_numerical_reasoning", "permanent_secretary", "government_process"],
    },
    "competency_num_067": {
        "question": "Who is the chief adviser to the Minister in a Ministry?",
        "options": [
            "The Director of Finance and Accounts.",
            "The Head of the Civil Service of the Federation.",
            "The Chief of Staff.",
            "The Permanent Secretary.",
        ],
        "explanation": "Within a ministry, the Permanent Secretary serves as the chief adviser to the Minister on administrative and policy implementation matters.",
        "keywords": ["chief_adviser", "minister", "permanent_secretary", "ministry"],
        "tags": ["competency_framework", "comp_numerical_reasoning", "permanent_secretary", "ministerial_administration"],
    },
    "competency_num_080": {
        "question": "How does the 1999 Constitution define the Civil Service of the Federation?",
        "options": [
            "As service in the Judiciary.",
            "As service in a civil capacity as staff of the Office of the President, Vice-President, a Ministry, or a department of the Government of the Federation.",
            "As service in the National Assembly.",
            "As service in all government agencies and parastatals without distinction.",
        ],
        "explanation": "The 1999 Constitution defines the Civil Service of the Federation as service in a civil capacity in the Office of the President, the Vice-President, a Ministry, or a department of the Government of the Federation.",
        "keywords": ["1999_constitution", "civil_service_of_the_federation", "civil_capacity", "federal_government"],
        "tags": ["competency_framework", "comp_numerical_reasoning", "1999_constitution", "civil_service_definition"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 14",
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
                for question in subcategory.get("questions", []):
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
    payload = {
        "round": 14,
        "applied": applied,
    }
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
