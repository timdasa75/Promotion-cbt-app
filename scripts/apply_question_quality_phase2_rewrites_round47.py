import json
from pathlib import Path

path = Path('data/financial_regulations.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'fin_aud_071': {
        'question': 'Under FR 1708, what guide must the Head of Internal Audit Unit prepare for audit staff?',
        'options': [
            "The Auditor-General's Manual.",
            'A Financial Statement.',
            'An Audit Guide.',
            'The General Warrant.'
        ],
        'explanation': 'Financial Regulation 1708 requires the Head of Internal Audit Unit to prepare and issue an Audit Guide for the use of audit staff. The item therefore tests recognition of the guide named in the regulation.',
        'keywords': ['fr_1708', 'audit_guide', 'internal_audit_unit', 'audit_staff']
    },
    'fin_bgt_070': {
        'question': 'Which financial report shows the income and expenditure of a government body for a specific period?',
        'options': [
            'Statement of Financial Performance.',
            'Statement of Financial Position.',
            'Appropriation Act.',
            'Consolidated Financial Statement.'
        ],
        'explanation': 'The Statement of Financial Performance shows the income and expenditure of a government body for a given period. The item therefore tests recognition of the report that summarizes financial performance over time.',
        'keywords': ['statement_of_financial_performance', 'income_and_expenditure', 'financial_reporting', 'government_body']
    },
    'fin_aud_067': {
        'question': 'Under FR 118(i), what is the chief accountability of the Political Head of a Ministry regarding its activities?',
        'explanation': 'Financial Regulation 118(i) states that the Political Head is accountable for supervising and controlling the activities of the ministry, agency, or parastatal. The correct option therefore identifies that supervisory responsibility.',
        'keywords': ['fr_118_i', 'political_head', 'ministry_accountability', 'supervision_and_control']
    },
    'fin_bgt_046': {
        'question': 'Which term refers to the maximum amount an MDA may legally spend within a fiscal year for a defined purpose?',
        'explanation': 'Appropriation is the legislative authorization that sets the maximum amount an MDA may spend within a fiscal year for a stated purpose. The item therefore tests the correct budgeting term for that legal spending limit.',
        'keywords': ['appropriation', 'legal_spending_limit', 'mda_budget', 'fiscal_year']
    },
    'fin_bgt_063': {
        'question': 'Which warrant authorizes the Accountant-General to transfer sums appropriated from the Consolidated Revenue Fund to the Contingency Fund for replenishment?',
        'explanation': 'Financial Regulation 308 states that a Supplementary General Warrant is the authority for the Accountant-General to transfer sums appropriated from the Consolidated Revenue Fund to the Contingency Fund by way of replenishment. The item therefore tests recognition of that warrant.',
        'keywords': ['supplementary_general_warrant', 'fr_308', 'contingency_fund', 'accountant_general']
    },
    'fin_bgt_072': {
        'question': 'Which instruments are used to limit and arrange the disbursement of Federal Government funds?',
        'explanation': 'Financial Regulation 301 states that the Annual Estimates and Appropriation Act are the instruments used to limit and arrange the disbursement of Federal Government funds. The item therefore tests identification of those controlling instruments.',
        'keywords': ['annual_estimates', 'appropriation_act', 'fr_301', 'fund_disbursement']
    },
    'fin_gen_016': {
        'question': "What does 'public expenditure' mean in public finance?",
        'explanation': 'Public expenditure refers to all government spending from public funds on recurrent and capital activities. The item therefore tests recognition of the broad term for government spending.',
        'keywords': ['public_expenditure', 'government_spending', 'public_funds', 'public_finance']
    },
    'fin_gen_044': {
        'question': "What does 'capital expenditure' mean in public finance?",
        'explanation': 'Capital expenditure is spending on the acquisition, improvement, or maintenance of fixed assets and infrastructure that produce future benefits. The item therefore tests recognition of the term for asset-focused expenditure.',
        'keywords': ['capital_expenditure', 'fixed_assets', 'infrastructure', 'public_finance']
    },
    'fin_pro_064': {
        'question': 'Which core financial-management principle must the Accounting Officer secure in a self-accounting unit?',
        'explanation': 'A self-accounting unit must be run with transparency and accountability in financial operations. The regulations emphasize observance of rules, proper accounting, and budget-performance reporting, so the item is testing that core management principle.',
        'keywords': ['self_accounting_unit', 'accounting_officer', 'transparency', 'accountability']
    },
    'fin_pro_071': {
        'question': 'Which of the following is not included in the definition of a Sub-Accounting Officer under Financial Regulation 115(ii)?',
        'options': [
            'Pensions Disbursement Officer.',
            'Sub-Treasurer of the Federation.',
            'Minister of a Ministry.',
            'Federal Pay Officer.'
        ],
        'explanation': 'Financial Regulation 115(ii) lists officers such as the Sub-Treasurer of the Federation, Federal Pay Officer, and Pensions Disbursement Officer as Sub-Accounting Officers. A Minister is the Political Head under Financial Regulation 116, not a Sub-Accounting Officer.',
        'keywords': ['sub_accounting_officer', 'fr_115_ii', 'financial_regulations', 'political_head']
    }
}
changed = 0
for subcategory in data.get('subcategories', []):
    for question in subcategory.get('questions', []):
        update = updates.get(question.get('id'))
        if not update:
            continue
        question.update(update)
        changed += 1
expected = len(updates)
if changed != expected:
    raise RuntimeError(f'Expected {expected} updates, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} financial regulations definition-alignment rewrites.')
