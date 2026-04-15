#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBS = {'eth_values_integrity','csh_principles_ethics'}
UPDATES = {}

def opts(i, good, bad):
    out = list(bad)
    out.insert(i, good)
    return out

def add(qid, q, i, good, bad, exp, kw):
    UPDATES[qid] = {'question': q, 'options': opts(i, good, bad), 'explanation': exp, 'keywords': kw}

def add_many(specs, good, bad, exp, kw):
    for qid, i, q in specs:
        add(qid, q, i, good, bad, exp, kw)

BAD_RISK = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BAD_DOC = ['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.']
BAD_ACC = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BAD_CTRL = ['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.']
BAD_OPS = ['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.']
BAD_DISC = ['Continued non-compliance after feedback.','Personal preference in discipline handling.','Bypassed review checkpoints.']
BAD_FILE = ['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.']
BAD_GRV = ['Continued non-compliance after feedback.','Personal preference in complaint handling.','Bypassed review checkpoints.']
BAD_PRO = ['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved process requirements.','Bypassed review checkpoints under time pressure.']

add_many([
('csh_principles_ethics_gen_004',0,'Which practice best strengthens risk management in civil service principles and ethics administration?')
], 'Early identification of control gaps with prompt escalation of material exceptions.', BAD_RISK,
'Risk management in civil service principles and ethics improves when control gaps and material exceptions are identified early and escalated promptly.',
['civil_service_principles_ethics','risk_management','control_gaps','exception_escalation'])
add_many([
('csh_principles_ethics_gen_008',0,'Which practice best sustains discipline and conduct in civil service principles and ethics administration?'),
('csh_principles_ethics_gen_026',0,'When conduct problems arise in civil service principles and ethics administration, which response best preserves discipline and fairness?')
], 'Consistent response to misconduct under approved policy.', BAD_DISC,
'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy instead of through arbitrary exceptions.',
['civil_service_principles_ethics','discipline_and_conduct','approved_policy','consistent_response'])
add('csh_principles_ethics_gen_010','Which practice best supports documented procedure in civil service principles and ethics administration?',0,'Complete records under the approved procedure.',BAD_DOC,'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',['civil_service_principles_ethics','documented_procedure','approved_process','complete_records'])
add('csh_principles_ethics_gen_012','Which action best demonstrates public accountability in civil service principles and ethics administration?',0,'Traceable decisions with evidence-based reasons.',BAD_ACC,'Public accountability is stronger when decisions can be traced to recorded reasons and supporting evidence.', ['civil_service_principles_ethics','public_accountability','traceable_decisions','evidence_based_reasons'])
add('csh_principles_ethics_gen_014','Which practice best supports risk control in civil service principles and ethics administration?',0,'Applied controls with documented mitigation.',BAD_CTRL,'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.', ['civil_service_principles_ethics','risk_control','applied_controls','documented_mitigation'])
add('csh_principles_ethics_gen_016','Which practice best sustains operational discipline in civil service principles and ethics administration?',0,'Approved workflow checks before closure.',BAD_OPS,'Operational discipline depends on completing approved workflow checks and verifying outputs before a matter is closed or escalated.', ['civil_service_principles_ethics','operational_discipline','workflow_checks','case_closure'])
add('csh_principles_ethics_gen_018','Which practice best supports record management in civil service principles and ethics administration?',0,'Current files with status updates at each control point.',BAD_FILE,'Record management depends on keeping files current and updating status at each control point so accountability remains reviewable.', ['civil_service_principles_ethics','record_management','current_files','status_updates'])
add('csh_principles_ethics_gen_024','Which practice best supports grievance handling in civil service principles and ethics administration?',0,'Fair complaint review through timely documented steps.',BAD_GRV,'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.', ['civil_service_principles_ethics','grievance_handling','fair_review','documented_steps'])
add_many([
('csh_principles_ethics_gen_027',1,'When a unit handling civil service principles and ethics faces competing priorities, which action best preserves compliance and service quality?'),
('csh_principles_ethics_gen_029',0,'When a supervisor reviews gaps in civil service principles and ethics administration, which option best strengthens control and consistency?')
], 'Approved procedure applied consistently with each material step documented.', BAD_PRO,
'Administrative professionalism is strongest when approved procedure is applied consistently and each material step is documented for later review.',
['civil_service_principles_ethics','administrative_professionalism','approved_procedure','documented_steps'])

add_many([
('eth_values_integrity_gen_003',0,'Which practice best strengthens risk management in civil service values and integrity administration?'),
('eth_values_integrity_gen_039',3,'When a supervisor reviews gaps in civil service values and integrity administration, which step most directly strengthens risk management?')
], 'Early identification of control gaps with prompt escalation of material exceptions.', BAD_RISK,
'Risk management in civil service values and integrity improves when control gaps and material exceptions are identified early and escalated promptly.',
['civil_service_values_integrity','risk_management','control_gaps','exception_escalation'])
add_many([
('eth_values_integrity_gen_007',0,'Which practice best sustains discipline and conduct in civil service values and integrity administration?'),
('eth_values_integrity_gen_036',0,'When conduct problems arise in civil service values and integrity administration, which response best preserves discipline and fairness?'),
('eth_values_integrity_gen_043',0,'In a time-sensitive values-and-integrity file, which step best preserves discipline and conduct without breaking procedure?')
], 'Consistent response to misconduct under approved policy.', BAD_DISC,
'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy instead of through arbitrary exceptions.',
['civil_service_values_integrity','discipline_and_conduct','approved_policy','consistent_response'])
add_many([
('eth_values_integrity_gen_009',0,'Which practice best supports documented procedure in civil service values and integrity administration?'),
('eth_values_integrity_gen_045',1,'A desk officer receives a values-and-integrity file that requires documented procedure. What should be done first?')
], 'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
['civil_service_values_integrity','documented_procedure','approved_process','complete_records'])
add_many([
('eth_values_integrity_gen_011',0,'Which action best demonstrates public accountability in civil service values and integrity administration?'),
('eth_values_integrity_gen_047',3,'When a supervisor reviews compliance gaps in civil service values and integrity administration, which action most directly strengthens public accountability?')
], 'Traceable decisions with evidence-based reasons.', BAD_ACC,
'Public accountability is stronger when decisions can be traced to recorded reasons and supporting evidence.',
['civil_service_values_integrity','public_accountability','traceable_decisions','evidence_based_reasons'])
add('eth_values_integrity_gen_024','Which practice best supports risk control in civil service values and integrity administration?',0,'Applied controls with documented mitigation.',BAD_CTRL,'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.', ['civil_service_values_integrity','risk_control','applied_controls','documented_mitigation'])
add('eth_values_integrity_gen_026','Which practice best sustains operational discipline in civil service values and integrity administration?',0,'Approved workflow checks before closure.',BAD_OPS,'Operational discipline depends on completing approved workflow checks and verifying outputs before a matter is closed or escalated.', ['civil_service_values_integrity','operational_discipline','workflow_checks','case_closure'])
add('eth_values_integrity_gen_028','Which practice best supports record management in civil service values and integrity administration?',0,'Current files with status updates at each control point.',BAD_FILE,'Record management depends on keeping files current and updating status at each control point so accountability remains reviewable.', ['civil_service_values_integrity','record_management','current_files','status_updates'])
add('eth_values_integrity_gen_034','Which practice best supports grievance handling in civil service values and integrity administration?',0,'Fair complaint review through timely documented steps.',BAD_GRV,'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.', ['civil_service_values_integrity','grievance_handling','fair_review','documented_steps'])
add_many([
('eth_values_integrity_gen_048',2,'When a unit handling civil service values and integrity faces competing priorities, which action best preserves compliance and service quality?'),
('eth_values_integrity_gen_050',3,'When a supervisor reviews gaps in civil service values and integrity administration, which option best strengthens control and consistency?')
], 'Approved procedure applied consistently with each material step documented.', BAD_PRO,
'Values-and-integrity administration is strongest when approved procedure is applied consistently and each material step is documented for later review.',
['civil_service_values_integrity','administrative_professionalism','approved_procedure','documented_steps'])

add('csh_principle_011','Why is impartiality vital in the civil service?',1,'Fair and unbiased service to all citizens.',['Priority treatment for personal interests.','Preference for the ruling party agenda.','Reduced accountability through minimal service effort.'],'Impartiality is vital because civil servants are expected to serve all citizens fairly, without political or personal bias.', ['civil_service_principles','impartiality','fair_service','unbiased_treatment'])
add('csh_principle_024','How should public resources be used according to the Civil Service Handbook?',1,'Responsibly and strictly for official purposes.',['For personal benefit where rank permits.','For family and private development projects.','For informal sharing once duties are complete.'],'Public resources must be used responsibly and strictly for official purposes so accountability can be maintained.', ['public_resources','official_purposes','accountability','civil_service_handbook'])
add('csh_principle_048','When does the Fifth Schedule require public officers to declare assets?',1,'On assumption of duty and every four years thereafter.',['Only at retirement.','Annually during the budget cycle.','Only for officers on GL 16 and above.'],'The constitutional asset-declaration regime requires declaration on assumption of office and at the prescribed periodic interval thereafter.', ['asset_declaration','fifth_schedule','assumption_of_duty','periodic_declaration'])
add('csh_principle_057','What is the main duty of federal employees in relation to union activities?',2,'Timely and efficient discharge of duties owed to the Nigerian public.',['Securing favourable postings for union executives.','Reporting directly to the Head of Service on union affairs.','Attending every union meeting regardless of duty demands.'],'Union participation does not remove the employee\'s main duty to discharge official responsibilities to the Nigerian public in a timely and efficient manner.', ['union_activities','public_duty','timely_service','federal_employees'])
add('csh_principle_063','What best defines official duties for government vehicle use?',0,'Activities directly connected to the statutory functions of the agency.',['Any task informally requested by a government official.','Transport for family members of public officials.','Personal errands undertaken while on duty.'],'For government vehicle use, official duties are activities directly connected to the statutory functions and responsibilities of the agency.', ['government_vehicle_use','official_duties','statutory_functions','agency_responsibility'])
add('csh_principle_064','What should a civil servant do after detecting financial abuse in the public service?',0,'Report it through the proper official reporting channel.',['Ignore it because it is not a personal duty.','Wait for a superior to discover it first.','Report it informally to a friend or colleague.'],'Financial abuse should be reported through the proper official channel so it can be investigated and addressed under the right procedure.', ['financial_abuse','official_reporting_channel','public_service','accountability'])
add('csh_principle_067','What is the administration accountable for regarding participation, consultation, and mediation?',2,'Putting effective participation and consultation mechanisms in place.',['Ignoring public opinion in decision-making.','Restricting consultation to government officials only.','Preventing civil society participation.'],'Administrative accountability includes ensuring that effective participation, consultation, and mediation mechanisms exist for public engagement.', ['administrative_accountability','participation','consultation','mediation'])
add('csh_principle_069','After a meeting has closed, what is the secretary expected to secure?',0,'Minutes circulation and completion of agreed follow-up actions.',['Immediate closure of the record without further action.','Transfer of all responsibility to meeting participants.','No further attention once attendance is recorded.'],'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are tracked to completion.', ['secretary_duty','meeting_minutes','follow_up_actions','post_meeting_record'])
add('csh_principle_071','What is the Accountant-General of the Federation chiefly accountable for regarding accounting systems?',3,'Providing adequate accounting systems and controls across government.',['Formulating national economic policy.','Personally managing every public transaction.','Auditing all public accounts personally each year.'],'The Accountant-General is chiefly accountable for ensuring that adequate accounting systems and controls exist across the arms of government.', ['accountant_general','accounting_systems','financial_controls','government_accountability'])
add('csh_principle_072','Does delegating duties to a subordinate relieve the officer of accountability?',2,'No, accountability remains with the delegating officer.',['Yes, once the delegation is in writing.','Yes, where the subordinate accepts the task.','Only where the delegated duty concerns revenue.'],'Delegation may transfer performance of the task, but it does not remove the delegating officer\'s accountability for the result.', ['delegation','accountability','delegating_officer','responsibility'])
add('csh_principle_073','What is the Sub-Accounting Officer accountable for in revenue collection?',2,'Departmental control and collection of revenue.',['Only revenue received in cash.','Delegating the duty entirely to junior staff.','No part of the revenue collection process.'],'The Sub-Accounting Officer remains accountable for departmental control and collection of revenue under the applicable financial regulations.', ['sub_accounting_officer','revenue_collection','departmental_control','financial_regulations'])
add('csh_principle_075','What does delegation not remove from a Revenue Collector?',0,'The officer\'s pecuniary responsibility for the delegated duty.',['The officer\'s obligation to report only after loss occurs.','The officer\'s duty only when delegation is written.','The officer\'s role only where the delegate is also a collector.'],'Delegation does not remove the Revenue Collector\'s pecuniary responsibility for the duty entrusted to another person.', ['revenue_collector','delegation','pecuniary_responsibility','financial_regulations'])

add('ethics_006','What does political neutrality require of a civil servant?',1,'Equal service to any administration regardless of party.',['Open campaigning for political parties.','Refusal to obey lawful orders of the government of the day.','Loss of the right to vote in elections.'],'Political neutrality means serving any lawful administration of the day equally, without partisan bias.', ['political_neutrality','civil_service','equal_service','nonpartisanship'])
add('ethics_085','What is the chief instruction on the use of banking facilities for public funds?',1,'Immediate banking of excess cash with fullest practical use of banking facilities.',['Keeping cash in the office for a week before banking.','Relying on office safes instead of bank accounts.','Using banks only for unusually large transactions.'],'Financial rules require the fullest possible use of banking facilities and prompt payment of excess cash into the appropriate bank account.', ['public_funds','banking_facilities','cash_banking','financial_regulations'])
add('ethics_087','What remains true after an officer delegates duties to a subordinate?',2,'The delegating officer still retains accountability for the duty.',['Accountability passes fully to the subordinate.','Written delegation removes personal responsibility.','Accountability disappears once the duty is accepted.'],'Delegation does not relieve the officer of accountability; the delegating officer still answers for the duty performed on the officer\'s behalf.', ['delegation','accountability','subordinate_officer','financial_regulations'])
add('ethics_089','What is a key duty of the Accountant-General regarding accounting systems and controls?',3,'Ensuring adequate accounting systems and controls across government.',['Formulating national economic policy.','Auditing every public account personally.','Personally executing all government payments.'],'A key duty of the Accountant-General is to ensure that adequate accounting systems and controls operate across government institutions.', ['accountant_general','accounting_systems','internal_controls','government_finance'])
add('ethics_090','What rule best describes the Sub-Accounting Officer\'s role in revenue collection?',3,'Accountability for departmental control and collection of revenue.',['Delegation of the entire duty to junior staff.','Responsibility only for cash physically received.','No formal role in revenue collection.'],'The Sub-Accounting Officer remains accountable for departmental control and collection of revenue under the relevant financial rules.', ['sub_accounting_officer','revenue_collection','departmental_control','financial_rules'])
add('ethics_093','What duty do officers controlling votes owe regarding payment for services rendered?',2,'Ensuring settlement within the financial year in which the service was rendered.',['Transfer of all outstanding claims to suspense accounts.','Routine deferral of payment to the next financial year.','Payment only after every claim is perfectly validated beyond the year.'],'Officers controlling votes are expected to ensure that payments for services rendered are settled within the same financial year whenever due.', ['officers_controlling_votes','services_rendered','financial_year','timely_payment'])
add('ethics_094','What duty do Sub-Accounting Officers owe in relation to receipt and licence books?',3,'Safe custody and proper use of the books.',['Private printing of replacement books when needed.','Immediate disposal after use.','Leaving the books unsecured until required.'],'Sub-Accounting Officers must keep receipt and licence books in safe custody and ensure they are properly used.', ['sub_accounting_officers','receipt_books','licence_books','safe_custody'])
add('ethics_097','What is the implication of the Board of Survey\'s findings for an officer in charge?',1,'The officer remains accountable for any discrepancy disclosed by the findings.',['The findings have no consequence for the officer.','Dismissal follows automatically once a shortage appears.','Accountability ends before the report is considered.'],'The officer in charge remains accountable for discrepancies disclosed by the Board of Survey\'s findings until the matter is satisfactorily resolved.', ['board_of_survey','officer_in_charge','accountability','discrepancies'])
add('ethics_099','What fiscal rule is observed under the Fiscal Responsibility framework?',0,'Total expenditure must not exceed total revenue.',['Total revenue must always exceed expenditure by a fixed margin.','Total revenue is irrelevant to expenditure decisions.','Expenditure may exceed revenue whenever grants are expected.'],'A core fiscal-responsibility rule is that total expenditure should not exceed total revenue.', ['fiscal_responsibility','total_expenditure','total_revenue','fiscal_rule'])
add('ethics_100','What is a key accountability of the Chief Executive of a parastatal to the Board?',2,'Implementation of the decisions and policies of the Board.',['Reporting only to the supervising Minister.','Refusal to implement decisions that are personally disliked.','Management of the Board\'s personal affairs.'],'The Chief Executive is accountable to the Board for implementing its approved decisions and policies.', ['parastatal','chief_executive','board_accountability','policy_implementation'])
add('ethics_103','After a meeting closes, what should the secretary ensure?',3,'Minutes are written, circulated, and follow-up actions are completed.',['The meeting record is ignored once discussion ends.','Responsibility is transferred informally to participants.','No further action is needed after attendance is recorded.'],'After a meeting, the secretary should ensure that the minutes are written and circulated and that agreed follow-up actions are completed.', ['secretary_duty','meeting_minutes','follow_up_actions','administrative_record'])

payload = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in payload.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for q in sub.get('questions', []):
        if q.get('id') in UPDATES:
            q.update(UPDATES[q['id']])
            updated += 1
TARGET.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 101 rewrites to {updated} questions')
