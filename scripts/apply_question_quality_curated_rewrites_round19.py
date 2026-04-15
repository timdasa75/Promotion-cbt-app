#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 19."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round19.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round19.md"

REWRITES = {
    "FOI_EX_052": {
        "question": "When cash has to be transported from one place to another, what must be provided to the accountable officer?",
        "options": [
            "A public transport ticket.",
            "A receipt for the cash only.",
            "An approved cash tank or box, a government vehicle, and a police escort.",
            "A personal briefcase.",
        ],
        "explanation": "When cash is transported from one place to another, the accountable officer must be provided with an approved cash tank or box, a government vehicle, and a police escort, as required by the Financial Regulations.",
        "keywords": ["cash_transport", "accountable_officer", "police_escort", "financial_regulations"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "cash_transport", "accountable_officer", "financial_regulations"],
    },
    "FOI_EX_057": {
        "question": "What is considered an important asset for a schedule officer?",
        "options": [
            "A friendly boss.",
            "Accurate information based on facts and figures.",
            "A large office.",
            "A high salary.",
        ],
        "explanation": "An important asset for a schedule officer is accurate information based on facts and figures, because sound administrative decisions depend on reliable records and evidence.",
        "keywords": ["schedule_officer", "accurate_information", "facts_and_figures", "administrative_decision_making"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "schedule_officer", "accurate_information", "administrative_evidence"],
    },
    "FOI_EX_075": {
        "question": "What are the normal working hours in Federal offices?",
        "options": [
            "9:00 am to 5:00 pm.",
            "10:00 am to 6:00 pm.",
            "7:00 am to 3:00 pm.",
            "8:00 am to 4:00 pm.",
        ],
        "explanation": "The normal working hours in Federal offices are 8:00 am to 4:00 pm, Monday to Friday, unless they are officially varied.",
        "keywords": ["working_hours", "federal_offices", "public_service_schedule", "office_hours"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "working_hours", "federal_offices", "public_service_schedule"],
    },
    "pol_analysis_methods_gen_075": {
        "question": "Besides a summary of the facts of the case, what should a minute contain?",
        "options": [
            "The officer's recommendations and conclusions.",
            "A list of all staff involved.",
            "The officer's personal opinion.",
            "A detailed financial analysis.",
        ],
        "explanation": "A good minute should contain a summary of the facts of the case together with the officer's recommendations and conclusions.",
        "keywords": ["minute_writing", "facts_of_the_case", "recommendations", "conclusions"],
        "tags": ["policy_analysis", "pol_analysis_methods", "minute_writing", "recommendations", "administrative_writing"],
    },
    "ppa_bid_053": {
        "question": "If a public officer performs a prohibited act through a nominee, trustee, or agent, how is that conduct treated under the Code?",
        "options": [
            "It is treated as a breach of the Code.",
            "It is ignored because the act was not done personally.",
            "It is treated as fulfillment of duty.",
            "It is treated as lawful conduct.",
        ],
        "explanation": "A public officer who performs a prohibited act through a nominee, trustee, or agent is still treated as having committed a breach of the Code.",
        "keywords": ["code_of_conduct", "nominee", "trustee", "breach_of_code"],
        "tags": ["procurement_act", "proc_bidding_evaluation", "code_of_conduct", "breach_of_code", "public_officer_ethics"],
    },
    "ppa_bid_058": {
        "question": "What should you do if papers or documents are sent to you by mistake from staff or members of the public?",
        "options": [
            "Find the correct destination and obtain direction from your superior on how to re-route them.",
            "Take them to the wrong office.",
            "Keep them for yourself.",
            "Throw them away.",
        ],
        "explanation": "If papers or documents come to you by mistake, you should identify the correct destination and obtain direction from your superior on how to re-route them properly.",
        "keywords": ["misdirected_documents", "rerouting", "superior_direction", "office_procedure"],
        "tags": ["procurement_act", "proc_bidding_evaluation", "misdirected_documents", "rerouting", "office_procedure"],
    },
    "ppa_ethic_051": {
        "question": "What is a key objective of the Official Secrets Act?",
        "options": [
            "To protect civil servants from prosecution.",
            "To prevent the leaking of government secrets.",
            "To encourage civil servants to share all government information.",
            "To allow unrestricted flow of information to the public.",
        ],
        "explanation": "A key objective of the Official Secrets Act is to prevent government secrets from being disclosed to unauthorized persons.",
        "keywords": ["official_secrets_act", "government_secrets", "unauthorized_disclosure", "confidentiality"],
        "tags": ["procurement_act", "proc_transparency_ethics", "official_secrets_act", "confidentiality", "government_secrets"],
    },
    "ppa_ethic_052": {
        "question": "Government communication is often described as having its own what?",
        "options": [
            "Rules, regulations, and laws.",
            "Staff, policies, and procedures.",
            "Culture, methods, and practices.",
            "Language, culture, and practices.",
        ],
        "explanation": "Government communication is often described as having its own culture, methods, and practices because official communication follows established administrative conventions.",
        "keywords": ["government_communication", "administrative_culture", "methods", "practices"],
        "tags": ["procurement_act", "proc_transparency_ethics", "government_communication", "administrative_culture", "official_communication"],
    },
    "ppa_ethic_074": {
        "question": "What is the purpose of the duplicate note-book system?",
        "options": [
            "To record the file number, date, and destination whenever a file is sent out.",
            "To write meeting minutes.",
            "To create duplicate files.",
            "To keep personal notes.",
        ],
        "explanation": "The duplicate note-book system is used to record the file number, date, and destination whenever an officer sends out a file, so its movement can be tracked.",
        "keywords": ["duplicate_note_book_system", "file_tracking", "registry_records", "document_movement"],
        "tags": ["procurement_act", "proc_transparency_ethics", "duplicate_note_book_system", "file_tracking", "document_movement"],
    },
    "ppa_objectives_062": {
        "question": "What is the consequence when a public officer carries out a prohibited act through a nominee, trustee, or other agent?",
        "options": [
            "No consequence arises because the act was not done personally.",
            "The officer is deemed to have committed a breach of the Code.",
            "The conduct is treated as lawful.",
            "The conduct is treated as fulfillment of official duty.",
        ],
        "explanation": "When a public officer carries out a prohibited act through a nominee, trustee, or other agent, the officer is still deemed to have committed a breach of the Code.",
        "keywords": ["public_officer", "nominee", "agent", "breach_of_code"],
        "tags": ["procurement_act", "proc_objectives_institutions", "public_officer_ethics", "breach_of_code", "nominee"],
    },
    "ppa_objectives_068": {
        "question": "According to guidance on irrelevance in official writing, what should officers avoid?",
        "options": [
            "Having a grasp of the subject at issue.",
            "Being too factual.",
            "Being too brief.",
            "Drifting away from the question under consideration.",
        ],
        "explanation": "Guidance on irrelevance in official writing warns officers not to drift away from the question under consideration.",
        "keywords": ["official_writing", "irrelevance", "focus", "clear_writing"],
        "tags": ["procurement_act", "proc_objectives_institutions", "official_writing", "irrelevance", "clear_writing"],
    },
    "ppa_objectives_074": {
        "question": "What is a central aim of the Official Secrets Act?",
        "options": [
            "To allow a free flow of information to the public.",
            "To protect civil servants from prosecution.",
            "To prevent the leaking of government secrets.",
            "To encourage civil servants to disclose all government information.",
        ],
        "explanation": "A central aim of the Official Secrets Act is to prevent the leakage of government secrets to unauthorized persons.",
        "keywords": ["official_secrets_act", "government_secrets", "confidentiality", "unauthorized_persons"],
        "tags": ["procurement_act", "proc_objectives_institutions", "official_secrets_act", "government_secrets", "confidentiality"],
    },
    "psr_admin_027": {
        "question": "According to PSR 110120, between what hours must government offices remain open to the public?",
        "options": [
            "8:00 am and 4:00 pm.",
            "7:30 am and 3:30 pm.",
            "9:00 am and 5:00 pm.",
            "8:30 am and 5:30 pm.",
        ],
        "explanation": "PSR 110120 provides that government offices are open to the public between 8:00 am and 4:00 pm, Monday to Friday, except on public holidays.",
        "keywords": ["psr_110120", "office_hours", "government_offices", "public_access"],
        "tags": ["psr", "psr_general_admin", "psr_110120", "office_hours", "public_access"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 19",
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
    payload = {"round": 19, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
