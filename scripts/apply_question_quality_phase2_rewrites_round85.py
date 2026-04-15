#!/usr/bin/env python3
"""Round 85: normalize psr_leave non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_leave"

UPDATES = {
    "psr_leave_018": {
        "question": "Who must approve study leave with pay exceeding one year?",
        "options": [
            "Head of Department only.",
            "Permanent Secretary or Head of Extra-Ministerial Office with FCSC approval.",
            "Director of Administration only.",
            "Federal Civil Service Commission acting alone without the MDA head.",
        ],
        "explanation": "Study leave with pay exceeding one year requires approval through the Permanent Secretary or Head of Extra-Ministerial Office and the relevant approval of the Federal Civil Service Commission.",
        "keywords": ["study_leave", "approval", "fcsc", "permanent_secretary"],
    },
    "psr_leave_019": {
        "question": "What is the consequence of failing to resume duty after the expiration of approved leave?",
        "options": [
            "Automatic extension of leave.",
            "Loss of pay for the excess days with possible disciplinary action.",
            "Written apology only.",
            "Automatic dismissal in every case.",
        ],
        "explanation": "Failure to resume duty after approved leave expires may lead to loss of pay for the excess days and disciplinary action under the PSR.",
        "keywords": ["leave_expiration", "failure_to_resume", "loss_of_pay", "disciplinary_action"],
    },
    "psr_leave_032": {
        "question": "What happens when a public holiday falls within an officer's approved annual leave period?",
        "options": [
            "Addition of the day to the leave period.",
            "Counting of the day as part of the approved leave.",
            "Postponement of the leave period.",
            "Return to duty on the holiday.",
        ],
        "explanation": "A public holiday that falls within approved annual leave counts as part of the leave period rather than extending it.",
        "keywords": ["public_holiday", "annual_leave", "leave_period", "psr_leave"],
    },
    "psr_leave_048": {
        "question": "How is leave entitlement affected when an officer is interdicted?",
        "options": [
            "Continuation of full leave benefits.",
            "Suspension of leave entitlement until reinstatement.",
            "Grant of half leave entitlement.",
            "Automatic monetisation of leave.",
        ],
        "explanation": "An officer under interdiction does not continue to enjoy normal leave entitlement until the matter is resolved and the officer is reinstated where appropriate.",
        "keywords": ["interdiction", "leave_entitlement", "reinstatement", "psr_leave"],
    },
    "psr_leave_053": {
        "question": "Which condition applies before a non-pensionable officer may be granted leave?",
        "options": [
            "Leave at the sole discretion of the Permanent Secretary.",
            "Entitlement to leave in accordance with Chapter Twelve of the Rules.",
            "Automatic annual leave without reference to the Rules.",
            "No leave entitlement under the Rules.",
        ],
        "explanation": "Rule 021214 provides that a non-pensionable officer may be granted leave only in accordance with the provisions of Chapter Twelve of the Public Service Rules.",
        "keywords": ["non_pensionable_officer", "leave_condition", "chapter_twelve", "rule_021214"],
    },
    "psr_leave_054": {
        "question": "What is the role of the completed personal emolument form under FR 1521?",
        "options": [
            "Basis for determining promotion.",
            "Basis for calculating pension.",
            "Basis for justifying annual leave.",
            "Basis for opening audited group registers before payroll inclusion.",
        ],
        "explanation": "Financial Regulation 1521(ii) states that the completed personal emolument form is used to open the group registers, which must be audited before an officer is placed on payroll.",
        "keywords": ["personal_emolument_form", "group_register", "payroll", "fr_1521"],
    },
    "psr_leave_056": {
        "question": "What is the consequence of reproducing any part of the 2021 edition of the Public Service Rules without express approval or authorization?",
        "options": [
            "Exposure to a minor fine only.",
            "Prohibition because the publication is copyrighted.",
            "Requirement for verbal notification only.",
            "Encouragement for wider dissemination.",
        ],
        "explanation": "The 2021 edition of the Public Service Rules is copyrighted, so reproduction of any part requires express approval or authorization from the Office of the Head of the Civil Service of the Federation.",
        "keywords": ["psr_2021", "copyright", "reproduction", "authorization"],
    },
    "psr_leave_063": {
        "question": "When should a refund of a deposit be made?",
        "options": [
            "At the end of the financial year.",
            "As soon as it is due after the necessary checks have been completed.",
            "Only with the explicit approval of the Minister of Finance.",
            "Only when the deposit account has a sufficient balance.",
        ],
        "explanation": "Financial Regulation 1307 states that refunds of deposits are made as soon as they are due, provided the necessary checks and reconciliations have been completed.",
        "keywords": ["deposit_refund", "financial_regulation_1307", "due_payment", "checks_and_reconciliation"],
    },
    "psr_leave_068": {
        "question": "What must a person previously employed in the public service, and dismissed or called upon to resign, obtain before reappointment?",
        "options": [
            "Immediate eligibility for reappointment.",
            "Permanent bar from reappointment.",
            "Approval of the Commission irrespective of delegated powers.",
            "Prior approval of the Head of the Civil Service of the Federation only.",
        ],
        "explanation": "Rule 020207(i)(b) requires such a person to obtain the approval of the Commission, irrespective of any delegation of the Commission's powers, before reappointment can be considered.",
        "keywords": ["reappointment", "dismissed_officer", "commission_approval", "rule_020207"],
    },
    "psr_leave_073": {
        "question": "When can an acting appointment be made?",
        "options": [
            "When an officer is merely being considered for promotion.",
            "When a duty post not lower than SGL 14 is unavailable because the substantive holder is absent.",
            "Only when a substantive post becomes vacant permanently.",
            "Only for a very short period without reference to post level.",
        ],
        "explanation": "Rule 020701 provides that an acting appointment may be made where a duty post not lower than SGL 14 is unattended because the substantive holder is on leave, secondment, or otherwise unavailable.",
        "keywords": ["acting_appointment", "sgl_14", "substantive_holder", "rule_020701"],
    },
    "psr_leave_074": {
        "question": "What is the effective date of an acting appointment?",
        "options": [
            "Date the FCSC is notified.",
            "First day of the month.",
            "Date of the gazette notice alone.",
            "Date the officer substantively assumes the duties of the post.",
        ],
        "explanation": "Rule 020705 provides that the acting appointment takes effect from the date the officer substantively takes over the duties and responsibilities of the post, as authorized in the gazette notice.",
        "keywords": ["acting_appointment", "effective_date", "gazette_notice", "rule_020705"],
    },
    "psr_leave_gen_001": {
        "question": "In the context of Leave, Absence & Holidays, which action best demonstrates sound governance?",
        "options": [
            "Use of approved leave procedures with complete records.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Sound governance in leave administration depends on approved procedures, complete records, and decisions that can be reviewed later.",
        "keywords": ["psr", "psr_leave", "governance", "complete_records"],
    },
    "psr_leave_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on escalation of material compliance gaps within Leave, Absence & Holidays?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Escalation of material compliance gaps is strongest when control weaknesses are identified early and referred promptly for higher review.",
        "keywords": ["psr", "psr_leave", "compliance_gap_escalation", "early_identification"],
    },
    "psr_leave_gen_007": {
        "question": "For effective Leave, Absence & Holidays administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "psr_leave", "promotion_standards", "eligibility_review"],
    },
    "psr_leave_gen_009": {
        "question": "When handling Leave, Absence & Holidays matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "psr_leave", "documented_procedure", "recordkeeping"],
    },
    "psr_leave_gen_011": {
        "question": "In the context of Leave, Absence & Holidays, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "psr_leave", "public_accountability", "traceable_decisions"],
    },
    "psr_leave_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Leave, Absence & Holidays?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "psr_leave", "risk_control", "documented_mitigation"],
    },
    "psr_leave_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Leave, Absence & Holidays?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "psr_leave", "operational_discipline", "workflow_verification"],
    },
    "psr_leave_gen_017": {
        "question": "For effective Leave, Absence & Holidays administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "psr_leave", "record_management", "status_updates"],
    },
    "psr_leave_gen_019": {
        "question": "When handling Leave, Absence & Holidays matters, which choice best reflects sound governance standards?",
        "options": [
            "Use of approved leave procedures with complete records.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Sound governance standards require approved procedures, complete records, and decisions that can be reviewed objectively.",
        "keywords": ["psr", "psr_leave", "governance_standards", "approved_procedures"],
    },
    "psr_leave_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Leave, Absence & Holidays?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "psr_leave", "disciplinary_process", "fair_hearing"],
    },
    "psr_leave_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Leave, Absence & Holidays administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "psr_leave", "promotion_standards", "advancement_review"],
    },
    "psr_leave_gen_026": {
        "question": "A unit handling Leave, Absence & Holidays receives a case with competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Bypassed review checkpoints under time pressure.",
            "Convenience over approved process requirements.",
            "Consistent application of PSR provisions with auditable records.",
            "Discretionary shortcuts regardless of safeguards.",
        ],
        "explanation": "Compliance and service quality are preserved when the applicable PSR provisions are applied consistently and the record remains auditable.",
        "keywords": ["psr", "psr_leave", "compliance", "auditable_records"],
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
    print(f"Applied round 85 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
