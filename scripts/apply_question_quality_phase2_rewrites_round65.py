import json
from pathlib import Path

DATA_PATH = Path("data/general_current_affairs.json")

UPDATES = {
    "PSIR_104": {
        "question": "What must a Foreign Service Officer do before marrying a foreign national?",
        "options": [
            "Obtain a promotion first.",
            "Obtain prior permission from the Government.",
            "Resign from the service.",
            "Ensure the spouse first becomes a Nigerian citizen."
        ],
        "explanation": "A Foreign Service Officer who intends to marry a foreign national must first obtain prior government permission before proceeding.",
        "keywords": ["foreign_service_officer", "marriage_to_foreigner", "prior_permission", "public_service_reform"]
    },
    "PSIR_113": {
        "question": "For how long may a Provisional General Warrant authorize withdrawal of money from the fund?",
        "options": [
            "Not more than six months.",
            "Not more than three months.",
            "Not more than nine months.",
            "For the entire financial year."
        ],
        "explanation": "Financial Regulation 303 limits a Provisional General Warrant to a period not exceeding six months.",
        "keywords": ["provisional_general_warrant", "withdrawal_of_money", "financial_regulation_303", "six_months"]
    },
    "PSIR_116": {
        "question": "How long does a Permanent Secretary, as Accounting Officer, have to respond to an audit query?",
        "options": [
            "One week.",
            "30 days.",
            "21 days.",
            "One month."
        ],
        "explanation": "The Accounting Officer is expected to respond to an audit query within 21 days.",
        "keywords": ["audit_query", "permanent_secretary", "accounting_officer", "21_days"]
    },
    "PSIR_118": {
        "question": "Which reform introduced the idea that Permanent Secretaries were no longer the Accounting Officers of ministries?",
        "options": [
            "The Public Service Reform Programme of 1999.",
            "The Civil Service Handbook of 2009.",
            "The 1988 Civil Service Reforms.",
            "The Udoji Public Service Review Commission of 1972."
        ],
        "explanation": "The 1988 Civil Service Reforms shifted the Accounting Officer role to the Minister, reducing the Permanent Secretary to the position of senior career adviser and coordinator.",
        "keywords": ["1988_civil_service_reforms", "permanent_secretary", "accounting_officer", "public_service_reform"]
    },
    "NGPD_051": {
        "question": "Who approves the procedure and method for recording and calculating personal emoluments?",
        "options": [
            "The Minister of Finance.",
            "The Accounting Officer.",
            "The Auditor-General.",
            "The Accountant-General."
        ],
        "explanation": "Financial Regulation 1517 requires that the procedure and method for recording and calculating personal emoluments be approved by the Accountant-General.",
        "keywords": ["personal_emoluments", "accountant_general", "financial_regulation_1517", "approval"]
    },
    "NGPD_057": {
        "question": "According to Financial Regulation 1706, what type of report should the Internal Auditor submit to the Accounting Officer?",
        "options": [
            "Daily reports.",
            "Periodic audit reports.",
            "Budget forecast reports.",
            "Staff performance reports."
        ],
        "explanation": "Financial Regulation 1706 requires the Internal Auditor to submit periodic audit reports to the Accounting Officer.",
        "keywords": ["internal_auditor", "periodic_audit_reports", "accounting_officer", "financial_regulation_1706"]
    },
    "NGPD_062": {
        "question": "When a Ministry or Department is constituted as a Self Accounting Unit, who is charged with installing and maintaining its accounting system?",
        "options": [
            "The Accounting Officer.",
            "The Auditor-General.",
            "The Head of Finance and Accounts.",
            "The Accountant-General."
        ],
        "explanation": "Financial Regulation 122 places responsibility for the installation and maintenance of the accounting system of a Self Accounting Unit on the Accounting Officer.",
        "keywords": ["self_accounting_unit", "accounting_system", "accounting_officer", "financial_regulation_122"]
    },
    "NGPD_065": {
        "question": "In a Self Accounting Unit, who is charged with installing and maintaining a proper system of accounts?",
        "options": [
            "The Head of Finance and Accounts.",
            "The Accountant-General.",
            "The Accounting Officer.",
            "The Auditor-General."
        ],
        "explanation": "Financial Regulation 122 states that the Accounting Officer is responsible for installing and maintaining a proper accounting system in the unit.",
        "keywords": ["self_accounting_unit", "system_of_accounts", "accounting_officer", "financial_regulation_122"]
    },
    "NGPD_066": {
        "question": "What document empowers other officers to incur expenditure and sign vouchers on behalf of an Accounting Officer?",
        "options": [
            "A Treasury Circular.",
            "A Virement Warrant.",
            "A General Warrant.",
            "An Authority to Incur Expenditure (A.I.E.)."
        ],
        "explanation": "Financial Regulation 405 provides that an Accounting Officer may empower other officers by issuing an Authority to Incur Expenditure (A.I.E.).",
        "keywords": ["authority_to_incur_expenditure", "aie", "accounting_officer", "financial_regulation_405"]
    },
    "NGPD_067": {
        "question": "What must accompany an Authority to Incur Expenditure issued by an Accounting Officer?",
        "options": [
            "Appropriate cash backing.",
            "A copy of the Annual Estimates.",
            "A list of all previous expenditures.",
            "A letter of approval from the Minister of Finance."
        ],
        "explanation": "Financial Regulation 405 requires an Authority to Incur Expenditure to be supported by appropriate cash backing.",
        "keywords": ["authority_to_incur_expenditure", "cash_backing", "accounting_officer", "financial_regulation_405"]
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
