#!/usr/bin/env python3
"""
Merge reviewer metadata decision packs into a single master file and report.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BATCH_DIR = ROOT / "docs" / "metadata_review_batches" / "by_reviewer"
DEFAULT_OUT_FILE = ROOT / "docs" / "metadata_review_decisions_merged.json"
DEFAULT_REPORT_JSON = ROOT / "docs" / "metadata_review_merge_report.json"
DEFAULT_REPORT_MD = ROOT / "docs" / "metadata_review_merge_report.md"
DEFAULT_MASTER_FILE = ROOT / "docs" / "metadata_review_decisions.json"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_status(value: Any) -> str:
    return str(value or "").strip().lower() or "pending"


def decision_key(item: Dict[str, Any]) -> Tuple[str, str, str, str]:
    return (
        str(item.get("question_id") or "").strip(),
        str(item.get("topic_id") or "").strip(),
        str(item.get("source_file") or "").strip(),
        str(item.get("subcategory_id") or "").strip(),
    )


def canonical_decision_payload(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "question_id": str(item.get("question_id") or "").strip(),
        "topic_id": str(item.get("topic_id") or "").strip(),
        "source_file": str(item.get("source_file") or "").strip(),
        "subcategory_id": str(item.get("subcategory_id") or "").strip(),
        "status": normalize_status(item.get("status")),
        "changes": item.get("changes") if isinstance(item.get("changes"), dict) else {},
        "note": str(item.get("note") or "").strip(),
    }


def build_markdown(report: Dict[str, Any], out_path: Path):
    s = report["summary"]
    lines = []
    lines.append("# Metadata Review Merge Report")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Reviewer files read: **{s['reviewer_files_read']}**")
    lines.append(f"- Decisions read: **{s['decisions_read']}**")
    lines.append(f"- Unique merged decisions: **{s['unique_decisions']}**")
    lines.append(f"- Duplicate identical entries: **{s['duplicate_identical']}**")
    lines.append(f"- Conflicts: **{s['conflicts']}**")
    lines.append("")
    lines.append("## Status Counts")
    for status, count in sorted(report["status_counts"].items()):
        lines.append(f"- `{status}`: **{count}**")
    lines.append("")
    lines.append("## Reviewer Progress")
    for reviewer, counts in sorted(report["reviewer_status_counts"].items()):
        total = sum(counts.values())
        parts = ", ".join([f"{status}={count}" for status, count in sorted(counts.items())])
        lines.append(f"- `{reviewer}`: total={total} ({parts})")
    lines.append("")
    lines.append("## Topic Progress")
    for topic_id, counts in sorted(report["topic_status_counts"].items()):
        total = sum(counts.values())
        parts = ", ".join([f"{status}={count}" for status, count in sorted(counts.items())])
        lines.append(f"- `{topic_id}`: total={total} ({parts})")
    lines.append("")
    lines.append("## Conflicts")
    if not report["conflicts"]:
        lines.append("- None")
    else:
        for item in report["conflicts"][:120]:
            key = item["key"]
            lines.append(
                f"- key=({key['question_id']}, {key['topic_id']}, {key['source_file']}, {key['subcategory_id']})"
            )
            lines.append(f"  - existing_file: `{item['existing_file']}` status={item['existing_status']}")
            lines.append(f"  - incoming_file: `{item['incoming_file']}` status={item['incoming_status']}")
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Merge reviewer decision packs")
    parser.add_argument(
        "--batch-dir",
        default=str(DEFAULT_BATCH_DIR),
        help="Directory containing reviewer decision JSON files",
    )
    parser.add_argument(
        "--out-file",
        default=str(DEFAULT_OUT_FILE),
        help="Path to write merged decisions JSON",
    )
    parser.add_argument(
        "--report-json",
        default=str(DEFAULT_REPORT_JSON),
        help="Path to write merge report JSON",
    )
    parser.add_argument(
        "--report-md",
        default=str(DEFAULT_REPORT_MD),
        help="Path to write merge report markdown",
    )
    parser.add_argument(
        "--overwrite-master",
        action="store_true",
        help="Overwrite docs/metadata_review_decisions.json with merged output when no conflicts",
    )
    parser.add_argument(
        "--master-file",
        default=str(DEFAULT_MASTER_FILE),
        help="Master file path used with --overwrite-master",
    )
    args = parser.parse_args()

    batch_dir = Path(args.batch_dir)
    out_file = Path(args.out_file)
    report_json = Path(args.report_json)
    report_md = Path(args.report_md)
    master_file = Path(args.master_file)

    if not batch_dir.is_absolute():
        batch_dir = ROOT / batch_dir
    if not out_file.is_absolute():
        out_file = ROOT / out_file
    if not report_json.is_absolute():
        report_json = ROOT / report_json
    if not report_md.is_absolute():
        report_md = ROOT / report_md
    if not master_file.is_absolute():
        master_file = ROOT / master_file

    if not batch_dir.exists():
        raise SystemExit(f"Batch directory not found: {batch_dir}")

    reviewer_files = sorted(batch_dir.glob("*_decisions.json"))
    if not reviewer_files:
        raise SystemExit(f"No reviewer decision files found in: {batch_dir}")

    merged_by_key: Dict[Tuple[str, str, str, str], Dict[str, Any]] = {}
    report = {
        "summary": {
            "reviewer_files_read": len(reviewer_files),
            "decisions_read": 0,
            "unique_decisions": 0,
            "duplicate_identical": 0,
            "conflicts": 0,
        },
        "status_counts": {},
        "reviewer_status_counts": {},
        "topic_status_counts": {},
        "conflicts": [],
    }
    reviewer_status_counts = defaultdict(Counter)
    topic_status_counts = defaultdict(Counter)

    meta_version = 1
    source_queue = ""
    instructions = ""

    for file_path in reviewer_files:
        doc = load_json(file_path)
        meta_version = int(doc.get("metadata_version", meta_version))
        source_queue = str(doc.get("source_queue") or source_queue)
        instructions = str(doc.get("instructions") or instructions)
        reviewer_name = str(doc.get("reviewer") or file_path.stem)

        decisions = doc.get("decisions", [])
        if not isinstance(decisions, list):
            continue

        for raw in decisions:
            if not isinstance(raw, dict):
                continue
            report["summary"]["decisions_read"] += 1
            item = canonical_decision_payload(raw)
            key = decision_key(item)
            status = item["status"]
            reviewer_status_counts[reviewer_name][status] += 1
            topic_status_counts[item["topic_id"]][status] += 1

            existing = merged_by_key.get(key)
            if existing is None:
                merged_by_key[key] = {
                    **item,
                    "_source_file": str(file_path.relative_to(ROOT)).replace("\\", "/"),
                }
                continue

            # Same decision seen multiple times.
            same_status = existing["status"] == item["status"]
            same_changes = existing["changes"] == item["changes"]
            same_note = existing.get("note", "") == item.get("note", "")
            if same_status and same_changes and same_note:
                report["summary"]["duplicate_identical"] += 1
                continue

            report["summary"]["conflicts"] += 1
            report["conflicts"].append(
                {
                    "key": {
                        "question_id": key[0],
                        "topic_id": key[1],
                        "source_file": key[2],
                        "subcategory_id": key[3],
                    },
                    "existing_file": existing["_source_file"],
                    "existing_status": existing["status"],
                    "existing_changes": existing["changes"],
                    "incoming_file": str(file_path.relative_to(ROOT)).replace("\\", "/"),
                    "incoming_status": item["status"],
                    "incoming_changes": item["changes"],
                }
            )

    merged = []
    for _, item in sorted(merged_by_key.items(), key=lambda pair: pair[0]):
        item = dict(item)
        item.pop("_source_file", None)
        merged.append(item)

    status_counts = Counter(item["status"] for item in merged)
    report["summary"]["unique_decisions"] = len(merged)
    report["status_counts"] = dict(sorted(status_counts.items()))
    report["reviewer_status_counts"] = {
        reviewer: dict(sorted(counter.items()))
        for reviewer, counter in sorted(reviewer_status_counts.items())
    }
    report["topic_status_counts"] = {
        topic_id: dict(sorted(counter.items()))
        for topic_id, counter in sorted(topic_status_counts.items())
    }

    merged_payload = {
        "metadata_version": meta_version,
        "source_queue": source_queue,
        "instructions": instructions,
        "decisions": merged,
    }
    dump_json(out_file, merged_payload)
    dump_json(report_json, report)
    build_markdown(report, report_md)

    if args.overwrite_master:
        if report["summary"]["conflicts"] > 0:
            raise SystemExit("Cannot overwrite master: conflicts detected in reviewer files.")
        dump_json(master_file, merged_payload)

    print(json.dumps(report["summary"], indent=2))
    print(f"Merged file: {out_file}")
    print(f"Report JSON: {report_json}")
    print(f"Report MD: {report_md}")
    if args.overwrite_master:
        print(f"Master updated: {master_file}")


if __name__ == "__main__":
    main()
