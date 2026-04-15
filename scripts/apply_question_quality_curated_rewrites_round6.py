#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 6."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round6.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round6.md"

REWRITES = {
    "ict_f_079": {
        "question": "According to Financial Regulation 1128, how should registered or unregistered mail containing public funds or security documents be delivered?",
        "options": [
            "By locked bag, with a register maintained.",
            "By hand, without special precautions.",
            "By regular post.",
            "By email.",
        ],
        "explanation": "Financial Regulation 1128 requires registered or unregistered mail containing public funds or security documents to be delivered by locked bag, with a register maintained for all such mail to preserve custody and accountability.",
        "keywords": ["financial_regulation", "mail_delivery", "security_documents", "locked_bag"],
        "tags": ["ict_management", "ict_fundamentals", "secure_delivery", "financial_regulations"],
    },
    "ict_f_095": {
        "question": "Which delivery method complies with Financial Regulation 1128 for registered or unregistered mail containing public funds or security documents?",
        "options": [
            "By locked bag, with a register maintained.",
            "By hand, without special precautions.",
            "By regular post.",
            "By email.",
        ],
        "explanation": "The compliant method under Financial Regulation 1128 is delivery by locked bag, with a register maintained for all such mail so that the chain of custody can be traced.",
        "keywords": ["financial_regulation", "mail_security", "locked_bag", "chain_of_custody"],
        "tags": ["ict_management", "ict_fundamentals", "secure_mail", "chain_of_custody"],
    },
    "ict_eg_087": {
        "question": "Which characteristic of good governance requires institutions and processes to serve all stakeholders within a reasonable timeframe?",
        "options": [
            "Consensus orientation.",
            "Purposeful leadership.",
            "Responsiveness.",
            "Security and order.",
        ],
        "explanation": "Responsiveness means that institutions and processes should serve stakeholders within a reasonable timeframe.",
        "keywords": ["good_governance", "responsiveness", "stakeholders", "service_delivery"],
        "tags": ["ict_management", "ict_e_governance", "good_governance", "responsiveness"],
    },
    "ict_sec_095": {
        "question": "According to Financial Regulation 1118, who may open a strong-room or safe?",
        "options": [
            "The Accounting Officer alone.",
            "Security personnel.",
            "Only the authorised key holders, who must remain present while it is open.",
            "Any officer with verbal permission.",
        ],
        "explanation": "Financial Regulation 1118 provides that no strong-room or safe may be opened by anyone other than the authorised key holders, who must remain present while it is open.",
        "keywords": ["financial_regulation", "strong_room", "safe", "authorised_key_holders"],
        "tags": ["ict_management", "ict_security", "physical_security", "key_control"],
    },
    "ict_sec_100": {
        "question": "According to Financial Regulation 1110, who is personally accountable for the safe custody of the original keys of strong-rooms, safes, cash tanks, or cash boxes and collectively accountable for their contents?",
        "options": [
            "The Accounting Officer only.",
            "The security guard.",
            "Only the cashier.",
            "Officers holding the keys.",
        ],
        "explanation": "Financial Regulation 1110 states that officers holding the keys are personally accountable for keeping them safe and are collectively accountable for the contents secured by them.",
        "keywords": ["financial_regulation", "key_custody", "strong_rooms", "accountability"],
        "tags": ["ict_management", "ict_security", "key_custody", "asset_security"],
    },
    "csh_ap_077": {
        "question": "What is typically contained in a subject file?",
        "options": [
            "Correspondence and documents relating to a particular subject matter.",
            "The personal assets of a public officer.",
            "Documents relating only to a staff member's private life.",
            "A record of government revenue collections.",
        ],
        "explanation": "A subject file contains official correspondence and related documents that deal with a particular subject matter.",
        "keywords": ["subject_file", "official_correspondence", "documents", "registry"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "subject_file", "registry_practice"],
    },
    "csh_disc_062": {
        "question": "When a Civil Servant has finished with a file, what should be done if further action will be needed later?",
        "options": [
            "Throw it away if it is no longer needed immediately.",
            "Keep it permanently in a desk drawer.",
            "Put it on a bring-up pad for the later date and return it properly through registry channels.",
            "Pass it to a colleague without recording the transfer.",
        ],
        "explanation": "When an officer has finished with a file, it should be returned through the proper registry process. If action will be needed later, the file should be placed on a bring-up pad for that date.",
        "keywords": ["file_handling", "bring_up_pad", "registry", "civil_servant"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "file_handling", "registry_procedure"],
    },
    "csh_disc_075": {
        "question": "Which of the following is considered a very serious offence for a Civil Servant?",
        "options": [
            "Arriving late to a meeting.",
            "Taking a casual day off without prior notice.",
            "Unauthorised disclosure of information acquired in the course of duty.",
            "Talking to a colleague during office hours.",
        ],
        "explanation": "Unauthorised disclosure of information obtained in the course of duty is treated as a very serious offence because it breaches the trust and confidentiality expected of a Civil Servant.",
        "keywords": ["unauthorised_disclosure", "confidentiality", "service_offence", "civil_servant"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "confidentiality", "service_offences"],
    },
    "csh_pt_056": {
        "question": "What should intermediate officers do with papers routed through them for information only?",
        "options": [
            "Delay them until they have spare time.",
            "File them immediately without forwarding them.",
            "Keep personal copies for future use.",
            "Avoid delaying them unnecessarily.",
        ],
        "explanation": "Intermediate officers should not delay papers that pass through them for information only. Such papers should continue through the process without unnecessary hold-up.",
        "keywords": ["intermediate_officers", "papers", "information_only", "workflow"],
        "tags": ["civil_service_admin", "csh_performance_training", "document_flow", "workflow_discipline"],
    },
    "csh_pt_073": {
        "question": "If a file will be needed again later, what should a Civil Servant do after finishing with it?",
        "options": [
            "Keep it in a desk drawer for future reference.",
            "Pass it to a colleague without recording the handoff.",
            "Dispose of it if it is not needed immediately.",
            "Place it on a bring-up pad for the later date and ensure it returns through registry channels.",
        ],
        "explanation": "A file that will be needed later should be scheduled on a bring-up pad and handled through proper registry channels rather than being kept informally by an officer.",
        "keywords": ["bring_up_pad", "file_return", "registry_channels", "civil_servant"],
        "tags": ["civil_service_admin", "csh_performance_training", "file_management", "registry_channels"],
    },
    "eth_general_gen_082": {
        "question": "What is the main purpose of a secret registry?",
        "options": [
            "To store records of open meetings.",
            "To keep all personal files.",
            "To keep all non-classified documents.",
            "To handle and keep classified documents and correspondence.",
        ],
        "explanation": "A secret registry exists to receive, store, control, and process classified documents and correspondence securely.",
        "keywords": ["secret_registry", "classified_documents", "correspondence", "security"],
        "tags": ["civil_service_admin", "eth_general", "secret_registry", "document_security"],
    },
    "eth_general_gen_087": {
        "question": "Who should receive copies of a handing-over note?",
        "options": [
            "The officer's friends and family.",
            "The officer's predecessor only.",
            "The general public.",
            "The Head of Department, the Personnel Officer, and the officer's successor.",
        ],
        "explanation": "Copies of a handing-over note should go to the Head of Department, the Personnel Officer, and the officer's successor so that continuity and accountability are maintained.",
        "keywords": ["handing_over_note", "head_of_department", "personnel_officer", "successor"],
        "tags": ["civil_service_admin", "eth_general", "handing_over", "service_continuity"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 6",
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
