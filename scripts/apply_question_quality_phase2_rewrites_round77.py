import json
from pathlib import Path

DATA_PATH = Path("data/psr_rules.json")
SUBCATEGORY_ID = "psr_retirement"

UPDATES = {
    "psr_retirement_gen_001": {
        "question": "Which practice best demonstrates sound governance in separation, retirement, and pension administration?",
        "options": [
            "Approved retirement procedure and a complete record trail.",
            "Inconsistent rule use based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Separation, retirement, and pension administration should follow approved procedure with a complete record trail so the basis of each action remains lawful and reviewable.",
        "keywords": ["psr_retirement", "governance", "approved_procedure", "record_trail"]
    },
    "psr_retirement_gen_002": {
        "question": "Which approach best supports compliance in separation, retirement, and pension administration?",
        "options": [
            "Lawful criteria and transparent documentation of each decision step.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance in separation, retirement, and pension administration depends on lawful criteria and transparent documentation of each decision step.",
        "keywords": ["psr_retirement", "compliance", "lawful_criteria", "documentation"]
    },
    "psr_retirement_gen_003": {
        "question": "Which practice best supports risk management in separation, retirement, and pension administration?",
        "options": [
            "Early identification of control gaps and prompt escalation of material exceptions.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Risk management in retirement administration starts with early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["psr_retirement", "risk_management", "control_gaps", "escalation"]
    },
    "psr_retirement_gen_004": {
        "question": "Which practice reflects proper appointment-governance standards in separation, retirement, and pension administration?",
        "options": [
            "Merit-based criteria and authorized approval channels.",
            "Routine exceptions without documented justification.",
            "Case closure before validating facts or records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Where appointment issues affect retirement administration, proper governance requires merit-based criteria and authorized approval channels.",
        "keywords": ["psr_retirement", "appointment_governance", "merit", "authorized_approval"]
    },
    "psr_retirement_gen_005": {
        "question": "Which practice best supports disciplinary process in separation, retirement, and pension administration?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after corrective feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Disciplinary issues affecting retirement administration should rest on due process, fair hearing, and documented decisions.",
        "keywords": ["psr_retirement", "disciplinary_process", "fair_hearing", "documented_decisions"]
    },
    "psr_retirement_gen_006": {
        "question": "Which practice best demonstrates proper leave administration in separation, retirement, and pension work?",
        "options": [
            "Consistent leave-rule application and updated personnel records.",
            "Case closure without verifying facts or required records.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Leave issues linked to retirement administration should be handled through consistent application of the leave rules and updated personnel records.",
        "keywords": ["psr_retirement", "leave_administration", "personnel_records", "consistent_application"]
    },
    "psr_retirement_gen_007": {
        "question": "Which approach best supports promotion standards in separation, retirement, and pension administration?",
        "options": [
            "Eligibility confirmation before any recommendation for advancement.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Where promotion standards affect retirement-related status, eligibility should be confirmed before any recommendation for advancement.",
        "keywords": ["psr_retirement", "promotion_standards", "eligibility", "advancement"]
    },
    "psr_retirement_gen_008": {
        "question": "Which practice best supports circular compliance in separation, retirement, and pension administration?",
        "options": [
            "Alignment with current circular directives and PSR requirements.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Circular compliance in retirement administration requires practice to remain aligned with current circular directives and the governing PSR provisions.",
        "keywords": ["psr_retirement", "circular_compliance", "current_directives", "psr_requirements"]
    },
    "psr_retirement_gen_009": {
        "question": "Which practice reflects proper documented procedure in separation, retirement, and pension administration?",
        "options": [
            "Documented procedure and complete records.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Proper documented procedure in retirement administration requires complete records and adherence to the documented process.",
        "keywords": ["psr_retirement", "documented_procedure", "complete_records", "process"]
    },
    "psr_retirement_gen_010": {
        "question": "Which practice best supports compliance assurance in separation, retirement, and pension administration?",
        "options": [
            "Consistent application of approved rules and escalation of exceptions.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance assurance is strengthened by consistent application of approved rules together with prompt escalation of exceptions.",
        "keywords": ["psr_retirement", "compliance_assurance", "approved_rules", "exceptions"]
    },
    "psr_retirement_gen_011": {
        "question": "Which practice best demonstrates public accountability in separation, retirement, and pension administration?",
        "options": [
            "Traceable decisions and evidence-based justification.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Public accountability in retirement administration depends on traceable decisions supported by evidence-based justification.",
        "keywords": ["psr_retirement", "public_accountability", "traceable_decisions", "evidence_based_justification"]
    },
    "psr_retirement_gen_012": {
        "question": "Which approach best supports service integrity in separation, retirement, and pension administration?",
        "options": [
            "Conflict-of-interest avoidance and disclosure of relevant constraints.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Service integrity is protected when conflicts of interest are avoided and relevant constraints are disclosed on the record.",
        "keywords": ["psr_retirement", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "psr_retirement_gen_013": {
        "question": "Which practice best supports risk control in separation, retirement, and pension administration?",
        "options": [
            "Early risk identification, applied controls, and documented mitigation.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Risk control in retirement administration depends on identifying risks early, applying controls, and documenting how mitigation was handled.",
        "keywords": ["psr_retirement", "risk_control", "mitigation", "controls"]
    },
    "psr_retirement_gen_014": {
        "question": "Which practice reflects proper decision-transparency standards in separation, retirement, and pension administration?",
        "options": [
            "Clear criteria and prompt communication of decisions.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Decision transparency in retirement administration requires clear criteria and prompt communication of decisions to the affected officer.",
        "keywords": ["psr_retirement", "decision_transparency", "clear_criteria", "communication"]
    },
    "psr_retirement_gen_015": {
        "question": "Which practice best supports operational discipline in separation, retirement, and pension administration?",
        "options": [
            "Approved workflows and verified outputs before closure.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Operational discipline in retirement administration is supported by approved workflows and verification of outputs before a case is closed.",
        "keywords": ["psr_retirement", "operational_discipline", "approved_workflows", "verified_outputs"]
    },
    "psr_retirement_gen_016": {
        "question": "Which practice best demonstrates citizen-focused service in separation, retirement, and pension administration?",
        "options": [
            "Balanced attention to legality, fairness, timeliness, and service quality.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Citizen-focused service in retirement administration requires legality, fairness, timeliness, and service quality to be balanced together.",
        "keywords": ["psr_retirement", "citizen_focused_service", "fairness", "timeliness"]
    },
    "psr_retirement_gen_017": {
        "question": "Which approach best supports record management in separation, retirement, and pension administration?",
        "options": [
            "Accurate files and status updates at each control point.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Record management in retirement administration depends on accurate files and status updates at each control point.",
        "keywords": ["psr_retirement", "record_management", "accurate_files", "status_updates"]
    },
    "psr_retirement_gen_018": {
        "question": "Which practice best supports performance standards in separation, retirement, and pension administration?",
        "options": [
            "Measurable targets, monitored progress, and correction of deviations.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Performance standards in retirement administration are supported by measurable targets, monitored progress, and timely correction of deviations.",
        "keywords": ["psr_retirement", "performance_standards", "targets", "deviations"]
    },
    "psr_retirement_gen_019": {
        "question": "Which practice reflects proper governance standards in separation, retirement, and pension administration?",
        "options": [
            "Approved procedure, complete documentation, and lawful review channels.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Proper governance standards in retirement administration require approved procedure, complete documentation, and lawful review channels.",
        "keywords": ["psr_retirement", "governance_standards", "documentation", "review_channels"]
    },
    "psr_retirement_gen_020": {
        "question": "Which practice best supports compliance in separation, retirement, and pension administration?",
        "options": [
            "Lawful criteria and transparent documentation of each decision step.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Compliance in retirement administration is supported by lawful criteria and transparent documentation of each decision step.",
        "keywords": ["psr_retirement", "compliance", "lawful_criteria", "transparent_documentation"]
    },
    "psr_retirement_gen_021": {
        "question": "Which practice best demonstrates risk management in separation, retirement, and pension administration?",
        "options": [
            "Early identification of control gaps and prompt escalation of material exceptions.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Risk management in retirement administration depends on early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["psr_retirement", "risk_management", "control_gaps", "material_exceptions"]
    },
    "psr_retirement_gen_022": {
        "question": "Which approach best supports appointment governance in separation, retirement, and pension administration?",
        "options": [
            "Merit-based criteria and authorized approval channels.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Appointment governance issues linked to retirement administration should rest on merit-based criteria and authorized approval channels.",
        "keywords": ["psr_retirement", "appointment_governance", "merit", "approval_channels"]
    },
    "psr_retirement_gen_023": {
        "question": "Which practice best supports disciplinary process in separation, retirement, and pension administration?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Disciplinary process in retirement administration should be handled through due process, fair hearing, and documented decisions.",
        "keywords": ["psr_retirement", "disciplinary_process", "fair_hearing", "documented_decisions"]
    },
    "psr_retirement_gen_024": {
        "question": "Which practice reflects proper leave-administration standards in separation, retirement, and pension administration?",
        "options": [
            "Consistent leave-rule application and updated personnel records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Where leave matters affect retirement administration, the proper standard is consistent application of leave rules together with updated personnel records.",
        "keywords": ["psr_retirement", "leave_administration", "personnel_records", "leave_rules"]
    },
    "psr_retirement_gen_025": {
        "question": "Which practice best supports promotion standards in separation, retirement, and pension administration?",
        "options": [
            "Eligibility confirmation before any recommendation for advancement.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Promotion standards linked to retirement administration are protected when eligibility is confirmed before any recommendation for advancement.",
        "keywords": ["psr_retirement", "promotion_standards", "eligibility", "advancement"]
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
