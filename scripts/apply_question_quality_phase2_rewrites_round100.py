#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
SUBCATEGORY_ID = 'csh_service_delivery_grievance'
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
BAD_DISC = ['Continued non-compliance after feedback.','Personal preference in discipline handling.','Bypassed review checkpoints.']
BAD_FILE = ['Personal preference in filing practice.','Bypassed review checkpoints.','Convenience ahead of documentation standards.']
BAD_GRV = ['Continued non-compliance after feedback.','Personal preference in complaint handling.','Bypassed review checkpoints.']

add_many([
('csh_service_delivery_grievance_gen_001',0,'Which practice best demonstrates governance discipline in service delivery and grievance administration?'),
('csh_service_delivery_grievance_gen_020',0,'Which practice best reflects governance standards in service delivery and grievance administration?'),
('csh_service_delivery_grievance_gen_027',2,'A desk officer receives a service-delivery grievance file that requires governance action. What should be done first?')
], 'Approved grievance procedure with complete records.', BAD_GOV,
'Governance in service-delivery and grievance administration is strongest when the approved procedure is followed and the record needed for oversight is kept complete.',
['service_delivery_grievance','governance','approved_procedure','complete_records'])
add_many([
('csh_service_delivery_grievance_gen_004',0,'Which practice best strengthens risk management in service delivery and grievance administration?'),
('csh_sdg_069',0,'Which routine best keeps risk control reviewable in service-delivery and grievance administration?')
], 'Early identification of control gaps with prompt escalation of material exceptions.', BAD_RISK,
'Risk management improves when control gaps and material exceptions are identified early and escalated before service failure or complaint escalation occurs.',
['service_delivery_grievance','risk_management','control_gaps','exception_escalation'])
add_many([
('csh_service_delivery_grievance_gen_008',0,'Which practice best sustains discipline and conduct in service delivery and grievance administration?'),
('csh_service_delivery_grievance_gen_026',0,'When conduct problems arise in service delivery and grievance administration, which response best preserves discipline and fairness?')
], 'Consistent response to misconduct under approved policy.', BAD_DISC,
'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy instead of through arbitrary exceptions.',
['service_delivery_grievance','discipline_and_conduct','approved_policy','consistent_response'])
add('csh_service_delivery_grievance_gen_010','Which practice best supports documented procedure in service delivery and grievance administration?',0,'Complete records under the approved procedure.',BAD_DOC,'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',['service_delivery_grievance','documented_procedure','approved_process','complete_records'])
add('csh_service_delivery_grievance_gen_012','Which action best demonstrates public accountability in service delivery and grievance administration?',0,'Traceable decisions with evidence-based reasons.',BAD_ACC,'Public accountability is stronger when decisions can be traced to recorded reasons and supporting evidence.', ['service_delivery_grievance','public_accountability','traceable_decisions','evidence_based_reasons'])
add('csh_service_delivery_grievance_gen_014','Which practice best supports risk control in service delivery and grievance administration?',0,'Applied controls with documented mitigation.',BAD_CTRL,'Risk control is stronger when risks are identified early, appropriate controls are applied, and the mitigation used is documented for later review.', ['service_delivery_grievance','risk_control','applied_controls','documented_mitigation'])
add('csh_service_delivery_grievance_gen_016','Which practice best sustains operational discipline in service delivery and grievance administration?',0,'Approved workflow checks before closure.',BAD_OPS,'Operational discipline depends on completing approved workflow checks and verifying outputs before a complaint or service file is closed.', ['service_delivery_grievance','operational_discipline','workflow_checks','case_closure'])
add('csh_service_delivery_grievance_gen_018','Which practice best supports record management in service delivery and grievance administration?',0,'Current files with status updates at each control point.',BAD_FILE,'Record management depends on keeping files current and updating status at each control point so service failures and complaints remain reviewable.', ['service_delivery_grievance','record_management','current_files','status_updates'])
add('csh_service_delivery_grievance_gen_024','Which practice best supports grievance handling in service delivery administration?',0,'Fair complaint review through timely documented steps.',BAD_GRV,'Grievance handling remains defensible when complaints are reviewed through fair, timely, and documented steps.', ['service_delivery_grievance','grievance_handling','fair_review','documented_steps'])

add('csh_sdg_006','Which outcome best reflects impartial service delivery?',1,'Fair and unbiased service to all citizens.',['Preferential access for political figures.','Service limited to government officials only.','Delayed implementation for disfavoured groups.'],'Impartiality in service delivery means the civil servant serves all citizens fairly, without political, personal, or sectional bias.',['impartiality','service_delivery','fair_service','unbiased_treatment'])
add('csh_sdg_007','What public-service result is most directly supported by the FOI Act?',1,'Public access to government-held information.',['Annual asset declaration by every staff member.','Secrecy of promotion and personnel records.','Automatic use of direct procurement in contracts.'],'The FOI Act supports transparency by giving the public a right to request and access government-held information, subject to lawful exemptions.',['foi_act','transparency','public_information_access','lawful_exemptions'])
add('csh_sdg_012','Which outcome best reflects efficiency in public service delivery?',1,'Services that meet public needs and deliver value for money.',['Slower procedures regardless of urgency.','Services reserved for the highest bidder.','Constant reliance on external consultants.'],'Efficiency is shown when government services meet public needs effectively and deliver value for the resources committed.',['efficiency','service_delivery','public_needs','value_for_money'])
add('csh_sdg_015','If a disciplinary appeal is already before a court, what happens to the administrative petition?',3,'It is not entertained while the court action is pending.',['It is automatically approved.','It is transferred to the FCSC.','It is merely suspended for correction.'],'Rule 110208(ii) provides that an administrative appeal or petition is not entertained where the same matter is already before a court of law.',['disciplinary_appeal','court_action','rule_110208','petition_not_entertained'])
add('csh_sdg_017','What is the main purpose of FCSC oversight in disciplinary procedure under Rule 100305?',1,'Protection of due process and natural justice.',['Immediate dismissal of the officer concerned.','Transfer of the case to another MDA.','Negotiation of retirement benefits.'],'FCSC oversight exists to ensure the disciplinary process complies with due process and the principles of natural justice.', ['fcsc','disciplinary_procedure','due_process','natural_justice'])
add('csh_sdg_022','Why does meritocracy support better service delivery in the civil service?',1,'Competent and qualified officers handle public-service responsibilities.',['Seniority alone determines who performs the work.','Political loyalty overrides technical competence.','Regional balancing replaces all professional standards.'],'Meritocracy improves service delivery because competent and qualified officers are the ones entrusted with public-service responsibilities.', ['meritocracy','service_delivery','competence','qualified_officers'])
add('csh_sdg_027','What administrative outcome is protected when officers know and obey the PSR?',1,'Uniformity and compliance in administrative and disciplinary processes.',['Excusable ignorance of service rules.','Routine delay of official duties.','Exclusive rule knowledge for senior officers only.'],'Rule familiarity protects uniformity and compliance because officers are expected to know and obey the PSR rather than plead ignorance.', ['psr','rule_familiarity','uniformity','administrative_compliance'])
add('csh_sdg_030','How does the Federal Character Principle support service delivery excellence?',1,'Equitable representation that strengthens national cohesion in public service.',['Appointments concentrated in one region.','Civil-service posts reserved for foreign nationals.','Training opportunities limited to senior officers.'],'The Federal Character Principle supports service delivery by promoting equitable representation and national cohesion within the public service.', ['federal_character','service_delivery','equitable_representation','national_cohesion'])
add('csh_sdg_032','What happens to an appeal or petition that is illegible or meaningless under Rule 110208(iii)?',2,'It is not entertained.',['It is transferred directly to court.','It is returned automatically for correction.','It results only in a warning to the officer.'],'Rule 110208(iii) provides that an appeal or petition that is illegible or meaningless will not be entertained.', ['appeal_petition','rule_110208','illegible_petition','not_entertained'])
add('csh_sdg_035','When do PSR provisions apply to a federal parastatal?',0,'Where the parastatal has no internal rules or its rules contain gaps or inconsistencies.',['Where internal rules are already complete and fully applicable.','Whenever the supervising ministry issues temporary directions.','Only where the agency operates as a research institution.'],'The PSR applies in a federal parastatal where internal rules are absent or contain gaps or inconsistencies that require the general service rules to fill them.', ['psr','parastatals','internal_rules','rule_gaps'])
add('csh_sdg_048','What ultimate duty does the Civil Service Handbook place on a civil servant?',1,'Impartial and effective service to the public.',['Personal profit from official position.','Primary loyalty to partisan politics.','Permanent secrecy of all official records.'],'The Civil Service Handbook emphasizes that the civil servant\'s ultimate duty is to provide impartial and effective service to the public.', ['civil_service_handbook','public_duty','impartial_service','effective_service'])
add('csh_sdg_054','What best defines official duties for government vehicle use?',1,'Activities directly connected to the statutory functions of the agency.',['Transport for family members of public officials.','Personal errands undertaken during office hours.','Any activity requested informally by a superior.'],'For government vehicle use, official duties are activities directly connected to the statutory functions and responsibilities of the agency.', ['government_vehicle_use','official_duties','statutory_functions','agency_responsibility'])
add('csh_sdg_064','Under what condition do the PSR secure service continuity in federal parastatals?',3,'Where internal rules are absent or contain gaps or inconsistencies.',['Where temporary ministry directives are enough on their own.','Where internal regulations are already complete and fully applicable.','Where the agency is a research institution with its own rules.'],'Service continuity is protected when the PSR fills the gap left by missing or inconsistent internal parastatal rules.', ['psr','service_continuity','parastatals','rule_gaps'])
add('csh_sdg_071','What does strict familiarity and compliance with the PSR chiefly secure?',2,'Uniformity and compliance in administrative and disciplinary processes.',['Delay in performance of official duties.','Exclusive rule knowledge for senior officers only.','Excusable ignorance of service rules.'],'Strict familiarity with the PSR secures uniformity and compliance because administrative and disciplinary processes are then handled by one known rule framework.', ['psr','strict_compliance','uniformity','disciplinary_processes'])

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
print(f'Applied round 100 rewrites to {updated} questions')
