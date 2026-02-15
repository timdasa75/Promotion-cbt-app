#!/usr/bin/env python3
"""
Semi-automatic processing of relevance review queue.

Strategy:
- Read docs/relevance_review_queue.json
- For items above threshold and with explicit target-topic signal:
  - If equivalent question already exists in target topic: remove from source.
  - Else: move question from source to a target fallback subcategory.

This preserves coverage while reducing topic mismatch.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
QUEUE_FILE = ROOT / "docs" / "relevance_review_queue.json"
OUT_JSON = ROOT / "docs" / "relevance_queue_batch_result.json"
OUT_MD = ROOT / "docs" / "relevance_queue_batch_result.md"


TARGET_SUBCATEGORY_DEFAULT = {
    "psr": "psr_general_admin",
    "financial_regulations": "fin_general",
    "procurement_act": "proc_objectives_institutions",
    "constitutional_law": "clg_general_competency",
    "civil_service_admin": "csh_administrative_procedures",
    "leadership_management": "lead_management_performance",
    "ict_management": "ict_fundamentals",
    "policy_analysis": "pol_analysis_methods",
    "general_current_affairs": "ca_general",
    "competency_framework": "comp_verbal_reasoning",
}


TARGET_SIGNAL_PATTERNS = {
    "psr": re.compile(r"\b(psr|public service rules|rule\s*\d{3,6}|federal civil service commission|gl\.?\s*\d+)\b", re.I),
    "financial_regulations": re.compile(r"\b(financial regulations|vote book|virement|appropriation|imprest|warrant|gifmis|treasury)\b", re.I),
    "procurement_act": re.compile(r"\b(public procurement act|procurement|bpp|certificate of no objection|bid opening|procuring entit)\b", re.I),
    "constitutional_law": re.compile(r"\b(constitution|foi|freedom of information|constitutional|statutory)\b", re.I),
    "civil_service_admin": re.compile(r"\b(civil service handbook|grievance|misconduct|code of conduct|integrity)\b", re.I),
    "leadership_management": re.compile(r"\b(leadership|strategic management|negotiation|dispute resolution)\b", re.I),
    "ict_management": re.compile(r"\b(ict|digital|cyber|e-?governance|ssl|tls)\b", re.I),
    "policy_analysis": re.compile(r"\b(policy formulation|policy analysis|policy implementation|evaluation)\b", re.I),
    "general_current_affairs": re.compile(r"\b(current affairs|recent|news|today|international)\b", re.I),
    "competency_framework": re.compile(r"\b(numerical|verbal|analytical reasoning|comprehension|aptitude)\b", re.I),
}


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


def iterate_subcategory_questions(subcategory: dict):
    questions = subcategory.get("questions")
    if not isinstance(questions, list):
        return [], False
    sub_id = subcategory.get("id")
    if questions and isinstance(questions[0], dict) and sub_id and isinstance(questions[0].get(sub_id), list):
        return questions[0][sub_id], True
    return questions, False


def load_topic_data():
    file_data = {}
    topic_to_file = {}
    topic_to_subcats = defaultdict(dict)
    question_lookup = {}
    norms_by_topic = defaultdict(set)

    for topic in collect_topic_files():
        tid = topic["topic_id"]
        rel = topic["file"]
        path = ROOT / rel
        if not path.exists():
            continue
        data = load_json(path)
        file_data[rel] = data
        topic_to_file[tid] = rel
        subcats = data.get("subcategories", []) if isinstance(data, dict) else []
        for sub in subcats:
            if not isinstance(sub, dict):
                continue
            sid = sub.get("id", "")
            qlist, nested = iterate_subcategory_questions(sub)
            topic_to_subcats[tid][sid] = {"sub_obj": sub, "nested": nested}
            for idx, q in enumerate(qlist):
                if not isinstance(q, dict):
                    continue
                qid = str(q.get("id", "")).strip()
                qtxt = str(q.get("question", "")).strip()
                norm = normalize_text(qtxt)
                question_lookup[(tid, sid, qid)] = {
                    "file": rel,
                    "index": idx,
                    "nested": nested,
                    "sub_id": sid,
                    "question": q,
                    "norm": norm,
                }
                if norm:
                    norms_by_topic[tid].add(norm)

    return file_data, topic_to_file, topic_to_subcats, question_lookup, norms_by_topic


def has_target_signal(text: str, target_topic: str) -> bool:
    pattern = TARGET_SIGNAL_PATTERNS.get(target_topic)
    if not pattern:
        return False
    return bool(pattern.search(text or ""))


def append_question_to_target(topic_to_subcats, target_topic, question_obj):
    target_sub = TARGET_SUBCATEGORY_DEFAULT.get(target_topic)
    if not target_sub or target_sub not in topic_to_subcats[target_topic]:
        return False
    sub_info = topic_to_subcats[target_topic][target_sub]
    sub_obj = sub_info["sub_obj"]
    nested = sub_info["nested"]
    qlist, _ = iterate_subcategory_questions(sub_obj)
    if nested:
        sub_obj["questions"][0][target_sub].append(question_obj)
    else:
        sub_obj["questions"].append(question_obj)
    return True


def remove_question_from_source(topic_to_subcats, source_topic, source_subcategory, index):
    if source_subcategory not in topic_to_subcats[source_topic]:
        return False
    sub_info = topic_to_subcats[source_topic][source_subcategory]
    sub_obj = sub_info["sub_obj"]
    nested = sub_info["nested"]
    qlist, _ = iterate_subcategory_questions(sub_obj)
    if index < 0 or index >= len(qlist):
        return False
    filtered = [q for i, q in enumerate(qlist) if i != index]
    if nested:
        sub_obj["questions"][0][source_subcategory] = filtered
    else:
        sub_obj["questions"] = filtered
    return True


def process_queue(min_score: int = 4, require_signal: bool = True, apply: bool = False):
    queue_doc = load_json(QUEUE_FILE)
    items = queue_doc.get("items", [])

    (
        file_data,
        topic_to_file,
        topic_to_subcats,
        question_lookup,
        norms_by_topic,
    ) = load_topic_data()

    actions = []
    changed_files = set()

    # Sort descending by confidence.
    items = sorted(items, key=lambda x: x.get("scores", {}).get("best_other", 0), reverse=True)

    for item in items:
        src_topic = item.get("source_topic")
        src_sub = item.get("source_subcategory")
        qid = item.get("question_id")
        target_topic = item.get("suggested_target_topic")
        score = int(item.get("scores", {}).get("best_other", 0))
        qtext = item.get("question", "")
        norm = normalize_text(qtext)

        if not src_topic or not src_sub or not qid or not target_topic:
            continue
        if score < min_score:
            continue
        if require_signal and not has_target_signal(qtext, target_topic):
            continue

        loc = question_lookup.get((src_topic, src_sub, qid))
        if not loc:
            continue

        if norm and norm in norms_by_topic.get(target_topic, set()):
            action = "remove_source_duplicate"
            if apply:
                ok = remove_question_from_source(topic_to_subcats, src_topic, src_sub, loc["index"])
                if ok:
                    changed_files.add(topic_to_file[src_topic])
            actions.append(
                {
                    "action": action,
                    "question_id": qid,
                    "source_topic": src_topic,
                    "source_subcategory": src_sub,
                    "target_topic": target_topic,
                    "reason": "equivalent_exists_in_target_topic",
                }
            )
            continue

        action = "move_to_target"
        if apply:
            moved_in = append_question_to_target(topic_to_subcats, target_topic, loc["question"])
            removed = remove_question_from_source(topic_to_subcats, src_topic, src_sub, loc["index"])
            if moved_in and removed:
                changed_files.add(topic_to_file[src_topic])
                changed_files.add(topic_to_file[target_topic])
                if norm:
                    norms_by_topic[target_topic].add(norm)
            else:
                action = "skipped_move_failed"

        actions.append(
            {
                "action": action,
                "question_id": qid,
                "source_topic": src_topic,
                "source_subcategory": src_sub,
                "target_topic": target_topic,
                "reason": "high_confidence_signal_matched",
            }
        )

    if apply and changed_files:
        for rel in changed_files:
            dump_json(ROOT / rel, file_data[rel])

    return actions, sorted(changed_files)


def write_outputs(actions: List[dict], changed_files: List[str], apply: bool):
    summary = {
        "processed_actions": len(actions),
        "moved": sum(1 for a in actions if a["action"] == "move_to_target"),
        "removed_source_duplicates": sum(1 for a in actions if a["action"] == "remove_source_duplicate"),
        "skipped_move_failed": sum(1 for a in actions if a["action"] == "skipped_move_failed"),
        "files_changed": len(changed_files),
        "applied": bool(apply),
    }
    payload = {"summary": summary, "changed_files": changed_files, "actions": actions}
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = []
    lines.append("# Relevance Queue Batch Result")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Processed actions: **{summary['processed_actions']}**")
    lines.append(f"- Moved to target: **{summary['moved']}**")
    lines.append(f"- Removed source duplicates (target already had copy): **{summary['removed_source_duplicates']}**")
    lines.append(f"- Files changed: **{summary['files_changed']}**")
    lines.append(f"- Applied: **{summary['applied']}**")
    lines.append("")
    lines.append("## Actions")
    if not actions:
        lines.append("- None")
    else:
        for a in actions:
            lines.append(
                f"- `{a['question_id']}`: {a['action']} ({a['source_topic']}/{a['source_subcategory']} -> {a['target_topic']})"
            )
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("Relevance queue batch complete")
    print(json.dumps(summary, indent=2))
    print(f"JSON: {OUT_JSON}")
    print(f"MD: {OUT_MD}")


def main():
    parser = argparse.ArgumentParser(description="Process relevance review queue in semi-automatic batches")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--min-score", type=int, default=4)
    parser.add_argument("--no-signal", action="store_true", help="Do not require explicit target signal")
    args = parser.parse_args()

    actions, changed_files = process_queue(
        min_score=args.min_score,
        require_signal=not args.no_signal,
        apply=args.apply,
    )
    write_outputs(actions, changed_files, apply=args.apply)


if __name__ == "__main__":
    main()
