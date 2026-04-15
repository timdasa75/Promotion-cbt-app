import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'eth_misconduct_gen_084': {
        'question': 'Which action best demonstrates risk control in misconduct and discipline management?',
        'explanation': 'Risk control in misconduct and discipline management is demonstrated by identifying the risk early, applying the necessary controls, and documenting the mitigation steps taken. That approach keeps the response reviewable and reduces the chance of unmanaged procedural failure.',
        'keywords': ['misconduct_and_discipline', 'risk_control', 'early_identification', 'documented_mitigation']
    },
    'eth_misconduct_gen_088': {
        'question': 'When handling a misconduct and discipline case, what should be done first to preserve records for audit and oversight?',
        'options': [
            'Apply rules inconsistently based on personal preference.',
            'Maintain accurate files and update status at each control point.',
            'Prioritize convenience over policy and legal requirements.',
            'Bypass review and approval controls to save time.'
        ],
        'explanation': 'The first priority is to maintain accurate files and update status at each control point. Good records management preserves the audit trail and helps supervisors review how the misconduct case was handled at every stage.',
        'keywords': ['misconduct_case', 'records_management', 'audit_trail', 'control_points']
    },
    'eth_misconduct_gen_090': {
        'question': 'Which practice best supports accountability and risk control in misconduct and discipline cases?',
        'explanation': 'Accountability and risk control are best supported when risks are identified early, controls are applied, and the mitigating steps are documented. That makes the handling of the case easier to review and defend later.',
        'keywords': ['misconduct_and_discipline', 'accountability', 'risk_control', 'documented_controls']
    },
    'eth_misconduct_gen_093': {
        'question': 'In a time-sensitive misconduct and discipline file, which step best preserves grievance handling without breaking procedure?',
        'explanation': 'Grievance handling is preserved when complaints are resolved through fair, timely, and documented procedures. That keeps the process within proper bounds while also preserving the record required for oversight and later review.',
        'keywords': ['misconduct_file', 'grievance_handling', 'documented_procedures', 'procedural_fairness']
    },
    'ethics_100': {
        'question': 'What is a key accountability of the Chief Executive of a Parastatal to the Board?',
        'options': [
            'To report only to the Minister.',
            'To refuse to implement decisions that are not to his liking.',
            'To implement the decisions and policies of the Board.',
            "To manage the Board's personal affairs."
        ],
        'explanation': 'A key accountability of the Chief Executive is to implement the decisions and policies of the Board. The position exists to carry the Board\'s approved direction into execution, not to substitute personal preference for Board authority.',
        'keywords': ['parastatal_board', 'chief_executive_accountability', 'board_policies', 'institutional_governance']
    },
    'csh_ap_069': {
        'question': 'The Due Process policy was introduced to provide transparency and accountability in which areas of government activity?',
        'options': [
            'Judicial processes and legal frameworks.',
            'Taxation and revenue generation.',
            'Public procurement, government budgeting, and financial operations.',
            'International relations and foreign policy.'
        ],
        'explanation': 'The Due Process policy was introduced as an anti-corruption mechanism to provide transparency and accountability in public procurement, government budgeting, and financial operations. The question therefore tests the main areas targeted by the policy.',
        'keywords': ['due_process_policy', 'transparency', 'public_procurement', 'financial_operations']
    },
    'csh_ap_070': {
        'question': 'What is one personnel-related duty of the Board of a Parastatal?',
        'options': [
            'To be the sole disciplinary body for all staff.',
            'To manage payroll and salaries directly.',
            'To handle the day-to-day recruitment of junior staff.',
            'To approve the appointment and promotion of staff.'
        ],
        'explanation': 'One personnel-related duty of the Board is to approve the appointment and promotion of staff. That function reflects the Board\'s policy and oversight role rather than direct involvement in every daily administrative task.',
        'keywords': ['parastatal_board', 'staff_appointment', 'staff_promotion', 'personnel_oversight']
    },
    'csh_ap_085': {
        'question': 'What does a minute on a file often begin with?',
        'options': ['A personal story.', 'A brief statement of the matter at issue.', 'The date only.', 'A conclusion.'],
        'explanation': 'A minute on a file often begins with a brief statement of the matter at issue. That opening helps the reader understand the subject before recommendations or further details are added.',
        'keywords': ['file_minute', 'matter_at_issue', 'official_minutes', 'administrative_writing']
    },
    'csh_ap_105': {
        'question': 'What is the purpose of a handing-over note?',
        'explanation': 'A handing-over note records the projects, files, responsibilities, and other matters that an outgoing officer passes to a successor. Its purpose is to preserve continuity and help the incoming officer understand the work being taken over.',
        'keywords': ['handing_over_note', 'succession', 'continuity_of_work', 'administrative_transition']
    },
    'csh_disc_055': {
        'question': 'Is a member of an Examination Board automatically entitled to invigilator or examiner fees?',
        'explanation': 'No. A member of an Examination Board is not automatically entitled to invigilator or examiner fees unless the person actually performs the duties of invigilation or examining. The item therefore distinguishes Board membership from paid examination work.',
        'keywords': ['examination_board', 'invigilator_fees', 'examiner_fees', 'eligibility_rules']
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
print(f'Applied {changed} weak-framing rewrites in civil-service-admin round 53.')
