#!/usr/bin/env python3
"""
Expand question banks so each subcategory has at least 50 questions.

This script appends structured, standards-aligned draft MCQs to underfilled
subcategories while preserving existing content and IDs.
"""

from __future__ import annotations

import json
import random
import re
from pathlib import Path
from typing import Dict, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
TARGET_MIN = 50


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


def count_questions(subcategory: dict) -> int:
    qlist, _ = iterate_subcategory_questions(subcategory)
    return len([q for q in qlist if isinstance(q, dict)])


def next_generated_index(existing_ids: List[str], sub_id: str) -> int:
    pat = re.compile(rf"^{re.escape(sub_id)}_gen_(\d+)$")
    max_n = 0
    for qid in existing_ids:
        m = pat.match(qid or "")
        if m:
            max_n = max(max_n, int(m.group(1)))
    return max_n + 1


def domain_focus_bank(topic_id: str, sub_name: str) -> List[Tuple[str, str]]:
    generic = [
        ("documented procedure", "Follow documented procedure and keep complete records."),
        ("compliance assurance", "Apply approved rules consistently and escalate exceptions."),
        ("public accountability", "Provide traceable decisions and evidence-based justification."),
        ("service integrity", "Avoid conflicts of interest and disclose relevant constraints."),
        ("risk control", "Identify risk early, apply controls, and document mitigation."),
        ("decision transparency", "Use clear criteria and communicate decisions promptly."),
        ("operational discipline", "Follow approved workflows and verify outputs before closure."),
        ("citizen-focused service", "Balance legality, fairness, timeliness, and service quality."),
        ("record management", "Maintain accurate files and update status at each control point."),
        ("performance standards", "Set measurable targets, monitor progress, and correct deviations."),
    ]

    domain = {
        "psr": [
            ("appointment governance", "Apply merit-based criteria and authorized approval channels."),
            ("disciplinary process", "Observe due process, fair hearing, and documented decisions."),
            ("leave administration", "Apply leave rules consistently and update personnel records."),
            ("promotion standards", "Confirm eligibility requirements before recommending advancement."),
            ("circular compliance", "Align practice with current circular directives and PSR rules."),
        ],
        "financial_regulations": [
            ("vote book control", "Confirm budget availability before commitments are raised."),
            ("virement process", "Obtain proper authorization before moving funds between heads."),
            ("expenditure discipline", "Commit and spend only within approved budget limits."),
            ("audit readiness", "Keep complete supporting documents for verification and audit."),
            ("cash management", "Reconcile accounts promptly and resolve variances with evidence."),
        ],
        "procurement_act": [
            ("open competition", "Use competitive procurement methods except where lawful exceptions apply."),
            ("bid evaluation", "Apply published criteria consistently to all responsive bids."),
            ("contract governance", "Monitor delivery milestones and enforce contract obligations."),
            ("procurement ethics", "Prevent collusion, favoritism, and conflict of interest."),
            ("regulatory compliance", "Obtain required approvals before award and contract execution."),
        ],
        "constitutional_law": [
            ("constitutional supremacy", "Ensure administrative actions remain within constitutional limits."),
            ("legal compliance", "Check statutory authority before acting on sensitive matters."),
            ("foi obligations", "Respond to information requests within legal timelines."),
            ("rights balancing", "Apply exemptions narrowly and justify decisions with legal basis."),
            ("public law standards", "Maintain fairness, reasonableness, and procedural propriety."),
        ],
        "civil_service_admin": [
            ("administrative ethics", "Uphold neutrality, integrity, and service professionalism."),
            ("grievance handling", "Resolve complaints using fair, timely, and documented procedures."),
            ("performance management", "Use objective indicators and structured feedback cycles."),
            ("discipline and conduct", "Address misconduct consistently under approved policy."),
            ("anti-corruption safeguards", "Escalate suspicious practices through proper reporting channels."),
        ],
        "leadership_management": [
            ("strategic alignment", "Link unit actions to ministry goals and measurable outcomes."),
            ("stakeholder negotiation", "Use principled negotiation and document agreed commitments."),
            ("team leadership", "Clarify roles, remove blockers, and coach for improved outcomes."),
            ("change management", "Sequence reforms with communication, training, and monitoring."),
            ("dispute resolution", "Address disputes early using lawful and structured mechanisms."),
        ],
        "ict_management": [
            ("cybersecurity hygiene", "Apply least privilege, patching, and incident reporting controls."),
            ("digital service design", "Design services for usability, security, and accountability."),
            ("data governance", "Classify, protect, and retain records according to policy."),
            ("business continuity", "Maintain backup, recovery, and resilience procedures."),
            ("technology adoption", "Deploy solutions with training, controls, and user support."),
        ],
        "policy_analysis": [
            ("policy formulation", "Define the problem, options, and decision criteria clearly."),
            ("implementation planning", "Assign responsibilities, timelines, and performance metrics."),
            ("impact evaluation", "Measure outcomes against baseline and policy objectives."),
            ("evidence quality", "Use credible data sources and validate assumptions."),
            ("public-sector planning", "Align plans with budget, legal mandate, and service priorities."),
        ],
        "general_current_affairs": [
            ("institutional awareness", "Interpret current developments through verified public sources."),
            ("national governance updates", "Track policy changes and implications for service delivery."),
            ("regional and global context", "Relate international events to national administrative priorities."),
            ("public communication literacy", "Differentiate verified updates from misinformation."),
            ("civic relevance", "Connect current affairs to public-sector responsibilities."),
        ],
        "competency_framework": [
            ("numerical reasoning", "Use quantitative evidence to support administrative decisions."),
            ("verbal reasoning", "Interpret official text accurately before action."),
            ("analytical judgement", "Evaluate alternatives using logic and evidence."),
            ("problem solving", "Break complex issues into testable and actionable parts."),
            ("communication clarity", "Present conclusions clearly with defensible rationale."),
        ],
    }
    return domain.get(topic_id, []) + generic


def build_question(
    topic_id: str,
    sub_id: str,
    sub_name: str,
    question_id: str,
    focus: str,
    correct_text: str,
    variant_index: int,
) -> dict:
    stems = [
        "A desk officer handling {sub} receives a case that requires {focus}. What should be done first?",
        "During routine {sub_lc} operations, which approach best ensures {focus}?",
        "A supervisor is reviewing compliance gaps in {sub}. Which action most directly strengthens {focus}?",
        "When applying rules in {sub_lc}, which option aligns best with {focus} standards?",
        "To improve accountability in {sub_lc}, which practice best supports {focus}?",
        "A ministry unit is updating its workflow for {sub_lc}. Which choice most effectively promotes {focus}?",
        "In a time-sensitive file under {sub}, which step best preserves {focus} without breaching process?",
        "Which of the following is the strongest control action for {focus} in {sub_lc}?",
    ]
    qualifiers = [
        "while maintaining fairness and legal compliance",
        "under standard approval and documentation controls",
        "in line with public-sector accountability expectations",
        "without bypassing established review procedures",
        "while preserving records for audit and oversight",
        "within approved timelines and governance standards",
    ]
    bad_options = [
        "Rely on informal instructions without documentary evidence.",
        "Apply rules inconsistently based on personal preference.",
        "Delay decisions until issues escalate into avoidable crises.",
        "Bypass review and approval controls to save time.",
        "Treat exceptions as routine without documented justification.",
        "Prioritize convenience over policy and legal requirements.",
        "Close cases without validating facts or required records.",
        "Ignore feedback and continue non-compliant procedures.",
    ]

    stem_template = stems[variant_index % len(stems)]
    qualifier = qualifiers[(variant_index // len(stems)) % len(qualifiers)]
    stem = (
        stem_template.format(sub=sub_name, sub_lc=sub_name.lower(), focus=focus).rstrip(".")
        + f" {qualifier}?"
    )

    distractors = []
    for off in (1, 3, 5, 7, 2, 4):
        candidate = bad_options[(variant_index + off) % len(bad_options)]
        if candidate not in distractors:
            distractors.append(candidate)
        if len(distractors) == 3:
            break

    options = [correct_text] + distractors
    rng = random.Random(f"{sub_id}:{question_id}")
    rng.shuffle(options)
    correct_idx = options.index(correct_text)

    difficulty_cycle = ["easy", "medium", "hard"]
    difficulty = difficulty_cycle[variant_index % len(difficulty_cycle)]

    return {
        "id": question_id,
        "question": stem,
        "options": options,
        "correct": correct_idx,
        "explanation": (
            f"This is correct because {correct_text.lower()} It strengthens "
            f"compliance, consistency, and accountability in {sub_name.lower()}."
        ),
        "difficulty": difficulty,
        "chapter": f"{sub_name} - Expansion Set",
        "keywords": [topic_id, sub_id, focus, "quality-expansion"],
        "source": "generated_draft",
    }


def build_unique_question(
    topic_id: str,
    sub_id: str,
    sub_name: str,
    question_id: str,
    focus: str,
    correct_text: str,
    variant_seed: int,
    existing_norms: set,
) -> dict:
    for extra in range(200):
        q = build_question(
            topic_id=topic_id,
            sub_id=sub_id,
            sub_name=sub_name,
            question_id=question_id,
            focus=focus,
            correct_text=correct_text,
            variant_index=variant_seed + extra,
        )
        norm = normalize_text(q.get("question", ""))
        if norm and norm not in existing_norms:
            existing_norms.add(norm)
            return q

    fallback = build_question(
        topic_id=topic_id,
        sub_id=sub_id,
        sub_name=sub_name,
        question_id=question_id,
        focus=focus,
        correct_text=correct_text,
        variant_index=variant_seed,
    )
    fallback["question"] = f"{fallback['question']} (Case {question_id})"
    existing_norms.add(normalize_text(fallback["question"]))
    return fallback


def main():
    topics_doc = load_json(TOPICS_FILE)
    topics = topics_doc.get("topics", [])

    changed_files = set()
    additions_summary = []

    for topic in topics:
        if not isinstance(topic, dict):
            continue
        topic_id = topic.get("id", "")
        rel_file = topic.get("file")
        if not rel_file:
            continue
        path = ROOT / rel_file
        if not path.exists():
            continue
        data = load_json(path)
        if not isinstance(data, dict):
            continue

        subcategories = data.get("subcategories", [])
        if not isinstance(subcategories, list):
            continue

        topic_changed = False
        focus_bank = domain_focus_bank(topic_id, "")

        for sub in subcategories:
            if not isinstance(sub, dict):
                continue
            sub_id = sub.get("id", "")
            sub_name = sub.get("name", sub_id)
            qlist, nested = iterate_subcategory_questions(sub)
            if not isinstance(qlist, list):
                continue

            current = len([q for q in qlist if isinstance(q, dict)])
            deficit = max(0, TARGET_MIN - current)
            if deficit <= 0:
                continue

            existing_ids = [str(q.get("id", "")) for q in qlist if isinstance(q, dict)]
            start_idx = next_generated_index(existing_ids, sub_id)
            existing_norms = {
                normalize_text(str(q.get("question", "")))
                for q in qlist
                if isinstance(q, dict) and str(q.get("question", "")).strip()
            }

            # Blend topic bank with subcategory-specific focus to keep relevance.
            sub_specific = [
                (f"{sub_name.lower()} governance", f"Apply approved {sub_name.lower()} procedures and maintain complete records."),
                (f"{sub_name.lower()} compliance", f"Use lawful criteria and document each decision step transparently."),
                (f"{sub_name.lower()} risk management", f"Identify control gaps early and escalate material exceptions promptly."),
            ]
            bank = sub_specific + focus_bank

            new_questions = []
            for i in range(deficit):
                focus, correct_text = bank[i % len(bank)]
                qid = f"{sub_id}_gen_{start_idx + i:03d}"
                new_questions.append(
                    build_unique_question(
                        topic_id=topic_id,
                        sub_id=sub_id,
                        sub_name=sub_name,
                        question_id=qid,
                        focus=focus,
                        correct_text=correct_text,
                        variant_seed=i * 17,
                        existing_norms=existing_norms,
                    )
                )

            if nested:
                sub["questions"][0][sub_id].extend(new_questions)
            else:
                sub["questions"].extend(new_questions)

            additions_summary.append(
                {
                    "topic_id": topic_id,
                    "subcategory_id": sub_id,
                    "subcategory_name": sub_name,
                    "added": deficit,
                    "new_total": current + deficit,
                }
            )
            topic_changed = True

        if topic_changed:
            dump_json(path, data)
            changed_files.add(rel_file)

    print("Expansion complete")
    print(f"Changed files: {len(changed_files)}")
    print(f"Subcategories expanded: {len(additions_summary)}")
    print(f"Questions added: {sum(x['added'] for x in additions_summary)}")
    for row in additions_summary:
        print(
            f"{row['topic_id']}|{row['subcategory_id']}|added={row['added']}|total={row['new_total']}"
        )


if __name__ == "__main__":
    main()
