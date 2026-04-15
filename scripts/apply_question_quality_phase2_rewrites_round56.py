import json
from pathlib import Path

path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'leadership_mpf_054': {
        'question': 'Which approach best supports effective change management in performance-focused public-service work?',
        'explanation': 'Effective change management is supported by sequencing reforms with communication, training, and monitoring. That approach helps staff understand the change, build the needed capability, and track whether implementation is actually working.',
        'keywords': ['change_management', 'communication', 'training', 'performance_monitoring']
    },
    'leadership_mpf_067': {
        'question': 'Under the PSR, when may an officer on an incremental grade level be denied the normal increment?',
        'explanation': 'Under the Public Service Rules, an officer on an incremental grade level should normally receive the increment unless the officer is under interdiction, suspension, or has a disciplinary action pending. The item therefore tests one of the conditions that can interrupt the normal increment.',
        'keywords': ['psr_increment', 'incremental_grade_level', 'disciplinary_action_pending', 'public_service_rules']
    },
    'leadership_mpf_069': {
        'question': 'When a management and performance case requires formal governance handling, what should be done first?',
        'explanation': 'The first step is to apply the approved management-and-performance procedures and keep complete records. That preserves fairness, legal defensibility, and an auditable trail of how the case was handled.',
        'keywords': ['management_governance', 'approved_procedures', 'complete_records', 'fairness_and_compliance']
    },
    'leadership_mpf_071': {
        'question': 'Which practice best reflects sound risk control in management and performance work?',
        'explanation': 'Sound risk control means identifying risks early, applying the necessary controls, and documenting the mitigation steps taken. That approach makes the management process reviewable and reduces the chance of preventable failure.',
        'keywords': ['risk_control', 'management_performance', 'early_identification', 'documented_mitigation']
    },
    'leadership_mpf_073': {
        'question': 'Which practice best reflects good stakeholder negotiation in management and performance work?',
        'explanation': 'Good stakeholder negotiation relies on principled negotiation and clear documentation of agreed commitments. That combination helps preserve trust while also leaving a record that can be checked later.',
        'keywords': ['stakeholder_negotiation', 'principled_negotiation', 'documented_commitments', 'management_performance']
    },
    'neg_dispute_law_gen_075': {
        'question': 'Which document-management practice best supports dispute resolution and labour-law work?',
        'options': [
            'Prioritize convenience over policy and legal requirements.',
            'Bypass review and approval controls to save time.',
            'Maintain accurate files and update status at each control point.',
            'Apply rules inconsistently based on personal preference.'
        ],
        'explanation': 'Dispute resolution and labour-law work depends on accurate files and status updates at each control point. Good records management preserves the case history and helps ensure that lawful procedure can be demonstrated later.',
        'keywords': ['dispute_resolution', 'labour_law', 'document_management', 'case_records']
    },
    'neg_dispute_law_gen_080': {
        'question': 'Which practice best supports operational discipline in dispute resolution and labour-law work?',
        'explanation': 'Operational discipline is best supported by following approved workflows and verifying outputs before closure. That keeps the case process orderly and reduces the risk of procedural errors or weak outcomes.',
        'keywords': ['operational_discipline', 'dispute_resolution', 'approved_workflows', 'verification']
    },
    'neg_dispute_law_gen_083': {
        'question': 'When a dispute-resolution unit faces competing priorities, which action best preserves compliance and service quality?',
        'explanation': 'Compliance and service quality are preserved when leaders set clear expectations, monitor outcomes, and correct deviations promptly. That combination keeps the unit aligned with lawful procedure while still protecting service standards.',
        'keywords': ['dispute_resolution_unit', 'competing_priorities', 'service_quality', 'leadership_accountability']
    },
    'neg_dispute_law_gen_085': {
        'question': 'When is industrial action such as a strike generally considered lawful in the Nigerian Public Service?',
        'options': [
            'When government changes leadership in the workflow.',
            'When a union wants wage review under internal standards.',
            'When all statutory dispute-resolution channels have been exhausted.',
            'When workers are dissatisfied under normal controls.'
        ],
        'explanation': 'Industrial action in the Nigerian Public Service is generally only considered lawful after all statutory dispute-resolution channels have been exhausted. The item therefore tests the legal threshold that must be met before strike action is treated as lawful.',
        'keywords': ['industrial_action', 'strike_legality', 'statutory_dispute_resolution', 'nigerian_public_service']
    },
    'neg_dispute_law_gen_088': {
        'question': 'Which practice should an accountable officer prioritize to sustain change management in dispute resolution and labour-law work?',
        'explanation': 'An accountable officer sustains change management by sequencing reforms with communication, training, and monitoring. That helps ensure that legal and procedural changes are understood, applied, and tracked as they take effect.',
        'keywords': ['change_management', 'dispute_resolution', 'labour_law', 'reform_monitoring']
    },
    'neg_dispute_law_gen_089': {
        'question': 'When a dispute-resolution and labour-law case requires documented procedure, what should be done first?',
        'explanation': 'The first step is to follow the documented procedure and keep complete records. That protects the integrity of the case and ensures that the process can be reviewed against approved standards later.',
        'keywords': ['documented_procedure', 'dispute_resolution_case', 'complete_records', 'labour_law_process']
    }
}
changed = 0
for sub in data.get('subcategories', []):
    for q in sub.get('questions', []):
        update = updates.get(q.get('id'))
        if not update:
            continue
        q.update(update)
        changed += 1
if changed != len(updates):
    raise RuntimeError(f'Expected {len(updates)} updates, applied {changed}')
path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print(f'Applied {changed} weak-framing rewrites in leadership round 56.')
