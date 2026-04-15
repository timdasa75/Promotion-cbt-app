#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'constitutional_foi.json'
SUBS = {'clg_general_competency', 'clg_legal_compliance'}
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

BAD_RISK = ['Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.']
BAD_DOC = ['Personal preference in procedure use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.']
BAD_ACC = ['Bypassed review checkpoints.', 'Convenience ahead of legal requirements.', 'Continued non-compliance after feedback.']
BAD_CTRL = ['Convenience ahead of control requirements.', 'Continued non-compliance after feedback.', 'Personal preference in control use.']
BAD_OPS = ['Continued non-compliance after feedback.', 'Personal preference in workflow use.', 'Bypassed review checkpoints.']
BAD_RIGHTS = ['Personal preference in rule use.', 'Bypassed review checkpoints.', 'Convenience ahead of legal requirements.']
BAD_AUTH = ['Delayed documentation until after action.', 'Inconsistent criteria across similar cases.', 'Bypassed review controls to save time.']
BAD_LAW = ['Discretionary shortcuts despite control safeguards.', 'Bypassed review checkpoints under time pressure.', 'Convenience ahead of approved process requirements.']

add_many([
    ('clg_general_competency_gen_003',0,'Which practice best strengthens risk management in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_047',0,'When a supervisor reviews gaps in general competency, ethics, and reform work, which step most directly strengthens risk management?')
], 'Early escalation of control gaps and material exceptions.', BAD_RISK,
'Risk management in general competency and reform work improves when control gaps and material exceptions are identified early and escalated promptly.',
['general_competency','risk_management','control_gaps','exception_escalation'])
add_many([
    ('clg_general_competency_gen_007',0,'Which approach best supports rights balancing in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_044',0,'Which practice should an accountable officer prioritize to keep rights balancing defensible in general competency work?'),
    ('clg_general_competency_gen_051',2,'In a time-sensitive constitutional file, which step best preserves rights balancing without breaking procedure?'),
    ('clg_general_competency_gen_078',3,'In a time-sensitive file, which action best preserves rights balancing while keeping the workflow lawful?'),
    ('clg_general_competency_gen_090',2,'When a unit must balance access, fairness, and legal limits, which approach best supports rights balancing?')
], 'Narrow exemptions with recorded legal justification.', BAD_RIGHTS,
'Rights balancing is strongest when exemptions are applied narrowly and every restriction or disclosure decision is supported by a recorded legal basis.',
['general_competency','rights_balancing','narrow_exemptions','legal_basis'])
add_many([
    ('clg_general_competency_gen_009',0,'Which practice best supports documented procedure in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_053',3,'A desk officer receives a general competency file that requires documented procedure. What should be done first?')
], 'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure in general competency and reform work depends on following the approved process and keeping complete records of the steps taken.',
['general_competency','documented_procedure','approved_process','complete_records'])
add_many([
    ('clg_general_competency_gen_011',0,'Which action best demonstrates public accountability in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_055',3,'When a supervisor reviews compliance gaps in general competency, ethics, and reform work, which action most directly strengthens public accountability?')
], 'Traceable decisions with evidence-based reasons.', BAD_ACC,
'Public accountability is stronger when decisions can be traced to recorded reasons and supporting evidence rather than unexplained discretion.',
['general_competency','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
    ('clg_general_competency_gen_013',0,'Which practice best supports risk control in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_057',0,'Which practice best supports risk control under general competency accountability arrangements?'),
    ('clg_general_competency_gen_077',0,'Which practice best supports risk control in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_085',0,'Which practice best improves accountability through stronger risk control in general competency work?')
], 'Applied controls with documented mitigation.', BAD_CTRL,
'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.',
['general_competency','risk_control','applied_controls','documented_mitigation'])
add_many([
    ('clg_general_competency_gen_015',0,'Which practice best sustains operational discipline in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_059',0,'In a time-sensitive general competency file, which step best preserves operational discipline without breaking procedure?'),
    ('clg_general_competency_gen_082',1,'Which practice should an accountable officer prioritize to sustain operational discipline?')
], 'Approved workflow checks before closure.', BAD_OPS,
'Operational discipline depends on completing the approved workflow checks and verifying outputs before a matter is closed or escalated.',
['general_competency','operational_discipline','workflow_checks','case_closure'])
add_many([
    ('clg_general_competency_gen_017',0,'Which practice best supports record management in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_080',0,'Which practice best supports document management in general competency, ethics, and reform work?')
], 'Current files with status updates at each control point.', ['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.'],
'Record management in general competency work depends on keeping files current and updating status at each control point so review and accountability remain possible.',
['general_competency','record_management','current_files','status_updates'])
add_many([
    ('clg_general_competency_gen_042',0,'Which practice best supports legal compliance in general competency, ethics, and reform work?'),
    ('clg_general_competency_gen_067',1,'When reviewing a sensitive constitutional issue, what should be done first?')
], 'Legal-authority checks with a documented decision basis.', BAD_AUTH,
'Legal compliance is stronger when statutory authority is checked before action and the basis for the decision is recorded clearly.',
['general_competency','legal_compliance','statutory_authority','decision_basis'])
add_many([
    ('clg_general_competency_gen_063',3,'When a unit handling constitutional and reform work faces competing priorities, which action best preserves compliance and service quality?'),
    ('clg_general_competency_gen_065',0,'When a supervisor reviews gaps in constitutional and reform work, which option best strengthens control and consistency?')
], 'Action kept within statutory authority and constitutional safeguards.', BAD_LAW,
'Constitutional and reform work remains defensible when actions stay within statutory authority and constitutional safeguards even under pressure.',
['general_competency','legal_defensibility','statutory_authority','constitutional_safeguards'])
add('clg_gc_074','What does the principle of transparency require in public decision-making?',1,'Open decisions and processes with records available for accountability.',['Restricted circulation of all official information.','Budget details known only to senior officers.','Secret procurement and administrative decisions.'],'Transparency requires decisions and processes to be open enough for review, with records available so accountability can be tested later.',['transparency','public_decision_making','openness','accountability_records'])
add('clg_gc_087','Under Rule 040204, what makes withholding an increment more serious than deferring it?',1,'Permanent loss that cannot be restored retrospectively.',['Temporary postponement with later restoration.','Automatic promotion after the punishment period.','Restriction to officers below GL 07.'],'Withholding an increment is more serious because the loss cannot be restored retrospectively, whereas deferral only postpones the increment.',['rule_040204','withholding_increment','deferring_increment','disciplinary_penalty'])
add('clg_gc_097','Which outcome best reflects efficiency in public service delivery?',0,'Services that meet public needs and deliver value for money.',['Politically neutral wording in every decision.','Preferential treatment for senior officers.','Restricted circulation of operational records.'],'Efficiency in service delivery is shown when services meet public needs effectively and deliver value for the resources used.',['efficiency','service_delivery','public_needs','value_for_money'])
add('clg_general_competency_gen_072','What is the usual basis for paying invigilators and examiners?',2,'Number of candidates supervised or scripts marked.',['Grade level of the candidates involved.','One flat rate for every examination.','Number of questions set for the paper.'],'Invigilation and examination fees are usually tied to the volume of work performed, such as the number of candidates supervised or scripts marked.',['examination_fees','invigilators','examiners','workload_basis'])
add('clg_general_competency_gen_081','A reform unit claims it is efficient. Which result best supports that claim?',3,'Services meet public needs effectively and deliver value for money.',['Operational records kept confidential by default.','Administrative decisions stated in politically neutral language.','Priority treatment reserved for senior officers.'],'Efficiency is demonstrated when the unit meets public needs effectively and delivers value for the resources committed.',['efficiency','reform_unit','public_needs','value_for_money'])

add_many([
    ('clg_legal_compliance_gen_003',0,'Which practice best strengthens risk management in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_041',3,'When a supervisor reviews gaps in legal and statutory compliance work, which step most directly strengthens risk management?'),
    ('clg_legal_compliance_gen_074',3,'Which action most directly strengthens risk management in legal and statutory compliance work?')
], 'Early escalation of control gaps and material exceptions.', BAD_RISK,
'Risk management in legal and statutory compliance work improves when control gaps and material exceptions are identified early and escalated promptly.',
['legal_compliance','risk_management','control_gaps','exception_escalation'])
add_many([
    ('clg_legal_compliance_gen_007',0,'Which approach best supports rights balancing in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_038',0,'Which practice should an accountable officer prioritize to keep rights balancing defensible in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_045',1,'In a time-sensitive legal-compliance file, which step best preserves rights balancing without breaking procedure?')
], 'Narrow exemptions with recorded legal justification.', BAD_RIGHTS,
'Rights balancing in legal and statutory compliance work is strongest when exemptions are applied narrowly and the legal basis for each decision is recorded clearly.',
['legal_compliance','rights_balancing','narrow_exemptions','legal_basis'])
add_many([
    ('clg_legal_compliance_gen_009',0,'Which practice best supports documented procedure in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_047',1,'A desk officer receives a legal-compliance file that requires documented procedure. What should be done first?'),
    ('clg_legal_compliance_gen_070',1,'Which choice reflects proper documented procedure in legal and statutory compliance work?')
], 'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure in legal and statutory compliance work depends on following the approved process and keeping complete records of the steps taken.',
['legal_compliance','documented_procedure','approved_process','complete_records'])
add_many([
    ('clg_legal_compliance_gen_011',0,'Which action best demonstrates public accountability in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_049',3,'When a supervisor reviews compliance gaps in legal and statutory compliance work, which action most directly strengthens public accountability?'),
    ('clg_legal_compliance_gen_075',2,'Which action most directly strengthens public accountability in legal and statutory compliance work?')
], 'Traceable decisions with evidence-based reasons.', BAD_ACC,
'Public accountability in legal and statutory compliance work depends on decisions that can be traced to recorded reasons and supporting evidence.',
['legal_compliance','public_accountability','traceable_decisions','evidence_based_reasons'])
add_many([
    ('clg_legal_compliance_gen_013',0,'Which practice best supports risk control in legal and statutory compliance work?'),
    ('clg_legal_compliance_gen_051',3,'Which practice best supports risk control under legal-compliance accountability arrangements?'),
    ('clg_legal_compliance_gen_079',1,'Which practice best supports risk control in legal and statutory compliance work?')
], 'Applied controls with documented mitigation.', BAD_CTRL,
'Risk control in legal and statutory compliance work is stronger when risks are identified early, the right controls are applied, and the mitigation is documented.',
['legal_compliance','risk_control','applied_controls','documented_mitigation'])
add('clg_legal_compliance_gen_028','Which practice best sustains operational discipline in legal and statutory compliance work?',0,'Approved workflow checks before closure.',BAD_OPS,'Operational discipline depends on completing approved workflow checks and verifying outputs before a case is closed or escalated.',['legal_compliance','operational_discipline','workflow_checks','case_closure'])
add('clg_legal_compliance_gen_030','Which practice best supports record management in legal and statutory compliance work?',0,'Current files with status updates at each control point.',['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.'],'Record management in legal and statutory compliance work depends on keeping files current and updating status at each control point so later review remains possible.',['legal_compliance','record_management','current_files','status_updates'])
add_many([
    ('clg_legal_compliance_gen_036',0,'Which practice best supports legal compliance in statutory and constitutional work?'),
    ('clg_legal_compliance_gen_067',2,'Which practice most strongly aligns with sound legal compliance in sensitive statutory work?')
], 'Legal-authority checks with a documented decision basis.', BAD_AUTH,
'Legal compliance is stronger when statutory authority is checked before action and the basis for the decision is documented clearly.',
['legal_compliance','statutory_authority','decision_basis','sensitive_matters'])
add_many([
    ('clg_legal_compliance_gen_052',2,'When a legal-compliance unit faces competing priorities, which action best preserves compliance and service quality?'),
    ('clg_legal_compliance_gen_054',1,'When a supervisor reviews gaps in legal and statutory compliance work, which option best strengthens control and consistency?'),
    ('clg_legal_compliance_gen_055',3,'A compliance reviewer must choose the best first action in a sensitive statutory matter. Which option is most appropriate?')
], 'Action kept within statutory authority and constitutional safeguards.', BAD_LAW,
'Legal and statutory compliance work remains defensible when action stays within statutory authority and constitutional safeguards even under pressure.',
['legal_compliance','legal_defensibility','statutory_authority','constitutional_safeguards'])
add('clg_lc_038','To preserve transparency in public procurement, how should bid opening be conducted?',2,'Public opening with bidders or their representatives invited.',['Opening restricted to the Ministerial Tenders Board only.','Secret opening to protect quoted prices.','Opening deferred until after contract award.'],'Bid opening should be conducted publicly, with bidders or their representatives invited, so the process can be observed and recorded transparently.',['bid_opening','public_tenders','transparency','bidders_invited'])
add('clg_lc_058','What happens when an officer on training abroad receives salary from an overseas employer during the training period?',1,'Forfeiture of Nigerian emoluments unless OHCSF approval is given.',['Continued payment of full Nigerian emoluments.','Immediate refund of the full training cost.','Automatic promotion after the course.'],'An officer who receives salary from an overseas employer during approved training normally forfeits Nigerian emoluments unless the OHCSF has specifically approved otherwise.',['training_abroad','salary_forfeiture','ohcsf_approval','emoluments'])
add('clg_legal_compliance_gen_057','What is the cashier expected to do when cheques or other negotiable instruments are received by post?',0,'Enter the details in the Paper Money Register after the Head of Accounts opens the mail.',['Open the mail personally and record the contents.','Maintain the register without any Head of Accounts involvement.','Remain outside the workflow entirely.'],'The cashier enters the details in the Paper Money Register after the Head of Accounts has opened the mail and identified the negotiable instruments received.',['cashier','paper_money_register','negotiable_instruments','head_of_accounts'])
add('clg_legal_compliance_gen_059','What does the principle of anonymity mean for ministerial decisions in the civil service?',2,'Civil servants are not held personally responsible for decisions taken by Ministers.',['Civil servants do not sign official documents.','Civil servants do not identify themselves in office.','Ministers are never named in public documents.'],'The principle of anonymity means officials advise and support the Minister, but they are not held personally responsible for the Minister\'s decisions.',['anonymity','civil_service','ministerial_decisions','official_advice'])
add('clg_legal_compliance_gen_060','Which statement best reflects anonymity in official advice and implementation?',1,'Officials advise and implement, while the Minister bears political responsibility for the decision.',['Officials never identify themselves in correspondence.','Officials do not sign any official documents.','Ministers are omitted from public responsibility.'],'Anonymity in official practice means civil servants advise and implement, but the Minister carries the political responsibility for the final decision.',['anonymity','official_advice','implementation','political_responsibility'])
add('clg_legal_compliance_gen_081','Which bid-opening practice best preserves transparency and bidder confidence?',3,'Public opening with bidders or their representatives invited.',['Opening completed after contract award.','Opening limited to the tender board in private.','Opening conducted secretly to protect prices.'],'Bidder confidence is stronger when bid opening is conducted publicly and bidders or their representatives are invited to observe the process.',['bid_opening','transparency','bidder_confidence','public_observation'])

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
print(f'Applied round 99 rewrites to {updated} questions')
