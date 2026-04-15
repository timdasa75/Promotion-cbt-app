#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 30."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round30.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round30.md"

REWRITES = {
    "pol_analysis_methods_gen_040": {
        "question": "A policy unit is under pressure to recommend action quickly. Which first step best preserves formulation rigour?",
        "options": [
            "Bypass option appraisal while the issue is still politically active.",
            "Define the policy problem, available options, and assessment criteria before selecting a direction.",
            "Choose the most familiar solution and justify it afterward.",
            "Treat timeline pressure as a reason to suspend analytical standards.",
        ],
        "explanation": "Formulation rigour begins with a clear problem statement, identified options, and assessment criteria. Without those foundations, later policy choices become hard to justify or compare.",
        "keywords": ["problem_definition", "option_appraisal", "assessment_criteria", "formulation_rigour"],
        "tags": ["policy_analysis", "pol_analysis_methods", "problem_definition", "option_appraisal", "assessment_criteria"],
    },
    "pol_analysis_methods_gen_041": {
        "question": "Which routine most strongly supports accountable policy formulation when several teams are contributing inputs?",
        "options": [
            "Use a shared appraisal frame that records the problem, evidence base, and reasons for each recommendation.",
            "Let each team apply its own unstated assumptions as long as deadlines are met.",
            "Remove competing viewpoints from the record once a preferred option emerges.",
            "Accept undocumented amendments if they appear operationally convenient.",
        ],
        "explanation": "Accountable formulation depends on a shared appraisal frame that captures the problem, evidence, and rationale for recommendations. That creates an auditable trail across multiple contributors.",
        "keywords": ["shared_appraisal_frame", "multi_team_policy_work", "audit_trail", "recommendation_rationale"],
        "tags": ["policy_analysis", "pol_analysis_methods", "shared_appraisal_frame", "audit_trail", "recommendation_rationale"],
    },
    "pol_analysis_methods_gen_042": {
        "question": "A supervisor finds that similar policy proposals are being assessed inconsistently. Which fix best improves formulation control?",
        "options": [
            "Allow each analyst to choose whatever criteria fit the proposal at hand.",
            "Limit review to the final recommendation without examining the appraisal steps.",
            "Require analysts to use the same decision criteria and explain any justified deviation.",
            "Move faster by dropping comparative scoring where options look roughly similar.",
        ],
        "explanation": "Control improves when analysts apply common decision criteria and explain any justified deviation. Consistent criteria make proposals comparable and reduce arbitrary judgment.",
        "keywords": ["consistent_criteria", "proposal_comparison", "supervisory_control", "justified_deviation"],
        "tags": ["policy_analysis", "pol_analysis_methods", "consistent_criteria", "proposal_comparison", "supervisory_control"],
    },
    "pol_analysis_methods_gen_043": {
        "question": "Which step most directly improves fairness and traceability when policy options are narrowed down?",
        "options": [
            "Proceed with the preferred option once senior officers give informal support.",
            "Rely on verbal summaries instead of recording why options were rejected.",
            "Treat option elimination as self-evident when one proposal seems politically easier.",
            "Document the criteria used, the options considered, and the reason less suitable choices were set aside.",
        ],
        "explanation": "Traceability improves when the criteria, considered options, and reasons for setting alternatives aside are recorded. That makes the narrowing process reviewable and easier to defend.",
        "keywords": ["option_narrowing", "decision_log", "traceability", "rejected_options"],
        "tags": ["policy_analysis", "pol_analysis_methods", "option_narrowing", "decision_log", "traceability"],
    },
    "pol_analysis_methods_gen_044": {
        "question": "For sustainable formulation quality, what should a policy team prioritize first?",
        "options": [
            "Accelerating clearance even when the policy problem is still loosely defined.",
            "Establishing a disciplined method for problem definition, option testing, and criteria-based comparison.",
            "Relying on precedent without checking whether current conditions differ materially.",
            "Treating analytical shortcuts as acceptable whenever the issue appears familiar.",
        ],
        "explanation": "Sustainable formulation quality depends on a disciplined method for defining the problem, testing options, and comparing them against criteria. That method prevents inconsistency across future policy cases.",
        "keywords": ["formulation_quality", "disciplined_method", "option_testing", "criteria_comparison"],
        "tags": ["policy_analysis", "pol_analysis_methods", "formulation_quality", "disciplined_method", "option_testing"],
    },
    "pol_analysis_methods_gen_045": {
        "question": "In a time-sensitive policy matter, which action best aligns with lawful administrative standards during formulation?",
        "options": [
            "Proceed on verbal authority alone so that the file can move immediately.",
            "Skip documentation and complete the record after implementation begins.",
            "Assume statutory authority exists if the objective appears beneficial.",
            "Confirm the legal basis, required approvals, and decision record before finalizing the recommendation.",
        ],
        "explanation": "Even under time pressure, lawful standards require confirming the legal basis, required approvals, and decision record before finalizing a recommendation. Urgency does not remove the need for authority and documentation.",
        "keywords": ["lawful_formulation", "legal_basis", "required_approvals", "decision_record"],
        "tags": ["policy_analysis", "pol_analysis_methods", "lawful_formulation", "legal_basis", "decision_record"],
    },
    "pol_analysis_methods_gen_058": {
        "question": "A second policy team is handling a competing-priorities case. Which step best preserves formulation rigour at the appraisal stage?",
        "options": [
            "Use inconsistent criteria across similar cases so each analyst can respond flexibly.",
            "Bypass review checkpoints where timelines are tight.",
            "Test each option against the policy objective, implementation constraints, and measurable criteria.",
            "Treat process shortcuts as acceptable if they speed up escalation.",
        ],
        "explanation": "Rigour at the appraisal stage comes from testing each option against the objective, implementation constraints, and measurable criteria. That anchors the recommendation in a structured comparison rather than preference.",
        "keywords": ["appraisal_stage", "implementation_constraints", "structured_comparison", "measurable_criteria"],
        "tags": ["policy_analysis", "pol_analysis_methods", "appraisal_stage", "implementation_constraints", "structured_comparison"],
    },
    "pol_analysis_methods_gen_059": {
        "question": "During routine formulation work, which approach most strongly supports accountable implementation planning?",
        "options": [
            "Link the recommended option to realistic delivery steps, assigned responsibilities, and review points.",
            "Treat implementation details as separate from formulation until after approval is granted.",
            "Assume the implementing agency will resolve feasibility gaps on its own.",
            "Record only the preferred policy outcome without noting delivery conditions.",
        ],
        "explanation": "Implementation planning is accountable when the recommended option is linked to realistic delivery steps, named responsibilities, and review points. That helps decision-makers see what successful execution will require.",
        "keywords": ["implementation_planning", "delivery_steps", "assigned_responsibilities", "review_points"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_planning", "delivery_steps", "review_points"],
    },
    "pol_analysis_methods_gen_060": {
        "question": "A supervisor wants stronger consistency across policy submissions. Which tool best improves formulation control?",
        "options": [
            "Rely on the experience of each analyst instead of using a standard template.",
            "Adopt a standard formulation template that captures objectives, options, criteria, risks, and assumptions.",
            "Review only the final recommendation so analysts can keep their methods flexible.",
            "Allow each unit to omit assumptions that are difficult to quantify.",
        ],
        "explanation": "A standard formulation template improves control because it captures the same core elements across submissions: objectives, options, criteria, risks, and assumptions. That makes supervisory review more consistent.",
        "keywords": ["standard_template", "supervisory_review", "assumptions", "submission_consistency"],
        "tags": ["policy_analysis", "pol_analysis_methods", "standard_template", "supervisory_review", "submission_consistency"],
    },
    "pol_analysis_methods_gen_061": {
        "question": "Which step most directly improves traceability when a policy option is recommended over several alternatives?",
        "options": [
            "Delay escalation until implementation begins to show practical difficulty.",
            "Proceed without validating the assumptions behind alternative options.",
            "Rely on informal discussion notes instead of a formal appraisal record.",
            "Record the comparison of options, the weighting of criteria, and the reason the preferred option ranked highest.",
        ],
        "explanation": "Traceability improves when the option comparison, weighting of criteria, and reason for the final ranking are recorded. That makes the recommendation transparent to reviewers and later implementers.",
        "keywords": ["option_ranking", "criteria_weighting", "formal_appraisal", "recommendation_traceability"],
        "tags": ["policy_analysis", "pol_analysis_methods", "option_ranking", "criteria_weighting", "formal_appraisal"],
    },
    "pol_analysis_methods_gen_062": {
        "question": "For sustainable policy formulation rigour, which practice should be prioritized first in a second review cycle?",
        "options": [
            "Accelerate clearance by reducing the number of options examined.",
            "Reuse prior recommendations without checking whether assumptions still hold.",
            "Test key assumptions against updated evidence and alternative future scenarios before confirming the recommendation.",
            "Treat time pressure as a reason to leave sensitivity analysis to later reviewers.",
        ],
        "explanation": "Rigour is sustained when key assumptions are tested against updated evidence and alternative scenarios before a recommendation is confirmed. That helps the policy team avoid repeating outdated judgments.",
        "keywords": ["assumption_testing", "updated_evidence", "scenario_analysis", "second_review_cycle"],
        "tags": ["policy_analysis", "pol_analysis_methods", "assumption_testing", "updated_evidence", "scenario_analysis"],
    },
    "pol_analysis_methods_gen_063": {
        "question": "In a time-sensitive formulation case, which action best aligns with lawful administrative standards in a second review cycle?",
        "options": [
            "Confirm statutory authority, required consultation steps, and the administrative feasibility of the preferred option before submission.",
            "Proceed on verbal approval and formalize the record only if the option is adopted.",
            "Treat consultation requirements as optional when the policy issue is urgent.",
            "Assume that feasibility concerns can be resolved after ministers endorse the recommendation.",
        ],
        "explanation": "Lawful formulation still requires confirming statutory authority, required consultation steps, and administrative feasibility before submission. Time pressure may shorten timelines, but it does not remove mandatory standards.",
        "keywords": ["statutory_authority", "consultation_steps", "administrative_feasibility", "time_sensitive_review"],
        "tags": ["policy_analysis", "pol_analysis_methods", "statutory_authority", "consultation_steps", "administrative_feasibility"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 30",
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
    payload = {"round": 30, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
