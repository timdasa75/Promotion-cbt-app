#!/usr/bin/env python3`n# -*- coding: utf-8 -*-`nfrom __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'public_procurement.json'
SUBS = {'proc_eligibility_consultants_budgeting'}
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


BAD_GOV = [
    'Convenience ahead of approved process requirements.',
    'Skipped review steps without written basis.',
    'Personal preference in compliance handling.',
]
BAD_RISK = [
    'Control gaps left unreported in routine processing.',
    'Exceptions treated as normal without escalation.',
    'Personal preference ahead of risk review.',
]
BAD_VOTE = [
    'Commitments raised without checking the vote book.',
    'Informal instructions treated as budget authority.',
    'Required commitment records skipped before action.',
]
BAD_AUDIT = [
    'Supporting documents left incomplete for review.',
    'Documentation delayed until after implementation.',
    'Convenience ahead of audit-trail requirements.',
]
BAD_DOC = [
    'Action taken without complete file records.',
    'Procedure skipped because the matter looked routine.',
    'Unrecorded review steps under pressure.',
]
BAD_ACC = [
    'Undocumented decisions left to discretion.',
    'Convenience ahead of review accountability.',
    'Unverifiable reasons for control action.',
]
BAD_CTRL = [
    'Untracked exceptions after a control failure.',
    'Convenience ahead of control requirements.',
    'Repeated non-compliance after feedback.',
]
BAD_WORKFLOW = [
    'Workflow checks skipped to save time.',
    'Closure before verification of outputs.',
    'Personal preference in routine case handling.',
]
BAD_FILE = [
    'Incomplete file updates after key actions.',
    'Loose documents without status tracking.',
    'Convenience ahead of records control.',
]
BAD_AUTH = [
    'Action before checking the governing legal power.',
    'Undocumented reliance on informal instructions.',
    'Different standards for similar finance decisions.',
]
BAD_VIRE = [
    'Funds moved without proper authorization.',
    'Personal preference in reallocation decisions.',
    'Transfers made outside the approved vote structure.',
]
BAD_BID = [
    'Arbitrary judgment instead of published criteria.',
    'Convenience ahead of procurement procedure.',
    'Unverified preference for one bid over others.',
]
BAD_ETH = [
    'Collusion, favoritism, or conflict of interest.',
    'Personal preference in procurement choices.',
    'Ignoring the duty of impartial treatment.',
]
BAD_PROC = [
    'Unrecorded shortcuts in monitoring and sanctions.',
    'Convenience ahead of documentation standards.',
    'Personal preference in enforcement steps.',
]


add('ppa_elb_066', 'What does the technical proposal submission for consulting services signify?', 1,
    'It is graded first to confirm competence before financial proposals are opened.',
    ['It guarantees automatic contract award.', 'It is used only for price comparison.', 'It is discarded if the price is too high.'],
    'Technical proposals are evaluated and graded before financial proposals are opened so that only qualified consultants progress to the next stage.',
    ['technical_proposal', 'consulting_services', 'evaluation_stage', 'competence'])
add('ppa_elb_007', 'What must the Accounting Officer ensure regarding contractors who are debarred or blacklisted by the BPP?', 1,
    'They are excluded from all tenders while the sanction remains in force.',
    ['They are still eligible for small contracts.', 'They receive preferential treatment.', 'They are only excluded from works contracts.'],
    'A debarred or blacklisted contractor should not be allowed to participate in public tenders while the sanction is active.',
    ['accounting_officer', 'bpp', 'debarment', 'blacklisting'])
add('ppa_elb_009', 'What is the consequence if a contractor fails to provide the required Performance Bond after contract award?', 0,
    'The contract may be terminated.',
    ['The contract variation must be approved by FEC.', 'Mobilization fee is released immediately.', 'The project is transferred to another MDA.'],
    'Failure to submit the required Performance Bond exposes the government to risk and can lead to termination of the contract.',
    ['performance_bond', 'contract_termination', 'public_procurement'])
add('ppa_elb_017', 'What is the significance of technical proposal submission for consulting services?', 1,
    'It is graded first to confirm competence before financial proposals are opened.',
    ['It is used only for price comparison.', 'It guarantees automatic contract award.', 'It is discarded if the price is too high.'],
    'Technical proposals are assessed before financial proposals so that only technically qualified firms move forward.',
    ['technical_proposal', 'consulting_services', 'technical_competence'])
add('ppa_elb_023', 'What mandatory constraint does contract splitting usually try to circumvent?', 1,
    'The approval thresholds that trigger higher-level procurement authorization.',
    ['Operational training requirements under established controls.', 'Bid security requirements in authorized evaluation.', 'Local-content requirements under due process safeguards.'],
    'Contract splitting is prohibited because it is used to avoid the approval thresholds that would otherwise apply to the procurement.',
    ['contract_splitting', 'approval_thresholds', 'procurement_authorization'])
add('ppa_elb_042', 'Under what condition can an MDA legally pay a consultant using an Advance Payment Guarantee or Performance Bond?', 2,
    'When the payment is made before any contract documentation is prepared.',
    ['When the consultant requests it verbally only.', 'When the payment is needed to avoid bid evaluation.', 'When the relevant safeguards and contract conditions allow it.'],
    'Advance payment for consultancy is permitted only where the contract conditions and the required financial safeguards are satisfied.',
    ['consultant_payment', 'advance_payment_guarantee', 'performance_bond'])
add('ppa_elb_050', 'If an MDA procurement plan requires a major virement for a project, who must approve it?', 1,
    'The authority empowered to approve that level of expenditure, such as the National Assembly where applicable.',
    ['The bidding consultant handling the evaluation.', 'The Minister of Foreign Affairs.', 'The Central Bank of Nigeria.'],
    'A major virement must be approved by the authority legally empowered to approve the relevant level of expenditure.',
    ['virement', 'procurement_plan', 'expenditure_approval'])
add('ppa_elb_055', 'Which bid-evaluation practice best reflects fair procurement procedure?', 1,
    'Apply published criteria consistently to all responsive bids.',
    ['Apply rules inconsistently based on personal preference.', 'Ignore feedback and continue non-compliant procedures.', 'Bypass review and approval controls to save time.'],
    'Fair procurement requires the procuring entity to apply the published evaluation criteria consistently to every responsive bid.',
    ['bid_evaluation', 'published_criteria', 'responsive_bids'])
add('ppa_elb_060', 'What must an Accounting Officer ensure about contractors debarred or blacklisted by the BPP?', 1,
    'They are excluded from all tenders while the sanction remains in force.',
    ['They are excluded only from works contracts.', 'They remain eligible for small contracts.', 'They receive preferential treatment.'],
    'A contractor debarred or blacklisted by the Bureau of Public Procurement should not be allowed to participate in tenders while the sanction remains in force.',
    ['accounting_officer', 'bpp', 'debarment', 'blacklisted_contractors'])
add('ppa_elb_063', 'Which practice best protects procurement ethics in eligibility and consultant selection?', 1,
    'Prevent collusion, favoritism, and conflicts of interest.',
    ['Ignore feedback and continue non-compliant procedures.', 'Apply rules inconsistently based on personal preference.', 'Bypass review and approval controls to save time.'],
    'Procurement ethics are protected when the process actively prevents collusion, favoritism, and conflicts of interest that could compromise fairness.',
    ['procurement_ethics', 'consultant_selection', 'collusion', 'conflict_of_interest'])
add('ppa_elb_064', 'Before making a procurement commitment such as issuing an LPO, which record should be checked to confirm fund availability in the relevant subhead?', 0,
    'The Vote Book (Expenditure Ledger).',
    ['The final audit report.', 'The general ledger.', 'The payment slip register.'],
    'The Vote Book is checked before commitment so the officer can confirm that funds remain available under the relevant subhead.',
    ['lpo', 'vote_book', 'fund_availability', 'subhead'])
add('ppa_elb_065', 'Within government administration, what should happen first to keep eligibility, consultants, and budgeting within open-competition rules?', 0,
    'Use competitive procurement methods except where lawful exceptions apply.',
    ['Close cases without validating facts or demand records.', 'Treat exceptions as routine without documented justification.', 'Rely on informal instructions without documentary evidence.'],
    'Correct procurement practice begins with competitive methods and only departs from them where a lawful exception applies.',
    ['eligibility', 'open_competition', 'competitive_procurement'])
add('ppa_elb_066', 'How should a consulting technical proposal be treated in the evaluation sequence?', 1,
    'It is graded first to confirm competence before financial proposals are opened.',
    ['It guarantees automatic contract award.', 'It is used only for price comparison.', 'It is discarded if the price is too high.'],
    'Technical proposals are evaluated before financial proposals so that only qualified consultants progress to the next stage.',
    ['technical_proposal', 'consulting_services', 'evaluation_stage'])
add('ppa_elb_067', 'Which practice best upholds service integrity in eligibility screening and consultant selection?', 2,
    'Avoid conflicts of interest and disclose relevant constraints.',
    ['Rely on informal instructions without documentary evidence.', 'Close cases without validating facts or keeping proper records.', 'Treat exceptions as routine without documented justification.'],
    'Service integrity in procurement screening depends on avoiding conflicts of interest and disclosing any constraint that could affect impartial judgment.',
    ['service_integrity', 'eligibility_screening', 'consultant_selection'])
add('ppa_elb_068', 'When a desk officer handles eligibility, consultants, and budgeting, what should be done first to preserve contract governance?', 1,
    'Monitor delivery milestones and enforce contract obligations.',
    ['Delay decisions until issues escalate into avoidable crises.', 'Rely on informal instructions without documentary evidence.', 'Close cases without validating facts or demand records.'],
    'Contract governance requires active monitoring of milestones and enforcement of obligations, not passive handling of the file.',
    ['contract_governance', 'delivery_milestones', 'obligation_enforcement'])
add('ppa_elb_069', 'What action best supports regulatory compliance in eligibility, consultants, and budgeting?', 2,
    'Obtain the necessary approvals before award and contract execution.',
    ['Treat exceptions as routine without documented justification.', 'Rely on informal instructions without documentary evidence.', 'Delay decisions until issues escalate into avoidable crises.'],
    'Regulatory compliance is stronger when the required approvals are obtained before award and contract execution rather than after the fact.',
    ['regulatory_compliance', 'approvals', 'contract_execution'])
add('ppa_elb_070', 'For procuring consulting services, which factor should carry the highest weight?', 3,
    'The technical quality, methodology, and key personnel.',
    ['The number of staff employed.', 'The lowest possible fee.', 'The firm’s political connections.'],
    'For consultancy, technical quality, methodology, and key personnel are usually prioritized ahead of price because the service is knowledge-intensive.',
    ['consulting_services', 'technical_quality', 'evaluation_weight'])
add('ppa_elb_071', 'Which action best demonstrates risk management in eligibility, consultants, and budgeting?', 0,
    'Identify control gaps early and escalate material exceptions promptly.',
    ['Apply rules inconsistently based on personal preference.', 'Prioritize convenience over policy and legal requirements.', 'Ignore feedback and continue non-compliant procedures.'],
    'Risk management is stronger when control gaps are identified early, escalated promptly, and tracked for follow-up.',
    ['risk_management', 'material_exceptions', 'escalation'])
add('ppa_elb_073', 'What is the process of verifying a bidder’s technical capacity after bid opening but before contract award called?', 0,
    'Post-qualification audit.',
    ['Pre-qualification.', 'Technical assessment.', 'Financial scrutiny.'],
    'Post-qualification is the review of a bidder’s documentation after bid opening to confirm eligibility and capacity before award.',
    ['post_qualification', 'technical_capacity', 'bid_opening'])
add('ppa_elb_074', 'Which financial condition disqualifies a contractor under Section 16?', 2,
    'In receivership, bankruptcy, or insolvency.',
    ['Being a limited liability company.', 'Having operated for less than one year.', 'Holding a foreign bank account.'],
    'Section 16 excludes contractors that are in receivership, bankruptcy, or insolvency because they cannot reliably execute the contract.',
    ['section_16', 'receivership', 'bankruptcy', 'insolvency'])
add('ppa_elb_075', 'In procurement budgeting, what internal control does the Vote Book primarily support?', 2,
    'Obligation control.',
    ['External auditing.', 'Separation of duties.', 'Budget virement.'],
    'The Vote Book helps officers confirm that commitments stay within the budget and supports obligation control.',
    ['vote_book', 'procurement_budgeting', 'obligation_control'])

add_many([
    ('proc_eligibility_consultants_budgeting_gen_001', 0, 'Which practice best supports governance in eligibility, consultants, and budgeting work?'),
    ('proc_eligibility_consultants_budgeting_gen_019', 0, 'Which action best demonstrates governance discipline in eligibility, consultants, and budgeting work?'),
],
'Apply approved eligibility, consultants, and budgeting procedures and maintain complete records.', BAD_GOV,
'Governance in eligibility, consultants, and budgeting is strongest when officers follow the approved procedure and keep the full record needed for review.',
['procurement_act', 'proc_eligibility_consultants_budgeting', 'governance', 'approved_procedure'])
add_many([
    ('proc_eligibility_consultants_budgeting_gen_003', 0, 'Which practice best supports risk management in eligibility, consultants, and budgeting work?'),
    ('proc_eligibility_consultants_budgeting_gen_021', 0, 'Which action best supports risk management in eligibility, consultants, and budgeting work?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management is stronger when material exceptions are identified early, escalated promptly, and tracked before they become legal or service failures.',
['procurement_act', 'proc_eligibility_consultants_budgeting', 'risk_management', 'material_exceptions'])
add_many([
    ('proc_eligibility_consultants_budgeting_gen_007', 0, 'Which practice best supports procurement ethics in eligibility, consultants, and budgeting work?'),
    ('proc_eligibility_consultants_budgeting_gen_025', 0, 'Which practice best supports procurement ethics in eligibility, consultants, and budgeting governance?'),
],
'Prevent collusion, favoritism, and conflict of interest.', BAD_ETH,
'Procurement ethics are strengthened when collusion, favoritism, and conflict of interest are actively prevented and not tolerated in the process.',
['procurement_act', 'proc_eligibility_consultants_budgeting', 'procurement_ethics', 'integrity'])
add('proc_eligibility_consultants_budgeting_gen_009', 'Which practice best supports documented procedure in eligibility, consultants, and budgeting work?', 0,
    'Follow documented procedure and keep complete records.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'documented_procedure', 'complete_records'])
add('proc_eligibility_consultants_budgeting_gen_011', 'Which action best demonstrates public accountability in eligibility, consultants, and budgeting work?', 0,
    'Provide traceable decisions and evidence-based justification.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'public_accountability', 'traceable_decisions'])
add('proc_eligibility_consultants_budgeting_gen_013', 'Which practice best supports risk control in eligibility, consultants, and budgeting work?', 0,
    'Identify risk early, apply controls, and document mitigation.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'risk_control', 'documented_mitigation'])
add('proc_eligibility_consultants_budgeting_gen_015', 'Which practice best sustains operational discipline in eligibility, consultants, and budgeting work?', 0,
    'Follow approved workflows and verify outputs before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'operational_discipline', 'workflow_checks'])
add('proc_eligibility_consultants_budgeting_gen_017', 'Which practice best supports record management in eligibility, consultants, and budgeting work?', 0,
    'Maintain accurate files and update status at each control point.', BAD_FILE,
    'Record management is stronger when files stay current and each control point is reflected in a status update that later reviewers can verify.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'record_management', 'status_updates'])
add('proc_eligibility_consultants_budgeting_gen_023', 'Which practice best supports bid evaluation in eligibility, consultants, and budgeting work?', 0,
    'Apply published criteria consistently to all responsive bids.', BAD_BID,
    'Sound bid evaluation depends on applying the published criteria consistently to every responsive bid rather than introducing arbitrary judgment.',
    ['procurement_act', 'proc_eligibility_consultants_budgeting', 'bid_evaluation', 'published_criteria'])


data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for question in sub.get('questions', []):
        payload = UPDATES.get(question.get('id'))
        if payload:
            question.update(payload)
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 118 updates to {updated} questions in {TARGET}')


