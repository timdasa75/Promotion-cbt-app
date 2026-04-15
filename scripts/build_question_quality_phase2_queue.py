#!/usr/bin/env python3
"""Build a focused Phase 2 remediation queue from the full question quality assessment."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Iterable

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSESSMENT = DEFAULT_ROOT / "docs" / "question_quality_assessment.json"
DEFAULT_JSON_OUT = DEFAULT_ROOT / "docs" / "question_quality_phase2_queue.json"
DEFAULT_MD_OUT = DEFAULT_ROOT / "docs" / "question_quality_phase2_queue.md"

NEAR_DUP_ISSUES = {
    "same_subcategory_near_duplicate",
    "same_topic_near_duplicate",
    "cross_topic_near_duplicate",
}
WEAK_FRAMING_ISSUES = {
    "filler_stem_prefix",
    "vague_authority_reference",
    "metadata_pollution_from_stem",
}


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


def queue_item(item: dict) -> dict:
    return {
        "question_id": item.get("question_id"),
        "source_topic": item.get("source_topic"),
        "source_subcategory": item.get("source_subcategory"),
        "source_file": item.get("source_file"),
        "recommended_action": item.get("recommended_action"),
        "confidence": item.get("confidence"),
        "issue_types": item.get("issue_types", []),
        "question": item.get("question"),
        "rationale": item.get("rationale", []),
        "rewrite_note": item.get("rewrite_note"),
    }


def is_near_duplicate(item: dict) -> bool:
    issues = set(item.get("issue_types", []))
    return bool(issues & NEAR_DUP_ISSUES)


def is_definition_mismatch(item: dict) -> bool:
    return "definition_option_mismatch" in set(item.get("issue_types", []))


def is_weak_framing(item: dict) -> bool:
    issues = set(item.get("issue_types", []))
    return WEAK_FRAMING_ISSUES.issubset(issues) and "thin_explanation" in issues


def is_non_parallel(item: dict) -> bool:
    return "non_parallel_options" in set(item.get("issue_types", []))


def is_thin_explanation(item: dict) -> bool:
    return "thin_explanation" in set(item.get("issue_types", []))


def build_queue(report: dict) -> dict:
    items = [item for item in report.get("items", []) if item.get("recommended_action") == "rewrite"]

    assigned: set[str] = set()

    def take(predicate):
        selected = []
        for item in items:
            qid = str(item.get("question_id") or "")
            if not qid or qid in assigned:
                continue
            if predicate(item):
                assigned.add(qid)
                selected.append(queue_item(item))
        return selected

    near_duplicate_items = take(is_near_duplicate)
    definition_items = take(is_definition_mismatch)
    weak_framing_items = take(is_weak_framing)
    non_parallel_items = take(is_non_parallel)
    thin_explanation_items = take(is_thin_explanation)

    queue = {
        "summary": {
            "source_flagged_questions": report.get("summary", {}).get("flagged_questions", 0),
            "phase2_counts": {
                "near_duplicate_families": len(near_duplicate_items),
                "definition_alignment_rewrites": len(definition_items),
                "weak_framing_rewrites": len(weak_framing_items),
                "non_parallel_option_rebuilds": len(non_parallel_items),
                "thin_explanation_enrichment": len(thin_explanation_items),
                "total_phase2": len(near_duplicate_items) + len(definition_items) + len(weak_framing_items) + len(non_parallel_items) + len(thin_explanation_items),
            },
            "why_this_phase": [
                "Near-duplicate families should be reviewed first because they waste practice slots and create a generated feel.",
                "Definition/option mismatches are high-confidence writing faults that often confuse otherwise valid concepts.",
                "Weak framing batches capture the filler-stem pattern that lowers trust even when the answer is correct.",
                "Non-parallel options and thin explanations are broader editorial debt, so they are left for later slices after the sharper issues are isolated.",
            ],
        },
        "groups": {
            "near_duplicate_families": {
                "count": len(near_duplicate_items),
                "top_topics": summarize_topics(near_duplicate_items),
                "top_issues": unique_issue_types(near_duplicate_items),
                "items": near_duplicate_items,
            },
            "definition_alignment_rewrites": {
                "count": len(definition_items),
                "top_topics": summarize_topics(definition_items),
                "top_issues": unique_issue_types(definition_items),
                "items": definition_items,
            },
            "weak_framing_rewrites": {
                "count": len(weak_framing_items),
                "top_topics": summarize_topics(weak_framing_items),
                "top_issues": unique_issue_types(weak_framing_items),
                "items": weak_framing_items,
            },
            "non_parallel_option_rebuilds": {
                "count": len(non_parallel_items),
                "top_topics": summarize_topics(non_parallel_items),
                "top_issues": unique_issue_types(non_parallel_items),
                "items": non_parallel_items,
            },
            "thin_explanation_enrichment": {
                "count": len(thin_explanation_items),
                "top_topics": summarize_topics(thin_explanation_items),
                "top_issues": unique_issue_types(thin_explanation_items),
                "items": thin_explanation_items,
            },
        },
    }
    return queue


def write_markdown(queue: dict, path: Path):
    summary = queue.get("summary", {})
    groups = queue.get("groups", {})
    lines: list[str] = ["# Question Quality Phase 2 Queue", ""]
    lines.append("## Summary")
    counts = summary.get("phase2_counts", {})
    lines.append(f"- Source flagged questions: **{summary.get('source_flagged_questions', 0)}**")
    lines.append(f"- `near_duplicate_families`: **{counts.get('near_duplicate_families', 0)}**")
    lines.append(f"- `definition_alignment_rewrites`: **{counts.get('definition_alignment_rewrites', 0)}**")
    lines.append(f"- `weak_framing_rewrites`: **{counts.get('weak_framing_rewrites', 0)}**")
    lines.append(f"- `non_parallel_option_rebuilds`: **{counts.get('non_parallel_option_rebuilds', 0)}**")
    lines.append(f"- `thin_explanation_enrichment`: **{counts.get('thin_explanation_enrichment', 0)}**")
    lines.append(f"- Total Phase 2 items: **{counts.get('total_phase2', 0)}**")
    lines.append("")
    lines.append("## Why This Phase")
    for note in summary.get("why_this_phase", []):
        lines.append(f"- {note}")
    lines.append("")

    titles = (
        ("near_duplicate_families", "Near-Duplicate Families"),
        ("definition_alignment_rewrites", "Definition Alignment Rewrites"),
        ("weak_framing_rewrites", "Weak Framing Rewrites"),
        ("non_parallel_option_rebuilds", "Non-Parallel Option Rebuilds"),
        ("thin_explanation_enrichment", "Thin Explanation Enrichment"),
    )

    for group_name, title in titles:
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
            lines.append(f"- `{item.get('question_id')}` [{item.get('source_topic')}/{item.get('source_subcategory')}] confidence={item.get('confidence')}")
            lines.append(f"  - {item.get('question')}")
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
    print("Question quality Phase 2 queue complete")
    print(json.dumps(queue.get("summary", {}), indent=2))
    print(f"JSON report: {args.json_out}")
    print(f"Markdown report: {args.md_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
