import json
from pathlib import Path

path = Path('data/civil_service_ethics.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'csh_principle_064': {
        'question': 'What should a civil servant do after detecting financial abuse in the public service?',
        'options': [
            'Report it through the correct official channel.',
            'Ignore it because it is not a personal duty.',
            'Wait for a superior officer to discover it first.',
            'Report it informally to a friend or colleague.'
        ],
        'explanation': 'A civil servant who detects financial abuse should report it through the correct official channel. Proper reporting helps discourage abuse while ensuring that the matter is handled through accountable institutional procedures.',
        'keywords': ['financial_abuse', 'official_reporting_channel', 'civil_service_ethics', 'public_accountability']
    },
    'csh_duty_058': {
        'question': 'What is a key duty of the Chief Executive of a Parastatal to the Board?',
        'options': [
            'To report only to the Minister.',
            'To refuse to implement decisions that are not to his liking.',
            "To manage the Board's personal affairs.",
            'To implement the decisions and policies of the Board.'
        ],
        'explanation': 'A key duty of the Chief Executive is to implement the decisions and policies of the Board. The role links the Board\'s direction to actual execution in the organization rather than personal preference or private service to Board members.',
        'keywords': ['parastatal_chief_executive', 'board_decisions', 'board_policies', 'institutional_duties']
    },
    'csh_pt_055': {
        'question': 'Why is reasonable spacing used in typed drafts?',
        'options': [
            'To leave enough space for amendments.',
            'To make the draft look more professional only.',
            'To make the draft longer.',
            'To save paper.'
        ],
        'explanation': 'Reasonable spacing is used in typed drafts so that there is enough room for amendments and corrections. The practice supports orderly review and revision during official drafting.',
        'keywords': ['typed_drafts', 'reasonable_spacing', 'draft_amendments', 'official_writing']
    },
    'csh_ap_079': {
        'question': 'When a negotiation-related file is time-sensitive, what step best preserves both due procedure and an auditable record of the agreed outcome?',
        'options': [
            'Bypass review and approval controls to save time.',
            'Ignore feedback and continue non-compliant procedures.',
            'Apply rules inconsistently based on personal preference.',
            'Use principled negotiation and document agreed commitments.'
        ],
        'explanation': 'In a time-sensitive negotiation file, the safest way to preserve both procedure and auditability is to use principled negotiation and document the commitments that were agreed. That keeps the process accountable without sacrificing an accurate administrative record.',
        'keywords': ['negotiation_file', 'principled_negotiation', 'documented_commitments', 'audit_trail']
    },
    'eth_anti_corruption_gen_068': {
        'question': 'Which document-management practice best supports effective anti-corruption controls?',
        'options': [
            'Apply rules inconsistently based on personal preference.',
            'Bypass review and approval controls to save time.',
            'Maintain accurate files and update status at each control point.',
            'Prioritize convenience over policy and legal requirements.'
        ],
        'explanation': 'Effective anti-corruption controls depend on accurate files and clear status updates at each control point. Good records make decisions traceable and reduce the space for concealment, manipulation, or unauthorized shortcuts.',
        'keywords': ['anti_corruption_controls', 'document_management', 'accurate_files', 'control_points']
    },
    'eth_anti_corruption_gen_070': {
        'question': 'When a supervisor reviews compliance gaps, which action most directly strengthens public accountability?',
        'options': [
            'Bypass review and approval controls to save time.',
            'Provide traceable decisions and evidence-based justification.',
            'Ignore feedback and continue non-compliant procedures.',
            'Prioritize convenience over policy and legal requirements.'
        ],
        'explanation': 'Public accountability is strengthened when decisions are traceable and supported by evidence-based justification. That approach makes review possible and helps show that compliance action is grounded in documented reasons rather than convenience or personal discretion.',
        'keywords': ['public_accountability', 'traceable_decisions', 'evidence_based_justification', 'compliance_review']
    },
    'eth_anti_corruption_gen_072': {
        'question': 'Which approach best promotes discipline and conduct under anti-corruption controls?',
        'options': [
            'Ignore feedback and continue non-compliant procedures.',
            'Apply rules inconsistently based on personal preference.',
            'Address misconduct consistently under approved policy.',
            'Bypass review and approval controls to save time.'
        ],
        'explanation': 'Discipline and conduct are best protected when misconduct is addressed consistently under approved policy. Consistency prevents selective enforcement and reinforces the fairness needed for credible anti-corruption enforcement.',
        'keywords': ['anti_corruption_discipline', 'misconduct_response', 'approved_policy', 'consistent_enforcement']
    },
    'eth_anti_corruption_gen_075': {
        'question': 'Which action best demonstrates public accountability in anti-corruption work?',
        'options': [
            'Prioritize convenience over policy and legal requirements.',
            'Provide traceable decisions and evidence-based justification.',
            'Ignore feedback and continue non-compliant procedures.',
            'Bypass review and approval controls to save time.'
        ],
        'explanation': 'Public accountability is demonstrated when actions are supported by traceable decisions and evidence-based justification. That makes it possible to review how and why a decision was reached under anti-corruption standards.',
        'keywords': ['anti_corruption_accountability', 'traceable_decisions', 'evidence_based_review', 'public_service_integrity']
    },
    'eth_anti_corruption_gen_084': {
        'question': 'In an anti-corruption case file, which step best preserves grievance handling without breaking workflow or losing the audit trail?',
        'options': [
            'Bypass review and approval controls to save time.',
            'Ignore feedback and continue non-compliant procedures.',
            'Resolve complaints using fair, timely, and documented procedures.',
            'Apply rules inconsistently based on personal preference.'
        ],
        'explanation': 'A grievance process remains defensible when complaints are handled through fair, timely, and documented procedures. That protects workflow discipline while preserving the record needed for oversight and later review.',
        'keywords': ['grievance_handling', 'anti_corruption_case_file', 'documented_procedures', 'audit_trail']
    },
    'eth_anti_corruption_gen_088': {
        'question': 'Which practice should an accountable officer prioritize to sustain discipline and conduct in anti-corruption work?',
        'options': [
            'Bypass review and approval controls to save time.',
            'Apply rules inconsistently based on personal preference.',
            'Address misconduct consistently under approved policy.',
            'Prioritize convenience over policy and legal requirements.'
        ],
        'explanation': 'An accountable officer sustains discipline and conduct by addressing misconduct consistently under approved policy. That response shows that controls are enforced through recognized standards rather than expedient or arbitrary choices.',
        'keywords': ['accountable_officer', 'anti_corruption_practice', 'discipline_and_conduct', 'approved_policy']
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
print(f'Applied {changed} weak-framing rewrites in civil-service-admin round 51.')
