import json
from pathlib import Path

DATA_PATH = Path("data/civil_service_ethics.json")

UPDATES = {
    "eth_anti_corruption_gen_080": {
        "question": "Which practice should an officer prioritize to protect service integrity in anti-corruption work?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Service integrity in anti-corruption work depends on avoiding conflicts of interest and disclosing any constraint that could compromise an official decision.",
        "keywords": ["anti_corruption", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "eth_anti_corruption_gen_083": {
        "question": "Which grievance-handling practice best supports accountability in anti-corruption work?",
        "options": [
            "Resolve complaints using fair, timely, and documented procedures.",
            "Ignore feedback and continue non-compliant procedures.",
            "Prioritize convenience over policy and legal requirements.",
            "Apply rules inconsistently based on personal preference."
        ],
        "explanation": "Accountability in anti-corruption work is strengthened when complaints are handled through fair, timely, and documented procedures that can be reviewed later.",
        "keywords": ["anti_corruption", "grievance_handling", "accountability", "documented_procedures"]
    },
    "eth_anti_corruption_gen_086": {
        "question": "A ministry unit is updating its anti-corruption workflow. Which choice best promotes transparent decision-making?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records.",
            "Use clear criteria and communicate decisions promptly."
        ],
        "explanation": "Transparent decision-making requires clear criteria, prompt communication, and a process that can be explained and reviewed.",
        "keywords": ["anti_corruption", "workflow_update", "decision_transparency", "clear_criteria"]
    },
    "eth_anti_corruption_gen_091": {
        "question": "Which action best demonstrates sound performance management in anti-corruption work?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Set measurable targets, monitor progress, and correct deviations.",
            "Close cases without validating facts or keeping proper records.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Performance management is strongest when targets are measurable, progress is monitored, and deviations are corrected before they become systemic problems.",
        "keywords": ["anti_corruption", "performance_management", "measurable_targets", "monitoring"]
    },
    "eth_code_conduct_gen_074": {
        "question": "Which practice best upholds service integrity under the Code of Conduct for public officers?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Close cases without validating facts or demand records.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Service integrity under the Code of Conduct requires public officers to avoid conflicts of interest and disclose any constraint that could affect an official decision.",
        "keywords": ["code_of_conduct", "service_integrity", "conflict_of_interest", "disclosure"]
    },
    "eth_code_conduct_gen_076": {
        "question": "Which practice best promotes transparent decision-making under the Code of Conduct?",
        "options": [
            "Use clear criteria and communicate decisions promptly.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Transparent decision-making depends on clear criteria, prompt communication, and a recordable basis for the decision taken.",
        "keywords": ["code_of_conduct", "decision_transparency", "clear_criteria", "communication"]
    },
    "eth_code_conduct_gen_079": {
        "question": "When an imprest issued by a Sub-Accounting Officer is retired at another station, what must the issuing officer verify?",
        "options": [
            "That the Minister of Finance has been informed.",
            "That a fresh audit has already been completed.",
            "That a new cash advance has been issued.",
            "That the receipt voucher particulars are correct."
        ],
        "explanation": "If an imprest is retired at another station, the issuing Sub-Accounting Officer remains responsible for verifying the receipt voucher particulars before the retirement is accepted.",
        "keywords": ["imprest", "sub_accounting_officer", "receipt_voucher", "retirement"]
    },
    "eth_code_conduct_gen_083": {
        "question": "Which body may recommend the removal of a public officer for breach of the Code of Conduct?",
        "options": [
            "Code of Conduct Tribunal.",
            "ICPC.",
            "Federal Civil Service Commission.",
            "EFCC."
        ],
        "explanation": "The Code of Conduct Tribunal is the body associated with adjudicating Code of Conduct breaches and making orders tied to misconduct by public officers.",
        "keywords": ["code_of_conduct", "public_officer", "removal", "tribunal"]
    },
    "eth_code_conduct_gen_084": {
        "question": "Which practice best supports fair and lawful performance management under the Code of Conduct?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Use objective indicators and structured feedback cycles.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Fair and lawful performance management depends on objective indicators and structured feedback cycles rather than arbitrary or undocumented judgments.",
        "keywords": ["code_of_conduct", "performance_management", "objective_indicators", "feedback_cycles"]
    },
    "eth_code_conduct_gen_085": {
        "question": "Which Nigerian body enforces the Code of Conduct for public officers?",
        "options": [
            "ICPC.",
            "EFCC.",
            "Civil Service Commission.",
            "Code of Conduct Bureau (CCB)."
        ],
        "explanation": "The Code of Conduct Bureau is the body established to enforce the Code of Conduct regime for public officers and process related compliance matters.",
        "keywords": ["code_of_conduct_bureau", "public_officers", "enforcement", "nigeria"]
    },
    "eth_code_conduct_gen_086": {
        "question": "Under which Schedule to the 1999 Constitution is the Code of Conduct Bureau established?",
        "options": [
            "First Schedule.",
            "Second Schedule.",
            "Fifth Schedule.",
            "Third Schedule."
        ],
        "explanation": "The Code of Conduct Bureau and the Code of Conduct for public officers are provided for under the Fifth Schedule to the 1999 Constitution.",
        "keywords": ["1999_constitution", "code_of_conduct_bureau", "fifth_schedule", "constitutional_basis"]
    },
    "eth_conflict_interest_gen_075": {
        "question": "Which action best demonstrates sound performance management when handling conflicts of interest?",
        "options": [
            "Set measurable targets, monitor progress, and correct deviations.",
            "Treat exceptions as routine without documented justification.",
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records."
        ],
        "explanation": "Performance management in conflict-of-interest control is strongest when targets are measurable, progress is monitored, and lapses are corrected early.",
        "keywords": ["conflict_of_interest", "performance_management", "measurable_targets", "monitoring"]
    },
    "eth_conflict_interest_gen_076": {
        "question": "Which practice best balances legality, fairness, timeliness, and service quality when handling conflicts of interest?",
        "options": [
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Balance legality, fairness, timeliness, and service quality.",
            "Rely on informal instructions without documentary evidence."
        ],
        "explanation": "Conflict-of-interest decisions should balance legality, fairness, timeliness, and service quality so that the process remains both compliant and credible.",
        "keywords": ["conflict_of_interest", "citizen_focused_service", "fairness", "legality"]
    },
    "eth_conflict_interest_gen_077": {
        "question": "Which practice best supports performance management in handling conflicts of interest?",
        "options": [
            "Close cases without validating facts or keeping proper records.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Treat exceptions as routine without documented justification.",
            "Use objective indicators and structured feedback cycles."
        ],
        "explanation": "Objective indicators and structured feedback cycles help supervisors manage conflict-of-interest controls consistently and fairly.",
        "keywords": ["conflict_of_interest", "performance_management", "objective_indicators", "feedback_cycles"]
    },
    "eth_conflict_interest_gen_078": {
        "question": "Which misconduct involves the unauthorized use of an official vehicle?",
        "options": [
            "Forgery.",
            "Abuse of office.",
            "Conflict of interest.",
            "Insubordination."
        ],
        "explanation": "Using an official vehicle without authorization is a form of abuse of office because it misuses government property for an improper purpose.",
        "keywords": ["misconduct", "official_vehicle", "abuse_of_office", "public_property"]
    },
    "eth_conflict_interest_gen_079": {
        "question": "Which practice best supports fair and lawful performance management when handling conflicts of interest?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Delay decisions until issues escalate into avoidable crises.",
            "Use objective indicators and structured feedback cycles.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Fair and lawful performance management in conflict-of-interest control depends on objective indicators and structured feedback rather than undocumented discretion.",
        "keywords": ["conflict_of_interest", "performance_management", "fairness", "legal_compliance"]
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
