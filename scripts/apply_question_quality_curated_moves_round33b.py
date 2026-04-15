#!/usr/bin/env python3
import json
from pathlib import Path

lead_path = Path('data/leadership_negotiation.json')
lead = json.loads(lead_path.read_text(encoding='utf-8'))
removed = False
for sub in lead.get('subcategories', []):
    if sub.get('id') != 'lead_strategic_management':
        continue
    kept = []
    for q in sub.get('questions', []):
        if q.get('id') == 'leadership_smp_048':
            removed = True
            continue
        kept.append(q)
    sub['questions'] = kept
    break
if not removed:
    raise RuntimeError('leadership_smp_048 not found in lead_strategic_management')
lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Removed leadership_smp_048 from leadership_negotiation.json')
