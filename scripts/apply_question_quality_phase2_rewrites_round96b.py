import json
from pathlib import Path
path = Path('data/leadership_negotiation.json')
data = json.loads(path.read_text(encoding='utf-8'))
updates = {
    'neg_principles_outcomes_gen_019': {
        'question': 'Which practice best reflects governance standards in negotiation administration?',
        'explanation': 'Governance standards in negotiation administration are reflected by following the approved procedure and sustaining the records needed for review and institutional accountability.',
        'keywords': ['negotiation', 'governance_standards', 'negotiation_administration', 'sustained_records'],
    },
    'neg_principles_outcomes_gen_027': {
        'question': 'Which practice best secures procedural documentation in negotiation work?',
        'explanation': 'Procedural documentation in negotiation work is secured when the approved process is followed and each step is supported by complete records.',
        'keywords': ['negotiation', 'procedural_documentation', 'approved_process', 'complete_records'],
    },
}
changed = 0
for sub in data.get('subcategories', []):
    if sub.get('id') != 'neg_principles_outcomes':
        continue
    for q in sub.get('questions', []):
        update = updates.get(q.get('id'))
        if not update:
            continue
        q.update(update)
        changed += 1
        
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 96B duplicate cleanup to {changed} questions')
