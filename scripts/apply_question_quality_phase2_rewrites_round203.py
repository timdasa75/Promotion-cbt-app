from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "data" / "financial_regulations.json": {
        "fin_aud_058": {
            "options": [
                "Permanent Secretary or equivalent head with full resource responsibility.",
                "Internal-audit officer serving alone as accounting head.",
                "Voucher-signing officer handling disbursement processing.",
                "Any officer who handles public money.",
            ],
            "explanation": "Under the Financial Regulations, the Accounting Officer is the Permanent Secretary or equivalent head who bears responsibility for the ministry's human, material, and financial resources.",
        },
        "fin_audits_sanctions_gen_023": {
            "options": [
                "Proper authorization within the approved vote structure.",
                "Fund movement without proper authorization.",
                "Personal preference in reallocation decisions.",
                "Transfers outside the approved vote structure.",
            ],
            "explanation": "Lawful virement control requires approved authority and movement within the vote structure authorized for that purpose.",
        },
        "fin_bgt_045": {
            "options": [
                "Payment within one month.",
                "Payment within the year of effect.",
                "Payment within six months.",
                "Payment within two years.",
            ],
            "explanation": "Promotion arrears should be settled within the year in which the promotion takes effect, not left indefinitely outstanding.",
        },
        "fin_bgt_051": {
            "options": [
                "Automatic re-appropriation by the National Assembly.",
                "Automatic lapse at year-end.",
                "Automatic carry-forward to the next year.",
                "Transfer to the Contingencies Fund.",
            ],
            "explanation": "A capital amount conveyed by warrant but not cash-backed to the CCA by year-end lapses automatically unless fresh authority is obtained.",
        },
        "fin_bgt_052": {
            "options": [
                "Transfer to the Development Fund.",
                "Automatic carry-forward to the next year.",
                "Fresh re-appropriation by the National Assembly.",
                "Automatic lapse at year-end.",
            ],
            "explanation": "For capital expenditure, an amount conveyed by warrant but not cash-backed to the CCA by year-end does not remain alive; it lapses automatically.",
        },
        "fin_bgt_064": {
            "options": [
                "Start of every financial year.",
                "Need for a new project only.",
                "Expenditure from the Contingencies Fund.",
                "Need for extra provision matched by savings under another sub-head of the same Head.",
            ],
            "explanation": "A Virement Warrant is issued when additional provision is needed under one sub-head and matching savings are available under another sub-head of the same Head.",
        },
        "fin_bgt_078": {
            "options": [
                "Amounts above the total project cost.",
                "Unlimited brought-forward amounts.",
                "Amounts below fifty percent of project cost only.",
                "Amounts not exceeding the estimated total project cost in the approved estimates.",
            ],
            "explanation": "Funds brought forward under a Development Fund Supplementary Warrant must stay within the estimated total project cost shown in the annual or supplementary estimates.",
        },
        "fin_bgt_081": {
            "options": [
                "Unlimited funding flexibility.",
                "Amounts above the estimated total project cost.",
                "A mandatory fifty-percent ceiling only.",
                "A ceiling tied to the estimated total project cost in the approved estimates.",
            ],
            "explanation": "The policy objective is cost discipline: the brought-forward amount must remain within the estimated total project cost already approved in the annual or supplementary estimates.",
        },
        "fin_budgeting_gen_004": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "Vote-book control is strongest when officers confirm budget availability before creating commitments and record the commitment properly.",
        },
        "fin_budgeting_gen_022": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "A sustainable vote-book routine begins with confirming available provision before any commitment is raised.",
        },
        "fin_budgeting_gen_023": {
            "options": [
                "Proper authorization before funds move between heads.",
                "Fund movement without approval.",
                "Personal preference in reallocation.",
                "Transfers outside the approved vote structure.",
            ],
            "explanation": "The virement process is lawful only when reallocation is authorized and kept within the approved vote structure.",
        },
        "fin_gen_011": {
            "options": [
                "Capital-project account only.",
                "Main account into which government revenues are paid.",
                "External-loan account.",
                "Emergency-fund account only.",
            ],
            "explanation": "The Consolidated Revenue Fund is the principal public account into which government revenues are paid under the constitutional and financial framework.",
        },
        "fin_gen_061": {
            "options": [
                "Transfer to the Development Fund.",
                "Automatic return to the Federation Account.",
                "Carry-forward to the next year.",
                "Lapse at year-end.",
            ],
            "explanation": "An unspent recurrent balance does not roll over automatically; it lapses at the end of the financial year.",
        },
        "fin_gen_079": {
            "options": [
                "Written directive from the Political Head.",
                "Verbal directive only.",
                "Directive required only for minor matters.",
                "Directive first approved by the National Assembly.",
            ],
            "explanation": "When a directive has financial implications, it must be given in writing so the authority and responsibility can be clearly traced.",
        },
        "fin_gen_087": {
            "options": [
                "Pursuit of clearance and recovery on dishonored cheques.",
                "Summary of daily bank transactions.",
                "Tracking of bank charges only.",
                "Log of all incoming and outgoing cheques.",
            ],
            "explanation": "A dishonored-cheques register exists so the department can follow up on clearance and recovery after a cheque is dishonored.",
        },
        "fin_general_gen_004": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "General financial control depends on confirming provision before commitments are made and recording them properly in the vote book.",
        },
        "fin_general_gen_022": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "The routine that sustains vote-book control is checking available provision before each commitment is raised.",
        },
        "fin_general_gen_023": {
            "options": [
                "Proper authorization before funds move between heads.",
                "Fund movement without approval.",
                "Personal preference in reallocation.",
                "Transfers outside the approved vote structure.",
            ],
            "explanation": "Virement remains lawful only when the movement of funds is authorized and kept within the approved vote structure.",
        },
        "fin_pro_044": {
            "options": [
                "High contract price alone.",
                "Availability of a preferred contractor.",
                "Declared emergency circumstances.",
                "Routine purchases as normal practice.",
            ],
            "explanation": "Section 42 allows direct procurement only in limited circumstances such as declared emergencies, not for routine convenience.",
        },
        "fin_pro_051": {
            "options": [
                "Personal conduct of all external audits.",
                "Personal execution of every procurement.",
                "Approval of all payments without review.",
                "Ensuring adequate annual-budget appropriation.",
            ],
            "explanation": "An Accounting Officer must ensure procurement is supported by adequate appropriation in the approved annual budget before it proceeds.",
        },
        "fin_pro_066": {
            "options": [
                "Freedom for MDAs to spend outside approved budgets.",
                "Funding of projects without budget provision.",
                "Exclusive reliance on donor funding.",
                "Certification and funding only for duly appropriated projects.",
            ],
            "explanation": "Due Process aims to stop extra-budgetary spending by ensuring that only projects with proper appropriation are certified and funded.",
        },
        "fin_pro_074": {
            "options": [
                "Unlimited authority at the Accounting Officer's discretion.",
                "Authority limited to the approved amounts under each sub-head.",
                "Authority limited to personal emoluments only.",
                "Authority unlimited so long as cash is available.",
            ],
            "explanation": "Recurrent expenditure warrants authorize spending only up to the amounts approved under each relevant sub-head in the estimates.",
        },
        "fin_procurement_gen_004": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "Procurement under financial controls still depends on vote-book discipline: provision should be confirmed before commitments are raised.",
        },
        "fin_procurement_gen_026": {
            "options": [
                "Budget confirmation before commitments are raised.",
                "Commitments raised without budget checks.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "A reliable procurement-control routine starts with budget confirmation before commitments are created.",
        },
        "fin_procurement_gen_027": {
            "options": [
                "Proper authorization before funds move between heads.",
                "Fund movement without approval.",
                "Personal preference in reallocation.",
                "Transfers outside the approved vote structure.",
            ],
            "explanation": "In procurement under financial controls, virement is proper only when authorized and kept within the approved vote structure.",
        },
        "fin_procurement_gen_033": {
            "options": [
                "Commitments raised without budget checks.",
                "Budget confirmation before commitments are raised.",
                "Informal instructions treated as authority.",
                "Required records skipped before commitment.",
            ],
            "explanation": "Where procurement requires vote-book discipline, the first step is to confirm available budget provision before any commitment is raised.",
        },
        "fin_aud_065": {
            "question": "Which officer verifies the Head and sub-head entered by the Revenue Collector on the paying-in form?",
            "options": [
                "The Accountant-General.",
                "The Head of Internal Audit.",
                "The Accounting Officer.",
                "The receiving cashier.",
            ],
            "explanation": "Financial Regulation 209(i) assigns that verification to the receiving cashier, who checks that the Head and sub-head entered on the paying-in form are correct.",
        },
        "fin_bgt_071": {
            "question": "According to Financial Regulation 103, whose signature must appear on a warrant before payment can be made?",
            "options": [
                "The President.",
                "The Accountant-General.",
                "The Minister of Finance.",
                "The National Assembly.",
            ],
            "explanation": "Financial Regulation 103 requires payment authority to come through a warrant duly issued and signed by the Minister of Finance.",
        },
        "fin_gen_028": {
            "question": "Which Nigerian law established the Debt Management Office (DMO)?",
            "explanation": "The Debt Management Office was established by the Debt Management Act 2003, not by the Public Procurement Act, Fiscal Responsibility Act, or the Financial Regulations.",
        },
        "fin_gen_060": {
            "question": "Which role supervises and controls the computerization of the accounting system in federal ministries?",
            "options": [
                "The Accountant-General.",
                "The Minister of Finance.",
                "The Auditor-General.",
                "The Head of Finance and Accounts.",
            ],
            "explanation": "Financial Regulation 107(1) places supervision and control of the computerization of the accounting system under the Accountant-General.",
        },
        "fin_gen_069": {
            "question": "Which role approves the grant of self-accounting status to a ministry, extra-ministerial office, or other arm of government?",
            "options": [
                "The Accountant-General.",
                "The Minister of Finance.",
                "The Head of Department.",
                "The Auditor-General.",
            ],
            "explanation": "Financial Regulation 1602 requires approval by the Accountant-General before self-accounting status is granted.",
        },
        "fin_gen_072": {
            "question": "Which role is the Head of the Federal Government Accounting Services and the Treasury?",
            "options": [
                "The Accountant-General of the Federation.",
                "The Auditor-General for the Federation.",
                "The Head of Finance and Accounts of a ministry.",
                "The Minister of Finance.",
            ],
            "explanation": "Financial Regulation 106 identifies the Accountant-General of the Federation as the Head of the Federal Government Accounting Services and the Treasury.",
        },
        "fin_gen_086": {
            "explanation": "When a receipt or licence contains an incorrect entry, it should be cancelled and reissued correctly so the official record remains reliable and tamper-resistant.",
        },
        "fin_pro_003": {
            "question": "Which procurement method is the default procedure for public procurement under the PPA?",
            "explanation": "The Public Procurement Act makes open competitive bidding the default method because it is the standard approach for transparent and competitive procurement.",
        },
        "fin_pro_036": {
            "question": "Under which section of the PPA is the BPP empowered to conduct procurement audits?",
            "explanation": "Section 6 of the Public Procurement Act empowers the Bureau of Public Procurement to carry out procurement audits.",
        },
        "fin_pro_045": {
            "question": "Section 14 of the PPA prohibits procurement without what condition?",
            "explanation": "Section 14 requires prior appropriation, meaning procurement should not proceed unless budget provision and funds are in place.",
        },
        "fin_pro_057": {
            "question": "Which role is responsible for approving and ensuring compliance with accounting codes, internal audit guides, and stock verification manuals?",
            "options": [
                "The Accountant-General.",
                "The Minister of Finance.",
                "Accounting Officers.",
                "The Auditor-General.",
            ],
            "explanation": "Financial Regulation 107(i) assigns that responsibility to the Accountant-General, who approves those instruments and ensures compliance with them.",
        },
        "fin_procurement_gen_035": {
            "question": "During routine procurement under financial controls, which approach most strongly supports accountable implementation?",
            "explanation": "Accountable procurement implementation requires spending to be committed only with proper authorization and complete supporting records so the decision can be traced and reviewed.",
        },
        "fin_procurement_gen_037": {
            "question": "When decisions are made in procurement under financial controls, which step most directly improves traceability and fairness?",
            "explanation": "Traceability and fairness improve when spending is committed only with proper authorization and complete supporting records, leaving a clear documentary trail.",
        },
    },
}


def update_file(path: Path, rewrites: dict[str, dict[str, object]]) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    updated: list[str] = []

    def walk(node):
        if isinstance(node, dict):
            qid = node.get("id")
            if qid in rewrites:
                node.update(rewrites[qid])
                updated.append(qid)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return updated


def main() -> None:
    total = 0
    for path, rewrites in FILES.items():
        updated = update_file(path, rewrites)
        print(f"Updated {len(updated)} questions in {path.name}")
        for qid in updated:
            print(qid)
        total += len(updated)
    print(f"Total updated: {total}")


if __name__ == "__main__":
    main()
