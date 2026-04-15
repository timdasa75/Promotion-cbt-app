#!/usr/bin/env python3
"""Round 86: normalize psr_allowances non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_allowances"

UPDATES = {
    "psr_allow_014": {
        "question": "When does acting allowance cease to be payable?",
        "options": [
            "After three months in every case.",
            "When the officer resumes the substantive post.",
            "After one year of acting service.",
            "When substantive promotion is approved.",
        ],
        "explanation": "Acting allowance ceases when the officer resumes the substantive post or otherwise stops performing the duties that justified the acting appointment.",
        "keywords": ["acting_allowance", "cessation", "substantive_post", "psr_allowances"],
    },
    "psr_allow_030": {
        "question": "When is an officer entitled to passage allowance?",
        "options": [
            "Posting on transfer involving relocation.",
            "Proceeding on casual leave.",
            "Voluntary resignation from service.",
            "Attendance at training within Nigeria.",
        ],
        "explanation": "Passage allowance is payable when an officer is posted on transfer in circumstances that involve relocation as provided by the applicable rules.",
        "keywords": ["passage_allowance", "transfer", "relocation", "psr_allowances"],
    },
    "psr_allow_031": {
        "question": "What is the meaning of 'allowance' under the PSR 2021?",
        "options": [
            "General extra payment for every officer.",
            "Financial benefit meant for a specific official expenditure or condition of service.",
            "Compulsory monthly benefit payable in every workflow.",
            "Bonus for outstanding performance.",
        ],
        "explanation": "Under the PSR, an allowance is a financial benefit attached to a specific official expenditure, responsibility, or condition of service rather than a general bonus.",
        "keywords": ["allowance_definition", "condition_of_service", "official_expenditure", "psr_2021"],
    },
    "psr_allow_041": {
        "question": "When does responsibility allowance cease?",
        "options": [
            "When the officer is transferred in every case.",
            "When the officer proceeds on leave.",
            "When the officer ceases to hold the additional responsibility.",
            "When the officer retires automatically.",
        ],
        "explanation": "Responsibility allowance ceases once the officer no longer performs the additional responsibility for which the allowance was approved.",
        "keywords": ["responsibility_allowance", "cessation", "additional_responsibility", "psr_allowances"],
    },
    "psr_allow_049": {
        "question": "Salary payment to officers should not be made in advance of work except when what condition applies?",
        "options": [
            "Officer is on leave.",
            "Officer is retiring from service.",
            "Specific approval for advance payment has been granted by the Accounting Officer.",
            "Officer makes a personal request.",
        ],
        "explanation": "Salary should not be paid in advance except where the Accounting Officer has specifically approved the advance under the applicable financial rules.",
        "keywords": ["salary_payment", "advance_payment", "accounting_officer", "financial_rules"],
    },
    "psr_allow_051": {
        "question": "How is salary for part of a month calculated on retirement or termination of appointment?",
        "options": [
            "At a fixed rate.",
            "On a weekly basis.",
            "Without payment for the incomplete month.",
            "On a pro-rata basis.",
        ],
        "explanation": "Financial Regulation 1504 provides that salary for part of a month on retirement or termination is calculated on a pro-rata basis.",
        "keywords": ["retirement", "termination_of_appointment", "pro_rata", "financial_regulation_1504"],
    },
    "psr_allow_053": {
        "question": "What is a key duty of the officer controlling expenditure under FR 1519?",
        "options": [
            "Manual calculation of every salary item.",
            "Personal approval of every salary payment.",
            "Ensuring that standard personal emolument records show rate of pay, incremental date, allowances, and deductions.",
            "Keeping every record personally under lock without payroll processing.",
        ],
        "explanation": "Financial Regulation 1519 requires the officer controlling expenditure to ensure that the standard personal emolument records accurately show the officer's rate of pay, incremental date, allowances, and deductions.",
        "keywords": ["officer_controlling_expenditure", "personal_emolument_records", "fr_1519", "salary_records"],
    },
    "psr_allow_055": {
        "question": "In which circumstance is an acting appointment not regarded as having ceased?",
        "options": [
            "When the acting officer proceeds on casual or special leave.",
            "When the substantive holder resumes duty.",
            "When the acting officer takes up another post.",
            "When the acting officer is promoted substantively.",
        ],
        "explanation": "Rule 020708 states that an acting officer is not regarded as relinquishing the acting appointment merely because the officer proceeds on casual or special leave.",
        "keywords": ["acting_appointment", "casual_leave", "special_leave", "rule_020708"],
    },
    "psr_allow_057": {
        "question": "For what promotion purpose may an officer's compulsory confirmation examination result be used?",
        "options": [
            "Promotion to the next grade level in every case.",
            "Promotion from a junior post to a senior post.",
            "Promotion after accelerated-level examination only.",
            "No promotion purpose at all.",
        ],
        "explanation": "Rule 030502 states that the compulsory confirmation examination result may be used for promotion from a junior post to a senior post, subject to other conditions.",
        "keywords": ["compulsory_confirmation_examination", "promotion", "junior_post", "senior_post"],
    },
    "psr_allow_059": {
        "question": "Which payment is not exempt from Stamp Duty under all conditions?",
        "options": [
            "Pensions, gratuities, and compassionate allowances.",
            "Wages.",
            "Payments for goods supplied or services rendered at N1,500.00.",
            "Salary advances.",
        ],
        "explanation": "Financial Regulation 620(b)(i) exempts payments for goods supplied or services rendered only when the amount is below the stated threshold, so a payment of N1,500.00 is not exempt under all conditions.",
        "keywords": ["stamp_duty", "goods_and_services", "financial_regulation_620", "payment_threshold"],
    },
    "psr_allow_064": {
        "question": "What happens if an officer on an acting appointment proceeds on casual or special leave?",
        "options": [
            "The acting appointment is suspended.",
            "The acting appointment ceases.",
            "The officer is not regarded as relinquishing the acting duties.",
            "The acting appointment is automatically extended.",
        ],
        "explanation": "Rule 020708 states that an officer on an acting appointment who proceeds on casual or special leave is not regarded as relinquishing the duties and responsibilities of the acting appointment.",
        "keywords": ["acting_appointment", "casual_leave", "special_leave", "rule_020708"],
    },
    "psr_allowances_gen_001": {
        "question": "In the context of Allowances, Pay & Benefits, which action best demonstrates sound governance?",
        "options": [
            "Use of approved procedures with complete records.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Sound governance in allowances, pay, and benefits depends on approved procedures, complete records, and decisions that can be reviewed later.",
        "keywords": ["psr", "psr_allowances", "governance", "complete_records"],
    },
    "psr_allowances_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on escalation of material compliance gaps within Allowances, Pay & Benefits?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Escalation of material compliance gaps is strongest when control weaknesses are identified early and referred promptly for higher review.",
        "keywords": ["psr", "psr_allowances", "compliance_gap_escalation", "early_identification"],
    },
    "psr_allowances_gen_007": {
        "question": "For effective Allowances, Pay & Benefits administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "psr_allowances", "promotion_standards", "eligibility_review"],
    },
    "psr_allowances_gen_009": {
        "question": "When handling Allowances, Pay & Benefits matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "psr_allowances", "documented_procedure", "recordkeeping"],
    },
    "psr_allowances_gen_011": {
        "question": "In the context of Allowances, Pay & Benefits, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "psr_allowances", "public_accountability", "traceable_decisions"],
    },
    "psr_allowances_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Allowances, Pay & Benefits?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "psr_allowances", "risk_control", "documented_mitigation"],
    },
    "psr_allowances_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Allowances, Pay & Benefits?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "psr_allowances", "operational_discipline", "workflow_verification"],
    },
    "psr_allowances_gen_017": {
        "question": "For effective Allowances, Pay & Benefits administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "psr_allowances", "record_management", "status_updates"],
    },
    "psr_allowances_gen_019": {
        "question": "When handling Allowances, Pay & Benefits matters, which choice best reflects sound governance standards?",
        "options": [
            "Use of approved procedures with complete records.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Sound governance standards require approved procedures, complete records, and decisions that can be reviewed objectively.",
        "keywords": ["psr", "psr_allowances", "governance_standards", "approved_procedures"],
    },
    "psr_allowances_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Allowances, Pay & Benefits?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "psr_allowances", "disciplinary_process", "fair_hearing"],
    },
    "psr_allowances_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Allowances, Pay & Benefits administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "psr_allowances", "promotion_standards", "advancement_review"],
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
            for key, value in patch.items():
                question[key] = value
            updated += 1
        break
    write_json(TARGET, payload)
    print(f"Applied round 86 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
