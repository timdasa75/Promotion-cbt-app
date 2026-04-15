#!/usr/bin/env python3
"""Apply curated question-quality move batch round 5."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_moves_round5.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_moves_round5.md"


@dataclass(frozen=True)
class MoveSpec:
    question_id: str
    source_topic: str
    source_subcategory: str
    target_topic: str
    target_subcategory: str
    target_prefix: str


MOVE_SPECS = [
    MoveSpec("clg_gc_080", "constitutional_law", "clg_general_competency", "civil_service_admin", "csh_administrative_procedures", "csh_ap_"),
    MoveSpec("ppa_bid_062", "procurement_act", "proc_bidding_evaluation", "civil_service_admin", "csh_administrative_procedures", "csh_ap_"),
    MoveSpec("ppa_bid_063", "procurement_act", "proc_bidding_evaluation", "civil_service_admin", "csh_administrative_procedures", "csh_ap_"),
    MoveSpec("ppa_bid_068", "procurement_act", "proc_bidding_evaluation", "civil_service_admin", "csh_administrative_procedures", "csh_ap_"),
    MoveSpec("ppa_ethic_053", "procurement_act", "proc_transparency_ethics", "civil_service_admin", "csh_administrative_procedures", "csh_ap_"),
]

SOURCE_DOCUMENT_BY_TOPIC = {
    "civil_service_admin": "Civil Service Handbook",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Batch 1 Applied Moves Round 5",
        "",
        f"- Applied moves: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(f"- `{item['old_id']}` -> `{item['new_id']}`")
        lines.append(f"  - {item['source_topic']}/{item['source_subcategory']} -> {item['target_topic']}/{item['target_subcategory']}")
        lines.append(f"  - {item['question']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def normalize_tags(tags, old_topic, old_subcategory, new_topic, new_subcategory):
    items = [str(tag).strip() for tag in (tags or []) if str(tag).strip()]
    filtered = [tag for tag in items if tag not in {old_topic, old_subcategory}]
    for tag in (new_topic, new_subcategory):
        if tag and tag not in filtered:
            filtered.append(tag)
    return filtered


def next_id_for_prefix(questions, prefix: str) -> str:
    pattern = re.compile(rf"^{re.escape(prefix)}(\d+)$")
    max_number = 0
    for question in questions:
        match = pattern.match(str(question.get("id") or "").strip())
        if match:
            max_number = max(max_number, int(match.group(1)))
    return f"{prefix}{max_number + 1:03d}"


def find_question(subcategory: dict, question_id: str):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return None, None
    for index, question in enumerate(questions):
        if isinstance(question, dict) and str(question.get("id") or "").strip() == question_id:
            return index, question
    return None, None


def build_topic_maps(root: Path):
    topics_doc = load_json(TOPICS_FILE)
    topic_meta = {}
    topic_docs = {}
    topic_paths = {}
    subcategory_names = {}
    subcategory_refs = {}

    for topic in topics_doc.get("topics", []):
        if not isinstance(topic, dict):
            continue
        topic_id = str(topic.get("id") or "").strip()
        if not topic_id:
            continue
        topic_meta[topic_id] = topic
        path = root / str(topic.get("file") or "")
        topic_paths[topic_id] = path
        doc = load_json(path)
        topic_docs[topic_id] = doc
        for subcategory in doc.get("subcategories", []) if isinstance(doc, dict) else []:
            if not isinstance(subcategory, dict):
                continue
            sub_id = str(subcategory.get("id") or "").strip()
            if not sub_id:
                continue
            subcategory_names[(topic_id, sub_id)] = str(subcategory.get("name") or sub_id).strip()
            subcategory_refs[(topic_id, sub_id)] = subcategory

    return topic_meta, topic_docs, topic_paths, subcategory_names, subcategory_refs


def apply_moves(root: Path):
    topic_meta, topic_docs, topic_paths, subcategory_names, subcategory_refs = build_topic_maps(root)
    applied = []

    for spec in MOVE_SPECS:
        source_subcategory_ref = subcategory_refs[(spec.source_topic, spec.source_subcategory)]
        target_subcategory_ref = subcategory_refs[(spec.target_topic, spec.target_subcategory)]
        source_questions = source_subcategory_ref.get("questions") or []
        target_questions = target_subcategory_ref.get("questions") or []

        source_index, question = find_question(source_subcategory_ref, spec.question_id)
        if question is None:
            raise SystemExit(f"Question {spec.question_id} not found in {spec.source_topic}/{spec.source_subcategory}")

        new_id = next_id_for_prefix(target_questions, spec.target_prefix)
        legacy_ids = [str(value).strip() for value in (question.get("legacyQuestionIds") or []) if str(value).strip()]
        if spec.question_id not in legacy_ids:
            legacy_ids.append(spec.question_id)

        updated = dict(question)
        updated["id"] = new_id
        updated["legacyQuestionIds"] = legacy_ids
        updated["sourceTopicId"] = spec.target_topic
        updated["sourceTopicName"] = str(topic_meta[spec.target_topic].get("name") or spec.target_topic).strip()
        updated["sourceSubcategoryId"] = spec.target_subcategory
        updated["sourceSubcategoryName"] = subcategory_names[(spec.target_topic, spec.target_subcategory)]
        updated["sourceSection"] = subcategory_names[(spec.target_topic, spec.target_subcategory)]
        updated["sourceDocument"] = SOURCE_DOCUMENT_BY_TOPIC.get(spec.target_topic, str(updated.get("sourceDocument") or "").strip())
        updated["chapter"] = "Administrative Procedures"
        updated["tags"] = normalize_tags(updated.get("tags"), spec.source_topic, spec.source_subcategory, spec.target_topic, spec.target_subcategory)
        updated["lastReviewed"] = "2026-04-02"

        del source_questions[source_index]
        target_questions.append(updated)

        applied.append({
            "old_id": spec.question_id,
            "new_id": new_id,
            "source_topic": spec.source_topic,
            "source_subcategory": spec.source_subcategory,
            "target_topic": spec.target_topic,
            "target_subcategory": spec.target_subcategory,
            "target_file": str(topic_paths[spec.target_topic].relative_to(root)).replace('\\', '/'),
            "question": updated.get("question", ""),
        })

    for topic_id, doc in topic_docs.items():
        save_json(topic_paths[topic_id], doc)

    return applied


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--log-out", type=Path, default=DEFAULT_LOG_JSON)
    parser.add_argument("--markdown-out", type=Path, default=DEFAULT_LOG_MD)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    applied = apply_moves(args.root)
    payload = {"applied": applied}
    save_json(args.log_out, payload)
    write_markdown(args.markdown_out, payload)
    print(json.dumps({"applied_moves": len(applied), "moves": applied}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
