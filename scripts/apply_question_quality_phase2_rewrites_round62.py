import json
from pathlib import Path

DATA_PATH = Path("data/policy_analysis.json")

UPDATES = {
    "pol_analysis_methods_gen_083": {
        "question": "Which action best demonstrates sound governance in policy analysis work?",
        "options": [
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time.",
            "Apply approved analytical procedures and keep complete records.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Sound governance in policy analysis requires the use of approved procedures together with complete records that allow the analysis to be reviewed later.",
        "keywords": ["policy_analysis_governance", "approved_procedures", "records", "analytical_work"]
    },
    "pol_analysis_methods_gen_084": {
        "question": "Which practice best protects evidence quality in policy analysis?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time.",
            "Use credible data sources and validate assumptions."
        ],
        "explanation": "Evidence quality improves when analysts rely on credible data sources and test the assumptions behind their conclusions.",
        "keywords": ["evidence_quality", "policy_analysis", "credible_sources", "validate_assumptions"]
    },
    "pol_analysis_methods_gen_085": {
        "question": "Which step most improves traceability and fairness when policy-analysis decisions are being made?",
        "options": [
            "Rely on verbal approval and close the file without documentary trail.",
            "Treat exceptions as normal practice without written justification.",
            "Delay escalation until issues become material and difficult to reverse.",
            "Use validated data sources and document assumptions behind recommendations."
        ],
        "explanation": "Traceability and fairness improve when the evidence base is validated and the assumptions supporting the recommendation are clearly documented.",
        "keywords": ["traceability", "fairness", "validated_data", "documented_assumptions"]
    },
    "pol_analysis_methods_gen_087": {
        "question": "Which approach best supports accountable implementation in policy analysis?",
        "options": [
            "Define the problem, options, and measurable criteria before selecting a policy path.",
            "Proceed without validating source records and decision criteria.",
            "Delay escalation until issues become material and difficult to reverse.",
            "Treat exceptions as normal practice without written justification."
        ],
        "explanation": "Accountable implementation starts with a disciplined formulation process that defines the problem, the options, and the measurable criteria for choosing between them.",
        "keywords": ["accountable_implementation", "policy_analysis", "problem_definition", "decision_criteria"]
    },
    "pol_analysis_methods_gen_088": {
        "question": "Which practice best supports risk management in policy analysis?",
        "options": [
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time.",
            "Ignore feedback and continue non-compliant procedures.",
            "Identify control gaps early and escalate material exceptions promptly."
        ],
        "explanation": "Risk management in policy analysis requires early identification of control gaps and timely escalation of any exception that could materially affect the recommendation.",
        "keywords": ["risk_management", "policy_analysis", "control_gaps", "escalation"]
    },
    "pol_analysis_methods_gen_089": {
        "question": "Which practice best protects service integrity in policy analysis work?",
        "options": [
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Service integrity in policy analysis depends on avoiding conflicts of interest and disclosing any constraint that could compromise impartial judgment.",
        "keywords": ["service_integrity", "policy_analysis", "conflict_of_interest", "disclosure"]
    },
    "pol_analysis_methods_gen_093": {
        "question": "A supervisor is reviewing gaps in policy analysis work. Which action best strengthens control and consistency before rollout?",
        "options": [
            "Use inconsistent criteria across similar cases in the same period.",
            "Bypass review checkpoints where timelines are tight.",
            "Prioritize convenience over approved procedure requirements.",
            "Assign roles, timelines, resources, and monitoring checkpoints before rollout."
        ],
        "explanation": "Control and consistency improve when implementation expectations are defined in advance through clear roles, timelines, resources, and monitoring checkpoints.",
        "keywords": ["control_and_consistency", "policy_analysis", "roles", "monitoring_checkpoints"]
    },
    "pol_analysis_methods_gen_095": {
        "question": "Which approach best supports accountable implementation when evidence is being reviewed in policy analysis?",
        "options": [
            "Proceed without validating source records and decision criteria.",
            "Rely on verbal approval and close the file without documentary trail.",
            "Use validated data sources and document assumptions behind recommendations.",
            "Delay escalation until issues become material and difficult to reverse."
        ],
        "explanation": "Evidence-based implementation is more accountable when recommendations rest on validated data and clearly documented assumptions.",
        "keywords": ["accountable_implementation", "evidence_review", "validated_sources", "documented_assumptions"]
    },
    "pol_analysis_methods_gen_099": {
        "question": "Which practice best promotes transparent decision-making in policy analysis?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Rely on informal instructions without documentary evidence.",
            "Use clear criteria and communicate decisions promptly.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Transparent policy analysis depends on clear decision criteria and prompt communication of how the final position was reached.",
        "keywords": ["decision_transparency", "policy_analysis", "clear_criteria", "communication"]
    },
    "pol_public_sector_planning_gen_076": {
        "question": "A ministry unit is updating its planning workflow. Which action best promotes transparent decision-making?",
        "options": [
            "Use clear criteria and communicate decisions promptly.",
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Transparent planning decisions require clear criteria and prompt communication so that the basis of the decision can be understood and reviewed.",
        "keywords": ["public_sector_planning", "decision_transparency", "clear_criteria", "communication"]
    },
    "pol_public_sector_planning_gen_077": {
        "question": "Which practice best supports impact evaluation in public sector planning?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Measure outcomes against baseline and policy objectives.",
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Impact evaluation is meaningful only when actual outcomes are measured against a baseline and the policy objectives that justified the intervention.",
        "keywords": ["impact_evaluation", "public_sector_planning", "baseline", "policy_objectives"]
    },
    "pol_public_sector_planning_gen_079": {
        "question": "When a planning unit faces competing priorities, which action best preserves compliance and service quality?",
        "options": [
            "Define the problem, options, and measurable criteria before selecting a policy path.",
            "Bypass review checkpoints where timelines are tight.",
            "Apply discretionary shortcuts to accelerate closure regardless of controls.",
            "Prioritize convenience over approved procedure requirements."
        ],
        "explanation": "Compliance and service quality are better preserved when planning choices are made through a disciplined process that defines the problem, the options, and the criteria for selection.",
        "keywords": ["competing_priorities", "public_sector_planning", "service_quality", "decision_criteria"]
    },
    "pol_public_sector_planning_gen_080": {
        "question": "Which practice best supports compliance in public sector planning?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Use lawful criteria and document each decision step transparently.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Planning compliance improves when decisions are based on lawful criteria and each step is documented transparently enough to be reviewed later.",
        "keywords": ["planning_compliance", "lawful_criteria", "decision_documentation", "transparency"]
    },
    "pol_public_sector_planning_gen_081": {
        "question": "Which practice best supports risk management in public sector planning?",
        "options": [
            "Bypass review and approval controls to save time.",
            "Ignore feedback and continue non-compliant procedures.",
            "Prioritize convenience over policy and legal requirements.",
            "Identify control gaps early and escalate material exceptions promptly."
        ],
        "explanation": "Risk management in planning work depends on identifying control gaps early and escalating any material exception before it undermines implementation.",
        "keywords": ["risk_management", "public_sector_planning", "control_gaps", "material_exceptions"]
    },
    "pol_public_sector_planning_gen_083": {
        "question": "In a time-sensitive planning file, which step best preserves operational discipline without breaching procedure?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Bypass review and approval controls to save time.",
            "Follow approved workflows and verify outputs before closure.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Operational discipline is maintained when officers follow approved workflows and verify outputs before they close the case, even under time pressure.",
        "keywords": ["operational_discipline", "planning_file", "approved_workflows", "verification"]
    },
    "pol_public_sector_planning_gen_084": {
        "question": "A desk officer handling planning work receives a case that requires log management. What should be done first?",
        "options": [
            "Maintain accurate files and update status at each control point.",
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Log management starts with keeping accurate files and updating status at each control point so the record remains reliable for audit and follow-up.",
        "keywords": ["log_management", "public_sector_planning", "accurate_files", "status_updates"]
    },
    "pol_public_sector_planning_gen_085": {
        "question": "Which action best demonstrates risk management in public sector planning?",
        "options": [
            "Prioritize convenience over policy and legal requirements.",
            "Identify control gaps early and escalate material exceptions promptly.",
            "Apply rules inconsistently based on personal preference.",
            "Ignore feedback and continue non-compliant procedures."
        ],
        "explanation": "Risk management in planning is demonstrated by identifying control gaps early and escalating material exceptions before they damage delivery.",
        "keywords": ["risk_management", "public_sector_planning", "control_gaps", "early_escalation"]
    },
    "pol_public_sector_planning_gen_087": {
        "question": "Which practice should an accountable officer prioritize to sustain compliance in public sector planning?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or keeping proper records.",
            "Rely on informal instructions without documentary evidence.",
            "Use lawful criteria and document each decision step transparently."
        ],
        "explanation": "An accountable officer sustains planning compliance by using lawful criteria and documenting each decision step transparently.",
        "keywords": ["accountable_officer", "planning_compliance", "lawful_criteria", "documentation"]
    },
    "pol_public_sector_planning_gen_088": {
        "question": "A ministry unit is updating its planning workflow. Which action best promotes impact evaluation?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Measure outcomes against baseline and policy objectives.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Impact evaluation is strengthened when outcomes are measured against a baseline and the objectives that the policy was meant to achieve.",
        "keywords": ["planning_workflow", "impact_evaluation", "baseline", "policy_objectives"]
    },
    "pol_public_sector_planning_gen_090": {
        "question": "A ministry unit is updating its planning workflow. Which action best supports sound policy formulation?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Define the problem, options, and decision criteria clearly.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Sound policy formulation begins by clearly defining the problem, the available options, and the criteria that will be used to choose among them.",
        "keywords": ["policy_formulation", "planning_workflow", "problem_definition", "decision_criteria"]
    },
    "pol_public_sector_planning_gen_091": {
        "question": "Which practice best protects service integrity in public sector planning?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Service integrity in public sector planning depends on avoiding conflicts of interest and disclosing any constraint that could affect impartial judgment.",
        "keywords": ["service_integrity", "public_sector_planning", "conflict_of_interest", "disclosure"]
    },
    "pol_public_sector_planning_gen_093": {
        "question": "Which practice best supports good performance standards in public sector planning?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Set measurable targets, monitor progress, and correct deviations.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Good performance standards in planning require measurable targets, active monitoring, and correction of deviation before delivery suffers.",
        "keywords": ["performance_standards", "public_sector_planning", "measurable_targets", "monitoring"]
    },
    "pol_public_sector_planning_gen_096": {
        "question": "Which approach best supports accountable implementation in routine public sector planning work?",
        "options": [
            "Delay escalation until issues become material and difficult to reverse.",
            "Treat exceptions as normal practice without written justification.",
            "Define the problem, options, and measurable criteria before selecting a policy path.",
            "Proceed without validating source records and decision criteria."
        ],
        "explanation": "Accountable implementation is more likely when the planning stage clearly defines the problem, the options, and the measurable criteria used to choose a path.",
        "keywords": ["accountable_implementation", "public_sector_planning", "problem_definition", "measurable_criteria"]
    },
    "pol_public_sector_planning_gen_098": {
        "question": "Which approach best supports compliance in routine public sector planning operations?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Use lawful criteria and document each decision step transparently.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Routine planning compliance depends on lawful criteria and transparent documentation of each decision step rather than informal shortcuts.",
        "keywords": ["planning_compliance", "routine_operations", "lawful_criteria", "documentation"]
    },
    "pol_public_sector_planning_gen_099": {
        "question": "A supervisor is reviewing compliance gaps in public sector planning. Which action best strengthens risk management?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Bypass review and approval controls to save time.",
            "Identify control gaps early and escalate material exceptions promptly.",
            "Prioritize convenience over policy and legal requirements."
        ],
        "explanation": "Risk management is strengthened when control gaps are identified early and material exceptions are escalated before they grow into delivery failures.",
        "keywords": ["risk_management", "compliance_gaps", "public_sector_planning", "escalation"]
    },
    "pol_public_sector_planning_gen_100": {
        "question": "Which practice best reflects good public-sector planning?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Align plans with budget, legal mandate, and service priorities."
        ],
        "explanation": "Good public-sector planning aligns proposed action with available budget, legal mandate, and the service priorities the organization is expected to deliver.",
        "keywords": ["public_sector_planning", "budget_alignment", "legal_mandate", "service_priorities"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid in UPDATES:
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
