#!/usr/bin/env python3
"""Round 83: normalize circ_appointments_tenure_discipline non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "circ_appointments_tenure_discipline"

UPDATES = {
    "circ_appointments_tenure_discipline_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on escalation of material compliance gaps within Circulars: Appointments, Tenure & Discipline?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Escalation of material compliance gaps is strongest when control weaknesses are identified early and referred promptly for higher review.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "compliance_gap_escalation", "early_identification"],
    },
    "circ_appointments_tenure_discipline_gen_007": {
        "question": "For effective Circulars: Appointments, Tenure & Discipline administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "promotion_standards", "eligibility_review"],
    },
    "circ_appointments_tenure_discipline_gen_009": {
        "question": "When handling Circulars: Appointments, Tenure & Discipline matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "documented_procedure", "recordkeeping"],
    },
    "circ_appointments_tenure_discipline_gen_011": {
        "question": "In the context of Circulars: Appointments, Tenure & Discipline, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "public_accountability", "traceable_decisions"],
    },
    "circ_appointments_tenure_discipline_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Circulars: Appointments, Tenure & Discipline?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "risk_control", "documented_mitigation"],
    },
    "circ_appointments_tenure_discipline_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Circulars: Appointments, Tenure & Discipline?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "operational_discipline", "workflow_verification"],
    },
    "circ_appointments_tenure_discipline_gen_017": {
        "question": "For effective Circulars: Appointments, Tenure & Discipline administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "record_management", "status_updates"],
    },
    "circ_appointments_tenure_discipline_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Circulars: Appointments, Tenure & Discipline?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "disciplinary_process", "fair_hearing"],
    },
    "circ_appointments_tenure_discipline_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Circulars: Appointments, Tenure & Discipline administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "promotion_standards", "advancement_review"],
    },
    "circ_appointments_tenure_discipline_gen_027": {
        "question": "For effective Circulars: Appointments, Tenure & Discipline administration, which approach best preserves documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Documented procedure is preserved when approved steps are followed and each decision is properly recorded.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "documented_procedure", "approved_steps"],
    },
    "circ_appointments_tenure_discipline_gen_031": {
        "question": "In the context of Circulars: Appointments, Tenure & Discipline, which action best demonstrates risk control?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Risk control is demonstrated by identifying risks early, documenting mitigation, and tracking compliance through review points.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "risk_control", "mitigation_tracking"],
    },
    "circ_appointments_tenure_discipline_gen_033": {
        "question": "Which option most strongly aligns with good public-service practice on operational discipline within Circulars: Appointments, Tenure & Discipline?",
        "options": [
            "Approved workflow use with output verification.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Operational discipline is strengthened when approved workflows are followed and outputs are verified before closure.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "operational_discipline", "workflow_verification"],
    },
    "circ_appointments_tenure_discipline_gen_036": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Appointments, Tenure & Discipline. Which action most directly strengthens risk management while preserving records for audit and oversight?",
        "options": [
            "Bypassed review and approval checkpoints.",
            "Convenience over policy requirements.",
            "Continued non-compliant procedures after feedback.",
            "Early identification of control gaps with prompt escalation.",
        ],
        "explanation": "Risk management improves when control gaps are identified early, material exceptions are escalated promptly, and the records trail is preserved for audit review.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "risk_management", "audit_trail"],
    },
    "circ_appointments_tenure_discipline_gen_040": {
        "question": "In a time-sensitive file under Circulars: Appointments, Tenure & Discipline, which step best preserves promotion standards while maintaining fairness and legal compliance?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliant procedures after feedback.",
        ],
        "explanation": "Promotion standards are protected when eligibility requirements are verified before advancement is recommended, especially in a time-sensitive file.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "promotion_standards", "eligibility_verification"],
    },
    "circ_appointments_tenure_discipline_gen_042": {
        "question": "A desk officer handling Circulars: Appointments, Tenure & Discipline receives a case that requires documented procedure. What should be done first within approved timelines and governance standards?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Convenience over policy requirements.",
            "Bypassed review and approval checkpoints.",
            "Use of documented procedure with complete recordkeeping.",
        ],
        "explanation": "The first step is to follow the documented procedure and keep complete records, because that preserves governance standards and makes later review possible.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "documented_procedure", "recordkeeping"],
    },
    "circ_appointments_tenure_discipline_gen_044": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Appointments, Tenure & Discipline. Which action most directly strengthens public accountability without bypassing review procedures?",
        "options": [
            "Convenience over policy requirements.",
            "Continued non-compliant procedures after feedback.",
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable, reasons are evidence-based, and the supporting record can withstand later scrutiny.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "public_accountability", "traceable_decisions"],
    },
    "circ_appointments_tenure_discipline_gen_046": {
        "question": "To improve accountability in Circulars: Appointments, Tenure & Discipline, which practice best supports risk control under standard approval and documentation standards?",
        "options": [
            "Convenience over policy requirements.",
            "Early risk identification with documented mitigation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Accountability improves when risks are identified early, mitigation is documented, and the resulting decisions can be traced through the approved record.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "accountability", "risk_control"],
    },
    "circ_appointments_tenure_discipline_gen_048": {
        "question": "In a time-sensitive file under Circulars: Appointments, Tenure & Discipline, which step best preserves operational discipline within approved timelines and governance standards?",
        "options": [
            "Approved workflow use with output verification.",
            "Bypassed review and approval checkpoints.",
            "Continued non-compliant procedures after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Operational discipline is preserved when the approved workflow is followed and outputs are verified before the file is closed.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "operational_discipline", "workflow_verification"],
    },
    "circ_appointments_tenure_discipline_gen_050": {
        "question": "A desk officer handling Circulars: Appointments, Tenure & Discipline receives a case that requires record management. What should be done first to preserve records for audit and oversight?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Accurate file maintenance with status updates.",
            "Convenience over policy requirements.",
            "Bypassed review and approval checkpoints.",
        ],
        "explanation": "Good record management starts with accurate file maintenance and timely status updates so that each control point can be audited later.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "record_management", "status_updates"],
    },
    "circ_appointments_tenure_discipline_gen_056": {
        "question": "In a time-sensitive file under Circulars: Appointments, Tenure & Discipline, which step best preserves disciplinary process while preserving records for audit and oversight?",
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval checkpoints.",
            "Due process, fair hearing, and documented decisions.",
        ],
        "explanation": "A disciplinary process is preserved by observing due process, allowing fair hearing, and documenting each decision for later review.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "disciplinary_process", "fair_hearing"],
    },
    "circ_appointments_tenure_discipline_gen_058": {
        "question": "A desk officer handling Circulars: Appointments, Tenure & Discipline receives a case that requires promotion standards. What should be done first without bypassing review procedures?",
        "options": [
            "Bypassed review and approval checkpoints.",
            "Eligibility confirmation before advancement recommendation.",
            "Convenience over policy requirements.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any recommendation for advancement is made.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "promotion_standards", "advancement_review"],
    },
    "circ_appointments_tenure_discipline_gen_059": {
        "question": "A unit handling Circulars: Appointments, Tenure & Discipline receives a case with competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Discretionary shortcuts regardless of safeguards.",
            "Convenience over approved process requirements.",
            "Bypassed review checkpoints under time pressure.",
            "Consistent application of PSR provisions with auditable records.",
        ],
        "explanation": "Compliance and service quality are preserved when the applicable PSR provisions are applied consistently and the record remains auditable.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "compliance", "auditable_records"],
    },
    "circ_appointments_tenure_discipline_gen_061": {
        "question": "A supervisor is reviewing gaps in Circulars: Appointments, Tenure & Discipline. Which option best strengthens control and consistency?",
        "options": [
            "Inconsistent criteria across similar cases.",
            "Consistent application of PSR provisions with auditable records.",
            "Bypassed review checkpoints under time pressure.",
            "Convenience over approved process requirements.",
        ],
        "explanation": "Control and consistency improve when the same PSR provisions are applied across similar cases and the resulting records remain auditable.",
        "keywords": ["psr", "circ_appointments_tenure_discipline", "control", "consistency"],
    },
    "circ_appointments_tenure_discipline_gen_063": {
        "question": "Which role is accountable for making acting appointments for a duty post below SGL 14?",
        "options": [
            "The Permanent Secretary or Head of Extra-Ministerial Office.",
            "The officer designated by the circular for that level of post.",
            "The Head of the Civil Service of the Federation.",
            "The Federal Civil Service Commission.",
        ],
        "explanation": "The applicable circular assigns responsibility for acting appointments below SGL 14 to the officer designated for that level of post, rather than the higher authorities that handle more senior appointments.",
        "keywords": ["acting_appointment", "duty_post", "sgl_14", "appointments_authority"],
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
    print(f"Applied round 83 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
