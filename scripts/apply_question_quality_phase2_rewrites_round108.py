#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'financial_regulations.json'
SUBS = {'fin_procurement', 'fin_budgeting', 'fin_general'}
UPDATES = {}


def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out


def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {
        'question': q,
        'options': opts(i, good, bad),
        'explanation': exp,
        'keywords': kw,
    }


def add_many(specs, good, bad, exp, kw):
    for qid, i, q in specs:
        add(qid, q, i, good, bad, exp, kw)


BAD_DOC = [
    'Personal preference in procedure use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_ACC = [
    'Unrecorded decisions under pressure.',
    'Convenience ahead of review duty.',
    'Inconsistent criteria across similar cases.',
]
BAD_RISK = [
    'Unreported exceptions in routine work.',
    'Convenience ahead of risk review.',
    'Personal preference in risk handling.',
]
BAD_CTRL = [
    'Convenience ahead of control requirements.',
    'Repeated non-compliance after feedback.',
    'Personal preference in control use.',
]
BAD_WORKFLOW = [
    'Skipped workflow checks under pressure.',
    'Personal preference in workflow steps.',
    'Repeated non-compliance after feedback.',
]
BAD_FILE = [
    'Personal preference in filing practice.',
    'Bypassed review checkpoints.',
    'Convenience ahead of documentation standards.',
]
BAD_VOTE = [
    'Commitments raised without budget checks.',
    'Informal instructions treated as authority.',
    'Required records skipped before commitment.',
]
BAD_AUDIT = [
    'Missing supporting documents for review.',
    'Delayed documentation until after implementation.',
    'Convenience ahead of audit trail requirements.',
]
BAD_VIRE = [
    'Movement of funds without approval.',
    'Personal preference in reallocation.',
    'Transfers made outside the approved vote structure.',
]
BAD_PRO = [
    'Discretionary shortcuts under pressure.',
    'Convenience ahead of approved process.',
    'Bypassed review checkpoints.',
]

# fin_procurement generated shell
add_many([
    ('fin_procurement_gen_003', 0, 'Which practice best supports risk management in procurement under financial controls?'),
    ('fin_procurement_gen_032', 1, 'When a supervisor reviews gaps in procurement under financial controls, which step most directly strengthens risk management?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['fin_procurement', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('fin_procurement_gen_004', 0, 'Which practice best supports vote-book control in procurement under financial controls?'),
    ('fin_procurement_gen_026', 0, 'Which routine best sustains vote-book control in procurement under financial controls?'),
    ('fin_procurement_gen_033', 1, 'When procurement under financial controls requires vote-book discipline, what should be done first?'),
],
'Budget availability confirmed before commitments are raised.', BAD_VOTE,
'Vote-book control is strongest when budget availability is confirmed before commitments are raised and the commitment is recorded properly.',
['fin_procurement', 'vote_book_control', 'budget_availability', 'commitment_control'])
add_many([
    ('fin_procurement_gen_011', 0, 'Which practice best supports audit readiness in procurement under financial controls?'),
    ('fin_procurement_gen_029', 0, 'Which routine best sustains audit readiness in procurement under financial controls?'),
],
'Complete supporting records for verification and audit.', BAD_AUDIT,
'Audit readiness depends on complete supporting records that can be reviewed, verified, and linked to each decision taken.',
['fin_procurement', 'audit_readiness', 'supporting_records', 'verification'])
add('fin_procurement_gen_013', 'Which practice best supports documented procedure in procurement under financial controls?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['fin_procurement', 'documented_procedure', 'approved_process', 'complete_records'])
add('fin_procurement_gen_015', 'Which action best demonstrates public accountability in procurement under financial controls?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['fin_procurement', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('fin_procurement_gen_017', 'Which practice best supports risk control in procurement under financial controls?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['fin_procurement', 'risk_control', 'documented_mitigation', 'follow_up'])
add('fin_procurement_gen_019', 'Which practice best sustains operational discipline in procurement under financial controls?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['fin_procurement', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('fin_procurement_gen_021', 'Which practice best supports record management in procurement under financial controls?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['fin_procurement', 'record_management', 'current_files', 'status_updates'])
add('fin_procurement_gen_027', 'Which practice best supports the virement process in procurement under financial controls?', 0,
    'Proper authorization before funds are moved between heads.', BAD_VIRE,
    'The virement process remains lawful when funds are moved only with proper authorization and within the approved vote structure.',
    ['fin_procurement', 'virement', 'proper_authorization', 'vote_structure'])
add_many([
    ('fin_procurement_gen_034', 2, 'When a procurement unit faces competing priorities under financial controls, which action best preserves compliance and service quality?'),
    ('fin_procurement_gen_036', 1, 'When a supervisor reviews gaps in procurement under financial controls, which option best strengthens control and consistency?'),
],
'Commitment made only with authorization and complete supporting records.', BAD_PRO,
'Control and service quality are strongest when commitment follows proper authorization and complete supporting records rather than shortcuts.',
['fin_procurement', 'control_and_consistency', 'authorized_commitment', 'supporting_records'])

# fin_procurement factual tail
add('fin_pro_044', 'Under section 42, when is direct procurement typically allowed?', 2,
    'In declared emergencies.',
    ['When the price is high.', 'When a preferred contractor is available.', 'For routine purchases.'],
    'Direct procurement is ordinarily restricted to situations such as declared emergencies rather than routine convenience.',
    ['direct_procurement', 'section_42', 'declared_emergency', 'public_procurement'])
add('fin_pro_051', 'What is one key responsibility of an Accounting Officer under the Public Procurement Act?', 3,
    'Ensuring adequate appropriation is available in the annual budget.',
    ['Conducting all external audits personally.', 'Executing all procurements personally.', 'Approving all payments without review.'],
    'A key duty of the Accounting Officer is to ensure that procurement is backed by adequate appropriation in the approved annual budget.',
    ['accounting_officer', 'public_procurement_act', 'adequate_appropriation', 'annual_budget'])
add('fin_pro_066', 'What does the Due Process policy seek to ensure to prevent extra-budgetary spending in MDAs?', 3,
    'Only projects with due appropriation are certified and funded.',
    ['MDAs may spend outside approved budgets.', 'Projects may be funded without budget provision.', 'Funding must come only from international donors.'],
    'Due Process is intended to prevent extra-budgetary spending by ensuring that only projects with due appropriation are certified and funded.',
    ['due_process', 'extra_budgetary_spending', 'appropriation', 'mda'])
add('fin_pro_068', 'What Due Process objective applies to project conceptualization?', 0,
    'Project conceptualization and packaging should match annual appropriation priorities and targets.',
    ['Projects should be disconnected from annual appropriations.', 'Conceptualization should be left to external consultants only.', 'Projects should be conceptualized on an ad hoc basis.'],
    'Due Process requires project conceptualization and packaging to align with the priorities and targets already defined in the annual financial appropriations.',
    ['due_process', 'project_conceptualization', 'appropriation_priorities', 'project_packaging'])
add('fin_pro_069', 'What does the term Accounting Officer mean in official procurement practice?', 0,
    'The Permanent Secretary or head responsible for human, material, and financial resources.',
    ['An officer who keeps a cash book.', 'The Chief Executive of a parastatal in every case.', 'Any officer involved in financial transactions.'],
    'In official practice, the Accounting Officer is the Permanent Secretary or equivalent head with responsibility for human, material, and financial resources.',
    ['accounting_officer', 'permanent_secretary', 'resource_responsibility', 'official_practice'])
add('fin_pro_074', 'What is the limit of authority conveyed by recurrent expenditure warrants to officers controlling votes?', 1,
    'It is limited to the amounts provided under each sub-head in the approved and supplementary estimates.',
    ['It depends entirely on the Accounting Officer\'s discretion.', 'It applies only to personal emoluments.', 'It is unlimited as long as cash is available.'],
    'Authority conveyed by recurrent expenditure warrants is limited to the amounts provided under each relevant sub-head in the approved estimates.',
    ['recurrent_expenditure_warrant', 'officers_controlling_votes', 'sub_head_limits', 'approved_estimates'])

# fin_budgeting generated shell
add_many([
    ('fin_budgeting_gen_001', 0, 'Which practice best strengthens governance in budgeting and financial planning?'),
    ('fin_budgeting_gen_019', 0, 'Which action best demonstrates governance discipline in budgeting and financial planning?'),
],
'Approved budgeting procedure with complete records.', BAD_DOC,
'Governance in budgeting and financial planning is strongest when officers follow the approved procedure and keep the full record needed for review.',
['fin_budgeting', 'governance', 'approved_procedure', 'complete_records'])
add('fin_budgeting_gen_003', 'Which practice best supports risk management in budgeting and financial planning?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['fin_budgeting', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('fin_budgeting_gen_004', 0, 'Which practice best supports vote-book control in budgeting and financial planning?'),
    ('fin_budgeting_gen_022', 0, 'Which routine best sustains vote-book control in budgeting and financial planning?'),
],
'Budget availability confirmed before commitments are raised.', BAD_VOTE,
'Vote-book control is strongest when budget availability is confirmed before commitments are raised and the commitment is recorded properly.',
['fin_budgeting', 'vote_book_control', 'budget_availability', 'commitment_control'])
add_many([
    ('fin_budgeting_gen_007', 0, 'Which practice best supports audit readiness in budgeting and financial planning?'),
    ('fin_budgeting_gen_025', 0, 'Which routine best sustains audit readiness in budgeting and financial planning?'),
],
'Complete supporting records for verification and audit.', BAD_AUDIT,
'Audit readiness depends on complete supporting records that can be reviewed, verified, and linked to each decision taken.',
['fin_budgeting', 'audit_readiness', 'supporting_records', 'verification'])
add('fin_budgeting_gen_009', 'Which practice best supports documented procedure in budgeting and financial planning?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['fin_budgeting', 'documented_procedure', 'approved_process', 'complete_records'])
add('fin_budgeting_gen_011', 'Which action best demonstrates public accountability in budgeting and financial planning?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['fin_budgeting', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('fin_budgeting_gen_013', 'Which practice best supports risk control in budgeting and financial planning?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['fin_budgeting', 'risk_control', 'documented_mitigation', 'follow_up'])
add('fin_budgeting_gen_015', 'Which practice best sustains operational discipline in budgeting and financial planning?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['fin_budgeting', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('fin_budgeting_gen_017', 'Which practice best supports record management in budgeting and financial planning?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['fin_budgeting', 'record_management', 'current_files', 'status_updates'])
add('fin_budgeting_gen_023', 'Which practice best supports the virement process in budgeting and financial planning?', 0,
    'Proper authorization before funds are moved between heads.', BAD_VIRE,
    'The virement process remains lawful when funds are moved only with proper authorization and within the approved vote structure.',
    ['fin_budgeting', 'virement', 'proper_authorization', 'vote_structure'])
add('fin_budgeting_gen_026', 'When a compliance reviewer handles budgeting and financial planning, what should be done first?', 0,
    'Validate authorization, records, and control checkpoints before action.', BAD_PRO,
    'Financial control is stronger when authorization, records, and control checkpoints are validated before action is taken.',
    ['fin_budgeting', 'control_review', 'authorization_check', 'control_checkpoints'])

# fin_budgeting factual tail
add('fin_bgt_031', 'Why are all financial commitments recorded in the Vote Book?', 1,
    'To ensure planned expenditure remains within the legal capacity of the approved budget.',
    ['To guarantee prompt promotion.', 'To simplify foreign-exchange conversion.', 'To track staff punctuality.'],
    'Recording commitments in the Vote Book helps ensure that spending stays within the approved budget and does not exceed lawful authority.',
    ['vote_book', 'financial_commitments', 'approved_budget', 'obligation_control'])
add('fin_bgt_045', 'Within what time should promotion arrears be paid after promotion takes effect?', 1,
    'Within the year in which the promotion is effected.',
    ['Within one month.', 'Within six months.', 'Within two years.'],
    'Promotion arrears should be paid within the year in which the promotion takes effect.',
    ['promotion_arrears', 'payment_timing', 'promotion', 'financial_year'])
add('fin_bgt_051', 'What happens if a capital-expenditure amount conveyed by warrant has not been cash-backed to the CCA by year-end?', 1,
    'It lapses automatically.',
    ['It must be re-appropriated automatically by the National Assembly.', 'It is carried forward automatically.', 'It is transferred to the Contingencies Fund.'],
    'Where a capital amount conveyed by warrant is not cash-backed to the CCA by year-end, it lapses rather than remaining available automatically.',
    ['capital_expenditure', 'cash_backing', 'cca', 'lapse'])
add('fin_bgt_052', 'For capital expenditure, what happens to an amount conveyed by warrant that is not cash-backed to the CCA by year-end?', 3,
    'It lapses automatically.',
    ['It is transferred to the Development Fund.', 'It is carried forward to the next year.', 'It must be re-appropriated by the National Assembly.'],
    'Amounts conveyed by warrant but not cash-backed to the CCA by year-end lapse automatically.',
    ['capital_expenditure', 'warrant', 'cash_backing', 'year_end_lapse'])
add('fin_bgt_064', 'When is a Virement Warrant issued?', 3,
    'When extra provision is needed under one sub-head and equivalent savings exist under another sub-head of the same Head.',
    ['At the beginning of each financial year.', 'When funds are needed for a new project only.', 'To empower expenditure from the Contingencies Fund.'],
    'A Virement Warrant is used when extra provision is required under one sub-head and equivalent savings can be made under another sub-head of the same Head.',
    ['virement_warrant', 'sub_head', 'equivalent_savings', 'same_head'])
add('fin_bgt_078', 'What limit applies to funds brought forward by a Development Fund Supplementary Warrant?', 3,
    'They must not exceed the estimated total project cost shown in the annual or supplementary estimates.',
    ['They may exceed the total project cost.', 'They are unlimited.', 'They must be less than fifty percent of the project cost.'],
    'Funds brought forward by a Development Fund Supplementary Warrant must stay within the estimated total project cost shown in the relevant estimates.',
    ['development_fund', 'supplementary_warrant', 'project_cost', 'estimates'])

# fin_general generated shell
add_many([
    ('fin_general_gen_001', 0, 'Which practice best strengthens governance in general financial management?'),
    ('fin_general_gen_019', 0, 'Which action best demonstrates governance discipline in general financial management?'),
],
'Approved financial procedure with complete records.', BAD_DOC,
'Governance in general financial management is strongest when officers follow the approved procedure and keep the full record needed for review.',
['fin_general', 'governance', 'approved_procedure', 'complete_records'])
add('fin_general_gen_003', 'Which practice best supports risk management in general financial management?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['fin_general', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('fin_general_gen_004', 0, 'Which practice best supports vote-book control in general financial management?'),
    ('fin_general_gen_022', 0, 'Which routine best sustains vote-book control in general financial management?'),
],
'Budget availability confirmed before commitments are raised.', BAD_VOTE,
'Vote-book control is strongest when budget availability is confirmed before commitments are raised and the commitment is recorded properly.',
['fin_general', 'vote_book_control', 'budget_availability', 'commitment_control'])
add('fin_general_gen_007', 'Which practice best supports audit readiness in general financial management?', 0,
    'Complete supporting records for verification and audit.', BAD_AUDIT,
    'Audit readiness depends on complete supporting records that can be reviewed, verified, and linked to each decision taken.',
    ['fin_general', 'audit_readiness', 'supporting_records', 'verification'])
add('fin_general_gen_009', 'Which practice best supports documented procedure in general financial management?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['fin_general', 'documented_procedure', 'approved_process', 'complete_records'])
add('fin_general_gen_011', 'Which action best demonstrates public accountability in general financial management?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['fin_general', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('fin_general_gen_013', 'Which practice best supports risk control in general financial management?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['fin_general', 'risk_control', 'documented_mitigation', 'follow_up'])
add('fin_general_gen_015', 'Which practice best sustains operational discipline in general financial management?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['fin_general', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('fin_general_gen_017', 'Which practice best supports record management in general financial management?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['fin_general', 'record_management', 'current_files', 'status_updates'])
add('fin_general_gen_023', 'Which practice best supports the virement process in general financial management?', 0,
    'Proper authorization before funds are moved between heads.', BAD_VIRE,
    'The virement process remains lawful when funds are moved only with proper authorization and within the approved vote structure.',
    ['fin_general', 'virement', 'proper_authorization', 'vote_structure'])
add('fin_general_gen_024', 'When a compliance reviewer handles general financial management, what should be done first?', 1,
    'Validate authorization, records, and control checkpoints before action.', BAD_PRO,
    'Financial control is stronger when authorization, records, and control checkpoints are validated before action is taken.',
    ['fin_general', 'control_review', 'authorization_check', 'control_checkpoints'])

# fin_general factual tail
add('fin_gen_011', 'What is the Consolidated Revenue Fund?', 1,
    'The main account into which government revenues are paid.',
    ['An account for capital projects only.', 'An account for external loans.', 'An account for emergency funds only.'],
    'The Consolidated Revenue Fund is the main public account into which government revenues are paid, subject to the constitutional and financial framework.',
    ['consolidated_revenue_fund', 'government_revenue', 'main_account', 'public_finance'])
add('fin_gen_021', 'What do accruals mean in government financial reporting?', 1,
    'Expenses or revenues recognized when incurred rather than when cash changes hands.',
    ['Cash received in advance for services.', 'Budget reserves held by the Minister of Finance.', 'Penalties for late tax payment.'],
    'Under accrual principles, revenues and expenses are recognized when they arise, not only when cash is received or paid.',
    ['accruals', 'financial_reporting', 'recognition', 'government_accounts'])
add('fin_gen_061', 'What happens to an unspent balance on a recurrent expenditure vote at year-end?', 3,
    'It lapses.',
    ['It is transferred to the Development Fund.', 'It is returned to the Federation Account automatically.', 'It is carried forward to the next year.'],
    'An unspent balance on a recurrent expenditure vote lapses at year-end rather than carrying forward automatically.',
    ['recurrent_expenditure_vote', 'unspent_balance', 'year_end', 'lapse'])
add('fin_gen_079', 'How must a directive from a Political Head to an Accounting Officer be given when it has financial implications?', 0,
    'It must be given in writing.',
    ['It may be given verbally.', 'It is required only for minor financial matters.', 'It must first be approved by the National Assembly.'],
    'Where a directive has financial implications, it must be given in writing so responsibility and authority are clear.',
    ['political_head', 'accounting_officer', 'financial_directive', 'written_instruction'])


data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for q in sub.get('questions', []):
        payload = UPDATES.get(q.get('id'))
        if payload:
            q.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 108 rewrites to {updated} questions')
