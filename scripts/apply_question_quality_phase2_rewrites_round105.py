#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'
SUBS = {'ca_international_affairs', 'ca_public_service_reforms'}
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
BAD_COMM = [
    'Unverified rumours treated as confirmed facts.',
    'Personal preference in source selection.',
    'Bypassed source checks under pressure.',
]
BAD_GOV = [
    'Untracked policy changes with public impact.',
    'Personal preference in update handling.',
    'Bypassed verification of official announcements.',
]
BAD_PRO = [
    'Discretionary shortcuts under pressure.',
    'Convenience ahead of approved process.',
    'Bypassed review checkpoints.',
]

# International affairs generated shell
add_many([
    ('ca_international_affairs_gen_001', 0, 'Which practice best strengthens governance in international and regional affairs work?'),
    ('ca_international_affairs_gen_027', 0, 'Which action best demonstrates governance discipline in international and regional affairs work?'),
    ('ca_international_affairs_gen_034', 2, 'An international-affairs case requires formal governance handling. What should be done first?'),
],
'Approved procedure with complete records.', BAD_DOC,
'Governance in international and regional affairs work is strongest when officers follow the approved procedure and keep the full record needed for review.',
['international_affairs', 'governance', 'approved_procedure', 'complete_records'])
add_many([
    ('ca_international_affairs_gen_003', 0, 'Which practice best supports risk management in international and regional affairs work?'),
    ('ca_international_affairs_gen_036', 0, 'When a supervisor reviews gaps in international and regional affairs work, which step most directly strengthens risk management?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['international_affairs', 'risk_management', 'material_exceptions', 'escalation'])
add('ca_international_affairs_gen_017', 'Which practice best supports documented procedure in international and regional affairs work?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['international_affairs', 'documented_procedure', 'approved_process', 'complete_records'])
add('ca_international_affairs_gen_019', 'Which action best demonstrates public accountability in international and regional affairs work?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['international_affairs', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('ca_international_affairs_gen_021', 'Which practice best supports risk control in international and regional affairs work?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['international_affairs', 'risk_control', 'documented_mitigation', 'follow_up'])
add('ca_international_affairs_gen_023', 'Which practice best sustains operational discipline in international and regional affairs work?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['international_affairs', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('ca_international_affairs_gen_025', 'Which practice best supports record management in international and regional affairs work?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['international_affairs', 'record_management', 'current_files', 'status_updates'])
add('ca_international_affairs_gen_031', 'Which practice best supports governance updates in international and regional affairs work?', 0,
    'Tracked policy changes with clear service implications.', BAD_GOV,
    'Governance updates are handled well when policy changes are tracked and their implications for public service are recorded clearly.',
    ['international_affairs', 'governance_updates', 'policy_changes', 'service_implications'])
add_many([
    ('ca_international_affairs_gen_007', 0, 'Which practice best supports public-communication literacy in international and regional affairs work?'),
    ('ca_international_affairs_gen_033', 0, 'Which routine best sustains public-communication literacy in international and regional affairs work?'),
    ('ca_international_affairs_gen_040', 0, 'In a time-sensitive international-affairs file, which step best preserves public-communication literacy without breaking procedure?'),
],
'Verified updates separated from rumours and misinformation.', BAD_COMM,
'Public-communication literacy is strongest when verified updates are clearly separated from rumours and unsupported claims before conclusions are shared.',
['international_affairs', 'public_communication_literacy', 'verified_updates', 'misinformation_control'])
add_many([
    ('ca_international_affairs_gen_042', 1, 'When an international-affairs unit faces competing priorities, which action best preserves compliance and service quality?'),
    ('ca_international_affairs_gen_044', 3, 'When a supervisor reviews gaps in international and regional affairs work, which option best strengthens control and consistency?'),
],
'Credible official sources checked before conclusions are drawn.', BAD_PRO,
'Control and civic reliability are strongest when officers rely on credible official sources and confirm facts before drawing or sharing conclusions.',
['international_affairs', 'official_sources', 'fact_confirmation', 'civic_reliability'])

# Public service reforms generated shell
add_many([
    ('ca_public_service_reforms_gen_010', 0, 'Which practice best supports documented procedure in public-service reform work?'),
],
'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure in public-service reform work depends on following the approved process and keeping complete records of the steps taken.',
['public_service_reforms', 'documented_procedure', 'approved_process', 'complete_records'])
add('ca_public_service_reforms_gen_012', 'Which action best demonstrates public accountability in public-service reform work?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['public_service_reforms', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('ca_public_service_reforms_gen_014', 'Which practice best supports risk control in public-service reform work?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['public_service_reforms', 'risk_control', 'documented_mitigation', 'follow_up'])
add('ca_public_service_reforms_gen_016', 'Which practice best sustains operational discipline in public-service reform work?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['public_service_reforms', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('ca_public_service_reforms_gen_018', 'Which practice best supports record management in public-service reform work?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['public_service_reforms', 'record_management', 'current_files', 'status_updates'])
add('ca_public_service_reforms_gen_024', 'Which practice best supports governance updates in public-service reform work?', 0,
    'Tracked policy changes with clear service implications.', BAD_GOV,
    'Governance updates are handled well when policy changes are tracked and their implications for public service are recorded clearly.',
    ['public_service_reforms', 'governance_updates', 'policy_changes', 'service_implications'])
add_many([
    ('ca_public_service_reforms_gen_004', 0, 'Which practice best supports risk management in public-service reform work?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['public_service_reforms', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('ca_public_service_reforms_gen_008', 0, 'Which practice best supports public-communication literacy in public-service reform work?'),
    ('ca_public_service_reforms_gen_026', 0, 'Which routine best sustains public-communication literacy in public-service reform work?'),
],
'Verified updates separated from rumours and misinformation.', BAD_COMM,
'Public-communication literacy is strongest when verified updates are clearly separated from rumours and unsupported claims before conclusions are shared.',
['public_service_reforms', 'public_communication_literacy', 'verified_updates', 'misinformation_control'])
add_many([
    ('ca_public_service_reforms_gen_027', 1, 'When a public-service reform unit faces competing priorities, which action best preserves compliance and service quality?'),
    ('ca_public_service_reforms_gen_029', 3, 'When a supervisor reviews gaps in public-service reform work, which option best strengthens control and consistency?'),
    ('ca_public_service_reforms_gen_030', 2, 'A compliance reviewer handling public-service reform work must choose the first sound step. What is it?'),
],
'Credible official sources checked before conclusions are drawn.', BAD_PRO,
'Control and civic reliability are strongest when officers rely on credible official sources and confirm facts before drawing or sharing conclusions.',
['public_service_reforms', 'official_sources', 'fact_confirmation', 'civic_reliability'])

# International affairs factual tail
add('IRA_106', 'What benefit applies when a Foreign Service officer is injured on official duty and becomes incapacitated?', 0,
    'Full emolument until discharge from sick leave or permanent invalidation.',
    ['Promotion under ordinary service procedure.', 'Immediate dismissal from service.', 'Pension payment only under routine rules.'],
    'Where a Foreign Service officer is incapacitated by an injury sustained on official duty, full emolument continues until discharge from sick leave or permanent invalidation.',
    ['foreign_service', 'official_duty_injury', 'full_emolument', 'incapacitation'])
add('IRA_107', 'When an officer is on official assignment outside Nigeria, when is the spouse entitled to free air passage?', 0,
    'When the assignment lasts at least nine months.',
    ['Regardless of duration.', 'At half fare only.', 'Not at all.'],
    'The spouse is entitled to free air passage only where the officer\'s official duty outside Nigeria is for a period not less than nine months.',
    ['foreign_service', 'spouse_passage', 'official_assignment', 'nine_months'])
add('IRA_134', 'What compensation applies when a Foreign Service officer is injured on official duty and later discharged from sick leave or permanently invalided?', 0,
    'Full emolument until discharge or permanent invalidation.',
    ['Half salary under routine administrative practice.', 'Immediate dismissal from service.', 'Pension payment only.'],
    'Where the officer is incapacitated by injury sustained on official duty, full emolument continues until discharge from sick leave or permanent invalidation.',
    ['foreign_service', 'official_duty_injury', 'full_emolument', 'permanent_invalidation'])
add('IRA_141', 'What follows if an officer fails to submit representations on unsatisfactory conduct within the specified time?', 1,
    'Appropriate sanction may be invoked against the officer.',
    ['Late representations are automatically accepted.', 'The officer is transferred automatically.', 'The officer is promoted after the deadline.'],
    'Failure to submit representations within the time allowed may be taken as a decision not to respond, so the appropriate sanction may then be invoked.',
    ['unsatisfactory_conduct', 'representations', 'time_limit', 'appropriate_sanction'])
add('IRA_155', 'What should be done if a receipt or licence book is discovered to be missing?', 0,
    'Report the circumstances immediately to the Accountant-General and the Auditor-General.',
    ['Ignore the loss if the book is old.', 'Inform only the Head of Department.', 'Order a replacement without reporting the loss.'],
    'A missing receipt or licence book must be reported immediately to the Accountant-General and the Auditor-General because it affects official accountability over revenue instruments.',
    ['receipt_book', 'licence_book', 'missing_book', 'official_reporting'])
add('IRA_160', 'What happens if a Foreign Service officer\'s marriage to a foreigner is judged not to be in the interest of the Service?', 1,
    'The officer must leave the Foreign Service or return to the Home Service.',
    ['The officer is placed on probation only.', 'The spouse is denied entry to Nigeria.', 'The officer is demoted automatically.'],
    'Where such a marriage is judged not to be in the interest of the Service, the officer must either leave the Foreign Service or return to the Home Service.',
    ['foreign_service', 'marriage_to_foreigner', 'home_service', 'service_interest'])
add('IRA_162', 'Within what period must a Sub-Accounting Officer pay unclaimed salaries, allowances, and pensions into the Treasury?', 3,
    'Within seven days.',
    ['Immediately on withdrawal.', 'At the end of the financial year.', 'Within thirty days.'],
    'Unclaimed salaries, allowances, and pensions should be paid into the Treasury within seven days by the responsible Sub-Accounting Officer.',
    ['sub_accounting_officer', 'unclaimed_salaries', 'treasury', 'seven_days'])
add('IRA_173', 'Who is a Revenue Collector in official practice?', 0,
    'An officer entrusted with an official receipt, licence, or ticket booklet who keeps a cash book.',
    ['An officer who deals only with large sums of money.', 'Any Sub-Accounting Officer by default.', 'An officer who approves revenue expenditure.'],
    'A Revenue Collector is an officer entrusted with the relevant official booklet for regular revenue collection and who maintains the required cash book.',
    ['revenue_collector', 'official_receipt_book', 'cash_book', 'revenue_collection'])

# Public service reforms factual tail
add('PSIR_078', 'When may an officer on leave be recalled by the Permanent Secretary or Head of Extra-Ministerial Office?', 1,
    'When the officer is required to return before the authorized leave expires.',
    ['Only on weekends.', 'Only if the officer is abroad.', 'Only for officers on GL 07 and above.'],
    'An officer may be recalled when official need requires return before the authorized leave expires.',
    ['leave_recall', 'permanent_secretary', 'authorized_leave', 'official_need'])
add('PSIR_081', 'When should promotion arrears be paid after an officer is promoted?', 1,
    'Within the year in which the promotion takes effect.',
    ['After six months only.', 'On retirement.', 'Immediately the letter is issued in every case.'],
    'Promotion arrears should be paid within the year in which the promotion is effected.',
    ['promotion_arrears', 'payment_timing', 'promotion', 'psr'])
add('PSIR_085', 'Who must countersign the Certificate of Service issued to an officer on GL 07 and above?', 1,
    'The officer\'s Permanent Secretary and the Permanent Secretary, Federal Civil Service Commission.',
    ['The Minister only.', 'The Director of HRM only.', 'The Accountant-General only.'],
    'For senior posts, the Certificate of Service is countersigned by the officer\'s Permanent Secretary and the Permanent Secretary of the Federal Civil Service Commission.',
    ['certificate_of_service', 'countersignature', 'gl07', 'fcsc'])
add('PSIR_094', 'What compensation applies where an officer is injured on official duty and becomes entitled to discharge from sick leave or permanent invalidation?', 0,
    'Full emolument until discharge.',
    ['Half salary under routine practice.', 'Immediate dismissal.', 'Transfer to desk duty only.'],
    'Where an officer is incapacitated by injury sustained on official duty, full emolument continues until discharge from sick leave or permanent invalidation.',
    ['official_duty_injury', 'full_emolument', 'incapacitation', 'psr'])
add('PSIR_096', 'What follows if an officer fails to submit representations on unsatisfactory conduct within the allowed time?', 0,
    'Appropriate sanction may be invoked against the officer.',
    ['Late representations are automatically accepted.', 'The officer is promoted despite the default.', 'The officer is transferred automatically.'],
    'Failure to submit representations within the time allowed may lead to the invocation of the appropriate sanction.',
    ['unsatisfactory_conduct', 'representations', 'time_limit', 'appropriate_sanction'])
add('PSIR_098', 'What qualification range applies to Interns and Volunteers?', 1,
    'SSCE or equivalent up to University Degree or HND.',
    ['Primary school certificate only.', 'Master\'s degree only.', 'Specialized professional certification only.'],
    'Interns and Volunteers are expected to possess qualifications ranging from SSCE or equivalent up to University Degree or HND.',
    ['interns', 'volunteers', 'qualification_standard', 'ssce'])
add('PSIR_099', 'What is the minimum service required for an officer to qualify for annual leave in a year?', 1,
    'Not less than six months of previous service in a leave-earning year.',
    ['Less than six months of service.', 'One month of service.', 'Twelve months in every case.'],
    'Annual leave is earned where the officer has not less than six months of previous service within a leave-earning year.',
    ['annual_leave', 'minimum_service', 'six_months', 'leave_earning_year'])
add('PSIR_101', 'After an officer passes the compulsory confirmation examination, what is the next step toward confirmation?', 1,
    'The Permanent Secretary reviews performance and recommends confirmation.',
    ['A special bonus is awarded automatically.', 'The officer is confirmed automatically.', 'The officer is promoted immediately.'],
    'Passing the examination does not by itself complete confirmation; the Permanent Secretary must review performance and recommend confirmation.',
    ['confirmation_examination', 'permanent_secretary', 'recommendation', 'confirmation'])
add('PSIR_103', 'What is the main objective of a Value-for-Money audit by the Auditor-General?', 1,
    'To assess economy, efficiency, and effectiveness in government projects.',
    ['To prevent pilferage and extravagance only.', 'To certify that accounts are faithfully kept only.', 'To confirm that expenditure matched appropriation only.'],
    'A Value-for-Money audit focuses on whether government projects achieve economy, efficiency, and effectiveness.',
    ['value_for_money_audit', 'economy', 'efficiency', 'effectiveness'])
add('PSIR_105', 'What happens to labour-union executives at the expiration of their tenure in office?', 1,
    'They must not be posted out of their MDAs.',
    ['They are immediately redeployed.', 'They are automatically promoted.', 'They are offered a new contract.'],
    'At the expiration of their tenure, labour-union executives must not be posted out of their MDAs merely because they held union office.',
    ['labour_union', 'tenure_expiration', 'posting', 'mda'])
add('PSIR_125', 'When does authority for recurrent expenditure conveyed by warrants lapse?', 1,
    'At the end of the financial year to which it relates.',
    ['When the funds are fully expended.', 'At the end of the calendar year.', 'After three months.'],
    'Authority for recurrent expenditure conveyed by warrant lapses at the end of the financial year for which the warrant was issued.',
    ['recurrent_expenditure', 'warrants', 'financial_year', 'lapse'])


data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for q in sub.get('questions', []):
        qid = q.get('id')
        if qid in UPDATES:
            q.update(UPDATES[qid])
            updated += 1

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 105 rewrites to {updated} questions')
