import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
for sub in data['subcategories']:
    if sub.get('id') != 'psr_retirement':
        continue
    for q in sub.get('questions', []):
        if q.get('id') == 'psr_retirement_gen_010':
            q['question'] = 'Which practice best supports compliance monitoring in separation, retirement, and pension administration?'
            q['explanation'] = 'Compliance monitoring in retirement administration depends on consistent application of approved rules together with prompt escalation of exceptions that indicate breakdowns in control.'
            q['keywords'] = ['psr_retirement', 'compliance_monitoring', 'approved_rules', 'control_breakdowns']
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Updated psr_retirement_gen_010')
