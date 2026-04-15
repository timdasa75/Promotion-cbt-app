import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")
TARGETS = {
    "eth_anti_corruption": {
        "eth_anti_corruption_gen_001": {
            "question": "Which practice best demonstrates sound anti-corruption governance in public service?",
            "options": [
                "Enforcing approved controls and keeping a complete decision trail.",
                "Leaving one officer to manage the full transaction without oversight.",
                "Treating small undocumented exceptions as harmless.",
                "Relaxing approval controls whenever pressure increases."
            ],
            "explanation": "Anti-corruption governance depends on approved controls, separation of duties, and a complete record that shows how each decision was made.",
            "keywords": ["anti_corruption", "governance", "controls", "decision_trail"]
        },
        "eth_anti_corruption_gen_002": {
            "question": "Which control most effectively prevents routine procurement decisions from sliding into corrupt practice?",
            "options": [
                "Using clear approval thresholds, documented steps, and separation of key duties.",
                "Allowing one trusted officer to handle the process from request to payment alone.",
                "Skipping documentation when a transaction appears too small to matter.",
                "Treating personal familiarity with vendors as an adequate safeguard."
            ],
            "explanation": "Routine procurement is best protected from corrupt practice by clear thresholds, documented process steps, and separation of key duties among different officers.",
            "keywords": ["anti_corruption", "procurement_control", "approval_thresholds", "separation_of_duties"]
        },
        "eth_anti_corruption_gen_003": {
            "question": "Which practice best supports anti-corruption risk management in an office?",
            "options": [
                "Identifying control gaps early and escalating material exceptions promptly.",
                "Waiting until an audit query appears before reporting a weakness.",
                "Treating repeated control failures as routine once work is completed.",
                "Allowing undocumented shortcuts when targets are under pressure."
            ],
            "explanation": "Anti-corruption risk management starts with early identification of control gaps and prompt escalation of material exceptions before abuse becomes entrenched.",
            "keywords": ["anti_corruption", "risk_management", "control_gaps", "exception_escalation"]
        },
        "eth_anti_corruption_gen_004": {
            "question": "Which conduct best reflects proper ethical standards in anti-corruption work?",
            "options": [
                "Acting with neutrality, integrity, and professional discipline.",
                "Overlooking irregularities when no complaint has yet been filed.",
                "Relying on verbal assurances instead of documentary support.",
                "Treating exceptions as normal when influential officers are involved."
            ],
            "explanation": "Anti-corruption work requires neutrality, integrity, and professional discipline so allegations and controls are handled fairly and credibly.",
            "keywords": ["anti_corruption", "ethical_standards", "neutrality", "integrity"]
        },
        "eth_anti_corruption_gen_005": {
            "question": "Which practice best supports grievance handling in an anti-corruption unit?",
            "options": [
                "Receiving complaints through fair, timely, and documented steps.",
                "Closing complaints quickly to avoid reputational pressure.",
                "Treating every complaint as a personal dispute rather than an official matter.",
                "Ignoring procedural lapses once the complainant becomes quiet."
            ],
            "explanation": "Grievances in anti-corruption work should be handled through fair, timely, and documented steps so the complaint can be reviewed on its merits.",
            "keywords": ["anti_corruption", "grievance_handling", "fair_process", "documentation"]
        },
        "eth_anti_corruption_gen_006": {
            "question": "Which management practice best supports performance in anti-corruption work?",
            "options": [
                "Using clear indicators, documented reviews, and follow-up on control failures.",
                "Measuring performance by speed alone without regard to procedure.",
                "Leaving weak controls untouched as long as targets are met.",
                "Avoiding formal review so unit weaknesses stay informal."
            ],
            "explanation": "Performance in anti-corruption work should be managed through clear indicators, documented review, and follow-up on weaknesses that expose the office to abuse.",
            "keywords": ["anti_corruption", "performance_management", "control_failures", "documented_reviews"]
        }
    },
    "eth_conflict_interest": {
        "eth_conflict_interest_gen_001": {
            "question": "Which practice best demonstrates sound conflict-of-interest governance in public service?",
            "options": [
                "Applying disclosure rules consistently and recording recusals properly.",
                "Allowing officers to manage private interests informally without disclosure.",
                "Treating undeclared interests as harmless if the officer seems fair.",
                "Leaving conflict decisions to personal judgment without a formal record."
            ],
            "explanation": "Conflict-of-interest governance depends on consistent disclosure rules, proper recusals, and a record that shows how the conflict was managed.",
            "keywords": ["conflict_of_interest", "governance", "disclosure", "recusal"]
        },
        "eth_conflict_interest_gen_002": {
            "question": "Which control best helps an officer manage a conflict of interest before it compromises a public decision?",
            "options": [
                "Disclosing the interest promptly, stepping back from the decision, and recording the recusal.",
                "Keeping the interest private if the officer believes the decision will still be fair.",
                "Participating fully and explaining the relationship only if someone later asks.",
                "Relying on personal integrity alone without using the formal disclosure process."
            ],
            "explanation": "The safest control is prompt disclosure followed by recusal and a proper record showing that the officer did not participate in the affected decision.",
            "keywords": ["conflict_of_interest", "disclosure", "recusal", "public_decision"]
        },
        "eth_conflict_interest_gen_003": {
            "question": "Which practice best supports conflict-of-interest risk management in an office?",
            "options": [
                "Reviewing interests early and escalating unresolved conflicts before decisions are taken.",
                "Waiting until a complaint arises before checking whether a conflict exists.",
                "Treating repeated disclosure failures as minor administrative issues.",
                "Allowing informal exceptions whenever a senior officer is involved."
            ],
            "explanation": "Conflict-of-interest risk is reduced when interests are reviewed early and unresolved conflicts are escalated before a public decision is compromised.",
            "keywords": ["conflict_of_interest", "risk_management", "early_review", "escalation"]
        },
        "eth_conflict_interest_gen_004": {
            "question": "Which conduct best reflects proper ethical standards when handling a conflict of interest?",
            "options": [
                "Maintaining neutrality, transparency, and professional restraint.",
                "Letting personal relationships shape how rules are applied.",
                "Handling disclosure issues through private understandings only.",
                "Treating incomplete declarations as acceptable where no protest is raised."
            ],
            "explanation": "Handling conflicts of interest properly requires neutrality, transparency, and professional restraint so the public can trust the integrity of the decision.",
            "keywords": ["conflict_of_interest", "ethical_standards", "neutrality", "transparency"]
        },
        "eth_conflict_interest_gen_005": {
            "question": "Which practice best supports grievance handling in conflict-of-interest cases?",
            "options": [
                "Reviewing complaints through fair, timely, and documented steps.",
                "Closing complaints quickly once the officer denies any problem.",
                "Treating disclosure complaints as private disagreements only.",
                "Ignoring procedural breaches if the final decision has already been issued."
            ],
            "explanation": "Complaints about conflicts of interest should be reviewed through fair, timely, and documented steps so the allegation and response can both be examined properly.",
            "keywords": ["conflict_of_interest", "grievance_handling", "fair_review", "documentation"]
        },
        "eth_conflict_interest_gen_006": {
            "question": "Which management practice best supports performance in conflict-of-interest control?",
            "options": [
                "Tracking disclosures, reviewing compliance trends, and following up on unresolved cases.",
                "Counting only how quickly cases are closed regardless of disclosure quality.",
                "Leaving repeated declaration failures outside formal review.",
                "Allowing informal settlements to replace compliance monitoring."
            ],
            "explanation": "Performance in conflict-of-interest control is strongest when disclosures are tracked, compliance trends are reviewed, and unresolved cases are followed up formally.",
            "keywords": ["conflict_of_interest", "performance_management", "disclosure_tracking", "compliance_review"]
        }
    },
    "eth_general": {
        "eth_general_gen_001": {
            "question": "Which practice best demonstrates sound ethical governance in public service?",
            "options": [
                "Applying approved ethical standards consistently and keeping a defensible record.",
                "Changing standards from case to case based on convenience.",
                "Leaving sensitive ethical decisions undocumented.",
                "Treating personal judgment as a substitute for formal guidance."
            ],
            "explanation": "Ethical governance is strongest when approved standards are applied consistently and the reasons for sensitive decisions are properly recorded.",
            "keywords": ["general_ethics", "governance", "ethical_standards", "recorded_reasons"]
        },
        "eth_general_gen_002": {
            "question": "Which daily work habit best helps a public officer keep routine decisions ethically sound?",
            "options": [
                "Applying the approved rules consistently and recording reasons for sensitive decisions.",
                "Relying on instinct even when the relevant rule is available.",
                "Adjusting ethical standards case by case to suit operational pressure.",
                "Treating undocumented exceptions as acceptable if the result seems useful."
            ],
            "explanation": "Routine decisions stay ethically sound when approved rules are applied consistently and reasons are recorded for decisions that may later require review.",
            "keywords": ["general_ethics", "routine_decisions", "approved_rules", "recorded_reasons"]
        },
        "eth_general_gen_003": {
            "question": "Which practice best supports ethics risk management in public service?",
            "options": [
                "Identifying ethical control gaps early and escalating serious exceptions promptly.",
                "Waiting for misconduct to become public before addressing warning signs.",
                "Treating repeated ethical lapses as normal under operational pressure.",
                "Allowing undocumented departures from standards when the outcome looks beneficial."
            ],
            "explanation": "Ethics risk management depends on identifying control gaps early and escalating serious exceptions before routine lapses harden into misconduct.",
            "keywords": ["general_ethics", "risk_management", "control_gaps", "exception_escalation"]
        },
        "eth_general_gen_004": {
            "question": "Which conduct best reflects proper ethical standards in everyday public service work?",
            "options": [
                "Showing neutrality, integrity, and service professionalism in routine decisions.",
                "Applying rules differently for friends, superiors, and strangers.",
                "Keeping important ethical decisions off the official record.",
                "Treating undocumented favours as harmless if no one complains."
            ],
            "explanation": "Everyday ethical conduct in public service depends on neutrality, integrity, and professionalism being maintained even in routine decisions.",
            "keywords": ["general_ethics", "ethical_standards", "neutrality", "professionalism"]
        },
        "eth_general_gen_005": {
            "question": "Which practice best supports grievance handling in an ethics-sensitive workplace issue?",
            "options": [
                "Addressing the complaint through fair, timely, and documented steps.",
                "Closing the matter quickly so the office avoids embarrassment.",
                "Treating the complaint as personal gossip rather than an official concern.",
                "Ignoring breaches once the complainant stops following up."
            ],
            "explanation": "Ethics-related grievances should be handled through fair, timely, and documented steps so the office can show how the complaint was considered and resolved.",
            "keywords": ["general_ethics", "grievance_handling", "fair_process", "documentation"]
        },
        "eth_general_gen_006": {
            "question": "Which management practice best supports ethical performance in a public office?",
            "options": [
                "Using objective indicators, documented review, and follow-up on ethical lapses.",
                "Judging performance only by output even where ethical controls are ignored.",
                "Leaving recurring ethical concerns outside formal review.",
                "Avoiding written feedback so difficult issues remain informal."
            ],
            "explanation": "Ethical performance is strengthened when objective indicators, documented review, and follow-up are used to address lapses before they spread.",
            "keywords": ["general_ethics", "performance_management", "ethical_lapses", "documented_review"]
        }
    },
    "eth_misconduct": {
        "eth_misconduct_gen_001": {
            "question": "Which practice best demonstrates sound misconduct-governance in public service?",
            "options": [
                "Applying approved disciplinary procedures and keeping a complete case record.",
                "Changing standards from case to case based on personal preference.",
                "Handling allegations informally so no official record is created.",
                "Skipping review controls to conclude the matter quickly."
            ],
            "explanation": "Misconduct governance depends on approved disciplinary procedure and a complete case record showing how the allegation was handled.",
            "keywords": ["misconduct", "discipline", "governance", "case_record"]
        },
        "eth_misconduct_gen_002": {
            "question": "What is the best first controlled response when misconduct is suspected in a public office?",
            "options": [
                "Securing the facts, preserving the relevant records, and starting review under the approved process.",
                "Announcing the officer's guilt before the available records have been checked.",
                "Delaying all action until unrelated complaints build up.",
                "Handling the matter privately without creating any review trail."
            ],
            "explanation": "The first controlled response is to secure the facts and records and begin review under approved procedure so the case remains fair and defensible.",
            "keywords": ["misconduct", "fact_finding", "records_preservation", "approved_process"]
        },
        "eth_misconduct_gen_003": {
            "question": "Which practice best supports risk management in misconduct control?",
            "options": [
                "Identifying disciplinary control gaps early and escalating serious exceptions promptly.",
                "Waiting for repeated breaches to accumulate before reviewing controls.",
                "Treating weak sanctions as acceptable if the case looks minor.",
                "Allowing undocumented shortcuts whenever a case becomes inconvenient."
            ],
            "explanation": "Misconduct risk is better controlled when disciplinary weaknesses are identified early and serious exceptions are escalated before breaches become habitual.",
            "keywords": ["misconduct", "risk_management", "disciplinary_controls", "escalation"]
        },
        "eth_misconduct_gen_004": {
            "question": "Which conduct best reflects proper ethical standards when handling misconduct cases?",
            "options": [
                "Maintaining neutrality, integrity, and procedural fairness throughout the review.",
                "Letting personal sympathy determine whether rules are applied.",
                "Relying on unwritten understandings instead of recorded procedure.",
                "Treating incomplete fact-finding as enough where pressure is high."
            ],
            "explanation": "Misconduct cases must be handled with neutrality, integrity, and procedural fairness so the office can justify both the process and the outcome.",
            "keywords": ["misconduct", "ethical_standards", "neutrality", "procedural_fairness"]
        },
        "eth_misconduct_gen_005": {
            "question": "Which practice best supports grievance handling in misconduct and discipline matters?",
            "options": [
                "Reviewing complaints through fair, timely, and documented steps.",
                "Closing complaints quickly once tempers cool down.",
                "Treating disciplinary complaints as private disagreements only.",
                "Ignoring breaches of procedure if a sanction has already been imposed."
            ],
            "explanation": "Grievances in misconduct and discipline matters should be reviewed through fair, timely, and documented steps so both the complaint and the response can be examined properly.",
            "keywords": ["misconduct", "discipline", "grievance_handling", "documentation"]
        },
        "eth_misconduct_gen_006": {
            "question": "Which management practice best supports performance in misconduct control?",
            "options": [
                "Tracking case handling, reviewing compliance patterns, and following up unresolved weaknesses.",
                "Measuring performance only by how fast cases are closed.",
                "Leaving recurring case-management failures outside formal review.",
                "Avoiding written supervision so difficult patterns remain informal."
            ],
            "explanation": "Misconduct control is better managed when case handling is tracked, compliance patterns are reviewed, and unresolved weaknesses are followed up formally.",
            "keywords": ["misconduct", "performance_management", "case_handling", "compliance_patterns"]
        }
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        sub_id = sub.get("id")
        if sub_id not in TARGETS:
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid not in TARGETS[sub_id]:
                continue
            patch = TARGETS[sub_id][qid]
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
