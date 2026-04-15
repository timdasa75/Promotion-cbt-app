#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 5."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round5.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round5.md"

REWRITES = {
    "csh_ap_073": {
        "question": "What is the Office of the Head of the Civil Service of the Federation (OHCSF) primarily responsible for?",
        "options": [
            "General supervision of the affairs of the Civil Service.",
            "Recruitment of junior staff.",
            "Disciplinary control of all civil servants.",
            "Auditing all government accounts.",
        ],
        "explanation": "The OHCSF provides general supervision over the affairs of the Civil Service and supports service-wide administrative coordination.",
        "keywords": ["ohcsf", "civil_service", "supervision", "administration"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "ohcsf", "civil_service_supervision"],
    },
    "csh_ap_078": {
        "question": "What should typed drafts of minutes, briefs, and letters include?",
        "options": [
            "Headings that indicate the subject of the draft.",
            "Only the date.",
            "Random numbers.",
            "The name of the typist.",
        ],
        "explanation": "Typed drafts of minutes, briefs, and letters should carry headings that clearly indicate the subject matter of the draft.",
        "keywords": ["typed_drafts", "minutes", "briefs", "headings"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "drafting", "official_correspondence"],
    },
    "csh_ap_082": {
        "question": "For clarity and proper handling, what should typed drafts of minutes, briefs, and letters contain?",
        "options": [
            "Only the date.",
            "Random numbers.",
            "Headings that indicate the subject of the draft.",
            "The name of the typist.",
        ],
        "explanation": "Typed drafts should include headings that indicate the subject matter so the documents can be identified and handled correctly.",
        "keywords": ["typed_drafts", "official_writing", "headings", "document_handling"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "drafting", "document_handling"],
    },
    "csh_disc_054": {
        "question": "In official correspondence, what does the term 'minute/memo' mean?",
        "options": [
            "A personal note.",
            "A short report for a supervisor.",
            "A written submission presenting a view or position on an issue.",
            "A summary of a meeting.",
        ],
        "explanation": "A minute or memo is a written submission used to present a view, comment, or position on an issue within official correspondence.",
        "keywords": ["minute", "memo", "official_correspondence", "written_submission"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "minute_memo", "official_correspondence"],
    },
    "csh_disc_059": {
        "question": "What does the principle of diligence require of a civil servant?",
        "options": [
            "To be hardworking and conscientious, and to give their best to the job.",
            "To be lazy and apathetic.",
            "To delegate all tasks to subordinates.",
            "To work only when closely supervised.",
        ],
        "explanation": "The principle of diligence requires a civil servant to be hardworking, conscientious, and committed to giving their best to the job.",
        "keywords": ["diligence", "civil_servant", "work_ethic", "conduct"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "diligence", "service_ethics"],
    },
    "csh_disc_060": {
        "question": "What is the implication of failing to take reasonable care of documents entrusted to a civil servant?",
        "options": [
            "It is a normal part of the job.",
            "It is an offence.",
            "It is only a minor infraction.",
            "It is always excusable.",
        ],
        "explanation": "A civil servant is expected to take reasonable care of official documents. Failure to do so constitutes an offence.",
        "keywords": ["documents", "care", "offence", "civil_servant"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "document_custody", "service_offences"],
    },
    "csh_duty_073": {
        "question": "Who should receive copies of a handing-over note?",
        "options": [
            "The general public.",
            "The Head of Department, the Personnel Officer, and the officer's successor.",
            "Only the officer's predecessor.",
            "The officer's friends and family.",
        ],
        "explanation": "Copies of a handing-over note should be sent to the Head of Department, the Personnel Officer, and the officer's successor to support continuity and accountability.",
        "keywords": ["handing_over_note", "head_of_department", "personnel_officer", "succession"],
        "tags": ["civil_service_admin", "csh_duties_responsibilities", "handing_over", "service_continuity"],
    },
    "FOI_EX_058": {
        "question": "What should a good brief try to recommend?",
        "options": [
            "More research.",
            "More meetings.",
            "The problem itself.",
            "A solution to an outstanding problem.",
        ],
        "explanation": "A good brief should help decision-making by recommending a workable solution to the problem under consideration.",
        "keywords": ["brief", "recommendation", "problem_solving", "decision_support"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "brief_writing", "decision_support"],
    },
    "FOI_EX_068": {
        "question": "What should never be used for drafting if it contains classified information?",
        "options": [
            "Recycled paper.",
            "Discarded papers containing classified information.",
            "Plain notebooks.",
            "Brand new paper.",
        ],
        "explanation": "Discarded papers containing classified information should never be reused for drafting because they may expose protected information.",
        "keywords": ["classified_information", "drafting", "discarded_papers", "confidentiality"],
        "tags": ["constitutional_law", "foi_exemptions_public_interest", "classified_information", "document_security"],
    },
    "clg_constitutional_governance_gen_063": {
        "question": "What was the primary focus of the Udoji Public Service Review Commission of 1972?",
        "options": [
            "Limiting the powers of the Civil Service.",
            "Increasing efficiency and effectiveness in the Public Service.",
            "Reducing the size of the Civil Service.",
            "Introducing new political reforms.",
        ],
        "explanation": "The Udoji Commission is best known for focusing on how to improve the efficiency and effectiveness of the Public Service.",
        "keywords": ["udoji_commission", "public_service", "efficiency", "effectiveness"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "udoji_commission", "public_service_reform"],
    },
    "clg_constitutional_governance_gen_066": {
        "question": "The principle of neutrality means the public service remains neutral with respect to whom?",
        "options": [
            "The public.",
            "Its employees.",
            "The government of the day.",
            "Opposition parties.",
        ],
        "explanation": "The principle of neutrality requires the public service to serve the government of the day professionally without becoming partisan.",
        "keywords": ["neutrality", "public_service", "government_of_the_day", "impartiality"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "neutrality", "public_service_principles"],
    },
    "clg_constitutional_governance_gen_067": {
        "question": "Under the principle of quality, effectiveness, and efficiency, the public service should make optimal use of what?",
        "options": [
            "Political connections.",
            "Obsolete technology.",
            "The resources at its disposal.",
            "Personal favors.",
        ],
        "explanation": "This principle requires the public service to deliver high-quality results by making the best possible use of the resources available to it.",
        "keywords": ["quality", "effectiveness", "efficiency", "resources"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "efficiency", "resource_use"],
    },
    "ict_eg_082": {
        "question": "Which characteristic of good governance requires institutions and processes to serve all stakeholders within a reasonable timeframe?",
        "options": [
            "Purposeful leadership.",
            "Consensus orientation.",
            "Security and order.",
            "Responsiveness.",
        ],
        "explanation": "Responsiveness means institutions and processes serve stakeholders within a reasonable timeframe.",
        "keywords": ["good_governance", "responsiveness", "stakeholders", "service_delivery"],
        "tags": ["ict_management", "ict_e_governance", "good_governance", "responsiveness"],
    },
    "ict_eg_092": {
        "question": "What should appendices or schedules attached to a letter always be marked with?",
        "options": [
            "The file number only.",
            "The reference of the letter to which they were attached.",
            "The date they were created.",
            "The name of the sender.",
        ],
        "explanation": "Appendices or schedules should be marked with the reference of the letter they accompany so they can be traced back if detached.",
        "keywords": ["appendices", "schedules", "letter_reference", "document_tracking"],
        "tags": ["ict_management", "ict_e_governance", "document_tracking", "official_correspondence"],
    },
    "ict_eg_093": {
        "question": "If a letter has more than one enclosure, what should be indicated?",
        "options": [
            "The type of enclosures.",
            "The number of pages.",
            "The number of enclosures.",
            "The weight of the enclosures.",
        ],
        "explanation": "If a letter has more than one enclosure, the number of enclosures should be indicated, for example as 'Enc. (2)'.",
        "keywords": ["letter", "enclosures", "official_correspondence", "notation"],
        "tags": ["ict_management", "ict_e_governance", "official_correspondence", "enclosures"],
    },
    "ict_li_099": {
        "question": "Who should sign the original and copies of the handing-over notes?",
        "options": [
            "The Head of Department only.",
            "Both the officer handing over and the officer taking over.",
            "Only the officer taking over.",
            "Only the officer handing over.",
        ],
        "explanation": "The original and copies of the handing-over notes should be signed by both the officer handing over and the officer taking over.",
        "keywords": ["handing_over_notes", "signatures", "taking_over", "officer_handover"],
        "tags": ["ict_management", "ict_literacy_innovation", "handing_over", "signatures"],
    },
    "ict_sec_080": {
        "question": "Which officers are personally responsible for the safe custody of the original keys of strong-rooms, safes, cash tanks, or cash boxes, and collectively responsible for their contents?",
        "options": [
            "Officers holding the keys.",
            "The security guard.",
            "Only the cashier.",
            "The Accounting Officer only.",
        ],
        "explanation": "Officers holding the keys are personally responsible for keeping them safe and are collectively responsible for the contents secured by them.",
        "keywords": ["key_custody", "strong_rooms", "safes", "accountability"],
        "tags": ["ict_management", "ict_security", "key_custody", "asset_security"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 5",
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
        found = None
        for topic_id, doc in docs.items():
            for sub in doc.get("subcategories", []):
                for q in sub.get("questions", []):
                    if q.get("id") == question_id:
                        found = (topic_id, topic_files[topic_id], sub, q)
                        break
                if found:
                    break
            if found:
                break
        if not found:
            raise SystemExit(f"Question {question_id} not found")

        topic_id, path, sub, q = found
        old_question = q.get("question", "")
        q["question"] = patch["question"]
        q["options"] = patch["options"]
        q["explanation"] = patch["explanation"]
        q["keywords"] = patch["keywords"]
        q["tags"] = patch["tags"]
        q["lastReviewed"] = "2026-04-02"
        applied.append({
            "question_id": question_id,
            "source_topic": topic_id,
            "source_subcategory": sub.get("id"),
            "source_file": str(path.relative_to(root)).replace("\\", "/"),
            "old_question": old_question,
            "new_question": patch["question"],
        })

    for topic_id, path in topic_files.items():
        if topic_id in docs:
            save_json(path, docs[topic_id])

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
    print(json.dumps({"applied_rewrites": len(applied), "question_ids": [item['question_id'] for item in applied]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
