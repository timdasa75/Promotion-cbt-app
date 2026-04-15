import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'circ_leave_welfare_allowances_gen_023': {
        'question': 'Which practice best supports disciplinary review in leave, welfare, and allowance administration?',
        'explanation': 'Disciplinary review in leave, welfare, and allowance administration should be handled through due process, fair hearing, and documented decisions so the review outcome remains defensible.',
        'keywords': ['leave_welfare_allowances', 'disciplinary_review', 'fair_hearing', 'documented_decisions']
    },
    'circ_leave_welfare_allowances_gen_027': {
        'question': 'Which practice best supports document traceability in leave, welfare, and allowance administration?',
        'explanation': 'Document traceability in leave, welfare, and allowance administration requires complete records and adherence to the documented process so each action can be followed on the file.',
        'keywords': ['leave_welfare_allowances', 'document_traceability', 'complete_records', 'documented_process']
    },
    'circ_leave_welfare_allowances_gen_028': {
        'question': 'Which practice best supports compliance monitoring in leave, welfare, and allowance administration?',
        'explanation': 'Compliance monitoring is strengthened by consistent application of approved rules and escalation of exceptions that reveal breakdowns in control.',
        'keywords': ['leave_welfare_allowances', 'compliance_monitoring', 'approved_rules', 'control_breakdowns']
    },
    'circ_leave_welfare_allowances_gen_029': {
        'question': 'Which practice best supports accountability review in leave, welfare, and allowance administration?',
        'explanation': 'Accountability review in leave, welfare, and allowance administration depends on traceable decisions and evidence-based justification that can withstand later scrutiny.',
        'keywords': ['leave_welfare_allowances', 'accountability_review', 'traceable_decisions', 'evidence_based_justification']
    },
    'circ_leave_welfare_allowances_gen_032': {
        'question': 'Which practice best supports decision communication in leave, welfare, and allowance administration?',
        'explanation': 'Decision communication in leave, welfare, and allowance administration requires clear criteria and prompt communication so affected officers understand both the decision and its basis.',
        'keywords': ['leave_welfare_allowances', 'decision_communication', 'clear_criteria', 'prompt_communication']
    },
    'circ_leave_welfare_allowances_gen_033': {
        'question': 'Which practice best supports workflow discipline in leave, welfare, and allowance administration?',
        'explanation': 'Workflow discipline in leave, welfare, and allowance administration is supported by approved workflows and verification of outputs before closure.',
        'keywords': ['leave_welfare_allowances', 'workflow_discipline', 'approved_workflows', 'verified_outputs']
    },
}
for sub in data['subcategories']:
    if sub.get('id') != 'circ_leave_welfare_allowances':
        continue
    for q in sub.get('questions', []):
        if q.get('id') in updates:
            patch = updates[q['id']]
            q['question'] = patch['question']
            q['explanation'] = patch['explanation']
            q['keywords'] = patch['keywords']
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Updated 6 questions')
for qid in updates:
    print(qid)
