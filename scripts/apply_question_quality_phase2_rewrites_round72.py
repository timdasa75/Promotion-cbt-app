import json
from pathlib import Path

DATA_PATH = Path("data/financial_regulations.json")

UPDATES = {
    "fin_aud_051": {
        "question": "To whom should the Internal Auditor submit periodic audit reports?",
        "options": [
            "The Accountant-General.",
            "The Minister of Finance.",
            "The Head of Department.",
            "The Accounting Officer."
        ],
        "explanation": "Financial Regulation 1706 requires the Internal Auditor to submit periodic audit reports to the Accounting Officer.",
        "keywords": ["internal_auditor", "periodic_audit_reports", "accounting_officer", "financial_regulation_1706"]
    },
    "fin_aud_059": {
        "question": "Who is personally responsible for ensuring that the cashier's cash balance is locked in a strong-room or safe at the close of business each day?",
        "options": [
            "Sub-Accounting Officers.",
            "The Head of Department.",
            "The cashier only.",
            "The Internal Auditor."
        ],
        "explanation": "Financial Regulation 1120 places personal responsibility on Sub-Accounting Officers to ensure that the cash balance with the cashier is locked securely at the close of business each day.",
        "keywords": ["sub_accounting_officers", "cash_balance", "strong_room", "financial_regulation_1120"]
    },
    "fin_aud_064": {
        "question": "Who is responsible for ensuring that provisions for Value Added Tax and Withholding Tax are made and remitted?",
        "options": [
            "The Minister of Finance.",
            "The Accounting Officer.",
            "The Accountant-General.",
            "The Head of Internal Audit."
        ],
        "explanation": "Financial Regulation 234(i) makes the Accounting Officer responsible for ensuring that provision is made for VAT and WHT and that both are remitted as required.",
        "keywords": ["accounting_officer", "vat", "withholding_tax", "financial_regulation_234i"]
    },
    "fin_aud_070": {
        "question": "According to Financial Regulation 1703, what is one key duty of the Internal Auditor?",
        "options": [
            "To manage the department's budget.",
            "To approve all payments.",
            "To audit and certify all disbursement vouchers.",
            "To conduct an annual audit of the entire ministry."
        ],
        "explanation": "Financial Regulation 1703(d) lists the audit and certification of all disbursement vouchers as one of the Internal Auditor's key duties.",
        "keywords": ["internal_auditor", "disbursement_vouchers", "audit_certification", "financial_regulation_1703"]
    },
    "fin_bgt_075": {
        "question": "Can an unspent balance on a recurrent expenditure vote be revoted for the next financial year?",
        "options": [
            "Yes, if approved by the Minister of Finance.",
            "Only for capital projects.",
            "Yes, if approved by the National Assembly.",
            "No, it cannot be revoted."
        ],
        "explanation": "Financial Regulation 314 states that an unspent balance on a recurrent expenditure vote cannot be revoted for the next financial year.",
        "keywords": ["recurrent_expenditure_vote", "unspent_balance", "revote", "financial_regulation_314"]
    },
    "fin_gen_051": {
        "question": "To whom should requests for Treasury Receipt Books be submitted?",
        "options": [
            "The Head of Department.",
            "The Minister of Finance.",
            "The Accountant-General.",
            "The Auditor-General."
        ],
        "explanation": "Financial Regulation 1205 provides that requests for Treasury Receipt Books should be submitted to the Accountant-General.",
        "keywords": ["treasury_receipt_books", "accountant_general", "requests", "financial_regulation_1205"]
    },
    "fin_gen_064": {
        "question": "What approval is required before any bank account beyond the three specified types may be opened?",
        "options": [
            "Approval from the Minister of Finance.",
            "Express approval of the Accountant-General.",
            "Notification to the Auditor-General.",
            "A resolution of the National Assembly."
        ],
        "explanation": "Financial Regulation 701(ii) states that no bank account outside the three specified types may be opened without the express approval of the Accountant-General.",
        "keywords": ["bank_accounts", "accountant_general_approval", "financial_regulation_701ii", "treasury_control"]
    },
    "fin_gen_074": {
        "question": "Which duty of the Accountant-General relates directly to revenue?",
        "options": [
            "To approve all revenue expenditures.",
            "To set revenue targets for ministries.",
            "To carry out revenue monitoring and accounting.",
            "To collect all federal government revenue personally."
        ],
        "explanation": "Financial Regulation 107(m) states that the Accountant-General is responsible for carrying out revenue monitoring and accounting.",
        "keywords": ["accountant_general", "revenue_monitoring", "revenue_accounting", "financial_regulation_107m"]
    },
    "fin_pro_052": {
        "question": "What areas was the Due Process policy designed to make more transparent and accountable?",
        "options": [
            "Judicial processes and legal frameworks.",
            "Taxation and revenue generation only.",
            "International relations and foreign policy.",
            "Public procurement, budgetary operations, and government financial management."
        ],
        "explanation": "The Due Process policy was introduced as an anti-corruption mechanism to strengthen transparency and accountability in public procurement, budgetary operations, and government financial management.",
        "keywords": ["due_process_policy", "transparency", "accountability", "public_procurement"]
    },
    "fin_pro_072": {
        "question": "What kind of checks should the Accountant-General or Accounting Officer use to supplement routine checks on Revenue Collectors' cash books?",
        "options": [
            "Telephone calls.",
            "Email reminders.",
            "Written correspondence.",
            "Surprise inspections at the offices concerned."
        ],
        "explanation": "Financial Regulation 211 requires the Accountant-General or Accounting Officer to supplement routine checks on Revenue Collectors' cash books with surprise inspections at the offices concerned.",
        "keywords": ["revenue_collectors", "cash_books", "surprise_inspections", "financial_regulation_211"]
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
