#!/usr/bin/env python3
"""Apply a curated first batch of text-corruption rewrites."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites.md"


@dataclass(frozen=True)
class RewriteSpec:
    question_id: str
    source_topic: str
    source_subcategory: str
    question: str
    options: tuple[str, ...] | None = None
    explanation: str | None = None


REWRITE_SPECS = [
    RewriteSpec(
        "csh_principle_028",
        "civil_service_admin",
        "csh_principles_ethics",
        "The ethical requirement for civil servants to maintain high standards of conduct is highlighted in which **PSR** chapter?",
        explanation="Chapter 10 of the Public Service Rules deals with discipline, conduct, and ethics, which is why it is the chapter that highlights the requirement for high ethical standards.",
    ),
    RewriteSpec(
        "csh_principle_051",
        "civil_service_admin",
        "csh_principles_ethics",
        "What is the main duty of the Executive Council of the Federation?",
        options=(
            "To manage the daily affairs of the Judiciary.",
            "To elect Local Government Chairmen.",
            "To determine government policies on various matters.",
            "To confirm appointments of Ministers and Ambassadors.",
        ),
        explanation="The Executive Council of the Federation is responsible for determining government policies on a wide range of national matters.",
    ),
    RewriteSpec(
        "csh_disc_002",
        "civil_service_admin",
        "csh_discipline_conduct",
        "What is usually the first step in the disciplinary procedure for misconduct?",
        explanation="The disciplinary process normally begins with the issuance of a written query, as reflected in PSR 100307.",
    ),
    RewriteSpec(
        "csh_disc_004",
        "civil_service_admin",
        "csh_discipline_conduct",
        "Which offence is classified as **Serious Misconduct** and may lead to dismissal?",
        explanation="Serious offences such as fraud, corruption, or the unauthorized disclosure of official information amount to Serious Misconduct under PSR 100401.",
    ),
    RewriteSpec(
        "csh_disc_028",
        "civil_service_admin",
        "csh_discipline_conduct",
        "Who has the authority to issue a written query to a Director (**GL 17**) in a Ministry?",
        explanation="The Permanent Secretary, as the administrative head of the Ministry, is the proper authority to issue a written query to a Director.",
    ),
    RewriteSpec(
        "csh_disc_035",
        "civil_service_admin",
        "csh_discipline_conduct",
        "Which officer is empowered to initiate disciplinary action by issuing a query for misconduct?",
        explanation="A supervisor, Head of Department, or other appropriate disciplinary superior may initiate disciplinary action by issuing a query for misconduct.",
    ),
    RewriteSpec(
        "csh_disc_036",
        "civil_service_admin",
        "csh_discipline_conduct",
        "If an officer's salary is withheld because of unauthorized absence, which **PSR** rule governs that sanction?",
        explanation="PSR 040206 specifically provides for the withholding of salary in cases of unauthorized absence.",
    ),
    RewriteSpec(
        "csh_pt_015",
        "civil_service_admin",
        "csh_performance_training",
        "Which body has the final authority over the syllabus and guidelines for all promotion examinations?",
        explanation="The Federal Civil Service Commission has the final authority to issue the syllabus and guidelines for promotion examinations under PSR 020802(a).",
    ),
    RewriteSpec(
        "csh_pt_018",
        "civil_service_admin",
        "csh_performance_training",
        "Promotion arrears under **PSR** 040104(iii) are calculated from which date?",
        explanation="Under PSR 040104(iii), promotion arrears are calculated from the notional date of promotion.",
    ),
    RewriteSpec(
        "csh_pt_020",
        "civil_service_admin",
        "csh_performance_training",
        "Under the **PSR**, within what maximum period must all officers be placed on the **IPPIS** platform after assumption of duty?",
        explanation="PSR 040102 requires every officer to be placed on the IPPIS platform within two months of assumption of duty.",
    ),
    RewriteSpec(
        "csh_ap_044",
        "civil_service_admin",
        "csh_administrative_procedures",
        "Which **PSR** rule states that an appeal or petition will not be entertained if it is illegible or meaningless?",
        explanation="PSR 110208(iii) states that an appeal or petition will not be entertained if it is illegible or meaningless.",
    ),
    RewriteSpec(
        "csh_it_049",
        "civil_service_admin",
        "csh_innovation_technology",
        "The **OHCSF IT Department Restructuring** focuses on strengthening capacity for what purpose?",
        explanation="The restructuring is intended to strengthen reform coordination and IT architecture management across the civil service.",
    ),
    RewriteSpec(
        "FOI_AO_045",
        "constitutional_law",
        "foi_access_obligations",
        "If an officer discloses information in good faith, believing that the disclosure is required under the **FOI** Act, which section protects that officer from civil or criminal liability?",
        explanation="Section 27 of the FOI Act protects an officer who discloses information in good faith from civil or criminal liability.",
    ),
    RewriteSpec(
        "FOI_EX_002",
        "constitutional_law",
        "foi_exemptions_public_interest",
        "Information relating to national security, defence, or international relations is exempt from disclosure under which section?",
        explanation="Section 12 exempts information whose disclosure could affect national security, defence, or international relations.",
    ),
    RewriteSpec(
        "FOI_EX_005",
        "constitutional_law",
        "foi_exemptions_public_interest",
        "Trade secrets and commercial or financial information obtained in confidence are exempt from disclosure under which section?",
        explanation="Section 15 exempts trade secrets and commercial or financial information that was obtained in confidence.",
    ),
    RewriteSpec(
        "FOI_EX_009",
        "constitutional_law",
        "foi_exemptions_public_interest",
        "Information whose disclosure could endanger the life or physical safety of any person is exempt under which section?",
        explanation="Section 16 exempts information whose disclosure could endanger the life or physical safety of any person.",
    ),
    RewriteSpec(
        "FOI_EX_031",
        "constitutional_law",
        "foi_exemptions_public_interest",
        "The principle that exemptions should be interpreted narrowly in favour of disclosure is contained in which section?",
        explanation="Section 28(1) provides that exemptions should be interpreted narrowly in favour of disclosure.",
    ),
    RewriteSpec(
        "psr_app_040",
        "psr",
        "psr_appointments",
        "Under the **PSR**, who is responsible for appraising an officer who is seconded to another **MDA**?",
        explanation="PSR 020507(iii) provides that an officer on secondment is appraised by the MDA to which the officer is seconded.",
    ),
    RewriteSpec(
        "psr_docx_122",
        "psr",
        "psr_appointments",
        "When does a promotion take effect?",
        explanation="A promotion takes effect from the date stated in the promotion letter.",
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
        "# Question Quality Batch 1 Applied Rewrites",
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
