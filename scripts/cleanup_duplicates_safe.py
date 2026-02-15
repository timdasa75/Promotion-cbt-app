#!/usr/bin/env python3
"""
Safe duplicate cleanup pass.

Rules:
1) Remove exact duplicate question text ONLY within the same topic/subcategory.
2) Keep the first occurrence in file order.
3) Do not auto-remove cross-topic duplicates; report them for manual review.

Outputs:
  - docs/question_cleanup_proposed_removals.json
  - docs/question_cleanup_proposed_removals.md
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
TOPICS_FILE = DATA_DIR / "topics.json"
DEFAULT_JSON_OUT = ROOT / "docs" / "question_cleanup_proposed_removals.json"
DEFAULT_MD_OUT = ROOT / "docs" / "question_cleanup_proposed_removals.md"


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


@dataclass
class QuestionRef:
    topic_id: str
    topic_name: str
    subcategory_id: str
    subcategory_name: str
    question_id: str
    question: str
    source_file: str
    nested: bool
    question_index: int


def iterate_subcategory_questions(subcategory: dict) -> Tuple[List[dict], bool]:
    """
    Returns mutable question list and whether it is nested special format.
    """
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return [], False

    sub_id = subcategory.get("id")
    if (
        questions
        and isinstance(questions[0], dict)
        and sub_id
        and isinstance(questions[0].get(sub_id), list)
    ):
        return questions[0][sub_id], True
    return questions, False


def collect_topic_files():
    topics_doc = load_json(TOPICS_FILE)
    topics = topics_doc.get("topics", [])
    out = []
    for topic in topics:
        if not isinstance(topic, dict):
            continue
        rel_file = topic.get("file")
        if not rel_file:
            continue
        out.append(
            {
                "topic_id": topic.get("id", ""),
                "topic_name": topic.get("name", ""),
                "file": rel_file,
            }
        )
    return out


def cleanup_file(topic_info: dict):
    path = ROOT / topic_info["file"]
    if not path.exists():
        return None
    data = load_json(path)
    if not isinstance(data, dict):
        return None

    subcategories = data.get("subcategories")
    if not isinstance(subcategories, list):
        return None

    removals: List[QuestionRef] = []
    kept: List[QuestionRef] = []

    for sub in subcategories:
        if not isinstance(sub, dict):
            continue
        sub_id = sub.get("id", "")
        sub_name = sub.get("name", sub_id)
        question_list, nested = iterate_subcategory_questions(sub)
        if not question_list:
            continue

        seen_norm = {}
        remove_indices = []

        for idx, q in enumerate(question_list):
            if not isinstance(q, dict):
                continue
            question_text = str(q.get("question", "")).strip()
            norm = normalize_text(question_text)
            qref = QuestionRef(
                topic_id=topic_info["topic_id"],
                topic_name=topic_info["topic_name"],
                subcategory_id=sub_id,
                subcategory_name=sub_name,
                question_id=str(q.get("id", "")).strip(),
                question=question_text,
                source_file=topic_info["file"],
                nested=nested,
                question_index=idx,
            )
            if not norm:
                kept.append(qref)
                continue

            if norm in seen_norm:
                remove_indices.append(idx)
                removals.append(qref)
            else:
                seen_norm[norm] = idx
                kept.append(qref)

        if remove_indices:
            to_remove = set(remove_indices)
            sub_questions = [q for i, q in enumerate(question_list) if i not in to_remove]
            if nested:
                sub["questions"][0][sub_id] = sub_questions
            else:
                sub["questions"] = sub_questions

    return {"path": path, "data": data, "removals": removals, "kept": kept}


def build_cross_topic_duplicate_report(kept_questions: List[QuestionRef]):
    by_norm = defaultdict(list)
    for q in kept_questions:
        norm = normalize_text(q.question)
        if norm:
            by_norm[norm].append(q)

    cross_topic_groups = []
    for norm, items in by_norm.items():
        topic_set = {i.topic_id for i in items}
        if len(items) > 1 and len(topic_set) > 1:
            cross_topic_groups.append(
                {
                    "normalized_question": norm,
                    "occurrences": [
                        {
                            "topic_id": i.topic_id,
                            "subcategory_id": i.subcategory_id,
                            "question_id": i.question_id,
                            "source_file": i.source_file,
                            "question": i.question,
                        }
                        for i in items
                    ],
                }
            )
    cross_topic_groups.sort(key=lambda g: len(g["occurrences"]), reverse=True)
    return cross_topic_groups


def write_markdown(report: dict, path: Path):
    lines = []
    lines.append("# Safe Duplicate Cleanup Proposal")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Duplicate questions removed (same topic/subcategory): **{report['summary']['to_remove_count']}**")
    lines.append(f"- Topic files changed: **{report['summary']['files_changed']}**")
    lines.append(f"- Cross-topic duplicate groups kept for manual review: **{report['summary']['cross_topic_groups']}**")
    lines.append("")

    lines.append("## Auto-Removal List")
    if not report["auto_removed"]:
        lines.append("- None")
    else:
        for item in report["auto_removed"]:
            lines.append(
                f"- `{item['question_id']}` [{item['topic_id']}/{item['subcategory_id']}] in `{item['source_file']}`"
            )
            lines.append(
                f"  - {item['question'][:180]}{'...' if len(item['question']) > 180 else ''}"
            )
    lines.append("")

    lines.append("## Cross-Topic Duplicates (Manual Review)")
    if not report["cross_topic_duplicates"]:
        lines.append("- None")
    else:
        for group in report["cross_topic_duplicates"][:80]:
            lines.append(
                f"- occurrences={len(group['occurrences'])} :: \"{group['normalized_question'][:150]}{'...' if len(group['normalized_question']) > 150 else ''}\""
            )
            refs = ", ".join(
                f"{x['question_id']} [{x['topic_id']}/{x['subcategory_id']}]"
                for x in group["occurrences"][:10]
            )
            lines.append(f"  - {refs}")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Safe duplicate cleanup")
    parser.add_argument("--apply", action="store_true", help="Write changes to data files")
    parser.add_argument("--json-out", default=str(DEFAULT_JSON_OUT))
    parser.add_argument("--md-out", default=str(DEFAULT_MD_OUT))
    args = parser.parse_args()

    all_kept: List[QuestionRef] = []
    all_removed: List[QuestionRef] = []
    changed_files = []

    for topic_info in collect_topic_files():
        result = cleanup_file(topic_info)
        if not result:
            continue
        all_kept.extend(result["kept"])
        all_removed.extend(result["removals"])
        if result["removals"]:
            changed_files.append(str(result["path"].relative_to(ROOT)))
            if args.apply:
                dump_json(result["path"], result["data"])

    cross_topic_duplicates = build_cross_topic_duplicate_report(all_kept)
    auto_removed = [
        {
            "topic_id": r.topic_id,
            "subcategory_id": r.subcategory_id,
            "question_id": r.question_id,
            "source_file": r.source_file,
            "question": r.question,
        }
        for r in all_removed
    ]

    report = {
        "summary": {
            "to_remove_count": len(auto_removed),
            "files_changed": len(changed_files),
            "cross_topic_groups": len(cross_topic_duplicates),
            "applied": bool(args.apply),
        },
        "changed_files": changed_files,
        "auto_removed": auto_removed,
        "cross_topic_duplicates": cross_topic_duplicates,
    }

    json_out = Path(args.json_out)
    md_out = Path(args.md_out)
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(report, md_out)

    print("Safe duplicate cleanup complete")
    print(json.dumps(report["summary"], indent=2))
    print(f"JSON report: {json_out}")
    print(f"Markdown report: {md_out}")


if __name__ == "__main__":
    main()
