#!/usr/bin/env python3
"""Apply a third curated batch of text-corruption rewrites."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round3.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round3.md"


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
        "csh_principle_045",
        "civil_service_admin",
        "csh_principles_ethics",
        "Under which **PSR** rule are civil servants discouraged from joining or maintaining membership in any **Secret Society**?",
        explanation="PSR 020211 explicitly prohibits public officers from joining or maintaining membership in any secret society.",
    ),
    RewriteSpec(
        "clg_lc_036",
        "constitutional_law",
        "clg_legal_compliance",
        "If additional grounds for dismissal are disclosed during a disciplinary inquiry, what must the **FCSC** furnish the officer with?",
        explanation="If further grounds are disclosed during the inquiry, the officer must be furnished with a written statement of the new grounds and the same due-process steps must be repeated as for the original grounds under Rule 100307(viii).",
    ),
    RewriteSpec(
        "fin_bgt_012",
        "financial_regulations",
        "fin_budgeting",
        "Promotion arrears are payable within the year the promotion is effected and are calculated from which date?",
        explanation="Rule 040104(iii) provides that promotion arrears are paid within the year the promotion is effected and are calculated from the effective date of the promotion, usually 1 January of that year.",
    ),
    RewriteSpec(
        "fin_bgt_044",
        "financial_regulations",
        "fin_budgeting",
        "If an officer is promoted and the new salary grade level does not overlap the old grade level, from what date does payment at the minimum point of the new grade level take effect?",
        explanation="Where the new grade level does not overlap the old one, emolument payment at the minimum point of the new level takes effect from the effective date of promotion, typically 1 January of the promotion year.",
    ),
    RewriteSpec(
        "fin_bgt_065",
        "financial_regulations",
        "fin_budgeting",
        "Is virement from a Recurrent Expenditure Head of Account to a Capital Expenditure Head of Account allowed?",
        explanation="No. Financial Regulation 316(iii) states that virement from a Recurrent Expenditure Head of Account to a Capital Expenditure Head of Account, and vice versa, is not allowed.",
    ),
    RewriteSpec(
        "IRA_130",
        "general_current_affairs",
        "ca_international_affairs",
        "An officer who is injured in the course of official duty and is permanently invalided will retire in accordance with which rule?",
        explanation="An officer who is permanently invalided after injury in the course of official duty retires in accordance with Rule 120244.",
    ),
    RewriteSpec(
        "ca_national_events_gen_073",
        "general_current_affairs",
        "ca_national_events",
        "What is the minimum rank required for an officer empowered to draw cash or cheques on the strength of a Cheque Order Form?",
        options=(
            "Senior Executive Officer.",
            "Accountant II or Higher Executive Officer (Accounts).",
            "Accountant I.",
            "Accountant III.",
        ),
        explanation="Financial Regulation 628 provides that officers authorised to draw cash or cheques on the strength of a Cheque Order Form must not be below the rank of Accountant II or Higher Executive Officer (Accounts).",
    ),
    RewriteSpec(
        "ict_eg_027",
        "ict_management",
        "ict_e_governance",
        "Which three key areas are included in the **OHCSF ICT Transformation Agenda**?",
        explanation="The OHCSF ICT Transformation Agenda includes the implementation of HRMIS, Enterprise Content Management, and digitization of records.",
    ),
    RewriteSpec(
        "ict_eg_070",
        "ict_management",
        "ict_e_governance",
        "What does the **Cloud Migration of MDAs** involve moving services to?",
        explanation="Cloud migration moves services such as email and document management from local infrastructure to centralized hosting platforms accessible via the internet.",
    ),
    RewriteSpec(
        "NLR_S_016",
        "leadership_management",
        "neg_structure_bodies",
        "Under the NPSNC structure, which council represents the senior staff category, typically Grade Level 07 and above?",
        explanation="Under the NPSNC structure, Council I represents the senior staff category, which generally covers Grade Level 07 and above.",
    ),
    RewriteSpec(
        "leadership_lsm_024",
        "leadership_management",
        "lead_principles_styles",
        "In the Civil Service Handbook, **Nepotism** is explicitly discouraged because it violates which principle?",
        explanation="Nepotism violates the principle of meritocracy because appointments and advancement should be based on merit rather than family or personal connections.",
    ),
    RewriteSpec(
        "policy_constitution_007",
        "policy_analysis",
        "pol_formulation_cycle",
        "Which chapter of the 1999 Constitution of Nigeria guarantees fundamental human rights?",
        explanation="Chapter IV of the 1999 Constitution of the Federal Republic of Nigeria guarantees fundamental human rights.",
    ),
    RewriteSpec(
        "psr_app_024",
        "psr",
        "psr_appointments",
        "Under the **PSR**, after how many years must pool officers in the Service be mandatorily posted?",
        explanation="PSR 020602(iii) makes the posting of pool officers mandatory after every four years.",
    ),
    RewriteSpec(
        "psr_app_035",
        "psr",
        "psr_appointments",
        "Which rule prohibits an **MDA** from accepting staff on secondment without endorsement by the Federal Civil Service Commission or Board?",
        explanation="PSR 020507(iii) prohibits an MDA from accepting staff on secondment without endorsement by the Federal Civil Service Commission or Board.",
    ),
    RewriteSpec(
        "psr_docx_016",
        "psr",
        "psr_allowances",
        "What are \"Junior Posts\"?",
        explanation="Junior Posts are posts in Ministries and Extra-Ministerial Offices that attract emoluments on Grade Level 06 and below, including their equivalents.",
    ),
    RewriteSpec(
        "psr_med_001",
        "psr",
        "psr_medical",
        "According to **PSR** 130101, what is the general policy on the medical treatment of public officers?",
        explanation="PSR 130101 provides that Government shall ensure medical attention for public officers and their families in approved medical facilities.",
    ),
    RewriteSpec(
        "csh_principle_016",
        "psr",
        "psr_general_admin",
        "Under **PSR Rule 100429**, an officer on leave of absence must obtain express approval before engaging in what activity?",
        explanation="Rule 100429 requires an officer on leave of absence to obtain express approval before accepting any paid employment.",
    ),
    RewriteSpec(
        "ppa_bid_043",
        "procurement_act",
        "proc_bidding_evaluation",
        "If a bidder attempts to influence the evaluation process through bribery or collusion, penalties are prescribed under which section?",
        explanation="Section 58 of the Public Procurement Act prescribes penalties for bribery, collusion, bid rigging, and other fraudulent or corrupt practices.",
    ),
    RewriteSpec(
        "ppa_elb_045",
        "procurement_act",
        "proc_eligibility_consultants_budgeting",
        "If a consulting contract is found to contain gross irregularities, under which section may the BPP suspend or cancel the proceedings?",
        explanation="Section 53 empowers the Bureau of Public Procurement to suspend or cancel proceedings where gross irregularities are detected.",
    ),
    RewriteSpec(
        "ppa_ethic_002",
        "procurement_act",
        "proc_transparency_ethics",
        "The intentional act of fixing or manipulating bid outcomes to restrict competition is known as collusion or bid rigging. Under which section is it prohibited?",
        explanation="Section 58 prohibits collusion, bid rigging, and other fraudulent or corrupt practices in public procurement.",
    ),
    RewriteSpec(
        "ppa_ethic_009",
        "procurement_act",
        "proc_transparency_ethics",
        "Which section enshrines the principle that all bidders must be treated without prejudice or discrimination throughout the procurement process?",
        explanation="Section 16 sets out the principles of procurement, including the requirement for fair and equal treatment of all bidders.",
    ),
    RewriteSpec(
        "ppa_ethic_015",
        "procurement_act",
        "proc_transparency_ethics",
        "An officer who fails to report an offer of bribe or inducement immediately to the appropriate authority violates ethical standards under which **PSR** chapter?",
        explanation="Chapter 15 emphasizes integrity and requires public officers to reject and promptly report offers of bribe or inducement to the appropriate authority.",
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
        "# Question Quality Batch 1 Applied Rewrites Round 3",
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
