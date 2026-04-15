#!/usr/bin/env python3
"""Apply curated question quality rewrites for round 20."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from audit_question_quality import safe_get_questions

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round20.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_phase2_applied_rewrites_round20.md"

REWRITES = {
    "pol_analysis_methods_gen_046": {
        "question": "A policy-analysis team is handling competing priorities ahead of rollout. Which step best preserves implementation discipline?",
        "options": [
            "Set clear responsibilities, timelines, resource needs, and review checkpoints before rollout.",
            "Allow each unit to interpret deadlines in its own way.",
            "Bypass review checkpoints when timelines become tight.",
            "Defer ownership decisions until implementation problems appear.",
        ],
        "explanation": "Implementation discipline is strongest when responsibilities, timelines, resources, and review checkpoints are agreed before rollout begins. That reduces confusion and makes it easier to monitor delivery against plan.",
        "keywords": ["implementation_discipline", "policy_rollout", "responsibility_matrix", "review_checkpoints"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_discipline", "policy_rollout", "review_checkpoints"],
    },
    "pol_analysis_methods_gen_048": {
        "question": "A supervisor finds uneven analytical outputs across several policy-analysis submissions. Which corrective step best improves control and consistency?",
        "options": [
            "Let each analyst continue using a preferred structure.",
            "Focus on speed and skip common review criteria.",
            "Rely on verbal guidance without a shared standard.",
            "Introduce a standard analytical template and review rubric for all submissions.",
        ],
        "explanation": "A standard template and review rubric improves control because analysts work to the same structure and reviewers assess submissions against the same criteria.",
        "keywords": ["analytical_template", "review_rubric", "quality_control", "consistency"],
        "tags": ["policy_analysis", "pol_analysis_methods", "analytical_template", "review_rubric", "quality_control"],
    },
    "pol_analysis_methods_gen_050": {
        "question": "For sustainable policy-analysis practice, which habit should be prioritized first?",
        "options": [
            "Treat assumptions as obvious and leave them unstated.",
            "Document assumptions, evidence sources, and validation steps in a repeatable workflow.",
            "Change analytical criteria from case to case.",
            "Prefer speed over traceability in every submission.",
        ],
        "explanation": "Sustainable policy-analysis practice depends on a repeatable workflow that records assumptions, evidence sources, and validation steps. That makes future review and learning possible.",
        "keywords": ["repeatable_workflow", "assumptions_log", "evidence_sources", "validation_steps"],
        "tags": ["policy_analysis", "pol_analysis_methods", "repeatable_workflow", "assumptions_log", "evidence_sources"],
    },
    "pol_analysis_methods_gen_052": {
        "question": "A policy-analysis unit is working under pressure. Which action best protects evidence integrity before recommendations are issued?",
        "options": [
            "Rely on convenient figures that cannot be traced back to a source.",
            "Leave assumptions undocumented until after approval.",
            "Use validated data sources and record the assumptions behind the recommendation.",
            "Mix inconsistent evidence standards across similar cases.",
        ],
        "explanation": "Evidence integrity is protected when the team uses validated sources and records the assumptions that connect the evidence to the recommendation. That makes the analysis reviewable and defensible.",
        "keywords": ["evidence_integrity", "validated_sources", "assumption_recording", "policy_recommendation"],
        "tags": ["policy_analysis", "pol_analysis_methods", "evidence_integrity", "validated_sources", "policy_recommendation"],
    },
    "pol_analysis_methods_gen_054": {
        "question": "A supervisor is reviewing weak evidence standards in policy-analysis submissions. Which requirement best strengthens consistency?",
        "options": [
            "Permit analysts to cite sources only when challenged.",
            "Accept recommendations even when assumptions are missing.",
            "Require every submission to cite sources and explain the assumptions used.",
            "Allow each unit to define evidence quality for itself.",
        ],
        "explanation": "Consistency improves when every submission must cite its sources and state the assumptions used. That creates a common evidence standard across the unit.",
        "keywords": ["source_citation", "assumption_disclosure", "evidence_standard", "review_consistency"],
        "tags": ["policy_analysis", "pol_analysis_methods", "source_citation", "assumption_disclosure", "evidence_standard"],
    },
    "pol_analysis_methods_gen_056": {
        "question": "Which practice should be prioritized first to sustain evidence integrity in policy analysis over time?",
        "options": [
            "Treat validated data as optional when deadlines are tight.",
            "Delay recording assumptions until implementation begins.",
            "Maintain a documented evidence trail and validate data before use.",
            "Vary evidence thresholds from one submission to another.",
        ],
        "explanation": "Evidence integrity is sustained when the team keeps a documented evidence trail and validates data before it is used in analysis. That prevents avoidable disputes over source quality later.",
        "keywords": ["evidence_trail", "data_validation", "source_quality", "analysis_integrity"],
        "tags": ["policy_analysis", "pol_analysis_methods", "evidence_trail", "data_validation", "analysis_integrity"],
    },
    "pol_analysis_methods_gen_064": {
        "question": "A cross-ministerial policy rollout has overlapping tasks and deadlines. Which planning step best preserves implementation realism?",
        "options": [
            "Leave each unit to set its own milestones after rollout begins.",
            "Assume resource gaps can be fixed informally later.",
            "Ignore escalation paths until a failure occurs.",
            "Map responsibilities, dependencies, milestones, and escalation points before launch.",
        ],
        "explanation": "Implementation realism depends on knowing who is responsible, which tasks depend on others, what milestones matter, and how issues will be escalated before launch.",
        "keywords": ["implementation_realism", "dependencies", "milestones", "escalation_points"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_realism", "dependencies", "milestones"],
    },
    "pol_analysis_methods_gen_066": {
        "question": "A supervisor notices that implementation follow-up is inconsistent across similar policy projects. Which tool best improves control?",
        "options": [
            "A flexible approach where every team tracks progress differently.",
            "A reliance on informal verbal updates only.",
            "A decision to review progress only at the end of the project.",
            "A shared implementation tracker with milestones, owners, and accountability checks.",
        ],
        "explanation": "A shared implementation tracker improves control because it keeps milestones, ownership, and accountability checks visible across comparable projects.",
        "keywords": ["implementation_tracker", "milestones", "ownership", "accountability_checks"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_tracker", "milestones", "accountability_checks"],
    },
    "pol_analysis_methods_gen_068": {
        "question": "For sustainable implementation planning in policy analysis, what should be prioritized first?",
        "options": [
            "Change control standards whenever urgency rises.",
            "Set milestones, resource needs, and monitoring checkpoints before rollout.",
            "Rely on convenience rather than approved implementation steps.",
            "Allow review gates to be skipped once work has started.",
        ],
        "explanation": "Sustainable implementation planning starts with agreed milestones, resource needs, and monitoring checkpoints. Those controls make it possible to manage delivery without improvising core governance steps.",
        "keywords": ["implementation_planning", "monitoring_checkpoints", "resource_planning", "milestones"],
        "tags": ["policy_analysis", "pol_analysis_methods", "implementation_planning", "monitoring_checkpoints", "resource_planning"],
    },
    "pol_analysis_methods_gen_070": {
        "question": "A policy-analysis unit is under time pressure. Which step best preserves evidence integrity in the final recommendation?",
        "options": [
            "Use whichever figures are easiest to obtain.",
            "Skip source checks if the conclusion seems reasonable.",
            "Validate source quality and record the assumptions behind the recommendation.",
            "Apply different evidence standards to similar cases.",
        ],
        "explanation": "Even under time pressure, evidence integrity depends on validating source quality and recording the assumptions behind the recommendation. Without that, the recommendation is harder to defend.",
        "keywords": ["source_quality", "assumption_recording", "time_pressure", "evidence_integrity"],
        "tags": ["policy_analysis", "pol_analysis_methods", "source_quality", "assumption_recording", "evidence_integrity"],
    },
    "pol_analysis_methods_gen_072": {
        "question": "A supervisor wants stronger evidence discipline in policy-analysis work. Which requirement best improves assurance?",
        "options": [
            "Allow teams to decide for themselves when evidence is sufficient.",
            "Treat undocumented assumptions as acceptable if results look plausible.",
            "Accept recommendations without stating source limitations.",
            "Require cited sources, verification notes, and clear evidence grading in each submission.",
        ],
        "explanation": "Evidence discipline improves when submissions include cited sources, verification notes, and a clear statement of the strength or limits of the evidence used.",
        "keywords": ["evidence_discipline", "verification_notes", "evidence_grading", "assurance"],
        "tags": ["policy_analysis", "pol_analysis_methods", "evidence_discipline", "verification_notes", "evidence_grading"],
    },
    "pol_analysis_methods_gen_074": {
        "question": "What should be prioritized first to sustain evidence integrity across repeated policy-analysis cycles?",
        "options": [
            "Skip review checkpoints when prior cases look similar.",
            "Maintain an auditable evidence trail from data collection to recommendation.",
            "Vary evidence standards according to pressure from stakeholders.",
            "Rely on undocumented professional judgment alone.",
        ],
        "explanation": "An auditable evidence trail helps sustain evidence integrity across repeated policy-analysis cycles because each recommendation can be traced back to its data, checks, and reasoning.",
        "keywords": ["auditable_evidence_trail", "data_collection", "recommendation_traceability", "policy_cycles"],
        "tags": ["policy_analysis", "pol_analysis_methods", "auditable_evidence_trail", "recommendation_traceability", "policy_cycles"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = payload.get("applied", [])
    lines = [
        "# Question Quality Phase 2 Applied Rewrites Round 20",
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
    payload = {"round": 20, "applied": applied}
    save_json(args.log_json, payload)
    write_markdown(args.log_md, payload)
    print(f"Applied {len(applied)} rewrites")


if __name__ == "__main__":
    main()
