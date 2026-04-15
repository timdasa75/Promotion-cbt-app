#!/usr/bin/env python3
"""Round 84: normalize psr_appointments non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_appointments"

UPDATES = {
    "psr_app_009": {
        "question": "When does the incremental date of an officer appointed or promoted under the PSR become effective?",
        "options": [
            "1 April each year under standard practice.",
            "1 January each year after six months on grade with good performance.",
            "Date of appointment in every case.",
            "Officer's birthday each year.",
        ],
        "explanation": "Under the PSR, the incremental date becomes effective on 1 January each year once the officer has spent at least six months on the grade with satisfactory performance.",
        "keywords": ["incremental_date", "1_january", "six_months_on_grade", "psr_appointments"],
    },
    "psr_app_012": {
        "question": "Under what condition may the normal two-year probation be reduced to not less than six months?",
        "options": [
            "Automatic reduction for good behaviour.",
            "Deduction of prior satisfactory public service in cognate posts.",
            "Reduction on the officer's personal request alone.",
            "Reduction because the officer is under thirty years of age.",
        ],
        "explanation": "The PSR allows the probationary period to be reduced by counting prior satisfactory public service in cognate posts, but not to less than six months.",
        "keywords": ["probation", "reduction", "prior_public_service", "cognate_posts"],
    },
    "psr_app_014": {
        "question": "Which examinations are officers in senior posts required to pass while on probation?",
        "options": [
            "COMPRO I and COMPRO II as prescribed for the relevant level.",
            "Departmental interview only.",
            "No examination at all.",
            "External university examination only.",
        ],
        "explanation": "Senior officers on probation are required to pass the prescribed confirmation examinations for their level, including the appropriate COMPRO requirement where applicable.",
        "keywords": ["senior_posts", "probation", "compro", "confirmation_examination"],
    },
    "psr_app_016": {
        "question": "Which condition applies to transfer or secondment to another service under the PSR?",
        "options": [
            "Officer must be unconfirmed.",
            "Officer must be confirmed and suitably qualified under the Scheme of Service.",
            "Officer must be less than thirty years old.",
            "Officer may move without prior approval.",
        ],
        "explanation": "Transfer or secondment requires a confirmed officer whose qualifications fit the applicable Scheme of Service and the approval process laid down by the PSR.",
        "keywords": ["transfer", "secondment", "confirmed_officer", "scheme_of_service"],
    },
    "psr_app_021": {
        "question": "What periodic return must MDAs make concerning staff on transfer or secondment?",
        "options": [
            "Annual budget return only.",
            "Monthly payroll return only.",
            "Quarterly return to the FCSC and OHCSF on staff on transfer or secondment.",
            "No return at all.",
        ],
        "explanation": "MDAs are required to make quarterly returns to the Federal Civil Service Commission and the Office of the Head of the Civil Service of the Federation on staff on transfer or secondment.",
        "keywords": ["mda_return", "quarterly_return", "transfer", "secondment"],
    },
    "psr_app_026": {
        "question": "How are acting appointments treated under the PSR?",
        "options": [
            "Guaranteed path to substantive promotion.",
            "Necessary interim measure that is not a trial for promotion.",
            "Appointment with a fixed minimum duration of two years.",
            "Arrangement limited to junior staff only.",
        ],
        "explanation": "The PSR treats acting appointments as necessary interim arrangements and not as a trial period for substantive promotion.",
        "keywords": ["acting_appointment", "interim_measure", "not_trial_for_promotion", "psr_appointments"],
    },
    "psr_app_030": {
        "question": "Can a confirmed officer advanced to a training grade be regarded as having been seconded under the PSR?",
        "options": [
            "No, because training grade is always separate from secondment.",
            "Yes, because the officer is treated as seconded for the training period.",
            "Yes, but only if the officer agrees in writing.",
            "Yes, but only if the training is outside Nigeria.",
        ],
        "explanation": "A confirmed officer advanced to a training grade may be treated as seconded for the period of the approved training arrangement.",
        "keywords": ["training_grade", "secondment", "confirmed_officer", "psr_appointments"],
    },
    "psr_app_038": {
        "question": "Which statement is true about contract appointments under the PSR?",
        "options": [
            "Automatic pension entitlement in every case.",
            "Temporary and non-pensionable appointment recorded in a formal agreement.",
            "Appointment unavailable to expatriates.",
            "Automatic conversion to permanent status after two years.",
        ],
        "explanation": "Contract appointments are temporary, non-pensionable arrangements and must be governed by formal written terms.",
        "keywords": ["contract_appointment", "temporary_service", "non_pensionable", "formal_agreement"],
    },
    "psr_app_040": {
        "question": "Who is responsible for appraising an officer seconded to another MDA under the PSR?",
        "options": [
            "The releasing agency only.",
            "The receiving MDA to which the officer is seconded.",
            "The officer personally.",
            "The Federal Civil Service Commission only.",
        ],
        "explanation": "An officer on secondment is appraised by the MDA to which the officer is seconded, because that MDA supervises the officer's actual performance.",
        "keywords": ["appraisal", "secondment", "receiving_mda", "psr_appointments"],
    },
    "psr_app_047": {
        "question": "Who may reduce the probationary period to less than two years, but not less than six months, by counting prior satisfactory public service?",
        "options": [
            "Permanent Secretary acting alone in every case.",
            "Head of Service acting without reference to the appointing authority.",
            "Appointing authority, subject to the PSR provisions.",
            "No authority at all, because probation is always fixed.",
        ],
        "explanation": "The appointing authority may reduce probation by counting prior satisfactory public service, provided the PSR conditions are satisfied.",
        "keywords": ["probation_reduction", "appointing_authority", "prior_service", "psr_appointments"],
    },
    "psr_docx_111": {
        "question": "When is an officer eligible for confirmation?",
        "options": [
            "Immediately on appointment.",
            "After satisfactory completion of probation and favourable assessment by the Head of Department.",
            "After every examination is completed, regardless of performance report.",
            "After a ceremonial confirmation exercise.",
        ],
        "explanation": "An officer becomes eligible for confirmation after satisfactorily completing probation and receiving a favourable performance assessment from the appropriate authority.",
        "keywords": ["confirmation", "probation", "head_of_department", "eligibility"],
    },
    "psr_docx_231": {
        "question": "Under what circumstance can appointment be terminated?",
        "options": [
            "Poor performance alone in every case.",
            "When termination is considered to be in the public interest.",
            "Only with the officer's consent.",
            "Only after a disciplinary conviction.",
        ],
        "explanation": "The PSR allows appointment to be terminated when the appointing authority determines that termination is in the public interest.",
        "keywords": ["termination", "public_interest", "appointing_authority", "psr_appointments"],
    },
    "psr_appointments_gen_001": {
        "question": "In the context of Appointments, Promotions & Transfers, which action best demonstrates sound governance?",
        "options": [
            "Use of approved procedures with complete records.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Sound governance in appointments, promotions, and transfers depends on approved procedures, complete records, and decisions that can be reviewed later.",
        "keywords": ["psr", "psr_appointments", "governance", "complete_records"],
    },
    "psr_appointments_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on escalation of material compliance gaps within Appointments, Promotions & Transfers?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Escalation of material compliance gaps is strongest when control weaknesses are identified early and referred promptly for higher review.",
        "keywords": ["psr", "psr_appointments", "compliance_gap_escalation", "early_identification"],
    },
    "psr_appointments_gen_007": {
        "question": "For effective Appointments, Promotions & Transfers administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "psr_appointments", "promotion_standards", "eligibility_review"],
    },
    "psr_appointments_gen_009": {
        "question": "When handling Appointments, Promotions & Transfers matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "psr_appointments", "documented_procedure", "recordkeeping"],
    },
    "psr_appointments_gen_011": {
        "question": "In the context of Appointments, Promotions & Transfers, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "psr_appointments", "public_accountability", "traceable_decisions"],
    },
    "psr_appointments_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Appointments, Promotions & Transfers?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "psr_appointments", "risk_control", "documented_mitigation"],
    },
    "psr_appointments_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Appointments, Promotions & Transfers?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "psr_appointments", "operational_discipline", "workflow_verification"],
    },
    "psr_appointments_gen_017": {
        "question": "For effective Appointments, Promotions & Transfers administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "psr_appointments", "record_management", "status_updates"],
    },
    "psr_appointments_gen_019": {
        "question": "When handling Appointments, Promotions & Transfers matters, which choice best reflects sound governance standards?",
        "options": [
            "Use of approved procedures with complete records.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Sound governance standards require approved procedures, complete records, and decisions that can be reviewed objectively.",
        "keywords": ["psr", "psr_appointments", "governance_standards", "approved_procedures"],
    },
    "psr_appointments_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Appointments, Promotions & Transfers?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "psr_appointments", "disciplinary_process", "fair_hearing"],
    },
    "psr_appointments_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Appointments, Promotions & Transfers administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "psr_appointments", "promotion_standards", "advancement_review"],
    },
    "psr_appointments_gen_026": {
        "question": "A unit handling Appointments, Promotions & Transfers receives a case with competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Discretionary shortcuts regardless of safeguards.",
            "Consistent application of PSR provisions with auditable records.",
            "Convenience over approved process requirements.",
            "Bypassed review checkpoints under time pressure.",
        ],
        "explanation": "Compliance and service quality are preserved when the applicable PSR provisions are applied consistently and the record remains auditable.",
        "keywords": ["psr", "psr_appointments", "compliance", "auditable_records"],
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
    print(f"Applied round 84 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
