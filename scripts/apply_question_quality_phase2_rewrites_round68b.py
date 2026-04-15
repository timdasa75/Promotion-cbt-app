import json
from pathlib import Path

DATA_PATH = Path("data/general_current_affairs.json")

UPDATES = {
    "ca_general_052": {
        "question": "At the federal level, who heads the Senate?",
        "options": [
            "The President of the Senate.",
            "The Chief Justice of Nigeria.",
            "The Head of the Civil Service of the Federation.",
            "The Speaker of the House of Representatives."
        ],
        "explanation": "At the federal level, the Senate is headed by the President of the Senate, while the House of Representatives is headed by the Speaker.",
        "keywords": ["federal_legislature", "senate", "president_of_the_senate", "national_assembly"]
    },
    "ca_general_057": {
        "question": "To which body does the Auditor-General submit the report on the accounts of the Federation?",
        "options": [
            "The Head of the Civil Service of the Federation.",
            "The National Assembly.",
            "The President.",
            "The Minister of Finance."
        ],
        "explanation": "The Auditor-General submits the report on the accounts of the Federation to the National Assembly for legislative scrutiny and follow-up.",
        "keywords": ["auditor_general", "accounts_of_the_federation", "national_assembly", "legislative_scrutiny"]
    },
    "ca_general_068": {
        "question": "Which document is the main basis for Public Accounts Committees to scrutinize government accounts?",
        "options": [
            "The Finance (Control and Management) Act.",
            "The Annual Report of the Auditor-General for the Federation.",
            "The Civil Service Handbook.",
            "The Appropriation Act."
        ],
        "explanation": "Public Accounts Committees mainly rely on the Annual Report of the Auditor-General for the Federation when scrutinizing the accounts of government ministries, departments, and agencies.",
        "keywords": ["public_accounts_committees", "auditor_general_report", "government_accounts", "scrutiny"]
    },
    "ca_general_069": {
        "question": "What was the main objective of the Public Service Reform Programme of 1999?",
        "options": [
            "To increase the number of political appointees.",
            "To introduce a new salary structure.",
            "To reduce the size of the Civil Service.",
            "To create a modern, professional, and efficient Civil Service."
        ],
        "explanation": "The Public Service Reform Programme of 1999 aimed to reposition the Civil Service as a modern, professional, and efficient institution.",
        "keywords": ["public_service_reform_programme_1999", "civil_service", "modernization", "efficiency"]
    },
    "ca_general_073": {
        "question": "Which of the following is not a paramilitary service?",
        "options": [
            "Nigeria Prison Service.",
            "Federal Ministry of Finance.",
            "Nigeria Customs Service.",
            "Nigeria Immigration Service."
        ],
        "explanation": "The Federal Ministry of Finance is a civil service ministry, not a paramilitary service like the prison, customs, or immigration services.",
        "keywords": ["paramilitary_service", "federal_ministry_of_finance", "customs", "immigration"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != "ca_general":
            continue
        grouped = sub.get("questions", [])
        if not grouped:
            continue
        entries = grouped[0].get("ca_general", [])
        for q in entries:
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
