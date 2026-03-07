#!/usr/bin/env python3
"""
Generate editable metadata decision seed files from review queue.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_QUEUE = ROOT / "docs" / "metadata_review_queue_high_confidence.json"
DEFAULT_OUT = ROOT / "docs" / "metadata_review_decisions.json"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Seed metadata decision file from review queue")
    parser.add_argument("--queue-file", default=str(DEFAULT_QUEUE), help="Input metadata review queue JSON")
    parser.add_argument("--out-file", default=str(DEFAULT_OUT), help="Output decisions JSON")
    parser.add_argument(
        "--status",
        default="pending",
        help="Default status for seeded decisions (recommended: pending)",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=0,
        help="Optional limit on seeded items (0 = all)",
    )
    args = parser.parse_args()

    queue_path = Path(args.queue_file)
    out_path = Path(args.out_file)
    if not queue_path.is_absolute():
        queue_path = ROOT / queue_path
    if not out_path.is_absolute():
        out_path = ROOT / out_path

    queue_doc = load_json(queue_path)
    items = queue_doc.get("items", [])
    if not isinstance(items, list):
        raise SystemExit("Queue JSON must contain an 'items' array.")

    limit = int(args.max_items or 0)
    if limit > 0:
        items = items[:limit]

    decisions = []
    for item in items:
        if not isinstance(item, dict):
            continue
        reasons = item.get("reasons", [])
        source_reason = None
        year_reason = None
        for reason in reasons:
            if not isinstance(reason, dict):
                continue
            if reason.get("type") == "sourceDocument_conflict" and source_reason is None:
                source_reason = reason
            if reason.get("type") == "year_explicit_mismatch" and year_reason is None:
                year_reason = reason

        changes = {}
        if source_reason and source_reason.get("suggested"):
            changes["sourceDocument"] = source_reason["suggested"]
        if year_reason and year_reason.get("suggested") not in ("", None):
            changes["year"] = int(year_reason["suggested"])

        if not changes:
            continue

        decisions.append(
            {
                "question_id": item.get("question_id"),
                "topic_id": item.get("topic_id"),
                "source_file": item.get("source_file"),
                "subcategory_id": item.get("subcategory_id"),
                "status": str(args.status or "pending").strip().lower(),
                "changes": changes,
                "note": "SME review required",
            }
        )

    payload = {
        "metadata_version": 1,
        "source_queue": str(queue_path.relative_to(ROOT)).replace("\\", "/"),
        "instructions": (
            "Set status to approved for accepted decisions, rejected for declined decisions, "
            "or keep pending for unresolved entries."
        ),
        "decisions": decisions,
    }
    dump_json(out_path, payload)

    print(f"Seeded decisions: {len(decisions)}")
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()
