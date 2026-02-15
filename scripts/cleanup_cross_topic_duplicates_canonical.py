#!/usr/bin/env python3
"""
Conservative canonical cross-topic dedupe.

Rule:
- Use exact duplicate text groups.
- Infer canonical topic from explicit question tokens.
- Remove non-canonical occurrences ONLY when canonical inference is explicit
  and canonical topic is present in the group.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
AUDIT_JSON = ROOT / "docs" / "question_quality_audit.json"
TOPICS_FILE = ROOT / "data" / "topics.json"
OUT_JSON = ROOT / "docs" / "cross_topic_dedupe_proposed_removals.json"
OUT_MD = ROOT / "docs" / "cross_topic_dedupe_proposed_removals.md"


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


def infer_canonical_topic(question_text: str) -> Tuple[str | None, str]:
    q = normalize_text(question_text)
    token_sets = [
        ("psr", ["psr", "public service rules", "gl.", "gl ", "probation", "leave of absence"]),
        (
            "financial_regulations",
            ["financial regulations", "virement", "vote book", "imprest", "treasury", "appropriation", "warrant"],
        ),
        ("procurement_act", ["procurement", "bpp", "tender", "bid opening", "certificate of no objection"]),
        ("constitutional_law", ["constitution", "foi", "freedom of information", "constitutional"]),
        ("ict_management", ["ict", "cyber", "digital", "e governance", "ssl", "tls"]),
        ("competency_framework", ["numerical reasoning", "verbal reasoning", "analytical reasoning"]),
        ("policy_analysis", ["policy formulation", "policy analysis", "policy implementation"]),
        ("leadership_management", ["leadership", "strategic management", "negotiation"]),
    ]
    for topic_id, hints in token_sets:
        for h in hints:
            if h in q:
                return topic_id, f"token:{h}"
    return None, "none"


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
        out.append({"topic_id": topic.get("id", ""), "file": rel_file})
    return out


def iterate_subcategory_questions(subcategory: dict):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return [], False
    sid = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sid and isinstance(questions[0].get(sid), list):
        return questions[0][sid], True
    return questions, False


def load_locations():
    file_data = {}
    locations = {}
    for topic in collect_topic_files():
        rel = topic["file"]
        path = ROOT / rel
        if not path.exists():
            continue
        data = load_json(path)
        file_data[rel] = data
        subcats = data.get("subcategories", []) if isinstance(data, dict) else []
        for sub in subcats:
            if not isinstance(sub, dict):
                continue
            sub_id = sub.get("id", "")
            q_list, nested = iterate_subcategory_questions(sub)
            for idx, q in enumerate(q_list):
                if not isinstance(q, dict):
                    continue
                qid = str(q.get("id", "")).strip()
                qtxt = str(q.get("question", "")).strip()
                norm = normalize_text(qtxt)
                key = (topic["topic_id"], sub_id, qid, norm)
                locations[key] = {
                    "source_file": rel,
                    "index": idx,
                    "nested": nested,
                    "topic_id": topic["topic_id"],
                    "subcategory_id": sub_id,
                    "question_id": qid,
                    "question": qtxt,
                    "norm": norm,
                }
    return file_data, locations


def build_proposals(audit: dict):
    proposals = []
    groups = audit.get("exact_duplicate_text", {})
    for _, items in groups.items():
        if not items:
            continue
        question_text = items[0].get("question", "")
        canonical_topic, evidence = infer_canonical_topic(question_text)
        if not canonical_topic:
            continue
        topics_in_group = {it.get("topic_id") for it in items}
        if canonical_topic not in topics_in_group:
            continue

        for it in items:
            if it.get("topic_id") == canonical_topic:
                continue
            proposals.append(
                {
                    "topic_id": it.get("topic_id"),
                    "subcategory_id": it.get("subcategory_id"),
                    "question_id": it.get("question_id"),
                    "source_file": it.get("source_file"),
                    "question": it.get("question"),
                    "norm_question": normalize_text(it.get("question", "")),
                    "canonical_topic": canonical_topic,
                    "canonical_evidence": evidence,
                }
            )

    # Deduplicate exact location keys.
    seen = set()
    unique = []
    for p in proposals:
        key = (p["topic_id"], p["subcategory_id"], p["question_id"], p["source_file"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(p)
    return unique


def apply_proposals(file_data, locations, proposals):
    remove_map = defaultdict(list)  # (source_file, subcategory_id, nested) -> indices
    for p in proposals:
        key = (p["topic_id"], p["subcategory_id"], p["question_id"], p["norm_question"])
        loc = locations.get(key)
        if not loc:
            continue
        remove_map[(loc["source_file"], loc["subcategory_id"], loc["nested"])].append(loc["index"])

    changed = set()
    for (source_file, sub_id, nested), indices in remove_map.items():
        data = file_data[source_file]
        subcats = data.get("subcategories", [])
        for sub in subcats:
            if not isinstance(sub, dict) or sub.get("id") != sub_id:
                continue
            q_list, is_nested = iterate_subcategory_questions(sub)
            if is_nested != nested:
                continue
            to_remove = set(indices)
            filtered = [q for i, q in enumerate(q_list) if i not in to_remove]
            if nested:
                sub["questions"][0][sub_id] = filtered
            else:
                sub["questions"] = filtered
            changed.add(source_file)
            break

    for rel in changed:
        dump_json(ROOT / rel, file_data[rel])
    return sorted(changed)


def write_markdown(report: dict, path: Path):
    lines = []
    lines.append("# Canonical Cross-Topic Dedupe Proposal")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Proposed removals: **{report['summary']['to_remove_count']}**")
    lines.append(f"- Files changed: **{report['summary']['files_changed']}**")
    lines.append(f"- Applied: **{report['summary']['applied']}**")
    lines.append("")
    lines.append("## Removal List")
    if not report["removals"]:
        lines.append("- None")
    else:
        for r in report["removals"]:
            lines.append(
                f"- `{r['question_id']}` [{r['topic_id']}/{r['subcategory_id']}] in `{r['source_file']}`"
                f" -> keep under `{r['canonical_topic']}` ({r['canonical_evidence']})"
            )
            q = r.get("question") or ""
            lines.append(f"  - {q[:180]}{'...' if len(q) > 180 else ''}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Canonical cross-topic dedupe")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--audit-json", default=str(AUDIT_JSON))
    parser.add_argument("--json-out", default=str(OUT_JSON))
    parser.add_argument("--md-out", default=str(OUT_MD))
    args = parser.parse_args()

    audit = load_json(Path(args.audit_json))
    file_data, locations = load_locations()
    proposals = build_proposals(audit)

    changed_files = []
    if args.apply and proposals:
        changed_files = apply_proposals(file_data, locations, proposals)

    report = {
        "summary": {
            "to_remove_count": len(proposals),
            "files_changed": len(changed_files),
            "applied": bool(args.apply),
        },
        "changed_files": changed_files,
        "removals": proposals,
    }

    json_out = Path(args.json_out)
    md_out = Path(args.md_out)
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_markdown(report, md_out)

    print("Canonical cross-topic dedupe complete")
    print(json.dumps(report["summary"], indent=2))
    print(f"JSON report: {json_out}")
    print(f"Markdown report: {md_out}")


if __name__ == "__main__":
    main()
