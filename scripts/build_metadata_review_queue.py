#!/usr/bin/env python3
"""
Build a metadata review queue for manual SME validation.

Focus:
- sourceDocument plausibility (token-based signal with confidence levels)
- year sanity and explicit-year checks
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
OUT_JSON = ROOT / "docs" / "metadata_review_queue.json"
OUT_MD = ROOT / "docs" / "metadata_review_queue.md"
OUT_HIGH_JSON = ROOT / "docs" / "metadata_review_queue_high_confidence.json"
OUT_HIGH_MD = ROOT / "docs" / "metadata_review_queue_high_confidence.md"
CURRENT_YEAR = 2026

DOC_RULES = [
    {
        "sourceDocument": "Public Service Rules (PSR 2021)",
        "patterns": [
            {"regex": r"\bpsr\b", "confidence": "medium"},
            {"regex": r"public service rules", "confidence": "high"},
            {"regex": r"rule\s+0?\d{4,}", "confidence": "high"},
        ],
    },
    {
        "sourceDocument": "Financial Regulations (FR)",
        "patterns": [
            {"regex": r"\bfinancial regulations?\b", "confidence": "high"},
            {"regex": r"\bfr\b", "confidence": "medium"},
            {"regex": r"\bvirement\b", "confidence": "high"},
            {"regex": r"\bimprest\b", "confidence": "high"},
            {"regex": r"\bvote book\b", "confidence": "high"},
            {"regex": r"\bsubhead\b", "confidence": "medium"},
        ],
    },
    {
        "sourceDocument": "Public Procurement Act (2007)",
        "patterns": [
            {"regex": r"\bprocurement act\b", "confidence": "high"},
            {"regex": r"\bpublic procurement\b", "confidence": "high"},
            {"regex": r"\bbpp\b", "confidence": "high"},
            {"regex": r"certificate of no objection", "confidence": "high"},
            {"regex": r"\bprocuring entit(y|ies)\b", "confidence": "high"},
        ],
    },
    {
        "sourceDocument": "Constitution of the Federal Republic of Nigeria and FOI Act",
        "patterns": [
            {"regex": r"\bconstitution\b", "confidence": "medium"},
            {"regex": r"\bfoi\b", "confidence": "high"},
            {"regex": r"freedom of information", "confidence": "high"},
            {"regex": r"fifth schedule", "confidence": "high"},
        ],
    },
    {
        "sourceDocument": "Federal Civil Service Handbook and Circulars",
        "patterns": [
            {"regex": r"civil service handbook", "confidence": "high"},
            {"regex": r"\bcircular(s)?\b", "confidence": "medium"},
            {"regex": r"junior staff committee", "confidence": "high"},
            {"regex": r"senior staff committee", "confidence": "high"},
        ],
    },
    {
        "sourceDocument": "National ICT and Digital Governance Framework",
        "patterns": [
            {"regex": r"\bict\b", "confidence": "medium"},
            {"regex": r"e-?governance", "confidence": "high"},
            {"regex": r"\bcyber\b", "confidence": "medium"},
            {"regex": r"\bssl\b", "confidence": "high"},
            {"regex": r"\btls\b", "confidence": "high"},
        ],
    },
    {
        "sourceDocument": "Directorate Competency Framework",
        "patterns": [
            {"regex": r"verbal reasoning", "confidence": "high"},
            {"regex": r"numerical reasoning", "confidence": "high"},
            {"regex": r"analytical reasoning", "confidence": "high"},
            {"regex": r"situational judgement", "confidence": "high"},
        ],
    },
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def get_topic_map():
    topics_doc = load_json(TOPICS_FILE)
    topics = [t for t in topics_doc.get("topics", []) if isinstance(t, dict)]
    out = {}
    for topic in topics:
        rel_file = str(topic.get("file") or "").strip()
        if rel_file:
            out[rel_file] = {
                "topic_id": str(topic.get("id") or ""),
                "topic_name": str(topic.get("name") or ""),
            }
    return out


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


def iterate_questions(subcategory):
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


def infer_document_hits(text):
    lowered = text.lower()
    hits = []
    evidence = []
    for rule in DOC_RULES:
        matched = None
        confidence = "medium"
        for pattern in rule["patterns"]:
            if re.search(pattern["regex"], lowered):
                matched = pattern["regex"]
                confidence = pattern["confidence"]
                break
        if matched:
            hits.append({"sourceDocument": rule["sourceDocument"], "confidence": confidence})
            evidence.append(
                {
                    "sourceDocument": rule["sourceDocument"],
                    "confidence": confidence,
                    "evidence": f"{rule['sourceDocument']} via /{matched}/",
                }
            )
    return hits, evidence


def build_queue():
    topic_map = get_topic_map()
    queue = []
    stats = {
        "source_document_conflicts": 0,
        "source_document_conflicts_high": 0,
        "source_document_conflicts_medium": 0,
        "year_out_of_range": 0,
        "year_explicit_mismatch": 0,
    }

    for rel_file, topic_meta in topic_map.items():
        path = ROOT / rel_file
        if not path.exists():
            continue
        payload = load_json(path)
        for sub in collect_subcategories(payload):
            sub_id = str(sub.get("id") or "")
            sub_name = str(sub.get("name") or sub_id)
            for question in iterate_questions(sub):
                qid = str(question.get("id") or "")
                qtext = str(question.get("question") or "")
                explanation = str(question.get("explanation") or "")
                combined = f"{qtext} {explanation}".strip()
                source_document = str(question.get("sourceDocument") or "").strip()
                year_value = question.get("year")
                reasons = []

                doc_hits, doc_evidence = infer_document_hits(combined)
                if (
                    len(doc_hits) == 1
                    and source_document
                    and doc_hits[0]["sourceDocument"] != source_document
                ):
                    confidence = doc_hits[0]["confidence"]
                    stats["source_document_conflicts"] += 1
                    stats[f"source_document_conflicts_{confidence}"] += 1
                    reasons.append(
                        {
                            "type": "sourceDocument_conflict",
                            "actual": source_document,
                            "suggested": doc_hits[0]["sourceDocument"],
                            "evidence": doc_evidence[0]["evidence"],
                            "confidence": confidence,
                        }
                    )

                numeric_year = None
                try:
                    numeric_year = int(year_value)
                except Exception:
                    numeric_year = None

                if numeric_year is not None and (numeric_year < 1900 or numeric_year > CURRENT_YEAR):
                    stats["year_out_of_range"] += 1
                    reasons.append(
                        {
                            "type": "year_out_of_range",
                            "actual": year_value,
                            "suggested": "",
                            "evidence": "Year should be between 1900 and current year.",
                            "confidence": "high",
                        }
                    )

                explicit_years = re.findall(r"\b(19\d{2}|20\d{2})\b", combined)
                explicit_years = list(dict.fromkeys(explicit_years))
                if explicit_years and numeric_year is not None and str(numeric_year) not in explicit_years:
                    stats["year_explicit_mismatch"] += 1
                    reasons.append(
                        {
                            "type": "year_explicit_mismatch",
                            "actual": year_value,
                            "suggested": int(explicit_years[0]),
                            "evidence": f"Explicit year(s) in text: {', '.join(explicit_years)}",
                            "confidence": "high",
                        }
                    )

                if reasons:
                    queue.append(
                        {
                            "topic_id": topic_meta["topic_id"],
                            "topic_name": topic_meta["topic_name"],
                            "source_file": rel_file,
                            "subcategory_id": sub_id,
                            "subcategory_name": sub_name,
                            "question_id": qid,
                            "question_preview": qtext[:220],
                            "sourceDocument": source_document,
                            "year": year_value,
                            "reasons": reasons,
                        }
                    )

    return queue, stats


def write_markdown(queue, stats):
    by_reason = Counter()
    for item in queue:
        for reason in item["reasons"]:
            by_reason[reason["type"]] += 1

    ordered = sorted(
        queue,
        key=lambda item: 0
        if any(reason.get("confidence") == "high" for reason in item.get("reasons", []))
        else 1,
    )

    lines = []
    lines.append("# Metadata Review Queue")
    lines.append("")
    lines.append("Manual SME review queue for `sourceDocument` and `year` anomalies.")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Total queued items: **{len(queue)}**")
    lines.append(f"- sourceDocument conflicts: **{stats['source_document_conflicts']}**")
    lines.append(
        f"- sourceDocument conflicts (high confidence): **{stats['source_document_conflicts_high']}**"
    )
    lines.append(
        f"- sourceDocument conflicts (medium confidence): **{stats['source_document_conflicts_medium']}**"
    )
    lines.append(f"- year out-of-range: **{stats['year_out_of_range']}**")
    lines.append(f"- year explicit mismatch: **{stats['year_explicit_mismatch']}**")
    lines.append("")
    lines.append("## Reason Breakdown")
    for reason, count in sorted(by_reason.items()):
        lines.append(f"- `{reason}`: **{count}**")
    lines.append("")
    lines.append("## Review Checklist")
    lines.append("- Review all high-confidence `sourceDocument_conflict` entries first.")
    lines.append("- Confirm the cited source document from canonical study material.")
    lines.append("- If multiple legal sources are intentionally blended, keep current value and note rationale.")
    lines.append("- For `year`, prefer explicit cited year in question/explanation text when present.")
    lines.append("- Record accepted decision before editing question rows.")
    lines.append("")
    lines.append("## Sample Queue Items (Top 40)")
    for item in ordered[:40]:
        lines.append(
            f"- `{item['question_id']}` [{item['topic_id']}/{item['subcategory_id']}] "
            f"doc=`{item['sourceDocument']}` year=`{item['year']}`"
        )
        lines.append(f"  - {item['question_preview']}")
        for reason in item["reasons"]:
            lines.append(
                f"  - reason: `{reason['type']}` ({reason['confidence']}) "
                f"| suggested=`{reason['suggested']}` | {reason['evidence']}"
            )
    lines.append("")
    lines.append(f"Full machine-readable queue: `{OUT_JSON.as_posix()}`")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_high_confidence_outputs(queue):
    high = [
        item
        for item in queue
        if any(reason.get("confidence") == "high" for reason in item.get("reasons", []))
    ]
    high_payload = {
        "summary": {
            "queued_items": len(high),
            "source_document_conflicts_high": len(
                [
                    item
                    for item in high
                    if any(reason.get("type") == "sourceDocument_conflict" for reason in item["reasons"])
                ]
            ),
        },
        "items": high,
    }
    dump_json(OUT_HIGH_JSON, high_payload)

    lines = []
    lines.append("# Metadata Review Queue (High Confidence)")
    lines.append("")
    lines.append("Prioritized subset from `metadata_review_queue.json`.")
    lines.append("")
    lines.append(f"- Total high-confidence items: **{len(high)}**")
    lines.append("")
    lines.append("## Items")
    for item in high:
        lines.append(
            f"- `{item['question_id']}` [{item['topic_id']}/{item['subcategory_id']}] "
            f"doc=`{item['sourceDocument']}` year=`{item['year']}`"
        )
        lines.append(f"  - {item['question_preview']}")
        for reason in item["reasons"]:
            if reason.get("confidence") != "high":
                continue
            lines.append(
                f"  - reason: `{reason['type']}` | suggested=`{reason['suggested']}` | {reason['evidence']}"
            )
    lines.append("")
    lines.append(f"Machine-readable: `{OUT_HIGH_JSON.as_posix()}`")
    OUT_HIGH_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    queue, stats = build_queue()
    payload = {
        "summary": {
            "queued_items": len(queue),
            **stats,
        },
        "items": queue,
    }
    dump_json(OUT_JSON, payload)
    write_markdown(queue, stats)
    write_high_confidence_outputs(queue)
    print(f"Queued items: {len(queue)}")
    print(f"sourceDocument conflicts: {stats['source_document_conflicts']}")
    print(f"sourceDocument conflicts (high): {stats['source_document_conflicts_high']}")
    print(f"sourceDocument conflicts (medium): {stats['source_document_conflicts_medium']}")
    print(f"year out-of-range: {stats['year_out_of_range']}")
    print(f"year explicit mismatch: {stats['year_explicit_mismatch']}")
    print(f"Wrote: {OUT_JSON}")
    print(f"Wrote: {OUT_MD}")
    print(f"Wrote: {OUT_HIGH_JSON}")
    print(f"Wrote: {OUT_HIGH_MD}")


if __name__ == "__main__":
    main()
