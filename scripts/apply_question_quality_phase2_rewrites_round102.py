#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'general_current_affairs.json'
SUBCATEGORY_ID = 'ca_national_events'
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
BAD_FILE = ['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.']
BAD_COMM = ['Unverified rumours treated as confirmed facts.','Personal preference in source selection.','Bypassed source-checking under time pressure.']
BAD_GOV = ['Untracked policy changes despite public impact.','Personal preference in update handling.','Bypassed verification of official announcements.']
BAD_PRO = ['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved process requirements.','Bypassed review checkpoints under time pressure.']

add_many([
('ca_national_events_gen_003',0,'Which practice best strengthens risk management when handling national events and key public-affairs updates?'),
('ca_national_events_gen_030',0,'When a supervisor reviews gaps in national-events administration, which step most directly strengthens risk management?')
], 'Early identification of control gaps with prompt escalation of material exceptions.', BAD_RISK,
'Risk management improves when control gaps and material exceptions are identified early and escalated before they distort public-facing updates or administrative action.',
['national_events','risk_management','control_gaps','exception_escalation'])
add_many([
('ca_national_events_gen_007',0,'Which practice best supports public-communication literacy in national-events administration?'),
('ca_national_events_gen_025',0,'Which routine best sustains public-communication literacy in national-events administration?'),
('ca_national_events_gen_034',1,'In a time-sensitive national-events file, which step best preserves public-communication literacy without breaking procedure?'),
('ca_national_events_gen_052',1,'A desk officer handling national-events updates receives a case that requires public-communication literacy. What should be done first?')
], 'Verified updates separated from rumours and misinformation.', BAD_COMM,
'Public-communication literacy is strongest when verified updates are clearly separated from rumours and unsupported claims before conclusions are shared or relied on.',
['national_events','public_communication_literacy','verified_updates','misinformation_control'])
add_many([
('ca_national_events_gen_009',0,'Which practice best supports documented procedure in national-events administration?'),
('ca_national_events_gen_027',0,'Which routine best reflects documented procedure in national-events administration?'),
('ca_national_events_gen_036',0,'A desk officer handling national-events administration receives a file that requires documented procedure. What should be done first?')
], 'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
['national_events','documented_procedure','approved_process','complete_records'])
add_many([
('ca_national_events_gen_011',0,'Which action best demonstrates public accountability in national-events administration?'),
('ca_national_events_gen_038',2,'When a supervisor reviews compliance gaps in national-events administration, which action most directly strengthens public accountability?')
], 'Traceable decisions with evidence-based reasons.', BAD_ACC,
'Public accountability is stronger when decisions and public-facing judgments can be traced to recorded reasons and supporting evidence.',
['national_events','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
('ca_national_events_gen_013',0,'Which practice best supports risk control in national-events administration?'),
('ca_national_events_gen_040',3,'Which practice best supports risk control when handling national-events updates under approval and documentation controls?')
], 'Applied controls with documented mitigation.', BAD_CTRL,
'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.',
['national_events','risk_control','applied_controls','documented_mitigation'])
add_many([
('ca_national_events_gen_015',0,'Which practice best sustains operational discipline in national-events administration?'),
('ca_national_events_gen_042',3,'In a time-sensitive national-events file, which step best preserves operational discipline without breaking procedure?')
], 'Approved workflow checks before closure.', BAD_OPS,
'Operational discipline depends on completing approved workflow checks and verifying outputs before an update or file is closed.',
['national_events','operational_discipline','workflow_checks','case_closure'])
add('ca_national_events_gen_017','Which practice best supports record management in national-events administration?',0,'Current files with status updates at each control point.',BAD_FILE,'Record management depends on keeping files current and updating status at each control point so public-facing matters remain reviewable.', ['national_events','record_management','current_files','status_updates'])
add('ca_national_events_gen_023','Which practice best supports governance updates in national-events administration?',0,'Tracked policy changes with clear public-service implications.',BAD_GOV,'Governance updates are handled well when policy changes are tracked and their implications for public service and public understanding are recorded clearly.', ['national_events','governance_updates','policy_changes','service_implications'])
add_many([
('ca_national_events_gen_053',1,'When a unit handling national events faces competing priorities, which action best preserves compliance and service quality?'),
('ca_national_events_gen_055',1,'When a supervisor reviews gaps in national-events administration, which option best strengthens control and consistency?')
], 'Credible official sources checked before conclusions are drawn.', BAD_PRO,
'Control and civic reliability are strongest when officers rely on credible official sources and confirm facts before drawing or sharing conclusions.',
['national_events','verified_civic_awareness','official_sources','fact_confirmation'])

add('NEKP_161','How do the Public Service Rules treat gendered terms such as Officer and Staff?',2,'The Rules apply equally to both genders.',['The terms are exclusively masculine.','The terms are exclusively feminine.','Application depends on the Head of the MDA.'],'Although the wording of the Rules may use masculine terms, the provisions apply equally to both genders.', ['psr','gender_neutral_application','officer','staff'])
add('NEKP_165','What happens if an officer fails to submit representations on unsatisfactory conduct within the time allowed?',0,'Appropriate sanction may be invoked against the officer.',['The late representations are automatically accepted.','The officer is transferred to another MDA.','The officer is promoted after the deadline.'],'Failure to submit representations within the specified time may be taken as a decision not to respond, and the appropriate sanction may then be invoked.', ['unsatisfactory_conduct','representations','time_limit','appropriate_sanction'])
add('NEKP_168','What compensation applies where a Foreign Service officer is injured on official duty and becomes incapacitated?',1,'Full emolument until discharge from sick leave or permanent invalidation.',['Pension disbursement only under ordinary rules.','Half salary under routine administrative practice.','Immediate dismissal from the service.'],'Where a Foreign Service officer is incapacitated by injury sustained in the course of official duty, full emolument continues until discharge from sick leave or permanent invalidation.', ['foreign_service','official_duty_injury','full_emolument','incapacitation'])
add('ca_national_events_gen_057','How do the Public Service Rules define recruitment?',3,'Filling vacancies by appointing persons not already in the Federal Public Service.',['Any filling of vacancies regardless of service status.','Hiring of new staff through any workflow.','Appointment workflow in the public service generally.'],'Under the PSR, recruitment means filling vacancies by appointing persons who are not already in the Public Service of the Federal Republic of Nigeria.', ['psr','recruitment','filling_vacancies','new_entrants'])
add('ca_national_events_gen_065','What happens if an officer neglects to press for claims from private parties and prejudice results?',2,'The neglecting officer is held in charge.',['The Accountant-General takes over the claim.','The claim is written off automatically.','The private party alone bears the loss.'],'Neglect to press for claims does not prejudice the private party; instead, the officer who neglected the duty is held in charge.', ['claims_from_private_parties','officer_held_in_charge','financial_regulations','neglect_of_duty'])
add('ca_national_events_gen_076','What is the rule on delegating authority to notify the bank of changes in empowered signatories?',2,'The authority must not be delegated.',['It may be delegated to any senior officer.','It is left to the Accounting Officer\'s discretion.','It may be delegated with ministerial approval.'],'Financial Regulation 705(i) provides that authority to notify the bank of changes in empowered signatories must not be delegated.', ['empowered_signatories','bank_notification','delegation','financial_regulation_705i'])
add('ca_national_events_gen_077','What follows if a government bank account is overdrawn?',1,'The accountable officer must refund any bank charges incurred.',['The account is automatically closed.','A report alone is sent to the Minister of Finance.','The bank covers the overdraft without consequence.'],'Where a government bank account is overdrawn, the accountable officer must refund any bank charges incurred because of the overdraft.', ['government_bank_account','overdrawn_account','bank_charges','accountable_officer'])
add('ca_national_events_gen_078','What is the implication if an officer pays public money into a private bank account?',0,'The officer is deemed to have acted with fraudulent intention.',['It is treated as a minor irregularity.','The money is simply transferred back to government later.','Only a warning is issued in the first instance.'],'An officer who pays public money into a private bank account is deemed to have acted with fraudulent intention under the relevant financial regulation.', ['public_money','private_bank_account','fraudulent_intention','financial_regulations'])
add('ca_national_events_gen_081','Can cheques received by a Sub-Accounting Officer be endorsed or assigned to a third party?',1,'No, under no circumstances.',['Yes, for urgent payments.','Yes, if the third party is another government entity.','Yes, with proper authorization.'],'Cheques received by a Sub-Accounting Officer must not be endorsed or assigned to a third party under any circumstances.', ['sub_accounting_officer','cheques','third_party_endorsement','financial_regulations'])

payload = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in payload.get('subcategories', []):
    if sub.get('id') != SUBCATEGORY_ID:
        continue
    for q in sub.get('questions', []):
        if q.get('id') in UPDATES:
            q.update(UPDATES[q['id']])
            updated += 1
TARGET.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 102 rewrites to {updated} questions')
