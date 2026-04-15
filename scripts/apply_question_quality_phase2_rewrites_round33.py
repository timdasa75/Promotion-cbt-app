#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 33."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round33.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round33.md"

REWRITES = {
    "lead_management_performance_gen_013": {
        "question": "A department is introducing a new performance-review process. Which step best supports orderly change management?",
        "options": [
            "Phase the rollout, brief supervisors, and monitor adoption against clear milestones.",
            "Launch the new process immediately without clarifying roles or timelines.",
            "Treat early staff concerns as resistance that does not need follow-up.",
            "Allow each unit to interpret the reform independently without oversight.",
        ],
        "explanation": "Change management is stronger when a new performance-review process is phased, roles are clarified, and adoption is tracked against clear milestones. Those controls reduce confusion and help managers correct implementation gaps early.",
        "keywords": ["performance_review_reform", "change_management", "rollout_milestones", "supervisory_briefing"],
        "tags": ["leadership_management", "lead_management_performance", "performance_review_reform", "change_management", "rollout_milestones"],
    },
    "lead_management_performance_gen_023": {
        "question": "Which recordkeeping practice best supports fair performance assessment across a department?",
        "options": [
            "Keep current appraisal evidence, feedback notes, and agreed targets in a traceable file for each officer.",
            "Rely on memory at the end of the review cycle instead of maintaining current records.",
            "Store only positive examples and discard records that show performance gaps.",
            "Let each supervisor keep performance notes in whatever format is most convenient.",
        ],
        "explanation": "Fair performance assessment depends on current, traceable records of targets, feedback, and supporting evidence. A consistent file for each officer allows supervisors to review performance against documented expectations rather than memory or preference.",
        "keywords": ["performance_records", "appraisal_evidence", "feedback_notes", "traceable_files"],
        "tags": ["leadership_management", "lead_management_performance", "performance_records", "appraisal_evidence", "traceable_files"],
    },
    "lead_principles_styles_gen_008": {
        "question": "Which leadership approach best helps officers accept an important operational change?",
        "options": [
            "Explain the reason for the change, clarify expectations, and support staff through feedback and coaching.",
            "Announce the decision once and treat further questions as a lack of loyalty.",
            "Apply the new expectations selectively to officers the leader already trusts.",
            "Delay clarification until mistakes occur so staff learn through trial and error.",
        ],
        "explanation": "Leadership change is more likely to succeed when the leader explains the reason for the change, clarifies expectations, and supports staff through feedback and coaching. That combination helps officers understand both the purpose and the practical implications of the new direction.",
        "keywords": ["leadership_change", "expectation_clarity", "feedback", "coaching_support"],
        "tags": ["leadership_management", "lead_principles_styles", "leadership_change", "expectation_clarity", "coaching_support"],
    },
    "lead_principles_styles_gen_018": {
        "question": "Which leadership habit best strengthens record discipline in a unit?",
        "options": [
            "Require decisions, assigned actions, and follow-up dates to be documented and reviewed consistently.",
            "Treat documentation as optional whenever senior officers already know what was agreed.",
            "Allow action owners to keep private notes instead of maintaining shared records.",
            "Update records only when a dispute has already exposed a gap in the file.",
        ],
        "explanation": "Record discipline improves when leaders require decisions, action owners, and follow-up dates to be documented and reviewed consistently. That habit makes the unit's work traceable and reduces confusion about what was agreed or who is responsible.",
        "keywords": ["record_discipline", "documented_actions", "follow_up_dates", "leadership_habits"],
        "tags": ["leadership_management", "lead_principles_styles", "record_discipline", "documented_actions", "leadership_habits"],
    },
    "lead_strategic_management_gen_009": {
        "question": "When a ministry begins implementing a new strategic plan, which step best supports change management?",
        "options": [
            "Phase the transition, assign implementation owners, and track risks against the plan's milestones.",
            "Issue the strategic plan once and assume units will adjust their work without coordination.",
            "Change reporting expectations repeatedly without recording why the plan is shifting.",
            "Leave transition risks unmanaged until performance data shows a major failure.",
        ],
        "explanation": "Strategic-plan change is easier to manage when the transition is phased, implementation owners are assigned, and risks are tracked against the plan's milestones. Those controls help leaders see where the strategy is slipping and intervene early.",
        "keywords": ["strategic_plan_rollout", "transition_management", "implementation_owners", "milestone_risks"],
        "tags": ["leadership_management", "lead_strategic_management", "strategic_plan_rollout", "implementation_owners", "milestone_risks"],
    },
    "lead_strategic_management_gen_019": {
        "question": "Which recordkeeping practice best strengthens strategic management and planning?",
        "options": [
            "Maintain a current record of planning assumptions, approvals, performance baselines, and review decisions.",
            "Keep only the final strategy document and discard the reasoning behind key planning choices.",
            "Allow each unit to store planning revisions without a shared version history.",
            "Update strategic records only after an external review has already identified gaps.",
        ],
        "explanation": "Strategic management is stronger when planning assumptions, approvals, baselines, and review decisions are kept in a current, traceable record. That allows leaders to explain how the strategy developed and assess whether delivery remains aligned with the original plan.",
        "keywords": ["strategic_records", "planning_assumptions", "performance_baselines", "review_decisions"],
        "tags": ["leadership_management", "lead_strategic_management", "strategic_records", "planning_assumptions", "performance_baselines"],
    },
    "leadership_smp_074": {
        "question": "Which document is used for internal communication within the same department or ministry?",
        "options": [
            "An official letter.",
            "A confidential report.",
            "A personal conversation note.",
            "A memorandum.",
        ],
        "correct": 3,
        "explanation": "A memorandum is used for internal communication within the same department or ministry. It is the standard format for sharing instructions, requests, or information inside the organisation, while an official letter is typically used for communication outside that internal structure.",
        "keywords": ["memorandum", "internal_communication", "departmental_correspondence", "official_documents"],
        "tags": ["leadership_management", "lead_strategic_management", "memorandum", "internal_communication", "official_documents"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 33",
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
                    question["lastReviewed"] = "2026-04-04"
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
    payload = {"round": 33, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
