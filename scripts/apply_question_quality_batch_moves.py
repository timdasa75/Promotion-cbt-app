#!/usr/bin/env python3
"""Apply queued question-quality move candidates with ID renaming and legacy aliases."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_QUEUE = ROOT / "docs" / "question_quality_batch1_queue.json"
DEFAULT_LOG = ROOT / "docs" / "question_quality_batch1_applied_moves.json"

SOURCE_DOCUMENT_BY_TOPIC = {
    "psr": "Public Service Rules (PSR 2021)",
    "financial_regulations": "Financial Regulations (FR)",
    "procurement_act": "Public Procurement Act (2007)",
    "civil_service_admin": "Civil Service Handbook",
}


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


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


def select_items(queue: dict, min_confidence: float, limit: int | None, target_topic: str | None):
    items = []
    for item in queue.get("groups", {}).get("move", {}).get("items", []):
        if target_topic and item.get("suggested_target_topic") != target_topic:
            continue
        if not item.get("suggested_target_subcategory") or not item.get("suggested_target_prefix"):
            continue
        if float(item.get("confidence") or 0) < min_confidence:
            continue
        items.append(item)
    if limit is not None:
        items = items[:limit]
    return items


def apply_moves(root: Path, queue: dict, min_confidence: float, limit: int | None, target_topic: str | None):
    topic_meta, topic_docs, topic_paths, subcategory_names, subcategory_refs = build_topic_maps(root)
    selected = select_items(queue, min_confidence, limit, target_topic)
    applied = []

    for spec in selected:
        source_topic = str(spec["source_topic"])
        source_subcategory = str(spec["source_subcategory"])
        target_topic_id = str(spec["suggested_target_topic"])
        target_subcategory = str(spec["suggested_target_subcategory"])
        target_prefix = str(spec["suggested_target_prefix"])
        question_id = str(spec["question_id"])

        source_subcategory_ref = subcategory_refs[(source_topic, source_subcategory)]
        target_subcategory_ref = subcategory_refs[(target_topic_id, target_subcategory)]
        source_questions = source_subcategory_ref.get("questions") or []
        target_questions = target_subcategory_ref.get("questions") or []

        source_index, question = find_question(source_subcategory_ref, question_id)
        if question is None:
            raise SystemExit(f"Question {question_id} not found in {source_topic}/{source_subcategory}")

        new_id = next_id_for_prefix(target_questions, target_prefix)
        legacy_ids = [str(value).strip() for value in (question.get("legacyQuestionIds") or []) if str(value).strip()]
        if question_id not in legacy_ids:
            legacy_ids.append(question_id)

        updated = dict(question)
        updated["id"] = new_id
        updated["legacyQuestionIds"] = legacy_ids
        updated["sourceTopicId"] = target_topic_id
        updated["sourceTopicName"] = str(topic_meta[target_topic_id].get("name") or target_topic_id).strip()
        updated["sourceSubcategoryId"] = target_subcategory
        updated["sourceSubcategoryName"] = subcategory_names[(target_topic_id, target_subcategory)]
        updated["sourceSection"] = subcategory_names[(target_topic_id, target_subcategory)]
        updated["sourceDocument"] = SOURCE_DOCUMENT_BY_TOPIC.get(target_topic_id, str(updated.get("sourceDocument") or "").strip())
        if "topic" in updated:
            updated["topic"] = str(topic_meta[target_topic_id].get("name") or target_topic_id).strip()
        updated["tags"] = normalize_tags(
            updated.get("tags"),
            source_topic,
            source_subcategory,
            target_topic_id,
            target_subcategory,
        )
        updated["lastReviewed"] = "2026-04-01"

        del source_questions[source_index]
        target_questions.append(updated)

        applied.append({
            "old_id": question_id,
            "new_id": new_id,
            "source_topic": source_topic,
            "source_subcategory": source_subcategory,
            "target_topic": target_topic_id,
            "target_subcategory": target_subcategory,
            "target_prefix": target_prefix,
            "target_file": str(topic_paths[target_topic_id].relative_to(root)).replace('\\', '/'),
        })

    for topic_id, doc in topic_docs.items():
        save_json(topic_paths[topic_id], doc)

    return applied


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--queue", type=Path, default=DEFAULT_QUEUE)
    parser.add_argument("--log-out", type=Path, default=DEFAULT_LOG)
    parser.add_argument("--min-confidence", type=float, default=0.8)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--target-topic", default="civil_service_admin")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    queue = load_json(args.queue)
    applied = apply_moves(args.root, queue, args.min_confidence, args.limit, args.target_topic)
    prior = {"applied": []}
    if args.log_out.exists():
        prior = load_json(args.log_out)
    combined = list(prior.get("applied", [])) + applied
    args.log_out.parent.mkdir(parents=True, exist_ok=True)
    save_json(args.log_out, {"applied": combined})
    print(json.dumps({"applied_moves": len(applied), "moves": applied}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
