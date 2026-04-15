import json
from pathlib import Path

DATA_PATH = Path("data/general_current_affairs.json")

UPDATES = {
    "IRA_151": {
        "question": "According to Financial Regulation 1904(a), which body opens a Retirement Savings Account for each employee?",
        "options": [
            "The National Pension Commission (NPC).",
            "The Accountant-General.",
            "The Ministry of Finance.",
            "The Central Bank of Nigeria."
        ],
        "explanation": "Financial Regulation 1904(a) provides that the National Pension Commission opens a Retirement Savings Account for each employee.",
        "keywords": ["retirement_savings_account", "national_pension_commission", "financial_regulation_1904a", "employee_pension"]
    },
    "IRA_156": {
        "question": "If a government driver is involved in an accident causing injury or death, what should the driver do first?",
        "options": [
            "Call family members.",
            "Report the accident immediately to the nearest police station.",
            "Attempt to settle directly with the injured party.",
            "Drive away from the scene."
        ],
        "explanation": "In a serious accident involving injury or death, the immediate step is to report to the nearest police station so that the incident is properly documented and investigated.",
        "keywords": ["government_driver", "accident_report", "nearest_police_station", "injury_or_death"]
    },
    "IRA_166": {
        "question": "How long after signature by the officer controlling expenditure may a Sub-Accounting Officer still make disbursement against a voucher?",
        "options": [
            "Two months.",
            "One month.",
            "Six months.",
            "Three months."
        ],
        "explanation": "Financial Regulation 611(c) provides that the voucher must not be more than three months old from the date it was signed by the officer controlling expenditure.",
        "keywords": ["sub_accounting_officer", "voucher", "disbursement", "financial_regulation_611c"]
    },
    "IRA_174": {
        "question": "What should a Revenue Collector do with the official receipt received from the Sub-Accounting Officer?",
        "options": [
            "Give it to the Accounting Officer.",
            "Paste it in the cash book.",
            "Send it to the Accountant-General.",
            "File it for future reference."
        ],
        "explanation": "Financial Regulation 210 requires the Revenue Collector to paste the official receipt in the cash book on the disbursement side.",
        "keywords": ["revenue_collector", "official_receipt", "cash_book", "financial_regulation_210"]
    },
    "IRA_175": {
        "question": "What should happen if a Sub-Accounting Officer determines that an officer is likely to receive public money again?",
        "options": [
            "The officer should open a private account for the funds.",
            "The officer should be supplied with an official receipt booklet.",
            "The officer should be given a new job.",
            "The officer should be promoted."
        ],
        "explanation": "Under Financial Regulation 218, the Sub-Accounting Officer should arrange for the officer to be supplied with an official receipt booklet if the officer is likely to receive public money again.",
        "keywords": ["sub_accounting_officer", "public_money", "official_receipt_booklet", "financial_regulation_218"]
    },
    "ca_national_events_gen_060": {
        "question": "Who must be notified of amounts collectable by a department's officers?",
        "options": [
            "The Heads of Department or Divisions.",
            "The Minister of Finance.",
            "The Auditor-General.",
            "The Accountant-General."
        ],
        "explanation": "Financial Regulation 230(i) requires that Heads of Department or Divisions be notified of amounts collectable by their officers.",
        "keywords": ["collectable_amounts", "heads_of_department", "divisions", "financial_regulation_230i"]
    },
    "ca_national_events_gen_064": {
        "question": "Which office is solely liable for unauthorized expenditure beyond the sum allocated?",
        "options": [
            "The Head of Finance and Accounts.",
            "The Accountant-General.",
            "Officers controlling votes.",
            "The Minister of Finance."
        ],
        "explanation": "Financial Regulation 419 states that officers controlling votes are solely liable for unauthorized expenditure beyond the amount allocated.",
        "keywords": ["unauthorized_expenditure", "officers_controlling_votes", "liability", "financial_regulation_419"]
    },
    "ca_national_events_gen_070": {
        "question": "Which copies of disbursement vouchers must be signed in full in ink or ball pen by both the certifying officer and the payee?",
        "options": [
            "Only the duplicate and triplicate copies.",
            "All copies.",
            "Only the originals.",
            "Only the copy sent to the Auditor-General."
        ],
        "explanation": "Financial Regulation 606 requires only the originals of payment vouchers to be signed in full by the certifying officer and the payee.",
        "keywords": ["disbursement_vouchers", "originals", "certifying_officer", "financial_regulation_606"]
    },
    "ca_national_events_gen_076": {
        "question": "What is the rule on delegating authority to notify the bank of changes in empowered signatories?",
        "options": [
            "It may be delegated to a senior officer.",
            "It is left to the Accounting Officer's discretion.",
            "It must not be delegated.",
            "It may be delegated with the Minister's approval."
        ],
        "explanation": "Financial Regulation 705(i) states that the authority to notify the bank of changes in empowered signatories must not be delegated.",
        "keywords": ["empowered_signatories", "bank_notification", "delegation", "financial_regulation_705i"]
    },
    "ca_general_059": {
        "question": "To whom is the original copy of a Provisional General Warrant addressed?",
        "options": [
            "The Head of Civil Service.",
            "The Accountant-General.",
            "The Minister of Finance.",
            "The Auditor-General."
        ],
        "explanation": "Financial Regulation 303 provides that the original copy of a Provisional General Warrant is addressed to the Accountant-General, with a signed copy sent to the Auditor-General.",
        "keywords": ["provisional_general_warrant", "accountant_general", "auditor_general", "financial_regulation_303"]
    },
    "ca_general_060": {
        "question": "To whom should applications for supplementary provision be submitted?",
        "options": [
            "To the Minister of Finance.",
            "To the Auditor-General.",
            "To the Head of Civil Service.",
            "Only to the Accountant-General."
        ],
        "explanation": "Financial Regulation 315 states that applications for supplementary provision should be submitted to the Minister of Finance.",
        "keywords": ["supplementary_provision", "minister_of_finance", "financial_regulation_315", "budget_application"]
    },
    "ca_general_065": {
        "question": "What should be done if defects are found in receipt or licence books received from the Federal Government Printer?",
        "options": [
            "Use the books as they are.",
            "Report the defects immediately to the Accountant-General and the Auditor-General.",
            "Note the defects for future reference only.",
            "Return the books directly to the printer."
        ],
        "explanation": "Financial Regulation 1204 requires any defect in receipt or licence books received from the Federal Government Printer to be reported immediately to the Accountant-General and the Auditor-General.",
        "keywords": ["receipt_books", "licence_books", "federal_government_printer", "financial_regulation_1204"]
    },
    "ca_general_066": {
        "question": "What should happen to the triplicate copies of receipts?",
        "options": [
            "They should be forwarded to the Auditor-General.",
            "They should be retained in the receipt book.",
            "They should be destroyed.",
            "They should be returned to the Federal Government Printer."
        ],
        "explanation": "Financial Regulation 1219 provides that triplicate copies of receipts must be retained in the receipt book.",
        "keywords": ["triplicate_receipts", "receipt_book", "retention", "financial_regulation_1219"]
    }
}


def iter_question_lists(data):
    for sub in data["subcategories"]:
        subid = sub.get("id")
        grouped = sub.get("questions", [])
        if grouped and isinstance(grouped[0], dict) and subid in grouped[0]:
            yield grouped[0][subid]
        else:
            yield grouped


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for qlist in iter_question_lists(data):
        for q in qlist:
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
