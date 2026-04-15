#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data' / 'civil_service_ethics.json'
UPDATES = {
    'csh_sdg_012': {
        'question': 'Which result best shows efficiency in day-to-day public service delivery?',
        'explanation': 'Efficiency in day-to-day service delivery is shown when routine services meet public needs effectively and still deliver value for the resources used.',
        'keywords': ['efficiency', 'day_to_day_service_delivery', 'public_needs', 'value_for_money']
    }
}
payload = json.loads(TARGET.read_text(encoding='utf-8'))
updated = 0
for sub in payload.get('subcategories', []):
    if sub.get('id') != 'csh_service_delivery_grievance':
        continue
    for q in sub.get('questions', []):
        patch = UPDATES.get(q.get('id'))
        if patch:
            q.update(patch)
            updated += 1
TARGET.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Applied round 100B rewrites to {updated} questions')
