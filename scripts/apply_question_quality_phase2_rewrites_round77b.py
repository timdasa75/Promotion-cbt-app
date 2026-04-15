import json
from pathlib import Path

path = Path('data/psr_rules.json')
data = json.loads(path.read_text(encoding='utf-8'))
for sub in data['subcategories']:
    if sub.get('id') != 'psr_retirement':
        continue
    for q in sub.get('questions', []):
        if q.get('id') == 'psr_retirement_gen_023':
            q['question'] = 'Which practice best supports disciplinary review in separation, retirement, and pension administration?'
            q['explanation'] = 'Disciplinary review in retirement administration should be handled through due process, fair hearing, and documented decisions so the review outcome remains defensible.'
            q['keywords'] = ['psr_retirement', 'disciplinary_review', 'fair_hearing', 'documented_decisions']
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Updated psr_retirement_gen_023')
