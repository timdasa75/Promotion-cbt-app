import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")

UPDATES = {
    "ethics_095": {
        "question": "What type of control is emphasized for the collection of all revenues under the duty of the Accounting Officer?",
        "options": [
            "Internal control.",
            "Centralized control.",
            "Informal control.",
            "External control."
        ],
        "explanation": "Financial Regulation 1603(g) emphasizes the need for an adequate system of internal control over the collection of all revenues under the Accounting Officer's responsibility.",
        "keywords": ["internal_control", "revenue_collection", "accounting_officer", "financial_regulation_1603g"]
    },
    "ethics_096": {
        "question": "Who bears primary accountability for discrepancies in financial records within a self-accounting unit?",
        "options": [
            "The external auditor.",
            "The Accountant-General.",
            "Junior staff.",
            "The Accounting Officer."
        ],
        "explanation": "The Accounting Officer bears primary accountability because that office is responsible for ensuring compliance with regulations and proper accounting within the unit.",
        "keywords": ["accounting_officer", "self_accounting_unit", "financial_records", "accountability"]
    },
    "ethics_098": {
        "question": "Which two arms of the Federal Government share accountability for the Federal Budget?",
        "options": [
            "The Executive and the Judiciary.",
            "The Judiciary and the Legislature.",
            "The President and the Chief Justice.",
            "The Executive and the Legislature."
        ],
        "explanation": "Accountability for the Federal Budget is shared between the Executive, which prepares and implements it, and the Legislature, which authorizes and oversees it.",
        "keywords": ["federal_budget", "executive", "legislature", "accountability"]
    },
    "ethics_106": {
        "question": "Which constitutional body is responsible for promoting ethical conduct in public service?",
        "options": [
            "Code of Conduct Bureau.",
            "Federal Character Commission.",
            "INEC.",
            "National Assembly."
        ],
        "explanation": "The Code of Conduct Bureau is the constitutional body associated with enforcing ethical standards and declarations for public officers.",
        "keywords": ["code_of_conduct_bureau", "ethical_conduct", "public_service", "constitutional_body"]
    },
    "ethics_109": {
        "question": "Which principle ensures that civil servants act as responsible stewards of public resources?",
        "options": [
            "Integrity.",
            "Transparency.",
            "Confidentiality.",
            "Accountability."
        ],
        "explanation": "Accountability ensures that civil servants remain answerable for how they use public resources and discharge public trust.",
        "keywords": ["accountability", "public_resources", "stewardship", "civil_service"]
    },
    "eth_conflict_interest_gen_081": {
        "question": "Which practice best supports sound governance of conflicts of interest?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Apply approved conflict-of-interest procedures and keep complete records.",
            "Prioritize convenience over policy and legal requirements.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Conflict-of-interest governance is strongest when approved procedures are followed and the related actions are fully documented.",
        "keywords": ["conflict_of_interest", "governance", "approved_procedures", "records"]
    },
    "eth_conflict_interest_gen_083": {
        "question": "Which practice best reflects public accountability when handling conflicts of interest?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Ignore feedback and continue non-compliant procedures.",
            "Provide traceable decisions and evidence-based justification."
        ],
        "explanation": "Public accountability in conflict-of-interest cases depends on traceable decisions supported by evidence-based justification.",
        "keywords": ["conflict_of_interest", "public_accountability", "traceable_decisions", "evidence_based_justification"]
    },
    "eth_conflict_interest_gen_086": {
        "question": "Which practice best reflects citizen-focused service when handling conflicts of interest?",
        "options": [
            "Balance legality, fairness, timeliness, and service quality.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Citizen-focused service in conflict-of-interest handling requires a balance of legality, fairness, timeliness, and service quality.",
        "keywords": ["citizen_focused_service", "conflict_of_interest", "fairness", "service_quality"]
    },
    "eth_conflict_interest_gen_089": {
        "question": "Which practice best promotes transparent decision-making in conflict-of-interest cases?",
        "options": [
            "Use clear criteria and communicate decisions promptly.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Decision transparency improves when the criteria are clear and the outcome is communicated promptly to the people concerned.",
        "keywords": ["decision_transparency", "conflict_of_interest", "clear_criteria", "communication"]
    },
    "eth_conflict_interest_gen_090": {
        "question": "Which misconduct involves using an official position to obtain undue advantage?",
        "options": [
            "Abuse of office.",
            "Fraud.",
            "Conflict of interest.",
            "Nepotism."
        ],
        "explanation": "Using official position for undue personal advantage is a form of abuse of office because it misuses entrusted public authority.",
        "keywords": ["abuse_of_office", "undue_advantage", "misconduct", "official_position"]
    },
    "eth_conflict_interest_gen_091": {
        "question": "Which of the following is a clear example of conflict of interest in the civil service?",
        "options": [
            "Taking annual leave.",
            "Awarding contracts to oneself.",
            "Attending official training.",
            "Writing memos."
        ],
        "explanation": "Awarding contracts to oneself is a classic conflict of interest because private interest directly interferes with impartial official judgment.",
        "keywords": ["conflict_of_interest", "civil_service", "self_awarded_contract", "impartiality"]
    },
    "eth_conflict_interest_gen_092": {
        "question": "Which approach best supports sound performance standards in routine conflict-of-interest work?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Set measurable targets, monitor progress, and correct deviations."
        ],
        "explanation": "Performance standards are maintained when work is guided by measurable targets, active monitoring, and timely correction of deviations.",
        "keywords": ["performance_standards", "conflict_of_interest", "measurable_targets", "monitoring"]
    },
    "eth_conflict_interest_gen_093": {
        "question": "Which practice best supports compliance in conflict-of-interest work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Use lawful criteria and document each decision step transparently.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Compliance in conflict-of-interest work is strengthened when lawful criteria are used and each decision step is documented transparently.",
        "keywords": ["conflict_of_interest", "compliance", "lawful_criteria", "documentation"]
    },
    "eth_conflict_interest_gen_094": {
        "question": "Which practice should an officer prioritize to sustain service integrity in conflict-of-interest work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Service integrity is protected when officers avoid conflicts of interest and disclose any constraint that could compromise impartial judgment.",
        "keywords": ["service_integrity", "conflict_of_interest", "disclosure", "impartiality"]
    },
    "eth_misconduct_gen_071": {
        "question": "Which practice best upholds service integrity in misconduct and discipline work?",
        "options": [
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Service integrity in misconduct work requires impartial handling, which is strengthened by avoiding conflicts of interest and disclosing any relevant constraint.",
        "keywords": ["service_integrity", "misconduct", "discipline", "disclosure"]
    },
    "eth_misconduct_gen_073": {
        "question": "Which practice best supports administrative ethics in misconduct and discipline work?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence.",
            "Uphold neutrality, integrity, and service professionalism.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Administrative ethics in discipline work depend on neutrality, integrity, and professional conduct rather than improvised or partisan handling.",
        "keywords": ["administrative_ethics", "misconduct", "neutrality", "professionalism"]
    },
    "eth_misconduct_gen_074": {
        "question": "Which practice best supports compliance in misconduct and discipline work?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Use lawful criteria and document each decision step transparently.",
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Compliance is improved when misconduct decisions are based on lawful criteria and each step is documented transparently.",
        "keywords": ["misconduct", "discipline", "compliance", "lawful_criteria"]
    },
    "eth_misconduct_gen_075": {
        "question": "Which practice best supports good performance standards in misconduct and discipline work?",
        "options": [
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records.",
            "Set measurable targets, monitor progress, and correct deviations."
        ],
        "explanation": "Performance standards in misconduct work are stronger when expectations are measurable, progress is monitored, and deviations are corrected early.",
        "keywords": ["performance_standards", "misconduct", "measurable_targets", "monitoring"]
    },
    "eth_misconduct_gen_077": {
        "question": "Which set of rules prohibits the acceptance of double remuneration in the civil service?",
        "options": [
            "Procurement Act.",
            "Labour Act.",
            "Financial Regulations.",
            "Public Service Rules."
        ],
        "explanation": "The Public Service Rules contain the rule-based prohibition against double remuneration in the civil service context.",
        "keywords": ["double_remuneration", "public_service_rules", "civil_service", "misconduct"]
    },
    "eth_misconduct_gen_078": {
        "question": "Which action best demonstrates sound performance standards in misconduct and discipline work?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Set measurable targets, monitor progress, and correct deviations.",
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Sound performance standards rely on measurable targets, monitoring, and timely correction of deviation rather than informal or reactive handling.",
        "keywords": ["misconduct", "performance_standards", "measurable_targets", "corrective_action"]
    },
    "eth_misconduct_gen_080": {
        "question": "Which practice best promotes transparent decision-making in misconduct and discipline matters?",
        "options": [
            "Use clear criteria and communicate decisions promptly.",
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Decision transparency improves when the basis of the disciplinary decision is clear and the outcome is communicated promptly.",
        "keywords": ["decision_transparency", "misconduct", "clear_criteria", "communication"]
    },
    "eth_misconduct_gen_083": {
        "question": "Which misconduct involves unauthorized absence from duty?",
        "options": [
            "Abuse of office.",
            "Absenteeism.",
            "Conflict of interest.",
            "Corruption."
        ],
        "explanation": "Unauthorized absence from duty is categorized as absenteeism in disciplinary practice.",
        "keywords": ["absenteeism", "unauthorized_absence", "misconduct", "discipline"]
    },
    "eth_misconduct_gen_087": {
        "question": "Which practice best improves accountability through stronger risk management in misconduct and discipline work?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Apply rules inconsistently based on personal preference.",
            "Prioritize convenience over policy and legal requirements.",
            "Identify control gaps early and escalate material exceptions promptly."
        ],
        "explanation": "Accountability improves when misconduct risks are identified early and material exceptions are escalated before they grow into larger control failures.",
        "keywords": ["accountability", "risk_management", "misconduct", "material_exceptions"]
    },
    "eth_misconduct_gen_089": {
        "question": "Which action best demonstrates sound risk management in misconduct and discipline work?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Prioritize convenience over policy and legal requirements.",
            "Identify control gaps early and escalate material exceptions promptly.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Risk management in misconduct work depends on early identification of control gaps and timely escalation of significant exceptions.",
        "keywords": ["risk_management", "misconduct", "control_gaps", "escalation"]
    },
    "eth_misconduct_gen_091": {
        "question": "Which practice best reflects citizen-focused service in misconduct and discipline work?",
        "options": [
            "Balance legality, fairness, timeliness, and service quality.",
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Citizen-focused service in discipline work requires legality, fairness, timeliness, and service quality to be balanced rather than treated as competing afterthoughts.",
        "keywords": ["citizen_focused_service", "misconduct", "fairness", "service_quality"]
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
