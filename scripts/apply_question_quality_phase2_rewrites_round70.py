import json
from pathlib import Path

DATA_PATH = Path("data/policy_analysis.json")

UPDATES = {
    "policy_constitution_065": {
        "question": "What aspect of a parastatal is the Chief Executive responsible for managing?",
        "options": [
            "Day-to-day management and administration.",
            "Policy formulation and approval.",
            "Appointment of all senior staff.",
            "Approval of the parastatal's budget."
        ],
        "explanation": "The Chief Executive is responsible for the day-to-day management and administration of the parastatal rather than for its overall policy supervision.",
        "keywords": ["parastatal", "chief_executive", "day_to_day_management", "administration"]
    },
    "policy_constitution_068": {
        "question": "What is the principal role of a parastatal in government administration?",
        "options": [
            "To act as a legislative body for the ministry.",
            "To manage all human-resource issues for the ministry.",
            "To assist the ministry in policy formulation only.",
            "To implement specific government policies and programmes assigned to it."
        ],
        "explanation": "Parastatals are set up mainly to implement specific government policies and programmes assigned to them, not to replace the ministry's legislative or personnel functions.",
        "keywords": ["parastatal", "government_programmes", "policy_implementation", "public_administration"]
    },
    "policy_constitution_075": {
        "question": "Who provides policy direction and overall supervision to a parastatal?",
        "options": [
            "The Permanent Secretary of the supervising ministry.",
            "The Chief Executive of the parastatal.",
            "The Chairman of the Board.",
            "The Minister of the supervising ministry."
        ],
        "explanation": "The Minister of the supervising ministry provides policy direction and overall supervision to the parastatal as the political head of the ministry.",
        "keywords": ["parastatal", "policy_direction", "supervision", "supervising_minister"]
    },
    "policy_constitution_086": {
        "question": "What is the Accountant-General's role regarding the accounting policy of the Federal Government?",
        "options": [
            "To audit the accounting policy.",
            "To advise on the accounting policy.",
            "To formulate the accounting policy.",
            "To implement policies set only by the Minister of Finance."
        ],
        "explanation": "Financial Regulation 107(o) assigns the Accountant-General responsibility for formulating the accounting policy of the Federal Government.",
        "keywords": ["accountant_general", "accounting_policy", "federal_government", "financial_regulation_107o"]
    },
    "pol_analysis_methods_gen_096": {
        "question": "According to the Civil Service Handbook, what catalytic role should the Civil Service facilitate?",
        "options": [
            "Political campaigns.",
            "The affairs of private citizens.",
            "The successful conception, planning, execution, and monitoring of government policies, projects, and programmes.",
            "Private business ventures."
        ],
        "explanation": "The Civil Service is expected to play a catalytic role in facilitating the successful conception, planning, execution, and monitoring of government policies, projects, and programmes.",
        "keywords": ["civil_service_handbook", "catalytic_role", "government_policies", "programme_execution"]
    },
    "policy_psr_062": {
        "question": "The 'golden handshake' scheme was designed to prepare affected staff for what outcome?",
        "options": [
            "A severance package.",
            "New vocations after retirement.",
            "A loan facility.",
            "A new job in another ministry."
        ],
        "explanation": "The golden handshake scheme included orientation and empowerment support to prepare affected staff for new vocations after retirement.",
        "keywords": ["golden_handshake", "retirement", "new_vocations", "staff_empowerment"]
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
