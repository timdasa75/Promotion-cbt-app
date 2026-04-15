#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 31."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round31.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round31.md"

REWRITES = {
    "pol_analysis_methods_gen_047": {
        "question": "Which implementation-planning step most strongly improves accountability before a policy rollout begins?",
        "options": [
            "Rely on verbal approval and close the file without a delivery plan.",
            "Treat implementation gaps as issues to be solved after launch.",
            "Assign owners, timelines, resources, and monitoring checkpoints before rollout.",
            "Delay escalation until implementation problems become difficult to reverse.",
        ],
        "explanation": "Implementation becomes more accountable when owners, timelines, resources, and monitoring checkpoints are defined before rollout. Those details make it clear who is responsible for delivery and how progress will be reviewed.",
        "keywords": ["implementation_accountability", "delivery_owners", "monitoring_checkpoints", "rollout_planning"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_accountability", "delivery_owners", "monitoring_checkpoints"],
    },
    "pol_analysis_methods_gen_049": {
        "question": "Which step most improves traceability when implementation responsibilities are shared across agencies?",
        "options": [
            "Treat exceptions as normal practice without written justification.",
            "Proceed without validating who will own each implementation action.",
            "Map responsibilities, dependencies, and reporting lines in the implementation record.",
            "Delay coordination until the first delivery failure is reported.",
        ],
        "explanation": "Traceability improves when shared implementation responsibilities, dependencies, and reporting lines are mapped in the record. That makes cross-agency delivery easier to follow and review.",
        "keywords": ["shared_implementation", "reporting_lines", "delivery_dependencies", "traceability"],
        "tags": ["policy_analysis", "pol_analysis_methods", "shared_implementation", "reporting_lines", "delivery_dependencies"],
    },
    "pol_analysis_methods_gen_051": {
        "question": "In an urgent policy case, which action best keeps implementation planning within lawful administrative standards?",
        "options": [
            "Rely on verbal approval and finalize the plan later.",
            "Proceed without validating source records or delivery conditions.",
            "Treat exceptions as normal practice if the policy appears beneficial.",
            "Confirm legal authority, implementation ownership, and the review path before rollout is approved.",
        ],
        "explanation": "Urgency does not remove the need to confirm legal authority, implementation ownership, and the review path before rollout is approved. Lawful administration still depends on authority and accountable delivery planning.",
        "keywords": ["lawful_rollout", "implementation_ownership", "review_path", "urgent_policy_case"],
        "tags": ["policy_analysis", "pol_analysis_methods", "lawful_rollout", "implementation_ownership", "review_path"],
    },
    "pol_analysis_methods_gen_053": {
        "question": "Which practice best protects evidence integrity when analysts are under pressure to finalize recommendations?",
        "options": [
            "Delay escalation until issues become material and difficult to reverse.",
            "Proceed without validating the main data sources.",
            "Rely on undocumented assumptions if they support the preferred option.",
            "Use validated sources and record the assumptions behind the recommendation.",
        ],
        "explanation": "Evidence integrity is strongest when analysts use validated sources and record the assumptions behind their recommendation. That allows later reviewers to test whether the conclusion was properly grounded.",
        "keywords": ["validated_sources", "documented_assumptions", "evidence_integrity", "reviewability"],
        "tags": ["policy_analysis", "pol_analysis_methods", "validated_sources", "documented_assumptions", "evidence_integrity"],
    },
    "pol_analysis_methods_gen_055": {
        "question": "Which step most directly improves fairness when different evidence sources point in different directions?",
        "options": [
            "Rely on verbal approval and omit the conflicting evidence from the file.",
            "Document the evidence sources used and explain how conflicting claims were weighed.",
            "Treat conflicting evidence as a reason to prefer the familiar policy option.",
            "Delay the issue until pressure to decide has passed.",
        ],
        "explanation": "Fairness improves when the evidence sources are documented and the treatment of conflicting claims is explained. That shows how the recommendation was reached instead of hiding the disagreement in the record.",
        "keywords": ["conflicting_evidence", "evidence_weighting", "decision_fairness", "source_documentation"],
        "tags": ["policy_analysis", "pol_analysis_methods", "conflicting_evidence", "evidence_weighting", "decision_fairness"],
    },
    "pol_analysis_methods_gen_065": {
        "question": "Which implementation check most strongly improves delivery realism in a second review cycle?",
        "options": [
            "Proceed without validating the delivery assumptions behind the recommendation.",
            "Treat implementation exceptions as normal if the timeline is ambitious.",
            "Test whether staffing, sequencing, and reporting arrangements can support the proposed rollout.",
            "Delay escalation until implementation gaps become visible after launch.",
        ],
        "explanation": "Delivery realism improves when the team tests whether staffing, sequencing, and reporting arrangements can actually support the rollout. A second review should stress-test practical feasibility, not just restate the preferred option.",
        "keywords": ["delivery_realism", "staffing_feasibility", "sequencing", "second_review"],
        "tags": ["policy_analysis", "pol_analysis_methods", "delivery_realism", "staffing_feasibility", "sequencing"],
    },
    "pol_analysis_methods_gen_067": {
        "question": "Which step most improves traceability when implementation assumptions are revised during a second review?",
        "options": [
            "Update the implementation record to show what changed, why it changed, and who approved the revision.",
            "Rely on informal discussion notes instead of revising the formal file.",
            "Proceed without checking whether the revised assumptions affect delivery risk.",
            "Treat changes in implementation assumptions as too minor to document.",
        ],
        "explanation": "Traceability improves when revisions to implementation assumptions are recorded together with the reason for change and the approving authority. That keeps the delivery logic auditable across review cycles.",
        "keywords": ["assumption_revision", "implementation_record", "approving_authority", "auditability"],
        "tags": ["policy_analysis", "pol_analysis_methods", "assumption_revision", "implementation_record", "auditability"],
    },
    "pol_analysis_methods_gen_069": {
        "question": "In a time-sensitive second review, which action best aligns implementation planning with lawful standards?",
        "options": [
            "Proceed without validating source records or revised delivery assumptions.",
            "Delay escalation until delivery problems emerge in practice.",
            "Confirm the authority, named implementers, and review checkpoints before the revised plan is approved.",
            "Rely on verbal approval and complete the administrative record later.",
        ],
        "explanation": "Lawful implementation planning still requires confirming authority, named implementers, and review checkpoints before a revised plan is approved. Time pressure does not remove the need for documented accountability.",
        "keywords": ["revised_plan_approval", "named_implementers", "review_checkpoints", "lawful_implementation"],
        "tags": ["policy_analysis", "pol_analysis_methods", "revised_plan_approval", "named_implementers", "review_checkpoints"],
    },
    "pol_analysis_methods_gen_071": {
        "question": "Which routine best supports evidence integrity during a second evidence review cycle?",
        "options": [
            "Rely on verbal approval and omit weaker data from the record.",
            "Delay escalation until quality issues become public controversies.",
            "Treat evidence gaps as normal where the policy objective seems sound.",
            "Recheck key sources, note limitations, and record how new evidence affected the recommendation.",
        ],
        "explanation": "Evidence integrity during a second review depends on rechecking key sources, noting limitations, and recording how new evidence affects the recommendation. That keeps the updated conclusion anchored to a visible evidence trail.",
        "keywords": ["second_evidence_review", "source_recheck", "evidence_limitations", "updated_recommendation"],
        "tags": ["policy_analysis", "pol_analysis_methods", "second_evidence_review", "source_recheck", "updated_recommendation"],
    },
    "pol_analysis_methods_gen_073": {
        "question": "Which step most improves fairness when new evidence requires a policy recommendation to be revised?",
        "options": [
            "Delay reconsideration until the original recommendation has already been endorsed.",
            "Document the new evidence, explain the revision, and show how the earlier conclusion changed.",
            "Treat new evidence as a minor issue if the previous recommendation was widely accepted.",
            "Proceed without validating whether the new evidence changes the original assumptions.",
        ],
        "explanation": "Fairness improves when new evidence is documented, the revision is explained, and the record shows how the earlier conclusion changed. That allows reviewers to understand the reason for the shift in recommendation.",
        "keywords": ["recommendation_revision", "new_evidence", "fairness", "change_log"],
        "tags": ["policy_analysis", "pol_analysis_methods", "recommendation_revision", "new_evidence", "change_log"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 31",
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
    payload = {"round": 31, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
