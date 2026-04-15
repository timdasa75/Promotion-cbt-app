#!/usr/bin/env python3
"""Round 80: normalize the remaining circ_leave_welfare_allowances non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "circ_leave_welfare_allowances"

UPDATES = {
    "circ_leave_welfare_allowances_gen_013": {
        "question": "Which practice best supports risk control in leave, welfare, and allowance administration?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience ahead of policy requirements.",
            "Repeated non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control in leave, welfare, and allowance administration depends on identifying risks early, applying mitigation, and keeping a documented trail for review.",
        "keywords": ["leave_welfare_allowances", "risk_control", "documented_mitigation", "oversight"],
    },
    "circ_leave_welfare_allowances_gen_031": {
        "question": "Which practice best demonstrates risk control in leave, welfare, and allowance administration?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Repeated non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Skipped review checks for convenience.",
        ],
        "explanation": "A strong risk-control practice in this area begins with early risk identification, documented mitigation, and consistent compliance checks.",
        "keywords": ["leave_welfare_allowances", "risk_control", "compliance_checks", "documented_mitigation"],
    },
    "circ_leave_welfare_allowances_gen_037": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Leave, Welfare & Allowances. Which action most directly strengthens risk management while preserving records for audit and oversight?",
        "options": [
            "Convenience over policy requirements.",
            "Early identification of control gaps with prompt escalation of material exceptions.",
            "Continued non-compliant procedures after feedback.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Risk management improves when control gaps are identified early, material exceptions are escalated promptly, and the records trail is preserved for audit review.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "risk_management", "audit_trail"],
    },
    "circ_leave_welfare_allowances_gen_041": {
        "question": "In a time-sensitive file under Circulars: Leave, Welfare & Allowances, which step best preserves promotion standards while maintaining fairness and legal compliance?",
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Inconsistent rule application across similar cases.",
            "Verification of eligibility requirements before recommending advancement.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Promotion standards are protected when eligibility requirements are verified before advancement is recommended, especially in a time-sensitive file.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "promotion_standards", "eligibility_verification"],
    },
    "circ_leave_welfare_allowances_gen_043": {
        "question": "A desk officer handling Circulars: Leave, Welfare & Allowances receives a case that requires documented procedure. What should be done first within approved timelines and governance standards?",
        "options": [
            "Convenience over policy requirements.",
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "The first step is to follow the documented procedure and keep complete records, because that preserves governance standards and makes later review possible.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "documented_procedure", "recordkeeping"],
    },
    "circ_leave_welfare_allowances_gen_045": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Leave, Welfare & Allowances. Which action most directly strengthens public accountability without bypassing review procedures?",
        "options": [
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Traceable decisions with evidence-based justification.",
            "Continued non-compliant procedures after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable, reasons are evidence-based, and the supporting record can withstand later scrutiny.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "public_accountability", "traceable_decisions"],
    },
    "circ_leave_welfare_allowances_gen_047": {
        "question": "To improve accountability in Circulars: Leave, Welfare & Allowances, which practice best supports risk control under standard approval and documentation controls?",
        "options": [
            "Convenience over policy requirements.",
            "Early risk identification with documented mitigation.",
            "Inconsistent rule application across similar cases.",
            "Continued non-compliant procedures after feedback.",
        ],
        "explanation": "Accountability improves when risks are identified early, mitigation is documented, and the resulting decisions can be traced through the approved record.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "accountability", "risk_control"],
    },
    "circ_leave_welfare_allowances_gen_049": {
        "question": "In a time-sensitive file under Circulars: Leave, Welfare & Allowances, which step best preserves operational discipline within approved timelines and governance standards?",
        "options": [
            "Bypassed review and approval controls.",
            "Continued non-compliant procedures after feedback.",
            "Approved workflow use with output verification before closure.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Operational discipline is preserved when the approved workflow is followed and outputs are verified before the file is closed.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "operational_discipline", "workflow_verification"],
    },
    "circ_leave_welfare_allowances_gen_051": {
        "question": "A desk officer handling Circulars: Leave, Welfare & Allowances receives a case that requires record management. What should be done first to preserve records for audit and oversight?",
        "options": [
            "Convenience over policy requirements.",
            "Accurate file maintenance with status updates at each control point.",
            "Bypassed review and approval controls.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Good record management starts with accurate file maintenance and timely status updates so that each control point can be audited later.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "record_management", "status_updates"],
    },
    "circ_leave_welfare_allowances_gen_057": {
        "question": "In a time-sensitive file under Circulars: Leave, Welfare & Allowances, which step best preserves disciplinary process while preserving records for audit and oversight?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliant procedures after feedback.",
        ],
        "explanation": "A disciplinary process is preserved by observing due process, allowing fair hearing, and documenting each decision for later review.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "disciplinary_process", "fair_hearing"],
    },
    "circ_leave_welfare_allowances_gen_059": {
        "question": "A desk officer handling Circulars: Leave, Welfare & Allowances receives a case that requires promotion standards. What should be done first without bypassing review procedures?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Eligibility confirmation before advancement recommendation.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any recommendation for advancement is made.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "promotion_standards", "advancement_review"],
    },
    "circ_leave_welfare_allowances_gen_060": {
        "question": "A unit handling Circulars: Leave, Welfare & Allowances receives a case with competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Consistent application of PSR provisions with auditable records.",
            "Bypassed review checkpoints under time pressure.",
            "Convenience over approved process requirements.",
            "Discretionary shortcuts regardless of controls.",
        ],
        "explanation": "Compliance and service quality are preserved when the applicable PSR provisions are applied consistently and the record remains auditable.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "compliance", "auditable_records"],
    },
    "circ_leave_welfare_allowances_gen_062": {
        "question": "A supervisor is reviewing gaps in Circulars: Leave, Welfare & Allowances. Which option best strengthens control and consistency?",
        "options": [
            "Consistent application of PSR provisions with auditable records.",
            "Bypassed review checkpoints under time pressure.",
            "Convenience over approved process requirements.",
            "Inconsistent criteria across similar cases.",
        ],
        "explanation": "Control and consistency improve when the same PSR provisions are applied across similar cases and the resulting records remain auditable.",
        "keywords": ["psr", "circ_leave_welfare_allowances", "control", "consistency"],
    },
    "circ_leave_welfare_allowances_gen_066": {
        "question": "Within how many days must unclaimed salaries, allowances, and pensions be paid back to the Treasury?",
        "options": [
            "Seven days after withdrawal.",
            "At the end of the financial year.",
            "Thirty days after withdrawal.",
            "Immediately upon cash withdrawal.",
        ],
        "explanation": "Financial Regulation 1513(i) requires unclaimed salaries, allowances, and pensions to be paid back to the Treasury within seven days of withdrawal.",
        "keywords": ["unclaimed_salaries", "allowances", "pensions", "treasury_refund_deadline"],
    },
    "circ_leave_welfare_allowances_gen_077": {
        "question": "What is the status of an officer who leaves the service because of failing a compulsory examination?",
        "options": [
            "Immediate eligibility for reapplication.",
            "Mandatory second examination attempt.",
            "Exit from service without dismissal status.",
            "Automatic demotion in service.",
        ],
        "explanation": "Rule 020906 states that an officer who leaves the service because of failing a compulsory examination is not regarded as having been dismissed from the service.",
        "keywords": ["compulsory_examination", "service_exit", "not_dismissed", "psr_020906"],
    },
    "circ_leave_welfare_allowances_gen_081": {
        "question": "By what time must all standing imprests be retired?",
        "options": [
            "Before the cash-advance holder proceeds on leave.",
            "Within one month of the issue date.",
            "On or before 31 December of the issue year.",
            "Only on the Accountant-General's explicit instruction.",
        ],
        "explanation": "Financial Regulation 1011(i) requires all standing imprests to be retired on or before 31 December of the financial year in which they are issued.",
        "keywords": ["standing_imprest", "retirement_deadline", "31_december", "financial_regulation_1011"],
    },
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    payload = load_json(TARGET)
    updated = 0
    for sub in payload.get("subcategories", []):
        if sub.get("id") != SUBCATEGORY_ID:
            continue
        questions = sub.get("questions", [])
        if questions and isinstance(questions[0], dict) and isinstance(questions[0].get(SUBCATEGORY_ID), list):
            bank = questions[0][SUBCATEGORY_ID]
        else:
            bank = questions
        for question in bank:
            qid = question.get("id")
            if qid not in UPDATES:
                continue
            patch = UPDATES[qid]
            question["question"] = patch["question"]
            question["options"] = patch["options"]
            question["explanation"] = patch["explanation"]
            question["keywords"] = patch["keywords"]
            updated += 1
        break
    write_json(TARGET, payload)
    print(f"Applied round 80 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
