#!/usr/bin/env python3
"""
Build a manual review queue from high-confidence relevance flags.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIT_JSON = ROOT / "docs" / "question_quality_audit.json"
OUT_JSON = ROOT / "docs" / "relevance_review_queue.json"
OUT_MD = ROOT / "docs" / "relevance_review_queue.md"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def main():
    report = load_json(AUDIT_JSON)
    flags = report.get("relevance_flags", [])

    queue = []
    for item in flags:
        q = item.get("question", {})
        reasons = item.get("reasons", [])
        looks_closer = [r for r in reasons if str(r).startswith("looks_closer_to:")]
        high_conf = (
            item.get("own_topic_score", 0) == 0
            and item.get("own_subcategory_score", 0) == 0
            and item.get("best_other_score", 0) >= 4
            and bool(looks_closer)
        )
        if not high_conf:
            continue

        queue.append(
            {
                "question_id": q.get("question_id"),
                "source_topic": q.get("topic_id"),
                "source_subcategory": q.get("subcategory_id"),
                "source_file": q.get("source_file"),
                "question": q.get("question"),
                "suggested_target_topic": item.get("best_other_topic"),
                "scores": {
                    "own_topic": item.get("own_topic_score", 0),
                    "own_subcategory": item.get("own_subcategory_score", 0),
                    "best_other": item.get("best_other_score", 0),
                },
                "reasons": reasons,
                "recommended_action": "manual_review",
            }
        )

    queue.sort(
        key=lambda x: (
            x["scores"]["own_subcategory"],
            x["scores"]["own_topic"],
            -x["scores"]["best_other"],
            x["source_topic"] or "",
        )
    )

    OUT_JSON.write_text(json.dumps({"count": len(queue), "items": queue}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = []
    lines.append("# Relevance Review Queue")
    lines.append("")
    lines.append(f"- Total high-confidence manual review items: **{len(queue)}**")
    lines.append("")
    for item in queue:
        lines.append(
            f"- `{item['question_id']}` [{item['source_topic']}/{item['source_subcategory']}]"
            f" -> suggested `{item['suggested_target_topic']}`"
        )
        lines.append(
            f"  - scores: own_topic={item['scores']['own_topic']}, "
            f"own_sub={item['scores']['own_subcategory']}, best_other={item['scores']['best_other']}"
        )
        q = item.get("question") or ""
        lines.append(f"  - {q[:180]}{'...' if len(q) > 180 else ''}")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Queue generated: {len(queue)} items")
    print(f"JSON: {OUT_JSON}")
    print(f"MD: {OUT_MD}")


if __name__ == "__main__":
    main()
