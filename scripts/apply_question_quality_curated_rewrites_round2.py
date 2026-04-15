#!/usr/bin/env python3
"""Apply a second curated batch of text-corruption rewrites."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_FILE = ROOT / "data" / "topics.json"
DEFAULT_LOG_JSON = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round2.json"
DEFAULT_LOG_MD = ROOT / "docs" / "question_quality_batch1_applied_rewrites_round2.md"


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
        "csh_ap_035",
        "civil_service_admin",
        "csh_administrative_procedures",
        "Under the **PSR**, which authority appraises an officer who is on secondment?",
        options=(
            "The parent MDA only.",
            "The MDA to which the officer is seconded.",
            "The FCSC.",
            "The Auditor-General of the Federation.",
        ),
        explanation="PSR 050206 provides that an officer on secondment is appraised by the MDA to which the officer is seconded.",
    ),
    RewriteSpec(
        "csh_principle_074",
        "civil_service_admin",
        "csh_principles_ethics",
        "What should happen to arrears of revenue that remain outstanding from previous years?",
        options=(
            "They should be reported separately to the Minister of Finance.",
            "They remain the sole accountability of the previous Accounting Officer.",
            "They should be automatically written off.",
            "They should be included in the current year's arrears of revenue returns.",
        ),
        explanation="Financial Regulation 230(iii) requires arrears of revenue returns to include all arrears still outstanding from previous years unless they have been formally written off.",
    ),
    RewriteSpec(
        "csh_sdg_032",
        "civil_service_admin",
        "csh_service_delivery_grievance",
        "What is the consequence if an appeal or petition is illegible or meaningless under **Rule 110208(iii)**?",
        explanation="Rule 110208(iii) provides that an appeal or petition will not be entertained if it is illegible or meaningless.",
    ),
    RewriteSpec(
        "ethics_091",
        "civil_service_admin",
        "eth_values_integrity",
        "What should happen to arrears of revenue that remain outstanding from previous years?",
        options=(
            "They should be included in the current year's arrears of revenue returns.",
            "They should be reported separately to the Minister of Finance.",
            "They should be automatically written off.",
            "They remain the sole duty of the previous Accounting Officer.",
        ),
        explanation="Financial Regulation 230(iii) requires arrears of revenue returns to include all arrears still outstanding from previous years unless they have been formally written off.",
    ),
    RewriteSpec(
        "competency_verbal_081",
        "competency_framework",
        "comp_verbal_reasoning",
        "How is a cheque or bank draft that is returned to the sender, redirected, or remitted to another station recorded?",
        options=(
            "By making an appropriate entry in the Paper Money Register.",
            "By giving only verbal notice to the sender.",
            "By recording it in the General Ledger.",
            "By returning it without making any record.",
        ),
        explanation="Financial Regulation 233(iii) requires an appropriate entry to be made in the Paper Money Register, with a reference to the covering memorandum or remittance voucher.",
    ),
    RewriteSpec(
        "clg_legal_compliance_gen_071",
        "constitutional_law",
        "clg_legal_compliance",
        "Which approach best promotes effective legal and statutory compliance?",
        options=(
            "Closing cases without validating the facts or keeping records.",
            "Using lawful criteria and documenting each decision step transparently.",
            "Treating exceptions as routine without documented justification.",
            "Delaying decisions until issues escalate into avoidable crises.",
        ),
        explanation="Effective legal compliance requires the consistent use of lawful criteria together with transparent documentation of each decision taken.",
    ),
    RewriteSpec(
        "fin_bgt_045",
        "financial_regulations",
        "fin_budgeting",
        "Within what timeframe must promotion arrears be paid after a promotion is effected?",
        explanation="Promotion arrears must be paid within the year in which the promotion is effected, in line with Rule 040104(iii).",
    ),
    RewriteSpec(
        "fin_pro_066",
        "financial_regulations",
        "fin_procurement",
        "What does the Due Process policy seek to ensure in order to prevent extra-budgetary spending in MDAs?",
        options=(
            "That MDAs may spend freely outside approved budgets.",
            "That projects may be funded even without budget provision.",
            "That funds must come only from international donors.",
            "That only projects with due appropriation by the National Assembly are certified and funded.",
        ),
        explanation="The Due Process policy is intended to prevent extra-budgetary spending by ensuring that only projects with due appropriation by the National Assembly are certified and funded for execution.",
    ),
    RewriteSpec(
        "neg_structure_bodies_gen_079",
        "leadership_management",
        "neg_structure_bodies",
        "Under the NPSNC structure, which council represents the senior staff category, typically Grade Level 07 and above?",
        explanation="Within the NPSNC structure, Council I represents the senior staff category, which typically covers Grade Level 07 and above.",
    ),
    RewriteSpec(
        "circ_leave_welfare_allowances_gen_083",
        "psr",
        "circ_leave_welfare_allowances",
        "If a cashier or officer temporarily leaves receipt books with another officer, who is accountable for any misuse?",
        options=(
            "The Accounting Officer.",
            "The temporary officer.",
            "The Head of Accounts.",
            "The cashier or officer who left the receipts.",
        ),
        explanation="Financial Regulation 1212(iii) states that the cashier or officer who leaves receipts with another officer on a temporary basis remains accountable for any misuse.",
    ),
    RewriteSpec(
        "fin_gen_024",
        "financial_regulations",
        "fin_general",
        "Who is responsible for issuing receipts for government revenue when it is collected?",
        explanation="Revenue Collectors are responsible for issuing receipts for all government revenue they collect.",
    ),
    RewriteSpec(
        "FOI_EX_044",
        "constitutional_law",
        "foi_exemptions_public_interest",
        "Information concerning trade secrets submitted to a government regulator is exempt under **Section 15** only if the information was:",
        explanation="Section 15 protects trade secrets and commercial or financial information only where the information was obtained or submitted in confidence.",
    ),
    RewriteSpec(
        "FOI_OP_040",
        "constitutional_law",
        "foi_offences_penalties",
        "What must be included in the annual FOI compliance report submitted by the Attorney-General?",
        explanation="The annual FOI compliance report must summarize implementation metrics, including the number of requests received, granted, and denied across public institutions.",
    ),
    RewriteSpec(
        "FOI_OP_043",
        "constitutional_law",
        "foi_offences_penalties",
        "Which **FOI** provision states that exemptions must be narrowly construed?",
        explanation="Section 28(1) of the FOI Act states that exemptions must be interpreted narrowly in favour of disclosure.",
    ),
    RewriteSpec(
        "ict_eg_100",
        "ict_management",
        "ict_e_governance",
        "Which Nigerian public agency uses the Bimodal Voter Accreditation System (BVAS) for voter accreditation?",
        explanation="INEC deploys the Bimodal Voter Accreditation System (BVAS) for voter accreditation during elections in Nigeria.",
    ),
    RewriteSpec(
        "policy_constitution_063",
        "policy_analysis",
        "pol_formulation_cycle",
        "Which term best describes the return of unspent budget balances at year end to the Treasury?",
        options=(
            "Operational appropriation under institutional controls.",
            "Remittance to the Consolidated Revenue Fund or Treasury Single Account.",
            "Imprest within an approved implementation process.",
            "Virement under formal evaluation criteria.",
        ),
        explanation="At year end, unspent budget balances are returned to the Treasury through remittance to the Consolidated Revenue Fund or the Treasury Single Account, in line with public finance rules.",
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
        "# Question Quality Batch 1 Applied Rewrites Round 2",
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
