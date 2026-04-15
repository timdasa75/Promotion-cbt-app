#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'policy_analysis.json'
SUBCATEGORY_ID = 'pol_implementation_evaluation'
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

BAD_GOV = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BAD_RISK = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BAD_DOC = ['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.']
BAD_ACC = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BAD_CTRL = ['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.']
BAD_OPS = ['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.']
BAD_FILE = ['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.']
BAD_EVID = ['Unchecked assumptions under implementation pressure.','Personal preference in source selection.','Bypassed evidence validation under time pressure.']
BAD_PLAN = ['Undefined ownership of implementation tasks.','Unrecorded timelines and milestones.','Monitoring deferred until failure occurs.']
BAD_PRO = ['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved process requirements.','Bypassed review checkpoints under time pressure.']

add_many([
('pol_implementation_evaluation_gen_001',0,'Which practice best demonstrates governance discipline in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_031',0,'Which practice best reflects governance standards in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_038',0,'A desk officer handling implementation and evaluation receives a case that requires governance action. What should be done first?')
], 'Approved implementation procedure with complete records.', BAD_GOV,
'Governance in policy implementation and evaluation is strongest when the approved procedure is followed and the record needed for oversight is kept complete.',
['policy_implementation_evaluation','governance','approved_procedure','complete_records'])
add_many([
('pol_implementation_evaluation_gen_003',0,'Which practice best strengthens risk management in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_040',1,'When a supervisor reviews gaps in policy implementation and evaluation, which step most directly strengthens risk management?')
], 'Early identification of control gaps with prompt escalation of material exceptions.', BAD_RISK,
'Risk management improves when control gaps and material exceptions are identified early and escalated before they weaken delivery or evaluation quality.',
['policy_implementation_evaluation','risk_management','control_gaps','exception_escalation'])
add_many([
('pol_implementation_evaluation_gen_007',0,'Which practice best protects evidence quality in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_037',0,'Which routine best sustains evidence quality in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_044',3,'In a time-sensitive implementation file, which step best preserves evidence quality without breaking procedure?')
], 'Credible data sources with validated assumptions.', BAD_EVID,
'Evidence quality is strongest when implementation and evaluation work relies on credible data sources and assumptions that have been validated before use.',
['policy_implementation_evaluation','evidence_quality','credible_sources','validated_assumptions'])
add_many([
('pol_implementation_evaluation_gen_009',0,'Which practice best supports documented procedure in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_046',0,'A desk officer handling implementation and evaluation receives a file that requires documented procedure. What should be done first?')
], 'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
['policy_implementation_evaluation','documented_procedure','approved_process','complete_records'])
add_many([
('pol_implementation_evaluation_gen_011',0,'Which action best demonstrates public accountability in policy implementation and evaluation?'),
('pol_implementation_evaluation_gen_048',1,'When a supervisor reviews compliance gaps in policy implementation and evaluation, which action most directly strengthens public accountability?')
], 'Traceable decisions with evidence-based reasons.', BAD_ACC,
'Public accountability is stronger when implementation and evaluation decisions can be traced to recorded reasons and supporting evidence.',
['policy_implementation_evaluation','public_accountability','traceable_decisions','evidence_based_reasons'])
add('pol_implementation_evaluation_gen_025','Which practice best supports risk control in policy implementation and evaluation?',0,'Applied controls with documented mitigation.',BAD_CTRL,'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.', ['policy_implementation_evaluation','risk_control','applied_controls','documented_mitigation'])
add('pol_implementation_evaluation_gen_027','Which practice best sustains operational discipline in policy implementation and evaluation?',0,'Approved workflow checks before closure.',BAD_OPS,'Operational discipline depends on completing approved workflow checks and verifying outputs before a matter is closed or escalated.', ['policy_implementation_evaluation','operational_discipline','workflow_checks','case_closure'])
add('pol_implementation_evaluation_gen_029','Which practice best supports record management in policy implementation and evaluation?',0,'Current files with status updates at each control point.',BAD_FILE,'Record management depends on keeping files current and updating status at each control point so implementation work remains reviewable.', ['policy_implementation_evaluation','record_management','current_files','status_updates'])
add('pol_implementation_evaluation_gen_035','Which practice best supports implementation planning in policy implementation and evaluation?',0,'Assigned responsibilities, timelines, and performance measures.',BAD_PLAN,'Implementation planning is stronger when responsibilities, timelines, and performance measures are recorded clearly before rollout begins.', ['policy_implementation_evaluation','implementation_planning','responsibilities','performance_measures'])

add('policy_psr_015','What does the term efficiency bar mean in the Public Service Rules?',1,'Point on the salary scale where increment stops until efficiency is demonstrated.',['Point where promotion is permanently blocked.','Point where probation automatically ends.','Point where formal training begins.'],'Under the PSR, efficiency bar refers to the point on the salary scale where increment stops until the officer demonstrates the required efficiency.', ['psr','efficiency_bar','salary_scale','increment_control'])
add('policy_psr_030','What best defines virement in public finance?',0,'Approved transfer of funds from one budget head to another.',['External loan raised for implementation.','Cash-advance workflow under implementation control.','Procurement method used during formal evaluation.'],'Virement is the approved transfer of funds from one budget head to another within the public budget framework.', ['virement','public_finance','budget_head','approved_transfer'])
add('policy_psr_033','What is the correct statement about confidential files?',3,'They require restricted access and secure storage.',['They should be emailed to all staff.','They are the same as public circulars.','They may be displayed on open notice boards.'],'Confidential files contain sensitive material and therefore require restricted access and secure storage.', ['confidential_files','restricted_access','secure_storage','records_control'])
add('policy_psr_036','Which practice best supports good official correspondence?',1,'Concise formal writing with reference numbers and clear signature.',['Avoiding dates in official letters.','Using informal language and emojis.','Relying heavily on personal opinion.'],'Good official correspondence is concise, formal, and properly identified with the relevant reference details and signature.', ['official_correspondence','formal_tone','reference_numbers','clear_signature'])
add('policy_psr_037','What best describes returning unspent budget balance at year end to the Treasury?',2,'Remittance to the Consolidated Revenue Fund or Treasury Single Account.',['Virement within the approved budget.','Appropriation for the next year.','Imprest retention under implementation control.'],'Unspent balances at year end are remitted back to the Consolidated Revenue Fund or the Treasury Single Account, not retained informally.', ['unspent_balances','treasury_single_account','consolidated_revenue_fund','year_end_remittance'])
add('policy_psr_041','Can a police officer on probation be confirmed without passing the prescribed examination?',3,'No, passing the prescribed examination is compulsory for confirmation.',['Yes, if a superior recommends confirmation.','Yes, if the officer is already promoted.','Yes, if the service record is excellent.'],'Passing the prescribed confirmation examination is a compulsory requirement; recommendation or record alone does not replace it.', ['probationary_officer','confirmation_exam','compulsory_requirement','police_service'])
add('policy_psr_042','How often does the National Council on Establishments meet?',2,'At least once a year.',['Only when there is a major policy change.','Every quarter.','Only when a new President takes office.'],'The National Council on Establishments meets at least once a year to consider establishment matters.', ['national_council_on_establishments','meeting_frequency','annual_meeting','establishment_matters'])
add('policy_psr_044','What is the purpose of a file copy of a circular?',0,'Placement in the file relevant to the subject matter.',['Public circulation to all citizens.','Discarding after the circular is read.','Personal retention by the officer only.'],'A file copy of a circular is kept in the file relevant to the subject matter so the administrative record remains complete.', ['file_copy','circular','subject_file','administrative_record'])
add('policy_psr_045','What is the rule for monthly checking of contents in strong-rooms or safes?',0,'Monthly check by the officer in charge of the keys, with initials and date in the register.',['The check is optional unless a discrepancy is suspected.','It is required only once each year.','It is carried out only after an audit query.'],'Financial regulations require a monthly check of the contents of strong-rooms or safes by the officer responsible for the keys, with the check initialled and dated in the register.', ['strong_rooms','safe_contents','monthly_check','register_entry'])
add('policy_psr_058','Whose mark must be witnessed when an illiterate payee receives payment?',3,'The illiterate payee\'s mark.',['The literate official\'s mark.','The paying officer\'s mark.','No mark is required.'],'Where a payee is illiterate, the illiterate payee\'s mark must be witnessed by a literate official other than the paying officer.', ['illiterate_payee','witnessed_mark','literate_official','payment_procedure'])
add('policy_psr_063','When a driver detects a minor defect in a government vehicle, what should be done first?',3,'Report it immediately to the officer in charge of transport.',['Ignore it because it is minor.','Wait until it becomes a major defect.','Attempt to fix it personally.'],'Drivers are expected to report even minor vehicle defects immediately to the officer in charge of transport so the defect can be addressed properly.', ['government_vehicle','minor_defect','transport_officer','immediate_report'])

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
print(f'Applied round 103 rewrites to {updated} questions')
