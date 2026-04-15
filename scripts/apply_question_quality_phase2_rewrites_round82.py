#!/usr/bin/env python3
"""Round 82: normalize circ_personnel_performance non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "circ_personnel_performance"

UPDATES = {
    "circ_personnel_performance_gen_003": {
        "question": "Which option most strongly aligns with good public-service practice on risk management within Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Early identification of control gaps with prompt escalation.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Risk management in this circulars area begins with early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["psr", "circ_personnel_performance", "risk_management", "control_gaps"],
    },
    "circ_personnel_performance_gen_007": {
        "question": "For effective Circulars: Personnel, Performance & Reforms administration, which approach best preserves promotion standards?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any advancement recommendation is made.",
        "keywords": ["psr", "circ_personnel_performance", "promotion_standards", "eligibility_review"],
    },
    "circ_personnel_performance_gen_009": {
        "question": "When handling Circulars: Personnel, Performance & Reforms matters, which choice best reflects proper documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Proper documented procedure means following the approved steps and keeping complete records that support later review.",
        "keywords": ["psr", "circ_personnel_performance", "documented_procedure", "recordkeeping"],
    },
    "circ_personnel_performance_gen_011": {
        "question": "In the context of Circulars: Personnel, Performance & Reforms, which action best demonstrates public accountability?",
        "options": [
            "Traceable decisions with evidence-based justification.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable and supported by evidence-based reasons.",
        "keywords": ["psr", "circ_personnel_performance", "public_accountability", "traceable_decisions"],
    },
    "circ_personnel_performance_gen_013": {
        "question": "Which option most strongly aligns with good public-service practice on risk control within Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Risk control improves when risks are identified early, mitigation is documented, and corrective action is tracked.",
        "keywords": ["psr", "circ_personnel_performance", "risk_control", "documented_mitigation"],
    },
    "circ_personnel_performance_gen_015": {
        "question": "Which practice should a responsible officer prioritize to sustain operational discipline in Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Approved workflow use with output verification.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Operational discipline is sustained when approved workflows are followed and outputs are checked before closure.",
        "keywords": ["psr", "circ_personnel_performance", "operational_discipline", "workflow_verification"],
    },
    "circ_personnel_performance_gen_017": {
        "question": "For effective Circulars: Personnel, Performance & Reforms administration, which approach best preserves record management?",
        "options": [
            "Accurate file maintenance with status updates.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Record management is preserved by accurate file maintenance and timely status updates at each control point.",
        "keywords": ["psr", "circ_personnel_performance", "record_management", "status_updates"],
    },
    "circ_personnel_performance_gen_023": {
        "question": "Which option most strongly aligns with good public-service practice on disciplinary process within Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "A sound disciplinary process depends on due process, fair hearing, and documented decisions that can withstand review.",
        "keywords": ["psr", "circ_personnel_performance", "disciplinary_process", "fair_hearing"],
    },
    "circ_personnel_performance_gen_025": {
        "question": "Which practice should a responsible officer prioritize to sustain promotion standards in Circulars: Personnel, Performance & Reforms administration?",
        "options": [
            "Eligibility confirmation before advancement recommendation.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Promotion standards remain credible when eligibility is confirmed before advancement is recommended.",
        "keywords": ["psr", "circ_personnel_performance", "promotion_standards", "advancement_review"],
    },
    "circ_personnel_performance_gen_027": {
        "question": "For effective Circulars: Personnel, Performance & Reforms administration, which approach best preserves documented procedure?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Documented procedure is preserved when approved steps are followed and each decision is properly recorded.",
        "keywords": ["psr", "circ_personnel_performance", "documented_procedure", "approved_steps"],
    },
    "circ_personnel_performance_gen_031": {
        "question": "In the context of Circulars: Personnel, Performance & Reforms, which action best demonstrates risk control?",
        "options": [
            "Early risk identification with documented mitigation.",
            "Continued non-compliance after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Risk control is demonstrated by identifying risks early, documenting mitigation, and tracking compliance through review points.",
        "keywords": ["psr", "circ_personnel_performance", "risk_control", "mitigation_tracking"],
    },
    "circ_personnel_performance_gen_033": {
        "question": "Which option most strongly aligns with good public-service practice on operational discipline within Circulars: Personnel, Performance & Reforms?",
        "options": [
            "Approved workflow use with output verification.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Operational discipline is strengthened when approved workflows are followed and outputs are verified before closure.",
        "keywords": ["psr", "circ_personnel_performance", "operational_discipline", "workflow_verification"],
    },
    "circ_personnel_performance_gen_037": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Personnel, Performance & Reforms. Which action most directly strengthens risk management while preserving records for audit and oversight?",
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
            "Early identification of control gaps with prompt escalation.",
        ],
        "explanation": "Risk management improves when control gaps are identified early, material exceptions are escalated promptly, and the records trail is preserved for audit review.",
        "keywords": ["psr", "circ_personnel_performance", "risk_management", "audit_trail"],
    },
    "circ_personnel_performance_gen_041": {
        "question": "In a time-sensitive file under Circulars: Personnel, Performance & Reforms, which step best preserves promotion standards while maintaining fairness and legal compliance?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Eligibility confirmation before advancement recommendation.",
            "Continued non-compliant procedures after feedback.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "Promotion standards are protected when eligibility requirements are verified before advancement is recommended, especially in a time-sensitive file.",
        "keywords": ["psr", "circ_personnel_performance", "promotion_standards", "eligibility_verification"],
    },
    "circ_personnel_performance_gen_043": {
        "question": "A desk officer handling Circulars: Personnel, Performance & Reforms receives a case that requires documented procedure. What should be done first within approved timelines and governance standards?",
        "options": [
            "Use of documented procedure with complete recordkeeping.",
            "Convenience over policy requirements.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
        ],
        "explanation": "The first step is to follow the documented procedure and keep complete records, because that preserves governance standards and makes later review possible.",
        "keywords": ["psr", "circ_personnel_performance", "documented_procedure", "recordkeeping"],
    },
    "circ_personnel_performance_gen_045": {
        "question": "A supervisor is reviewing compliance gaps in Circulars: Personnel, Performance & Reforms. Which action most directly strengthens public accountability without bypassing review procedures?",
        "options": [
            "Bypassed review and approval controls.",
            "Continued non-compliant procedures after feedback.",
            "Traceable decisions with evidence-based justification.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Public accountability is strongest when decisions are traceable, reasons are evidence-based, and the supporting record can withstand later scrutiny.",
        "keywords": ["psr", "circ_personnel_performance", "public_accountability", "traceable_decisions"],
    },
    "circ_personnel_performance_gen_047": {
        "question": "To improve accountability in Circulars: Personnel, Performance & Reforms, which practice best supports risk control under standard approval and documentation controls?",
        "options": [
            "Convenience over policy requirements.",
            "Continued non-compliance after feedback.",
            "Early risk identification with documented mitigation.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Accountability improves when risks are identified early, mitigation is documented, and the resulting decisions can be traced through the approved record.",
        "keywords": ["psr", "circ_personnel_performance", "accountability", "risk_control"],
    },
    "circ_personnel_performance_gen_049": {
        "question": "In a time-sensitive file under Circulars: Personnel, Performance & Reforms, which step best preserves operational discipline within approved timelines and governance standards?",
        "options": [
            "Bypassed review and approval controls.",
            "Continued non-compliant procedures after feedback.",
            "Approved workflow use with output verification.",
            "Inconsistent rule application across similar cases.",
        ],
        "explanation": "Operational discipline is preserved when the approved workflow is followed and outputs are verified before the file is closed.",
        "keywords": ["psr", "circ_personnel_performance", "operational_discipline", "workflow_verification"],
    },
    "circ_personnel_performance_gen_051": {
        "question": "A desk officer handling Circulars: Personnel, Performance & Reforms receives a case that requires record management. What should be done first to preserve records for audit and oversight?",
        "options": [
            "Inconsistent rule application across similar cases.",
            "Accurate file maintenance with status updates.",
            "Bypassed review and approval controls.",
            "Convenience over policy requirements.",
        ],
        "explanation": "Good record management starts with accurate file maintenance and timely status updates so that each control point can be audited later.",
        "keywords": ["psr", "circ_personnel_performance", "record_management", "status_updates"],
    },
    "circ_personnel_performance_gen_057": {
        "question": "In a time-sensitive file under Circulars: Personnel, Performance & Reforms, which step best preserves disciplinary process while preserving records for audit and oversight?",
        "options": [
            "Continued non-compliant procedures after feedback.",
            "Inconsistent rule application across similar cases.",
            "Bypassed review and approval controls.",
            "Due process, fair hearing, and documented decisions.",
        ],
        "explanation": "A disciplinary process is preserved by observing due process, allowing fair hearing, and documenting each decision for later review.",
        "keywords": ["psr", "circ_personnel_performance", "disciplinary_process", "fair_hearing"],
    },
    "circ_personnel_performance_gen_059": {
        "question": "A desk officer handling Circulars: Personnel, Performance & Reforms receives a case that requires promotion standards. What should be done first without bypassing review procedures?",
        "options": [
            "Convenience over policy requirements.",
            "Bypassed review and approval controls.",
            "Inconsistent rule application across similar cases.",
            "Eligibility confirmation before advancement recommendation.",
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any recommendation for advancement is made.",
        "keywords": ["psr", "circ_personnel_performance", "promotion_standards", "advancement_review"],
    },
    "circ_personnel_performance_gen_060": {
        "question": "A unit handling Circulars: Personnel, Performance & Reforms receives a case with competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Discretionary shortcuts regardless of controls.",
            "Convenience over approved process requirements.",
            "Bypassed review checkpoints under time pressure.",
            "Consistent application of PSR provisions with auditable records.",
        ],
        "explanation": "Compliance and service quality are preserved when the applicable PSR provisions are applied consistently and the record remains auditable.",
        "keywords": ["psr", "circ_personnel_performance", "compliance", "auditable_records"],
    },
    "circ_personnel_performance_gen_062": {
        "question": "A supervisor is reviewing gaps in Circulars: Personnel, Performance & Reforms. Which option best strengthens control and consistency?",
        "options": [
            "Bypassed review checkpoints under time pressure.",
            "Convenience over approved process requirements.",
            "Inconsistent criteria across similar cases.",
            "Consistent application of PSR provisions with auditable records.",
        ],
        "explanation": "Control and consistency improve when the same PSR provisions are applied across similar cases and the resulting records remain auditable.",
        "keywords": ["psr", "circ_personnel_performance", "control", "consistency"],
    },
    "circ_personnel_performance_gen_064": {
        "question": "For sustainable results in Circulars: Personnel, Performance & Reforms, which practice should be prioritized first?",
        "options": [
            "Inconsistent criteria across similar cases.",
            "Convenience over approved process requirements.",
            "Discretionary shortcuts regardless of controls.",
            "Consistent application of PSR provisions with auditable records.",
        ],
        "explanation": "Sustainable results come from applying the same PSR provisions consistently and keeping the supporting record auditable.",
        "keywords": ["psr", "circ_personnel_performance", "sustainable_results", "auditable_records"],
    },
    "circ_personnel_performance_gen_068": {
        "question": "What determines the seniority of an officer?",
        "options": [
            "The earlier certified date between appointment and assumption of duty.",
            "The date of confirmation only.",
            "The date of assumption of duty only.",
            "The date of appointment only.",
        ],
        "explanation": "Rule 020105 states that seniority is determined by the date of assumption of duty certified by the appropriate officer and/or the date of present appointment as reflected in the appropriate register, whichever is earlier.",
        "keywords": ["seniority", "appointment_date", "assumption_of_duty", "rule_020105"],
    },
    "circ_personnel_performance_gen_076": {
        "question": "An officer on GL 11 is required to sit for which compulsory confirmation examination?",
        "options": [
            "Both COMPRO I and COMPRO II.",
            "COMPRO II.",
            "COMPRO I.",
            "No compulsory confirmation examination.",
        ],
        "explanation": "COMPRO II applies to officers on Grade Levels 10 to 14, so an officer on GL 11 is required to sit for COMPRO II.",
        "keywords": ["gl_11", "compro_ii", "confirmation_examination", "grade_level"],
    },
    "circ_personnel_performance_gen_080": {
        "question": "Are officers in the police and paramilitary services required to sit for the civil-service COMPRO I or COMPRO II examinations?",
        "options": [
            "Yes, COMPRO II only.",
            "Yes, both COMPRO I and COMPRO II.",
            "No, they take examinations prescribed by their own service commissions.",
            "No, because the examination is optional for every service.",
        ],
        "explanation": "Rule 030401 provides that officers in the police and paramilitary services take the examinations prescribed by their own service commissions rather than the civil-service COMPRO examinations.",
        "keywords": ["police_service", "paramilitary_service", "compro", "rule_030401"],
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
    print(f"Applied round 82 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
