#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 11."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round11.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round11.md"

REWRITES = {
    "leadership_lsm_051": {
        "question": "How should the relationship between a Minister and a Parastatal be understood in public administration?",
        "options": [
            "As a relationship of complete control by the Minister.",
            "As the relationship between a superior and a subordinate.",
            "As the relationship between an adviser and a client.",
            "As a relationship of coordination and supervision.",
        ],
        "explanation": "The relationship between a Minister and a Parastatal is one of coordination, supervision, and policy direction rather than direct day-to-day subordination.",
        "keywords": ["minister", "parastatal", "coordination", "supervision"],
        "tags": ["leadership_management", "lead_principles_styles", "minister", "parastatal_relationship"],
    },
    "leadership_lsm_052": {
        "question": "When the objective of a meeting is complex, how should it be stated?",
        "options": [
            "It should be ignored to save time.",
            "Each member should decide the objective independently.",
            "The chairman should decide it privately without documentation.",
            "It should be set out in formal Terms of Reference.",
        ],
        "explanation": "When the purpose of a meeting is complex, the objective should be clearly set out in formal Terms of Reference so members understand the scope and expectations.",
        "keywords": ["meeting_objective", "terms_of_reference", "meeting_management", "chairman"],
        "tags": ["leadership_management", "lead_principles_styles", "meeting_management", "terms_of_reference"],
    },
    "leadership_lsm_053": {
        "question": "When writing a minute, what should an officer cite to support a recommendation or position?",
        "options": [
            "Unofficial conversations.",
            "Previous government decisions and rules.",
            "Personal experiences.",
            "The opinions of colleagues.",
        ],
        "explanation": "A minute should be supported by previous government decisions, rules, or regulations so the officer's recommendation rests on established authority rather than personal opinion.",
        "keywords": ["minute_writing", "government_decisions", "rules", "recommendation_support"],
        "tags": ["leadership_management", "lead_principles_styles", "minute_writing", "government_rules"],
    },
    "leadership_lsm_063": {
        "question": "What should be done if a handwritten minute or draft covering more than half an A4 page is not easily readable?",
        "options": [
            "It should be typewritten.",
            "It should be discarded.",
            "It should be sent back without action.",
            "It should still be submitted in the same handwriting.",
        ],
        "explanation": "If handwriting is not easily readable, lengthy minutes or drafts should be typewritten so the record remains clear, professional, and easy to process.",
        "keywords": ["minute_writing", "typewritten_drafts", "readability", "official_records"],
        "tags": ["leadership_management", "lead_principles_styles", "minute_writing", "readability"],
    },
    "leadership_lsm_075": {
        "question": "What is the purpose of the Duplicate Note-Book System?",
        "options": [
            "To record meeting minutes.",
            "To create duplicate files for every case.",
            "To keep an officer's private notes.",
            "To record the file number, date, and destination whenever a file is sent out.",
        ],
        "explanation": "The Duplicate Note-Book System is used to record the number, date, and destination of files sent out so their movement can be tracked properly.",
        "keywords": ["duplicate_notebook_system", "file_movement", "registry", "tracking"],
        "tags": ["leadership_management", "lead_principles_styles", "file_movement", "registry_tracking"],
    },
    "leadership_smp_057": {
        "question": "Which method should never be used for communication addressed to an overseas government?",
        "options": [
            "Transmission through approved diplomatic correspondence channels.",
            "Transmission through the Ministry of Foreign Affairs.",
            "Transmission through established government channels.",
            "Direct communication from the originating office.",
        ],
        "explanation": "Communication addressed to an overseas government should not be made directly by the originating office; it should pass through the proper diplomatic and foreign-affairs channels.",
        "keywords": ["overseas_government", "diplomatic_channels", "foreign_affairs", "official_communication"],
        "tags": ["leadership_management", "lead_strategic_management", "official_communication", "diplomatic_channels"],
    },
    "leadership_smp_059": {
        "question": "How does a memorandum differ from an official letter?",
        "options": [
            "A memorandum is used for external communication, while a letter is used internally.",
            "A memorandum is always shorter than a letter.",
            "A memorandum is used for internal communication, while a letter is used for external communication.",
            "A memorandum is always longer than a letter.",
        ],
        "explanation": "A memorandum is used for internal communication within a ministry or department, while an official letter is used for communication outside that internal structure.",
        "keywords": ["memorandum", "official_letter", "internal_communication", "external_communication"],
        "tags": ["leadership_management", "lead_strategic_management", "memorandum", "official_correspondence"],
    },
    "neg_principles_outcomes_gen_063": {
        "question": "What is one of the chairman's key responsibilities when closing a meeting?",
        "options": [
            "To dismiss the secretariat immediately.",
            "To tell members to leave without a summary.",
            "To summarize the conclusions of the meeting for the agreement of the members.",
            "To claim sole credit for the meeting's success.",
        ],
        "explanation": "When closing a meeting, the chairman should summarize the conclusions reached and secure the agreement of the members so the record is clear and shared.",
        "keywords": ["chairman", "closing_a_meeting", "meeting_conclusions", "member_agreement"],
        "tags": ["leadership_management", "neg_principles_outcomes", "chairman", "meeting_closure"],
    },
    "csh_disc_053": {
        "question": "With whom must an officer not communicate on official business outside the proper channel unless directed by a superior officer?",
        "options": [
            "The Head of Department.",
            "A junior officer in the same office.",
            "A more senior officer in the same ministry.",
            "A non-official or non-government person.",
        ],
        "explanation": "An officer must not communicate on official business with a non-official or non-government person outside the proper channel unless specifically directed to do so by a superior officer.",
        "keywords": ["official_business", "proper_channel", "superior_officer", "non_government_person"],
        "tags": ["civil_service_admin", "csh_discipline_conduct", "official_business", "proper_channel"],
    },
    "csh_sdg_051": {
        "question": "If the chairman has follow-up actions to complete before a meeting, what should he do?",
        "options": [
            "Delegate them casually without oversight.",
            "Address them promptly before the meeting.",
            "Ignore them until the meeting begins.",
            "Leave them until after the meeting.",
        ],
        "explanation": "If the chairman has follow-up actions to complete before a meeting, they should be addressed promptly so the meeting is not weakened by avoidable omissions.",
        "keywords": ["chairman", "follow_up_actions", "meeting_preparation", "prompt_action"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "meeting_preparation", "follow_up_actions"],
    },
    "csh_sdg_056": {
        "question": "Which body receives allegations that a public officer has breached the Code of Conduct?",
        "options": [
            "The Head of the Civil Service of the Federation.",
            "The Federal Civil Service Commission.",
            "The President.",
            "The Code of Conduct Bureau.",
        ],
        "explanation": "Allegations that a public officer has breached the Code of Conduct are made to the Code of Conduct Bureau, which handles such complaints under the integrity framework.",
        "keywords": ["code_of_conduct_bureau", "public_officer", "breach", "allegations"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "code_of_conduct_bureau", "integrity_complaints"],
    },
    "csh_sdg_062": {
        "question": "What is considered a very serious offence for a Civil Servant?",
        "options": [
            "Talking to a colleague during office hours.",
            "Taking a routine day off.",
            "Unauthorized disclosure of information acquired in the course of duty.",
            "Arriving late to a meeting once.",
        ],
        "explanation": "Unauthorized disclosure of information acquired in the course of duty is treated as a very serious offence because it violates trust, confidentiality, and official responsibility.",
        "keywords": ["serious_offence", "unauthorized_disclosure", "confidentiality", "civil_servant"],
        "tags": ["civil_service_admin", "csh_service_delivery_grievance", "serious_offence", "unauthorized_disclosure"],
    },
    "eth_general_gen_085": {
        "question": "What should a minute contain in addition to a summary of the facts of the case?",
        "options": [
            "The officer's recommendations and conclusions.",
            "A detailed financial analysis in every case.",
            "A list of all staff involved.",
            "The officer's personal opinions only.",
        ],
        "explanation": "A good minute should contain a summary of the facts together with the officer's recommendations and conclusions so that action can be considered on a clear record.",
        "keywords": ["minute_writing", "facts_of_case", "recommendations", "conclusions"],
        "tags": ["civil_service_admin", "eth_general", "minute_writing", "official_recommendations"],
    },
    "eth_general_gen_086": {
        "question": "Which quality best describes a good minute?",
        "options": [
            "It should be written in a conversational tone.",
            "It should be verbose and include all personal thoughts.",
            "It should be written only by senior officers.",
            "It should be brief, factual, and free from grammatical errors.",
        ],
        "explanation": "A good minute should be brief, factual, well reasoned, and free from grammatical errors, spelling mistakes, and ambiguity.",
        "keywords": ["good_minute", "brief", "factual", "clarity"],
        "tags": ["civil_service_admin", "eth_general", "minute_writing", "clarity"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 11",
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
        "round": 11,
        "applied": applied,
    }
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
