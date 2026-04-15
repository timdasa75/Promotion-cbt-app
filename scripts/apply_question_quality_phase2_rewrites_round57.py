import json
from pathlib import Path

path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'neg_principles_outcomes_gen_072': {
        'question': 'Which practice best reflects sound risk management in negotiation work?',
        'explanation': 'Sound risk management in negotiation work requires identifying control gaps early and escalating material exceptions promptly. That approach helps prevent procedural drift and keeps the negotiation process defensible under later review.',
        'keywords': ['negotiation_risk_management', 'control_gaps', 'escalation', 'public_service_negotiation']
    },
    'neg_principles_outcomes_gen_073': {
        'question': 'Which records-management practice best supports negotiation work?',
        'options': [
            'Bypass review and approval controls to save time.',
            'Prioritize convenience over policy and legal requirements.',
            'Keep accurate files and update status at each control point.',
            'Apply rules inconsistently based on personal preference.'
        ],
        'explanation': 'Negotiation work is better protected when files are kept accurately and status is updated at each control point. Good records help preserve institutional memory, auditability, and continuity after the negotiation ends.',
        'keywords': ['negotiation_records', 'accurate_files', 'status_updates', 'control_points']
    },
    'neg_principles_outcomes_gen_078': {
        'question': 'Which action most directly strengthens public accountability in negotiation work?',
        'explanation': 'Public accountability in negotiation work is strengthened by providing traceable decisions and evidence-based justification. That makes it easier to review both the process and the commitments that emerge from negotiation.',
        'keywords': ['negotiation_accountability', 'traceable_decisions', 'evidence_based_justification', 'public_service']
    },
    'neg_principles_outcomes_gen_082': {
        'question': 'When compliance gaps are found in negotiation work, which action best strengthens risk management while preserving the audit trail?',
        'explanation': 'Risk management is strengthened when control gaps are identified early and material exceptions are escalated promptly. That response both addresses the weakness and preserves the record needed for audit and oversight.',
        'keywords': ['negotiation_compliance', 'risk_management', 'audit_trail', 'exception_escalation']
    },
    'neg_principles_outcomes_gen_086': {
        'question': 'When a negotiation case requires formal handling, what should be done first?',
        'explanation': 'The first step is to follow documented procedure and keep complete records. That protects fairness, preserves the integrity of the process, and makes the later outcome easier to review and defend.',
        'keywords': ['negotiation_case', 'documented_procedure', 'complete_records', 'formal_handling']
    },
    'neg_principles_outcomes_gen_087': {
        'question': 'Which approach best supports change management in negotiation work?',
        'explanation': 'Change management in negotiation work is best supported by sequencing reforms with communication, training, and monitoring. That combination helps changes take hold without losing clarity, buy-in, or oversight.',
        'keywords': ['negotiation_change_management', 'communication', 'training', 'monitoring']
    },
    'neg_structure_bodies_gen_066': {
        'question': 'When a negotiating body must manage change without breaking procedure, what should be done first?',
        'explanation': 'The first step is to sequence reforms with communication, training, and monitoring. That approach supports orderly change while preserving compliance and avoiding improvised shortcuts.',
        'keywords': ['negotiating_bodies', 'change_management', 'procedural_compliance', 'sequenced_reform']
    },
    'neg_structure_bodies_gen_068': {
        'question': 'Which practice best reflects sound risk control in negotiating structures and bodies?',
        'explanation': 'Sound risk control means identifying risks early, applying the necessary controls, and documenting mitigation. In negotiating structures, that helps the body stay orderly and accountable while decisions are being worked through.',
        'keywords': ['negotiating_structures', 'risk_control', 'documented_mitigation', 'governance']
    },
    'neg_structure_bodies_gen_074': {
        'question': 'In a time-sensitive file on negotiating structures, which step best preserves operational discipline?',
        'explanation': 'Operational discipline is preserved by following approved workflows and verifying outputs before closure. That keeps the process orderly even when time pressure is high and the file is moving quickly.',
        'keywords': ['negotiating_structures', 'operational_discipline', 'approved_workflows', 'verification']
    },
    'neg_structure_bodies_gen_076': {
        'question': 'Which approach best supports change management in negotiating structures and bodies?',
        'explanation': 'Change management in negotiating structures is best supported by sequencing reforms with communication, training, and monitoring. That helps the body adjust without losing role clarity, continuity, or accountability.',
        'keywords': ['negotiating_structures', 'change_management', 'communication', 'monitoring']
    },
    'neg_structure_bodies_gen_077': {
        'question': 'Which practice best reflects operational discipline in negotiating structures and bodies?',
        'explanation': 'Operational discipline is reflected in following approved workflows and verifying outputs before closure. That standard helps keep the body\'s work both orderly and reviewable.',
        'keywords': ['negotiating_structures', 'operational_discipline', 'workflow_control', 'reviewable_outputs']
    },
    'neg_structure_bodies_gen_082': {
        'question': 'Which practice should an accountable officer prioritize to sustain change management in negotiating structures and bodies?',
        'explanation': 'An accountable officer should prioritize sequencing reforms with communication, training, and monitoring. That makes change easier to absorb while preserving institutional discipline and oversight.',
        'keywords': ['accountable_officer', 'negotiating_structures', 'change_management', 'institutional_oversight']
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
print(f'Applied {changed} weak-framing rewrites in leadership round 57.')
