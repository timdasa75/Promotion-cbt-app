#!/usr/bin/env python3
"""
Prune fallback variants in known thin-coverage subtopics to allow PDF-sourced replacements.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.augment_from_pdf import (
    TODAY,
    fix_pdf_artifacts,
    normalize,
    normalize_currency,
    rewrite_question,
)

TOPICS_FILE = ROOT / "data" / "topics.json"
PDF_FILE = ROOT / "docs" / "pdf_questions_raw.json"

THIN_SUB_NAMES = {
    "Objectives & Institutions",
    "Bidding, Evaluation & Award",
    "Eligibility, Consultants & Budgeting",
    "Implementation, Monitoring & Sanctions",
    "Constitutional Structure, Bodies & Principles",
    "Legal Frameworks & Statutory Compliance",
    "General Competency, Ethics & Reforms",
    "Access Rights & Obligations (FOI)",
    "Exemptions & Public Interest (FOI)",
    "Offences, Penalties & Enforcement (FOI)",
    "Performance & Training",
    "Administrative Procedures",
    "Innovation & Technology in Service",
    "Service Delivery & Grievance",
    "Code of Conduct & Ethical Principles",
    "Civil Service Values & Integrity",
    "Anti-Corruption Measures",
    "Conflict of Interest",
    "Misconduct & Discipline",
    "General Ethics",
    "Leadership Principles & Styles",
    "Management Functions & Performance",
    "Negotiation Principles & Outcomes",
    "Negotiating Structures & Bodies",
    "Dispute Resolution & Labour Law",
    "ICT Fundamentals & Concepts",
    "E-Governance & Digital Services",
    "Digital Security & Cybersecurity",
    "Digital Literacy & Innovation",
    "Policy Analysis Methods",
    "Public Sector Planning",
    "International & Regional Affairs",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def collect_subcategories(payload):
    if isinstance(payload, dict):
        if isinstance(payload.get("subcategories"), list):
            return [s for s in payload["subcategories"] if isinstance(s, dict)]
        if isinstance(payload.get("domains"), list):
            out = []
            for domain in payload["domains"]:
                if isinstance(domain, dict) and isinstance(domain.get("topics"), list):
                    out.extend([s for s in domain["topics"] if isinstance(s, dict)])
            return out
    if isinstance(payload, list):
        return [s for s in payload if isinstance(s, dict)]
    return []


def get_questions_container(subcategory):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return []
    sub_id = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return questions[0][sub_id]
    return questions


def main() -> int:
    topics_doc = load_json(TOPICS_FILE)
    pdf_items = [i for i in load_json(PDF_FILE).get("items", []) if isinstance(i, dict)]

    data_files: dict[str, dict] = {}
    subcategories = []

    for topic in topics_doc.get("topics", []):
        rel = topic.get("file")
        if not rel:
            continue
        payload = load_json(ROOT / rel)
        data_files[rel] = payload
        for sub in collect_subcategories(payload):
            sub_id = sub.get("id")
            sub_name = sub.get("name", sub_id)
            q_list = get_questions_container(sub)
            if not isinstance(q_list, list):
                continue
            subcategories.append(
                {
                    "topic_id": topic.get("id"),
                    "topic_name": topic.get("name"),
                    "sub_id": sub_id,
                    "sub_name": sub_name,
                    "q_list": q_list,
                }
            )

    pdf_map = defaultdict(set)
    for idx, item in enumerate(pdf_items):
        if not item.get("question"):
            continue
        base_q = item.get("question") or ""
        for sub in subcategories:
            sub_id = sub["sub_id"]
            seed = f"{sub_id}-{idx}"
            rewritten = rewrite_question(base_q, seed)
            pdf_map[sub_id].add(normalize(rewritten))

    removed_total = 0
    removed_by_sub = {}

    for sub in subcategories:
        sub_id = sub["sub_id"]
        sub_name = sub["sub_name"]
        if sub_name not in THIN_SUB_NAMES:
            continue
        q_list = sub["q_list"]
        keep = []
        removed = 0
        for q in q_list:
            if not isinstance(q, dict):
                keep.append(q)
                continue
            if q.get("lastReviewed") == TODAY:
                q_norm = normalize(q.get("question") or "")
                if q_norm and q_norm not in pdf_map[sub_id]:
                    removed += 1
                    continue
            keep.append(q)
        if removed:
            q_list[:] = keep
            removed_by_sub[sub_id] = removed
            removed_total += removed

    for rel, payload in data_files.items():
        (ROOT / rel).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Removed fallback variants: {removed_total}")
    for sub_id, count in sorted(removed_by_sub.items()):
        print(f"- {sub_id}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
