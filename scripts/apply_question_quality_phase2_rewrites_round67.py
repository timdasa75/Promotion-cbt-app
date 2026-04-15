import json
from pathlib import Path

DATA_PATH = Path("data/psr_rules.json")

UPDATES = {
    "psr_eth_051": {
        "question": "What is the main aim of the Oath of Secrecy required of some civil servants?",
        "options": [
            "To hide personal assets from the public.",
            "To protect government secrets and classified information.",
            "To prevent officers from speaking to the media in all circumstances.",
            "To ensure loyalty to a political party."
        ],
        "explanation": "The Oath of Secrecy is meant to protect official secrets and classified government information accessed by the officer in the course of duty.",
        "keywords": ["oath_of_secrecy", "classified_information", "government_secrets", "civil_servants"]
    },
    "circ_appointments_tenure_discipline_gen_066": {
        "question": "What minimum rank must a ministry or agency's liaison officer for pension matters hold?",
        "options": [
            "Permanent Secretary.",
            "Assistant Executive Officer (Accounts).",
            "Director.",
            "Senior Accountant."
        ],
        "explanation": "Financial Regulation 1904(e) requires each ministry or agency to designate a liaison officer for pension matters not below the rank of Director.",
        "keywords": ["pension_matters", "liaison_officer", "director_rank", "financial_regulation_1904e"]
    },
    "psr_allow_051": {
        "question": "How is salary for part of a month calculated on retirement or termination of appointment?",
        "options": [
            "At a fixed rate.",
            "On a weekly basis.",
            "It is not paid.",
            "On a pro-rata basis."
        ],
        "explanation": "Financial Regulation 1504 provides that salary for part of a month on retirement or termination is calculated on a pro-rata basis.",
        "keywords": ["retirement", "termination_of_appointment", "pro_rata", "financial_regulation_1504"]
    },
    "psr_allow_070": {
        "question": "What type of advance is referred to in Financial Regulation 1405?",
        "options": [
            "Salary advance on first appointment.",
            "Housing advance.",
            "Training advance.",
            "Vehicle advance."
        ],
        "explanation": "Financial Regulation 1405 specifically refers to salary advance on first appointment.",
        "keywords": ["financial_regulation_1405", "salary_advance", "first_appointment", "allowances"]
    },
    "psr_ret_060": {
        "question": "When should an officer write a handing-over note?",
        "options": [
            "Before proceeding on leave, transfer, or retirement.",
            "During the officer's leave.",
            "Only when requested by a superior officer.",
            "After the successor has taken over."
        ],
        "explanation": "A handing-over note should be prepared before the officer proceeds on leave, transfer, or retirement so that duties, files, and pending matters can be transferred properly.",
        "keywords": ["handing_over_note", "leave", "transfer", "retirement"]
    },
    "psr_train_053": {
        "question": "What does the management letter from the Internal Auditor primarily address?",
        "options": [
            "Recommendations for new hires.",
            "Irregularities and failures of internal control.",
            "An officer's promotion.",
            "The department's budget performance."
        ],
        "explanation": "The management letter communicates irregularities, abuse of internal control, or negligent disregard of financial regulations discovered during audit work.",
        "keywords": ["management_letter", "internal_auditor", "internal_control", "irregularities"]
    },
    "circ_personnel_performance_gen_078": {
        "question": "Which body prepares the syllabus for compulsory confirmation examinations for junior officers?",
        "options": [
            "Junior Staff Committee.",
            "Office of the Head of the Civil Service of the Federation (OHCSF).",
            "Federal Civil Service Commission.",
            "Ministry of Education."
        ],
        "explanation": "The Office of the Head of the Civil Service of the Federation prepares the syllabus for the compulsory confirmation examinations for junior officers.",
        "keywords": ["confirmation_examination", "junior_officers", "ohcsf", "syllabus"]
    },
    "circ_personnel_performance_gen_083": {
        "question": "Who is personally responsible for ensuring that expenditure against a sub-head affected by a virement warrant does not exceed the reduced balance?",
        "options": [
            "Officers authorized to incur expenditure (officers controlling votes).",
            "The Head of Finance and Accounts.",
            "The Minister of Finance.",
            "The Accountant-General."
        ],
        "explanation": "Financial Regulation 317 places personal responsibility on officers controlling votes to ensure expenditure does not exceed the reduced balance after a virement.",
        "keywords": ["virement_warrant", "officers_controlling_votes", "reduced_balance", "financial_regulation_317"]
    },
    "circ_personnel_performance_gen_085": {
        "question": "What happens when expenditure is incorrectly charged to a vote?",
        "options": [
            "It will be disallowed.",
            "It will be transferred to a general fund.",
            "It will be adjusted in the next financial year.",
            "It will be reported to the Minister of Finance for approval."
        ],
        "explanation": "Financial Regulation 417 states that expenditure incorrectly charged to a vote must be disallowed.",
        "keywords": ["incorrect_expenditure", "vote", "disallowed", "financial_regulation_417"]
    },
    "circ_personnel_performance_gen_086": {
        "question": "Which office is responsible for the appointment of the Internal Auditor?",
        "options": [
            "The Minister of Finance.",
            "The Head of Department.",
            "The Auditor-General.",
            "The Accountant-General."
        ],
        "explanation": "Financial Regulation 1702 provides that the Accountant-General is responsible for the appointment and deployment of Internal Auditors.",
        "keywords": ["internal_auditor", "accountant_general", "appointment", "financial_regulation_1702"]
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
