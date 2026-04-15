#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'leadership_negotiation.json'
SUBS = {'neg_structure_bodies','neg_dispute_law'}
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

BODY_GOV = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BODY_RISK = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
BODY_DOC = ['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.']
BODY_ACC = ['Bypassed review checkpoints.','Continued non-compliance after feedback.','Convenience ahead of legal requirements.']
BODY_CTRL = ['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.']
BODY_OPS = ['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.']
BODY_CHG = ['Bypassed review checkpoints under time pressure.','Continued non-compliance after feedback.','Personal preference in reform handling.']

add_many([
('neg_structure_bodies_gen_001',0,'Which practice best demonstrates governance discipline in negotiating bodies?'),
('neg_structure_bodies_gen_019',0,'Which practice best reflects governance standards in negotiating bodies?'),
('neg_structure_bodies_gen_039',2,'A desk officer receives a negotiating-body case that requires governance action. What should be done first?'),
('neg_structure_bodies_gen_057',2,'When a supervisor reviews compliance gaps in negotiating bodies, which action most directly strengthens governance?'),
('neg_structure_bodies_gen_072',2,'Which action best demonstrates governance discipline in negotiating bodies?')],
'Approved body procedure with complete records.', BODY_GOV,
'Governance in negotiating bodies is strengthened when the approved procedure is followed and the complete record needed for oversight is maintained.',
['negotiating_bodies','governance','approved_procedure','complete_records'])
add_many([
('neg_structure_bodies_gen_003',0,'Which practice best supports risk management in negotiating bodies?'),
('neg_structure_bodies_gen_041',0,'When a supervisor reviews compliance gaps in negotiating bodies, which step most directly strengthens risk management?'),
('neg_structure_bodies_gen_073',2,'Which action most directly strengthens risk management in negotiating bodies while preserving the audit trail?')],
'Early escalation of control gaps and material exceptions.', BODY_RISK,
'Risk management in negotiating bodies improves when control gaps and material exceptions are identified early and escalated promptly.',
['negotiating_bodies','risk_management','control_gaps','exception_escalation'])
add_many([
('neg_structure_bodies_gen_009',0,'Which practice best supports documented procedure in negotiating bodies?'),
('neg_structure_bodies_gen_027',0,'Which practice best secures procedural documentation in negotiating bodies?'),
('neg_structure_bodies_gen_047',2,'A desk officer receives a negotiating-body case that requires documented procedure. What should be done first?')],
'Complete records under the approved procedure.', BODY_DOC,
'Documented procedure in negotiating bodies depends on following the approved process and keeping complete records of the steps taken.',
['negotiating_bodies','documented_procedure','approved_process','complete_records'])
add_many([
('neg_structure_bodies_gen_011',0,'Which action best demonstrates public accountability in negotiating bodies?'),
('neg_structure_bodies_gen_049',3,'When a supervisor reviews compliance gaps in negotiating bodies, which action most directly strengthens public accountability?')],
'Traceable decisions with evidence-based reasons.', BODY_ACC,
'Public accountability in negotiating bodies depends on decisions that can be traced to recorded reasons and supporting evidence.',
['negotiating_bodies','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
('neg_structure_bodies_gen_013',0,'Which practice best supports risk control in negotiating bodies?'),
('neg_structure_bodies_gen_031',0,'Which action best demonstrates active risk control in negotiating bodies?'),
('neg_structure_bodies_gen_051',1,'Which practice best supports risk control under negotiating-body accountability arrangements?'),
('neg_structure_bodies_gen_068',2,'Which practice best reflects sound risk control in negotiating structures and bodies?')],
'Applied controls with documented mitigation.', BODY_CTRL,
'Risk control in negotiating bodies is stronger when identified risks are matched with applied controls and documented mitigation.',
['negotiating_bodies','risk_control','documented_mitigation','applied_controls'])
add_many([
('neg_structure_bodies_gen_015',0,'Which practice best sustains operational discipline in negotiating bodies?'),
('neg_structure_bodies_gen_033',0,'Which practice best supports workflow discipline in negotiating bodies?'),
('neg_structure_bodies_gen_053',1,'In a time-sensitive negotiating-body file, which step best preserves operational discipline without breaking procedure?'),
('neg_structure_bodies_gen_074',1,'In a time-sensitive file on negotiating structures, which step best preserves operational discipline?'),
('neg_structure_bodies_gen_077',2,'Which practice best reflects operational discipline in negotiating structures and bodies?'),
('neg_structure_bodies_gen_085',0,'Which practice best sustains operational discipline in negotiating structures and bodies?')],
'Approved workflow checks before closure.', BODY_OPS,
'Operational discipline in negotiating bodies depends on completing approved workflow checks before a case is closed or advanced.',
['negotiating_bodies','operational_discipline','workflow_checks','case_closure'])
add('neg_structure_bodies_gen_023','Which practice best supports stakeholder engagement in negotiating bodies?',0,'Principled engagement with documented commitments.',['Continued non-compliance after feedback.','Personal preference in stakeholder handling.','Bypassed review checkpoints.'],'Stakeholder engagement in negotiating bodies is stronger when the engagement follows principled negotiation and the commitments reached are documented clearly.',['negotiating_bodies','stakeholder_engagement','principled_negotiation','documented_commitments'])
add_many([
('neg_structure_bodies_gen_045',1,'In a time-sensitive negotiating-body file, which step best preserves change management without breaking procedure?'),
('neg_structure_bodies_gen_063',2,'A desk officer receives a negotiating-body case that requires change management. What should be done first?'),
('neg_structure_bodies_gen_066',0,'When a negotiating body must manage change without breaking procedure, what should be done first?'),
('neg_structure_bodies_gen_076',0,'Which approach best supports change management in negotiating structures and bodies?'),
('neg_structure_bodies_gen_082',0,'Which practice should an accountable officer prioritize to sustain change management in negotiating structures and bodies?')],
'Sequenced reforms with communication, training, and monitoring.', BODY_CHG,
'Change management in negotiating bodies is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
['negotiating_bodies','change_management','sequenced_reforms','monitoring'])
add('neg_structure_bodies_gen_037','Which governance safeguard most strengthens oversight of a negotiating body?',0,'Approved charter with quorum, reporting, and review rules.',['Informal procedure changes when meetings become difficult.','Undefined oversight left to personal judgment.','Attendance and reporting treated as optional.'],'Oversight is strongest when a negotiating body operates under an approved charter that defines quorum, reporting obligations, and review responsibilities.',['negotiating_bodies','oversight','approved_charter','review_rules'])

DIS_GOV_WRONG = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
DIS_DOC_WRONG = ['Personal preference in procedure use.','Bypassed review checkpoints.','Convenience ahead of legal requirements.']
DIS_ACC_WRONG = ['Bypassed review checkpoints.','Convenience ahead of legal requirements.','Continued non-compliance after feedback.']
DIS_CTRL_WRONG = ['Convenience ahead of control requirements.','Continued non-compliance after feedback.','Personal preference in control use.']
DIS_OPS_WRONG = ['Continued non-compliance after feedback.','Personal preference in workflow use.','Bypassed review checkpoints.']
DIS_CHG_WRONG = ['Bypassed review checkpoints under time pressure.','Continued non-compliance after feedback.','Personal preference in reform handling.']

add('NLR_L_032','Industrial action such as a strike in the Nigerian Public Service is generally only considered lawful when:',1,'All statutory dispute-resolution channels have been exhausted.',['Worker dissatisfaction under routine conditions.','Government leadership changes during the dispute.','A union seeks wage review without exhausting procedure.'],'Industrial action is generally considered lawful only after all statutory dispute-resolution mechanisms have been exhausted under the applicable labour-law framework.',['labour_law','industrial_action','strike_lawfulness','dispute_resolution'])
add('neg_dispute_law_gen_085','Which condition most directly supports lawful industrial action in the Nigerian Public Service?',2,'Exhaustion of all statutory dispute-resolution channels.',['Leadership change during the dispute.','Internal wage demands without completed procedure.','Worker dissatisfaction under routine conditions.'],'Lawful industrial action depends on exhausting the statutory dispute-resolution channels before a strike is treated as lawful.',['labour_law','industrial_action','statutory_channels','strike_lawfulness'])
add_many([
('neg_dispute_law_gen_003',0,'Which practice best supports risk management in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_039',2,'When a supervisor reviews compliance gaps in dispute-resolution and labour-law work, which step most directly strengthens risk management?'),
('neg_dispute_law_gen_084',0,'Which practice best reflects sound risk management in dispute-resolution and labour-law work?')],
'Early escalation of control gaps and material exceptions.', DIS_GOV_WRONG,
'Risk management in dispute-resolution and labour-law work improves when control gaps and material exceptions are identified early and escalated promptly.',
['dispute_resolution','labour_law','risk_management','exception_escalation'])
add_many([
('neg_dispute_law_gen_009',0,'Which practice best supports documented procedure in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_027',0,'Which practice best secures procedural documentation in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_045',0,'A desk officer receives a dispute-resolution and labour-law case that requires documented procedure. What should be done first?'),
('neg_dispute_law_gen_089',1,'When a dispute-resolution and labour-law case requires documented procedure, what should be done first?')],
'Complete records under the approved procedure.', DIS_DOC_WRONG,
'Documented procedure in dispute-resolution and labour-law work depends on following the approved process and keeping complete records of the steps taken.',
['dispute_resolution','labour_law','documented_procedure','complete_records'])
add_many([
('neg_dispute_law_gen_011',0,'Which action best demonstrates public accountability in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_047',0,'When a supervisor reviews compliance gaps in dispute-resolution and labour-law work, which action most directly strengthens public accountability?')],
'Traceable decisions with evidence-based reasons.', DIS_ACC_WRONG,
'Public accountability in dispute-resolution and labour-law work depends on decisions that can be traced to recorded reasons and supporting evidence.',
['dispute_resolution','labour_law','public_accountability','traceable_decisions'])
add_many([
('neg_dispute_law_gen_013',0,'Which practice best supports risk control in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_031',0,'Which action best demonstrates active risk control in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_049',3,'Which practice best supports risk control under dispute-resolution accountability arrangements?')],
'Applied controls with documented mitigation.', DIS_CTRL_WRONG,
'Risk control in dispute-resolution and labour-law work is stronger when identified risks are matched with applied controls and documented mitigation.',
['dispute_resolution','labour_law','risk_control','documented_mitigation'])
add_many([
('neg_dispute_law_gen_015',0,'Which practice best sustains operational discipline in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_033',0,'Which practice best supports workflow discipline in dispute-resolution and labour-law work?'),
('neg_dispute_law_gen_051',0,'In a time-sensitive dispute-resolution file, which step best preserves operational discipline without breaking procedure?'),
('neg_dispute_law_gen_080',2,'Which practice best supports operational discipline in dispute-resolution and labour-law work?')],
'Approved workflow checks before closure.', DIS_OPS_WRONG,
'Operational discipline in dispute-resolution and labour-law work depends on completing approved workflow checks before a case is closed or advanced.',
['dispute_resolution','labour_law','operational_discipline','workflow_checks'])
add('neg_dispute_law_gen_023','Which practice best supports stakeholder engagement in dispute-resolution and labour-law work?',0,'Principled engagement with documented commitments.',['Continued non-compliance after feedback.','Personal preference in stakeholder handling.','Bypassed review checkpoints.'],'Stakeholder engagement in dispute-resolution and labour-law work is stronger when the engagement follows principled negotiation and the commitments reached are documented clearly.',['dispute_resolution','labour_law','stakeholder_engagement','documented_commitments'])
add_many([
('neg_dispute_law_gen_007',0,'A labour-dispute unit is introducing a revised grievance procedure. Which step best supports orderly transition?'),
('neg_dispute_law_gen_043',1,'In a time-sensitive dispute-resolution file, which step best preserves change management without breaking procedure?'),
('neg_dispute_law_gen_061',0,'A desk officer receives a dispute-resolution and labour-law case that requires change management. What should be done first?'),
('neg_dispute_law_gen_082',3,'In a time-sensitive dispute-resolution file, which step best preserves change management without breaching workflow?'),
('neg_dispute_law_gen_088',0,'Which practice should an accountable officer prioritize to sustain change management in dispute-resolution and labour-law work?')],
'Sequenced reforms with communication, training, and monitoring.', DIS_CHG_WRONG,
'Change management in dispute-resolution and labour-law work is strongest when reforms are sequenced and supported by communication, training, and monitoring.',
['dispute_resolution','labour_law','change_management','sequenced_reforms'])
add('neg_dispute_law_gen_025','After a labour dispute has been resolved, which practice best sustains implementation of the agreement?',0,'Assigned follow-up owners with documented milestones and compliance review.',['Automatic implementation after signature.','Delayed follow-up until a complaint is filed.','Verbal reassurances as proof of implementation.'],'Agreement implementation is sustained when follow-up owners are assigned, milestones are documented, and compliance is reviewed against the agreed terms.',['labour_law','agreement_implementation','follow_up','compliance_review'])
add('neg_dispute_law_gen_062','When a dispute-resolution unit faces competing priorities, which action best preserves compliance and service quality?',1,'Clear expectations, monitored outcomes, and prompt correction of deviations.',['Discretionary shortcuts despite control safeguards.','Convenience ahead of approved process.','Bypassed review checkpoints under time pressure.'],'Compliance and service quality are preserved when the unit sets clear expectations, monitors outcomes, and corrects deviations promptly.', ['dispute_resolution','labour_law','compliance_and_service_quality','monitored_outcomes'])
add('neg_dispute_law_gen_064','When a supervisor reviews gaps in dispute-resolution and labour-law work, which option best strengthens control and consistency?',2,'Clear expectations, monitored outcomes, and prompt correction of deviations.',['Inconsistent criteria across similar cases.','Convenience ahead of approved process.','Bypassed review checkpoints under time pressure.'],'Control and consistency improve when leaders set clear expectations, monitor outcomes, and correct deviations promptly.', ['dispute_resolution','labour_law','control_and_consistency','monitored_outcomes'])
add('neg_dispute_law_gen_075','Which document-management practice best supports dispute-resolution and labour-law work?',2,'Current files with status updates at each control point.',['Convenience ahead of documentation standards.','Bypassed review checkpoints.','Personal preference in filing practice.'],'Document management in dispute-resolution and labour-law work depends on keeping files current and updating status at each control point.', ['dispute_resolution','labour_law','document_management','status_updates'])
add('neg_dispute_law_gen_083','When a dispute-resolution unit faces competing priorities, which action best preserves compliance and service quality?',0,'Clear expectations, monitored outcomes, and prompt correction of deviations.',['Discretionary shortcuts despite control safeguards.','Bypassed review checkpoints under time pressure.','Convenience ahead of approved procedure.'],'Compliance and service quality are preserved when leaders set clear expectations, monitor outcomes, and correct deviations promptly.', ['dispute_resolution','labour_law','compliance_and_service_quality','corrective_action'])

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
print(f'Applied round 98 rewrites to {updated} questions')
