#!/usr/bin/env python3
"""Round 89: normalize psr_training non-parallel option sets."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "psr_rules.json"
SUBCATEGORY_ID = "psr_training"

UPDATES = {
    "psr_train_009": {
        "question": "Under PSR 070108, when may training abroad be approved?",
        "options": [
            "Absence of equivalent training in Nigeria.",
            "Availability of foreign sponsorship.",
            "Personal request by the officer.",
            "Donation of funds by private firms.",
        ],
        "explanation": "PSR 070108 allows training abroad only where equivalent training is not available in Nigeria.",
        "keywords": ["training_abroad", "local_training_unavailable", "psr_070108", "training_approval"],
    },
    "psr_train_016": {
        "question": "Under PSR 070107(a), what must be shown before an officer is nominated for training?",
        "options": [
            "Ten years of prior service.",
            "Potential for effective use of the training.",
            "Pending disciplinary case.",
            "Training offered without cost.",
        ],
        "explanation": "PSR 070107(a) requires evidence that the officer can use the training effectively in service before nomination is approved.",
        "keywords": ["training_nomination", "effective_utilization", "psr_070107", "staff_development"],
    },
    "psr_train_031": {
        "question": "What is the consequence of embarking on unapproved training under PSR 070109?",
        "options": [
            "Travel-allowance entitlement.",
            "No recognition or reimbursement.",
            "Automatic promotion consideration.",
            "Partial government refund.",
        ],
        "explanation": "PSR 070109 states that unapproved training does not attract official recognition or reimbursement.",
        "keywords": ["unapproved_training", "recognition", "reimbursement", "psr_070109"],
    },
    "psr_train_051": {
        "question": "How do the Public Service Rules treat examination fees for invigilators and examiners?",
        "options": [
            "Matter not provided for in the Rules.",
            "Departmental payment outside the Rules.",
            "Discretionary payment by the Head of Service.",
            "Formal payment provision recognized by the Rules.",
        ],
        "explanation": "The training and examination provisions of the Rules expressly make room for examination fees for invigilators and examiners, so the payment is recognized by the Rules rather than left to discretion.",
        "keywords": ["examination_fees", "invigilators", "examiners", "psr_training"],
    },
    "psr_train_059": {
        "question": "What may happen during probation if the appointing authority is dissatisfied with an officer's efficiency or conduct?",
        "options": [
            "Written warning only.",
            "Extension of the appointment.",
            "Termination of the appointment.",
            "Automatic demotion.",
        ],
        "explanation": "Rule 020901 allows the appointing authority to terminate a probationary appointment where the officer's efficiency or conduct is unsatisfactory.",
        "keywords": ["probation", "termination_of_appointment", "efficiency_or_conduct", "rule_020901"],
    },
    "psr_train_062": {
        "question": "What applies to a confirmed member of the JSC or SSC regarding the compulsory confirmation examination?",
        "options": [
            "Exemption from the compulsory confirmation examination.",
            "Examination requirement for new recruits only.",
            "Waiver at the Permanent Secretary's discretion.",
            "Mandatory sitting despite committee membership.",
        ],
        "explanation": "The applicable rule exempts a confirmed member of the JSC or SSC from the compulsory confirmation examination.",
        "keywords": ["confirmation_examination", "jsc_ssc_member", "exemption", "psr_training"],
    },
    "psr_train_065": {
        "question": "What follows from a pass at accelerated level in the compulsory confirmation examination for junior officers?",
        "options": [
            "Exemption from future promotion examinations.",
            "Cash reward for examination success.",
            "Accelerated promotion to the next grade level.",
            "Immediate promotion to a senior post.",
        ],
        "explanation": "Rule 030302 links a pass at accelerated level in the compulsory confirmation examination for junior officers to accelerated promotion to the next grade level.",
        "keywords": ["accelerated_level", "compulsory_confirmation_examination", "accelerated_promotion", "rule_030302"],
    },
    "psr_train_067": {
        "question": "What examination requirement applies to officers in the police and paramilitary services?",
        "options": [
            "Exemption from confirmation examinations.",
            "Examinations prescribed by the relevant service commission.",
            "Same examinations as other civil servants.",
            "Oral interview in place of examinations.",
        ],
        "explanation": "Rule 030401 requires officers in the police and paramilitary services to pass the examinations prescribed by their respective service commissions.",
        "keywords": ["police_and_paramilitary", "service_commission_examinations", "confirmation_and_promotion", "rule_030401"],
    },
    "psr_train_072": {
        "question": "What may follow if an officer fails to secure full repayment of an advance under Financial Regulation 1419?",
        "options": [
            "Automatic conversion of the advance to a grant.",
            "Transfer of the balance to another department.",
            "Disciplinary action for non-compliance.",
            "Automatic extension of the repayment period.",
        ],
        "explanation": "Failure to secure full repayment of an advance breaches Financial Regulation 1419 and may attract disciplinary action for non-compliance with financial control requirements.",
        "keywords": ["advance_repayment", "disciplinary_action", "financial_regulation_1419", "financial_control"],
    },
    "psr_training_gen_003": {
        "question": "Which practice best supports risk management in training, performance, and career development?",
        "options": [
            "Early escalation of control gaps and material exceptions.",
            "Review-step bypass under time pressure.",
            "Convenience ahead of approved requirements.",
            "Continuation of unresolved non-compliance.",
        ],
        "explanation": "Risk management in training administration depends on identifying control gaps early and escalating material exceptions before they affect service decisions.",
        "keywords": ["psr", "psr_training", "risk_management", "exception_escalation"],
    },
    "psr_training_gen_007": {
        "question": "Which practice best protects promotion standards in training, performance, and career development?",
        "options": [
            "Eligibility verification before advancement recommendation.",
            "Review-step bypass for faster processing.",
            "Personal preference in place of uniform criteria.",
            "Convenience ahead of approved requirements.",
        ],
        "explanation": "Promotion standards are protected when eligibility is verified before advancement is recommended.",
        "keywords": ["psr", "psr_training", "promotion_standards", "eligibility_verification"],
    },
    "psr_training_gen_009": {
        "question": "Which practice best supports documented procedure in training, performance, and career development?",
        "options": [
            "Complete records with an auditable approval trail.",
            "Personal preference in place of uniform procedure.",
            "Review-step bypass for faster processing.",
            "Convenience ahead of approved requirements.",
        ],
        "explanation": "Documented procedure is sustained when training and career-development actions are recorded and supported by an auditable approval trail.",
        "keywords": ["psr", "psr_training", "documented_procedure", "approval_trail"],
    },
    "psr_training_gen_011": {
        "question": "Which practice best demonstrates public accountability in training, performance, and career development?",
        "options": [
            "Traceable decisions with recorded reasons and evidence.",
            "Review-step bypass for faster closure.",
            "Convenience ahead of public-service requirements.",
            "Continued non-compliance after feedback.",
        ],
        "explanation": "Public accountability in staff development requires decisions that can be traced to recorded reasons and supporting evidence.",
        "keywords": ["psr", "psr_training", "public_accountability", "traceable_decisions"],
    },
    "psr_training_gen_013": {
        "question": "Which practice best supports risk control in training, performance, and career development?",
        "options": [
            "Documented mitigation for identified training and promotion risks.",
            "Convenience ahead of control requirements.",
            "Inconsistent treatment of similar cases.",
            "Continuation of unresolved exceptions.",
        ],
        "explanation": "Risk control is stronger when identified training and promotion risks are matched with documented mitigation and follow-up.",
        "keywords": ["psr", "psr_training", "risk_control", "documented_mitigation"],
    },
    "psr_training_gen_015": {
        "question": "Which practice best sustains operational discipline in training, performance, and career development?",
        "options": [
            "Completion of approved workflow checks before closure.",
            "Personal preference in place of workflow discipline.",
            "Bypassed review checkpoints under time pressure.",
            "Continuation of unresolved non-compliance.",
        ],
        "explanation": "Operational discipline is sustained when each approved workflow check is completed before a training or career-development case is closed.",
        "keywords": ["psr", "psr_training", "operational_discipline", "workflow_checks"],
    },
    "psr_training_gen_017": {
        "question": "Which practice best supports record management in training, performance, and career development?",
        "options": [
            "Up-to-date files and status logs at each review stage.",
            "Review-step bypass for faster closure.",
            "Personal preference in place of filing standards.",
            "Convenience ahead of documentation requirements.",
        ],
        "explanation": "Record management in staff development depends on current files and status logs that can be checked at each review stage.",
        "keywords": ["psr", "psr_training", "record_management", "status_logs"],
    },
    "psr_training_gen_023": {
        "question": "Which practice best supports disciplinary process in training, performance, and career development?",
        "options": [
            "Fair hearing with documented findings and decisions.",
            "Convenience ahead of due-process requirements.",
            "Inconsistent treatment of comparable cases.",
            "Bypassed review checkpoints before action.",
        ],
        "explanation": "A sound disciplinary process in staff development requires fair hearing, documented findings, and decisions that can be reviewed.",
        "keywords": ["psr", "psr_training", "disciplinary_process", "documented_findings"],
    },
    "psr_training_gen_025": {
        "question": "Which practice best sustains promotion standards in training, performance, and career development?",
        "options": [
            "Promotion recommendations backed by verified assessment records.",
            "Promotion decisions based on informal impressions.",
            "Bypassed review checkpoints before recommendation.",
            "Convenience ahead of merit requirements.",
        ],
        "explanation": "Promotion standards remain credible when recommendations are backed by verified assessment records rather than informal impressions.",
        "keywords": ["psr", "psr_training", "promotion_standards", "assessment_records"],
    },
    "psr_training_gen_026": {
        "question": "A training, performance, and career development unit faces competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Convenience ahead of approved process requirements.",
            "Discretionary shortcuts despite control gaps.",
            "Bypassed review checkpoints under time pressure.",
            "Consistent use of PSR requirements with auditable records.",
        ],
        "explanation": "Where competing priorities arise, compliance and service quality are protected by applying the relevant PSR requirements consistently and maintaining auditable records.",
        "keywords": ["psr", "psr_training", "service_quality", "auditable_records"],
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
    print(f"Applied round 89 rewrites to {updated} questions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
