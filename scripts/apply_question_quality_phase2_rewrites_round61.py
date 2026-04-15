import json
from pathlib import Path

DATA_PATH = Path("data/leadership_negotiation.json")

UPDATES = {
    "leadership_mpf_052": {
        "question": "How is Category B training described in relation to an MDA's mandate?",
        "options": [
            "It must always be funded by the MDA.",
            "It is a prerequisite for political appointment.",
            "It is beneficial to the officer but not crucial to the MDA's core mandate.",
            "It is compulsory for promotion to GL 17."
        ],
        "explanation": "Category B training is beneficial to the officer's development, but it is not considered essential to the immediate attainment of the MDA's mandate.",
        "keywords": ["category_b_training", "mda_mandate", "staff_development", "training_policy"]
    },
    "leadership_mpf_055": {
        "question": "A ministry unit is updating its performance workflow. Which action best strengthens team leadership while keeping work reviewable?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Clarify roles, remove blockers, and coach for improved outcomes."
        ],
        "explanation": "Team leadership is strengthened when roles are clear, obstacles are addressed early, and supervisors coach staff toward better outcomes in a way that can still be reviewed later.",
        "keywords": ["team_leadership", "performance_workflow", "role_clarity", "coaching"]
    },
    "leadership_mpf_057": {
        "question": "Why should a performance report be jointly signed by the officer and the immediate supervisor?",
        "options": [
            "To promote accuracy and fairness.",
            "To secure Federal Civil Service Commission approval.",
            "To trigger automatic salary increment.",
            "To reduce staff transfers."
        ],
        "explanation": "Joint signature helps confirm that the assessment has been seen by both parties and supports accuracy and fairness in the reporting process.",
        "keywords": ["performance_report", "joint_signature", "accuracy", "fairness"]
    },
    "leadership_mpf_058": {
        "question": "Which practice best reflects sound team leadership in performance management?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Clarify roles, remove blockers, and coach for improved outcomes.",
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Sound team leadership in performance management requires clarity of responsibility, active support, and coaching that improves results rather than leaving problems to grow.",
        "keywords": ["team_leadership", "performance_management", "role_clarity", "coaching"]
    },
    "leadership_mpf_059": {
        "question": "Which system replaced the Annual Performance Evaluation Report (APER) under OHCSF circulars?",
        "options": [
            "360-Degree Feedback.",
            "KPI Scorecard.",
            "Merit Award System.",
            "Performance Management System (PMS)."
        ],
        "explanation": "OHCSF circulars replaced the APER approach with the Performance Management System, which is intended to support a more structured and measurable approach to performance oversight.",
        "keywords": ["aper", "performance_management_system", "ohcsf", "performance_reform"]
    },
    "leadership_mpf_060": {
        "question": "Which practice best supports stakeholder negotiation in management and performance work?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
            "Use principled negotiation and document agreed commitments."
        ],
        "explanation": "Stakeholder negotiation is strongest when it is principled, transparent, and supported by a clear record of what was agreed.",
        "keywords": ["stakeholder_negotiation", "management_performance", "principled_negotiation", "agreed_commitments"]
    },
    "leadership_mpf_061": {
        "question": "In a Balanced Scorecard approach, strategic objectives should be linked to what measurable output?",
        "options": [
            "Government circulars.",
            "Key performance indicators (KPIs).",
            "Employee grievances.",
            "Budgetary allocations only."
        ],
        "explanation": "The Balanced Scorecard links strategic objectives to measurable indicators so management can monitor whether the organization is actually progressing toward its goals.",
        "keywords": ["balanced_scorecard", "strategic_objectives", "kpis", "performance_measurement"]
    },
    "leadership_mpf_062": {
        "question": "Which practice best supports good performance standards in management work?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or keeping proper records.",
            "Set measurable targets, monitor progress, and correct deviations.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Good performance standards depend on measurable targets, active monitoring, and timely correction when work drifts away from the expected result.",
        "keywords": ["performance_standards", "measurable_targets", "monitoring", "corrective_action"]
    },
    "leadership_mpf_064": {
        "question": "Which practice best promotes transparent decision-making in management work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Rely on informal instructions without documentary evidence.",
            "Use clear criteria and communicate decisions promptly."
        ],
        "explanation": "Decision-making is more transparent when the basis for the decision is clear and the outcome is communicated promptly to the people affected.",
        "keywords": ["decision_transparency", "management_work", "clear_criteria", "communication"]
    },
    "leadership_mpf_065": {
        "question": "For what calculation is a personal allowance treated as part of an officer's substantive basic emolument under the cited rule?",
        "options": [
            "Overtime payment.",
            "Annual leave entitlement.",
            "Promotion arrears.",
            "Resettlement allowance."
        ],
        "explanation": "Under the cited rule, the personal allowance is treated as part of substantive basic emolument when calculating resettlement allowance.",
        "keywords": ["personal_allowance", "basic_emolument", "resettlement_allowance", "rule_140134"]
    },
    "leadership_mpf_066": {
        "question": "Who gives the final approval for an officer's release on study leave after the Permanent Secretary's recommendation?",
        "options": [
            "The Federal Civil Service Commission.",
            "The Minister of Education.",
            "The Head of the Civil Service of the Federation.",
            "The Accountant-General of the Federation."
        ],
        "explanation": "The final release of an officer on study leave, once recommended by the Permanent Secretary, rests with the Head of the Civil Service of the Federation.",
        "keywords": ["study_leave", "final_approval", "permanent_secretary", "hcsf"]
    },
    "leadership_mpf_072": {
        "question": "What does benchmarking help an organization move toward?",
        "options": [
            "Increased secrecy.",
            "Continuous improvement.",
            "Decreased transparency.",
            "Stagnation."
        ],
        "explanation": "Benchmarking encourages continuous improvement by comparing performance and practice against better-performing standards or peers.",
        "keywords": ["benchmarking", "continuous_improvement", "organizational_learning", "management"]
    },
    "leadership_mpf_075": {
        "question": "Under the Reward and Recognition Scheme, what should awards be based on?",
        "options": [
            "The length of the officer's resume.",
            "The total number of staff recruited.",
            "Measurable results and evaluated output.",
            "The opinion of the Minister only."
        ],
        "explanation": "A credible reward and recognition scheme should be tied to measurable results and properly evaluated output, not to personal preference or irrelevant factors.",
        "keywords": ["reward_and_recognition", "measurable_results", "evaluated_output", "performance"]
    },
    "neg_principles_outcomes_gen_066": {
        "question": "Which practice best supports stakeholder negotiation under sound negotiation principles?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Use principled negotiation and document agreed commitments.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures."
        ],
        "explanation": "Stakeholder negotiation is more durable when it is principled and when agreed commitments are clearly documented for follow-up.",
        "keywords": ["stakeholder_negotiation", "negotiation_principles", "principled_negotiation", "commitments"]
    },
    "neg_principles_outcomes_gen_069": {
        "question": "Which action best supports sound team leadership in negotiation work?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Clarify roles, remove blockers, and coach for improved outcomes.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Team leadership in negotiation work is improved when responsibilities are clear, obstacles are addressed early, and people are coached toward better outcomes.",
        "keywords": ["team_leadership", "negotiation_work", "role_clarity", "coaching"]
    },
    "neg_principles_outcomes_gen_071": {
        "question": "Which practice best protects service integrity in negotiation work?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Service integrity in negotiation work depends on avoiding conflicts of interest and disclosing any constraint that could compromise impartial judgment.",
        "keywords": ["service_integrity", "negotiation_work", "conflict_of_interest", "disclosure"]
    },
    "neg_principles_outcomes_gen_075": {
        "question": "A ministry unit is updating its negotiation workflow. Which action best promotes transparent decision-making?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence.",
            "Use clear criteria and communicate decisions promptly."
        ],
        "explanation": "Transparent negotiation practice depends on clear decision criteria and prompt communication of outcomes so the process can be understood and reviewed.",
        "keywords": ["negotiation_workflow", "decision_transparency", "clear_criteria", "communication"]
    },
    "neg_principles_outcomes_gen_076": {
        "question": "A ministry unit is updating its negotiation workflow. Which action best strengthens team leadership?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Clarify roles, remove blockers, and coach for improved outcomes.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Team leadership improves when leaders make responsibilities clear, remove obstacles, and coach staff instead of leaving the team to struggle through avoidable problems.",
        "keywords": ["negotiation_workflow", "team_leadership", "role_clarity", "coaching"]
    },
    "neg_principles_outcomes_gen_081": {
        "question": "Which practice best promotes transparent decision-making in negotiation work?",
        "options": [
            "Use clear criteria and communicate decisions promptly.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Decision transparency in negotiation depends on clear criteria, prompt communication, and a process that others can understand and review.",
        "keywords": ["negotiation_work", "decision_transparency", "clear_criteria", "communication"]
    },
    "neg_structure_bodies_gen_067": {
        "question": "Which of the following is not a recognized level in the NPSNC negotiation structure?",
        "options": [
            "Departmental Council.",
            "Local Council.",
            "Regional Council.",
            "National Council."
        ],
        "explanation": "The NPSNC structure recognizes specified councils such as national and departmental levels, but not a regional council level in that framework.",
        "keywords": ["npsnc", "negotiation_structure", "recognized_levels", "regional_council"]
    },
    "neg_structure_bodies_gen_069": {
        "question": "Which action best reflects citizen-focused service within negotiating structures and bodies?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Balance legality, fairness, timeliness, and service quality.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Citizen-focused service in negotiation structures requires a balance of legality, fairness, timeliness, and service quality rather than administrative convenience.",
        "keywords": ["citizen_focused_service", "negotiating_structures", "fairness", "service_quality"]
    },
    "neg_structure_bodies_gen_075": {
        "question": "A ministry unit is updating its negotiating-structures workflow. Which action best promotes transparent decision-making?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence.",
            "Use clear criteria and communicate decisions promptly.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Transparency in negotiating structures is improved when decisions follow clear criteria and the outcome is communicated promptly and consistently.",
        "keywords": ["negotiating_structures", "decision_transparency", "clear_criteria", "communication"]
    },
    "neg_structure_bodies_gen_084": {
        "question": "Which level of the NPSNC structure ensures that nationally agreed terms and conditions are implemented in individual ministries?",
        "options": [
            "National Council.",
            "Departmental Council.",
            "Standing Committee.",
            "State Council."
        ],
        "explanation": "The Departmental Council helps carry nationally agreed terms and conditions into implementation at ministry level.",
        "keywords": ["npsnc", "departmental_council", "implementation", "terms_and_conditions"]
    },
    "neg_structure_bodies_gen_085": {
        "question": "Which practice best sustains operational discipline in negotiating structures and bodies?",
        "options": [
            "Follow approved workflows and verify outputs before closure.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time.",
            "Ignore feedback and continue non-compliant procedures."
        ],
        "explanation": "Operational discipline in negotiating structures depends on following approved workflows and verifying outputs before a task is closed.",
        "keywords": ["operational_discipline", "negotiating_structures", "approved_workflows", "verification"]
    },
    "neg_structure_bodies_gen_088": {
        "question": "Which practice best reflects sound team leadership in negotiating structures and bodies?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Clarify roles, remove blockers, and coach for improved outcomes."
        ],
        "explanation": "Sound team leadership in negotiating structures requires clarity of roles, removal of avoidable blockers, and active coaching toward better results.",
        "keywords": ["team_leadership", "negotiating_structures", "role_clarity", "coaching"]
    },
    "neg_dispute_law_gen_068": {
        "question": "Which action best demonstrates team leadership in dispute-resolution work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Clarify roles, remove blockers, and coach for improved outcomes.",
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Team leadership in dispute-resolution work is improved when leaders make responsibilities clear, remove obstacles, and coach staff toward better outcomes.",
        "keywords": ["team_leadership", "dispute_resolution", "role_clarity", "coaching"]
    },
    "neg_dispute_law_gen_069": {
        "question": "Which practice best protects service integrity in dispute-resolution and labour-law work?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Service integrity in labour-relations work depends on avoiding conflicts of interest and disclosing any constraint that could affect impartial handling of the case.",
        "keywords": ["service_integrity", "dispute_resolution", "labour_law", "conflict_of_interest"]
    },
    "neg_dispute_law_gen_070": {
        "question": "What is the main duty of the Industrial Arbitration Panel in labour disputes?",
        "options": [
            "To mediate trade disputes informally.",
            "To supervise elections.",
            "To register trade unions.",
            "To adjudicate disputes referred by the Minister."
        ],
        "explanation": "The Industrial Arbitration Panel serves as an adjudicatory body for labour disputes referred to it through the statutory process.",
        "keywords": ["industrial_arbitration_panel", "labour_disputes", "adjudication", "ministerial_reference"]
    },
    "neg_dispute_law_gen_078": {
        "question": "In union finance, what are check-off dues?",
        "options": [
            "Union dues automatically deducted from salaries by the employer.",
            "Government subsidy for union activities.",
            "Performance bonuses.",
            "Negotiation expenses."
        ],
        "explanation": "Check-off dues are union dues deducted from workers' salaries by the employer and remitted in line with the applicable labour arrangement.",
        "keywords": ["check_off_dues", "union_finance", "salary_deduction", "employer_remittance"]
    },
    "neg_dispute_law_gen_081": {
        "question": "What is the name of a labour-dispute process in which an independent third party makes a binding decision?",
        "options": [
            "Mediation.",
            "Conciliation.",
            "Arbitration.",
            "Negotiation."
        ],
        "explanation": "Arbitration involves an independent third party whose decision is binding on the parties once the process is properly invoked.",
        "keywords": ["labour_dispute", "binding_decision", "arbitration", "independent_third_party"]
    },
    "neg_dispute_law_gen_086": {
        "question": "Which action best demonstrates sound dispute-resolution practice?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Address disputes early using lawful and structured mechanisms."
        ],
        "explanation": "Disputes are better resolved when they are handled early through lawful, structured mechanisms rather than through delay or improvised responses.",
        "keywords": ["dispute_resolution", "lawful_process", "early_intervention", "structured_mechanisms"]
    },
    "neg_dispute_law_gen_090": {
        "question": "Which practice best improves accountability in dispute-resolution and labour-law negotiation?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Use principled negotiation and document agreed commitments."
        ],
        "explanation": "Accountability in labour negotiation is strengthened when parties use principled negotiation and keep a clear record of agreed commitments.",
        "keywords": ["accountability", "labour_negotiation", "principled_negotiation", "agreed_commitments"]
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
