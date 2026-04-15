#!/usr/bin/env python3
import json
from pathlib import Path

path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))

for sub in data.get('subcategories', []):
    for q in sub.get('questions', []):
        if q.get('id') == 'leadership_mpf_073':
            q['question'] = 'Which practice best preserves stakeholder trust in management and performance work?'
            q['explanation'] = 'Stakeholder trust is preserved when engagement is principled and the commitments reached are documented clearly.'
            q['keywords'] = ['management_performance', 'stakeholder_trust', 'documented_commitments', 'principled_engagement']

path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied round 104B duplicate cleanup.')
