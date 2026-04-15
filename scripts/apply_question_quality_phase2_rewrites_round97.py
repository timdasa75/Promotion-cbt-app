#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBS = {'eth_general', 'eth_code_conduct'}
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

add_many([
('eth_general_gen_007',0,'Which practice best sustains discipline and conduct in general ethics?'),
('eth_general_gen_025',0,'Which practice best sustains discipline and conduct standards in general ethics administration?'),
('eth_general_gen_043',0,'Which practice best supports conduct standards in general ethics administration?'),
('eth_general_gen_054',2,'In a time-sensitive general-ethics file, which step best preserves discipline and conduct without breaking procedure?'),
('eth_general_gen_072',1,'A desk officer receives a general-ethics case that requires discipline and conduct action. What should be done first?')],
'Consistent response to misconduct under approved policy.',
['Continued non-compliance after feedback.','Personal preference in discipline handling.','Bypassed review checkpoints.'],
'Discipline and conduct in general ethics are sustained when misconduct is addressed consistently under approved policy rather than through arbitrary exceptions.',
['general_ethics','discipline_and_conduct','approved_policy','consistent_response'])
add_many([
('eth_general_gen_009',0,'Which practice best supports documented procedure in general ethics?'),
('eth_general_gen_027',0,'Which practice best secures procedural documentation in general ethics administration?'),
('eth_general_gen_056',1,'A desk officer receives a general-ethics case that requires documented procedure. What should be done first?')],
'Complete records under the approved procedure.',
['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.'],
'Documented procedure in general ethics depends on following the approved process and keeping complete records of the action taken.',
['general_ethics','documented_procedure','approved_process','complete_records'])
add_many([
('eth_general_gen_011',0,'Which action best demonstrates public accountability in general ethics?'),
('eth_general_gen_047',0,'Which practice best strengthens public accountability in general ethics administration?'),
('eth_general_gen_058',2,'When a supervisor reviews compliance gaps in general ethics administration, which action most directly strengthens public accountability?')],
'Traceable decisions with evidence-based reasons.',
['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.'],
'Public accountability in general ethics depends on decisions that can be traced to recorded reasons and supporting evidence.',
['general_ethics','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
('eth_general_gen_013',0,'Which practice best supports risk control in general ethics?'),
('eth_general_gen_031',0,'Which action best demonstrates active risk control in general ethics administration?'),
('eth_general_gen_060',3,'Which practice best supports risk control under general-ethics accountability arrangements?')],
'Applied controls with documented mitigation.',
['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.'],
'Risk control in general ethics is stronger when identified risks are matched with applied controls and documented mitigation.',
['general_ethics','risk_control','documented_mitigation','applied_controls'])
add_many([
('eth_general_gen_015',0,'Which practice best sustains operational discipline in general ethics?'),
('eth_general_gen_033',0,'Which practice best supports workflow discipline in general ethics administration?'),
('eth_general_gen_062',3,'In a time-sensitive general-ethics file, which step best preserves operational discipline without breaking procedure?')],
'Approved workflow checks before closure.',
['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.'],
'Operational discipline in general ethics depends on completing approved workflow checks before a case is closed or advanced.',
['general_ethics','operational_discipline','workflow_checks','case_closure'])
add_many([
('eth_general_gen_017',0,'Which practice best supports record management in general ethics administration?'),
('eth_general_gen_035',0,'Which routine best sustains records in general ethics administration?'),
('eth_general_gen_064',0,'A desk officer receives a general-ethics case that requires record management. What should be done first?')],
'Current files with status updates at each control point.',
['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.'],
'Record management in general ethics administration depends on keeping files current and updating status at each control point for later review.',
['general_ethics','record_management','current_files','status_updates'])
add_many([
('eth_general_gen_019',0,'Which practice best reflects governance standards in general ethics administration?'),
('eth_general_gen_048',0,'A desk officer receives a general-ethics case that requires governance action. What should be done first?'),
('eth_general_gen_066',3,'When a supervisor reviews compliance gaps in general ethics administration, which action most directly strengthens governance?')],
'Approved ethics procedure with complete records.',
['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.'],
'Governance in general ethics is strengthened when the approved procedure is followed and the complete record needed for oversight is maintained.',
['general_ethics','governance','approved_procedure','complete_records'])
add_many([
('eth_general_gen_023',0,'Which practice best supports grievance handling in general ethics administration?'),
('eth_general_gen_041',0,'Which action best demonstrates grievance review in general ethics administration?'),
('eth_general_gen_070',3,'In a time-sensitive general-ethics file, which step best preserves grievance handling without breaking procedure?')],
'Fair complaint review through timely documented steps.',
['Continued non-compliance after feedback.','Personal preference in complaint handling.','Bypassed review checkpoints.'],
'Grievance handling in general ethics remains defensible when complaints are reviewed through fair, timely, and documented steps.',
['general_ethics','grievance_handling','fair_review','documented_steps'])
add_many([
('eth_general_gen_039',0,'Which practice best reflects general-ethics risk-management standards?'),
('eth_general_gen_050',2,'When a supervisor reviews compliance gaps in general ethics administration, which step most directly strengthens risk management?')],
'Early escalation of control gaps and material exceptions.',
['Continued non-compliance after feedback.','Personal preference in rule use.','Bypassed review checkpoints.'],
'General-ethics risk management improves when control gaps and material exceptions are identified early and escalated promptly.',
['general_ethics','risk_management','control_gaps','exception_escalation'])
add('eth_general_gen_037','Which governance practice most strengthens ethical standards across a public institution?',0,'Clear reporting channels with periodic review and documented follow-up.',['Unsupervised departmental ethics controls.','Unrecorded minor breaches.','Awareness notices without oversight.'],'Institutional ethical standards are strongest when reporting channels are clear, reviews are periodic, and breaches receive documented follow-up.',['general_ethics','institutional_ethics','reporting_channels','documented_follow_up'])
add('eth_general_gen_075','When should a schedule officer draft a reply to an item of correspondence?',2,'Whenever the correspondence requires a reply.',['Never; drafting replies belongs entirely to the secretariat.','Only for complex issues.','Only on specific instruction from a superior.'],'A schedule officer prepares a draft reply whenever the item of correspondence allocated to the officer requires a reply.',['official_correspondence','draft_reply','schedule_officer','administrative_procedure'])
add('eth_general_gen_076','What should every official letter contain?',3,'A subject heading, reference number, and date.',['A humorous opening.','A complete history of earlier correspondence.','A personal salutation only.'],'Every official letter should carry a heading that states the subject briefly together with a reference number and date for identification and record-keeping.',['official_letters','subject_heading','reference_number','date'])
add('eth_general_gen_078','Who should prepare a draft reply when official correspondence requires one?',3,'The schedule officer to whom the correspondence is allocated.',['Only the supervising director.','The secretariat regardless of allocation.','Any registry clerk on duty.'],'Where official correspondence demands a reply, the schedule officer to whom it is allocated is responsible for preparing the draft reply.',['official_correspondence','schedule_officer','draft_reply','allocation'])
add('eth_general_gen_084','How does the attendance register distinguish between staff who arrive on time and those who are late?',3,'A red line is drawn and late arrivals sign below it.',['Everyone signs in the same place without distinction.','A supervisor marks late names separately after closing time.','Late arrivals sign on a different sheet.'],'The attendance register is marked with a red line each morning so that late arrivals sign below it and punctual staff sign above it.',['attendance_register','late_arrivals','red_line','timekeeping'])
add_many([
('eth_code_conduct_gen_007',0,'Which practice best sustains discipline and conduct under the Code of Conduct?'),
('eth_code_conduct_gen_025',0,'Which practice best sustains discipline and conduct standards under the Code of Conduct?'),
('eth_code_conduct_gen_040',0,'In a time-sensitive Code-of-Conduct file, which step best preserves discipline and conduct without breaking procedure?'),
('eth_code_conduct_gen_058',3,'A desk officer receives a Code-of-Conduct case that requires discipline and conduct action. What should be done first?')],
'Consistent response to misconduct under approved policy.',
['Continued non-compliance after feedback.','Personal preference in discipline handling.','Bypassed review checkpoints.'],
'Discipline and conduct under the Code of Conduct are sustained when misconduct is addressed consistently under approved policy.',['code_of_conduct','discipline_and_conduct','approved_policy','consistent_response'])
add_many([
('eth_code_conduct_gen_009',0,'Which practice best supports documented procedure under the Code of Conduct?'),
('eth_code_conduct_gen_027',0,'Which practice best secures procedural documentation under the Code of Conduct?'),
('eth_code_conduct_gen_042',1,'A desk officer receives a Code-of-Conduct case that requires documented procedure. What should be done first?'),
('eth_code_conduct_gen_077',3,'Which practice best reflects proper documented procedure under the Code of Conduct?')],
'Complete records under the approved procedure.',
['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.'],
'Documented procedure under the Code of Conduct depends on following the approved process and keeping complete records of the steps taken.',['code_of_conduct','documented_procedure','approved_process','complete_records'])
add_many([
('eth_code_conduct_gen_011',0,'Which action best demonstrates public accountability under the Code of Conduct?'),
('eth_code_conduct_gen_044',2,'When a supervisor reviews compliance gaps under the Code of Conduct, which action most directly strengthens public accountability?'),
('eth_code_conduct_gen_073',1,'In a Code-of-Conduct case file, which step best preserves grievance handling while keeping an auditable record?')],
'Traceable decisions with evidence-based reasons.',
['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.'],
'Public accountability under the Code of Conduct depends on decisions that can be traced to recorded reasons and supporting evidence.',['code_of_conduct','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
('eth_code_conduct_gen_013',0,'Which practice best supports risk control under the Code of Conduct?'),
('eth_code_conduct_gen_031',0,'Which action best demonstrates active risk control under the Code of Conduct?'),
('eth_code_conduct_gen_046',0,'Which practice best supports risk control under Code-of-Conduct accountability arrangements?')],
'Applied controls with documented mitigation.',
['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.'],
'Risk control under the Code of Conduct is stronger when identified risks are matched with applied controls and documented mitigation.',['code_of_conduct','risk_control','documented_mitigation','applied_controls'])
add_many([
('eth_code_conduct_gen_015',0,'Which practice best sustains operational discipline under the Code of Conduct?'),
('eth_code_conduct_gen_033',0,'Which practice best supports workflow discipline under the Code of Conduct?'),
('eth_code_conduct_gen_048',1,'In a time-sensitive Code-of-Conduct file, which step best preserves operational discipline without breaking procedure?')],
'Approved workflow checks before closure.',
['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.'],
'Operational discipline under the Code of Conduct depends on completing approved workflow checks before a case is closed or advanced.',['code_of_conduct','operational_discipline','workflow_checks','case_closure'])
add_many([
('eth_code_conduct_gen_017',0,'Which practice best supports record management under the Code of Conduct?'),
('eth_code_conduct_gen_050',2,'A desk officer receives a Code-of-Conduct case that requires record management. What should be done first?')],
'Current files with status updates at each control point.',
['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.'],
'Record management under the Code of Conduct depends on keeping files current and updating status at each control point for later review.',['code_of_conduct','record_management','current_files','status_updates'])
add_many([
('eth_code_conduct_gen_023',0,'Which practice best supports grievance handling under the Code of Conduct?'),
('eth_code_conduct_gen_056',2,'In a time-sensitive Code-of-Conduct file, which step best preserves grievance handling without breaking procedure?')],
'Fair complaint review through timely documented steps.',
['Continued non-compliance after feedback.','Personal preference in complaint handling.','Bypassed review checkpoints.'],
'Grievance handling under the Code of Conduct remains defensible when complaints are reviewed through fair, timely, and documented steps.',['code_of_conduct','grievance_handling','fair_review','documented_steps'])
add_many([
('eth_code_conduct_gen_003',0,'Which practice best supports risk management under the Code of Conduct?'),
('eth_code_conduct_gen_036',1,'When a supervisor reviews compliance gaps under the Code of Conduct, which step most directly strengthens risk management?')],
'Early escalation of control gaps and material exceptions.',
['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.'],
'Risk management under the Code of Conduct is stronger when control gaps and material exceptions are identified early and escalated promptly.',['code_of_conduct','risk_management','control_gaps','exception_escalation'])
add('eth_code_conduct_gen_059','When a Code-of-Conduct unit faces competing priorities, which action best preserves compliance and service quality?',3,'Approved procedure applied consistently with each material step documented.',['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved process.','Bypassed review checkpoints under time pressure.'],'Compliance and service quality are preserved when the unit applies the approved procedure consistently and documents each material step instead of relying on shortcuts.',['code_of_conduct','compliance_and_service_quality','approved_procedure','documented_steps'])
add('eth_code_conduct_gen_061','When a supervisor reviews gaps under the Code of Conduct, which option best strengthens control and consistency?',0,'Approved procedure applied consistently with each material step documented.',['Convenience ahead of approved process.','Inconsistent criteria across similar cases.','Bypassed review checkpoints under time pressure.'],'Control and consistency improve when the unit applies the approved procedure consistently and documents each material step for later review.',['code_of_conduct','control_and_consistency','approved_procedure','documented_steps'])
add('eth_code_conduct_gen_063','Are Foreign Service Officers allowed to accept gifts or presentations for services rendered?',0,'No, they may not accept such gifts or presentations from any person.',['Yes, if the gift is declared to the ministry.','Yes, but only from diplomatic counterparts.','Yes, if the value is minimal.'],'Foreign Service Officers are not allowed to accept gifts or presentations from any person for services rendered or to be rendered.',['foreign_service','gifts','services_rendered','code_of_conduct'])
add('eth_code_conduct_gen_066',"What action should be taken if an officer changes the date of birth recorded on appointment without due authority?",0,'It should be treated as serious misconduct.',['It should lead automatically to termination.','It should lead automatically to suspension.','It should be ignored.'],'Changing the date of birth recorded on appointment without due authority is treated as serious misconduct under the applicable rule.',['date_of_birth','serious_misconduct','appointment_record','code_of_conduct'])
add('eth_code_conduct_gen_070','What is the role of the Accounting Officer in a vehicle-accident investigation?',1,'Ensuring reports, investigation, and disciplinary follow-up are completed.',['Directly investigating the accident personally.','Paying for all damages personally.','Concealing the accident from review.'],'The Accounting Officer is responsible for ensuring that the necessary reports are obtained, the investigation is conducted, and any disciplinary follow-up is taken.',['accounting_officer','vehicle_accident','investigation','disciplinary_follow_up'])
add('eth_code_conduct_gen_079','When an imprest issued by a Sub-Accounting Officer is retired at another station, what must the issuing officer verify?',3,'That the receipt voucher particulars are correct.',['That the Minister of Finance has been informed.','That a fresh audit has already been completed.','That a new cash advance has been issued.'],'Where an imprest is retired at another station, the issuing Sub-Accounting Officer remains responsible for verifying the receipt voucher particulars before accepting the retirement.',['imprest','sub_accounting_officer','receipt_voucher','retirement'])
add('eth_code_conduct_gen_087','When competing priorities arise in Code-of-Conduct administration, which action best preserves compliance assurance?',1,'Approved procedure applied consistently with each material step documented.',['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved workflow.','Bypassed review checkpoints under time pressure.'],'Compliance assurance in Code-of-Conduct administration is preserved when the approved procedure is applied consistently and each material step is documented.',['code_of_conduct','compliance_assurance','approved_procedure','documented_steps'])

data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in data.get('subcategories', []):
    if sub.get('id') not in SUBS:
        continue
    for q in sub.get('questions', []):
        if q.get('id') in UPDATES:
            q.update(UPDATES[q['id']])
            updated += 1
TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 97 rewrites to {updated} questions')
