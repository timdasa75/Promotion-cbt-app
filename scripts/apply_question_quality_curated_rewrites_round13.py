#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 13."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round13.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round13.md"

REWRITES = {
    "ppa_objectives_073": {
        "question": "What does the principle of diligence require of a Civil Servant?",
        "options": [
            "To work only during official hours and do no more.",
            "To be hardworking, conscientious, and committed to giving their best to the job.",
            "To be lazy and apathetic.",
            "To delegate all tasks to subordinates regardless of responsibility.",
        ],
        "explanation": "The principle of diligence requires a Civil Servant to be hardworking, conscientious, and committed to giving their best to official duties.",
        "keywords": ["diligence", "civil_servant", "hardworking", "conscientiousness"],
        "tags": ["procurement_act", "proc_objectives_institutions", "diligence", "civil_service_values"],
    },
    "ppa_bid_051": {
        "question": "Which of the following was one limitation of the 1988 Civil Service Reforms?",
        "options": [
            "Absence of resistance to change.",
            "Adequate funding of the reforms.",
            "Strong commitment from top government functionaries.",
            "Inadequate knowledge of the reform provisions among Civil Servants and senior officials.",
        ],
        "explanation": "One limitation of the 1988 Civil Service Reforms was that many Civil Servants and top government functionaries lacked adequate knowledge of the reform provisions.",
        "keywords": ["1988_civil_service_reforms", "limitations", "reform_implementation", "knowledge_gap"],
        "tags": ["procurement_act", "proc_bidding_evaluation", "civil_service_reforms", "implementation_limits"],
    },
    "ppa_bid_061": {
        "question": "What is typically contained in a personal file?",
        "options": [
            "The official history of a ministry.",
            "Documents on a particular subject matter.",
            "Correspondence and documents relating to a particular staff member.",
            "Financial records of a ministry.",
        ],
        "explanation": "A personal file contains correspondence and related documents concerning a particular staff member rather than ministry-wide or subject-wide records.",
        "keywords": ["personal_file", "staff_records", "correspondence", "records_management"],
        "tags": ["procurement_act", "proc_bidding_evaluation", "personal_file", "records_management"],
    },
    "ppa_bid_070": {
        "question": "What is the main purpose of the minutes of a meeting?",
        "options": [
            "To record the private lives of members.",
            "To summarize only the chairman's personal opinions.",
            "To list only the names of members present.",
            "To serve as the official record of the proceedings and decisions of the meeting.",
        ],
        "explanation": "Minutes serve as the official record of the proceedings and decisions of a meeting so that actions and resolutions can be traced afterward.",
        "keywords": ["meeting_minutes", "official_record", "proceedings", "decisions"],
        "tags": ["procurement_act", "proc_bidding_evaluation", "meeting_minutes", "official_record"],
    },
    "ppa_ethic_060": {
        "question": "What role do the minutes of a meeting perform?",
        "options": [
            "They serve as the official record of the proceedings and decisions of the meeting.",
            "They provide only a list of members in attendance.",
            "They document the private lives of members.",
            "They summarize only the chairman's personal views.",
        ],
        "explanation": "The minutes of a meeting provide the official record of what was discussed, decided, and assigned during the meeting.",
        "keywords": ["minutes_of_meeting", "official_record", "meeting_proceedings", "decisions"],
        "tags": ["procurement_act", "proc_transparency_ethics", "meeting_minutes", "official_record"],
    },
    "ppa_ethic_068": {
        "question": "When is it advisable to type short drafts or minutes?",
        "options": [
            "Always, regardless of legibility.",
            "Only when the writer is a senior officer.",
            "When the handwriting is not sufficiently legible.",
            "Never.",
        ],
        "explanation": "Short drafts or minutes should be typed when the writer's handwriting is not sufficiently legible to ensure clarity and proper handling of the document.",
        "keywords": ["drafting", "minutes", "legibility", "typewritten_documents"],
        "tags": ["procurement_act", "proc_transparency_ethics", "drafting", "legibility"],
    },
    "ppa_ethic_069": {
        "question": "What should be done if handwriting is not easily readable on minutes or drafts covering more than half of an A4 page?",
        "options": [
            "They should be typewritten.",
            "They should still be handwritten regardless of legibility.",
            "They should be returned without processing.",
            "They should be discarded.",
        ],
        "explanation": "Where handwriting is not easily readable, minutes or drafts covering more than half of an A4 page should be typewritten so the record remains clear and usable.",
        "keywords": ["minutes", "drafts", "typewritten_documents", "readability"],
        "tags": ["procurement_act", "proc_transparency_ethics", "drafting", "readability"],
    },
    "clg_constitutional_governance_gen_064": {
        "question": "What does the principle of neutrality require of Civil Servants?",
        "options": [
            "To take part in partisan politics.",
            "To avoid having personal opinions altogether.",
            "To serve the government of the day without political bias.",
            "To criticize government policies publicly as part of their duties.",
        ],
        "explanation": "The principle of neutrality requires Civil Servants to serve the government of the day faithfully without partisan political bias.",
        "keywords": ["neutrality", "civil_servants", "political_bias", "public_service_principles"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "neutrality", "civil_service_principles"],
    },
    "clg_constitutional_governance_gen_065": {
        "question": "What does unprofessional behaviour imply in a Civil Servant?",
        "options": [
            "Working hard and showing diligence.",
            "Treating members of the public with respect.",
            "Attending all official meetings.",
            "Displaying rudeness, discourtesy, insensitivity, and inefficiency.",
        ],
        "explanation": "Unprofessional behaviour in the Civil Service is associated with rudeness, discourtesy, insensitivity, and inefficiency, all of which weaken public confidence.",
        "keywords": ["unprofessional_behaviour", "discourtesy", "insensitivity", "inefficiency"],
        "tags": ["constitutional_law", "clg_constitutional_governance", "professionalism", "public_service_conduct"],
    },
    "clg_general_competency_gen_070": {
        "question": "What may result from indifference to, or disguised encouragement of, nepotism and favouritism?",
        "options": [
            "Economic stability.",
            "Increased productivity.",
            "Improved national unity.",
            "Civil unrest.",
        ],
        "explanation": "Indifference to nepotism and favouritism can fuel resentment, weaken trust in institutions, and contribute to civil unrest.",
        "keywords": ["nepotism", "favouritism", "civil_unrest", "institutional_trust"],
        "tags": ["constitutional_law", "clg_general_competency", "nepotism", "institutional_trust"],
    },
    "clg_general_competency_gen_088": {
        "question": "What is a key part of the principle of motivation in the public service?",
        "options": [
            "Giving employees more power than their superiors.",
            "Allowing employees to make their own rules.",
            "Providing employees with a pleasant and favourable working environment.",
            "Giving employees an exclusive right to work from home.",
        ],
        "explanation": "A key part of the principle of motivation is providing employees with a pleasant and favourable working environment that supports effective performance.",
        "keywords": ["motivation", "working_environment", "employees", "public_service"],
        "tags": ["constitutional_law", "clg_general_competency", "motivation", "working_environment"],
    },
    "FOI_AO_063": {
        "question": "A key objective of human resource management is to improve employees' competence, knowledge, skill, and attitude in order to do what?",
        "options": [
            "Reduce the size of the Civil Service.",
            "Formulate government policy directly.",
            "Increase personal salaries.",
            "Increase productivity.",
        ],
        "explanation": "Human resource management seeks to improve employees' competence, knowledge, skill, and attitude so that productivity and service effectiveness increase.",
        "keywords": ["human_resource_management", "competence", "skills", "productivity"],
        "tags": ["constitutional_law", "foi_access_obligations", "human_resource_management", "productivity"],
    },
    "FOI_AO_066": {
        "question": "What is the aim of classifying documents?",
        "options": [
            "To hide their contents from other ministries.",
            "To make them difficult to access.",
            "To prevent the public from ever seeing them.",
            "To indicate the degree of care required for each document.",
        ],
        "explanation": "Documents are classified so officers understand the degree of care, protection, and handling each document requires.",
        "keywords": ["document_classification", "document_care", "handling", "protection"],
        "tags": ["constitutional_law", "foi_access_obligations", "document_classification", "document_handling"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 13",
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
        "round": 13,
        "applied": applied,
    }
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
