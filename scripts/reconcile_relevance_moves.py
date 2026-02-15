#!/usr/bin/env python3
"""
Reconcile source leftovers after relevance queue batch moves.

For each processed action:
- If target topic contains an equivalent normalized question text,
  remove remaining source question instance with same question_id/text.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
BATCH_RESULT = ROOT / "docs" / "relevance_queue_batch_result.json"
OUT_JSON = ROOT / "docs" / "relevance_queue_reconcile_result.json"


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


def iterate_subcategory_questions(subcategory: dict):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return [], False
    sid = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sid and isinstance(questions[0].get(sid), list):
        return questions[0][sid], True
    return questions, False


def collect_topic_files():
    topics_doc = load_json(TOPICS_FILE)
    topics = topics_doc.get("topics", [])
    out = []
    for topic in topics:
        if not isinstance(topic, dict):
            continue
        rel = topic.get("file")
        if not rel:
            continue
        out.append((topic.get("id", ""), rel))
    return out


def build_indices(file_data_by_topic: Dict[str, dict]):
    norms_by_topic = {}
    for topic_id, data in file_data_by_topic.items():
        norms = set()
        for sub in data.get("subcategories", []):
            if not isinstance(sub, dict):
                continue
            qlist, _ = iterate_subcategory_questions(sub)
            for q in qlist:
                if not isinstance(q, dict):
                    continue
                norms.add(normalize_text(str(q.get("question", ""))))
        norms_by_topic[topic_id] = norms
    return norms_by_topic


def main():
    batch = load_json(BATCH_RESULT)
    actions = batch.get("actions", [])

    topic_files = collect_topic_files()
    topic_to_rel = {tid: rel for tid, rel in topic_files}
    file_data_by_topic = {}
    for tid, rel in topic_files:
        path = ROOT / rel
        if path.exists():
            file_data_by_topic[tid] = load_json(path)

    norms_by_topic = build_indices(file_data_by_topic)
    removals = []
    changed_topics = set()

    for action in actions:
        if action.get("action") not in {"move_to_target", "remove_source_duplicate"}:
            continue
        src_topic = action.get("source_topic")
        src_sub = action.get("source_subcategory")
        tgt_topic = action.get("target_topic")
        qid = action.get("question_id")
        if not src_topic or not src_sub or not tgt_topic or not qid:
            continue
        src_data = file_data_by_topic.get(src_topic)
        if not src_data:
            continue

        for sub in src_data.get("subcategories", []):
            if not isinstance(sub, dict) or sub.get("id") != src_sub:
                continue
            qlist, nested = iterate_subcategory_questions(sub)
            remove_idx = None
            for i, q in enumerate(qlist):
                if not isinstance(q, dict):
                    continue
                if str(q.get("id", "")).strip() != qid:
                    continue
                norm = normalize_text(str(q.get("question", "")))
                if norm and norm in norms_by_topic.get(tgt_topic, set()):
                    remove_idx = i
                    break
            if remove_idx is not None:
                qobj = qlist[remove_idx]
                filtered = [q for i, q in enumerate(qlist) if i != remove_idx]
                if nested:
                    sub["questions"][0][src_sub] = filtered
                else:
                    sub["questions"] = filtered
                removals.append(
                    {
                        "question_id": qid,
                        "source_topic": src_topic,
                        "source_subcategory": src_sub,
                        "target_topic": tgt_topic,
                        "question": qobj.get("question", ""),
                    }
                )
                changed_topics.add(src_topic)
            break

    changed_files = []
    for topic_id in sorted(changed_topics):
        rel = topic_to_rel.get(topic_id)
        if not rel:
            continue
        dump_json(ROOT / rel, file_data_by_topic[topic_id])
        changed_files.append(rel)

    result = {
        "summary": {
            "removed_leftovers": len(removals),
            "files_changed": len(changed_files),
        },
        "changed_files": changed_files,
        "removals": removals,
    }
    dump_json(OUT_JSON, result)
    print(json.dumps(result["summary"], indent=2))
    print(f"result: {OUT_JSON}")


if __name__ == "__main__":
    main()
