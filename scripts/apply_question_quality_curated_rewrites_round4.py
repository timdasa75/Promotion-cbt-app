#!/usr/bin/env python3
"""Apply a fourth curated batch of text-corruption rewrites."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round4.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round4.md"


@dataclass(frozen=True)
class RewriteSpec:
    question_id: str
    source_topic: str
    source_subcategory: str
    question: str
    options: tuple[str, ...] | None = None
    explanation: str | None = None
    keywords: tuple[str, ...] | None = None


REWRITE_SPECS = [
    RewriteSpec(
        "csh_administrative_procedures_gen_001",
        "civil_service_admin",
        "csh_administrative_procedures",
        "Which action best demonstrates sound administrative procedure in government service?",
        options=(
            "Follow approved procedures and maintain complete records.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Prioritize convenience over policy and legal requirements.",
        ),
        explanation="Sound administrative procedure requires adherence to approved processes together with complete and accurate record-keeping.",
        keywords=("administrative procedures", "records management", "process compliance"),
    ),
    RewriteSpec(
        "csh_administrative_procedures_gen_020",
        "civil_service_admin",
        "csh_administrative_procedures",
        "Which choice reflects proper standards when handling administrative procedures?",
        options=(
            "Follow approved procedures and maintain complete records.",
            "Bypass review and approval controls to save time.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
        ),
        explanation="Proper administrative procedure means following approved processes and maintaining complete records for accountability.",
        keywords=("administrative procedures", "process standards", "record keeping"),
    ),
    RewriteSpec(
        "csh_administrative_procedures_gen_027",
        "civil_service_admin",
        "csh_administrative_procedures",
        "A desk officer handling administrative procedures receives a case that requires careful compliance. What should be done first?",
        options=(
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Follow approved procedures and maintain complete records.",
            "Bypass review and approval controls to save time.",
        ),
        explanation="The first step should be to follow approved procedures and maintain proper records so that fairness, compliance, and accountability are preserved.",
        keywords=("administrative procedures", "compliance", "record keeping"),
    ),
    RewriteSpec(
        "clg_legal_compliance_gen_002",
        "constitutional_law",
        "clg_legal_compliance",
        "Which approach best supports effective legal and statutory compliance?",
        options=(
            "Use lawful criteria and document each decision step transparently.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or required records.",
        ),
        explanation="Effective legal and statutory compliance depends on the consistent use of lawful criteria together with transparent documentation of each decision.",
        keywords=("legal compliance", "statutory compliance", "decision records"),
    ),
    RewriteSpec(
        "clg_legal_compliance_gen_033",
        "constitutional_law",
        "clg_legal_compliance",
        "Which practice should a responsible officer prioritize to sustain legal and statutory compliance?",
        options=(
            "Use lawful criteria and document each decision step transparently.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or required records.",
            "Rely on informal instructions without documentary evidence.",
        ),
        explanation="Sustaining legal and statutory compliance requires lawful decision-making backed by clear documentation and records.",
        keywords=("legal compliance", "statutory compliance", "documentation"),
    ),
    RewriteSpec(
        "clg_legal_compliance_gen_040",
        "constitutional_law",
        "clg_legal_compliance",
        "During routine legal and statutory compliance work, which approach best supports public-sector accountability?",
        options=(
            "Use lawful criteria and document each decision step transparently.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or required records.",
        ),
        explanation="Public-sector accountability is best supported when legal and statutory compliance work is handled through lawful criteria and transparent documentation.",
        keywords=("legal compliance", "public-sector accountability", "documentation"),
    ),
    RewriteSpec(
        "fin_audits_sanctions_gen_002",
        "financial_regulations",
        "fin_audits_sanctions",
        "Which approach best supports effective audits, sanctions, and compliance?",
        options=(
            "Use lawful criteria and document each decision step transparently.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or required records.",
        ),
        explanation="Effective audit and sanctions work depends on lawful decisions, proper documentation, and a clear compliance trail.",
        keywords=("audits", "sanctions", "financial compliance"),
    ),
    RewriteSpec(
        "fin_audits_sanctions_gen_020",
        "financial_regulations",
        "fin_audits_sanctions",
        "Which practice should a responsible officer prioritize to sustain audits, sanctions, and compliance?",
        options=(
            "Use lawful criteria and document each decision step transparently.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or required records.",
            "Rely on informal instructions without documentary evidence.",
        ),
        explanation="Sustaining audits, sanctions, and compliance requires transparent decision-making supported by proper records and lawful criteria.",
        keywords=("audits", "sanctions", "compliance records"),
    ),
    RewriteSpec(
        "NLR_S_016",
        "leadership_management",
        "neg_structure_bodies",
        "Under the NPSNC structure, which council represents senior staff members, generally on Grade Level 07 and above?",
        explanation="Within the NPSNC structure, Council I represents the senior staff category, generally covering officers on Grade Level 07 and above.",
        keywords=("NPSNC", "Council I", "senior staff representation"),
    ),
    RewriteSpec(
        "neg_structure_bodies_gen_079",
        "leadership_management",
        "neg_structure_bodies",
        "Within the NPSNC structure, which council speaks for senior staff members, usually on Grade Level 07 and above?",
        explanation="Within the NPSNC structure, Council I speaks for the senior staff category, which usually covers Grade Level 07 and above.",
        keywords=("NPSNC", "Council I", "senior staff"),
    ),
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, payload):
    applied = list(payload.get("applied", []))
    lines = [
        "# Question Quality Batch 1 Applied Rewrites Round 4",
        "",
        f"- Applied rewrites: **{len(applied)}**",
        "",
    ]
    for item in applied:
        lines.append(f"- `{item['question_id']}` [{item['source_topic']}/{item['source_subcategory']}]")
        lines.append(f"  - Before: {item['before_question']}")
        lines.append(f"  - After: {item['after_question']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_topic_maps(root: Path):
    topics_doc = load_json(TOPICS_FILE)
    topic_paths = {}
    topic_docs = {}
    subcategory_refs = {}
    for topic in topics_doc.get("topics", []):
        if not isinstance(topic, dict):
            continue
        topic_id = str(topic.get("id") or "").strip()
        if not topic_id:
            continue
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
    return topic_docs, topic_paths, subcategory_refs


def apply_rewrites(root: Path):
    topic_docs, topic_paths, subcategory_refs = build_topic_maps(root)
    applied = []
    for spec in REWRITE_SPECS:
        subcategory = subcategory_refs[(spec.source_topic, spec.source_subcategory)]
        questions = subcategory.get("questions")
        if not isinstance(questions, list):
            raise SystemExit(f"Questions missing for {spec.source_topic}/{spec.source_subcategory}")
        target = None
        for question in questions:
            if isinstance(question, dict) and str(question.get("id") or "").strip() == spec.question_id:
                target = question
                break
        if target is None:
            raise SystemExit(f"Question {spec.question_id} not found in {spec.source_topic}/{spec.source_subcategory}")
        before_question = str(target.get("question") or "").strip()
        target["question"] = spec.question
        if spec.options is not None:
            target["options"] = list(spec.options)
        if spec.explanation is not None:
            target["explanation"] = spec.explanation
        if spec.keywords is not None:
            target["keywords"] = list(spec.keywords)
        target["lastReviewed"] = "2026-04-02"
        applied.append({
            "question_id": spec.question_id,
            "source_topic": spec.source_topic,
            "source_subcategory": spec.source_subcategory,
            "source_file": str(topic_paths[spec.source_topic].relative_to(root)).replace('\\', '/'),
            "before_question": before_question,
            "after_question": spec.question,
        })
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
    applied = apply_rewrites(args.root)
    payload = {"applied": applied}
    args.log_out.parent.mkdir(parents=True, exist_ok=True)
    save_json(args.log_out, payload)
    write_markdown(args.markdown_out, payload)
    print(json.dumps({"applied_rewrites": len(applied), "rewrites": applied}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
