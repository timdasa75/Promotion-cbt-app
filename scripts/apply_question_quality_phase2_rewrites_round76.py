import json
from pathlib import Path

DATA_PATH = Path("data/psr_rules.json")
SUBCATEGORY_ID = "psr_interpretation"

UPDATES = {
    "psr_interpretation_gen_001": {
        "question": "Which practice best demonstrates sound interpretation and commencement governance under the PSR?",
        "options": [
            "Approved interpretation procedure and a complete record trail.",
            "Inconsistent rule use based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Interpretation and commencement issues should be handled through approved procedure and a complete record trail so the basis of each decision remains lawful and reviewable.",
        "keywords": ["psr_interpretation", "governance", "approved_procedure", "record_trail"]
    },
    "psr_interpretation_gen_002": {
        "question": "Which approach best supports compliance in interpretation and commencement matters?",
        "options": [
            "Lawful criteria and transparent documentation of each decision step.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance in interpretation and commencement matters depends on lawful criteria and transparent documentation of each decision step.",
        "keywords": ["psr_interpretation", "compliance", "lawful_criteria", "documentation"]
    },
    "psr_interpretation_gen_003": {
        "question": "Which practice best supports risk management in interpretation and commencement work?",
        "options": [
            "Early identification of control gaps and prompt escalation of material exceptions.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Risk management in interpretation and commencement work depends on early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["psr_interpretation", "risk_management", "control_gaps", "escalation"]
    },
    "psr_interpretation_gen_004": {
        "question": "Which practice reflects proper appointment-governance standards in interpretation and commencement matters?",
        "options": [
            "Merit-based criteria and authorized approval channels.",
            "Routine exceptions without documented justification.",
            "Case closure before validating facts or records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Appointment-governance standards are best reflected by merit-based criteria and authorized approval channels supported by the record.",
        "keywords": ["psr_interpretation", "appointment_governance", "merit", "authorized_approval"]
    },
    "psr_interpretation_gen_005": {
        "question": "Which practice best supports disciplinary process in interpretation and commencement administration?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after corrective feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Disciplinary process should rest on due process, fair hearing, and documented decisions so the outcome can be defended under the Rules.",
        "keywords": ["psr_interpretation", "disciplinary_process", "fair_hearing", "documented_decisions"]
    },
    "psr_interpretation_gen_006": {
        "question": "Which practice best demonstrates proper leave administration in interpretation and commencement work?",
        "options": [
            "Consistent leave-rule application and updated personnel records.",
            "Case closure without verifying facts or required records.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Leave administration is best demonstrated by consistent application of the leave rules together with updated personnel records.",
        "keywords": ["psr_interpretation", "leave_administration", "personnel_records", "consistent_application"]
    },
    "psr_interpretation_gen_007": {
        "question": "Which approach best supports promotion standards in interpretation and commencement administration?",
        "options": [
            "Eligibility confirmation before any recommendation for advancement.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Promotion standards are protected when eligibility is confirmed before any recommendation for advancement is made.",
        "keywords": ["psr_interpretation", "promotion_standards", "eligibility", "advancement"]
    },
    "psr_interpretation_gen_008": {
        "question": "Which practice best supports circular compliance in interpretation and commencement work?",
        "options": [
            "Alignment with current circular directives and PSR requirements.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Circular compliance requires practice to remain aligned with the current circular directives together with the governing PSR provisions.",
        "keywords": ["psr_interpretation", "circular_compliance", "current_directives", "psr_requirements"]
    },
    "psr_interpretation_gen_009": {
        "question": "Which practice reflects proper documented procedure in interpretation and commencement matters?",
        "options": [
            "Documented procedure and complete records.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Proper documented procedure in interpretation and commencement matters requires complete records and adherence to the documented process.",
        "keywords": ["psr_interpretation", "documented_procedure", "complete_records", "process"]
    },
    "psr_interpretation_gen_010": {
        "question": "Which practice best supports compliance assurance in interpretation and commencement work?",
        "options": [
            "Consistent application of approved rules and escalation of exceptions.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance assurance is strengthened by consistent application of approved rules together with prompt escalation of exceptions.",
        "keywords": ["psr_interpretation", "compliance_assurance", "approved_rules", "exceptions"]
    },
    "psr_interpretation_gen_011": {
        "question": "Which practice best demonstrates public accountability in interpretation and commencement work?",
        "options": [
            "Traceable decisions and evidence-based justification.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Public accountability in interpretation and commencement work depends on traceable decisions supported by evidence-based justification.",
        "keywords": ["psr_interpretation", "public_accountability", "traceable_decisions", "evidence_based_justification"]
    },
    "psr_interpretation_gen_012": {
        "question": "Which approach best supports service integrity in interpretation and commencement administration?",
        "options": [
            "Conflict-of-interest avoidance and disclosure of relevant constraints.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Service integrity is protected when conflicts of interest are avoided and relevant constraints are disclosed on the record.",
        "keywords": ["psr_interpretation", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "psr_interpretation_gen_013": {
        "question": "Which practice best supports risk control in interpretation and commencement administration?",
        "options": [
            "Review of sensitive steps and timely escalation of exceptions.",
            "Skipped control checks because the matter looks routine.",
            "Undocumented shortcuts under processing pressure.",
            "Weak control gaps left unresolved until complaint."
        ],
        "explanation": "Risk control in interpretation and commencement work requires sensitive steps to be reviewed and exceptions to be escalated in time.",
        "keywords": ["psr_interpretation", "risk_control", "sensitive_steps", "timely_escalation"]
    },
    "psr_interpretation_gen_015": {
        "question": "Which practice best supports operational discipline in interpretation and commencement work?",
        "options": [
            "Consistent rule application and proper recording of departures.",
            "Relaxed standards under pressure.",
            "Repeated non-compliance where output appears satisfactory.",
            "Ad hoc personal judgment in place of procedure."
        ],
        "explanation": "Operational discipline is sustained when rules are applied consistently and any departures are properly recorded and reviewed.",
        "keywords": ["psr_interpretation", "operational_discipline", "consistent_rules", "recording_departures"]
    },
    "psr_interpretation_gen_017": {
        "question": "Which approach best supports record management in interpretation and commencement administration?",
        "options": [
            "Complete files and prompt recording of material actions.",
            "Key decisions kept outside the official file for convenience.",
            "Removal of papers without authority or traceability.",
            "Dependence on memory instead of file references in urgent work."
        ],
        "explanation": "Record management in interpretation and commencement administration depends on complete files and prompt recording of material actions.",
        "keywords": ["psr_interpretation", "record_management", "complete_files", "material_actions"]
    },
    "psr_interpretation_gen_019": {
        "question": "Which practice reflects proper governance standards in interpretation and commencement administration?",
        "options": [
            "Approved process, complete documentation, and lawful review channels.",
            "Action first and file reconstruction later if challenged.",
            "Verbal authority treated as enough for every case.",
            "Mandatory checks dropped because the matter seems straightforward."
        ],
        "explanation": "Proper governance standards in interpretation and commencement administration require approved process, complete documentation, and lawful review channels.",
        "keywords": ["psr_interpretation", "governance_standards", "documentation", "review_channels"]
    },
    "psr_interpretation_gen_026": {
        "question": "A unit handling interpretation and commencement faces competing priorities. Which action best preserves compliance and service quality?",
        "options": [
            "Discretionary shortcuts despite control requirements.",
            "Skipped review checkpoints under timeline pressure.",
            "Convenience ahead of approved process requirements.",
            "Approved procedures applied consistently with each material step documented."
        ],
        "explanation": "Where priorities compete, compliance and service quality are protected by consistent use of approved procedure together with documentation of each material step.",
        "keywords": ["psr_interpretation", "competing_priorities", "approved_procedure", "service_quality"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != SUBCATEGORY_ID:
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid not in UPDATES:
                continue
            patch = UPDATES[qid]
            q["question"] = patch["question"]
            q["options"] = patch["options"]
            q["explanation"] = patch["explanation"]
            q["keywords"] = patch["keywords"]
            updated.append(qid)
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(updated)} questions")
    for qid in updated:
        print(qid)


if __name__ == "__main__":
    main()
