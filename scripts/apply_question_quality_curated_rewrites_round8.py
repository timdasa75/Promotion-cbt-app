#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 8."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round8.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round8.md"

REWRITES = {
    "csh_principle_067": {
        "question": "What is the accountability of the administration regarding participation, consultation, and mediation?",
        "options": [
            "To ignore public opinion.",
            "To prevent civil society from participating.",
            "To ensure that effective mechanisms for participation and consultation are put in place.",
            "To consult only government officials.",
        ],
        "explanation": "The administration is accountable for ensuring that effective mechanisms for participation, consultation, and mediation are put in place through consultative forums and similar structures.",
        "keywords": ["participation", "consultation", "mediation", "administrative_accountability"],
        "tags": ["civil_service_admin", "csh_principles_ethics", "participation", "administrative_accountability"],
    },
    "csh_duty_055": {
        "question": "From what are the duties of Administrative and Professional Officers derived?",
        "options": [
            "The needs of the public alone.",
            "The system of government.",
            "Directives issued only by the Permanent Secretary.",
            "The Financial Regulations.",
        ],
        "explanation": "The duties of Administrative and Professional Officers derive from the system of government because their roles are designed to support how government is organised and operated.",
        "keywords": ["administrative_officers", "professional_officers", "duties", "system_of_government"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "system_of_government", "officer_roles"],
    },
    "csh_duty_056": {
        "question": "How should deadlines for service delivery be set?",
        "options": [
            "In an arbitrary manner.",
            "By the political party in power.",
            "By the personal preference of the Head of Department.",
            "Realistically, and they should be communicated to users.",
        ],
        "explanation": "Deadlines for service delivery should be set realistically and communicated to users so that expectations are clear and services can be measured against known standards.",
        "keywords": ["service_delivery", "deadlines", "realistic_targets", "user_communication"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "service_delivery", "service_standards"],
    },
    "csh_duty_069": {
        "question": "What does the Manpower Development Office (MDO) coordinate on a service-wide basis?",
        "options": [
            "The pool system for senior officers.",
            "Staff deployment across all ministries.",
            "Training and development across the Civil Service.",
            "Draft Council memoranda on HRM matters.",
        ],
        "explanation": "The MDO coordinates service-wide training and development so that the Civil Service maintains the quality manpower needed for effective performance.",
        "keywords": ["manpower_development_office", "training", "development", "service_wide_coordination"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "mdo", "training_and_development"],
    },
    "csh_disc_068": {
        "question": "What should a Civil Servant do if a file has remained on their desk for a long time without action?",
        "options": [
            "Report it to a superior officer and return it to the registry.",
            "Throw it away.",
            "Pass it to a colleague without record.",
            "Keep it in the desk until someone asks for it.",
        ],
        "explanation": "If a file has remained unattended on an officer's desk for too long, the matter should be reported to a superior officer and the file returned to the registry for proper control.",
        "keywords": ["file_control", "registry", "superior_officer", "delayed_action"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "file_control", "registry_procedure"],
    },
    "csh_ap_072": {
        "question": "Which characteristic of good governance means that decisions are taken and enforced according to rules and regulations, while information is openly available?",
        "options": [
            "Rule of law.",
            "Transparency.",
            "Accountability.",
            "Participation.",
        ],
        "explanation": "Transparency means decisions are taken and enforced in line with rules and regulations while relevant information is made openly available and accessible.",
        "keywords": ["good_governance", "transparency", "information_access", "rules_and_regulations"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "good_governance", "transparency"],
    },
    "csh_sdg_063": {
        "question": "If a chairman has follow-up actions to complete before a meeting, what should be done?",
        "options": [
            "Address the issues promptly before the meeting.",
            "Ask a junior officer to handle them without supervision.",
            "Leave them until after the meeting.",
            "Ignore them.",
        ],
        "explanation": "If the chairman has follow-up actions to complete before a meeting, they should be addressed promptly so the meeting is not undermined by avoidable omissions.",
        "keywords": ["chairman", "follow_up_actions", "meeting_preparation", "service_delivery"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "meeting_preparation", "follow_up"],
    },
    "ethics_105": {
        "question": "What does the Manpower Development Office (MDO) coordinate in the Civil Service?",
        "options": [
            "Preparation of draft Council memoranda on HRM matters.",
            "Deployment of staff to every ministry.",
            "Service-wide training and development.",
            "The pool system for senior officers.",
        ],
        "explanation": "The MDO coordinates service-wide training and development to help the Civil Service maintain and improve the quality of its manpower.",
        "keywords": ["mdo", "training_and_development", "service_wide", "civil_service"],
        "tags": ["civil_service_admin", "eth_values_integrity", "mdo", "training_and_development"],
    },
    "eth_general_gen_088": {
        "question": "Into which two classes should official files generally be grouped?",
        "options": [
            "Secret and open.",
            "Urgent and normal.",
            "Temporary and permanent.",
            "Subject and personal.",
        ],
        "explanation": "Official files are generally grouped into subject files and personal files so that correspondence and records can be organized according to their purpose and ownership.",
        "keywords": ["official_files", "subject_files", "personal_files", "classification"],
        "tags": ["civil_service_admin", "eth_general", "file_classification", "registry"],
    },
    "eth_general_gen_094": {
        "question": "What should characterize a good minute of a meeting?",
        "options": [
            "It should record jokes and informal remarks.",
            "It should be as verbose as possible.",
            "It should mainly reflect the secretary's personal opinions.",
            "It should be a faithful and accurate summary of what transpired.",
        ],
        "explanation": "A good minute should provide a faithful and accurate summary of what transpired at the meeting so that the record can be relied upon afterward.",
        "keywords": ["meeting_minutes", "accuracy", "summary", "official_record"],
        "tags": ["civil_service_admin", "eth_general", "meeting_minutes", "official_record"],
    },
    "clg_constitutional_governance_gen_078": {
        "question": "What was the primary focus of the Udoji Public Service Review Commission of 1972?",
        "options": [
            "Increasing efficiency and effectiveness in the Public Service.",
            "Limiting the powers of the Civil Service.",
            "Reducing the size of the Civil Service.",
            "Introducing new political reforms.",
        ],
        "explanation": "The Udoji Public Service Review Commission is chiefly remembered for its focus on improving efficiency and effectiveness in the Public Service.",
        "keywords": ["udoji_commission", "public_service_review", "efficiency", "effectiveness"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "udoji_commission", "public_service_reform"],
    },
    "clg_general_competency_gen_069": {
        "question": "What must employees be provided with under the principle of motivation?",
        "options": [
            "An opportunity to make their own rules.",
            "A pleasant and favourable working environment.",
            "More power than their superiors.",
            "An exclusive right to work from home.",
        ],
        "explanation": "Under the principle of motivation, employees should be provided with a pleasant and favourable working environment so they can perform well and realize their potential.",
        "keywords": ["motivation", "working_environment", "employees", "public_service"],
        "tags": ["constitutional_law", "clg_general_competency", "motivation", "working_environment"],
    },
    "FOI_AO_051": {
        "question": "What is typically contained in a personal file?",
        "options": [
            "Financial records of a ministry.",
            "The official history of a ministry.",
            "Correspondence and documents relating to a particular staff member.",
            "Documents on a general subject matter.",
        ],
        "explanation": "A personal file contains correspondence and related documents concerning a particular staff member, rather than documents on a general subject or ministry-wide issue.",
        "keywords": ["personal_file", "staff_records", "correspondence", "document_classification"],
        "tags": ["constitutional_law", "foi_access_obligations", "personal_file", "records_management"],
    },
    "FOI_AO_055": {
        "question": "What is a key objective of human resource management in the public service?",
        "options": [
            "To increase productivity by improving employees' competence, knowledge, skill, and attitude.",
            "To reduce the size of the Civil Service at all costs.",
            "To formulate government policy directly.",
            "To increase employees' personal salaries.",
        ],
        "explanation": "A key objective of HRM is to improve employees' competence, knowledge, skill, and attitude so that productivity and service performance improve.",
        "keywords": ["hrm", "productivity", "competence", "public_service"],
        "tags": ["constitutional_law", "foi_access_obligations", "human_resource_management", "productivity"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 8",
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
