import json
from pathlib import Path
path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))
for sub in data.get('subcategories', []):
    if sub.get('id') != 'neg_dispute_law':
        continue
    for q in sub.get('questions', []):
        if q.get('id') == 'neg_dispute_law_gen_062':
            q['question'] = 'When a dispute-resolution unit faces competing priorities, which action best preserves leadership accountability and service quality?'
            q['explanation'] = 'Leadership accountability and service quality are preserved when the unit sets clear expectations, monitors outcomes, and corrects deviations promptly instead of relying on shortcuts.'
            q['keywords'] = ['dispute_resolution', 'labour_law', 'leadership_accountability', 'monitored_outcomes']
            break
    break
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied round 98B duplicate cleanup.')
