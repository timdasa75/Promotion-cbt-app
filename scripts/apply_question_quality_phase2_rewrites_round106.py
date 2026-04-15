#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'constitutional_foi.json'
SUBS = {'clg_constitutional_governance', 'foi_access_obligations'}
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
BAD_RIGHTS = [
    'Personal preference in rule use.',
    'Bypassed review checkpoints.',
    'Convenience ahead of legal requirements.',
]
BAD_AUTH = [
    'Delayed documentation until after action.',
    'Inconsistent criteria across similar cases.',
    'Bypassed review controls to save time.',
]
BAD_LAW = [
    'Discretionary shortcuts under pressure.',
    'Bypassed review checkpoints.',
    'Convenience ahead of approved process.',
]

# Constitutional governance generated shell
add_many([
    ('clg_constitutional_governance_gen_003', 0, 'Which practice best supports risk management in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_033', 1, 'When a supervisor reviews gaps in constitutional-governance work, which step most directly strengthens risk management?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['constitutional_governance', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('clg_constitutional_governance_gen_007', 0, 'Which approach best supports rights balancing in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_025', 0, 'Which practice best sustains rights balancing in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_037', 2, 'In a time-sensitive constitutional-governance file, which step best preserves rights balancing without breaking procedure?'),
    ('clg_constitutional_governance_gen_055', 1, 'A constitutional-governance matter requires rights balancing. What should be done first?'),
],
'Narrow exemptions with a recorded legal basis.', BAD_RIGHTS,
'Rights balancing is strongest when restrictions are applied narrowly and the legal basis for the decision is recorded clearly.',
['constitutional_governance', 'rights_balancing', 'narrow_exemptions', 'legal_basis'])
add_many([
    ('clg_constitutional_governance_gen_009', 0, 'Which practice best supports documented procedure in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_027', 0, 'Which routine best reflects documented procedure in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_039', 0, 'A constitutional-governance file requires documented procedure. What should be done first?'),
],
'Complete records under the approved procedure.', BAD_DOC,
'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
['constitutional_governance', 'documented_procedure', 'approved_process', 'complete_records'])
add_many([
    ('clg_constitutional_governance_gen_011', 0, 'Which action best demonstrates public accountability in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_041', 1, 'When a supervisor reviews gaps in constitutional-governance work, which action most directly strengthens public accountability?'),
],
'Traceable decisions with recorded reasons.', BAD_ACC,
'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
['constitutional_governance', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add_many([
    ('clg_constitutional_governance_gen_013', 0, 'Which practice best supports risk control in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_043', 1, 'Which practice best strengthens accountability through better risk control in constitutional-governance work?'),
],
'Documented mitigation for identified risks.', BAD_CTRL,
'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
['constitutional_governance', 'risk_control', 'documented_mitigation', 'follow_up'])
add_many([
    ('clg_constitutional_governance_gen_015', 0, 'Which practice best sustains operational discipline in constitutional-governance work?'),
    ('clg_constitutional_governance_gen_045', 2, 'In a time-sensitive constitutional-governance file, which step best preserves operational discipline without breaking procedure?'),
],
'Approved workflow checks before closure.', BAD_WORKFLOW,
'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
['constitutional_governance', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('clg_constitutional_governance_gen_017', 'Which practice best supports record management in constitutional-governance work?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['constitutional_governance', 'record_management', 'current_files', 'status_updates'])
add('clg_constitutional_governance_gen_023', 'Which practice best supports legal compliance in constitutional-governance work?', 0,
    'Legal-authority checks with a documented decision basis.', BAD_AUTH,
    'Legal compliance is stronger when statutory authority is checked before action and the basis for the decision is documented clearly.',
    ['constitutional_governance', 'legal_compliance', 'statutory_authority', 'decision_basis'])
add_many([
    ('clg_constitutional_governance_gen_056', 0, 'When a constitutional-governance unit faces competing priorities, which action best preserves compliance and service quality?'),
    ('clg_constitutional_governance_gen_058', 0, 'When a supervisor reviews gaps in constitutional-governance work, which option best strengthens control and consistency?'),
],
'Action kept within statutory authority and constitutional safeguards.', BAD_LAW,
'Constitutional work remains defensible when action stays within statutory authority and constitutional safeguards even under pressure.',
['constitutional_governance', 'legal_defensibility', 'statutory_authority', 'constitutional_safeguards'])

# Constitutional governance factual tail
add('clg_constitutional_governance_gen_060', 'What mainly distinguishes the Civil Service from elected officials such as members of the National Assembly?', 2,
    'Its continuity of existence.',
    ['Civil servants do not earn salaries.', 'Civil servants serve only short fixed terms.', 'The service has no accumulated institutional experience.'],
    'The Civil Service is a permanent institution with continuity of existence, unlike elected offices that depend on electoral tenure.',
    ['civil_service', 'elected_officials', 'continuity', 'constitutional_structure'])
add('clg_constitutional_governance_gen_072', 'What type of safe is required for the daily working balance of cash, stamps, and receipt or licence books during office hours?', 0,
    'A safe built into, or securely attached to, the structure of the building.',
    ['A fireproof cabinet only.', 'A portable safe.', 'Any available safe.'],
    'The required safe is one built into, or securely attached to, the structure of the building so the daily working balance is kept securely.',
    ['safe_custody', 'daily_working_balance', 'cash_and_stamps', 'secure_safe'])
add('clg_constitutional_governance_gen_076', 'What is the official rule for MDAs embarking on foreign trips?', 1,
    'They should not embark on such trips without informing the Ministry of Foreign Affairs.',
    ['They only need to inform the Head of the Civil Service.', 'They may travel independently if self-funded.', 'They must obtain Presidency approval in every case.'],
    'MDAs and related bodies are expected to inform the Ministry of Foreign Affairs before embarking on foreign trips so the official protocol is respected.',
    ['foreign_travel', 'mda_protocol', 'ministry_of_foreign_affairs', 'official_rule'])
add('clg_constitutional_governance_gen_084', 'How should the daily working balance of cash, stamps, and receipt or licence books be secured during office hours?', 0,
    'In a safe built into, or securely attached to, the building structure.',
    ['In a portable safe.', 'In a fireproof cabinet only.', 'In any safe available in the office.'],
    'Daily working balances should be kept in a safe that is built into, or firmly attached to, the structure of the building so custody remains secure.',
    ['safe_custody', 'office_hours', 'daily_working_balance', 'secure_storage'])

# FOI obligations generated shell
add_many([
    ('foi_access_obligations_gen_003', 0, 'Which practice best supports risk management in FOI access-obligations work?'),
],
'Early escalation of material exceptions.', BAD_RISK,
'Risk management improves when material exceptions are identified early, escalated promptly, and tracked for follow-up.',
['foi', 'risk_management', 'material_exceptions', 'escalation'])
add_many([
    ('foi_access_obligations_gen_007', 0, 'Which approach best supports rights balancing under the FOI Act?'),
    ('foi_access_obligations_gen_025', 0, 'Which practice best sustains rights balancing in FOI access work?'),
],
'Narrow exemptions with a recorded legal basis.', BAD_RIGHTS,
'FOI rights balancing is strongest when exemptions are applied narrowly and the legal basis for each restriction is recorded clearly.',
['foi', 'rights_balancing', 'narrow_exemptions', 'legal_basis'])
add('foi_access_obligations_gen_009', 'Which practice best supports documented procedure in FOI access work?', 0,
    'Complete records under the approved procedure.', BAD_DOC,
    'Documented procedure depends on following the approved process and keeping complete records of the steps taken.',
    ['foi', 'documented_procedure', 'approved_process', 'complete_records'])
add('foi_access_obligations_gen_011', 'Which action best demonstrates public accountability in FOI access work?', 0,
    'Traceable decisions with recorded reasons.', BAD_ACC,
    'Public accountability depends on decisions that can be traced to recorded reasons and supporting evidence.',
    ['foi', 'public_accountability', 'traceable_decisions', 'recorded_reasons'])
add('foi_access_obligations_gen_013', 'Which practice best supports risk control in FOI access work?', 0,
    'Documented mitigation for identified risks.', BAD_CTRL,
    'Risk control is stronger when identified risks are matched with documented mitigation and follow-up action.',
    ['foi', 'risk_control', 'documented_mitigation', 'follow_up'])
add('foi_access_obligations_gen_015', 'Which practice best sustains operational discipline in FOI access work?', 0,
    'Approved workflow checks before closure.', BAD_WORKFLOW,
    'Operational discipline depends on completing approved workflow checks before a matter is closed or advanced.',
    ['foi', 'operational_discipline', 'workflow_checks', 'case_closure'])
add('foi_access_obligations_gen_017', 'Which practice best supports record management in FOI access work?', 0,
    'Current files with status updates at each control point.', BAD_FILE,
    'Record management depends on keeping files current and updating status at each control point so the matter remains reviewable.',
    ['foi', 'record_management', 'current_files', 'status_updates'])
add('foi_access_obligations_gen_023', 'Which practice best supports legal compliance in FOI access work?', 0,
    'Legal-authority checks with a documented decision basis.', BAD_AUTH,
    'Legal compliance is stronger when statutory authority is checked before action and the basis for the decision is documented clearly.',
    ['foi', 'legal_compliance', 'statutory_authority', 'decision_basis'])
add_many([
    ('foi_access_obligations_gen_026', 1, 'When an FOI unit faces competing priorities, which action best preserves compliance and service quality?'),
    ('foi_access_obligations_gen_028', 3, 'When a supervisor reviews gaps in FOI access work, which option best strengthens control and consistency?'),
],
'Action kept within statutory authority and constitutional safeguards.', BAD_LAW,
'FOI work remains legally defensible when action stays within statutory authority and constitutional safeguards even under pressure.',
['foi', 'legal_defensibility', 'statutory_authority', 'constitutional_safeguards'])

# FOI factual tail
add('FOI_AO_036', 'When may an applicant waive the right to challenge a denial of access in court?', 2,
    'That right is not waived merely because access was denied.',
    ['When the applicant receives partial disclosure.', 'When the applicant fails to pay a fee.', 'When the requested record is classified as secret.'],
    'A denial of access does not itself amount to a waiver of the applicant\'s right to challenge the denial in court.',
    ['foi', 'court_challenge', 'waiver', 'denial_of_access'])
add('FOI_AO_042', 'What must a state government do if it wants the FOI Act to apply to its institutions?', 1,
    'Domesticate the Act through its House of Assembly.',
    ['Treat the Act as automatically applicable at once.', 'Wait for extension by federal circular.', 'Rely on the Federal Character Principle.'],
    'A state that wants the FOI regime to apply to its own institutions must domesticate the Act through its legislature.',
    ['foi', 'state_government', 'domestication', 'house_of_assembly'])
add('FOI_AO_043', 'What does proactive disclosure under section 2 of the FOI Act require?', 1,
    'Publication of specified information without waiting for a request.',
    ['Publication only after a court order.', 'Publication only to foreign applicants.', 'Publication only on the anniversary of the Act.'],
    'Proactive disclosure requires public institutions to publish specified information without waiting for a formal request.',
    ['foi', 'proactive_disclosure', 'section_2', 'publication'])
add('FOI_AO_047', 'What follows if a public institution exceeds the statutory response time without notifying the applicant of an extension?', 1,
    'The request is deemed denied, enabling a court challenge.',
    ['The responsible officer is commended.', 'The fee is doubled automatically.', 'The applicant must file the request again.'],
    'If the statutory response time passes without a valid extension notice, the request is treated as denied and the applicant may go to court.',
    ['foi', 'response_deadline', 'deemed_denial', 'court_challenge'])
add('FOI_AO_053', 'When should invigilators\' and examiners\' fees be processed for payment?', 2,
    'As soon as the claim is submitted and approved.',
    ['Immediately after the examination only.', 'Before the examination begins.', 'Only after the results are released.'],
    'Processing and payment should follow submission and approval of the claim rather than the mere timing of the examination itself.',
    ['fees', 'invigilators', 'examiners', 'claim_approval'])
add('FOI_AO_058', 'Why are official documents classified?', 2,
    'To show the degree of care and protection each document requires.',
    ['To make them hard to access in every case.', 'To prevent the public from ever seeing them.', 'To hide them from other ministries.'],
    'Classification indicates the level of care and protection required for a document, not simply a blanket rule of concealment.',
    ['official_documents', 'classification', 'protection_level', 'document_control'])
add('FOI_AO_061', 'At what point should the disbursement of invigilators\' and examiners\' fees be processed and paid?', 1,
    'As soon as the claim is submitted and approved.',
    ['Immediately after the examination.', 'Before the examination.', 'After the examination results are released.'],
    'Disbursement should be processed once the claim has been submitted and approved, because that is the point at which payment becomes properly regularized.',
    ['fees', 'invigilators', 'examiners', 'claim_submission'])
add('FOI_AO_071', 'Which practice best balances access rights and legal exemptions under the FOI Act?', 3,
    'Apply exemptions narrowly and justify each restriction with a legal basis.',
    ['Convenience ahead of legal requirements.', 'Bypass review controls to save time.', 'Inconsistent treatment of similar requests.'],
    'Access rights and exemptions are balanced properly when exemptions are interpreted narrowly and each restriction is supported by a recorded legal basis.',
    ['foi', 'rights_balancing', 'narrow_exemptions', 'legal_basis'])


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
print(f'Applied round 106 rewrites to {updated} questions')
