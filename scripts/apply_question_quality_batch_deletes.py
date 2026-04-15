#!/usr/bin/env python3
"""Apply the current curated Batch 1 question deletions and log the removals."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
ASSESSMENT_FILE = ROOT / "docs" / "question_quality_assessment.json"
QUEUE_FILE = ROOT / "docs" / "question_quality_batch1_queue.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_deletes.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_deletes.md"


@dataclass(frozen=True)
class DeleteSpec:
    question_id: str
    source_topic: str
    source_subcategory: str


DELETE_SPECS = [
    DeleteSpec("FOI_EX_060", "constitutional_law", "foi_exemptions_public_interest"),
    DeleteSpec("psr_admin_062", "psr", "psr_general_admin"),
    DeleteSpec("csh_ap_076", "civil_service_admin", "csh_administrative_procedures"),
    DeleteSpec("csh_disc_065", "civil_service_admin", "csh_discipline_conduct"),
    DeleteSpec("csh_disc_071", "civil_service_admin", "csh_discipline_conduct"),
    DeleteSpec("csh_principle_065", "civil_service_admin", "csh_principles_ethics"),
    DeleteSpec("csh_pt_075", "civil_service_admin", "csh_performance_training"),
    DeleteSpec("eth_code_conduct_gen_064", "civil_service_admin", "eth_code_conduct"),
    DeleteSpec("FOI_OP_051", "constitutional_law", "foi_offences_penalties"),
    DeleteSpec("FOI_OP_073", "constitutional_law", "foi_offences_penalties"),
    DeleteSpec("ict_eg_095", "ict_management", "ict_e_governance"),
    DeleteSpec("ict_f_084", "ict_management", "ict_fundamentals"),
    DeleteSpec("leadership_smp_064", "leadership_management", "lead_strategic_management"),
    DeleteSpec("policy_constitution_071", "policy_analysis", "pol_formulation_cycle"),
    DeleteSpec("ppa_bid_059", "procurement_act", "proc_bidding_evaluation"),
    DeleteSpec("ppa_ethic_057", "procurement_act", "proc_transparency_ethics"),
    DeleteSpec("psr_allow_062", "psr", "psr_allowances"),
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = list(payload.get("applied", []))
    lines = [
        "# Question Quality Batch 1 Applied Deletes",
        "",
        f"- Applied deletes: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(
            f"- `{item['question_id']}` [{item['source_topic']}/{item['source_subcategory']}]"
        )
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
            if not sub_id:
                continue
            subcategory_refs[(topic_id, sub_id)] = subcategory

    return topic_docs, topic_paths, topic_names, subcategory_refs


def build_issue_lookup():
    lookup = {}
    if ASSESSMENT_FILE.exists():
        assessment = load_json(ASSESSMENT_FILE)
        for item in assessment.get("flagged_questions", []):
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
    print(json.dumps({"applied_deletes": len(applied), "deletes": applied}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
