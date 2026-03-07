#!/usr/bin/env python3
"""
Backfill required question metadata fields across topic JSON files.

Required fields:
- difficulty
- sourceDocument
- sourceSection
- year
- lastReviewed
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TOPICS_FILE = DATA_DIR / "topics.json"
CURRENT_YEAR = date.today().year

DEFAULT_SOURCE_DOCUMENTS = {
    "psr": "Public Service Rules (PSR 2021)",
    "financial_regulations": "Financial Regulations (FR)",
    "procurement_act": "Public Procurement Act (2007)",
    "constitutional_law": "Constitution of the Federal Republic of Nigeria and FOI Act",
    "civil_service_admin": "Federal Civil Service Handbook and Circulars",
    "leadership_management": "Leadership and Management Framework",
    "ict_management": "National ICT and Digital Governance Framework",
    "policy_analysis": "Public Policy and Governance Framework",
    "general_current_affairs": "Government Current Affairs Compendium",
    "competency_framework": "Directorate Competency Framework",
}

DEFAULT_TOPIC_YEARS = {
    "psr": 2021,
    "financial_regulations": 2009,
    "procurement_act": 2007,
    "constitutional_law": 1999,
    "civil_service_admin": 2017,
    "leadership_management": 2020,
    "ict_management": 2019,
    "policy_analysis": 2020,
    "general_current_affairs": CURRENT_YEAR,
    "competency_framework": 2020,
}


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def infer_year_from_text(text: str) -> int | None:
    if not text:
        return None
    matches = re.findall(r"\b(19\d{2}|20\d{2})\b", text)
    for raw in matches:
        year = int(raw)
        if 1900 <= year <= CURRENT_YEAR:
            return year
    return None


def get_subcategories(data):
    if isinstance(data, dict):
        if isinstance(data.get("subcategories"), list):
            return [s for s in data["subcategories"] if isinstance(s, dict)]
        if isinstance(data.get("domains"), list):
            out = []
            for domain in data["domains"]:
                if isinstance(domain, dict) and isinstance(domain.get("topics"), list):
                    out.extend([s for s in domain["topics"] if isinstance(s, dict)])
            return out
    if isinstance(data, list):
        return [s for s in data if isinstance(s, dict)]
    return []


def iterate_questions(subcategory: dict):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get("id")
    if (
        questions
        and isinstance(questions[0], dict)
        and sub_id
        and isinstance(questions[0].get(sub_id), list)
    ):
        return [q for q in questions[0][sub_id] if isinstance(q, dict)]
    return [q for q in questions if isinstance(q, dict)]


def main():
    parser = argparse.ArgumentParser(description="Backfill metadata fields in question pools")
    parser.add_argument("--apply", action="store_true", help="Write updates to disk")
    args = parser.parse_args()

    topics_doc = load_json(TOPICS_FILE)
    topics = [t for t in topics_doc.get("topics", []) if isinstance(t, dict)]

    review_date = date.today().isoformat()
    total_questions = 0
    total_updated = 0

    for topic in topics:
        topic_id = str(topic.get("id") or "").strip()
        topic_name = str(topic.get("name") or topic_id).strip()
        rel_file = str(topic.get("file") or "").strip()
        if not rel_file:
            continue

        path = ROOT / rel_file
        if not path.exists():
            continue

        payload = load_json(path)
        subcategories = get_subcategories(payload)
        if not subcategories:
            continue

        source_document = DEFAULT_SOURCE_DOCUMENTS.get(topic_id, topic_name or "Unknown Source")
        topic_year = DEFAULT_TOPIC_YEARS.get(topic_id, CURRENT_YEAR)
        file_updates = 0

        for sub in subcategories:
            sub_name = str(sub.get("name") or sub.get("id") or "General").strip()
            for question in iterate_questions(sub):
                total_questions += 1
                updated = False

                if question.get("difficulty") in (None, ""):
                    question["difficulty"] = "medium"
                    updated = True
                if question.get("sourceDocument") in (None, ""):
                    question["sourceDocument"] = source_document
                    updated = True
                if question.get("sourceSection") in (None, ""):
                    question["sourceSection"] = sub_name
                    updated = True
                if question.get("year") in (None, ""):
                    inferred = infer_year_from_text(
                        f"{question.get('question', '')} {question.get('explanation', '')}"
                    )
                    question["year"] = int(inferred or topic_year)
                    updated = True
                if question.get("lastReviewed") in (None, ""):
                    question["lastReviewed"] = review_date
                    updated = True

                if updated:
                    total_updated += 1
                    file_updates += 1

        if file_updates and args.apply:
            dump_json(path, payload)
        print(f"- {rel_file}: questions={sum(len(iterate_questions(s)) for s in subcategories)}, updated={file_updates}")

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"\n[{mode}] total_questions={total_questions}, updated_questions={total_updated}")


if __name__ == "__main__":
    main()
