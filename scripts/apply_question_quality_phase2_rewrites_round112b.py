#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

TARGET = Path('data/civil_service_ethics.json')

data = json.loads(TARGET.read_text(encoding='utf-8'))
updated = False
for sub in data.get('subcategories', []):
    if sub.get('id') != 'csh_discipline_conduct':
        continue
    for q in sub.get('questions', []):
        if q.get('id') == 'csh_disc_058':
            q['question'] = 'What ethical risk arises when a civil servant accepts gifts from contractors or business people?'
            q['explanation'] = 'Accepting gifts from contractors or business people creates an ethical risk because it can compromise a civil servant\'s integrity and undermine confidence in official impartiality.'
            q['keywords'] = ['gifts', 'contractors', 'ethical_risk', 'official_impartiality']
            updated = True
            break
    break

if not updated:
    raise RuntimeError('Missing csh_disc_058')

TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('Applied round 112B duplicate cleanup.')
