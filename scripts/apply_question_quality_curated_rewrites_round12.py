#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 12."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round12.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round12.md"

REWRITES = {
    "FOI_EX_065": {
        "question": "What should a Civil Servant do if a file has remained on the desk for a long time without action?",
        "options": [
            "Report it to a superior officer and return it to the registry.",
            "Throw it away.",
            "Keep it in the desk until someone asks for it.",
            "Pass it to a colleague without record.",
        ],
        "explanation": "If a file remains on an officer's desk for too long without action, the matter should be reported to a superior officer and the file returned to the registry for proper control and follow-up.",
        "keywords": ["file_control", "superior_officer", "registry", "delayed_action"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "file_control", "registry_procedure"],
    },
    "fin_aud_054": {
        "question": "Which officer is responsible for the proper custody of public funds, stamps, and other government documents in an MDA?",
        "options": [
            "The Head of Internal Audit.",
            "The Director of Finance and Accounts.",
            "The Accountant-General of the Federation.",
            "The Permanent Secretary or Chief Executive Officer.",
        ],
        "explanation": "The Director of Finance and Accounts is responsible for the proper custody of public funds, stamps, and other government documents within a ministry, department, or agency.",
        "keywords": ["director_of_finance_and_accounts", "custody", "public_funds", "government_documents"],
        "tags": ["financial_regulations", "fin_audits_sanctions", "director_of_finance_and_accounts", "custody_of_funds"],
    },
    "fin_gen_067": {
        "question": "Who has authority to inspect the accounts of cash-advance holders?",
        "options": [
            "Only the Accounting Officer.",
            "Only the Head of Department.",
            "Only the Minister of Finance.",
            "The Accountant-General and the Auditor-General.",
        ],
        "explanation": "Financial Regulation 1013 provides that the accounts of cash-advance holders are subject to inspection by the Accountant-General and the Auditor-General.",
        "keywords": ["cash_advance", "account_inspection", "accountant_general", "auditor_general"],
        "tags": ["financial_regulations", "fin_general", "cash_advance", "account_inspection"],
    },
    "fin_gen_068": {
        "question": "How often, and to whom, must returns of receipt and licence books issued, used, and unused be rendered?",
        "options": [
            "Bi-annually, to the Head of Department.",
            "Monthly, to the Accountant-General.",
            "Annually, to the Minister of Finance.",
            "Quarterly, to the Auditor-General.",
        ],
        "explanation": "Financial Regulation 1221 requires monthly returns of receipt and licence books issued, used, and unused to be rendered to the Accountant-General.",
        "keywords": ["receipt_books", "licence_books", "monthly_returns", "accountant_general"],
        "tags": ["financial_regulations", "fin_general", "receipt_books", "monthly_returns"],
    },
    "IRA_153": {
        "question": "What prompted the Public Service Reform Programme of 1999?",
        "options": [
            "The global economic downturn.",
            "The need to reduce government spending alone.",
            "The need to reposition the Civil Service to become more efficient and professional.",
            "The demands of international organizations.",
        ],
        "explanation": "The Public Service Reform Programme of 1999 was introduced to reposition the Civil Service so it could operate more efficiently, professionally, and effectively.",
        "keywords": ["public_service_reform_programme", "1999", "civil_service", "efficiency"],
        "tags": ["general_current_affairs", "ca_international_affairs", "public_service_reforms", "civil_service_efficiency"],
    },
    "IRA_161": {
        "question": "What is the chief consideration in the pursuit of Nigeria's foreign policy?",
        "options": [
            "Economic benefits from a single trading partner.",
            "Global peace initiatives alone.",
            "Nigeria's national interest.",
            "The foreign policies of other African states.",
        ],
        "explanation": "The chief consideration in Nigeria's foreign policy is the protection and advancement of the country's national interest.",
        "keywords": ["nigeria_foreign_policy", "national_interest", "international_affairs", "policy_priority"],
        "tags": ["general_current_affairs", "ca_international_affairs", "foreign_policy", "national_interest"],
    },
    "NGPD_054": {
        "question": "What is the role of the Chairman of the Board of a Parastatal?",
        "options": [
            "To supervise the day-to-day running of the parastatal.",
            "To serve as the Accounting Officer of the parastatal.",
            "To preside over Board meetings and maintain order during deliberations.",
            "To represent the parastatal in all international forums.",
        ],
        "explanation": "The Chairman of the Board presides over Board meetings and ensures that discussions remain orderly and focused on the Board's responsibilities.",
        "keywords": ["parastatal", "board_chairman", "board_meetings", "governance"],
        "tags": ["general_current_affairs", "ca_national_governance", "parastatal", "board_chairman"],
    },
    "PSIR_119": {
        "question": "The 'golden handshake' scheme was part of which reform?",
        "options": [
            "The 1988 Civil Service Reforms.",
            "The Public Service Reform Programme of 1999.",
            "The Udoji Public Service Review Commission.",
            "The 1999 Constitution.",
        ],
        "explanation": "The 'golden handshake' scheme formed part of the Public Service Reform Programme of 1999 as one of the measures introduced during that reform period.",
        "keywords": ["golden_handshake", "public_service_reform_programme", "1999", "reform_measures"],
        "tags": ["general_current_affairs", "ca_public_service_reforms", "golden_handshake", "reform_measures"],
    },
    "psr_train_057": {
        "question": "What is a likely consequence of lack of diligence in the Civil Service?",
        "options": [
            "It may lead to promotion.",
            "It has no effect on government operations.",
            "It leads to inefficiency, loss of productivity, and waste.",
            "It helps government achieve its objectives faster.",
        ],
        "explanation": "Lack of diligence in the Civil Service leads to inefficiency, loss of productivity, and waste of public resources, which undermines effective service delivery.",
        "keywords": ["diligence", "inefficiency", "productivity", "waste"],
        "tags": ["psr", "psr_training", "diligence", "productivity"],
    },
    "psr_train_071": {
        "question": "What is the procedure for disposing of unused stocks of receipt and licence books?",
        "options": [
            "They may be destroyed by the issuing officer.",
            "They must be returned to the Accountant-General for destruction by a Board of Survey.",
            "They may be issued to another department informally.",
            "They should be kept indefinitely.",
        ],
        "explanation": "Unused stocks of receipt and licence books should be returned to the Accountant-General for destruction by a Board of Survey, in line with the established financial control procedure.",
        "keywords": ["receipt_books", "licence_books", "board_of_survey", "accountant_general"],
        "tags": ["psr", "psr_training", "receipt_books", "board_of_survey"],
    },
    "psr_admin_054": {
        "question": "What is the purpose of a secret registry?",
        "options": [
            "To keep all non-classified documents.",
            "To keep all personal files.",
            "To keep classified documents and correspondence.",
            "To keep records of all open meetings.",
        ],
        "explanation": "A secret registry exists to receive, control, and safeguard classified documents and correspondence that require restricted handling.",
        "keywords": ["secret_registry", "classified_documents", "classified_correspondence", "registry_control"],
        "tags": ["psr", "psr_general_admin", "secret_registry", "classified_documents"],
    },
    "psr_admin_061": {
        "question": "What material should never be used for drafting, especially when classified information is involved?",
        "options": [
            "Discarded papers containing classified information.",
            "Brand-new paper.",
            "Clean recycled paper without classified content.",
            "Plain notebooks kept for approved office use.",
        ],
        "explanation": "Discarded papers containing classified information should never be reused for drafting because they may expose sensitive content and compromise document security.",
        "keywords": ["classified_information", "drafting", "discarded_papers", "document_security"],
        "tags": ["psr", "psr_general_admin", "classified_information", "document_security"],
    },
    "circ_leave_welfare_allowances_gen_088": {
        "question": "What is the best way to destroy classified documents that are no longer needed?",
        "options": [
            "Shred them or burn them.",
            "Leave them on a desk for others to inspect.",
            "Tear them up and throw them into an open waste bin.",
            "Place them in the Open Registry.",
        ],
        "explanation": "Classified documents that are no longer needed should be physically destroyed, such as by shredding or controlled burning, so that the information cannot be reconstructed or disclosed.",
        "keywords": ["classified_documents", "destruction", "shredding", "controlled_burning"],
        "tags": ["psr", "circ_leave_welfare_allowances", "classified_documents", "document_destruction"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 12",
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
        "round": 12,
        "applied": applied,
    }
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
