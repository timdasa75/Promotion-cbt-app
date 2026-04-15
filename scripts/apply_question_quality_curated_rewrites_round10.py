#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 10."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round10.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round10.md"

REWRITES = {
    "csh_ap_055": {
        "question": "What is the main function of the Code of Conduct Bureau?",
        "options": [
            "To receive written declarations of assets and liabilities from public officers.",
            "To manage government finances.",
            "To set the salary structure for the Civil Service.",
            "To handle all political appointments.",
        ],
        "explanation": "The Code of Conduct Bureau receives written declarations of assets and liabilities from public officers as part of the integrity and accountability framework for public service.",
        "keywords": ["code_of_conduct_bureau", "assets", "liabilities", "public_officers"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "code_of_conduct_bureau", "asset_declaration"],
    },
    "csh_it_066": {
        "question": "How should service-delivery deadlines be determined and communicated?",
        "options": [
            "They should be realistic and communicated to users.",
            "They should be arbitrary.",
            "They should depend on the whims of the Head of Department.",
            "They should be set by the political party in power.",
        ],
        "explanation": "Service-delivery deadlines should be realistic and clearly communicated to users so that expectations are understood and performance can be measured.",
        "keywords": ["service_delivery", "deadlines", "users", "communication"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "service_delivery", "service_standards"],
    },
    "csh_it_074": {
        "question": "What is the consequence of failing to take reasonable care of documents entrusted to a Civil Servant?",
        "options": [
            "It is an offence.",
            "It is a minor infraction.",
            "It is a normal part of the job.",
            "It is an excusable mistake.",
        ],
        "explanation": "A Civil Servant is expected to take reasonable care of official documents. Failure to do so amounts to an offence because it jeopardizes proper custody and accountability.",
        "keywords": ["documents", "care", "offence", "accountability"],
        "tags": ["civil_service_admin", "csh_innovation_technology", "document_custody", "accountability"],
    },
    "csh_duty_071": {
        "question": "What should adjustments to the way services are organized and operated achieve?",
        "options": [
            "Increased costs.",
            "Better service delivery.",
            "Fewer services for the public.",
            "More bureaucracy.",
        ],
        "explanation": "Adjustments to the way services are organized and operated should lead to better service delivery, supported by best practices and effective use of information and communication technologies.",
        "keywords": ["service_reform", "better_service_delivery", "organization", "operations"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "service_reform", "service_delivery"],
    },
    "csh_pt_053": {
        "question": "What should you do if papers or documents come to you by mistake from staff or members of the public?",
        "options": [
            "Keep them for yourself.",
            "Send them to the wrong office.",
            "Find the correct destination and seek directions from your superior on rerouting them.",
            "Throw them away.",
        ],
        "explanation": "If papers or documents come to an officer by mistake, the officer should identify the correct destination and seek the necessary direction from a superior so the documents can be rerouted properly.",
        "keywords": ["misdirected_documents", "rerouting", "superior_officer", "document_flow"],
        "tags": ["civil_service_admin", "csh_performance_training", "document_flow", "rerouting"],
    },
    "csh_pt_059": {
        "question": "On what should the evaluation of services be based?",
        "options": [
            "The number of complaints received.",
            "Objectives and programmes defined beforehand, with performance indicators and criteria.",
            "Personal opinions.",
            "The amount of money spent.",
        ],
        "explanation": "The evaluation of services should be based on objectives and programmes defined beforehand, supported by performance indicators and criteria that make results measurable.",
        "keywords": ["evaluation_of_services", "objectives", "performance_indicators", "criteria"],
        "tags": ["civil_service_admin", "csh_performance_training", "service_evaluation", "performance_indicators"],
    },
    "csh_sdg_060": {
        "question": "What is the purpose of a handing-over note?",
        "options": [
            "To log the personal assets of an officer.",
            "To provide a list of all official meetings.",
            "To give a successor a detailed guide to the duties and responsibilities of the post.",
            "To document all the money spent by an officer.",
        ],
        "explanation": "A handing-over note is prepared to guide a successor by setting out the duties, responsibilities, and important matters relating to the post being handed over.",
        "keywords": ["handing_over_note", "successor", "duties", "responsibilities"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "handing_over_note", "succession"],
    },
    "eth_general_gen_076": {
        "question": "What should every official letter contain?",
        "options": [
            "A humorous opening.",
            "A list of all previous correspondence.",
            "A personal salutation only.",
            "A heading that briefly describes the subject matter, a reference number, and a date.",
        ],
        "explanation": "Every official letter should carry a heading that briefly describes the subject matter, together with a reference number and date for proper identification and record-keeping.",
        "keywords": ["official_letter", "heading", "reference_number", "date"],
        "tags": ["civil_service_admin", "eth_general", "official_correspondence", "letter_format"],
    },
    "FOI_AO_058": {
        "question": "Why are official documents classified?",
        "options": [
            "To make them difficult to access.",
            "To prevent the public from ever seeing them.",
            "To indicate the degree of care and protection each document requires.",
            "To hide their contents from other ministries.",
        ],
        "explanation": "Documents are classified so officers understand the degree of care, security, and handling required for each one.",
        "keywords": ["document_classification", "security", "handling", "care"],
        "tags": ["constitutional_law", "foi_access_obligations", "document_classification", "document_security"],
    },
    "FOI_AO_068": {
        "question": "What should be attached to a meeting notice and agenda?",
        "options": [
            "The personal files of all members.",
            "The financial statements of the ministry.",
            "The minutes of the last meeting and any other relevant documents.",
            "The private phone numbers of the members.",
        ],
        "explanation": "A meeting notice and agenda should be accompanied by the minutes of the last meeting and any other relevant documents needed for proper preparation.",
        "keywords": ["meeting_notice", "agenda", "minutes", "relevant_documents"],
        "tags": ["constitutional_law", "foi_access_obligations", "meeting_procedure", "agenda"],
    },
    "FOI_AO_074": {
        "question": "Why is a reference placed in the top right-hand corner of an official letter?",
        "options": [
            "To show the personal details of the sender.",
            "To show only the date of the letter.",
            "To show the recipient's address.",
            "To identify the letter uniquely for record-keeping and tracking.",
        ],
        "explanation": "The reference in the top right-hand corner serves as a unique identifier that supports filing, retrieval, and tracking of the letter.",
        "keywords": ["reference_number", "official_letter", "record_keeping", "tracking"],
        "tags": ["constitutional_law", "foi_access_obligations", "official_correspondence", "reference_number"],
    },
    "clg_legal_compliance_gen_061": {
        "question": "Under the principle of quality, effectiveness, and efficiency, what should the public service make optimal use of?",
        "options": [
            "Personal favors.",
            "The resources at its disposal.",
            "Obsolete technology.",
            "Political connections.",
        ],
        "explanation": "This principle requires the public service to provide high-quality, effective, and efficient services by making the best use of the resources available to it.",
        "keywords": ["quality", "effectiveness", "efficiency", "resources"],
        "tags": ["constitutional_law", "clg_legal_compliance", "resource_use", "public_service_principles"],
    },
    "FOI_AO_052": {
        "question": "What is the purpose of keeping a reference in the top right-hand corner of a letter?",
        "options": [
            "To identify the letter uniquely for filing and tracking.",
            "To show the personal details of the sender.",
            "To show only the date of the letter.",
            "To show the recipient's address.",
        ],
        "explanation": "A reference number is kept on a letter so the document can be uniquely identified for filing, tracking, and future retrieval.",
        "keywords": ["reference_number", "letter_tracking", "filing", "retrieval"],
        "tags": ["constitutional_law", "foi_access_obligations", "reference_number", "document_tracking"],
    },
    "FOI_EX_075": {
        "question": "What are the normal hours of work in Federal offices?",
        "options": [
            "9:00 a.m. to 5:00 p.m.",
            "10:00 a.m. to 6:00 p.m.",
            "7:00 a.m. to 3:00 p.m.",
            "8:00 a.m. to 4:00 p.m.",
        ],
        "explanation": "The normal hours of work in Federal offices are from 8:00 a.m. to 4:00 p.m., Monday to Friday, unless officially varied.",
        "keywords": ["hours_of_work", "federal_offices", "work_schedule", "public_service"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "hours_of_work", "federal_offices"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 10",
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
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--log-out", type=Path, default=DEFAULT_LOG_JSON)
    parser.add_argument("--markdown-out", type=Path, default=DEFAULT_LOG_MD)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    applied = apply_rewrites(args.root)
    payload = {"applied": applied}
    save_json(args.log_out, payload)
    write_markdown(args.markdown_out, payload)
    print(json.dumps({"applied_rewrites": len(applied), "rewrites": applied}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
