import json
from pathlib import Path

path = Path('data/financial_regulations.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'fin_bgt_046': {
        'question': 'Which budgetary authorization sets the maximum amount an MDA may legally spend within a fiscal year for a defined purpose?'
    },
    'fin_pro_071': {
        'question': 'Which of the following officers is not listed as a Sub-Accounting Officer under Financial Regulation 115(ii)?'
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
print(f'Applied {changed} financial regulations follow-up definition-alignment rewrites.')
