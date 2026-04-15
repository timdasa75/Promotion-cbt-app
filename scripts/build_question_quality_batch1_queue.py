#!/usr/bin/env python3
"""Build a focused Batch 1 remediation queue from the full question quality assessment."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSESSMENT = DEFAULT_ROOT / "docs" / "question_quality_assessment.json"
DEFAULT_JSON_OUT = DEFAULT_ROOT / "docs" / "question_quality_batch1_queue.json"
DEFAULT_MD_OUT = DEFAULT_ROOT / "docs" / "question_quality_batch1_queue.md"


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def unique_issue_types(items: Iterable[dict]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for item in items:
        for issue in item.get("issue_types", []):
            if issue.endswith("_candidate"):
                continue
            counts[str(issue)] += 1
    return dict(counts.most_common())


def summarize_topics(items: Iterable[dict]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for item in items:
        counts[str(item.get("source_topic") or "unknown")] += 1
    return dict(counts.most_common())


def batch_item(item: dict) -> dict:
    return {
        "question_id": item.get("question_id"),
        "source_topic": item.get("source_topic"),
        "source_subcategory": item.get("source_subcategory"),
        "source_file": item.get("source_file"),
        "recommended_action": item.get("recommended_action"),
        "suggested_target_topic": item.get("suggested_target_topic"),
        "suggested_target_subcategory": item.get("suggested_target_subcategory"),
        "suggested_target_prefix": item.get("suggested_target_prefix"),
        "confidence": item.get("confidence"),
        "issue_types": item.get("issue_types", []),
        "question": item.get("question"),
        "rationale": item.get("rationale", []),
        "rewrite_note": item.get("rewrite_note"),
    }


def build_queue(report: dict) -> dict:
    items = report.get("items", [])
    move_items = [batch_item(item) for item in items if item.get("recommended_action") == "move"]
    delete_items = [batch_item(item) for item in items if item.get("recommended_action") == "delete"]
    corruption_rewrite_items = [
        batch_item(item)
        for item in items
        if item.get("recommended_action") == "rewrite" and "text_corruption_noise" in item.get("issue_types", [])
    ]

    queue = {
        "summary": {
            "source_flagged_questions": report.get("summary", {}).get("flagged_questions", 0),
            "batch1_counts": {
                "move": len(move_items),
                "delete": len(delete_items),
                "rewrite_text_corruption": len(corruption_rewrite_items),
                "total_batch1": len(move_items) + len(delete_items) + len(corruption_rewrite_items),
            },
            "why_this_batch": [
                "Move and delete candidates are the smallest, highest-confidence editorial actions.",
                "Text-corruption rewrites are visibly harmful to learner trust and usually easier to repair than deeper concept rewrites.",
                "This batch keeps remediation focused while the larger rewrite pool remains reviewable.",
            ],
        },
        "groups": {
            "move": {
                "count": len(move_items),
                "top_topics": summarize_topics(move_items),
                "top_issues": unique_issue_types(move_items),
                "items": move_items,
            },
            "delete": {
                "count": len(delete_items),
                "top_topics": summarize_topics(delete_items),
                "top_issues": unique_issue_types(delete_items),
                "items": delete_items,
            },
            "rewrite_text_corruption": {
                "count": len(corruption_rewrite_items),
                "top_topics": summarize_topics(corruption_rewrite_items),
                "top_issues": unique_issue_types(corruption_rewrite_items),
                "items": corruption_rewrite_items,
            },
        },
    }
    return queue


def write_markdown(queue: dict, path: Path):
    summary = queue.get("summary", {})
    groups = queue.get("groups", {})
    lines: list[str] = ["# Question Quality Batch 1 Queue", ""]
    lines.append("## Summary")
    counts = summary.get("batch1_counts", {})
    lines.append(f"- Source flagged questions: **{summary.get('source_flagged_questions', 0)}**")
    lines.append(f"- `move`: **{counts.get('move', 0)}**")
    lines.append(f"- `delete`: **{counts.get('delete', 0)}**")
    lines.append(f"- `rewrite_text_corruption`: **{counts.get('rewrite_text_corruption', 0)}**")
    lines.append(f"- Total Batch 1 items: **{counts.get('total_batch1', 0)}**")
    lines.append("")
    lines.append("## Why This Batch")
    for note in summary.get("why_this_batch", []):
        lines.append(f"- {note}")
    lines.append("")

    for group_name, title in (
        ("move", "Move Candidates"),
        ("delete", "Delete Candidates"),
        ("rewrite_text_corruption", "Text-Corruption Rewrite Candidates"),
    ):
        group = groups.get(group_name, {})
        lines.append(f"## {title}")
        lines.append(f"- Count: **{group.get('count', 0)}**")
        lines.append("- Top topics:")
        for topic, count in (group.get("top_topics") or {}).items():
            lines.append(f"  - `{topic}`: **{count}**")
        lines.append("- Top issues:")
        for issue, count in (group.get("top_issues") or {}).items():
            lines.append(f"  - `{issue}`: **{count}**")
        lines.append("")
        lines.append("### Queue")
        if not group.get("items"):
            lines.append("- None")
            lines.append("")
            continue
        for item in group.get("items", [])[:80]:
            target = item.get("suggested_target_topic")
            target_subcategory = item.get("suggested_target_subcategory")
            target_suffix = f" -> `{target}`" if target else ""
            lines.append(
                f"- `{item.get('question_id')}` [{item.get('source_topic')}/{item.get('source_subcategory')}] "
                f"confidence={item.get('confidence')}{target_suffix}"
            )
            lines.append(f"  - {item.get('question')}")
            if target_subcategory:
                lines.append(f"  - Target subcategory: `{target_subcategory}`")
            if item.get("suggested_target_prefix"):
                lines.append(f"  - Target id prefix: `{item.get('suggested_target_prefix')}`")
            for reason in item.get("rationale", [])[:3]:
                lines.append(f"  - Reason: {reason}")
            if item.get("rewrite_note"):
                lines.append(f"  - Note: {item.get('rewrite_note')}")
        lines.append("")

    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assessment", type=Path, default=DEFAULT_ASSESSMENT)
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON_OUT)
    parser.add_argument("--md-out", type=Path, default=DEFAULT_MD_OUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = load_json(args.assessment)
    queue = build_queue(report)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.md_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(queue, args.md_out)
    print("Question quality Batch 1 queue complete")
    print(json.dumps(queue.get("summary", {}), indent=2))
    print(f"JSON report: {args.json_out}")
    print(f"Markdown report: {args.md_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
