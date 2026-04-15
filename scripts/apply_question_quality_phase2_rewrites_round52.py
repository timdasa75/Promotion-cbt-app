import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'eth_code_conduct_gen_073': {
        'question': 'In a code-of-conduct case file, which step best preserves grievance handling while keeping an auditable record?',
        'explanation': 'Grievance handling is best preserved when complaints are resolved through fair, timely, and documented procedures. That approach protects due process while leaving a record that can be reviewed for accountability and oversight.',
        'keywords': ['code_of_conduct', 'grievance_handling', 'documented_procedures', 'audit_record']
    },
    'eth_code_conduct_gen_077': {
        'question': 'Which practice best reflects proper documented procedure under the Code of Conduct?',
        'explanation': 'Proper documented procedure means following the approved process and keeping complete records of the steps taken. That standard protects both fairness and later accountability in code-of-conduct matters.',
        'keywords': ['code_of_conduct', 'documented_procedure', 'complete_records', 'ethical_compliance']
    },
    'eth_conflict_interest_gen_072': {
        'question': 'Which practice best supports risk control in conflict-of-interest management?',
        'explanation': 'Conflict-of-interest risk is best controlled when the risk is identified early, appropriate controls are applied, and the mitigation steps are documented. That sequence makes the response reviewable and reduces the chance of unmanaged bias or influence.',
        'keywords': ['conflict_of_interest', 'risk_control', 'early_identification', 'documented_mitigation']
    },
    'eth_conflict_interest_gen_074': {
        'question': 'Which practice should an officer prioritize to sustain discipline and conduct in conflict-of-interest cases?',
        'explanation': 'Discipline and conduct are sustained when misconduct is addressed consistently under approved policy. Consistent treatment helps prevent selective enforcement and reinforces confidence in the integrity of conflict-of-interest controls.',
        'keywords': ['conflict_of_interest', 'discipline_and_conduct', 'approved_policy', 'consistent_response']
    },
    'eth_conflict_interest_gen_084': {
        'question': 'When handling a conflict-of-interest case, what should be done first to preserve records for audit and oversight?',
        'options': [
            'Apply rules inconsistently based on personal preference.',
            'Bypass review and approval controls to save time.',
            'Maintain accurate files and update status at each control point.',
            'Prioritize convenience over policy and legal requirements.'
        ],
        'explanation': 'The first priority is to maintain accurate files and update status at each control point. Sound records management helps preserve the audit trail and supports any later review of how the conflict-of-interest case was handled.',
        'keywords': ['conflict_of_interest', 'records_management', 'audit_trail', 'control_points']
    },
    'eth_conflict_interest_gen_087': {
        'question': 'Which action best demonstrates public accountability in conflict-of-interest management?',
        'explanation': 'Public accountability is demonstrated when decisions are traceable and justified with evidence. In conflict-of-interest management, that makes it possible to review whether the decision was fair, disclosed properly, and made under the right controls.',
        'keywords': ['conflict_of_interest', 'public_accountability', 'traceable_decisions', 'evidence_based_justification']
    },
    'eth_conflict_interest_gen_095': {
        'question': 'In a time-sensitive conflict-of-interest file, which step best preserves operational discipline within approved timelines?',
        'explanation': 'Operational discipline is preserved when the approved workflow is followed and outputs are verified before closure. That keeps the file moving within the required timeline without sacrificing governance standards or review integrity.',
        'keywords': ['conflict_of_interest', 'operational_discipline', 'approved_workflow', 'verification_before_closure']
    },
    'eth_conflict_interest_gen_096': {
        'question': 'Which practice best aligns with sound conflict-of-interest risk management in the public service?',
        'explanation': 'Sound conflict-of-interest risk management requires identifying control gaps early and escalating material exceptions promptly. Early escalation helps prevent unmanaged risks from hardening into integrity failures or contested decisions.',
        'keywords': ['conflict_of_interest', 'risk_management', 'control_gaps', 'escalation']
    },
    'eth_misconduct_gen_070': {
        'question': 'When a misconduct case requires formal handling, what should be done first to keep the process defensible?',
        'explanation': 'The process remains defensible when the approved documented procedure is followed and complete records are kept from the start. That helps show that misconduct handling was consistent, reviewable, and based on proper procedure.',
        'keywords': ['misconduct_case', 'documented_procedure', 'complete_records', 'defensible_process']
    },
    'eth_misconduct_gen_072': {
        'question': 'Which document-management practice should an officer prioritize in misconduct and discipline cases?',
        'options': [
            'Keep accurate files and update status at each control point.',
            'Prioritize convenience over policy and legal requirements.',
            'Bypass review and approval controls to save time.',
            'Ignore feedback and continue non-compliant procedures.'
        ],
        'explanation': 'Misconduct and discipline cases require accurate files and updated status records at each control point. That recordkeeping supports fairness, preserves the audit trail, and helps decision-makers see the current state of the case.',
        'keywords': ['misconduct_and_discipline', 'document_management', 'accurate_files', 'case_tracking']
    }
}
changed = 0
for subcategory in data.get('subcategories', []):
    for question in subcategory.get('questions', []):
        update = updates.get(question.get('id'))
        if not update:
            continue
        question.update(update)
        changed += 1
expected = len(updates)
if changed != expected:
    raise RuntimeError(f'Expected {expected} updates, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} weak-framing rewrites in civil-service-admin round 52.')
