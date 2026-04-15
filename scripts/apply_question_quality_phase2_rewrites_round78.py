import json
from pathlib import Path

DATA_PATH = Path("data/psr_rules.json")
SUBCATEGORY_ID = "circ_leave_welfare_allowances"

UPDATES = {
    "circ_leave_welfare_allowances_gen_002": {
        "question": "Which approach best supports compliance in leave, welfare, and allowance administration?",
        "options": [
            "Lawful criteria and transparent documentation of each decision step.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance in leave, welfare, and allowance administration depends on lawful criteria and transparent documentation of each decision step.",
        "keywords": ["leave_welfare_allowances", "compliance", "lawful_criteria", "documentation"]
    },
    "circ_leave_welfare_allowances_gen_003": {
        "question": "Which practice best supports risk management in leave, welfare, and allowance administration?",
        "options": [
            "Early identification of control gaps and prompt escalation of material exceptions.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Risk management in leave, welfare, and allowance administration starts with early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["leave_welfare_allowances", "risk_management", "control_gaps", "escalation"]
    },
    "circ_leave_welfare_allowances_gen_004": {
        "question": "Which practice reflects proper appointment-governance standards in leave, welfare, and allowance administration?",
        "options": [
            "Merit-based criteria and authorized approval channels.",
            "Routine exceptions without documented justification.",
            "Case closure before validating facts or records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Where appointment issues affect leave, welfare, and allowance administration, proper governance requires merit-based criteria and authorized approval channels.",
        "keywords": ["leave_welfare_allowances", "appointment_governance", "merit", "authorized_approval"]
    },
    "circ_leave_welfare_allowances_gen_005": {
        "question": "Which practice best supports disciplinary process in leave, welfare, and allowance administration?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after corrective feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Disciplinary matters linked to leave, welfare, and allowance administration should be handled through due process, fair hearing, and documented decisions.",
        "keywords": ["leave_welfare_allowances", "disciplinary_process", "fair_hearing", "documented_decisions"]
    },
    "circ_leave_welfare_allowances_gen_006": {
        "question": "Which practice best demonstrates proper leave administration in circulars on leave, welfare, and allowances?",
        "options": [
            "Consistent leave-rule application and updated personnel records.",
            "Case closure without verifying facts or required records.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Leave administration under the circulars is best demonstrated by consistent application of the leave rules and updated personnel records.",
        "keywords": ["leave_welfare_allowances", "leave_administration", "personnel_records", "consistent_application"]
    },
    "circ_leave_welfare_allowances_gen_007": {
        "question": "Which approach best supports promotion standards in leave, welfare, and allowance administration?",
        "options": [
            "Eligibility confirmation before any recommendation for advancement.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Where promotion standards affect leave, welfare, and allowance administration, eligibility should be confirmed before any recommendation for advancement.",
        "keywords": ["leave_welfare_allowances", "promotion_standards", "eligibility", "advancement"]
    },
    "circ_leave_welfare_allowances_gen_008": {
        "question": "Which practice best supports circular compliance in leave, welfare, and allowance administration?",
        "options": [
            "Alignment with current circular directives and PSR requirements.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Circular compliance requires practice to remain aligned with current circular directives together with the governing PSR provisions.",
        "keywords": ["leave_welfare_allowances", "circular_compliance", "current_directives", "psr_requirements"]
    },
    "circ_leave_welfare_allowances_gen_009": {
        "question": "Which practice reflects proper documented procedure in leave, welfare, and allowance administration?",
        "options": [
            "Documented procedure and complete records.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Proper documented procedure in leave, welfare, and allowance administration requires complete records and adherence to the documented process.",
        "keywords": ["leave_welfare_allowances", "documented_procedure", "complete_records", "process"]
    },
    "circ_leave_welfare_allowances_gen_010": {
        "question": "Which practice best supports compliance assurance in leave, welfare, and allowance administration?",
        "options": [
            "Consistent application of approved rules and escalation of exceptions.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Compliance assurance is strengthened by consistent application of approved rules together with prompt escalation of exceptions.",
        "keywords": ["leave_welfare_allowances", "compliance_assurance", "approved_rules", "exceptions"]
    },
    "circ_leave_welfare_allowances_gen_011": {
        "question": "Which practice best demonstrates public accountability in leave, welfare, and allowance administration?",
        "options": [
            "Traceable decisions and evidence-based justification.",
            "Skipped review checks in order to save time.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Public accountability in leave, welfare, and allowance administration depends on traceable decisions supported by evidence-based justification.",
        "keywords": ["leave_welfare_allowances", "public_accountability", "traceable_decisions", "evidence_based_justification"]
    },
    "circ_leave_welfare_allowances_gen_012": {
        "question": "Which approach best supports service integrity in leave, welfare, and allowance administration?",
        "options": [
            "Conflict-of-interest avoidance and disclosure of relevant constraints.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Service integrity is protected when conflicts of interest are avoided and relevant constraints are disclosed on the record.",
        "keywords": ["leave_welfare_allowances", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "circ_leave_welfare_allowances_gen_013": {
        "question": "Which practice best supports risk control in leave, welfare, and allowance administration?",
        "options": [
            "Early risk identification, applied controls, and documented mitigation.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Risk control in leave, welfare, and allowance administration depends on identifying risks early, applying controls, and documenting mitigation.",
        "keywords": ["leave_welfare_allowances", "risk_control", "mitigation", "controls"]
    },
    "circ_leave_welfare_allowances_gen_014": {
        "question": "Which practice reflects proper decision-transparency standards in leave, welfare, and allowance administration?",
        "options": [
            "Clear criteria and prompt communication of decisions.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Decision transparency in leave, welfare, and allowance administration requires clear criteria and prompt communication of decisions to affected officers.",
        "keywords": ["leave_welfare_allowances", "decision_transparency", "clear_criteria", "communication"]
    },
    "circ_leave_welfare_allowances_gen_015": {
        "question": "Which practice best supports operational discipline in leave, welfare, and allowance administration?",
        "options": [
            "Approved workflows and verified outputs before closure.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Operational discipline is supported by approved workflows and verification of outputs before a leave, welfare, or allowance case is closed.",
        "keywords": ["leave_welfare_allowances", "operational_discipline", "approved_workflows", "verified_outputs"]
    },
    "circ_leave_welfare_allowances_gen_016": {
        "question": "Which practice best demonstrates citizen-focused service in leave, welfare, and allowance administration?",
        "options": [
            "Balanced attention to legality, fairness, timeliness, and service quality.",
            "Informal direction without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Citizen-focused service in leave, welfare, and allowance administration requires legality, fairness, timeliness, and service quality to be balanced together.",
        "keywords": ["leave_welfare_allowances", "citizen_focused_service", "fairness", "timeliness"]
    },
    "circ_leave_welfare_allowances_gen_017": {
        "question": "Which approach best supports record management in leave, welfare, and allowance administration?",
        "options": [
            "Accurate files and status updates at each control point.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Record management in leave, welfare, and allowance administration depends on accurate files and status updates at each control point.",
        "keywords": ["leave_welfare_allowances", "record_management", "accurate_files", "status_updates"]
    },
    "circ_leave_welfare_allowances_gen_018": {
        "question": "Which practice best supports performance standards in leave, welfare, and allowance administration?",
        "options": [
            "Measurable targets, monitored progress, and correction of deviations.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Performance standards are supported by measurable targets, monitored progress, and timely correction of deviations in leave, welfare, and allowance administration.",
        "keywords": ["leave_welfare_allowances", "performance_standards", "targets", "deviations"]
    },
    "circ_leave_welfare_allowances_gen_020": {
        "question": "Which practice best supports compliance in leave, welfare, and allowance administration?",
        "options": [
            "Lawful criteria and transparent documentation of each decision step.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Compliance in leave, welfare, and allowance administration is supported by lawful criteria and transparent documentation of each decision step.",
        "keywords": ["leave_welfare_allowances", "compliance", "lawful_criteria", "transparent_documentation"]
    },
    "circ_leave_welfare_allowances_gen_021": {
        "question": "Which practice best demonstrates risk management in leave, welfare, and allowance administration?",
        "options": [
            "Early identification of control gaps and prompt escalation of material exceptions.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Risk management in leave, welfare, and allowance administration depends on early identification of control gaps and prompt escalation of material exceptions.",
        "keywords": ["leave_welfare_allowances", "risk_management", "control_gaps", "material_exceptions"]
    },
    "circ_leave_welfare_allowances_gen_022": {
        "question": "Which approach best supports appointment governance in leave, welfare, and allowance administration?",
        "options": [
            "Merit-based criteria and authorized approval channels.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Appointment governance issues linked to leave, welfare, and allowance administration should rest on merit-based criteria and authorized approval channels.",
        "keywords": ["leave_welfare_allowances", "appointment_governance", "merit", "approval_channels"]
    },
    "circ_leave_welfare_allowances_gen_023": {
        "question": "Which practice best supports disciplinary process in leave, welfare, and allowance administration?",
        "options": [
            "Due process, fair hearing, and documented decisions.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Disciplinary process in leave, welfare, and allowance administration should be handled through due process, fair hearing, and documented decisions.",
        "keywords": ["leave_welfare_allowances", "disciplinary_process", "fair_hearing", "documented_decisions"]
    },
    "circ_leave_welfare_allowances_gen_024": {
        "question": "Which practice reflects proper leave-administration standards in circulars on leave, welfare, and allowances?",
        "options": [
            "Consistent leave-rule application and updated personnel records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Proper leave-administration standards under the circulars require consistent application of leave rules and updated personnel records.",
        "keywords": ["leave_welfare_allowances", "leave_administration", "personnel_records", "leave_rules"]
    },
    "circ_leave_welfare_allowances_gen_025": {
        "question": "Which practice best supports promotion standards in leave, welfare, and allowance administration?",
        "options": [
            "Eligibility confirmation before any recommendation for advancement.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Promotion standards in leave, welfare, and allowance administration are protected when eligibility is confirmed before any recommendation for advancement.",
        "keywords": ["leave_welfare_allowances", "promotion_standards", "eligibility", "advancement"]
    },
    "circ_leave_welfare_allowances_gen_026": {
        "question": "Which practice best demonstrates circular compliance in leave, welfare, and allowance administration?",
        "options": [
            "Alignment with current circular directives and PSR requirements.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records."
        ],
        "explanation": "Circular compliance in leave, welfare, and allowance administration requires alignment with current circular directives and the governing PSR provisions.",
        "keywords": ["leave_welfare_allowances", "circular_compliance", "current_directives", "psr_requirements"]
    },
    "circ_leave_welfare_allowances_gen_027": {
        "question": "Which practice reflects proper documented procedure in leave, welfare, and allowance administration?",
        "options": [
            "Documented procedure and complete records.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback."
        ],
        "explanation": "Proper documented procedure in leave, welfare, and allowance administration requires complete records and adherence to the documented process.",
        "keywords": ["leave_welfare_allowances", "documented_procedure", "complete_records", "process"]
    },
    "circ_leave_welfare_allowances_gen_028": {
        "question": "Which practice best supports compliance assurance in leave, welfare, and allowance administration?",
        "options": [
            "Consistent application of approved rules and escalation of exceptions.",
            "Routine treatment of exceptions without justification.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support."
        ],
        "explanation": "Compliance assurance in leave, welfare, and allowance administration is strengthened by consistent application of approved rules and escalation of exceptions.",
        "keywords": ["leave_welfare_allowances", "compliance_assurance", "approved_rules", "exceptions"]
    },
    "circ_leave_welfare_allowances_gen_029": {
        "question": "Which practice best demonstrates public accountability in leave, welfare, and allowance administration?",
        "options": [
            "Traceable decisions and evidence-based justification.",
            "Convenience ahead of policy and legal requirements.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference."
        ],
        "explanation": "Public accountability in leave, welfare, and allowance administration depends on traceable decisions supported by evidence-based justification.",
        "keywords": ["leave_welfare_allowances", "public_accountability", "traceable_decisions", "evidence_based_justification"]
    },
    "circ_leave_welfare_allowances_gen_030": {
        "question": "Which practice best supports service integrity in leave, welfare, and allowance administration?",
        "options": [
            "Conflict-of-interest avoidance and disclosure of relevant constraints.",
            "Case closure without verifying facts or required records.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge."
        ],
        "explanation": "Service integrity in leave, welfare, and allowance administration is protected when conflicts of interest are avoided and relevant constraints are disclosed on the record.",
        "keywords": ["leave_welfare_allowances", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "circ_leave_welfare_allowances_gen_031": {
        "question": "Which practice best demonstrates risk control in leave, welfare, and allowance administration?",
        "options": [
            "Early risk identification, applied controls, and documented mitigation.",
            "Continued non-compliance after adverse feedback.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience."
        ],
        "explanation": "Risk control in leave, welfare, and allowance administration depends on early risk identification, applied controls, and documented mitigation.",
        "keywords": ["leave_welfare_allowances", "risk_control", "mitigation", "controls"]
    },
    "circ_leave_welfare_allowances_gen_032": {
        "question": "Which practice reflects proper decision-transparency standards in leave, welfare, and allowance administration?",
        "options": [
            "Clear criteria and prompt communication of decisions.",
            "Informal instructions without documentary support.",
            "Delayed decisions until avoidable crises emerge.",
            "Routine treatment of exceptions without justification."
        ],
        "explanation": "Decision transparency in leave, welfare, and allowance administration requires clear criteria and prompt communication of decisions to affected officers.",
        "keywords": ["leave_welfare_allowances", "decision_transparency", "clear_criteria", "communication"]
    },
    "circ_leave_welfare_allowances_gen_033": {
        "question": "Which practice best supports operational discipline in leave, welfare, and allowance administration?",
        "options": [
            "Approved workflows and verified outputs before closure.",
            "Inconsistent rule application based on personal preference.",
            "Skipped review checks for convenience.",
            "Convenience ahead of policy and legal requirements."
        ],
        "explanation": "Operational discipline in leave, welfare, and allowance administration is supported by approved workflows and verification of outputs before closure.",
        "keywords": ["leave_welfare_allowances", "operational_discipline", "approved_workflows", "verified_outputs"]
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
