import json
from pathlib import Path

DATA_PATH = Path("data/psr_rules.json")
SUBCATEGORY_ID = "circ_leave_welfare_allowances"

UPDATES = {
    "CIRC_LWA_016": {
        "question": "If an officer on vacation leave is recalled to duty by the Permanent Secretary, when may the officer resume the unexpired portion of the leave?",
        "options": [
            "Immediately upon return to the office.",
            "On the day the officer ceases to hold a substantive post or act in another post in the same station.",
            "After three months of continuous service.",
            "Only when the Federal Civil Service Commission approves."
        ],
        "explanation": "When an officer on vacation leave is recalled to duty, the unexpired portion of the leave may be resumed on the day the officer ceases to hold a substantive post or act in another post in the same station.",
        "keywords": ["vacation_leave", "recall_to_duty", "unexpired_leave", "permanent_secretary"]
    },
    "circ_leave_welfare_allowances_gen_064": {
        "question": "What is the consequence if a driver fails to keep the vehicle logbook up to date?",
        "options": [
            "No consequence, provided the journey was official.",
            "Immediate dismissal from service.",
            "A verbal warning only.",
            "Forfeiture of the relevant vehicle allowance for that period."
        ],
        "explanation": "Financial Regulation 2010 provides that failure to keep the vehicle logbook up to date attracts forfeiture of the relevant vehicle allowance for the period concerned.",
        "keywords": ["vehicle_logbook", "driver_duty", "vehicle_allowance", "financial_regulation_2010"]
    },
    "circ_leave_welfare_allowances_gen_065": {
        "question": "Who prescribes the dates in each month on which salaries and allowances must be paid?",
        "options": [
            "The Auditor-General.",
            "The officer controlling expenditure.",
            "The Accountant-General.",
            "The Accounting Officer."
        ],
        "explanation": "Financial Regulation 1505 places responsibility on the Accountant-General to prescribe the dates each month on which salaries and allowances are paid.",
        "keywords": ["salary_payment_dates", "allowances", "accountant_general", "financial_regulation_1505"]
    },
    "circ_leave_welfare_allowances_gen_066": {
        "question": "Within how many days must unclaimed salaries, allowances, and pensions be paid back to the Treasury?",
        "options": [
            "Within seven days.",
            "At the end of the financial year.",
            "Within thirty days.",
            "Immediately after the cash is withdrawn."
        ],
        "explanation": "Financial Regulation 1513(i) requires unclaimed salaries, allowances, and pensions to be paid back to the Treasury within seven days of withdrawal.",
        "keywords": ["unclaimed_salaries", "allowances", "pensions", "financial_regulation_1513"]
    },
    "circ_leave_welfare_allowances_gen_070": {
        "question": "A sabbatical appointment is applicable to officers on which grade level and above?",
        "options": [
            "GL 10 or equivalent and above.",
            "GL 14 or equivalent and above.",
            "GL 12 or equivalent and above.",
            "GL 15 or equivalent and above."
        ],
        "explanation": "Rule 020413 provides that sabbatical appointment is applicable at GL 15 or its equivalent and above.",
        "keywords": ["sabbatical_appointment", "grade_level_15", "psr_020413", "eligibility"]
    },
    "circ_leave_welfare_allowances_gen_072": {
        "question": "COMPRO I is designed for officers on which grade levels?",
        "options": [
            "GL 10 and above.",
            "GL 08 and below.",
            "GL 08 and GL 09.",
            "GL 08 to GL 10."
        ],
        "explanation": "The prescribed examination syllabus places COMPRO I at grade levels 08 and 09, while COMPRO II applies to higher levels.",
        "keywords": ["compro_i", "grade_levels_08_09", "confirmation_exam", "syllabus"]
    },
    "circ_leave_welfare_allowances_gen_073": {
        "question": "The payment of fees to invigilators and examiners is typically based on what?",
        "options": [
            "A flat rate for all examinations.",
            "The grade level of the officers being examined.",
            "The number of questions set.",
            "The number of candidates supervised or papers marked."
        ],
        "explanation": "Fees paid to invigilators and examiners are typically tied to the volume of work performed, such as the number of candidates supervised or papers marked.",
        "keywords": ["invigilators", "examiners", "fees", "workload_basis"]
    },
    "circ_leave_welfare_allowances_gen_075": {
        "question": "Which staff may be required to explain why they were late to work?",
        "options": [
            "Only staff on a specified grade level.",
            "All staff who sign below the red line.",
            "Only junior staff.",
            "Only senior staff."
        ],
        "explanation": "The lateness control applies to all staff who sign below the red line, and such officers may be required to explain any late arrival.",
        "keywords": ["lateness", "red_line_register", "attendance_control", "staff_discipline"]
    },
    "circ_leave_welfare_allowances_gen_077": {
        "question": "What is the status of an officer who leaves the service because of failing a compulsory examination?",
        "options": [
            "The officer is eligible to reapply immediately.",
            "The officer must be given another chance to take the examination.",
            "The officer is not regarded as having been dismissed from the service.",
            "The officer is automatically demoted."
        ],
        "explanation": "Rule 020906 states that an officer who leaves the service on the grounds of failing a compulsory examination is not regarded as having been dismissed from the service.",
        "keywords": ["compulsory_examination", "service_exit", "not_dismissed", "psr_020906"]
    },
    "circ_leave_welfare_allowances_gen_078": {
        "question": "What is the main purpose of issuing a Certificate of Service?",
        "options": [
            "To provide a record of an officer's salary history.",
            "To provide a log of leave enjoyed by the officer.",
            "To provide a summary of the officer's performance.",
            "To serve as a reference covering the holder's public service when seeking other employment."
        ],
        "explanation": "Rule 021103 states that a Certificate of Service may be used as a reference covering the holder's public service when seeking other employment.",
        "keywords": ["certificate_of_service", "reference_document", "public_service_record", "rule_021103"]
    },
    "circ_leave_welfare_allowances_gen_079": {
        "question": "For confirmation in appointment, within how many years must an officer pass the prescribed examination?",
        "options": [
            "As specified by the Examination Board.",
            "Three years.",
            "Two years.",
            "One year."
        ],
        "explanation": "Rule 020301 links confirmation to the two-year probationary period, within which the prescribed examination must be passed.",
        "keywords": ["confirmation_exam", "probationary_period", "two_years", "rule_020301"]
    },
    "circ_leave_welfare_allowances_gen_080": {
        "question": "A Supplementary General Warrant authorizes funds for additional services approved in which document?",
        "options": [
            "The Public Service Rules.",
            "Supplementary Estimates.",
            "The Annual Appropriation Act.",
            "Treasury Circulars."
        ],
        "explanation": "Financial Regulation 305 provides that a Supplementary General Warrant authorizes funds for additional services approved in Supplementary Estimates.",
        "keywords": ["supplementary_general_warrant", "supplementary_estimates", "additional_services", "financial_regulation_305"]
    },
    "circ_leave_welfare_allowances_gen_081": {
        "question": "By what time must all standing imprests be retired?",
        "options": [
            "When the cash advance holder goes on leave.",
            "Within one month of the issue date.",
            "On or before 31 December of the financial year in which they are issued.",
            "Only upon the explicit instruction of the Accountant-General."
        ],
        "explanation": "Financial Regulation 1011(i) requires all standing imprests to be retired on or before 31 December of the financial year in which they are issued.",
        "keywords": ["standing_imprest", "retirement_deadline", "31_december", "financial_regulation_1011"]
    },
    "circ_leave_welfare_allowances_gen_084": {
        "question": "What must be done with interest earned on bank accounts under the Financial Regulations?",
        "options": [
            "It must be classified to the appropriate revenue head and paid into the Consolidated Revenue Fund.",
            "It may be used for departmental welfare.",
            "It may be retained by the unit that earned it.",
            "It should be transferred to a suspense account."
        ],
        "explanation": "Under the Financial Regulations, interest earned on bank accounts must be classified to the appropriate revenue head and paid into the Consolidated Revenue Fund.",
        "keywords": ["bank_interest", "revenue_head", "consolidated_revenue_fund", "financial_regulations"]
    }
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = []
    for sub in data["subcategories"]:
        if sub.get("id") != SUBCATEGORY_ID:
            continue
        for q in sub.get("questions", []):
            qid = q.get("id")
            if qid not in UPDATES:
                continue
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
