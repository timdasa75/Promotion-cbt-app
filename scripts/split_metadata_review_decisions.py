#!/usr/bin/env python3
"""
Split metadata review decisions into topic packs and reviewer bundles.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IN = ROOT / "docs" / "metadata_review_decisions.json"
DEFAULT_OUT_DIR = ROOT / "docs" / "metadata_review_batches"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def slug(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in str(value or "").strip())
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_") or "unknown"


def build_reviewer_bundles(decisions, reviewer_count: int, keep_topic_blocks: bool):
    reviewers = [
        {"name": f"reviewer_{index + 1}", "decisions": [], "topics": Counter()}
        for index in range(reviewer_count)
    ]

    by_topic = defaultdict(list)
    for item in decisions:
        topic_id = str(item.get("topic_id") or "unknown")
        by_topic[topic_id].append(item)

    if keep_topic_blocks:
        topic_blocks = sorted(by_topic.items(), key=lambda pair: len(pair[1]), reverse=True)
        for topic_id, block in topic_blocks:
            reviewers.sort(key=lambda r: len(r["decisions"]))
            target = reviewers[0]
            target["decisions"].extend(block)
            target["topics"][topic_id] += len(block)
    else:
        # Balanced strategy: distribute individual decisions by descending topic sizes.
        ordered = []
        for topic_id, block in sorted(by_topic.items(), key=lambda pair: len(pair[1]), reverse=True):
            for item in block:
                ordered.append((topic_id, item))

        for topic_id, item in ordered:
            reviewers.sort(key=lambda r: len(r["decisions"]))
            target = reviewers[0]
            target["decisions"].append(item)
            target["topics"][topic_id] += 1

    # Stable output ordering.
    reviewers.sort(key=lambda r: r["name"])
    return reviewers


def write_topic_packs(source_doc, decisions, out_dir: Path):
    topic_dir = out_dir / "by_topic"
    topic_counts = Counter()
    by_topic = defaultdict(list)
    for item in decisions:
        topic_id = str(item.get("topic_id") or "unknown")
        by_topic[topic_id].append(item)

    for topic_id, entries in sorted(by_topic.items()):
        payload = {
            "metadata_version": source_doc.get("metadata_version", 1),
            "source_queue": source_doc.get("source_queue", ""),
            "topic_id": topic_id,
            "instructions": source_doc.get("instructions", ""),
            "decisions": entries,
        }
        filename = f"{slug(topic_id)}_decisions.json"
        dump_json(topic_dir / filename, payload)
        topic_counts[topic_id] = len(entries)

    return topic_counts


def write_reviewer_packs(source_doc, reviewers, out_dir: Path):
    reviewer_dir = out_dir / "by_reviewer"
    reviewer_counts = {}
    reviewer_topic_mix = {}

    for reviewer in reviewers:
        payload = {
            "metadata_version": source_doc.get("metadata_version", 1),
            "source_queue": source_doc.get("source_queue", ""),
            "reviewer": reviewer["name"],
            "instructions": source_doc.get("instructions", ""),
            "decisions": reviewer["decisions"],
        }
        filename = f"{reviewer['name']}_decisions.json"
        dump_json(reviewer_dir / filename, payload)
        reviewer_counts[reviewer["name"]] = len(reviewer["decisions"])
        reviewer_topic_mix[reviewer["name"]] = dict(sorted(reviewer["topics"].items()))

    return reviewer_counts, reviewer_topic_mix


def write_manifest(total, topic_counts, reviewer_counts, reviewer_topic_mix, out_dir: Path):
    manifest = {
        "summary": {
            "total_decisions": total,
            "topic_pack_count": len(topic_counts),
            "reviewer_pack_count": len(reviewer_counts),
        },
        "topic_counts": dict(sorted(topic_counts.items())),
        "reviewer_counts": dict(sorted(reviewer_counts.items())),
        "reviewer_topic_mix": reviewer_topic_mix,
        "paths": {
            "by_topic": str((out_dir / "by_topic").relative_to(ROOT)).replace("\\", "/"),
            "by_reviewer": str((out_dir / "by_reviewer").relative_to(ROOT)).replace("\\", "/"),
        },
    }
    dump_json(out_dir / "manifest.json", manifest)

    lines = []
    lines.append("# Metadata Review Batches")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Total decisions: **{total}**")
    lines.append(f"- Topic packs: **{len(topic_counts)}**")
    lines.append(f"- Reviewer packs: **{len(reviewer_counts)}**")
    lines.append("")
    lines.append("## Topic Counts")
    for topic_id, count in sorted(topic_counts.items()):
        lines.append(f"- `{topic_id}`: **{count}**")
    lines.append("")
    lines.append("## Reviewer Counts")
    for reviewer, count in sorted(reviewer_counts.items()):
        lines.append(f"- `{reviewer}`: **{count}**")
    lines.append("")
    lines.append("## Reviewer Topic Mix")
    for reviewer, mix in sorted(reviewer_topic_mix.items()):
        parts = ", ".join([f"{topic}={count}" for topic, count in sorted(mix.items())])
        lines.append(f"- `{reviewer}`: {parts}")
    lines.append("")
    lines.append(f"- Topic pack path: `{manifest['paths']['by_topic']}`")
    lines.append(f"- Reviewer pack path: `{manifest['paths']['by_reviewer']}`")
    (out_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Split metadata review decisions into batch packs")
    parser.add_argument("--in-file", default=str(DEFAULT_IN), help="Input decisions JSON")
    parser.add_argument(
        "--out-dir",
        default=str(DEFAULT_OUT_DIR),
        help="Output directory for generated packs",
    )
    parser.add_argument(
        "--reviewers",
        type=int,
        default=4,
        help="Number of reviewer bundles to generate",
    )
    parser.add_argument(
        "--keep-topic-blocks",
        action="store_true",
        help="Assign whole topics to reviewers (less balanced, more topical context).",
    )
    args = parser.parse_args()

    in_path = Path(args.in_file)
    if not in_path.is_absolute():
        in_path = ROOT / in_path
    if not in_path.exists():
        raise SystemExit(f"Input file not found: {in_path}")

    out_dir = Path(args.out_dir)
    if not out_dir.is_absolute():
        out_dir = ROOT / out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    source_doc = load_json(in_path)
    decisions = source_doc.get("decisions", [])
    if not isinstance(decisions, list):
        raise SystemExit("Input JSON must contain a 'decisions' array.")
    if not decisions:
        raise SystemExit("No decisions available to split.")
    if args.reviewers < 1:
        raise SystemExit("--reviewers must be >= 1")

    topic_counts = write_topic_packs(source_doc, decisions, out_dir)
    reviewers = build_reviewer_bundles(decisions, args.reviewers, args.keep_topic_blocks)
    reviewer_counts, reviewer_topic_mix = write_reviewer_packs(source_doc, reviewers, out_dir)
    write_manifest(len(decisions), topic_counts, reviewer_counts, reviewer_topic_mix, out_dir)

    print(f"Total decisions: {len(decisions)}")
    print(f"Topic packs: {len(topic_counts)}")
    print(f"Reviewer packs: {len(reviewer_counts)}")
    print(f"Wrote: {out_dir}")


if __name__ == "__main__":
    main()
