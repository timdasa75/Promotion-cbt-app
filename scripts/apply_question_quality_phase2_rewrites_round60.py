import json
from pathlib import Path

DATA_PATH = Path("data/public_procurement.json")

UPDATES = {
    "ppa_bid_073": {
        "question": "Which principles are strengthened by the use of Standard Bidding Documents under Section 25?",
        "options": [
            "Sole sourcing and expediency.",
            "Complexity and expense.",
            "Political alignment and seniority.",
            "Standardization and equal treatment of bidders."
        ],
        "explanation": "Standard Bidding Documents promote standardization, comparability, and equal treatment because all bidders respond to the same requirements and evaluation structure.",
        "keywords": ["standard_bidding_documents", "section_25", "equal_treatment", "standardization"]
    },
    "ppa_bid_074": {
        "question": "If a bid security expires during the evaluation process, what should the procuring entity do?",
        "options": [
            "Request the bidder to extend the validity period.",
            "Notify the Federal Executive Council immediately.",
            "Disqualify the bidder automatically.",
            "Award the contract immediately."
        ],
        "explanation": "Where bid security is due to expire during evaluation, the procuring entity should request an extension so the security remains valid until the process is concluded.",
        "keywords": ["bid_security", "evaluation_process", "validity_extension", "procurement_entity"]
    },
    "ppa_elb_055": {
        "question": "Which bid-evaluation practice best reflects fair procurement procedure?",
        "options": [
            "Apply rules inconsistently based on personal preference.",
            "Apply published criteria consistently to all responsive bids.",
            "Ignore feedback and continue non-compliant procedures.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Fair procurement requires the procuring entity to apply the published evaluation criteria consistently to every responsive bid.",
        "keywords": ["bid_evaluation", "published_criteria", "responsive_bids", "fair_procurement"]
    },
    "ppa_elb_057": {
        "question": "Which document helps verify a bidder's compliance with pension obligations and workforce-integrity requirements?",
        "options": [
            "A valid Pension Clearance Certificate (PenCom).",
            "A driver's licence.",
            "A certificate of incumbency.",
            "A marriage certificate."
        ],
        "explanation": "A valid Pension Clearance Certificate helps show that the bidder is complying with pension obligations relevant to eligibility screening.",
        "keywords": ["bidder_eligibility", "pension_clearance_certificate", "pencom", "workforce_integrity"]
    },
    "ppa_elb_058": {
        "question": "For a straightforward consultancy assignment where technical scores are similar, which selection method best emphasizes cost efficiency?",
        "options": [
            "Single Source Selection.",
            "Quality-Based Selection (QBS).",
            "Quality- and Cost-Based Selection (QCBS).",
            "Least Cost Selection (LCS)."
        ],
        "explanation": "Least Cost Selection is used where consultants meet the required technical standard and cost efficiency becomes the key differentiator.",
        "keywords": ["consultancy_selection", "least_cost_selection", "cost_efficiency", "technical_scores"]
    },
    "ppa_elb_059": {
        "question": "If a consulting firm cannot provide evidence of tax compliance through a Tax Clearance Certificate, how should it be treated during evaluation?",
        "options": [
            "Award the contract based on technical score alone.",
            "Subject it to negotiation first.",
            "Exclude it from further evaluation.",
            "Give it preferential treatment."
        ],
        "explanation": "A firm that cannot show the required Tax Clearance Certificate fails a key eligibility condition and should be excluded from further evaluation.",
        "keywords": ["tax_clearance_certificate", "consulting_firm", "eligibility", "evaluation_exclusion"]
    },
    "ppa_elb_060": {
        "question": "What must an Accounting Officer ensure about contractors debarred or blacklisted by the BPP?",
        "options": [
            "They are excluded only from works contracts.",
            "They are excluded from all tenders.",
            "They remain eligible for small contracts.",
            "They receive preferential treatment."
        ],
        "explanation": "A contractor debarred or blacklisted by the Bureau of Public Procurement should not be allowed to participate in tenders while that sanction remains in force.",
        "keywords": ["accounting_officer", "bpp", "debarment", "blacklisted_contractors"]
    },
    "ppa_elb_061": {
        "question": "Which action best demonstrates citizen-focused service in procurement planning and consultant selection?",
        "options": [
            "Balance legality, fairness, timeliness, and service quality.",
            "Rely on informal instructions without documentary evidence.",
            "Treat exceptions as routine without documented justification.",
            "Delay decisions until issues escalate into avoidable crises."
        ],
        "explanation": "Citizen-focused procurement service requires lawful, fair, timely, and quality-focused decisions that can withstand public scrutiny.",
        "keywords": ["citizen_focused_service", "procurement_planning", "consultant_selection", "service_quality"]
    },
    "ppa_elb_062": {
        "question": "If an MDA's procurement plan requires a major virement for a project, whose approval must the MDA obtain?",
        "options": [
            "The authority empowered to approve that level of expenditure, such as the National Assembly where applicable.",
            "The bidding consultant handling the evaluation.",
            "The Minister of Foreign Affairs.",
            "The Central Bank of Nigeria."
        ],
        "explanation": "A major virement requires approval from the authority legally empowered to approve the relevant level of expenditure, not from procurement advisers or unrelated offices.",
        "keywords": ["mda", "procurement_plan", "virement", "expenditure_approval"]
    },
    "ppa_elb_063": {
        "question": "Which practice best protects procurement ethics in eligibility and consultant selection?",
        "options": [
            "Ignore feedback and continue non-compliant procedures.",
            "Prevent collusion, favoritism, and conflicts of interest.",
            "Apply rules inconsistently based on personal preference.",
            "Bypass review and approval controls to save time."
        ],
        "explanation": "Procurement ethics are protected when the process actively prevents collusion, favoritism, and conflicts of interest that could compromise fairness.",
        "keywords": ["procurement_ethics", "consultant_selection", "collusion", "conflict_of_interest"]
    },
    "ppa_elb_064": {
        "question": "Before making a procurement commitment such as issuing an LPO, which record should be checked to confirm funds are available in the relevant subhead?",
        "options": [
            "The Vote Book (Expenditure Ledger).",
            "The final audit report.",
            "The general ledger.",
            "The payment slip register."
        ],
        "explanation": "The Vote Book is checked before commitment so the officer can confirm that funds remain available under the relevant subhead.",
        "keywords": ["lpo", "vote_book", "fund_availability", "subhead"]
    },
    "ppa_elb_067": {
        "question": "Which practice best upholds service integrity in eligibility screening and consultant selection?",
        "options": [
            "Rely on informal instructions without documentary evidence.",
            "Close cases without validating facts or keeping proper records.",
            "Avoid conflicts of interest and disclose relevant constraints.",
            "Treat exceptions as routine without documented justification."
        ],
        "explanation": "Service integrity in procurement screening depends on avoiding conflicts of interest and disclosing any constraint that could affect impartial judgment.",
        "keywords": ["service_integrity", "eligibility_screening", "consultant_selection", "disclosure"]
    },
    "ppa_elb_073": {
        "question": "What is the process of verifying a bidder's technical capacity after bid opening but before contract award called?",
        "options": [
            "Post-qualification audit.",
            "Pre-qualification.",
            "Technical assessment.",
            "Financial scrutiny."
        ],
        "explanation": "Checking a bidder's technical capacity after bids are opened but before award is part of post-qualification, which confirms eligibility and capacity at the award stage.",
        "keywords": ["post_qualification", "technical_capacity", "bid_opening", "contract_award"]
    },
    "ppa_elb_075": {
        "question": "In procurement budgeting, what internal control does the Vote Book primarily support?",
        "options": [
            "External auditing.",
            "Separation of duties.",
            "Obligation control.",
            "Budget virement."
        ],
        "explanation": "The Vote Book supports obligation control by helping officers confirm that funds are available before commitments are made against a budget line.",
        "keywords": ["vote_book", "procurement_budgeting", "obligation_control", "internal_control"]
    },
    "ppa_ims_062": {
        "question": "Before a contractor can receive a mobilization fee, what security should be provided first?",
        "options": [
            "A virement warrant.",
            "A Tax Clearance Certificate.",
            "An advance payment guarantee or performance bond.",
            "A letter from the Auditor-General."
        ],
        "explanation": "A mobilization fee is ordinarily protected by an advance payment guarantee or similar security so public funds are safeguarded before disbursement.",
        "keywords": ["mobilization_fee", "advance_payment_guarantee", "performance_bond", "contractor"]
    },
    "ppa_ims_065": {
        "question": "Which publication should carry contract awards above the relevant threshold in support of procurement transparency?",
        "options": [
            "The BPP Procurement Journal.",
            "The MDA's website only.",
            "The Daily Times.",
            "The National Salaries, Incomes and Wages Circulars."
        ],
        "explanation": "Publishing contract awards in the BPP Procurement Journal supports transparency by placing award information in the recognized procurement publication channel.",
        "keywords": ["contract_awards", "bpp_procurement_journal", "transparency", "threshold"]
    },
    "ppa_ims_066": {
        "question": "Under Section 57, procurement officials are prohibited from having what kind of personal interest?",
        "options": [
            "Contract variation.",
            "Domestic preference.",
            "Conflict of interest.",
            "Abnormally low bidding."
        ],
        "explanation": "Section 57 addresses conflicts of interest by prohibiting procurement officials from holding personal interests that could compromise their judgment.",
        "keywords": ["section_57", "procurement_officials", "conflict_of_interest", "personal_interest"]
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
