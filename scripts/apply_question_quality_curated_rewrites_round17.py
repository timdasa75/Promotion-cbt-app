#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 17."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round17.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round17.md"

REWRITES = {
    "leadership_lsm_054": {
        "question": "How should official files be classified in registry practice?",
        "options": [
            "Temporary and permanent.",
            "Urgent and normal.",
            "Secret and open.",
            "Subject files and personal files.",
        ],
        "explanation": "In registry practice, official files are commonly classified into subject files and personal files so that records are arranged according to their purpose and use.",
        "keywords": ["file_classification", "registry_practice", "subject_files", "personal_files"],
        "tags": ["leadership_management", "lead_principles_styles", "file_classification", "registry_practice", "records_management"],
    },
    "leadership_lsm_055": {
        "question": "Under what circumstance may a document be removed from a file?",
        "options": [
            "When a grave error is being corrected with proper approval.",
            "When an officer is in a hurry.",
            "When the document is no longer needed.",
            "When the document is personal.",
        ],
        "explanation": "A document should not be removed from a file except to correct a grave error and only with the approval of the appropriate senior authority.",
        "keywords": ["file_management", "grave_error", "approval", "document_removal"],
        "tags": ["leadership_management", "lead_principles_styles", "file_management", "document_control", "office_procedure"],
    },
    "leadership_lsm_056": {
        "question": "When is it permissible to remove a document from a file?",
        "options": [
            "When the document is no longer needed.",
            "When a grave error is being corrected with proper approval.",
            "When an officer is in a hurry.",
            "When the document is personal.",
        ],
        "explanation": "Removing a document from a file is permitted only to correct a grave error and with the approval of the appropriate senior authority.",
        "keywords": ["document_removal", "file_control", "grave_error", "approval"],
        "tags": ["leadership_management", "lead_principles_styles", "document_removal", "file_control", "office_procedure"],
    },
    "leadership_lsm_065": {
        "question": "Which situation justifies removing a document from a file?",
        "options": [
            "Correcting a grave error with proper approval.",
            "The document is no longer needed.",
            "An officer is in a hurry.",
            "The document is personal.",
        ],
        "explanation": "The justified reason for removing a document from a file is to correct a grave error, and that action must be properly approved.",
        "keywords": ["document_removal", "grave_error", "approved_correction", "records_control"],
        "tags": ["leadership_management", "lead_principles_styles", "document_removal", "records_control", "office_procedure"],
    },
    "leadership_lsm_066": {
        "question": "Which option states the approved exception to the rule against removing documents from a file?",
        "options": [
            "Correcting a grave error with proper approval.",
            "Removing a personal document from the file.",
            "Removing a document that is no longer needed.",
            "Removing a document because an officer is in a hurry.",
        ],
        "explanation": "The approved exception to the rule against removing documents from a file is when a grave error is being corrected with the approval of the proper authority.",
        "keywords": ["approved_exception", "file_rules", "grave_error", "document_control"],
        "tags": ["leadership_management", "lead_principles_styles", "approved_exception", "file_rules", "document_control"],
    },
    "neg_principles_outcomes_gen_065": {
        "question": "When bringing a meeting to a close, what is one of the chairman's key responsibilities?",
        "options": [
            "To dismiss the secretariat.",
            "To take all the credit for the meeting's success.",
            "To tell the members simply to go home.",
            "To summarize the conclusions of the meeting for the agreement of the other members.",
        ],
        "explanation": "When closing a meeting, the chairman should summarize the conclusions reached and confirm that the other members agree with those conclusions.",
        "keywords": ["meeting_closure", "chairman_role", "meeting_conclusions", "consensus"],
        "tags": ["leadership_management", "neg_principles_outcomes", "meeting_closure", "chairmanship", "consensus_building"],
    },
    "policy_constitution_080": {
        "question": "What should accompany a meeting notice and agenda?",
        "options": [
            "The private phone numbers of the members.",
            "The financial statements of the ministry.",
            "The personal files of all members.",
            "The minutes of the last meeting and any other relevant documents.",
        ],
        "explanation": "A meeting notice and agenda should be accompanied by the minutes of the last meeting and any other documents relevant to the matters scheduled for discussion.",
        "keywords": ["meeting_notice", "agenda", "meeting_minutes", "supporting_documents"],
        "tags": ["policy_analysis", "pol_formulation_cycle", "meeting_notice", "agenda_management", "supporting_documents"],
    },
    "policy_constitution_082": {
        "question": "What is a major danger when an organization's records are not kept properly?",
        "options": [
            "The public will immediately lose trust in the government.",
            "It can lead to policy reversals and conflicts.",
            "Civil servants will not be paid on time.",
            "It will automatically lead to loss of government revenue.",
        ],
        "explanation": "Poor records management can lead to policy reversals, conflicts between offices, and administrative confusion because decisions can no longer be traced reliably.",
        "keywords": ["records_management", "policy_reversals", "administrative_conflict", "documentation"],
        "tags": ["policy_analysis", "pol_formulation_cycle", "records_management", "policy_consistency", "administrative_control"],
    },
    "policy_constitution_089": {
        "question": "What does due procedure require for projects funded by government?",
        "options": [
            "That they be awarded at the discretion of one individual.",
            "That they follow laid-down rules and regulations.",
            "That they be exempt from oversight.",
            "That speed be prioritized above procedure.",
        ],
        "explanation": "Due procedure requires government-funded projects to follow prescribed laws, rules, regulations, and approved administrative practices.",
        "keywords": ["due_procedure", "government_projects", "rules_and_regulations", "compliance"],
        "tags": ["policy_analysis", "pol_formulation_cycle", "due_procedure", "project_governance", "compliance"],
    },
    "policy_psr_046": {
        "question": "What is the role of Administrative and Professional Officers in government decision-making?",
        "options": [
            "To advise on appropriate decisions and then help put them into effect.",
            "To manage the finances of the ministry.",
            "To make policy decisions for the Minister without consultation.",
            "To handle all legal matters of the ministry.",
        ],
        "explanation": "Administrative and Professional Officers help bring together relevant views, advise on the appropriate decision to be taken, and then support the implementation of that decision.",
        "keywords": ["administrative_officers", "professional_officers", "decision_making", "implementation"],
        "tags": ["policy_analysis", "pol_implementation_evaluation", "administrative_officers", "decision_support", "implementation"],
    },
    "policy_psr_049": {
        "question": "After receiving notice to serve a meeting, what should the secretary do first?",
        "options": [
            "Start writing the minutes immediately.",
            "Contact the convening authority to understand the purpose of the meeting and obtain the terms of reference.",
            "Do nothing until the chairman calls.",
            "Prepare the agenda immediately without consultation.",
        ],
        "explanation": "The secretary should first contact the convening authority to understand the purpose of the meeting and obtain the terms of reference before preparing the agenda or supporting materials.",
        "keywords": ["meeting_secretary", "convening_authority", "terms_of_reference", "meeting_preparation"],
        "tags": ["policy_analysis", "pol_implementation_evaluation", "meeting_secretary", "terms_of_reference", "meeting_preparation"],
    },
    "ethics_101": {
        "question": "What does the Manpower Development Office coordinate across the Civil Service?",
        "options": [
            "Service-wide administration of training and development.",
            "The pool system for senior officers.",
            "Preparation of draft Council memoranda on human resource matters.",
            "Routine deployment of staff.",
        ],
        "explanation": "The Manpower Development Office coordinates service-wide training and development so that the Civil Service maintains the quality manpower it needs.",
        "keywords": ["manpower_development_office", "training_and_development", "civil_service_capacity", "human_resources"],
        "tags": ["civil_service_admin", "eth_values_integrity", "manpower_development_office", "training_and_development", "human_resources"],
    },
    "clg_constitutional_governance_gen_079": {
        "question": "What does the principle of neutrality require of civil servants?",
        "options": [
            "They must serve the government of the day without political bias.",
            "They should publicly criticize government policies.",
            "They must not have personal opinions.",
            "They should take part in partisan politics.",
        ],
        "explanation": "The principle of neutrality requires civil servants to serve the government of the day faithfully without partisan bias and without taking part in partisan politics.",
        "keywords": ["neutrality", "civil_servants", "political_bias", "constitutional_governance"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "neutrality", "civil_service_ethics", "constitutional_governance"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 17",
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
    payload = {"round": 17, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
