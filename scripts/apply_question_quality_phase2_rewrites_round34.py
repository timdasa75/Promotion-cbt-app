#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 34."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round34.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round34.md"

REWRITES = {
    "csh_ap_140": {
        "question": "Why should the chair of an official meeting arrive promptly and start the session on time?",
        "options": [
            "To encourage members to take the meeting and its objectives seriously.",
            "To show that the chair is more important than the members.",
            "To rush participants into decisions before discussion begins.",
            "To shorten the meeting regardless of whether the agenda is covered.",
        ],
        "correct": 0,
        "explanation": "Punctual chairmanship signals that the meeting matters and that the agenda should be taken seriously. Starting on time helps set order, discipline, and respect for the meeting's objectives.",
        "keywords": ["meeting_chairmanship", "punctual_start", "meeting_discipline", "official_meetings"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "meeting_chairmanship", "punctual_start", "official_meetings"],
    },
    "csh_ap_141": {
        "question": "What is the main purpose of the 'Action Points' section in meeting minutes?",
        "options": [
            "To identify who is responsible for each action, what must be done, and the time for completion.",
            "To list the members who spoke most during the meeting.",
            "To restate every issue that was left unresolved without assigning responsibility.",
            "To reproduce the attendance register at the end of the minutes.",
        ],
        "correct": 0,
        "explanation": "The 'Action Points' section tracks accountability after the meeting. It should show the responsible person, the action required, and the completion timeframe so follow-up is clear.",
        "keywords": ["action_points", "meeting_minutes", "responsibility_tracking", "follow_up_deadlines"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "action_points", "meeting_minutes", "responsibility_tracking"],
    },
    "csh_ap_142": {
        "question": "Which detail should be recorded under the 'Action Points' section of meeting minutes?",
        "options": [
            "The officer responsible, the action agreed, and the deadline for completion.",
            "Only the names of members who supported the motion.",
            "A summary of informal comments made before the meeting opened.",
            "The seating arrangement used during the meeting.",
        ],
        "correct": 0,
        "explanation": "Action points are useful only when they show who will do what and by when. Recording the responsible officer, agreed action, and deadline turns discussion into accountable follow-up.",
        "keywords": ["action_points_detail", "responsible_officer", "deadline_tracking", "meeting_follow_up"],
        "tags": ["civil_service_admin", "csh_administrative_procedures", "action_points_detail", "responsible_officer", "meeting_follow_up"],
    },
    "ppa_objectives_057": {
        "question": "At the start of a procurement committee meeting, which practice best reinforces seriousness and procedural order?",
        "options": [
            "Open the meeting at the scheduled time and restate the agenda and purpose clearly.",
            "Delay the meeting until informal side discussions have ended naturally.",
            "Begin decisions before confirming the agenda so time is not wasted.",
            "Treat punctuality as optional if senior members have not yet arrived.",
        ],
        "correct": 0,
        "explanation": "A procurement committee meeting is more orderly when the chair opens on time and restates the agenda and purpose. That signals seriousness, reinforces procedure, and helps members focus on the decisions before them.",
        "keywords": ["procurement_committee", "meeting_order", "agenda_discipline", "procedural_order"],
        "tags": ["procurement_act", "proc_objectives_institutions", "procurement_committee", "meeting_order", "agenda_discipline"],
    },
    "pol_public_sector_planning_gen_002": {
        "question": "Which practice best strengthens compliance during public sector planning?",
        "options": [
            "Use approved planning procedures, document assumptions, and record each approval stage clearly.",
            "Allow urgent priorities to bypass the normal approval trail without explanation.",
            "Revise planning targets informally without updating the working record.",
            "Treat statutory and budget constraints as issues to review after rollout begins.",
        ],
        "correct": 0,
        "explanation": "Planning compliance depends on using approved procedures, documenting assumptions, and keeping a clear record of each approval stage. Those controls show that the plan was developed lawfully and transparently.",
        "keywords": ["planning_compliance", "approval_trail", "planning_assumptions", "public_sector_planning"],
        "tags": ["policy_analysis", "pol_public_sector_planning", "planning_compliance", "approval_trail", "planning_assumptions"],
    },
    "pol_public_sector_planning_gen_037": {
        "question": "Which governance practice best strengthens oversight of a public sector planning process?",
        "options": [
            "Assign review responsibility, keep a version history, and log why major planning changes were approved.",
            "Let each unit revise the draft independently without a shared control record.",
            "Treat governance review as unnecessary once an initial draft has been prepared.",
            "Accept planning changes verbally whenever senior officers agree in principle.",
        ],
        "correct": 0,
        "explanation": "Planning governance is stronger when review responsibility is assigned, a version history is maintained, and major changes are logged with reasons for approval. That creates oversight and traceability throughout the planning process.",
        "keywords": ["planning_governance", "version_history", "review_responsibility", "change_log"],
        "tags": ["policy_analysis", "pol_public_sector_planning", "planning_governance", "version_history", "review_responsibility"],
    },
    "clg_gc_088": {
        "question": "Under PSR Rule 120226, which type of study leave allows an officer to continue receiving salary while studying?",
        "options": [
            "Sabbatical leave.",
            "Leave of absence.",
            "Study leave with pay.",
            "Proportionate leave.",
        ],
        "correct": 2,
        "explanation": "PSR Rule 120226 lists study leave with pay as one of the recognized forms of study leave. It is the option that allows the officer to continue receiving salary during the approved study period.",
        "keywords": ["study_leave_with_pay", "psr_120226", "staff_development", "salary_continuation"],
        "tags": ["psr", "psr_general_admin", "study_leave_with_pay", "psr_120226", "staff_development"],
    },
    "ict_li_065": {
        "question": "Under PSR Rule 120226, which type of study leave does not carry salary during the approved study period?",
        "options": [
            "Sabbatical leave.",
            "Leave of absence.",
            "Study leave without pay.",
            "Proportionate leave.",
        ],
        "correct": 2,
        "explanation": "PSR Rule 120226 recognizes study leave without pay as one of the three types of study leave. It is the form granted when the officer is approved to study without continuing salary during that period.",
        "keywords": ["study_leave_without_pay", "psr_120226", "staff_development", "unpaid_study_leave"],
        "tags": ["psr", "psr_general_admin", "study_leave_without_pay", "psr_120226", "staff_development"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 34",
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
    payload = {"round": 34, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
