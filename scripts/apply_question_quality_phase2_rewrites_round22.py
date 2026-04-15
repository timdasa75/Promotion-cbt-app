#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 22."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round22.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round22.md"

REWRITES = {
    "neg_structure_bodies_gen_002": {
        "question": "When constituting a negotiating body, which step best strengthens compliance from the outset?",
        "options": [
            "Approve a clear mandate, lawful membership criteria, and documented terms of reference.",
            "Allow informal appointments without verifying roles or authority.",
            "Change membership rules midway without recording the reason.",
            "Treat procedural requirements as optional if the parties seem cooperative.",
        ],
        "explanation": "Compliance is strongest when the negotiating body begins with a clear mandate, lawful membership criteria, and documented terms of reference. Those controls define who may act and on what authority.",
        "keywords": ["negotiating_body_compliance", "terms_of_reference", "lawful_membership", "mandate"],
        "tags": ["leadership_management", "neg_structure_bodies", "negotiating_body_compliance", "terms_of_reference", "mandate"],
    },
    "neg_structure_bodies_gen_007": {
        "question": "A ministry is restructuring its negotiating committees. Which step best supports orderly change management?",
        "options": [
            "Stage the transition with role clarification, communication, and implementation monitoring.",
            "Announce the new structure abruptly and expect members to adjust on their own.",
            "Ignore how reporting lines will change until disputes arise.",
            "Merge committees immediately without briefing affected officers.",
        ],
        "explanation": "Change management is stronger when restructuring is staged, roles are clarified, and the transition is supported with communication and monitoring. That reduces confusion and keeps the body functional during the change.",
        "keywords": ["committee_restructuring", "change_management", "role_clarity", "transition_monitoring"],
        "tags": ["leadership_management", "neg_structure_bodies", "committee_restructuring", "change_management", "role_clarity"],
    },
    "neg_structure_bodies_gen_017": {
        "question": "Which recordkeeping practice best preserves continuity when negotiating-body membership changes?",
        "options": [
            "Maintain current minutes, action logs, and decision records that incoming members can review.",
            "Rely on verbal briefings and personal memory instead of maintaining formal records.",
            "Archive unresolved issues without linking them to prior decisions.",
            "Limit access to prior records even when new members need them for continuity.",
        ],
        "explanation": "Continuity depends on accurate minutes, action logs, and decision records that incoming members can review. Those records carry the body's institutional memory across membership changes.",
        "keywords": ["membership_transition", "minutes", "action_logs", "institutional_memory"],
        "tags": ["leadership_management", "neg_structure_bodies", "membership_transition", "action_logs", "institutional_memory"],
    },
    "neg_structure_bodies_gen_025": {
        "question": "Which practice best helps a negotiating body coordinate the work of its main committee and technical subcommittees?",
        "options": [
            "Define reporting lines, escalation points, and a common review timetable for all units.",
            "Let each subcommittee interpret priorities independently without a shared reporting structure.",
            "Allow unresolved issues to remain with whichever group discussed them last.",
            "Schedule meetings only when conflict has already disrupted the process.",
        ],
        "explanation": "Coordination improves when reporting lines, escalation points, and review timetables are defined across the main committee and its subcommittees. That keeps related workstreams aligned and accountable.",
        "keywords": ["committee_coordination", "subcommittees", "reporting_lines", "review_timetable"],
        "tags": ["leadership_management", "neg_structure_bodies", "committee_coordination", "subcommittees", "reporting_lines"],
    },
    "neg_structure_bodies_gen_035": {
        "question": "Which routine best preserves accountability for decisions made by a negotiating body?",
        "options": [
            "Record each decision with its rationale, responsible officer, and follow-up deadline.",
            "Close agenda items once discussed, even if no owner or deadline has been assigned.",
            "Treat informal understandings as sufficient once senior members agree verbally.",
            "Separate action tracking from decision records so each unit can manage its own version.",
        ],
        "explanation": "Accountability is preserved when each decision is recorded with its rationale, responsible officer, and follow-up deadline. That makes later review and implementation tracking possible.",
        "keywords": ["decision_accountability", "action_owners", "follow_up_deadlines", "decision_rationale"],
        "tags": ["leadership_management", "neg_structure_bodies", "decision_accountability", "action_owners", "follow_up_deadlines"],
    },
    "neg_structure_bodies_gen_037": {
        "question": "Which governance safeguard most strengthens oversight of a negotiating body?",
        "options": [
            "Use an approved charter that sets quorum, reporting obligations, and review responsibilities.",
            "Allow the body to change its procedures informally whenever meetings become difficult.",
            "Leave oversight expectations to personal judgment instead of defining them formally.",
            "Treat attendance and reporting as optional when senior officials are present.",
        ],
        "explanation": "Oversight is strongest when the negotiating body operates under an approved charter that defines quorum, reporting obligations, and review responsibilities. Those rules create a stable governance framework.",
        "keywords": ["governance_safeguard", "approved_charter", "quorum", "oversight_framework"],
        "tags": ["leadership_management", "neg_structure_bodies", "governance_safeguard", "approved_charter", "quorum"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 22",
        "",
        f"- Applied rewrites: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(f"- `{item['question_id']}` [{item['source_file']}]")
        lines.append(f"  - Old: {item['old_question']}")
        lines.append(f"  - New: {item['new_question']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def find_topic_files(root: Path):
    topics = load_json(TOPICS_FILE)
    mapping = {}
    for topic in topics.get("topics", []):
        topic_file = root / str(topic.get("file") or "")
        mapping[str(topic.get("id") or "").strip()] = topic_file
    return mapping


def apply_rewrites(root: Path):
    topic_files = find_topic_files(root)
    docs = {topic: load_json(path) for topic, path in topic_files.items() if path.exists()}
    applied = []

    for question_id, patch in REWRITES.items():
        found = False
        for topic_id, doc in docs.items():
            for subcategory in doc.get("subcategories", []):
                for question in safe_get_questions(subcategory):
                    if question.get("id") != question_id:
                        continue
                    old_question = question.get("question", "")
                    question.update(patch)
                    question["lastReviewed"] = "2026-04-03"
                    applied.append(
                        {
                            "question_id": question_id,
                            "source_topic": topic_id,
                            "source_subcategory": subcategory.get("id"),
                            "source_file": str(topic_files[topic_id].relative_to(root)).replace("\\", "/"),
                            "old_question": old_question,
                            "new_question": question.get("question", ""),
                        }
                    )
                    found = True
                    break
                if found:
                    break
            if found:
                break
        if not found:
            raise SystemExit(f"Question {question_id} not found")

    for topic_id, doc in docs.items():
        save_json(topic_files[topic_id], doc)

    return applied


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--log-json", type=Path, default=DEFAULT_LOG_JSON)
    parser.add_argument("--log-md", type=Path, default=DEFAULT_LOG_MD)
    return parser.parse_args()


def main():
    args = parse_args()
    applied = apply_rewrites(ROOT)
    payload = {"round": 22, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
