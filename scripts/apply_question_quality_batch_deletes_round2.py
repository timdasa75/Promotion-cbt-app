#!/usr/bin/env python3
"""Apply the second curated Batch 1 question deletions and log the removals."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
ASSESSMENT_FILE = ROOT / "docs" / "question_quality_assessment.json"
QUEUE_FILE = ROOT / "docs" / "question_quality_batch1_queue.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_deletes_round2.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_deletes_round2.md"


@dataclass(frozen=True)
class DeleteSpec:
    question_id: str
    source_topic: str
    source_subcategory: str


DELETE_SPECS = [
    DeleteSpec("csh_ap_083", "civil_service_admin", "csh_administrative_procedures"),
    DeleteSpec("csh_ap_084", "civil_service_admin", "csh_administrative_procedures"),
    DeleteSpec("csh_it_055", "civil_service_admin", "csh_innovation_technology"),
    DeleteSpec("csh_principle_059", "civil_service_admin", "csh_principles_ethics"),
    DeleteSpec("csh_sdg_052", "civil_service_admin", "csh_service_delivery_grievance"),
    DeleteSpec("ethics_086", "civil_service_admin", "eth_values_integrity"),
    DeleteSpec("FOI_AO_059", "constitutional_law", "foi_access_obligations"),
    DeleteSpec("FOI_OP_056", "constitutional_law", "foi_offences_penalties"),
    DeleteSpec("PSIR_102", "general_current_affairs", "ca_public_service_reforms"),
    DeleteSpec("ict_sec_082", "ict_management", "ict_security"),
    DeleteSpec("ict_sec_083", "ict_management", "ict_security"),
    DeleteSpec("ict_sec_098", "ict_management", "ict_security"),
    DeleteSpec("leadership_smp_072", "leadership_management", "lead_strategic_management"),
    DeleteSpec("pol_analysis_methods_gen_080", "policy_analysis", "pol_analysis_methods"),
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = list(payload.get("applied", []))
    lines = [
        "# Question Quality Batch 1 Applied Deletes Round 2",
        "",
        f"- Applied deletes: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(f"- `{item['question_id']}` [{item['source_topic']}/{item['source_subcategory']}]")
        lines.append(f"  - {item['question']}")
        if item.get("issue_types"):
            lines.append(f"  - Issues: {', '.join(item['issue_types'])}")
        if item.get("rationale"):
            lines.append(f"  - Reason: {' | '.join(item['rationale'])}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_topic_maps(root: Path):
    topics_doc = load_json(TOPICS_FILE)
    topic_paths = {}
    topic_docs = {}
    topic_names = {}
    subcategory_refs = {}

    for topic in topics_doc.get("topics", []):
        if not isinstance(topic, dict):
            continue
        topic_id = str(topic.get("id") or "").strip()
        if not topic_id:
            continue
        topic_names[topic_id] = str(topic.get("name") or topic_id).strip()
        path = root / str(topic.get("file") or "")
        topic_paths[topic_id] = path
        doc = load_json(path)
        topic_docs[topic_id] = doc
        for subcategory in doc.get("subcategories", []) if isinstance(doc, dict) else []:
            if not isinstance(subcategory, dict):
                continue
            sub_id = str(subcategory.get("id") or "").strip()
            if sub_id:
                subcategory_refs[(topic_id, sub_id)] = subcategory

    return topic_docs, topic_paths, topic_names, subcategory_refs


def build_issue_lookup():
    lookup = {}
    if ASSESSMENT_FILE.exists():
        assessment = load_json(ASSESSMENT_FILE)
        for item in assessment.get("items", []):
            question_id = str(item.get("question_id") or "").strip()
            if question_id:
                lookup[question_id] = item
    return lookup


def build_queue_lookup():
    lookup = {}
    if QUEUE_FILE.exists():
        queue = load_json(QUEUE_FILE)
        for item in queue.get("groups", {}).get("delete", {}).get("items", []):
            question_id = str(item.get("question_id") or "").strip()
            if question_id:
                lookup[question_id] = item
    return lookup


def apply_deletes(root: Path):
    topic_docs, topic_paths, topic_names, subcategory_refs = build_topic_maps(root)
    issue_lookup = build_issue_lookup()
    queue_lookup = build_queue_lookup()
    applied = []

    for spec in DELETE_SPECS:
        subcategory = subcategory_refs[(spec.source_topic, spec.source_subcategory)]
        questions = subcategory.get("questions")
        if not isinstance(questions, list):
            raise SystemExit(f"Questions missing for {spec.source_topic}/{spec.source_subcategory}")

        question_index = None
        question = None
        for index, candidate in enumerate(questions):
            if isinstance(candidate, dict) and str(candidate.get("id") or "").strip() == spec.question_id:
                question_index = index
                question = candidate
                break
        if question_index is None or question is None:
            raise SystemExit(
                f"Question {spec.question_id} not found in {spec.source_topic}/{spec.source_subcategory}"
            )

        queue_item = queue_lookup.get(spec.question_id, {})
        assessment_item = issue_lookup.get(spec.question_id, {})
        rationale = queue_item.get("rationale") or assessment_item.get("rationale") or []
        issue_types = queue_item.get("issue_types") or assessment_item.get("issue_types") or []

        applied.append(
            {
                "question_id": spec.question_id,
                "source_topic": spec.source_topic,
                "source_topic_name": topic_names.get(spec.source_topic, spec.source_topic),
                "source_subcategory": spec.source_subcategory,
                "source_file": str(topic_paths[spec.source_topic].relative_to(root)).replace("\\", "/"),
                "question": str(question.get("question") or "").strip(),
                "issue_types": issue_types,
                "rationale": rationale,
                "recommended_action": "delete",
            }
        )

        del questions[question_index]

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
    applied = apply_deletes(args.root)
    payload = {"applied": applied}
    args.log_out.parent.mkdir(parents=True, exist_ok=True)
    save_json(args.log_out, payload)
    write_markdown(args.markdown_out, payload)
    print(json.dumps({"applied_deletes": len(applied), "question_ids": [item['question_id'] for item in applied]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
