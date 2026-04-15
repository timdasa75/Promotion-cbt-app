#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 15."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round15.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round15.md"

REWRITES = {
    "ca_general_062": {
        "question": "Before procuring safes, strong-rooms, cash tanks, or cash boxes, whose specification must first be obtained?",
        "options": [
            "The Accountant-General.",
            "The Auditor-General.",
            "The Ministry of Finance.",
            "The Head of the Civil Service of the Federation.",
        ],
        "explanation": "Before safes, strong-rooms, cash tanks, or cash boxes are procured, their specification must first be obtained from the Accountant-General in line with the relevant Financial Regulations.",
        "keywords": ["accountant_general", "safe_specifications", "strong_rooms", "financial_regulations"],
        "tags": ["current_affairs", "ca_general", "financial_controls", "accountant_general", "safe_specifications"],
    },
    "ca_general_063": {
        "question": "How often should annual returns of all Government strong-rooms and safes be rendered, and to whom?",
        "options": [
            "Bi-annually to the Head of the Civil Service of the Federation.",
            "Annually on March 31 to the Accountant-General.",
            "Monthly to the Auditor-General.",
            "Quarterly to the Minister of Finance.",
        ],
        "explanation": "Annual returns of all Government strong-rooms and safes are rendered on 31 March to the Accountant-General, as required by the Financial Regulations.",
        "keywords": ["strong_room_returns", "safes", "accountant_general", "march_31"],
        "tags": ["current_affairs", "ca_general", "financial_controls", "strong_rooms", "government_safes"],
    },
    "ca_general_067": {
        "question": "What does the Bureau do to ensure compliance with due process in Federal Government contracts?",
        "options": [
            "It holds regular meetings with the private sector.",
            "It prosecutes all cases of contract inflation.",
            "It lobbies the National Assembly for more funding.",
            "It reviews and certifies Federal Government contracts.",
        ],
        "explanation": "The Bureau helps to ensure compliance with due process by reviewing and certifying Federal Government contracts in line with approved thresholds and procedures.",
        "keywords": ["due_process", "bureau", "contract_certification", "federal_contracts"],
        "tags": ["current_affairs", "ca_general", "procurement_governance", "due_process", "federal_contracts"],
    },
    "ca_general_070": {
        "question": "What has been described as a major reason for repeated Civil Service reform efforts over the years?",
        "options": [
            "The government's sustained efforts to address human resource management challenges.",
            "A desire to create more government jobs.",
            "An attempt to reduce staff salaries.",
            "An effort to increase political patronage.",
        ],
        "explanation": "Repeated Civil Service reforms have largely been driven by the government's effort to address persistent human resource management and administrative challenges.",
        "keywords": ["civil_service_reform", "human_resource_challenges", "reform_drivers", "public_service"],
        "tags": ["current_affairs", "ca_general", "civil_service_reform", "human_resource_management", "public_service"],
    },
    "ca_general_071": {
        "question": "What is the Office of the Head of the Civil Service of the Federation primarily responsible for?",
        "options": [
            "General supervision of the affairs of the Civil Service.",
            "Disciplinary control of all civil servants.",
            "Auditing all government accounts.",
            "Recruitment of junior staff.",
        ],
        "explanation": "The Office of the Head of the Civil Service of the Federation provides general supervision over the affairs of the Civil Service and coordinates service-wide administrative matters.",
        "keywords": ["ohcsf", "civil_service_supervision", "public_service_leadership", "administration"],
        "tags": ["current_affairs", "ca_general", "ohcsf", "civil_service_supervision", "public_service_administration"],
    },
    "fin_aud_069": {
        "question": "If a key holder suspects interference with the keys or locks of a strong-room or safe, what must be done?",
        "options": [
            "Ignore it unless a loss occurs.",
            "Remove the contents to another safe, report the circumstances, and request immediate replacement of the locks and keys.",
            "Inform only the immediate supervisor.",
            "Conduct a private investigation without reporting the matter.",
        ],
        "explanation": "Where interference with the keys or locks of a strong-room or safe is suspected, the contents should be moved to another safe, the circumstances reported, and immediate steps taken to alter the locks and provide new keys, in line with the Financial Regulations.",
        "keywords": ["strong_room_security", "key_holder", "safe_locks", "financial_regulations"],
        "tags": ["financial_regulations", "fin_audits_sanctions", "strong_room_security", "key_control", "safe_management"],
    },
    "fin_bgt_068": {
        "question": "Which officer bears personal responsibility for obtaining acquittal for payments made out of public funds until the relevant payment vouchers are produced?",
        "options": [
            "The Sub-Accounting Officer.",
            "The Auditor-General.",
            "The Accounting Officer.",
            "The Head of Accounts.",
        ],
        "explanation": "The Sub-Accounting Officer bears personal responsibility for obtaining acquittal for payments made from public funds until the relevant disbursement vouchers are produced, as required by the Financial Regulations.",
        "keywords": ["sub_accounting_officer", "payment_acquittal", "public_funds", "payment_vouchers"],
        "tags": ["financial_regulations", "fin_budgeting", "sub_accounting_officer", "public_funds", "payment_control"],
    },
    "psr_disc_053": {
        "question": "What is the primary role of the Code of Conduct Bureau in relation to public officers?",
        "options": [
            "To manage government finances.",
            "To receive declarations of assets and liabilities from public officers.",
            "To handle all political appointments.",
            "To set salary structures for the Civil Service.",
        ],
        "explanation": "The Code of Conduct Bureau receives written declarations of assets and liabilities from public officers, including declarations covering relevant family interests where required by law.",
        "keywords": ["code_of_conduct_bureau", "asset_declaration", "public_officers", "liabilities"],
        "tags": ["psr", "psr_discipline", "code_of_conduct_bureau", "asset_declaration", "public_officers"],
    },
    "psr_eth_059": {
        "question": "Which feature of good governance means that decisions are taken according to rules and regulations and that information is openly available?",
        "options": [
            "Transparency.",
            "Rule of Law.",
            "Accountability.",
            "Participation.",
        ],
        "explanation": "Transparency in governance means that decisions and their enforcement follow laid-down rules and regulations while relevant information remains openly available and accessible.",
        "keywords": ["good_governance", "transparency", "decision_making", "public_information"],
        "tags": ["psr", "psr_ethics", "good_governance", "transparency", "public_accountability"],
    },
    "psr_eth_060": {
        "question": "Which body receives allegations that a public officer has breached the Code of Conduct?",
        "options": [
            "The Head of the Civil Service of the Federation.",
            "The President.",
            "The Federal Civil Service Commission.",
            "The Code of Conduct Bureau.",
        ],
        "explanation": "Allegations that a public officer has breached the Code of Conduct are made to the Code of Conduct Bureau, which is responsible for receiving and processing such complaints.",
        "keywords": ["code_of_conduct_bureau", "breach_allegations", "public_officers", "complaints"],
        "tags": ["psr", "psr_ethics", "code_of_conduct_bureau", "disciplinary_reporting", "public_service_ethics"],
    },
    "psr_train_056": {
        "question": "What issues does the Management Services Office (MSO) in the Office of the Head of the Civil Service of the Federation primarily handle?",
        "options": [
            "Pension administration and industrial relations.",
            "Career management of senior officers.",
            "Service-wide administration of training and development.",
            "Systems, structures, work processes, and related matters for improving service efficiency.",
        ],
        "explanation": "The Management Services Office focuses on systems, structures, work processes, and related matters that improve the efficiency and effectiveness of the Civil Service.",
        "keywords": ["management_services_office", "ohcsf", "systems_and_structures", "service_efficiency"],
        "tags": ["psr", "psr_training", "management_services_office", "service_efficiency", "ohcsf"],
    },
    "psr_admin_060": {
        "question": "What is typically contained in a subject file?",
        "options": [
            "Documents relating to a staff member's personal life.",
            "The personal assets of a public officer.",
            "Financial records of the government in general.",
            "Correspondence and documents relating to a particular subject matter.",
        ],
        "explanation": "A subject file contains official correspondence and other documents relating to a particular subject matter, rather than personal or unrelated records.",
        "keywords": ["subject_file", "official_correspondence", "records_management", "office_procedure"],
        "tags": ["psr", "psr_general_admin", "subject_file", "records_management", "office_procedure"],
    },
    "psr_admin_069": {
        "question": "Why must the public service establish or strengthen reception and information units for users?",
        "options": [
            "To collect political contributions.",
            "To help users access services and record their views, suggestions, or complaints.",
            "To file lawsuits against the government.",
            "To encourage complaints without offering assistance.",
        ],
        "explanation": "Reception and information units help users gain access to services and provide channels for recording their views, suggestions, and complaints as part of responsive public administration.",
        "keywords": ["reception_units", "information_units", "service_access", "user_feedback"],
        "tags": ["psr", "psr_general_admin", "service_access", "user_feedback", "public_service_delivery"],
    },
    "circ_appointments_tenure_discipline_gen_075": {
        "question": "What type of month-end transfer is effected by Principal Journal Vouchers (PJVs)?",
        "options": [
            "Transfers from \"Below-the-line Accounts\" to \"Above-the-line Accounts\".",
            "Transfers related only to revenue collection.",
            "Transfers from \"Above-the-line Accounts\" to \"Below-the-line Accounts\".",
            "Transfers between different ministries.",
        ],
        "explanation": "Principal Journal Vouchers are used at month end to transfer accounts from \"Above-the-line Accounts\" to \"Below-the-line Accounts\", as stated in the Financial Regulations.",
        "keywords": ["principal_journal_vouchers", "month_end_transfers", "above_the_line", "below_the_line"],
        "tags": ["psr", "circ_appointments_tenure_discipline", "principal_journal_vouchers", "month_end_accounts", "financial_controls"],
    },
    "circ_personnel_performance_gen_087": {
        "question": "The existence of \"ghost workers\" is usually a sign of what problem in the Civil Service?",
        "options": [
            "Inadequate linkages between training and duty posts.",
            "Low morale among officers.",
            "Poor personnel records and a flawed payroll control system.",
            "Over-centralized decision-making systems.",
        ],
        "explanation": "The existence of \"ghost workers\" usually points to poor personnel records and a weak payroll control system, especially where staff records are not properly integrated and verified.",
        "keywords": ["ghost_workers", "personnel_records", "payroll_control", "civil_service_reform"],
        "tags": ["psr", "circ_personnel_performance", "ghost_workers", "payroll_control", "personnel_records"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 15",
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
    payload = {
        "round": 15,
        "applied": applied,
    }
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
