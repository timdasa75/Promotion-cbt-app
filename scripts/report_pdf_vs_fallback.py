#!/usr/bin/env python3
"""
Report how many questions appear PDF-derived vs fallback/other per subtopic.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.augment_from_pdf import normalize, rewrite_question, TODAY  # noqa: E402

TOPICS_FILE = ROOT / "data" / "topics.json"
PDF_FILE = ROOT / "docs" / "pdf_questions_raw.json"
OUT_FILE = ROOT / "docs" / "pdf_vs_fallback_summary.md"


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

    subcategories = []
    for topic in topics_doc.get("topics", []):
        rel = topic.get("file")
        if not rel:
            continue
        payload = load_json(ROOT / rel)
        for sub in collect_subcategories(payload):
            sub_id = sub.get("id")
            sub_name = sub.get("name", sub_id)
            q_list = get_questions_container(sub)
            if not isinstance(q_list, list):
                continue
            subcategories.append(
                {
                    "topic_name": topic.get("name"),
                    "sub_id": sub_id,
                    "sub_name": sub_name,
                    "q_list": q_list,
                }
            )

    pdf_map = defaultdict(set)
    for idx, item in enumerate(pdf_items):
        base_q = item.get("question") or ""
        if not base_q:
            continue
        for sub in subcategories:
            sub_id = sub["sub_id"]
            seed = f"{sub_id}-{idx}"
            rewritten = rewrite_question(base_q, seed)
            pdf_map[sub_id].add(normalize(rewritten))

    rows = []
    totals = defaultdict(int)

    for sub in subcategories:
        sub_id = sub["sub_id"]
        sub_name = sub["sub_name"]
        q_list = sub["q_list"]

        total = len(q_list)
        pdf_derived = 0
        new_total = 0
        new_pdf = 0

        for q in q_list:
            if not isinstance(q, dict):
                continue
            q_norm = normalize(q.get("question") or "")
            is_pdf = q_norm in pdf_map[sub_id]
            if is_pdf:
                pdf_derived += 1
            if q.get("lastReviewed") == TODAY:
                new_total += 1
                if is_pdf:
                    new_pdf += 1

        fallback = total - pdf_derived
        new_fallback = new_total - new_pdf

        totals["total"] += total
        totals["pdf"] += pdf_derived
        totals["fallback"] += fallback
        totals["new_total"] += new_total
        totals["new_pdf"] += new_pdf
        totals["new_fallback"] += new_fallback

        rows.append(
            (
                sub["topic_name"],
                sub_name,
                total,
                pdf_derived,
                fallback,
                new_total,
                new_pdf,
                new_fallback,
            )
        )

    lines = [
        "# PDF-Derived vs Fallback Summary",
        "",
        f"Report date: {TODAY}",
        "",
        "| Topic | Subtopic | Total | PDF-Derived | Fallback/Other | New (Today) | New PDF | New Fallback |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]

    for row in sorted(rows, key=lambda r: (r[0].lower(), r[1].lower())):
        lines.append(
            f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]} | {row[6]} | {row[7]} |"
        )

    lines.extend(
        [
            "",
            "## Totals",
            "",
            f"- Total questions: {totals['total']}",
            f"- PDF-derived: {totals['pdf']}",
            f"- Fallback/other: {totals['fallback']}",
            f"- New (today): {totals['new_total']}",
            f"- New PDF: {totals['new_pdf']}",
            f"- New fallback: {totals['new_fallback']}",
            "",
        ]
    )

    OUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
