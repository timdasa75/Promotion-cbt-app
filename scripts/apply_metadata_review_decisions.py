#!/usr/bin/env python3
"""
Apply SME-approved metadata decisions to question pools.

Default mode is dry-run. Use --apply to write changes.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_DECISIONS_FILE = ROOT / "docs" / "metadata_review_decisions.json"
DEFAULT_OUT_JSON = ROOT / "docs" / "metadata_review_apply_result.json"
DEFAULT_OUT_MD = ROOT / "docs" / "metadata_review_apply_result.md"
CURRENT_YEAR = 2026

ALLOWED_CHANGE_FIELDS = {
    "sourceDocument",
    "sourceSection",
    "year",
    "lastReviewed",
    "difficulty",
}
ALLOWED_DIFFICULTY = {"easy", "medium", "hard"}
APPROVED_STATUSES = {"approved", "accept", "accepted", "apply"}
SKIP_STATUSES = {"pending", "rejected", "skip", "hold", "defer"}


def load_json(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


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


def iterate_questions(subcategory: dict):
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


def collect_topic_files() -> List[Dict[str, str]]:
    topics_doc = load_json(TOPICS_FILE)
    topics = [t for t in topics_doc.get("topics", []) if isinstance(t, dict)]
    out = []
    for topic in topics:
        rel_file = str(topic.get("file") or "").strip()
        if not rel_file:
            continue
        out.append(
            {
                "topic_id": str(topic.get("id") or ""),
                "topic_name": str(topic.get("name") or ""),
                "file": rel_file,
            }
        )
    return out


def build_question_index() -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]]]:
    topic_files = collect_topic_files()
    payload_by_file = {}
    by_qid = defaultdict(list)

    for topic in topic_files:
        rel_file = topic["file"]
        path = ROOT / rel_file
        if not path.exists():
            continue
        payload = load_json(path)
        payload_by_file[rel_file] = payload
        for sub in collect_subcategories(payload):
            sub_id = str(sub.get("id") or "")
            for question in iterate_questions(sub):
                qid = str(question.get("id") or "").strip()
                if not qid:
                    continue
                by_qid[qid].append(
                    {
                        "topic_id": topic["topic_id"],
                        "topic_name": topic["topic_name"],
                        "source_file": rel_file,
                        "subcategory_id": sub_id,
                        "question_obj": question,
                    }
                )

    return payload_by_file, by_qid


def normalize_status(value: Any) -> str:
    return str(value or "").strip().lower()


def parse_status(decision: Dict[str, Any]) -> str:
    for key in ("status", "decision"):
        value = normalize_status(decision.get(key))
        if value:
            return value
    return "approved"


def validate_changes(changes: Dict[str, Any]) -> List[str]:
    errors = []
    if not isinstance(changes, dict) or not changes:
        return ["Missing or empty 'changes' object."]

    for field, value in changes.items():
        if field not in ALLOWED_CHANGE_FIELDS:
            errors.append(f"Unsupported change field: {field}")
            continue

        if field == "sourceDocument":
            if not str(value or "").strip():
                errors.append("sourceDocument must be a non-empty string.")
        elif field == "sourceSection":
            if not str(value or "").strip():
                errors.append("sourceSection must be a non-empty string.")
        elif field == "lastReviewed":
            raw = str(value or "").strip()
            if len(raw) != 10 or raw.count("-") != 2:
                errors.append("lastReviewed must use YYYY-MM-DD format.")
        elif field == "difficulty":
            normalized = str(value or "").strip().lower()
            if normalized not in ALLOWED_DIFFICULTY:
                errors.append("difficulty must be one of easy|medium|hard.")
        elif field == "year":
            try:
                numeric = int(value)
            except Exception:
                errors.append("year must be an integer.")
                continue
            if numeric < 1900 or numeric > CURRENT_YEAR:
                errors.append(f"year must be between 1900 and {CURRENT_YEAR}.")

    return errors


def find_matches(decision: Dict[str, Any], by_qid: Dict[str, List[Dict[str, Any]]]) -> Tuple[List[Dict[str, Any]], str]:
    qid = str(decision.get("question_id") or "").strip()
    if not qid:
        return [], "missing_question_id"

    candidates = by_qid.get(qid, [])
    if not candidates:
        return [], "not_found"

    source_file = str(decision.get("source_file") or "").strip()
    subcategory_id = str(decision.get("subcategory_id") or "").strip()
    topic_id = str(decision.get("topic_id") or "").strip()

    filtered = candidates
    if source_file:
        filtered = [entry for entry in filtered if entry["source_file"] == source_file]
    if subcategory_id:
        filtered = [entry for entry in filtered if entry["subcategory_id"] == subcategory_id]
    if topic_id:
        filtered = [entry for entry in filtered if entry["topic_id"] == topic_id]

    if not filtered:
        return [], "not_found_with_filters"
    if len(filtered) > 1:
        return filtered, "ambiguous"
    return filtered, "ok"


def apply_changes_to_question(
    question: Dict[str, Any],
    changes: Dict[str, Any],
    auto_last_reviewed: bool,
):
    before = {}
    after = {}
    changed_fields = []
    for field, incoming in changes.items():
        if field not in ALLOWED_CHANGE_FIELDS:
            continue
        before[field] = question.get(field)
        value = incoming
        if field in {"sourceDocument", "sourceSection", "lastReviewed", "difficulty"}:
            value = str(incoming or "").strip()
        if field == "difficulty":
            value = value.lower()
        if field == "year":
            value = int(incoming)
        if question.get(field) != value:
            question[field] = value
            changed_fields.append(field)
        after[field] = question.get(field)

    if auto_last_reviewed and changed_fields and "lastReviewed" not in changes:
        today = date.today().isoformat()
        before["lastReviewed"] = question.get("lastReviewed")
        if question.get("lastReviewed") != today:
            question["lastReviewed"] = today
            changed_fields.append("lastReviewed")
        after["lastReviewed"] = question.get("lastReviewed")

    return before, after, changed_fields


def write_markdown(report: Dict[str, Any], out_path: Path):
    summary = report["summary"]
    lines = []
    lines.append("# Metadata Decision Apply Result")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Apply mode: **{summary['apply_mode']}**")
    lines.append(f"- Decisions total: **{summary['decisions_total']}**")
    lines.append(f"- Decisions approved/processed: **{summary['processed']}**")
    lines.append(f"- Records updated: **{summary['records_updated']}**")
    lines.append(f"- Field updates applied: **{summary['field_updates_applied']}**")
    lines.append(f"- Files changed: **{summary['files_changed']}**")
    lines.append(f"- Skipped by status: **{summary['skipped_status']}**")
    lines.append(f"- Not found: **{summary['not_found']}**")
    lines.append(f"- Ambiguous: **{summary['ambiguous']}**")
    lines.append(f"- Invalid decisions: **{summary['invalid']}**")
    lines.append(f"- No-op updates: **{summary['no_change']}**")
    lines.append("")
    lines.append("## Updated Items")
    if not report["updated"]:
        lines.append("- None")
    else:
        for item in report["updated"][:120]:
            lines.append(
                f"- `{item['question_id']}` [{item['topic_id']}/{item['subcategory_id']}] "
                f"in `{item['source_file']}` fields={item['changed_fields']}"
            )
    lines.append("")
    lines.append("## Issues")
    for issue_key in ("invalid_items", "not_found_items", "ambiguous_items"):
        entries = report.get(issue_key, [])
        lines.append(f"- {issue_key}: {len(entries)}")
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Apply metadata review decisions")
    parser.add_argument(
        "--decisions-file",
        default=str(DEFAULT_DECISIONS_FILE),
        help="Path to metadata decisions JSON",
    )
    parser.add_argument("--apply", action="store_true", help="Write changes to disk")
    parser.add_argument(
        "--out-json",
        default=str(DEFAULT_OUT_JSON),
        help="Output report JSON path",
    )
    parser.add_argument(
        "--out-md",
        default=str(DEFAULT_OUT_MD),
        help="Output report markdown path",
    )
    parser.add_argument(
        "--no-auto-last-reviewed",
        action="store_true",
        help="Do not auto-update lastReviewed when any field changes",
    )
    args = parser.parse_args()

    decisions_path = Path(args.decisions_file)
    if not decisions_path.is_absolute():
        decisions_path = ROOT / decisions_path
    if not decisions_path.exists():
        raise SystemExit(f"Decisions file not found: {decisions_path}")

    payload_by_file, by_qid = build_question_index()
    decisions_doc = load_json(decisions_path)
    decisions = decisions_doc.get("decisions", [])
    if not isinstance(decisions, list):
        raise SystemExit("Decisions file must contain a 'decisions' array.")

    report = {
        "summary": {
            "apply_mode": bool(args.apply),
            "decisions_total": len(decisions),
            "processed": 0,
            "records_updated": 0,
            "field_updates_applied": 0,
            "files_changed": 0,
            "skipped_status": 0,
            "not_found": 0,
            "ambiguous": 0,
            "invalid": 0,
            "no_change": 0,
        },
        "updated": [],
        "invalid_items": [],
        "not_found_items": [],
        "ambiguous_items": [],
    }
    changed_files = set()

    for index, decision in enumerate(decisions):
        if not isinstance(decision, dict):
            report["summary"]["invalid"] += 1
            report["invalid_items"].append({"index": index, "error": "Decision entry must be an object."})
            continue

        status = parse_status(decision)
        if status in SKIP_STATUSES:
            report["summary"]["skipped_status"] += 1
            continue
        if status not in APPROVED_STATUSES:
            report["summary"]["invalid"] += 1
            report["invalid_items"].append(
                {"index": index, "question_id": decision.get("question_id"), "error": f"Unsupported status: {status}"}
            )
            continue

        changes = decision.get("changes")
        validation_errors = validate_changes(changes)
        if validation_errors:
            report["summary"]["invalid"] += 1
            report["invalid_items"].append(
                {
                    "index": index,
                    "question_id": decision.get("question_id"),
                    "error": "; ".join(validation_errors),
                }
            )
            continue

        report["summary"]["processed"] += 1
        matches, match_state = find_matches(decision, by_qid)
        if match_state.startswith("not_found") or match_state == "missing_question_id":
            report["summary"]["not_found"] += 1
            report["not_found_items"].append(
                {
                    "index": index,
                    "question_id": decision.get("question_id"),
                    "state": match_state,
                    "source_file": decision.get("source_file"),
                    "subcategory_id": decision.get("subcategory_id"),
                    "topic_id": decision.get("topic_id"),
                }
            )
            continue
        if match_state == "ambiguous":
            report["summary"]["ambiguous"] += 1
            report["ambiguous_items"].append(
                {
                    "index": index,
                    "question_id": decision.get("question_id"),
                    "candidates": [
                        {
                            "topic_id": entry["topic_id"],
                            "source_file": entry["source_file"],
                            "subcategory_id": entry["subcategory_id"],
                        }
                        for entry in matches
                    ],
                }
            )
            continue

        target = matches[0]
        question = target["question_obj"]
        before, after, changed_fields = apply_changes_to_question(
            question,
            changes,
            auto_last_reviewed=not args.no_auto_last_reviewed,
        )

        if not changed_fields:
            report["summary"]["no_change"] += 1
            continue

        report["summary"]["records_updated"] += 1
        report["summary"]["field_updates_applied"] += len(changed_fields)
        changed_files.add(target["source_file"])
        report["updated"].append(
            {
                "question_id": str(decision.get("question_id") or ""),
                "topic_id": target["topic_id"],
                "source_file": target["source_file"],
                "subcategory_id": target["subcategory_id"],
                "changed_fields": changed_fields,
                "before": before,
                "after": after,
                "note": str(decision.get("note") or "").strip(),
            }
        )

    if args.apply:
        for rel_file in sorted(changed_files):
            dump_json(ROOT / rel_file, payload_by_file[rel_file])

    report["summary"]["files_changed"] = len(changed_files)
    out_json_path = Path(args.out_json)
    out_md_path = Path(args.out_md)
    if not out_json_path.is_absolute():
        out_json_path = ROOT / out_json_path
    if not out_md_path.is_absolute():
        out_md_path = ROOT / out_md_path

    dump_json(out_json_path, report)
    write_markdown(report, out_md_path)
    print(json.dumps(report["summary"], indent=2))
    print(f"Report JSON: {out_json_path}")
    print(f"Report MD: {out_md_path}")


if __name__ == "__main__":
    main()
