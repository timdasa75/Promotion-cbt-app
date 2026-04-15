#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBS = {'csh_duties_responsibilities', 'csh_performance_training'}
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
BAD_DISC = [
    'Repeated non-compliance after feedback.',
    'Personal preference in discipline handling.',
    'Bypassed review checkpoints.',
]
BAD_FILE = [
    'Personal preference in filing practice.',
    'Bypassed review checkpoints.',
    'Convenience ahead of documentation standards.',
]
BAD_GRV = [
    'Repeated non-compliance after feedback.',
    'Personal preference in complaint handling.',
    'Bypassed review checkpoints.',
]

# Duties & responsibilities generated shell
add_many([
    ('csh_duties_responsibilities_gen_001', 0, 'Which practice best strengthens governance in official duties and responsibilities?'),
    ('csh_duties_responsibilities_gen_019', 0, 'Which action best demonstrates governance discipline in official duties and responsibilities?'),
],
'Approved procedure with complete records.', BAD_DOC,
'Governance in official duties and responsibilities is strongest when officers follow the approved procedure and keep the full record needed for review.',
['duties_responsibilities', 'governance', 'approved_procedure', 'complete_records'])
add('csh_duties_responsibilities_gen_003', 'Which practice best supports risk management in official duties and responsibilities?', 0,
    'Early escalation of material exceptions.', BAD_RISK,
    'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
    ['duties_responsibilities', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('csh_duties_responsibilities_gen_007', 0, 'Which practice best sustains discipline and conduct in official duties and responsibilities?'),
    ('csh_duties_responsibilities_gen_025', 0, 'Which response best preserves discipline and conduct in official duties and responsibilities?'),
],
'Consistent response to misconduct under approved policy.', BAD_DISC,
'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy rather than through arbitrary exceptions.',
['duties_responsibilities', 'discipline_and_conduct', 'approved_policy', 'consistent_response'])
add('csh_duties_responsibilities_gen_009', 'Which practice best supports documented procedure in official duties and responsibilities?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['duties_responsibilities', 'documented_procedure', 'approved_process', 'complete_records'])
add('csh_duties_responsibilities_gen_011', 'Which action best demonstrates public accountability in official duties and responsibilities?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['duties_responsibilities', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('csh_duties_responsibilities_gen_013', 'Which practice best supports risk control in official duties and responsibilities?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['duties_responsibilities', 'risk_control', 'documented_mitigation', 'follow_up'])
add('csh_duties_responsibilities_gen_015', 'Which practice best sustains operational discipline in official duties and responsibilities?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['duties_responsibilities', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('csh_duties_responsibilities_gen_017', 'Which practice best supports record management in official duties and responsibilities?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['duties_responsibilities', 'record_management', 'current_files', 'status_updates'])
add('csh_duties_responsibilities_gen_023', 'Which practice best supports grievance handling in official duties and responsibilities?', 0,
    'Fair complaint review through timely documented steps.', BAD_GRV,
    'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.',
    ['duties_responsibilities', 'grievance_handling', 'fair_review', 'documented_steps'])

# Duties & responsibilities factual tail
add('csh_duty_014', 'What does efficiency in service delivery require from government services?', 1,
    'Meeting public needs effectively while delivering value for money.',
    ['Keeping services highly confidential.', 'Favouring particular regional interests.', 'Delaying services until political approval arrives.'],
    'Efficiency in service delivery is shown when public services meet real needs effectively and do so with proper value for the resources used.',
    ['service_delivery', 'efficiency', 'public_needs', 'value_for_money'])
add('csh_duty_022', 'What does the PSR require of an officer during official working hours?', 1,
    'Full dedication of time to official duties.',
    ['Permission to run a small private business.', 'Half-time commitment with the rest for community service.', 'Freedom to take a second full-time paid job.'],
    'The PSR requires an officer to devote full working time to official duties rather than divide that time with private engagements.',
    ['psr', 'official_working_hours', 'full_time_service', 'official_duties'])
add('csh_duty_023', 'What does delegation of authority improve while still preserving senior accountability?', 1,
    'Efficiency with ultimate responsibility retained by the delegating officer.',
    ['Total transfer of responsibility to junior officers.', 'Secrecy around all delegated decisions.', 'Automatic reversal of decisions after political change.'],
    'Delegation improves efficiency by distributing work, but the senior officer still retains ultimate responsibility for the result.',
    ['delegation_of_authority', 'efficiency', 'ultimate_responsibility', 'civil_service_handbook'])
add('csh_duty_054', 'When an officer who is not a Revenue Collector or Sub-Accounting Officer receives money in the course of duty, what is forbidden?', 1,
    'Delaying the lodgement of the money.',
    ['Supporting the lodgement with a paying-in form.', 'Lodging the money through a Sub-Accounting Officer.', 'Ensuring that an official receipt is issued.'],
    'An officer who receives public money in the course of duty must not delay its lodgement, because delay weakens accountability over public funds.',
    ['public_money', 'lodgement', 'delay', 'financial_accountability'])
add('csh_duty_057', 'What are officers controlling votes expected to secure regarding payment for services rendered?', 2,
    'Settlement within the financial year in which the services were rendered.',
    ['Routine deferral of payments to the next financial year.', 'Payment only after every claim is perfectly validated beyond the year.', 'Transfer of all outstanding claims to suspense accounts.'],
    'Officers controlling votes should ensure that payments for services rendered are settled within the same financial year whenever due.',
    ['votes_control', 'services_rendered', 'financial_year', 'timely_payment'])
add('csh_duty_058', 'What is a key duty of the Chief Executive of a parastatal to the Board?', 3,
    'Implementation of the decisions and policies of the Board.',
    ['Reporting only to the supervising Minister.', 'Refusal to implement decisions that are personally disliked.', 'Management of the Board\'s personal affairs.'],
    'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.',
    ['parastatal', 'chief_executive', 'board_accountability', 'policy_implementation'])
add('csh_duty_062', 'How should deposits held in foreign currency be treated under the rules?', 3,
    'In the same manner as deposits in local currency.',
    ['As the sole duty of the Central Bank of Nigeria.', 'As deposits outside the regulations entirely.', 'By converting them immediately to local currency.'],
    'Foreign-currency deposits are still subject to the same control logic as local-currency deposits unless a specific rule provides otherwise.',
    ['foreign_currency_deposits', 'financial_regulations', 'deposit_control', 'local_currency_treatment'])
add('csh_duty_064', 'What is the implication of the Board of Survey\'s findings for an officer in charge?', 0,
    'The officer remains accountable for discrepancies disclosed by the findings.',
    ['Automatic dismissal if a shortage is found.', 'Immediate discharge of accountability once the finding is made.', 'No consequence at all for the officer.'],
    'The officer in charge remains accountable for discrepancies disclosed by the Board of Survey until the matter is satisfactorily resolved.',
    ['board_of_survey', 'officer_in_charge', 'accountability', 'discrepancies'])
add('csh_duty_068', 'What fiscal rule applies under the Fiscal Responsibility framework?', 2,
    'Total expenditure must not exceed total revenue.',
    ['Total revenue must always exceed expenditure by a fixed margin.', 'Revenue is irrelevant to expenditure decisions.', 'Expenditure may exceed revenue whenever grants are expected.'],
    'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.',
    ['fiscal_responsibility', 'total_expenditure', 'total_revenue', 'fiscal_rule'])
add('csh_duty_070', 'What should a civil servant who has served for a very long time in one ministry avoid doing?', 0,
    'Assuming personal experience alone is enough.',
    ['Sharing institutional knowledge.', 'Giving advice to the Minister.', 'Offering useful suggestions for improvement.'],
    'Long service should not lead an officer to assume experience alone is sufficient, because institutional learning still requires openness and discipline.',
    ['long_service', 'civil_servant', 'institutional_learning', 'professional_attitude'])
add('csh_duty_072', 'What does responsiveness in service delivery mean?', 3,
    'Serving stakeholders within a reasonable timeframe.',
    ['Serving only powerful persons.', 'Serving only those who ask for help directly.', 'Delaying services as long as possible.'],
    'Responsiveness in service delivery means meeting the needs of stakeholders within a reasonable and dependable timeframe.',
    ['service_delivery', 'responsiveness', 'stakeholders', 'reasonable_timeframe'])

# Performance & training generated shell
add_many([
    ('csh_performance_training_gen_001', 0, 'Which practice best strengthens governance in performance and training administration?'),
    ('csh_performance_training_gen_024', 0, 'Which action best demonstrates governance discipline in performance and training administration?'),
    ('csh_performance_training_gen_031', 2, 'A performance-and-training case requires formal governance handling. What should be done first?'),
],
'Approved procedure with complete records.', BAD_DOC,
'Governance in performance and training administration is strongest when officers follow the approved procedure and keep the full record needed for review.',
['performance_training', 'governance', 'approved_procedure', 'complete_records'])
add_many([
    ('csh_performance_training_gen_003', 0, 'Which practice best supports risk management in performance and training administration?'),
    ('csh_performance_training_gen_033', 0, 'When a supervisor reviews gaps in performance and training administration, which step most directly strengthens risk management?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['performance_training', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('csh_performance_training_gen_012', 0, 'Which practice best sustains discipline and conduct in performance and training administration?'),
    ('csh_performance_training_gen_030', 0, 'Which response best preserves discipline and conduct in performance and training administration?'),
],
'Consistent response to misconduct under approved policy.', BAD_DISC,
'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy rather than through arbitrary exceptions.',
['performance_training', 'discipline_and_conduct', 'approved_policy', 'consistent_response'])
add('csh_performance_training_gen_014', 'Which practice best supports documented procedure in performance and training administration?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['performance_training', 'documented_procedure', 'approved_process', 'complete_records'])
add('csh_performance_training_gen_016', 'Which action best demonstrates public accountability in performance and training administration?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['performance_training', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('csh_performance_training_gen_018', 'Which practice best supports risk control in performance and training administration?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['performance_training', 'risk_control', 'documented_mitigation', 'follow_up'])
add('csh_performance_training_gen_020', 'Which practice best sustains operational discipline in performance and training administration?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['performance_training', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('csh_performance_training_gen_022', 'Which practice best supports record management in performance and training administration?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['performance_training', 'record_management', 'current_files', 'status_updates'])
add('csh_performance_training_gen_028', 'Which practice best supports grievance handling in performance and training administration?', 0,
    'Fair complaint review through timely documented steps.', BAD_GRV,
    'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.',
    ['performance_training', 'grievance_handling', 'fair_review', 'documented_steps'])

# Performance & training factual tail
add('csh_pt_008', 'What may happen to an officer\'s increment while the officer is under interdiction or suspension?', 2,
    'It may be withheld or deferred.',
    ['It is automatically doubled.', 'It is normally granted in full.', 'It is paid immediately without review.'],
    'Under the PSR, an officer under interdiction or suspension may have the normal increment withheld or deferred rather than granted automatically.',
    ['increment', 'interdiction', 'suspension', 'psr'])
add('csh_pt_010', 'What is true about restoring a withheld increment?', 1,
    'It cannot be restored retrospectively.',
    ['It can always be restored retrospectively.', 'It must be restored after three months.', 'It is restored only by the Minister of Finance.'],
    'A withheld increment is more serious than a deferred one because it cannot be restored retrospectively.',
    ['withheld_increment', 'retrospective_restoration', 'discipline', 'psr'])
add('csh_pt_048', 'What happens if an officer leaves the Service after taking more proportionate leave than was earned?', 1,
    'Salary for the excess leave days must be refunded.',
    ['All terminal benefits are lost automatically.', 'Only transport and utility allowances are refunded.', 'The excess leave becomes leave without pay automatically.'],
    'Where more proportionate leave was enjoyed than earned, the officer must refund salary for the excess leave days.',
    ['proportionate_leave', 'excess_leave', 'refund', 'psr'])
add('csh_pt_051', 'What is the purpose of a handing-over note?', 2,
    'To detail the projects, files, and responsibilities of a position for the successor.',
    ['To explain why an officer is leaving the Service.', 'To document the personal assets of the outgoing officer.', 'To record all money spent by the outgoing officer.'],
    'A handing-over note helps continuity by setting out the projects, files, and responsibilities that the successor needs to take over properly.',
    ['handing_over_note', 'continuity', 'projects_and_files', 'successor'])
add('csh_pt_061', 'What does interdiction mean in disciplinary procedure?', 2,
    'Temporary removal from normal duties while dismissal proceedings are being pursued.',
    ['A temporary promotion.', 'A form of leave without payment only.', 'A permanent dismissal from service.'],
    'Interdiction is the temporary removal of an officer from normal duties while disciplinary proceedings that may lead to dismissal are under way.',
    ['interdiction', 'disciplinary_procedure', 'temporary_removal', 'dismissal_proceedings'])
add('csh_pt_070', 'What should a civil servant do after detecting financial abuse?', 2,
    'Report it through the proper official channel.',
    ['Report it to a friend or colleague.', 'Wait for a superior to discover it first.', 'Ignore it because it is not a personal duty.'],
    'Financial abuse should be reported through the proper official channel so that it can be investigated and addressed under the right procedure.',
    ['financial_abuse', 'official_reporting_channel', 'civil_servant', 'accountability'])
add('csh_pt_073', 'If a file will be needed again later, what should be done after working on it?', 3,
    'Place it on a bring-up system for the later date and return it through registry channels.',
    ['Keep it in a desk drawer for future reference.', 'Pass it to a colleague without recording the handoff.', 'Dispose of it if it is not needed immediately.'],
    'A file needed again later should be placed on a bring-up system and routed properly through registry channels so later follow-up is controlled.',
    ['file_management', 'bring_up_system', 'registry_channels', 'follow_up'])
add('csh_pt_074', 'What information should a handing-over note contain?', 0,
    'The projects, files, and responsibilities that the successor will inherit.',
    ['All money spent by the outgoing officer.', 'The reasons the officer is leaving the Service.', 'The personal assets of the outgoing officer.'],
    'A handing-over note should set out the projects, files, and responsibilities that will pass to the successor so work can continue without confusion.',
    ['handing_over_note', 'successor', 'projects_files_responsibilities', 'continuity'])


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
print(f'Applied round 107 rewrites to {updated} questions')
